# Database Integration Assignment

This project replaces the starter in-memory repository with PostgreSQL through Prisma while preserving service and controller layer boundaries, API contracts, and HTTP status code semantics.

## Prerequisites

- Node.js (v18+)
- PostgreSQL server (v14+) running locally or accessible via network

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` and configure your PostgreSQL connection string:
   ```bash
   cp .env.example .env
   ```
   *Note: Never commit `.env` or real database credentials.*

3. **Prisma Schema Format & Validation:**
   ```bash
   npm run prisma:format
   npm run prisma:validate
   ```

4. **Apply Database Migrations:**
   Run Prisma Migrate to apply the migration history:
   ```bash
   npm run prisma:migrate
   ```
   *(Alternatively: `npx prisma migrate dev --name init_community_schema`)*

5. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

6. **Seed Initial Data:**
   Run the idempotent seed script to populate baseline author and posts:
   ```bash
   npm run seed
   ```

7. **Start the Application:**
   ```bash
   npm start
   ```

## Repository & Storage Architecture

- **Shared Client Singleton:** Managed at `src/db/prisma.js`.
- **Database Boundary:** Database operations and error translation are contained within `src/repositories/` and `src/db/errors.js`.
- **Contract Preservation:** All repository methods (`findAll`, `findById`, `create`, `update`, `remove`) preserve original async signatures and return values.
- **Error Safety:** Prisma codes (`P2002`, `P2003`, `P2025`) are safely translated into application errors with appropriate HTTP status codes without leaking database internals.
