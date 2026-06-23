import { Gender, Role } from "../../prisma/generated/enums.js";

export type UserSeedData = {
  firstName: string;
  middleName?: string;
  lastName: string;
  employeeCode: string;
  role?: Role;
  gender?: Gender;
  email?: string;
  password?: string;
  pin?: string;
  isActive: boolean;
  department?: string;
  dateOfJoining?: Date;
  dateOfBirth?: Date;
};
