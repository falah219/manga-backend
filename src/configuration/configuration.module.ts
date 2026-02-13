import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MangaModule } from 'src/modules/mangas/manga.module';
import { PagesModule } from 'src/modules/pages/pages.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),

        autoLoadModels: true,
        synchronize: true, // ✅ DEV ONLY (prod sebaiknya pakai migration)
        logging: false,
      }),
    }),

    MangaModule,
    PagesModule,
    AuthModule,
  ],
  exports: [SequelizeModule, ConfigModule],
})
export class ConfigurationModule { }
