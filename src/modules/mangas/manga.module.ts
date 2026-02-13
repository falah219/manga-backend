import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { Manga } from 'src/modules/mangas/dto/mangas.model';

// import { Author } from './models/author.model';
// import { Category } from './models/category.model';
// import { MangaCategory } from './models/manga-category.model';
// import { Chapter } from './models/chapter.model';

import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { Page } from '../pages/dto/pages.model';
import { Chapter } from '../chapters/dto/chapters.model';
import { ServeStaticModule } from '@nestjs/serve-static';

function coverFilename(req: any, file: any, cb: any) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cover-${unique}${extname(file.originalname)}`);
}

@Module({
    imports: [
        SequelizeModule.forFeature([Manga, Page, Chapter]),

        MulterModule.register({
            storage: diskStorage({
                destination: './uploads/covers',
                filename: coverFilename,
            }),
            limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
            fileFilter: (req, file, cb) => {
                const ok = /image\/(png|jpg|jpeg|webp)/.test(file.mimetype);
                cb(ok ? null : new Error('Only image files are allowed'), ok);
            },
        }),
    ],
    controllers: [MangaController],
    providers: [MangaService],
})
export class MangaModule { }
