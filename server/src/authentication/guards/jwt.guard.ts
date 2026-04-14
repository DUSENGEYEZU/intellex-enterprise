import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from './metadata/metadata';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  
  public constructor(private reflector: Reflector) {
    super();
  }
  public canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException(); //Intercepts for authenticated user requests 
    }
    return user;
  }
    
}
