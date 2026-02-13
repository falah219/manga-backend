import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { Page } from './dto/pages.model';
import { Chapter } from '../chapters/dto/chapters.model';
import { Manga } from '../mangas/dto/mangas.model';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

function pageFilename(_req: any, file: any, cb: any) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `page-${unique}${extname(file.originalname)}`);
}

@Module({
    imports: [
        SequelizeModule.forFeature([Page, Chapter, Manga]),

        MulterModule.register({
            storage: diskStorage({
                destination: './uploads/_temp',
                filename: pageFilename,
            }),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
            fileFilter: (_req, file, cb) => {
                const ok = /image\/(png|jpg|jpeg|webp)/.test(file.mimetype);
                cb(ok ? null : new Error('Only image files are allowed'), ok);
            },
        }),
    ],
    controllers: [PagesController],
    providers: [PagesService],
})
export class PagesModule { }
