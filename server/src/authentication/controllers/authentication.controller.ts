import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { LoginDto } from '../dtos/login.dto';
import { Public } from '../guards/metadata/metadata';
import { AuthenticationService } from '../services/authentication.service';
import { AuthGuard } from '@nestjs/passport';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password';


@ApiTags('Authentication')
@Controller('auth')
export class AuthenticationController {
  public constructor(
    private authenticationService: AuthenticationService,
  ) {}

  @ApiOperation({ summary: 'Authenticate user' })
  @Post('login')
  @Public()
  public async userLogin(@Body() body: LoginDto) {
    return await this.authenticationService.login(body.username, body.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @Public()
  // async googleAuthLogin(@Req() req){
  // }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Public()
  googleAuthLoginRedirect(@Req() req){
    return this.authenticationService.googleLogin(req);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  public async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authenticationService.forgotPassword(body.email);
  }


  @ApiOperation({ summary: 'Reset Password' })
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  public async resetPassword(@Body() req: ResetPasswordDto) {
    return await this.authenticationService.resetPassword(req);
  }
}
