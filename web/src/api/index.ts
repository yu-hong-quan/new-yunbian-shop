import request from './request';

export interface Category {
  id: string;
  name: string;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  cover: string;
  description: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  username: string;
  role: string;
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export const authApi = {
  login: (username: string, password: string) => 
    request.post<ApiResponse<{ token: string; user: UserInfo }>>('/auth/login', { username, password }),
  
  getUserInfo: () => 
    request.get<ApiResponse<UserInfo>>('/auth/userinfo'),
  
  logout: () => 
    request.post<ApiResponse<null>>('/auth/logout')
};

export const categoryApi = {
  list: () => 
    request.get<ApiResponse<Category[]>>('/category'),
  
  get: (id: string) => 
    request.get<ApiResponse<Category>>(`/category/${id}`),
  
  create: (data: { name: string; sort?: number }) => 
    request.post<ApiResponse<Category>>('/category', data),
  
  update: (data: { id: string; name: string; sort?: number }) => 
    request.put<ApiResponse<Category>>('/category', data),
  
  delete: (id: string) => 
    request.delete<ApiResponse<null>>(`/category/${id}`)
};

export const productApi = {
  list: (params: { page?: number; pageSize?: number; categoryId?: string; keyword?: string }) => 
    request.get<ApiResponse<{ list: Product[]; total: number; page: number; pageSize: number }>>('/product', { params }),
  
  get: (id: string) => 
    request.get<ApiResponse<Product>>(`/product/${id}`),
  
  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => 
    request.post<ApiResponse<Product>>('/product', data),
  
  update: (data: Partial<Product> & { id: string }) => 
    request.put<ApiResponse<Product>>('/product', data),
  
  delete: (id: string) => 
    request.delete<ApiResponse<null>>(`/product/${id}`)
};
