import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';
import { Public } from 'src/authentication/guards/metadata/metadata';

@ApiTags('User')
@Controller('user')
export class UserController {
  public constructor(private userService: UserService) {}

  // create a new user
  @Public()
  @ApiOperation({ summary: 'Create a new user' })
  @Post()
  public async createUser(@Body() body: CreateUserDto) {
    const user = await this.userService.addUser(
      body.first_name,
      body.last_name,
      body.email,
      body.password,
      body.role
    );
    return user;
  }
  // edit user
  @ApiOperation({ summary: ' a user' })
  @Patch('/:id')
  public async editUser(@Body() body: UpdateUserDto, @Param('id') id: string) {
    return await this.userService.editUser(id, body.first_name, body.last_name, body.role);
  }
  // delete user 
  @ApiOperation({ summary: 'Delete user by id' })
  @Delete('/:id')
  public async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(id);
  }
  //select one user
  @ApiOperation({ summary: 'Select one user by user id' })
  @Get('/:id')
  public async selectOneUser(@Param('id') id: string) {
    return await this.userService.selectOneUser(id);
  }
  //select all users
  // @ApiOperation({ summary: 'Select all users' })
  // @Get('/')
  // public async selectAllUsers() {
  //   return await this.userService.selectAllUsers();
  // }
}
