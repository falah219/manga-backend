// src/mangas/dto/manga.dto.ts
import { IsOptional, IsInt, Min, IsString, IsIn, IsNotEmpty, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MangaStatus } from './mangas.model';

// ─── CREATE MANGA DTO ───────────────────────────────────
export class CreateMangaDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Slug is required' })
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MangaStatus, { message: 'Status must be ONGOING, COMPLETED, HIATUS, or CANCELLED' })
  status?: MangaStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  author_name?: string;

  @IsOptional()
  genre_ids?: string; // JSON string dari frontend (multipart), di-parse di controller
}

// ─── UPDATE MANGA DTO ───────────────────────────────────
export class UpdateMangaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MangaStatus, { message: 'Status must be ONGOING, COMPLETED, HIATUS, or CANCELLED' })
  status?: MangaStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  author_name?: string;

  @IsOptional()
  genre_ids?: string; // JSON string dari frontend (multipart), di-parse di controller
}

export class GetAllMangasDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['created_at', 'updated_at', 'title', 'year', 'view_count'])
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: string = 'DESC';
}

export interface PaginationResponse<T> {
  success: Number;
  message: string;
  data: any;
  pagination: {
    page: number;              // Simpler
    limit: number;             // Simpler
    total: number;             // Simpler
    totalPages: number;
    hasNext: boolean;          // Simpler
    hasPrev: boolean;          // Simpler
  };
}