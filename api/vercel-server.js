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

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateUserId = () => {
  return crypto.randomBytes(8).toString('hex');
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
  let token = auth.replace(/^Bearer\s+/i, '');
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }
  return token;
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

const initDatabase = async () => {
  if (!sql) return;
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        username VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('[DB] Sessions table ready');
  } catch (error) {
    console.error('[DB] Failed to init sessions table:', error.message);
  }
};

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

const saveSession = async (token, userId, username, role) => {
  if (!sql) return;
  try {
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await sql`
      INSERT INTO sessions (token, user_id, username, role, expires_at)
      VALUES (${token}, ${userId}, ${username}, ${role}, ${expiresAt})
      ON CONFLICT (token) DO UPDATE SET
        user_id = ${userId},
        username = ${username},
        role = ${role},
        expires_at = ${expiresAt}
    `;
  } catch (error) {
    console.error('[DB] Save session error:', error.message);
  }
};

const getSession = async (token) => {
  if (!sql) return null;
  try {
    const result = await sql`
      SELECT * FROM sessions 
      WHERE token = ${token} AND expires_at > NOW()
    `;
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[DB] Get session error:', error.message);
    return null;
  }
};

const deleteSession = async (token) => {
  if (!sql) return;
  try {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  } catch (error) {
    console.error('[DB] Delete session error:', error.message);
  }
};

const handleAuth = async (req, res, method, pathname, body) => {
  if (pathname === '/api/auth/login' && method === 'POST') {
    await initDatabase();
    await initializeData();
    
    const { username, password } = body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const userId = generateUserId();
      const token = generateToken();
      const role = 'admin';
      
      await saveSession(token, userId, username, role);
      
      console.log(`[AUTH] Login success: ${username}`);
      
      return createResponse(res, 200, {
        code: 200,
        data: { token, user: { id: userId, username, role } },
        message: '登录成功'
      });
    }
    return createResponse(res, 401, { code: 401, data: null, message: '用户名或密码错误' });
  }

  if (pathname === '/api/auth/userinfo' && method === 'GET') {
    const token = getToken(req);
    const session = await getSession(token);
    
    if (!session) {
      return createResponse(res, 401, { code: 401, data: null, message: '未登录或登录已过期' });
    }
    
    return createResponse(res, 200, {
      code: 200,
      data: { id: session.user_id, username: session.username, role: session.role },
      message: '获取成功'
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = getToken(req);
    await deleteSession(token);
    return createResponse(res, 200, { code: 200, data: null, message: '退出成功' });
  }

  return null;
};

const verifyAuth = async (req) => {
  const token = getToken(req);
  const session = await getSession(token);
  if (!session) return null;
  return { id: session.user_id, username: session.username, role: session.role };
};

const handleCategory = async (req, res, method, pathname, body, query) => {
  await initDatabase();
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
    const user = await verifyAuth(req);
    if (!user) {
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
    const user = await verifyAuth(req);
    if (!user) {
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
    const user = await verifyAuth(req);
    if (!user) {
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
  await initDatabase();
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
    const user = await verifyAuth(req);
    if (!user) {
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
    const user = await verifyAuth(req);
    if (!user) {
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
    const user = await verifyAuth(req);
    if (!user) {
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

  if (method === 'OPTIONS') {
    return createResponse(res, 200, null);
  }

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

    createResponse(res, 404, { code: 404, data: null, message: 'Not Found' });
  } catch (error) {
    console.error('[VERCEL] Error:', error);
    createResponse(res, 500, { code: 500, data: null, message: 'Internal Server Error' });
  }
};

module.exports = handler;
