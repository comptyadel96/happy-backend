import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get user profile with game progression
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        gameProfile: true,
        parentContact: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Sanitize sensitive data
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update game profile
  async updateGameProfile(
    userId: string,
    updateData: {
      language?: string;
      soundEnabled?: boolean;
      musicEnabled?: boolean;
      contentRestriction?: string;
      currentLevel?: number;
      totalScore?: number;
      totalPlayTime?: number;
    },
  ) {
    const gameProfile = await this.prisma.gameProfile.findUnique({
      where: { userId },
    });

    if (!gameProfile) {
      throw new NotFoundException('Game profile not found');
    }

    const dataToUpdate: any = { ...updateData };
    return this.prisma.gameProfile.update({
      where: { userId },
      data: dataToUpdate,
    });
  }

  // Get all users (admin function)
  async getAllUsers(skip = 0, take = 10) {
    const users = await this.prisma.user.findMany({
      skip,
      take,
      include: {
        gameProfile: true,
      },
    });

    // Sanitize passwords
    return users.map(({ password, ...rest }) => rest);
  }

  // Create parent contact for child registration
  async createParentContact(parentData: {
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  }) {
    return this.prisma.parentContact.create({
      data: parentData,
    });
  }

  // Verify parent contact
  async verifyParentContact(parentContactId: string, verificationCode: string) {
    const parentContact = await this.prisma.parentContact.findUnique({
      where: { id: parentContactId },
    });

    if (!parentContact) {
      throw new NotFoundException('Parent contact not found');
    }

    if (
      parentContact.verificationCode !== verificationCode ||
      !verificationCode
    ) {
      throw new BadRequestException('Invalid verification code');
    }

    return this.prisma.parentContact.update({
      where: { id: parentContactId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }

  // Generate play token for child
  async generatePlayToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'ADULT') {
      throw new BadRequestException('Only adults can generate play tokens');
    }

    // Generate a random token (in production, use a more secure method)
    const token = Math.random().toString(36).substring(2, 15);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        playTokens: {
          push: token,
        },
      },
    });

    return token;
  }

  // Verify child with play token
  async verifyChildWithToken(childId: string, token: string) {
    const child = await this.prisma.user.findUnique({
      where: { id: childId },
    });

    if (!child || child.role !== 'CHILD') {
      throw new BadRequestException('User is not a child account');
    }

    const parent = await this.prisma.user.findUnique({
      where: { id: child.parentContactId || '' },
    });

    if (!parent || !parent.playTokens.includes(token)) {
      throw new BadRequestException('Invalid play token');
    }

    // Mark child as verified
    return this.prisma.user.update({
      where: { id: childId },
      data: {
        isVerifiedByParent: true,
      },
    });
  }

  // Deactivate user account
  async deactivateAccount(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  // Get activity logs for user
  async getUserActivityLogs(userId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
