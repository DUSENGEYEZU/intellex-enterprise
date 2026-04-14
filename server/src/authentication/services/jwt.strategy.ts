import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigurationService } from 'src/configuration/configuration.service';

import { UserInfo } from '../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  public constructor(private configService: ConfigurationService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.SECRET,
    });
  }

  public async validate(payload): Promise<UserInfo> {
    return {
      userId: payload.data.id,
      userName: payload.data.first_name,
      role: payload.data.role,
    };
  }
}
