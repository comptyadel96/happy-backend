import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            parentContact: {
              findUnique: jest.fn(),
            },
            userSession: {
              create: jest.fn(),
            },
            activityLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('registerAdult', () => {
    it('should register an adult user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
        physicalAddress: '123 Main St',
      };

      const mockUser = {
        id: '123',
        email: registerDto.email,
        fullName: registerDto.fullName,
        role: 'ADULT',
        gameProfile: {},
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.registerAdult(registerDto);

      expect(result.token).toBe('token123');
      expect(result.user.email).toBe(registerDto.email);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Password123',
        fullName: 'Test User',
        physicalAddress: '123 Main St',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({} as any);

      await expect(service.registerAdult(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const mockUser = {
        id: '123',
        email: loginDto.email,
        password: '$argon2id$...',
        isActive: true,
        role: 'ADULT',
        gameProfile: {},
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(service, 'verifyPassword').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token123');

      const result = await service.login(loginDto);

      expect(result.token).toBe('token123');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
