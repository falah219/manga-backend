import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User } from './dto/users.model';
import { UserSession } from './dto/user-sessions.model';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User) private userModel: typeof User,
        @InjectModel(UserSession) private sessionModel: typeof UserSession,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    // ─── REGISTER ────────────────────────────────────────────
    async register(dto: RegisterDto) {
        // Check if email or username already exists
        const existing = await this.userModel.findOne({
            where: {
                [Op.or]: [{ email: dto.email }, { username: dto.username }],
            },
        });

        if (existing) {
            if (existing.email === dto.email) {
                throw new ConflictException('Email sudah terdaftar');
            }
            throw new ConflictException('Username sudah dipakai');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.userModel.create({
            username: dto.username,
            email: dto.email,
            password: hashedPassword,
            name: dto.name,
        });

        return {
            success: true,
            message: 'Registrasi berhasil',
            data: this.sanitizeUser(user),
        };
    }

    // ─── LOGIN ───────────────────────────────────────────────
    async login(dto: LoginDto, deviceInfo?: string, ipAddress?: string) {
        // Find user by email OR username
        const user = await this.userModel.findOne({
            where: {
                [Op.or]: [
                    { email: dto.identifier },
                    { username: dto.identifier },
                ],
            },
        });

        if (!user) {
            throw new UnauthorizedException('Email/username atau password salah');
        }

        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Email/username atau password salah');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.username, user.role);

        // Hash refresh token and store in session
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await this.sessionModel.create({
            user_id: user.id,
            refresh_token: hashedRefreshToken,
            device_info: deviceInfo || 'Unknown',
            ip_address: ipAddress || 'Unknown',
            expires_at: expiresAt,
        });

        return {
            success: true,
            message: 'Login berhasil',
            data: {
                user: this.sanitizeUser(user),
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        };
    }

    // ─── REFRESH TOKENS ──────────────────────────────────────
    async refreshTokens(refreshToken: string) {
        // Decode the refresh token to get userId
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new ForbiddenException('Refresh token tidak valid atau sudah expired');
        }

        const userId = payload.sub;

        // Find all sessions for this user
        const sessions = await this.sessionModel.findAll({
            where: { user_id: userId },
        });

        // Find the matching session by comparing hashed tokens
        let matchedSession: UserSession | null = null;
        for (const session of sessions) {
            const isMatch = await bcrypt.compare(refreshToken, session.refresh_token);
            if (isMatch) {
                matchedSession = session;
                break;
            }
        }

        if (!matchedSession) {
            throw new ForbiddenException('Refresh token tidak valid');
        }

        // Check if session expired
        if (new Date() > matchedSession.expires_at) {
            await matchedSession.destroy();
            throw new ForbiddenException('Session sudah expired, silakan login ulang');
        }

        // Get user
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new ForbiddenException('User tidak ditemukan');
        }

        // Generate new tokens (rotate)
        const tokens = await this.generateTokens(user.id, user.username, user.role);

        // Update session with new hashed refresh token
        const newHashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);

        await matchedSession.update({
            refresh_token: newHashedRefreshToken,
            expires_at: newExpiresAt,
        });

        return {
            success: true,
            message: 'Token berhasil di-refresh',
            data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        };
    }

    // ─── LOGOUT (current device) ─────────────────────────────
    async logout(userId: string, sessionId?: string) {
        if (sessionId) {
            await this.sessionModel.destroy({
                where: { id: sessionId, user_id: userId },
            });
        } else {
            // If no sessionId provided, delete the most recent session
            const session = await this.sessionModel.findOne({
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
            });
            if (session) await session.destroy();
        }

        return {
            success: true,
            message: 'Logout berhasil',
        };
    }

    // ─── LOGOUT ALL DEVICES ─────────────────────────────────
    async logoutAll(userId: string) {
        const deletedCount = await this.sessionModel.destroy({
            where: { user_id: userId },
        });

        return {
            success: true,
            message: `Logout dari ${deletedCount} device berhasil`,
        };
    }

    // ─── GET SESSIONS ────────────────────────────────────────
    async getSessions(userId: string) {
        const sessions = await this.sessionModel.findAll({
            where: { user_id: userId },
            attributes: ['id', 'device_info', 'ip_address', 'created_at', 'expires_at'],
            order: [['created_at', 'DESC']],
        });

        return {
            success: true,
            message: 'Sessions retrieved successfully',
            data: sessions,
        };
    }

    // ─── GET PROFILE ─────────────────────────────────────────
    async getProfile(userId: string) {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        return {
            success: true,
            message: 'Profile retrieved successfully',
            data: this.sanitizeUser(user),
        };
    }

    // ─── HELPERS ─────────────────────────────────────────────
    private async generateTokens(userId: string, username: string, role: string) {
        const payload = { sub: userId, username, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private sanitizeUser(user: User) {
        const { password, ...result } = user.toJSON();
        return result;
    }
}
