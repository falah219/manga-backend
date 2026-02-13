import {
    BadRequestException,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Req,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) { }

    /**
     * POST /pages/upload/:chapterId
     * Upload multiple page images for a chapter.
     * Body: multipart/form-data, field name "pages" (array of image files)
     */
    @Post('upload/:chapterId')
    @UseInterceptors(FilesInterceptor('pages', 100)) // max 100 files per request
    async uploadPages(
        @Param('chapterId', ParseUUIDPipe) chapterId: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: Request,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('At least one page image is required');
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return this.pagesService.uploadPages(chapterId, files, baseUrl);
    }

    /**
     * GET /pages/:chapterId
     * Get all pages for a chapter, ordered by page_no ASC.
     */
    @Get(':chapterId')
    async getPagesByChapter(
        @Param('chapterId', ParseUUIDPipe) chapterId: string,
    ) {
        return this.pagesService.getPagesByChapter(chapterId);
    }
}
