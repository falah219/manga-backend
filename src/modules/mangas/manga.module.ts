import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { Manga } from 'src/modules/mangas/dto/mangas.model';
import { Genre } from 'src/modules/genres/dto/genre.model';
import { MangaGenre } from 'src/modules/genres/dto/manga-genre.model';

import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { Page } from '../pages/dto/pages.model';
import { Chapter } from '../chapters/dto/chapters.model';
import { GenreModule } from '../genres/genre.module';

function coverFilename(req: any, file: any, cb: any) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cover-${unique}${extname(file.originalname)}`);
}

@Module({
    imports: [
        SequelizeModule.forFeature([Manga, Page, Chapter, Genre, MangaGenre]),
        GenreModule,

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
