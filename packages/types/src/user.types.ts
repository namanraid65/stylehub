import { UserRole } from './enums';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | undefined;
  phone?: string | undefined;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAddress {
  _id: string;
  user: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

// Shape returned from /auth endpoints (no passwordHash)
export type IPublicUser = Omit<IUser, 'passwordHash'>;

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResponse {
  user: IPublicUser;
  tokens: IAuthTokens;
}
