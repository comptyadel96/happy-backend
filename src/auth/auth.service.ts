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
import { RegisterAdultDto } from './dto/register-adult.dto';
import { RegisterChildDto } from './dto/register-child.dto';
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

  // Register Adult User
  async registerAdult(registerAdultDto: RegisterAdultDto) {
    const { email, password, fullName, physicalAddress } = registerAdultDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        physicalAddress,
        role: UserRole.ADULT,
        isVerifiedByParent: true, // Adults don't need parent verification
        gameProfile: {
          create: {
            language: 'ar',
          },
        },
      },
      include: {
        gameProfile: true,
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
        details: { role: 'ADULT' },
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  // Register Child User
  async registerChild(registerChildDto: RegisterChildDto) {
    const { email, password, fullName, age, parentContactId } =
      registerChildDto;

    // Validate age
    if (age >= 16) {
      throw new BadRequestException(
        'Child accounts are for users under 16 years old',
      );
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Verify parent contact exists if provided
    let parent: any = null;
    if (parentContactId) {
      parent = await this.prisma.parentContact.findUnique({
        where: { id: parentContactId },
      });

      if (!parent) {
        throw new BadRequestException('Parent contact not found');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        age,
        role: UserRole.CHILD,
        parentContactId: parent?.id || null,
        isVerifiedByParent: !parent, // Needs verification if linked to parent
        gameProfile: {
          create: {
            language: 'ar',
            contentRestriction: 'MILD', // Default stricter restriction for children
          },
        },
      },
      include: {
        gameProfile: true,
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
        details: { role: 'CHILD', parentLinked: !!parent },
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
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
