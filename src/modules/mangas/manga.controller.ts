import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { MangaService } from './manga.service';
import { CreateMangaDto, GetAllMangasDto, UpdateMangaDto } from './dto/manga.dto';
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
            cover_url = `/uploads/covers/${file.filename}`;
            console.log(cover_url);

        }

        // multipart => body string
        const year = body.year ? Number(body.year) : undefined;

        let genre_ids: string[] = [];
        if (body.genre_ids) {
            try {
                genre_ids = JSON.parse(body.genre_ids); // kirim '["uuid1","uuid2"]'
            } catch {
                genre_ids = [String(body.genre_ids)];
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
            genre_ids,
        });
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UseInterceptors(FileInterceptor('cover'))
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: UpdateMangaDto,
        @Req() req: Request,
    ) {
        let cover_url: string | undefined;
        if (file) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            cover_url = `/uploads/covers/${file.filename}`;
        }

        const year = body.year ? Number(body.year) : undefined;

        let genre_ids: string[] | undefined;
        if (body.genre_ids) {
            try {
                genre_ids = JSON.parse(body.genre_ids);
            } catch {
                genre_ids = [String(body.genre_ids)];
            }
        }

        return this.mangaService.update(id, {
            ...(body.title && { title: body.title }),
            ...(body.slug && { slug: body.slug }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.status && { status: body.status }),
            ...(year !== undefined && { year }),
            ...(cover_url && { cover_url }),
            ...(body.author_name !== undefined && { author_name: body.author_name }),
            ...(genre_ids && { genre_ids }),
        });
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.mangaService.delete(id);
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
