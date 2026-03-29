import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Admin } from '../../entities/admin.entity';
import { Token } from '../../entities/token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Token])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
