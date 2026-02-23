import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Genre } from './dto/genre.model';
import { MangaGenre } from './dto/manga-genre.model';

@Injectable()
export class GenreService {
    constructor(
        @InjectModel(Genre) private genreModel: typeof Genre,
        @InjectModel(MangaGenre) private mangaGenreModel: typeof MangaGenre,
    ) { }

    async findAll() {
        const genres = await this.genreModel.findAll({
            order: [['name', 'ASC']],
        });

        return {
            success: 200,
            message: 'Genres retrieved successfully',
            data: genres,
        };
    }

    async findOne(id: string) {
        const genre = await this.genreModel.findByPk(id);
        if (!genre) {
            throw new NotFoundException(`Genre with ID ${id} not found`);
        }

        return {
            success: 200,
            message: 'Genre detail retrieved successfully',
            data: genre,
        };
    }

    async create(body: { name: string; slug: string }) {
        const existingName = await this.genreModel.findOne({ where: { name: body.name } });
        if (existingName) throw new BadRequestException('Genre name already exists');

        const existingSlug = await this.genreModel.findOne({ where: { slug: body.slug } });
        if (existingSlug) throw new BadRequestException('Genre slug already exists');

        const genre = await this.genreModel.create({
            name: body.name,
            slug: body.slug,
        });

        return {
            success: 201,
            message: 'Genre created successfully',
            data: genre,
        };
    }

    async update(id: string, body: { name?: string; slug?: string }) {
        const genre = await this.genreModel.findByPk(id);
        if (!genre) {
            throw new NotFoundException(`Genre with ID ${id} not found`);
        }

        if (body.name && body.name !== genre.name) {
            const exists = await this.genreModel.findOne({ where: { name: body.name } });
            if (exists) throw new BadRequestException('Genre name already exists');
        }

        if (body.slug && body.slug !== genre.slug) {
            const exists = await this.genreModel.findOne({ where: { slug: body.slug } });
            if (exists) throw new BadRequestException('Genre slug already exists');
        }

        await genre.update({
            ...(body.name !== undefined && { name: body.name }),
            ...(body.slug !== undefined && { slug: body.slug }),
        });

        return {
            success: 200,
            message: 'Genre updated successfully',
            data: genre,
        };
    }

    async delete(id: string) {
        const genre = await this.genreModel.findByPk(id);
        if (!genre) {
            throw new NotFoundException(`Genre with ID ${id} not found`);
        }

        // Hapus relasi di pivot table dulu
        await this.mangaGenreModel.destroy({ where: { genre_id: id } });
        await genre.destroy();

        return {
            success: 200,
            message: 'Genre deleted successfully',
        };
    }
}
