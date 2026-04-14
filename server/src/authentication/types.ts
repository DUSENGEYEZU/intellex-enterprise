import { UserRole } from './dtos/roles';

export type UserInfo = {
  userId: string;
  userName: string;
  role: UserRole;
};
export type GoogleUser = {
  email: string;
  firstName: string;
  lastName: string;
}
export type GoogleLoginResponse = {
  message: string;
  user: GoogleUser
}
