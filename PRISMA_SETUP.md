# Prisma Setup Guide for Boostflow

This guide explains how to set up and use Prisma with PostgreSQL for the Boostflow project.

## Prerequisites

- PostgreSQL installed locally or accessible via a connection string
- Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

```bash
npm install prisma @prisma/client --save
npm install -D prisma
```

### 2. Initialize Prisma

```bash
npx prisma init
```

### 3. Configure Database Connection

Update the `.env` file with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/boostflow?schema=public"
```

Replace `username` and `password` with your PostgreSQL credentials.

### 4. Create Database (if it doesn't exist)

```bash
createdb boostflow
```

### 5. Generate Prisma Client

After defining your models in `prisma/schema.prisma`, generate the Prisma client:

```bash
npx prisma generate
```

### 6. Create Database Tables

To create the tables based on your Prisma schema:

```bash
npx prisma migrate dev --name init
```

## Using Prisma in Your Code

### Import the Prisma Client

```typescript
import prisma from '../config/prisma';
```

### Basic CRUD Operations

#### Create a Record

```typescript
const newUser = await prisma.user.create({
  data: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: 'BUSINESS',
  },
});
```

#### Read Records

```typescript
// Find by ID
const user = await prisma.user.findUnique({
  where: { id: 1 },
});

// Find by email
const userByEmail = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});

// Get all users
const allUsers = await prisma.user.findMany();

// Pagination
const users = await prisma.user.findMany({
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' },
});
```

#### Update a Record

```typescript
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: {
    firstName: 'Jane',
  },
});
```

#### Delete a Record

```typescript
const deletedUser = await prisma.user.delete({
  where: { id: 1 },
});
```

### Relationships

#### Include Related Records

```typescript
// Get a user with their products
const userWithProducts = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    ownedProducts: true,
  },
});
```

## Migrating from Sequelize to Prisma

### Step 1: Define Prisma Schema

Convert your Sequelize models to Prisma models in `schema.prisma`.

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Create Database Migration

```bash
npx prisma migrate dev --name init
```

### Step 4: Update Service Layer

Replace Sequelize queries with Prisma queries in your services.

## Useful Commands

- **Generate Prisma Client**: `npx prisma generate`
- **Create Migration**: `npx prisma migrate dev --name <migration-name>`
- **Apply Migrations**: `npx prisma migrate deploy`
- **Reset Database**: `npx prisma migrate reset`
- **Open Prisma Studio**: `npx prisma studio`

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference) 