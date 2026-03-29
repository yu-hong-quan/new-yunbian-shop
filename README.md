# 小商铺商品管理平台

一个轻量级的小商铺商品管理 H5 应用，支持手机端访问，包含完整的商品管理和分类管理功能。

## 技术栈

### 前端
- Vue 3 + Composition API
- Vite 构建工具
- TypeScript
- Pinia 状态管理
- Axios HTTP 客户端
- 移动端适配（响应式设计）

### 后端
- Node.js 原生 API（适配 Vercel Serverless）
- 内存数据存储（无需数据库）

### 部署
- Vercel 全栈部署

## 功能特性

### 权限管理
- **超管**：账号密码登录，可进行商品和分类的增删改查
- **普通用户**：无需登录即可浏览商品列表和详情

### 商品管理
- 商品列表展示（按分类筛选）
- 商品搜索功能
- 商品详情查看
- 商品新增/编辑/删除（仅超管）
- 封面图上传

### 分类管理
- 分类列表展示
- 分类新增/编辑/删除（仅超管）
- 分类排序

## 项目结构

```
vue-shop/
├── api/                    # 后端服务
│   ├── vercel-server.js   # Vercel Serverless 函数入口
│   └── ...
├── web/                    # 前端应用
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── styles/        # 全局样式
│   │   └── views/         # 页面组件
│   └── ...
├── vercel.json            # Vercel 配置文件
└── README.md
```

## 快速开始

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd vue-shop
```

2. 安装依赖
```bash
npm install
cd api && npm install
cd ../web && npm install
```

3. 启动开发服务器
```bash
# 根目录运行，同时启动前后端
npm run dev

# 或分别启动
npm run dev:api    # 启动后端（端口 3001）
npm run dev:web    # 启动前端（端口 5173）
```

4. 访问应用
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001/api

### 默认账号

- 用户名：admin
- 密码：admin123

## Vercel 部署

### 方式一：GitHub 导入

1. 将项目推送到 GitHub 仓库
2. 登录 [Vercel](https://vercel.com)
3. 导入 GitHub 仓库
4. 配置环境变量（如需要修改默认账号密码）
5. 点击 Deploy

### 方式二：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
npm run deploy
```

### 环境变量配置

在 Vercel 控制台或 `.env` 文件中配置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| ADMIN_USERNAME | 管理员用户名 | admin |
| ADMIN_PASSWORD | 管理员密码 | admin123 |

## API 接口

### 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 公开 |
| GET | /api/auth/userinfo | 获取用户信息 | 需要 token |
| POST | /api/auth/logout | 退出登录 | 需要 token |

### 分类接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/category | 获取分类列表 | 公开 |
| GET | /api/category/:id | 获取分类详情 | 公开 |
| POST | /api/category | 新增分类 | 超管 |
| PUT | /api/category | 更新分类 | 超管 |
| DELETE | /api/category/:id | 删除分类 | 超管 |

### 商品接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | /api/product | 获取商品列表 | 公开 |
| GET | /api/product/:id | 获取商品详情 | 公开 |
| POST | /api/product | 新增商品 | 超管 |
| PUT | /api/product | 更新商品 | 超管 |
| DELETE | /api/product/:id | 删除商品 | 超管 |

### 请求示例

```javascript
// 登录
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

// 获取商品列表
fetch('/api/product?page=1&pageSize=10&categoryId=1')

// 创建商品（需要 token）
fetch('/api/product', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    name: '新商品',
    price: 19.9,
    stock: 100,
    cover: 'https://example.com/image.jpg',
    description: '商品描述',
    categoryId: '1'
  })
});
```

## 移动端适配

- 移动端优先设计
- 触控友好的交互
- 安全区域适配（iPhone X 等）
- 分类横向滚动
- 下拉刷新/上拉加载

## 开发说明

### 前端开发

```bash
cd web

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 后端开发

后端使用 Node.js 原生实现，适配 Vercel Serverless 环境：

- `vercel-server.js` - Vercel Serverless 函数入口
- 数据存储在内存中，每次部署会重置

如需本地开发后端：

```bash
cd api
npm install
npm run dev
```

## License

MIT
