const { db } = require('./dist/data/database');
const { authService } = require('./dist/modules/auth/auth.service');
const { categoryService } = require('./dist/modules/category/category.service');
const { productService } = require('./dist/modules/product/product.service');

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: JSON.stringify(body)
  };
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function getToken(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth) return '';
  return auth.replace('Bearer ', '');
}

function getPathParams(event) {
  const path = event.path.replace('/api/', '');
  const parts = path.split('/').filter(Boolean);
  return { path, parts };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  const { path, parts } = getPathParams(event);
  const method = event.httpMethod;
  const token = getToken(event);

  try {
    if (parts[0] === 'auth') {
      if (parts[1] === 'login' && method === 'POST') {
        const { username, password } = parseBody(event);
        return createResponse(200, authService.login({ username, password }));
      }
      if (parts[1] === 'userinfo' && method === 'GET') {
        const user = authService.getUserInfo(token);
        if (!user) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, { code: 200, data: user, message: '获取成功' });
      }
      if (parts[1] === 'logout' && method === 'POST') {
        return createResponse(200, authService.logout(token));
      }
    }

    if (parts[0] === 'category') {
      if (method === 'GET' && !parts[1]) {
        return createResponse(200, categoryService.findAll());
      }
      if (method === 'GET' && parts[1]) {
        return createResponse(200, categoryService.findOne(parts[1]));
      }
      if (method === 'POST' && !parts[1]) {
        if (!authService.validateToken(token)) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, categoryService.create(parseBody(event)));
      }
      if (method === 'PUT') {
        if (!authService.validateToken(token)) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, categoryService.update(parseBody(event)));
      }
      if (method === 'DELETE' && parts[1]) {
        if (!authService.validateToken(token)) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, categoryService.remove(parts[1]));
      }
    }

    if (parts[0] === 'product') {
      if (method === 'GET' && !parts[1]) {
        const query = event.queryStringParameters || {};
        return createResponse(200, productService.findAll({
          page: parseInt(query.page) || 1,
          pageSize: parseInt(query.pageSize) || 10,
          categoryId: query.categoryId,
          keyword: query.keyword
        }));
      }
      if (method === 'GET' && parts[1]) {
        return createResponse(200, productService.findOne(parts[1]));
      }
      if (method === 'POST' && !parts[1]) {
        if (!authService.validateToken(token)) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, productService.create(parseBody(event)));
      }
      if (method === 'PUT') {
        if (!authService.validateToken(token)) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, productService.update(parseBody(event)));
      }
      if (method === 'DELETE' && parts[1]) {
        if (!authService.validateToken(token)) {
          return createResponse(401, { code: 401, data: null, message: '未登录' });
        }
        return createResponse(200, productService.remove(parts[1]));
      }
    }

    return createResponse(404, { code: 404, data: null, message: 'Not Found' });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, { code: 500, data: null, message: 'Internal Server Error' });
  }
};
