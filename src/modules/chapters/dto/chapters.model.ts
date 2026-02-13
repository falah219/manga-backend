import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Index,
    Model,
    Table,
} from 'sequelize-typescript';
import { Manga } from 'src/modules/mangas/dto/mangas.model';
import { Page } from 'src/modules/pages/dto/pages.model';

export enum ChapterStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

@Table({
    tableName: 'chapters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Chapter extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    // composite unique (manga_id, number)
    @Index({ name: 'uniq_chapter_manga_number', unique: true })
    @ForeignKey(() => Manga)
    @Column({ type: DataType.UUID, allowNull: false })
    declare manga_id: string;

    @Index({ name: 'uniq_chapter_manga_number', unique: true })
    @Column({ type: DataType.FLOAT, allowNull: false })
    declare number: number;

    @BelongsTo(() => Manga, { as: 'manga', onDelete: 'CASCADE' })
    declare manga?: Manga;

    @Column({ allowNull: true })
    declare title?: string;

    @Column({
        type: DataType.ENUM(...Object.values(ChapterStatus)),
        defaultValue: ChapterStatus.PUBLISHED,
    })
    declare status: ChapterStatus;

    @Column({ type: DataType.DATE, allowNull: true })
    declare published_at?: Date;

    @Index
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare is_deleted: boolean;

    @HasMany(() => Page, { onDelete: 'CASCADE', hooks: true })
    declare pages?: Page[];

    // index (manga_id, created_at) -> cukup dengan index di manga_id + created_at juga
    @Index({ name: 'idx_chapter_manga_created' })
    @Column({ type: DataType.DATE })
    declare created_at: Date;

    @Index({ name: 'idx_chapter_manga_created' })
    @Column({ type: DataType.DATE })
    declare updated_at: Date;
}
