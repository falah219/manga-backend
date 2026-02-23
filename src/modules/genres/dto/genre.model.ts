import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
    Index,
} from 'sequelize-typescript';
import { Manga } from 'src/modules/mangas/dto/mangas.model';
import { MangaGenre } from './manga-genre.model';

@Table({
    tableName: 'genres',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Genre extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Index
    @Column({ allowNull: false, unique: true })
    declare name: string;

    @Column({ allowNull: false, unique: true })
    declare slug: string;

    @BelongsToMany(() => Manga, () => MangaGenre)
    declare mangas?: Manga[];

    @Column({ type: DataType.DATE })
    declare created_at: Date;

    @Column({ type: DataType.DATE })
    declare updated_at: Date;
}
