import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto, PaginationDto, ApiResponse } from '../../common/types';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(query: PaginationDto): Promise<ApiResponse<{ list: Product[]; total: number; page: number; pageSize: number }>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<Product> = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.keyword) {
      where.name = Like(`%${query.keyword}%`);
    }

    const [list, total] = await this.productRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return {
      code: 200,
      data: {
        list,
        total,
        page,
        pageSize,
      },
      message: '获取成功',
    };
  }

  async findOne(id: string): Promise<ApiResponse<Product>> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      return {
        code: 404,
        data: null,
        message: '商品不存在',
      };
    }

    return {
      code: 200,
      data: product,
      message: '获取成功',
    };
  }

  async create(dto: CreateProductDto): Promise<ApiResponse<Product>> {
    const product = this.productRepository.create({
      name: dto.name,
      price: dto.price,
      stock: dto.stock,
      cover: dto.cover,
      description: dto.description,
      categoryId: dto.categoryId,
    });
    await this.productRepository.save(product);

    return {
      code: 200,
      data: product,
      message: '创建成功',
    };
  }

  async update(dto: UpdateProductDto): Promise<ApiResponse<Product>> {
    const product = await this.productRepository.findOne({ where: { id: dto.id } });

    if (!product) {
      return {
        code: 404,
        data: null,
        message: '商品不存在',
      };
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.cover !== undefined) product.cover = dto.cover;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;

    await this.productRepository.save(product);

    return {
      code: 200,
      data: product,
      message: '更新成功',
    };
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      return {
        code: 404,
        data: null,
        message: '商品不存在',
      };
    }

    return {
      code: 200,
      data: null,
      message: '删除成功',
    };
  }
}
