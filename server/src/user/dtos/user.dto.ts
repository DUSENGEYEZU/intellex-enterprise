import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  public first_name: string;

  @ApiProperty()
  public last_name: string;

  @ApiProperty()
  public email: string; 

  @ApiProperty()
  public password: string; 

  @ApiProperty()
  public role: string;
}

export class UpdateUserDto {
  @ApiProperty()
  public first_name: string;

  @ApiProperty()
  public last_name: string;
  
  @ApiProperty()
  public role: string;
}
