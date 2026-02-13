import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Order, Sequelize } from 'sequelize';
import { Manga } from 'src/modules/mangas/dto/mangas.model';
import { Chapter, ChapterStatus } from '../chapters/dto/chapters.model';
import { GetAllMangasDto, PaginationResponse } from './dto/manga.dto';
// import { Author } from './models/author.model';
// import { MangaCategory } from './models/manga-category.model';
// import { Category } from './models/category.model';

@Injectable()
export class MangaService {
    constructor(
        @InjectModel(Manga) private mangaModel: typeof Manga,
        @InjectModel(Chapter) private chapterModel: typeof Chapter,
    ) { }

    async create(body: {
        title: string;
        slug: string;
        description?: string;
        status?: any;
        year?: number;
        cover_url?: string;
        author_name?: string;
        categories?: string[];
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
            categories: body.categories || [],
        });

        return this.findOneBySlug(body.slug);
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

        // Category filter (JSONB contains)
        if (category) {
            whereClause.categories = {
                [Op.contains]: [category],
            };
        }

        // Build order clause with proper typing
        const orderClause: Order = [[sortBy, sortOrder]];

        // Get total count
        const totalItems = await this.mangaModel.count({
            where: whereClause,
        });

        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated data
        const mangas = await this.mangaModel.findAll({
            where: whereClause,
            order: orderClause,
            limit: limit,
            offset: offset,
            attributes: {
                exclude: ['is_deleted'],
            },
        });

        // console.log(mangas);

        const transformedMangas = mangas.map(manga => {
            const data = manga.toJSON(); // Convert Sequelize instance ke plain object

            return {
                id: data.id,
                title: data.title,
                slug: data.slug,
                description: data.description,
                status: data.status, // COMPLETED -> completed
                year: data.year,
                cover_url: data.cover_url,           // snake_case -> camelCase
                view_count: data.view_count,         // snake_case -> camelCase
                is_deleted: data.is_deleted,
                author_name: data.author_name,           // Simplify field name
                categories: data.categories,
                created_at: data.created_at,
                updated_at: data.updated_at,
            };
        });


        return {
            success: 200,
            message: 'Manga list retrieved successfully',
            data: transformedMangas,              // ✅ Flat, bukan nested
            pagination: {
                page: page,                          // ✅ Rename dari currentPage
                limit: limit,                        // ✅ Rename dari itemsPerPage
                total: totalItems,                   // ✅ Rename dari totalItems
                totalPages: totalPages,
                hasNext: page < totalPages,          // ✅ Rename dari hasNextPage
                hasPrev: page > 1,                   // ✅ Rename dari hasPrevPage
            }
        };
    }

    async findOne(id: string): Promise<any> {
        const manga = await this.mangaModel.findOne({
            where: {
                id,
                is_deleted: false
            },
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
            ],
            order: [[{ model: Chapter, as: 'chapters' }, 'number', 'DESC']],
        });

        if (!manga) throw new NotFoundException('Manga not found');
        return manga;
    }

    async findSimilarByGenre(id: string, limit: number) {
        const manga = await this.mangaModel.findByPk(id);
        //console.log(manga);

        if (!manga || manga.is_deleted) {
            throw new NotFoundException(`Manga with ID ${id} not found`);
        }

        const similarManga = await this.mangaModel.findAll({
            where: {
                [Op.or]: manga.categories.map(category => ({
                    categories: {
                        [Op.contains]: category
                    }
                })),
                id: {
                    [Op.ne]: id
                },
                is_deleted: false,
            },
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
