import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Hash password with Argon2
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      memoryCost: parseInt(process.env.ARGON2_MEMORY || '65540'),
      timeCost: parseInt(process.env.ARGON2_TIME || '3'),
      parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
    });
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  // Unified Register Method
  async register(registerDto: RegisterDto) {
    const {
      email,
      password,
      fullName,
      age,
      phone,
      physicalAddress,
      parentName,
      parentEmail,
    } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Determine if user is adult (18+) or child (<18)
    const isAdult = age >= 18;
    let parentContactId: string | null = null;

    // Validation based on age
    if (isAdult) {
      // For adults (18+), phone number and address are required
      if (!phone || !physicalAddress) {
        throw new BadRequestException(
          'Phone number and physical address are required for adults',
        );
      }
    } else {
      // For minors (<18), parent contact information is required
      if (!parentName || !phone || !parentEmail) {
        throw new BadRequestException(
          'Parent name, parent phone number, and parent email are required for minors',
        );
      }

      // Create parent contact for minors
      const parentContact = await this.prisma.parentContact.create({
        data: {
          parentName,
          parentPhone: phone,
          parentEmail,
          verificationCode: Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase(),
          isVerified: false,
        },
      });

      parentContactId = parentContact.id;
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        age,
        physicalAddress: isAdult ? physicalAddress : undefined,
        role: isAdult ? UserRole.ADULT : UserRole.CHILD,
        parentContactId: !isAdult ? parentContactId : undefined,
        isVerifiedByParent: isAdult, // Adults verified by default
        gameProfile: {
          create: {
            language: 'ar',
            contentRestriction: isAdult ? 'NONE' : 'MILD',
          },
        },
      },
      include: {
        gameProfile: true,
        parentContact: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user);

    // Create session
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTRATION',
        details: {
          role: isAdult ? 'ADULT' : 'CHILD',
          ...(isAdult && { phone }),
          ...(!isAdult && {
            parentEmail,
            verificationRequired: true,
          }),
        },
      },
    });

    const response: any = {
      user: this.sanitizeUser(user),
      token,
    };

    // Add verification message for minors
    if (!isAdult) {
      response.message =
        'Child account created. Verification email sent to parent.';
      response.verificationRequired = true;
      response.parentContact = {
        parentName: user.parentContact?.parentName,
        parentEmail: user.parentContact?.parentEmail,
      };
    } else {
      response.message = 'Adult account created successfully';
    }

    return response;
  }

  // Login user
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        gameProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    // Create session
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Generate JWT token
  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  // Validate JWT token
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      const session = await this.prisma.userSession.findUnique({
        where: { token },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  // Sanitize user object (remove sensitive data)
  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
