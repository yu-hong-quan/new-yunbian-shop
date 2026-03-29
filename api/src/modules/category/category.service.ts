import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, ApiResponse } from '../../common/types';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<ApiResponse<Category[]>> {
    const categories = await this.categoryRepository.find({
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
    return {
      code: 200,
      data: categories,
      message: '获取成功',
    };
  }

  async findOne(id: string): Promise<ApiResponse<Category>> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      return {
        code: 404,
        data: null,
        message: '分类不存在',
      };
    }

    return {
      code: 200,
      data: category,
      message: '获取成功',
    };
  }

  async create(dto: CreateCategoryDto): Promise<ApiResponse<Category>> {
    const category = this.categoryRepository.create({
      name: dto.name,
      sort: dto.sort || 0,
    });
    await this.categoryRepository.save(category);

    return {
      code: 200,
      data: category,
      message: '创建成功',
    };
  }

  async update(dto: UpdateCategoryDto): Promise<ApiResponse<Category>> {
    const category = await this.categoryRepository.findOne({ where: { id: dto.id } });

    if (!category) {
      return {
        code: 404,
        data: null,
        message: '分类不存在',
      };
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.sort !== undefined) category.sort = dto.sort;

    await this.categoryRepository.save(category);

    return {
      code: 200,
      data: category,
      message: '更新成功',
    };
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    const result = await this.categoryRepository.delete(id);

    if (result.affected === 0) {
      return {
        code: 404,
        data: null,
        message: '分类不存在',
      };
    }

    return {
      code: 200,
      data: null,
      message: '删除成功',
    };
  }
}
