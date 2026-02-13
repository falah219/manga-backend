import { BadRequestException, Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { MangaService } from './manga.service';
import { GetAllMangasDto } from './dto/manga.dto';
import { Manga } from './dto/mangas.model';
import { ChapterResponseDto } from '../chapters/dto/chapter.dto';
import { Chapter } from '../chapters/dto/chapters.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/users.model';

@Controller('mangas')
export class MangaController {
    constructor(private readonly mangaService: MangaService) { }

    @Get()
    async getAllMangas(@Query() query: GetAllMangasDto) {
        return this.mangaService.getAllMangas(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string,): Promise<Manga> {
        return await this.mangaService.findOne(id);
    }

    @Get(':id/chapters')
    async getMangaChapters(
        @Param('id', ParseUUIDPipe) mangaId: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('sort', new DefaultValuePipe('ASC')) sort: 'ASC' | 'DESC',
    ): Promise<{
        data: Chapter[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        return await this.mangaService.findChapterByMangaId(mangaId, page, limit, sort);
    }

    @Get(':id/similar')
    async getSimilarManga(@Param('id', ParseUUIDPipe) id: string) {
        const similarManga = await this.mangaService.findSimilarByGenre(id, 6);

        return {
            success: true,
            message: 'Similar manga retrieved successfully',
            data: similarManga
        };
    }

    @Get('dropdown/chapters/:mangaId')
    async getDropdownChapters(@Param('mangaId', ParseUUIDPipe) mangaId: string) {

        const chapters = await this.mangaService.findAllDropdownChapter(mangaId);

        return {
            success: true,
            message: 'Chapters retrieved successfully',
            data: chapters
        };
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('cover')) // ✅ pakai config dari MangaModule
    async create(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any,
        @Req() req: Request,
    ) {
        // kalau cover wajib:
        if (!file) throw new BadRequestException('cover is required');

        let cover_url: string | undefined;
        if (file) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            cover_url = `${baseUrl}/uploads/covers/${file.filename}`;
            console.log(cover_url);

        }

        // multipart => body string
        const year = body.year ? Number(body.year) : undefined;

        let categories: string[] = [];
        if (body.categories) {
            try {
                categories = JSON.parse(body.categories); // kirim '["action","drama"]'
            } catch {
                categories = [String(body.categories)];
            }
        }

        return this.mangaService.create({
            title: body.title,
            slug: body.slug,
            description: body.description,
            status: body.status,
            year,
            cover_url,
            author_name: body.author_name,
            categories,
        });
    }



    // @Get(':slug/similar')
    // async getSimilarManga(@Param('slug') slug: string) {
    //     const similarManga = await this.mangaService.findSimilarByGenre(slug, 5);

    //     return {
    //         success: true,
    //         message: 'Similar manga retrieved successfully',
    //         data: similarManga
    //     };
    // }


}
