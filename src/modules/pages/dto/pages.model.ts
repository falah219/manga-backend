import { BelongsTo, Column, DataType, ForeignKey, Index, Model, Table } from 'sequelize-typescript';
import { Chapter } from 'src/modules/chapters/dto/chapters.model';

@Table({
    tableName: 'pages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
})
export class Page extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Index({ name: 'uniq_page_chapter_pageno', unique: true })
    @ForeignKey(() => Chapter)
    @Column({ type: DataType.UUID, allowNull: false })
    declare chapter_id: string;

    @Index({ name: 'uniq_page_chapter_pageno', unique: true })
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare page_no: number;

    @BelongsTo(() => Chapter, { onDelete: 'CASCADE' })
    declare chapter?: Chapter;

    @Column({ allowNull: false })
    declare image_url: string;

    @Index
    @Column({ type: DataType.DATE })
    declare created_at: Date;

    @Index
    @Column({ type: DataType.DATE })
    declare updated_at: Date;
}
