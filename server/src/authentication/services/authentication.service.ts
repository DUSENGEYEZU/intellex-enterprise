import { UtilsService } from 'src/utils/services/utils.service';
import { OtpService } from '../../utils/services/otp/otp.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { EmailTemplates } from 'src/utils/email.template';
import { Logger } from '@nestjs/common';
import { ResetPasswordDto } from '../dtos/reset-password';

@Injectable()
export class AuthenticationService {

  public constructor(
    private jwtService: JwtService,
    private utilsService: UtilsService,
    private otpService: OtpService,
    @InjectRepository(UserEntity) private user: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity) private userWorkspace: Repository<UserWorkspaceEntity>,
  ) {}
  private readonly logger = new Logger(AuthenticationService.name);

  public async login(username: string, password: string) {
    let payload;
    let res;
    const user = await this.user.findOneBy({ email: username });
    console.log(`---LOGIN USER FOUND---`, JSON.stringify(user))
    const isValidPassword = user ? await bcrypt.compare(password, user?.password) : false;
    if (isValidPassword) {
      payload = {
        sub: user.id,
        data: {
          firstName: user.first_name,
          lastName: user.last_name,
          id: user.id,
        },
      };
      console.log(`---LOGIN IS VALID---`, JSON.stringify(res))
      res = {
        status: true,
        message: 'Success',
        data: payload.data,
        token: await this.jwtService.signAsync(payload),
      };
      return res;
    } else{
      res = { status: false, message: 'Wrong username or password' };
      console.log(`---LOGIN FAILED---`, JSON.stringify(res))
      return res;
    }
  }

  async googleLogin(req){
    if (!req.user) {
      return "No user from Google"
    }
    // Grant access if user is registered. Register otherwise
    const user = await this.user.findOneBy({email: req.user.email})
    if(user){
      return {
        message: "Existing user info from Google",
        user: user,
        state: "EXISTING"
      }
    }else{
      await this.user.save(
        await this.user.create(
          {
          email: req.user.email,
          first_name: req.user.firstName,
          last_name: req.user.lastName
        }
      ));
      return {
        message: "New User info from Google",
        user: user,
        state: "NEW"
      }
    }
  }

  // Verify if the user has access to the requested resource
  async userHasAccess(authorizationHeader, requested_workspace_id: string){
    const token = authorizationHeader.split(' ')[1]; // Extract the token (after 'Bearer')
    try{
      const user = this.jwtService.verify(token, {secret: process.env.SECRET});
      console.log(user)
      const user_workspaces = await this.userWorkspace.findBy({user_id: user.data.id});
      let hasAccess = false;
      user_workspaces.forEach(ws =>{
        if(ws.workspace_id === requested_workspace_id){
          hasAccess = true; //return true if there is a hit
        }
      })
      console.log(hasAccess)
      return hasAccess; //return false if user has no access
    }catch(error){
      console.log(error)
      return false;
    }
  }

  async forgotPassword(email: string) {
    const user = await this.user.findOneBy({email: email})

    if (!user) {
     throw new NotFoundException("The username you entered was not found. Please check and try again.")
    }

    const otp = this.otpService.saveOtp(user.id);
    const resetLink = `${process.env.WEB_CLIENT_URL}/forgot-password?otp=${otp}&otpUsername=${user.email}`;
    const message = EmailTemplates.forgotPasswordLinkEmail(user.first_name, resetLink)

    await this.utilsService.sendEmail(user.email, `${user.first_name}`, "Password Reset", message );

    return { message: 'Password reset email has been sent. Please check your inbox.', status: true };
  }


  async resetPassword(req: ResetPasswordDto) {
    const userFound = await this.user.findOneBy({email: req.email})

    if (!userFound) {
     throw new NotFoundException("The username you entered was not found. Please check and try again.")
    }

    const isOtpValid = this.otpService.verifyOtp(userFound.id, req.otp);

    if(!isOtpValid){  //verify otp
      this.logger.error(`${userFound.email}, Provided a wrong or Expired OTP, Please try again`)
      throw new BadRequestException("Provided a wrong or Expired OTP, Please try again.")
    }

    const updatedUser = this.user.update(
      {id: userFound.id},
      {
        password: await bcrypt.hash(req.password, 10)
      }
    );

    if((await updatedUser).affected) {
      const resetLink = `${process.env.WEB_CLIENT_URL}/login`;
      const message = EmailTemplates.resetPasswordSuccess(userFound.first_name, resetLink)
      await this.utilsService.sendEmail(userFound.email, `${userFound.first_name}`, "Password Reset", message );
      return { status: true, message: 'Success' };
    } else{
        throw new BadRequestException("Failed to reset the password, please try again.!")
    }
  }
}