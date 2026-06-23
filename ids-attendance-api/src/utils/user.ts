import bcrypt from "bcrypt";
import { UserSeedData } from "../types/user.js";
import { Role } from "../../prisma/generated/enums.js";

export function getEmail(user: UserSeedData) {
  return (
    user.email ||
    `${user.firstName.toLowerCase()}.${user.lastName
      .toLowerCase()
      .replace(/\s+/g, "")
      .charAt(0)}@itviadatasolutions.com`
  );
}

export function getInitials(user: UserSeedData) {
  const first = user.firstName?.trim().charAt(0) || "";
  const middle = user.middleName?.trim().charAt(0) || "";
  const last = user.lastName?.trim().charAt(0) || "";

  return `${first}${middle}${last}`;
}

export const getBestUserFullName = (
  firstName: string,
  middleName: string | null | undefined,
  lastName: string
) => `${firstName} ${middleName || ""} ${lastName}`.replace(/\s+/g, " ").trim();

export async function getHashedCredentials(user: UserSeedData) {
  const shortEmployeeCode = user.employeeCode.slice(-3);
  const password = await bcrypt.hash(
    user.password || `${getInitials(user)}@${shortEmployeeCode}`,
    10
  );
  const pin = await bcrypt.hash(user.pin || "2636", 10);
  return { password, pin };
}

export const isRoleAdminOrManager = (r: Role) =>
  r === Role.ADMIN || r === Role.MANAGER;
