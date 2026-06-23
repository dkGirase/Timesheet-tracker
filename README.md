Node Version: 24.11.1
PostGreSQL Version: 16.4

# Timesheet Tracker

**Version:** 1.0.0
**Author:** Akshay Pawar
**License:** Proprietary

IDS Attendance is an attendance management software designed for IDS. It provides APIs for managing users, recording attendance, and integrating with a PostgreSQL database using Prisma ORM.

---

## Features

- User authentication and authorization
- Attendance recording and management
- Database migrations and seeding using Prisma
- TypeScript support
- Express-based REST API

---

## Technologies Used

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- bcrypt for password hashing
- JWT for authentication
- Zod for schema validation
- dotenv for environment configuration

---

## Prerequisites

- Node.js (v24.11.1+ recommended)
- PostgreSQL database (v16.4+ recommended)
- npm

---

## Installation

1. Clone the repository:

```bash
git clone git@github.com:abp437/ids-attendance-api.git
cd ids-attendance
````

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and Copy the contents of `.env.example` file and alter the contents of database connection, secrets as per need:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ids_attendance"
ACCESS_TOKEN_SECRET="your_secret_key"
```

4. Generate Prisma client (post-install step):

```bash
npm run postinstall
```

---

## Database Setup

1. Run migrations:

```bash
npm run migrate
```

2. (Optional) Create a new migration:

```bash
npm run migrate:create <migration_name>
```

3. Reset database:

```bash
npm run reset
```

4. Seed the database:

```bash
npm run seed
```

5. Open Prisma Studio:

```bash
npm run studio
```

---

## Scripts

| Script                          | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| `npm run dev`                   | Run the server in development mode with watch support |
| `npm start`                     | Start the production server from `dist`               |
| `npm run build`                 | Compile TypeScript files to JavaScript                |
| `npm run migrate`               | Apply database migrations                             |
| `npm run migrate:create <name>` | Create a new migration with the given name            |
| `npm run reset`                 | Reset the database and apply all migrations           |
| `npm run seed`                  | Seed the database with initial data                   |
| `npm run studio`                | Launch Prisma Studio for database exploration         |

---

## Project Structure

```
.
├── src/
│   └── server.ts      # Main entry point
├── prisma/
│   └── schema.prisma  # Prisma schema
├── dist/              # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── .env
```

---

## Usage

1. Run in development mode:

```bash
npm run dev
```

2. Build and start production server:

```bash
npm run build
npm start
```

The server will run on the port specified in your environment variables (default `3000`).

---

## Contributing

This is proprietary software. Please contact the author for contributions or collaboration.

---

## License

Proprietary – all rights reserved.
