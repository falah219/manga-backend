import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGenreDto {
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    name: string;

    @IsNotEmpty({ message: 'Slug is required' })
    @IsString()
    slug: string;
}

export class UpdateGenreDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;
}
