import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { User } from './dto/users.model';
import { UserSession } from './dto/user-sessions.model';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
    imports: [
        SequelizeModule.forFeature([User, UserSession]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({}), // secrets handled per-sign in AuthService
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
