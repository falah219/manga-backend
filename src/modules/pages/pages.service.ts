import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { join } from 'path';
import { mkdirSync, renameSync } from 'fs';
import { Page } from './dto/pages.model';
import { Chapter } from '../chapters/dto/chapters.model';
import { Manga } from '../mangas/dto/mangas.model';

@Injectable()
export class PagesService {
    constructor(
        @InjectModel(Page) private pageModel: typeof Page,
        @InjectModel(Chapter) private chapterModel: typeof Chapter,
        @InjectModel(Manga) private mangaModel: typeof Manga,
    ) { }

    async uploadPages(
        chapterId: string,
        files: Express.Multer.File[],
        baseUrl: string,
    ) {
        // 1. Validasi chapter + ambil data manga
        const chapter = await this.chapterModel.findByPk(chapterId, {
            include: [{ model: Manga, as: 'manga' }],
        });
        if (!chapter || chapter.is_deleted) {
            throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
        }

        const manga = chapter.manga;
        if (!manga) {
            throw new NotFoundException(`Manga for chapter ${chapterId} not found`);
        }

        // 2. Buat folder: uploads/{manga-slug}/{chapter-number}
        const folderRelative = `uploads/${manga.slug}/chapter-${chapter.number}`;
        const folderAbsolute = join(process.cwd(), folderRelative);
        mkdirSync(folderAbsolute, { recursive: true });

        // 3. Cari page_no tertinggi yang sudah ada
        const lastPage = await this.pageModel.findOne({
            where: { chapter_id: chapterId },
            order: [['page_no', 'DESC']],
        });
        let nextPageNo = lastPage ? lastPage.page_no + 1 : 1;

        // 4. Pindahkan file dari temp ke folder terorganisir, lalu buat record
        const pages: Page[] = [];
        for (const file of files) {
            const tempPath = file.path; // uploads/_temp/page-xxx.jpg
            const finalPath = join(folderAbsolute, file.filename);

            // Pindahkan file
            renameSync(tempPath, finalPath);

            const imageUrl = `${baseUrl}/${folderRelative}/${file.filename}`;
            const page = await this.pageModel.create({
                chapter_id: chapterId,
                page_no: nextPageNo,
                image_url: imageUrl,
            });
            pages.push(page);
            nextPageNo++;
        }

        return {
            code: 201,
            message: `${pages.length} page(s) uploaded successfully`,
            data: pages,
        };
    }

    async getPagesByChapter(chapterId: string) {
        const chapter = await this.chapterModel.findByPk(chapterId);
        if (!chapter || chapter.is_deleted) {
            throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
        }

        const pages = await this.pageModel.findAll({
            where: { chapter_id: chapterId },
            order: [['page_no', 'ASC']],
        });

        // Cari chapter sebelumnya (number lebih kecil, terdekat)
        const prevChapter = await this.chapterModel.findOne({
            where: {
                manga_id: chapter.manga_id,
                number: { [Op.lt]: chapter.number },
                is_deleted: false,
            },
            order: [['number', 'DESC']],
            attributes: ['id', 'number', 'title'],
        });

        // Cari chapter selanjutnya (number lebih besar, terdekat)
        const nextChapter = await this.chapterModel.findOne({
            where: {
                manga_id: chapter.manga_id,
                number: { [Op.gt]: chapter.number },
                is_deleted: false,
            },
            order: [['number', 'ASC']],
            attributes: ['id', 'number', 'title'],
        });

        return {
            code: 200,
            message: 'Pages retrieved successfully',
            data: pages,
            navigation: {
                current_chapter: { id: chapter.id, number: chapter.number, title: chapter.title },
                prev_chapter: prevChapter ?? null,
                next_chapter: nextChapter ?? null,
            },
        };
    }
}

