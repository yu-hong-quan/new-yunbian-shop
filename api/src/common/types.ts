export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface CreateCategoryDto {
  name: string;
  sort?: number;
}

export interface UpdateCategoryDto {
  id: string;
  name?: string;
  sort?: number;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stock: number;
  cover: string;
  description: string;
  categoryId: string;
}

export interface UpdateProductDto {
  id: string;
  name?: string;
  price?: number;
  stock?: number;
  cover?: string;
  description?: string;
  categoryId?: string;
}

export interface PaginationDto {
  page: number;
  pageSize: number;
  categoryId?: string;
  keyword?: string;
}
