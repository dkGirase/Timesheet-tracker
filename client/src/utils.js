import { dayNames, HALF_DAY, HALF_DAY_LABEL, ROLES } from "@/constants";
import { format } from "date-fns";
import { WEEK_DAYS } from "./constants";

export const getWebClientPlatform = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobile|blackberry|windows phone/i.test(ua)
    ? "mobile-web"
    : "desktop-web";
};

export const getDeviceOperatingSystem = () => {
  const ua = window.navigator.userAgent.toLowerCase();

  if (ua.includes("windows nt")) return "Windows";
  if (ua.includes("mac os x")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod"))
    return "iOS";
  if (ua.includes("linux")) return "Linux";

  return "Unknown";
};

export const isUrl = (string) => {
  const regex =
    /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/;
  return regex.test(string);
};

export const isNotBlank = (v) => v.trim().length > 0;

export const isBlank = (v) => v.trim().length === 0;

export const pluralize = (word, count) => {
  if (count === 1) return word;

  // Irregular plurals
  const irregulars = {
    person: "people",
    man: "men",
    woman: "women",
  };

  if (irregulars[word.toLowerCase()]) {
    return irregulars[word.toLowerCase()];
  }

  // Words ending in 'y' preceded by a consonant (e.g., "city" → "cities")
  if (word.match(/[^aeiou]y$/i)) {
    return word.replace(/y$/i, "ies");
  }

  // Words ending in 's', 'sh', 'ch', 'x', or 'z' (e.g., "bus" → "buses")
  if (word.match(/(s|sh|ch|x|z)$/i)) {
    return word + "es";
  }

  // Default: just add 's'
  return word + "s";
};

export const isNumbersOnly = (s) => /^\d*$/.test(s);

export const allowOnlyAlphabets = (value) => {
  return /^[A-Za-z\s]*$/.test(value);
};

export const getPasswordValidationError = (password = "") => {
  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must include at least one uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must include at least one lowercase letter.";
  if (!/[0-9]/.test(password))
    return "Password must include at least one number.";
  if (!/[!@#$%^&*()\-_=+[\]{}|;:',.<>/?`~]/.test(password)) {
    return "Password must include at least one special character.";
  }
  return null; // Valid
};

export const getPinValidationError = (pin = "") => {
  if (!/^\d{4}$/.test(pin)) return "PIN must be exactly 4 numeric digits.";
  return null;
};

export const getEmpCodeValidationError = (pin = "") => {
  if (!/^\d{4}$/.test(pin))
    return "Employee code must be exactly 4 numeric digits.";
  return null;
};

export const getEmailValidationError = (email = "") => {
  if (!email) return "Email is required.";

  email = email.trim();

  // General email validation pattern (valid email format, doesn't restrict domains)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Please enter a valid email address.";
  }

  return null; // Return null if the email is valid
};


export const allowOnlyNumbers = (value) => {
  return value.replace(/[^0-9]/g, "");
};

export const formatDayMonthInput = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 8); // allow YYYY
  let day = "";
  let month = "";
  let year = "";

  if (digits.length === 0) return "";

  // DAY
  if (digits.length === 1) {
    day = Number(digits) > 3 ? `0${digits}` : digits;
  } else {
    day = digits.slice(0, 2);
  }

  if (digits.length <= 2) return day;

  // MONTH
  const rest = digits.slice(2);
  if (rest.length === 1) {
    month = Number(rest) > 1 ? `0${rest}` : rest;
  } else {
    month = rest.slice(0, 2);
  }

  if (digits.length <= 4) return `${day}/${month}`;

  // YEAR
  year = digits.slice(4, 8);

  return `${day}/${month}/${year}`;
};

export const getShortDays = dayNames.map((d) => d.slice(0, 3));

export const formatDate = (date) => {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
};

export const TRUNCATE_LEN = 60;

export function truncateReason(text, n = TRUNCATE_LEN) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

export const parseBackendError = (err) => {
  let message = "Something went wrong";

  const backendMessage =
    (err && err.response && err.response.data && err.response.data.message) ||
    err?.message;

  if (!backendMessage) return message;

  try {
    const parsed = JSON.parse(backendMessage);

    // Zod validation error (array of errors)
    if (Array.isArray(parsed) && parsed[0] && parsed[0].message) {
      const zodMessage = parsed[0].message;

      // Human-friendly mapping for "too_small" errors
      if (zodMessage.includes("expected string to have >=")) {
        const match = zodMessage.match(/\d+/);
        const min = match ? match[0] : "some";
        return `Please enter at least ${min} characters for the leave reason.`;
      }

      return zodMessage;
    }

    if (parsed && parsed.message) {
      return parsed.message;
    }

    return backendMessage;
  } catch (e) {
    console.error(e);
    return backendMessage;
  }
};

export function formatDateDDMMYYYY(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export const formatTeamWeekends = (teamWeekends = []) => {
  if (!teamWeekends.length) return "";

  return teamWeekends
    .map((value) => WEEK_DAYS.find((d) => d.value === value)?.label)
    .filter(Boolean)
    .join(", ");
};

export function generateLeaveSummary(
  daysInRange,
  halfDays,
  // 1. ADD NEW PARAMETER WITH DEFAULT VALUE
  phrase = "You will be applying",
  teamWeekends = []
) {
  if (!daysInRange?.length) return "";

  const half = [];
  const full = [];

  daysInRange.forEach((d) => {
    const key = format(d, "yyyy-MM-dd");
    if (halfDays[key]) half.push({ date: d, type: halfDays[key] });
    else full.push(d);
  });

  let summary = "";

  if (half.length) {
    summary +=
      half
        .map(
          // 2. USE THE NEW 'phrase' VARIABLE
          (h) =>
            `${phrase} half day leave (${
              h.type === HALF_DAY.FIRST
                ? HALF_DAY_LABEL.FIRST_HALF
                : HALF_DAY_LABEL.SECOND_HALF
            }) for ${format(h.date, "dd MMMM yyyy")} (0.5 days).`
        )
        .join("\n") + "\n";
  }

  if (full.length) {
    const sameMonthYear = full.every(
      (d) => format(d, "MMMM yyyy") === format(full[0], "MMMM yyyy")
    );

    if (sameMonthYear) {
      const dates = full.map((d) => format(d, "dd")).join(", ");
      // 3. USE THE NEW 'phrase' VARIABLE
      summary += `${phrase} full day leaves for ${dates} ${format(
        full[0],
        "MMMM yyyy"
      )} (${full.length} days).\n`;
    } else {
      const fullDates = full.map((d) => format(d, "dd MMMM yyyy")).join(", ");
      // 4. USE THE NEW 'phrase' VARIABLE
      summary += `${phrase} full day leaves for ${fullDates} (${full.length} days).\n`;
    }
  }

  summary += "These days exclude Company holidays and Team weekly offs";

  if (teamWeekends.length) {
    const weekendLabel = formatTeamWeekends(teamWeekends);
    if (weekendLabel) {
      summary += `(${weekendLabel}).`;
    }
  }

  return summary;
}

export const getRoleBasedHomeLink = (role) => {
  if (role === ROLES.ADMIN) return "/dashboard";
  if (role === ROLES.MANAGER) return "/my-team";
  return "/calendar";
};

export const isRoleAdminOrManager = (r) =>
  r === ROLES.ADMIN || r === ROLES.MANAGER;

export const getInitials = (first, last) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

function getRandomChar(str) {
  return str.charAt(Math.floor(Math.random() * str.length));
}

export const generateValidPassword = (length = 8) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()-_=+[]{}|;:',.<>/?`~";

  const allChars = uppercase + lowercase + numbers + specialChars;

  let password = "";

  // Ensure at least one char from each required category:
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(numbers);
  password += getRandomChar(specialChars);

  // Fill the rest with random chars:
  for (let i = 4; i < length; i++) {
    password += getRandomChar(allChars);
  }

  // Shuffle to avoid predictable pattern
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
};

export const isValidPassword = (password = "") => {
  const minLength = 8;
  const uppercase = /[A-Z]/;
  const lowercase = /[a-z]/;
  const number = /[0-9]/;
  const specialChar = /[!@#$%^&*()\-_=+[\]{}|;:',.<>/?`~]/;

  return (
    password.length >= minLength &&
    uppercase.test(password) &&
    lowercase.test(password) &&
    number.test(password) &&
    specialChar.test(password)
  );
};

export const generateValidPin = () => {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
};

export const isValidPin = (pin = "") => {
  return /^\d{4}$/.test(pin);
};

export function getRequestsTitle(requestFilter) {
  switch (requestFilter) {
    case "LEAVE":
      return "Leave Requests";
    case "OVERTIME":
      return "Overtime Requests";
    default:
      return "Requests";
  }
}

export function getMonthlyDayDates(currentMonth, currentYear, weekdays) {
  if (!weekdays || weekdays.length === 0) return [];
  const dayMap = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  // Month is zero-indexed (0 = January, 11 = December)
  const month = currentMonth - 1; // Adjust for zero-indexed month

  // Get the total number of days in the month
  const lastDayOfMonth = new Date(currentYear, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Initialize an array to hold the dates for the specified weekdays
  const weekdaysInMonth = [];

  // Convert the provided weekdays to their numeric values
  const targetDays = weekdays.map((day) => dayMap[day]);

  // Loop through all days of the month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const currentDate = new Date(currentYear, month, day);

    // Check the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = currentDate.getDay();

    // If the current day is one of the target weekdays, add it to the result
    if (targetDays.includes(dayOfWeek)) {
      // Add the date (in YYYY-MM-DD format) to the weekdaysInMonth array
      weekdaysInMonth.push(formatDate(currentDate)); // Format as YYYY-MM-DD
    }
  }

  return weekdaysInMonth;
}

export const parseExcelDate = (value) => {
  if (!value) return null;

  // Force string handling
  const str = String(value).trim();

  if (!str.includes("/")) return null;

  let [day, month, year] = str.split("/").map(Number);

  if (!day || !month || !year) return null;

  // Handle 2-digit year (Excel)
  if (year < 100) {
    year = 2000 + year; // 25 -> 2025
  }

  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0"
  )}/${year}`;
};
