import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UtilsService } from '../../utils/services/utils.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserService {
  public constructor(
    private utilsService: UtilsService,

    @InjectRepository(UserEntity) private user: Repository<UserEntity>,
  ) {}

  //adding user into the database
  public async addUser(first_name: string, last_name: string, email: string, password: string, role: string) {
    if(!first_name && !email){
      return {staus: false, message:"First name and email are required"}
    }
    // TO avoid potential duplication and breaking unique constraint violation, let's first make sure the user email doesn't exist.
    const user = await this.user.findOneBy({ email: email });
    if (user) {
      return await { status: false, message: 'The user already exists.' };
    } else {

      if(!password || password === ''){
        // Autogenerate password
        password = this.generateStrongPassword(16) //Generate strong password of 16 characters
      }
      // Hash password
     // const hashPassword = await bcrypt.hash(password, 10); //saltOrRounds=10
        const hashPassword = await bcrypt.hash(password, 10);
      const created = await this.user.create({
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashPassword,
        role: role
      });

      const results = await this.user.save(created);

      results.password = "";

      // Notify new user via email
      const message = `
        <p>
            Dear ${results.first_name},
        <p>
        <p>
            Welcome to Intellex, Africa's largest API exchange platform. Below are your credentials: <br/><br/>

            <strong>Username:</strong> ${results.email} <br/>
            <strong>Password:</strong> ${password} <br/>
        </p>
        <p style="margin-bottom: 40px;">
            <a href="${process.env.WEB_CLIENT_URL}/login" target="blank" style="padding:10px; border-radius:10px; border:1px solid blue; text-decoration:none;">Click here to Login</a>
        </p>
        <p>
            Best regards, <br/>
            Intellex Team
        </p>
        <hr>
        <p style="color: gray">If you received this message by mistake, please ignore it and delete it immediately.</p>
        `;
      await this.utilsService.sendEmail(
        results.email,
        results.first_name,
        'Welcome to Intellex',
        message,
      );

      return await { status: true, message: 'Success', data: results };
    }
  }
  //edit a user
  public async editUser(id: string, first_name: string, last_name: string, role: string,) {
    const editedUser = await this.user.update(
      { id: id },
      {
        first_name: first_name,
        last_name: last_name,
        role: role
      },
    );
    if (editedUser.affected) {
      return { status: true, message: 'Success' };
    } else {
      return { status: false, message: 'Failed to update the user' };
    }
  }
  //delete a user
  public async deleteUser(id: string) {
    const deletedUser = await this.user.delete(id);
    console.log(deletedUser);
    if (deletedUser.affected) {
      return { status: true, message: 'Success' };
    } else {
      return { status: false, message: 'Failed to update the user' };
    }
  }
  //select all users
  public async selectAllUsers() {
    const selectedUser = await this.user.find();
    return { status: true, message: 'Success', data: selectedUser };
  }
  //select one user
  public async selectOneUser(id: string) {
    const selectedUser = await this.user.findOneBy({ id });
    return { status: true, message: 'Success', data: selectedUser };
  }

  // HELPERS
 public generateStrongPassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = "!@#$%&*()_+~|}{[]\\:;?><,./-=";

  // Combine all character sets
  const allChars = uppercase + lowercase + numbers + specialChars;

  let password = '';
  for (let i = 0; i < length; i++) {
      // Randomly select a character from the combined set
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars[randomIndex];
  }

  // Ensure the password contains at least one character from each set
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+~`|}{[\]\\:;?><,./-=]/.test(password);

  // If any character set is missing, regenerate the password
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      return this.generateStrongPassword(length);
  }

    return password;
  }
}