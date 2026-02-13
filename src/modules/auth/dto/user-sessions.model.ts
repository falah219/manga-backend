import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
    Index,
} from 'sequelize-typescript';
import { User } from './users.model';

@Table({
    tableName: 'user_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
})
export class UserSession extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Index
    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    declare user_id: string;

    @Column({ type: DataType.TEXT, allowNull: false })
    declare refresh_token: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare device_info: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare ip_address: string;

    @Column({ type: DataType.DATE, allowNull: false })
    declare expires_at: Date;

    @BelongsTo(() => User)
    declare user?: User;

    @Column({ type: DataType.DATE })
    declare created_at: Date;
}
