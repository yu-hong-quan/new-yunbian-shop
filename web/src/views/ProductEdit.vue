<template>
  <div class="edit-page">
    <header class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" @click="goBack">返回</button>
        <h1>{{ isEdit ? '✏️ 编辑商品' : '➕ 新增商品' }}</h1>
      </div>
    </header>
    
    <div class="container" style="padding-top: 20px;">
      <div class="card">
        <div class="input-group">
          <label>商品封面</label>
          <div class="upload-preview" @click="triggerUpload">
            <img v-if="formData.cover" :src="formData.cover" alt="预览" />
            <div v-else class="placeholder">
              <div class="placeholder-icon">📷</div>
              <span>点击上传封面图</span>
            </div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            style="display: none;" 
            @change="handleFileChange"
          />
          <input 
            v-model="formData.cover" 
            type="text" 
            placeholder="或输入图片URL"
          />
        </div>
        
        <div class="input-group">
          <label>商品名称 *</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="请输入商品名称"
          />
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="input-group">
            <label>价格 (元) *</label>
            <input 
              v-model="formData.price" 
              type="number" 
              step="0.1"
              min="0"
              placeholder="0.00"
            />
          </div>
          
          <div class="input-group">
            <label>库存 (件) *</label>
            <input 
              v-model="formData.stock" 
              type="number"
              min="0"
              placeholder="0"
            />
          </div>
        </div>
        
        <div class="input-group">
          <label>分类 *</label>
          <select v-model="formData.categoryId">
            <option value="">请选择分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
        
        <div class="input-group">
          <label>商品描述</label>
          <textarea 
            v-model="formData.description" 
            placeholder="请输入商品描述..."
          ></textarea>
        </div>
      </div>
      
      <div style="padding: 20px 0;">
        <button 
          class="btn btn-primary btn-block" 
          style="height: 50px; font-size: 16px;"
          @click="handleSubmit"
          :disabled="submitting"
        >
          {{ submitting ? '保存中...' : (isEdit ? '保存修改' : '创建商品') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { productApi, categoryApi, Category } from '@/api';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);

const formData = ref({
  name: '',
  price: '',
  stock: '',
  cover: '',
  description: '',
  categoryId: ''
});

const categories = ref<Category[]>([]);
const submitting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const fetchCategories = async () => {
  try {
    const res = await categoryApi.list();
    if (res.code === 200) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

const fetchProduct = async () => {
  if (!route.params.id) return;
  
  try {
    const res = await productApi.get(route.params.id as string);
    if (res.code === 200) {
      const p = res.data;
      formData.value = {
        name: p.name,
        price: p.price.toString(),
        stock: p.stock.toString(),
        cover: p.cover,
        description: p.description,
        categoryId: p.categoryId
      };
    }
  } catch (error) {
    console.error('Failed to fetch product:', error);
  }
};

const triggerUpload = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    formData.value.cover = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const validate = () => {
  if (!formData.value.name.trim()) {
    showToast('请输入商品名称');
    return false;
  }
  if (!formData.value.price || Number(formData.value.price) < 0) {
    showToast('请输入有效价格');
    return false;
  }
  if (!formData.value.stock || Number(formData.value.stock) < 0) {
    showToast('请输入有效库存');
    return false;
  }
  if (!formData.value.categoryId) {
    showToast('请选择分类');
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validate() || submitting.value) return;
  
  submitting.value = true;
  
  const data = {
    name: formData.value.name.trim(),
    price: Number(formData.value.price),
    stock: Number(formData.value.stock),
    cover: formData.value.cover || 'https://picsum.photos/seed/default/400/400',
    description: formData.value.description.trim(),
    categoryId: formData.value.categoryId
  };
  
  try {
    let res;
    if (isEdit.value) {
      res = await productApi.update({ id: route.params.id as string, ...data });
    } else {
      res = await productApi.create(data);
    }
    
    if (res.code === 200) {
      showToast('保存成功');
      setTimeout(() => {
        router.push('/');
      }, 500);
    } else {
      showToast(res.message);
    }
  } catch (error) {
    showToast('保存失败');
  } finally {
    submitting.value = false;
  }
};

const goBack = () => {
  router.back();
};

const showToast = (message: string) => {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
};

onMounted(() => {
  fetchCategories();
  if (isEdit.value) {
    fetchProduct();
  }
});
</script>

<style scoped>
.edit-page {
  min-height: 100vh;
  background: var(--bg-gradient);
}
</style>
