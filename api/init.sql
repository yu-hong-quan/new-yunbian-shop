-- 云边小铺数据库初始化脚本
-- 在 Neon Console 的 SQL Editor 中执行此脚本

-- 创建 categories 表
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  sort INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 products 表
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  cover VARCHAR(500),
  description TEXT,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- 创建 sessions 表 (用于存储登录会话)
CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  username VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 定期清理过期 session (可以设置定时任务或使用 Neon 的自动过期)
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 插入初始分类
INSERT INTO categories (id, name, sort) VALUES
  ('11111111-1111-1111-1111-111111111111', '美食', 1),
  ('22222222-2222-2222-2222-222222222222', '饮品', 2),
  ('33333333-3333-3333-3333-333333333333', '日用品', 3)
ON CONFLICT DO NOTHING;

-- 插入初始商品
INSERT INTO products (name, price, stock, cover, description, category_id) VALUES
  ('红烧肉盖饭', 28.8, 50, 'https://picsum.photos/seed/food1/400/400', '精选五花肉，慢火红烧，配上香喷喷的白米饭', '11111111-1111-1111-1111-111111111111'),
  ('宫保鸡丁', 32.0, 30, 'https://picsum.photos/seed/food2/400/400', '经典川菜，鸡丁鲜嫩，花生酥脆', '11111111-1111-1111-1111-111111111111'),
  ('鱼香肉丝', 26.0, 40, 'https://picsum.photos/seed/food3/400/400', '酸甜微辣，肉丝滑嫩', '11111111-1111-1111-1111-111111111111'),
  ('番茄炒蛋', 18.0, 60, 'https://picsum.photos/seed/food4/400/400', '家常美味，番茄酸甜，鸡蛋嫩滑', '11111111-1111-1111-1111-111111111111'),
  ('柠檬水', 8.0, 100, 'https://picsum.photos/seed/drink1/400/400', '新鲜柠檬榨汁，清爽解渴', '22222222-2222-2222-2222-222222222222'),
  ('珍珠奶茶', 15.0, 80, 'https://picsum.photos/seed/drink2/400/400', '经典台式奶茶，Q弹珍珠', '22222222-2222-2222-2222-222222222222'),
  ('鲜榨橙汁', 12.0, 50, 'https://picsum.photos/seed/drink3/400/400', '100%鲜榨橙汁，不加水不加糖', '22222222-2222-2222-2222-222222222222'),
  ('纸巾', 2.5, 200, 'https://picsum.photos/seed/daily1/400/400', '柔软纸巾，一包100抽', '33333333-3333-3333-3333-333333333333'),
  ('牙膏', 9.9, 80, 'https://picsum.photos/seed/daily2/400/400', '清新薄荷味牙膏', '33333333-3333-3333-3333-333333333333'),
  ('洗发水', 25.0, 40, 'https://picsum.photos/seed/daily3/400/400', '滋养修护洗发水500ml', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

SELECT 'Database initialized successfully!' as status;
