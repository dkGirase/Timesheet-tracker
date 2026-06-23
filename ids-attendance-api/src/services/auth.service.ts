import camelcaseKeys from "camelcase-keys";
import { prisma } from "../lib/prisma.js";

export async function getLoginUserWithRawQuery(identifier: string) {
  let column;

  if (typeof identifier === "number") {
    column = "u.id";
  } else if (/^\d{4}$/.test(identifier)) {
    column = "u.employee_code";
  } else {
    column = "u.email";
  }

  const query = `
  SELECT
    u.id AS "userId",
    u.email,
    u.password,
    u.pin,
    u.role,
    u.employee_code AS "employeeCode",
    u.is_active AS "isActive",

    ui.first_name AS "firstName",
    ui.last_name AS "lastName",
    ui.gender AS "gender",
    ui.date_of_birth AS "dateOfBirth",
    ui.date_of_joining AS "dateOfJoining"

  FROM users u
  LEFT JOIN users_info ui ON ui.user_id = u.id
  WHERE ${column} = $1 AND u.is_active = true
`;

  const result: any = await prisma.$queryRawUnsafe(query, identifier);

  if (result.length === 0) return null;

  const base = camelcaseKeys(result[0], { deep: true });

  const user = {
    userId: base.userId,
    email: base.email,
    password: base.password,
    employeeCode: base.employeeCode,
    pin: base.pin,
    role: base.role,
    isActive: base.isActive,

    firstName: base.firstName,
    lastName: base.lastName,
    gender: base.gender,
    dateOfBirth: base.dateOfBirth,
    dateOfJoining: base.dateOfJoining,
  };

  return user;
}

export async function getManagerNameForUser(userId: number, role: string) {
  // 1️⃣ If user is MANAGER
  if (role === "MANAGER") {
    return "Kamlesh Thakur";
  }

  // 2️⃣ Fetch team manager
  const managerResult: any = await prisma.$queryRawUnsafe(
    `
    SELECT 
      ui.first_name AS "firstName",
      ui.last_name AS "lastName"
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    JOIN users u ON u.id = t.manager_id
    JOIN users_info ui ON ui.user_id = u.id
    WHERE tm.user_id = $1
    LIMIT 1
  `,
    userId,
  );

  if (!managerResult || managerResult.length === 0) {
    return null;
  }

  return `${managerResult[0].firstName} ${managerResult[0].lastName}`;
}
