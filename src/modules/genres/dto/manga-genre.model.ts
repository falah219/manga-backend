import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { Manga } from 'src/modules/mangas/dto/mangas.model';
import { Genre } from './genre.model';

@Table({
    tableName: 'manga_genres',
    timestamps: false,
})
export class MangaGenre extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @ForeignKey(() => Manga)
    @Column({ type: DataType.UUID, allowNull: false })
    declare manga_id: string;

    @ForeignKey(() => Genre)
    @Column({ type: DataType.UUID, allowNull: false })
    declare genre_id: string;

    @BelongsTo(() => Manga)
    declare manga: Manga;

    @BelongsTo(() => Genre)
    declare genre: Genre;
}

