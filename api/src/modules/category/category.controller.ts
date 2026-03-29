import { Controller, Get, Post, Put, Delete, Body, Param, Headers } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../common/types';
import { AuthService } from '../auth/auth.service';

@Controller('category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto, @Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    const isValid = await this.authService.validateToken(actualToken);
    if (!isValid) {
      return {
        code: 401,
        data: null,
        message: '未登录或token已过期',
      };
    }
    return this.categoryService.create(dto);
  }

  @Put()
  async update(@Body() dto: UpdateCategoryDto, @Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    const isValid = await this.authService.validateToken(actualToken);
    if (!isValid) {
      return {
        code: 401,
        data: null,
        message: '未登录或token已过期',
      };
    }
    return this.categoryService.update(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    const isValid = await this.authService.validateToken(actualToken);
    if (!isValid) {
      return {
        code: 401,
        data: null,
        message: '未登录或token已过期',
      };
    }
    return this.categoryService.remove(id);
  }
}
