
import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from 'src/user/user.module';

import { AuthenticationController } from './controllers/authentication.controller';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/role-guard';
import { AuthenticationService } from './services/authentication.service';
import { JwtStrategy } from './services/jwt.strategy';
import { ConfigurationModule } from '../configuration/configuration.module';
import { ConfigurationService } from '../configuration/configuration.service';
import { REQUEST_USER_KEY } from '../user/constants';
import { UserEntity } from '../user/entities/user.entity';
import { GoogleStrategy } from './google.stategy';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { OtpService } from '../utils/services/otp/otp.service';


@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, UserWorkspaceEntity]),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: REQUEST_USER_KEY,
      session: false,
    }),
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: (configService: ConfigurationService) => ({
        secret: configService.SECRET,
      }),
    }),
    forwardRef(() => UserModule),
    ConfigurationModule,
    UtilsModule,
  ],
  providers: [

    AuthenticationService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    GoogleStrategy,
    OtpService
  ],
  controllers: [AuthenticationController],
  exports: [PassportModule, OtpService],
})
export class AuthenticationModule {}
