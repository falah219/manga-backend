// src/chapters/dto/chapter-response.dto.ts

import { ChapterStatus } from "./chapters.model";

export class ChapterResponseDto {
  id: string;

  manga_id: string;

  number: number;

  title: string;

  status: ChapterStatus;

  published_at: Date;

  is_deleted: boolean;

  created_at: Date;

  updated_at: Date;
}