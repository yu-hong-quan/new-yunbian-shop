import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'vue_shop'),
    entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
    synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true',
    logging: configService.get('DB_LOGGING', 'false') === 'true',
  }),
  inject: [ConfigService],
};
