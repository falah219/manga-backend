import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Genre } from './dto/genre.model';
import { MangaGenre } from './dto/manga-genre.model';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';

@Module({
    imports: [
        SequelizeModule.forFeature([Genre, MangaGenre]),
    ],
    controllers: [GenreController],
    providers: [GenreService],
    exports: [SequelizeModule],
})
export class GenreModule { }
