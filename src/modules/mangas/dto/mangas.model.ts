import {
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    Table,
    Index,
} from 'sequelize-typescript';
import { Chapter } from 'src/modules/chapters/dto/chapters.model';


export enum MangaStatus {
    ONGOING = 'ONGOING',
    COMPLETED = 'COMPLETED',
    HIATUS = 'HIATUS',
    CANCELLED = 'CANCELLED',
}

@Table({
    tableName: 'mangas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Manga extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Index
    @Column({ allowNull: false })
    declare title: string;

    @Column({ allowNull: false, unique: true })
    declare slug: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare description?: string;

    @Index
    @Column({
        type: DataType.ENUM(...Object.values(MangaStatus)),
        defaultValue: MangaStatus.ONGOING,
    })
    declare status: MangaStatus;

    @Index
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare year?: number;

    @Column({ allowNull: true })
    declare cover_url?: string;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    declare view_count: number;

    @Index
    @Column({ type: DataType.BOOLEAN, defaultValue: false })
    declare is_deleted: boolean;

    @Column({ type: DataType.STRING, allowNull: true })
    declare author_name: string;


    @HasMany(() => Chapter, { as: 'chapters', onDelete: 'CASCADE', hooks: true })
    declare chapters?: Chapter[];

    // many-to-many
    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    })
    declare categories: string[];

    // kalau kamu juga mau akses pivot rows langsung:

    @Column({ type: DataType.DATE })
    declare created_at: Date;

    @Column({ type: DataType.DATE })
    declare updated_at: Date;
}
