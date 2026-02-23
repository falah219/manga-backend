import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Order, Sequelize } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';
import { Manga } from 'src/modules/mangas/dto/mangas.model';
import { Chapter, ChapterStatus } from '../chapters/dto/chapters.model';
import { GetAllMangasDto, PaginationResponse } from './dto/manga.dto';
import { Genre } from '../genres/dto/genre.model';
import { MangaGenre } from '../genres/dto/manga-genre.model';

@Injectable()
export class MangaService {
    constructor(
        @InjectModel(Manga) private mangaModel: typeof Manga,
        @InjectModel(Chapter) private chapterModel: typeof Chapter,
        @InjectModel(Genre) private genreModel: typeof Genre,
        @InjectModel(MangaGenre) private mangaGenreModel: typeof MangaGenre,
    ) { }

    async create(body: {
        title: string;
        slug: string;
        description?: string;
        status?: any;
        year?: number;
        cover_url?: string;
        author_name?: string;
        genre_ids?: string[];
    }) {
        const exists = await this.mangaModel.findOne({ where: { slug: body.slug } });
        if (exists) throw new BadRequestException('Slug already exists');

        const manga = await this.mangaModel.create({
            title: body.title,
            slug: body.slug,
            description: body.description,
            status: body.status,
            year: body.year,
            cover_url: body.cover_url,
            author_name: body.author_name,
        });

        // Set genre relations
        if (body.genre_ids && body.genre_ids.length > 0) {
            await manga.$set('genres', body.genre_ids);
        }

        return this.findOneBySlug(body.slug);
    }

    async update(id: string, body: {
        title?: string;
        slug?: string;
        description?: string;
        status?: any;
        year?: number;
        cover_url?: string;
        author_name?: string;
        genre_ids?: string[];
    }) {
        const manga = await this.mangaModel.findByPk(id);
        if (!manga || manga.is_deleted) {
            throw new NotFoundException(`Manga with ID ${id} not found`);
        }

        // Check slug uniqueness if slug is being changed
        if (body.slug && body.slug !== manga.slug) {
            const slugExists = await this.mangaModel.findOne({ where: { slug: body.slug } });
            if (slugExists) throw new BadRequestException('Slug already exists');
        }

        // Hapus file cover lama jika ada cover baru
        if (body.cover_url && manga.cover_url) {
            try {
                const oldFilename = manga.cover_url.split('/uploads/covers/')[1];
                if (oldFilename) {
                    const oldPath = path.join('./uploads/covers', oldFilename);
                    fs.unlinkSync(oldPath);
                }
            } catch (err) {
                // Ignore jika file tidak ditemukan
                console.warn('Old cover file not found, skipping delete:', err.message);
            }
        }

        await manga.update({
            ...(body.title !== undefined && { title: body.title }),
            ...(body.slug !== undefined && { slug: body.slug }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.status !== undefined && { status: body.status }),
            ...(body.year !== undefined && { year: body.year }),
            ...(body.cover_url !== undefined && { cover_url: body.cover_url }),
            ...(body.author_name !== undefined && { author_name: body.author_name }),
        });

        // Update genre relations if provided
        if (body.genre_ids !== undefined) {
            await manga.$set('genres', body.genre_ids);
        }

        // Reload with genres
        const updated = await this.mangaModel.findByPk(id, {
            include: [{ model: Genre, attributes: ['id', 'name', 'slug'] }],
        });

        return {
            success: 200,
            message: 'Manga updated successfully',
            data: updated,
        };
    }


    async delete(id: string) {
        const manga = await this.mangaModel.findByPk(id);
        if (!manga) {
            throw new NotFoundException(`Manga with ID ${id} not found`);
        }

        manga.is_deleted = true;
        await manga.save();

        return {
            success: 200,
            message: 'Manga deleted successfully',
        };
    }

    async getAllMangas(query: GetAllMangasDto): Promise<PaginationResponse<Manga>> {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            category,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = query;

        const offset = (page - 1) * limit;

        // Build where clause
        const whereClause: any = {
            is_deleted: false,
        };

        // Search filter
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { author_name: { [Op.iLike]: `%${search}%` } },
            ];
        }

        // Status filter
        if (status) {
            whereClause.status = status;
        }

        // Category/genre filter — find manga IDs that have this genre slug
        if (category) {
            const mangaIds = await this.mangaGenreModel.findAll({
                attributes: ['manga_id'],
                include: [{
                    model: Genre,
                    where: { slug: category },
                    attributes: [],
                }],
                raw: true,
            });
            const ids = mangaIds.map((mg: any) => mg.manga_id);
            whereClause.id = { [Op.in]: ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'] };
        }

        // Build order clause with proper typing
        const orderClause: Order = [[sortBy, sortOrder]];

        // Get total count
        const totalItems = await this.mangaModel.count({
            where: whereClause,
        });

        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated data with genres included
        const mangas = await this.mangaModel.findAll({
            where: whereClause,
            order: orderClause,
            limit: limit,
            offset: offset,
            attributes: {
                exclude: ['is_deleted'],
            },
            include: [{ model: Genre, attributes: ['id', 'name', 'slug'] }],
        });

        const transformedMangas = mangas.map(manga => {
            const data = manga.toJSON();

            return {
                id: data.id,
                title: data.title,
                slug: data.slug,
                description: data.description,
                status: data.status,
                year: data.year,
                cover_url: data.cover_url,
                view_count: data.view_count,
                author_name: data.author_name,
                genres: data.genres || [],
                created_at: data.created_at,
                updated_at: data.updated_at,
            };
        });


        return {
            success: 200,
            message: 'Manga list retrieved successfully',
            data: transformedMangas,
            pagination: {
                page: page,
                limit: limit,
                total: totalItems,
                totalPages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            }
        };
    }

    async findOne(id: string): Promise<any> {
        const manga = await this.mangaModel.findOne({
            where: {
                id,
                is_deleted: false
            },
            include: [{ model: Genre, attributes: ['id', 'name', 'slug'] }],
        });

        if (!manga) {
            throw new NotFoundException(`Manga with ID ${id} not found`);
        }


        return {
            success: 200,
            message: 'Manga detail retrieved successfully',
            data: manga,
        };

    }

    async findChapterByMangaId(
        mangaId: string,
        page = 1,
        limit = 10,
        sort: 'ASC' | 'DESC' = 'ASC',
    ): Promise<{
        code: Number,
        message: String,
        data: Chapter[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        // Validate manga exists
        const manga = await this.mangaModel.findByPk(mangaId);
        if (!manga || manga.is_deleted) {
            throw new NotFoundException(`Manga with ID ${mangaId} not found`);
        }

        // FIXED: findAndCount return { rows, count }
        const result = await this.chapterModel.findAndCountAll({
            where: {
                manga_id: mangaId,
                is_deleted: false,
            },
            order: [['number', sort]], // FIXED: Order syntax untuk Sequelize
            limit,
            offset: (page - 1) * limit,
        });

        const { rows: data, count: total } = result;

        return {
            code: 200,
            message: 'Retrieve Chapter by Manga is Successful',
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneBySlug(slug: string) {
        const manga = await this.mangaModel.findOne({
            where: { slug, is_deleted: false },
            include: [
                { model: Chapter, as: 'chapters', required: false, where: { is_deleted: false } },
                { model: Genre, attributes: ['id', 'name', 'slug'] },
            ],
            order: [[{ model: Chapter, as: 'chapters' }, 'number', 'DESC']],
        });

        if (!manga) throw new NotFoundException('Manga not found');
        return manga;
    }

    async findSimilarByGenre(id: string, limit: number) {
        const manga = await this.mangaModel.findByPk(id, {
            include: [{ model: Genre, attributes: ['id'] }],
        });

        if (!manga || manga.is_deleted) {
            throw new NotFoundException(`Manga with ID ${id} not found`);
        }

        const genreIds = (manga.genres || []).map(g => g.id);

        if (genreIds.length === 0) {
            return [];
        }

        // Find manga IDs that share at least one genre
        const mangaGenreRows = await this.mangaGenreModel.findAll({
            attributes: ['manga_id'],
            where: {
                genre_id: { [Op.in]: genreIds },
                manga_id: { [Op.ne]: id },
            },
            group: ['manga_id'],
            raw: true,
        });

        const similarIds = mangaGenreRows.map((row: any) => row.manga_id);

        if (similarIds.length === 0) {
            return [];
        }

        const similarManga = await this.mangaModel.findAll({
            where: {
                id: { [Op.in]: similarIds },
                is_deleted: false,
            },
            include: [{ model: Genre, attributes: ['id', 'name', 'slug'] }],
            limit,
            order: Sequelize.literal('RANDOM()'),
        });

        return similarManga;
    }

    async findAllDropdownChapter(mangaId: string) {

        const chapters = await this.chapterModel.findAll({
            where: { manga_id: mangaId, is_deleted: false },
            attributes: ['id', 'title', 'number'],
            order: [['number', 'ASC']],
        });

        return chapters;
    }

}

