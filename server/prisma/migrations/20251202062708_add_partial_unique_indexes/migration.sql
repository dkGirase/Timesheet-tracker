CREATE UNIQUE INDEX users_email_unique_not_null
  ON users (email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX users_employee_code_unique_not_null
  ON users (employee_code)
  WHERE employee_code IS NOT NULL;
