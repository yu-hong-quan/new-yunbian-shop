<template>
  <div class="category-page">
    <header class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="back-btn" @click="goBack">返回</button>
        <h1>📂 分类管理</h1>
      </div>
    </header>
    
    <div v-if="loading" class="loading">
      <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
      加载中...
    </div>
    
    <div v-else class="category-list">
      <div 
        v-for="(cat, index) in categories" 
        :key="cat.id"
        class="category-item"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div style="display: flex; align-items: center; flex: 1;">
          <div class="category-icon">
            {{ getCategoryIcon(index) }}
          </div>
          <div class="category-info">
            <div class="category-name">{{ cat.name }}</div>
            <div class="category-count">排序: {{ cat.sort }}</div>
          </div>
        </div>
        <div class="category-actions">
          <button class="btn btn-default btn-sm" @click="editCategory(cat)">编辑</button>
          <button class="btn btn-danger btn-sm" @click="confirmDelete(cat)">删除</button>
        </div>
      </div>
      
      <div class="empty" v-if="categories.length === 0">
        <div class="empty-icon">📂</div>
        <p>暂无分类</p>
      </div>
    </div>
    
    <button class="fab" @click="showAddModal = true">+</button>
    
    <div v-if="showAddModal || editingCategory" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingCategory ? '编辑分类' : '新增分类' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <label>分类名称 *</label>
            <input 
              v-model="formData.name" 
              type="text" 
              placeholder="请输入分类名称"
            />
          </div>
          <div class="input-group">
            <label>排序</label>
            <input 
              v-model="formData.sort" 
              type="number"
              min="0"
              placeholder="数字越小越靠前"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" style="flex: 1;" @click="closeModal">取消</button>
          <button class="btn btn-primary" style="flex: 1;" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
    
    <ConfirmModal 
      v-if="deleteTarget"
      title="确认删除"
      :message="`确定要删除分类「${deleteTarget.name}」吗？此操作不可撤销。`"
      @confirm="handleDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { categoryApi, Category } from '@/api';
import ConfirmModal from '@/components/ConfirmModal.vue';

const router = useRouter();

const categories = ref<Category[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const editingCategory = ref<Category | null>(null);
const deleteTarget = ref<Category | null>(null);
const submitting = ref(false);

const formData = ref({
  name: '',
  sort: ''
});

const categoryIcons = ['🍜', '☕', '🧴', '🍕', '🍰', '🛍️', '🎁', '💄'];

const getCategoryIcon = (index: number) => categoryIcons[index % categoryIcons.length];

const fetchCategories = async () => {
  loading.value = true;
  try {
    const res = await categoryApi.list();
    if (res.code === 200) {
      categories.value = res.data;
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  } finally {
    loading.value = false;
  }
};

const editCategory = (cat: Category) => {
  editingCategory.value = cat;
  formData.value = {
    name: cat.name,
    sort: cat.sort.toString()
  };
};

const closeModal = () => {
  showAddModal.value = false;
  editingCategory.value = null;
  formData.value = { name: '', sort: '' };
};

const confirmDelete = (cat: Category) => {
  deleteTarget.value = cat;
};

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    showToast('请输入分类名称');
    return;
  }
  
  if (submitting.value) return;
  submitting.value = true;
  
  try {
    const data = {
      name: formData.value.name.trim(),
      sort: formData.value.sort ? Number(formData.value.sort) : 0
    };
    
    let res;
    if (editingCategory.value) {
      res = await categoryApi.update({ id: editingCategory.value.id, ...data });
    } else {
      res = await categoryApi.create(data);
    }
    
    if (res.code === 200) {
      showToast(editingCategory.value ? '更新成功' : '创建成功');
      closeModal();
      fetchCategories();
    } else {
      showToast(res.message);
    }
  } catch (error) {
    showToast('保存失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async () => {
  if (!deleteTarget.value) return;
  
  try {
    const res = await categoryApi.delete(deleteTarget.value.id);
    if (res.code === 200) {
      showToast('删除成功');
      deleteTarget.value = null;
      fetchCategories();
    } else {
      showToast(res.message);
    }
  } catch (error) {
    showToast('删除失败');
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
});
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  padding-bottom: 80px;
}
</style>
