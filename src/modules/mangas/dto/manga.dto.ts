// src/mangas/dto/manga.dto.ts
import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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