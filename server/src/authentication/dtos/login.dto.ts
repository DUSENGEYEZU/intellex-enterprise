import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  public username: string;

  @ApiProperty()
  public password: string;
}
