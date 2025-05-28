import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// Define User type based on Prisma schema
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  bio: string | null;
  profilePicture: string | null;
  googleId: string | null;
  facebookId: string | null;
  twitterId: string | null;
  role: 'ADMIN' | 'BUSINESS' | 'PROMOTER';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'BUSINESS' | 'PROMOTER';
  phone?: string;
  company?: string;
  website?: string;
  bio?: string;
  profilePicture?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: 'ADMIN' | 'BUSINESS' | 'PROMOTER';
  phone?: string;
  company?: string;
  website?: string;
  bio?: string;
  profilePicture?: string;
  active?: boolean;
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserInput): Promise<User> {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by social ID
   */
  async findUserBySocialId(platform: 'google' | 'facebook' | 'twitter', socialId: string): Promise<User | null> {
    const query: any = {};
    
    if (platform === 'google') query.googleId = socialId;
    if (platform === 'facebook') query.facebookId = socialId;
    if (platform === 'twitter') query.twitterId = socialId;

    return prisma.user.findFirst({
      where: query,
    });
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserInput): Promise<User> {
    // If password is being updated, hash it
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  /**
   * Compare password
   */
  async comparePassword(candidatePassword: string, userPassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, userPassword);
  }
} 