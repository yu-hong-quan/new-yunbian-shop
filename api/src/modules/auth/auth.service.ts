import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Admin } from '../../entities/admin.entity';
import { Token } from '../../entities/token.entity';
import { LoginDto, LoginResponse, ApiResponse } from '../../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureAdminExists();
  }

  private async ensureAdminExists() {
    const username = this.configService.get('admin.username') || 'admin';
    const password = this.configService.get('admin.password') || 'admin123';

    const existing = await this.adminRepository.findOne({
      where: { username },
    });

    if (!existing) {
      const admin = this.adminRepository.create({
        username,
        password,
        role: 'admin',
      });
      await this.adminRepository.save(admin);
      console.log('Default admin account created');
    }
  }

  async login(dto: LoginDto): Promise<ApiResponse<LoginResponse>> {
    const admin = await this.adminRepository.findOne({
      where: { username: dto.username },
    });

    if (!admin || admin.password !== dto.password) {
      return {
        code: 401,
        data: null,
        message: '用户名或密码错误',
      };
    }

    if (admin.role !== 'admin') {
      return {
        code: 403,
        data: null,
        message: '无权限访问',
      };
    }

    const token = uuidv4();

    const tokenEntity = this.tokenRepository.create({
      token,
      adminId: admin.id,
      isValid: true,
    });
    await this.tokenRepository.save(tokenEntity);

    return {
      code: 200,
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
        },
      },
      message: '登录成功',
    };
  }

  async validateToken(token: string): Promise<boolean> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { token, isValid: true },
    });
    return !!tokenEntity;
  }

  async getUserInfo(token: string): Promise<ApiResponse<{ id: string; username: string; role: string }>> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { token, isValid: true },
    });

    if (!tokenEntity) {
      return {
        code: 401,
        data: null,
        message: 'Token无效或已过期',
      };
    }

    const admin = await this.adminRepository.findOne({
      where: { id: tokenEntity.adminId },
    });

    if (!admin) {
      return {
        code: 404,
        data: null,
        message: '用户不存在',
      };
    }

    return {
      code: 200,
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
      message: '获取成功',
    };
  }

  async logout(token: string): Promise<ApiResponse<null>> {
    await this.tokenRepository.update({ token }, { isValid: false });
    return {
      code: 200,
      data: null,
      message: '退出成功',
    };
  }
}
