// src/mangas/entities/manga.entity.ts
export class Manga {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  year: number;
  cover_url: string;
  view_count: number;
  is_deleted: boolean;
  author_name: string;
  categories: string[];
  created_at: Date;
  updated_at: Date;
}