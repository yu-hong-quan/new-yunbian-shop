import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, PaginationDto } from '../../common/types';
import { AuthService } from '../auth/auth.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto, @Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    const isValid = await this.authService.validateToken(actualToken);
    if (!isValid) {
      return {
        code: 401,
        data: null,
        message: '未登录或token已过期',
      };
    }
    return this.productService.create(dto);
  }

  @Put()
  async update(@Body() dto: UpdateProductDto, @Headers('authorization') token: string) {
    const actualToken = token?.replace('Bearer ', '');
    const isValid = await this.authService.validateToken(actualToken);
    if (!isValid) {
      return {
        code: 401,
        data: null,
        message: '未登录或token已过期',
      };
    }
    return this.productService.update(dto);
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
    return this.productService.remove(id);
  }
}
