export interface LoginUser {
  userId: number | string;
  firstName: string;
  lastName: string;
  password?: string | null;
  pin?: string | null;
  isActive: boolean;
  role: string;
  fullName?: string;
}

export interface TokenUser {
  userId: number | string;
  isActive: boolean;
  role: string;
}
