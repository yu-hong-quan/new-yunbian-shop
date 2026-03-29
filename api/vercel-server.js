const http = require('http');
const url = require('url');
const crypto = require('crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DATABASE_URL = process.env.DATABASE_URL;
const TOKEN_EXPIRY_HOURS = 24;

let sql = null;
if (DATABASE_URL) {
  try {
    const { neon } = require('@neondatabase/serverless');
    sql = neon(DATABASE_URL);
  } catch (e) {
    console.error('Failed to initialize neon:', e.message);
  }
}

let isInitialized = false;
let categories = [];
let products = [];
const tokens = new Map();

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateUserId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const isTokenValid = (tokenData) => {
  if (!tokenData) return false;
  const now = Date.now();
  return tokenData.expiresAt > now;
};

const createTokenData = (user) => {
  return {
    ...user,
    createdAt: Date.now(),
    expiresAt: Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
  };
};

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

console.log('[VERCEL] Server initialized');
console.log('[VERCEL] DATABASE_URL:', DATABASE_URL ? 'set' : 'not set');
console.log('[VERCEL] sql:', sql ? 'initialized' : 'null');

const initializeData = async () => {
  if (isInitialized || !sql) return;
  
  try {
    const cats = await sql`SELECT * FROM categories ORDER BY sort ASC`;
    const prods = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    
    categories = cats.map(c => ({
      id: c.id,
      name: c.name,
      sort: c.sort,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));
    
    products = prods.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      stock: p.stock,
      cover: p.cover,
      description: p.description,
      categoryId: p.category_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
    
    isInitialized = true;
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize data:', error.message);
  }
};

const handleAuth = async (req, res, method, pathname, body) => {
  if (pathname === '/api/auth/login' && method === 'POST') {
    await initializeData();
    
    const { username, password } = body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const userId = generateUserId();
      const token = generateToken();
      const user = { id: userId, username, role: 'admin' };
      tokens.set(token, createTokenData(user));
      
      console.log(`[AUTH] Login success: ${username}, token expires in ${TOKEN_EXPIRY_HOURS}h`);
      
      return createResponse(res, 200, {
        code: 200,
        data: { token, user },
        message: '登录成功'
      });
    }
    return createResponse(res, 401, { code: 401, data: null, message: '用户名或密码错误' });
  }

  if (pathname === '/api/auth/userinfo' && method === 'GET') {
    const token = getToken(req);
    const tokenData = tokens.get(token);
    
    if (!tokenData) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    if (!isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '登录已过期，请重新登录' });
    }
    
    return createResponse(res, 200, { code: 200, data: tokenData, message: '获取成功' });
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
  const tokenData = tokens.get(token);
  
  await initializeData();
  
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
    if (!tokenData || !isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    if (sql) {
      try {
        const result = await sql`
          INSERT INTO categories (id, name, sort, created_at, updated_at)
          VALUES (gen_random_uuid(), ${body.name}, ${body.sort || 0}, NOW(), NOW())
          RETURNING *
        `;
        const cat = result[0];
        categories.push({
          id: cat.id,
          name: cat.name,
          sort: cat.sort,
          createdAt: cat.created_at,
          updatedAt: cat.updated_at
        });
        return createResponse(res, 200, { code: 200, data: categories[categories.length - 1], message: '创建成功' });
      } catch (error) {
        console.error('Create category error:', error);
        return createResponse(res, 500, { code: 500, data: null, message: '创建失败' });
      }
    } else {
      const cat = {
        id: generateToken().substring(0, 16),
        name: body.name,
        sort: body.sort || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      categories.push(cat);
      return createResponse(res, 200, { code: 200, data: cat, message: '创建成功' });
    }
  }

  if (pathname === '/api/category' && method === 'PUT') {
    if (!tokenData || !isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    if (sql) {
      try {
        await sql`
          UPDATE categories 
          SET name = ${body.name}, sort = ${body.sort ?? 0}, updated_at = NOW()
          WHERE id = ${body.id}
        `;
        const cat = categories.find(c => c.id === body.id);
        if (cat) {
          cat.name = body.name;
          cat.sort = body.sort ?? cat.sort;
          cat.updatedAt = new Date().toISOString();
        }
        return createResponse(res, 200, { code: 200, data: cat, message: '更新成功' });
      } catch (error) {
        console.error('Update category error:', error);
        return createResponse(res, 500, { code: 500, data: null, message: '更新失败' });
      }
    } else {
      const cat = categories.find(c => c.id === body.id);
      if (!cat) {
        return createResponse(res, 404, { code: 404, data: null, message: '分类不存在' });
      }
      cat.name = body.name;
      cat.sort = body.sort ?? cat.sort;
      cat.updatedAt = new Date().toISOString();
      return createResponse(res, 200, { code: 200, data: cat, message: '更新成功' });
    }
  }

  if (pathname.startsWith('/api/category/') && method === 'DELETE') {
    if (!tokenData || !isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    const id = pathname.split('/')[3];
    
    if (sql) {
      try {
        await sql`DELETE FROM categories WHERE id = ${id}`;
      } catch (error) {
        console.error('Delete category error:', error);
        return createResponse(res, 500, { code: 500, data: null, message: '删除失败' });
      }
    }
    
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
  const tokenData = tokens.get(token);
  
  await initializeData();
  
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
    if (!tokenData || !isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    if (sql) {
      try {
        const result = await sql`
          INSERT INTO products (id, name, price, stock, cover, description, category_id, created_at, updated_at)
          VALUES (
            gen_random_uuid(), 
            ${body.name}, 
            ${body.price}, 
            ${body.stock}, 
            ${body.cover || ''}, 
            ${body.description || ''}, 
            ${body.categoryId},
            NOW(), 
            NOW()
          )
          RETURNING *
        `;
        const p = result[0];
        const product = {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          stock: p.stock,
          cover: p.cover,
          description: p.description,
          categoryId: p.category_id,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        };
        products.unshift(product);
        return createResponse(res, 200, { code: 200, data: product, message: '创建成功' });
      } catch (error) {
        console.error('Create product error:', error);
        return createResponse(res, 500, { code: 500, data: null, message: '创建失败' });
      }
    } else {
      const product = {
        id: generateToken().substring(0, 16),
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      products.unshift(product);
      return createResponse(res, 200, { code: 200, data: product, message: '创建成功' });
    }
  }

  if (pathname === '/api/product' && method === 'PUT') {
    if (!tokenData || !isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    if (sql) {
      try {
        await sql`
          UPDATE products 
          SET 
            name = ${body.name ?? ''}, 
            price = ${body.price ?? 0}, 
            stock = ${body.stock ?? 0}, 
            cover = ${body.cover ?? ''}, 
            description = ${body.description ?? ''}, 
            category_id = ${body.categoryId ?? ''},
            updated_at = NOW()
          WHERE id = ${body.id}
        `;
      } catch (error) {
        console.error('Update product error:', error);
        return createResponse(res, 500, { code: 500, data: null, message: '更新失败' });
      }
    }
    
    const product = products.find(p => p.id === body.id);
    if (!product) {
      return createResponse(res, 404, { code: 404, data: null, message: '商品不存在' });
    }
    Object.assign(product, body, { updatedAt: new Date().toISOString() });
    return createResponse(res, 200, { code: 200, data: product, message: '更新成功' });
  }

  if (pathname.startsWith('/api/product/') && method === 'DELETE') {
    if (!tokenData || !isTokenValid(tokenData)) {
      tokens.delete(token);
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    const id = pathname.split('/')[3];
    
    if (sql) {
      try {
        await sql`DELETE FROM products WHERE id = ${id}`;
      } catch (error) {
        console.error('Delete product error:', error);
        return createResponse(res, 500, { code: 500, data: null, message: '删除失败' });
      }
    }
    
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
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  console.log(`[VERCEL] ${method} ${pathname}`);
  console.log(`[VERCEL] Full URL: ${req.url}`);

  if (method === 'OPTIONS') {
    return createResponse(res, 200, null);
  }

  // Health check endpoint
  if (pathname === '/api/health' && method === 'GET') {
    return createResponse(res, 200, {
      code: 200,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        DATABASE_URL: DATABASE_URL ? 'set' : 'not set'
      },
      message: 'Health check'
    });
  }

  try {
    const body = await parseBody(req);

    let result = await handleAuth(req, res, method, pathname, body);
    if (result) return;

    result = await handleCategory(req, res, method, pathname, body, query);
    if (result) return;

    result = await handleProduct(req, res, method, pathname, body, query);
    if (result) return;

    console.log(`[VERCEL] No handler found for ${method} ${pathname}`);
    createResponse(res, 404, { code: 404, data: null, message: 'Not Found' });
  } catch (error) {
    console.error('[VERCEL] Error:', error);
    createResponse(res, 500, { code: 500, data: null, message: 'Internal Server Error' });
  }
};

module.exports = handler;
