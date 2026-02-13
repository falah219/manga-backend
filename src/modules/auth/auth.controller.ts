import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        const deviceInfo = req.headers['user-agent'] || 'Unknown';
        const ipAddress =
            (req.headers['x-forwarded-for'] as string) ||
            req.socket.remoteAddress ||
            'Unknown';

        return this.authService.login(dto, deviceInfo, ipAddress);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.authService.logout(user.userId);
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logoutAll(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.authService.logoutAll(user.userId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.authService.getProfile(user.userId);
    }

    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    async getSessions(@Req() req: Request) {
        const user = req.user as { userId: string };
        return this.authService.getSessions(user.userId);
    }
}
