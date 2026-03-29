const http = require('http');
const url = require('url');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const categories = [
  { id: '1', name: '美食', sort: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: '饮品', sort: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: '日用品', sort: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const products = [
  { id: '1', name: '红烧肉盖饭', price: 28.8, stock: 50, cover: 'https://picsum.photos/seed/food1/400/400', description: '精选五花肉，慢火红烧', categoryId: '1' },
  { id: '2', name: '宫保鸡丁', price: 32.0, stock: 30, cover: 'https://picsum.photos/seed/food2/400/400', description: '经典川菜', categoryId: '1' },
  { id: '3', name: '柠檬水', price: 8.0, stock: 100, cover: 'https://picsum.photos/seed/drink1/400/400', description: '新鲜柠檬', categoryId: '2' },
  { id: '4', name: '珍珠奶茶', price: 15.0, stock: 80, cover: 'https://picsum.photos/seed/drink2/400/400', description: '经典奶茶', categoryId: '2' },
  { id: '5', name: '纸巾', price: 2.5, stock: 200, cover: 'https://picsum.photos/seed/daily1/400/400', description: '柔软纸巾', categoryId: '3' }
];

const tokens = new Map();
let idCounter = 100;

const getNextId = () => String(++idCounter);

const createResponse = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(body));
};

const getToken = (req) => {
  const auth = req.headers.authorization;
  if (!auth) return '';
  return auth.replace('Bearer ', '');
};

const isAuthenticated = (token) => {
  return tokens.has(token);
};

const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

const handleAuth = async (req, res, method, pathname, body) => {
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = getNextId();
      tokens.set(token, { id: '1', username, role: 'admin' });
      return createResponse(res, 200, {
        code: 200,
        data: { token, user: { id: '1', username, role: 'admin' } },
        message: '登录成功'
      });
    }
    return createResponse(res, 401, { code: 401, data: null, message: '用户名或密码错误' });
  }

  if (pathname === '/api/auth/userinfo' && method === 'GET') {
    const token = getToken(req);
    const user = tokens.get(token);
    if (!user) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    return createResponse(res, 200, { code: 200, data: user, message: '获取成功' });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = getToken(req);
    tokens.delete(token);
    return createResponse(res, 200, { code: 200, data: null, message: '退出成功' });
  }

  return null;
};

const handleCategory = async (req, res, method, pathname, body, query) => {
  const token = getToken(req);
  
  if (pathname === '/api/category' && method === 'GET') {
    return createResponse(res, 200, { code: 200, data: categories, message: '获取成功' });
  }

  if (pathname.startsWith('/api/category/') && method === 'GET') {
    const id = pathname.split('/')[3];
    const cat = categories.find(c => c.id === id);
    if (!cat) {
      return createResponse(res, 404, { code: 404, data: null, message: '分类不存在' });
    }
    return createResponse(res, 200, { code: 200, data: cat, message: '获取成功' });
  }

  if (pathname === '/api/category' && method === 'POST') {
    if (!isAuthenticated(token)) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    const cat = {
      id: getNextId(),
      name: body.name,
      sort: body.sort || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    categories.push(cat);
    return createResponse(res, 200, { code: 200, data: cat, message: '创建成功' });
  }

  if (pathname === '/api/category' && method === 'PUT') {
    if (!isAuthenticated(token)) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    const cat = categories.find(c => c.id === body.id);
    if (!cat) {
      return createResponse(res, 404, { code: 404, data: null, message: '分类不存在' });
    }
    cat.name = body.name;
    cat.sort = body.sort ?? cat.sort;
    cat.updatedAt = new Date().toISOString();
    return createResponse(res, 200, { code: 200, data: cat, message: '更新成功' });
  }

  if (pathname.startsWith('/api/category/') && method === 'DELETE') {
    if (!isAuthenticated(token)) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    const id = pathname.split('/')[3];
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) {
      return createResponse(res, 404, { code: 404, data: null, message: '分类不存在' });
    }
    categories.splice(index, 1);
    return createResponse(res, 200, { code: 200, data: null, message: '删除成功' });
  }

  return null;
};

const handleProduct = async (req, res, method, pathname, body, query) => {
  const token = getToken(req);
  
  if (pathname === '/api/product' && method === 'GET') {
    let result = [...products];
    if (query.categoryId) {
      result = result.filter(p => p.categoryId === query.categoryId);
    }
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(kw));
    }
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;
    const start = (page - 1) * pageSize;
    const list = result.slice(start, start + pageSize);
    return createResponse(res, 200, {
      code: 200,
      data: { list, total: result.length, page, pageSize },
      message: '获取成功'
    });
  }

  if (pathname.startsWith('/api/product/') && method === 'GET') {
    const id = pathname.split('/')[3];
    const product = products.find(p => p.id === id);
    if (!product) {
      return createResponse(res, 404, { code: 404, data: null, message: '商品不存在' });
    }
    return createResponse(res, 200, { code: 200, data: product, message: '获取成功' });
  }

  if (pathname === '/api/product' && method === 'POST') {
    if (!isAuthenticated(token)) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    const product = {
      id: getNextId(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(product);
    return createResponse(res, 200, { code: 200, data: product, message: '创建成功' });
  }

  if (pathname === '/api/product' && method === 'PUT') {
    if (!isAuthenticated(token)) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    const product = products.find(p => p.id === body.id);
    if (!product) {
      return createResponse(res, 404, { code: 404, data: null, message: '商品不存在' });
    }
    Object.assign(product, body, { updatedAt: new Date().toISOString() });
    return createResponse(res, 200, { code: 200, data: product, message: '更新成功' });
  }

  if (pathname.startsWith('/api/product/') && method === 'DELETE') {
    if (!isAuthenticated(token)) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录' });
    }
    const id = pathname.split('/')[3];
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
      return createResponse(res, 404, { code: 404, data: null, message: '商品不存在' });
    }
    products.splice(index, 1);
    return createResponse(res, 200, { code: 200, data: null, message: '删除成功' });
  }

  return null;
};

const handler = async (req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  const method = req.method;

  if (method === 'OPTIONS') {
    return createResponse(res, 200, null);
  }

  try {
    const body = await parseBody(req);

    let result = await handleAuth(req, res, method, pathname, body);
    if (result) return;

    result = await handleCategory(req, res, method, pathname, body, query);
    if (result) return;

    result = await handleProduct(req, res, method, pathname, body, query);
    if (result) return;

    createResponse(res, 404, { code: 404, data: null, message: 'Not Found' });
  } catch (error) {
    console.error('Error:', error);
    createResponse(res, 500, { code: 500, data: null, message: 'Internal Server Error' });
  }
};

module.exports = handler;
