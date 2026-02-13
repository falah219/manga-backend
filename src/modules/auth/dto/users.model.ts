import {
    Column,
    DataType,
    HasMany,
    Model,
    Table,
    Index,
} from 'sequelize-typescript';
import { UserSession } from './user-sessions.model';

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

@Table({
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class User extends Model {
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    declare id: string;

    @Index
    @Column({ type: DataType.STRING, allowNull: false, unique: true })
    declare username: string;

    @Index
    @Column({ type: DataType.STRING, allowNull: false, unique: true })
    declare email: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare password: string;

    @Column({ type: DataType.STRING, allowNull: false })
    declare name: string;

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.USER,
        allowNull: false,
    })
    declare role: UserRole;

    @HasMany(() => UserSession, { as: 'sessions', onDelete: 'CASCADE', hooks: true })
    declare sessions?: UserSession[];

    @Column({ type: DataType.DATE })
    declare created_at: Date;

    @Column({ type: DataType.DATE })
    declare updated_at: Date;
}

