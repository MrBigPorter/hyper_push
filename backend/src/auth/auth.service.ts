import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput, UpdateUserInput } from '@/auth/dto';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CodepushDbService } from '../codepush/codepush-db.service.js';
import { RecaptchaService } from '../common/recaptcha/recaptcha.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TwoFactorService } from './two-factor.service.js';

/** Lockout threshold: ban login for 15 minutes after this many consecutive failures */
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** Internal Docker network address for the codepush service */
const _CODEPUSH_BASE_URL = 'http://hyperpush-codepush-prod:3000';

/** Supported GraphQL sort directions */
type SortOrder = 'asc' | 'desc';

export interface ListUsersOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
}

export interface PaginatedUsersResult {
  items: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    banned: boolean;
    bannedAt: Date | null;
    bannedReason: string | null;
    totpEnabled: boolean;
    lastLoginAt: Date | null;
    loginAttempts: number;
    lockoutUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly codepushDb: CodepushDbService,
    private readonly twoFactorService: TwoFactorService,
    private readonly recaptchaService: RecaptchaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async register(input: RegisterInput) {
    // Verify reCAPTCHA token (if provided / enabled)
    const recaptchaResult = await this.recaptchaService.verifyToken(input.recaptchaToken);
    if (!recaptchaResult.success) {
      throw new ForbiddenException('reCAPTCHA verification failed');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name ?? null,
      },
    });

    // Audit log: user registration
    await this.auditLogService.create({
      userId: user.id,
      action: 'register',
      entity: 'user',
      entityId: user.id,
      detail: `User registered with email: ${input.email}`,
    });

    // Auto-create matching admin account on code-push-server.
    // This is a side effect — failure does NOT block HyperPush registration.
    // If the account already exists on code-push-server (e.g. manually created),
    // the register call will fail and we silently ignore it — use the existing one.
    await this.registerCodepushAdmin(input.email, input.password);

    return {
      accessToken: this.generateToken(user),
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Ensure the same email/password exists as an admin on code-push-server.
   *
   * Instead of calling the non-existent `/auth/register` HTTP endpoint,
   * we directly insert/verify the user in code-push-server's MySQL database.
   * The app container is on the `codepush` Docker network and can reach
   * `hyperpush-codepush-mysql:3306` directly.
   *
   * Wrapped in try/catch — never throws, never blocks the caller.
   * If the account already exists, ensureUser silently returns.
   */
  private async registerCodepushAdmin(email: string, password: string): Promise<void> {
    try {
      await this.codepushDb.ensureUser(email, password);
    } catch (err) {
      // MySQL connection error — code-push-server may be temporarily
      // unreachable. The user can still add a server later via the
      // ServersService.create() fallback, which retries registration.
      console.warn(
        'CodePush auto-register skipped: code-push-server MySQL may be unreachable',
        err,
      );
    }
  }

  async login(input: LoginInput, metadata?: { ip?: string; userAgent?: string }) {
    // Verify reCAPTCHA token (if provided / enabled)
    const recaptchaResult = await this.recaptchaService.verifyToken(input.recaptchaToken);
    if (!recaptchaResult.success) {
      throw new ForbiddenException('reCAPTCHA verification failed');
    }

    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // === Check ban status ===
    if (user.banned) {
      throw new UnauthorizedException('Account is banned');
    }

    // === Check lockout (rate-limited login attempts) ===
    if (user.lockoutUntil) {
      if (user.lockoutUntil > new Date()) {
        // Still within lockout window — reject
        const remainingMs = user.lockoutUntil.getTime() - Date.now();
        const remainingMin = Math.ceil(remainingMs / 60000);
        throw new UnauthorizedException(
          `Account temporarily locked. Try again in ${remainingMin} minute(s).`,
        );
      }
      // Lockout period has expired — auto-reset attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    // === Verify password ===
    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      // Increment failed attempts
      const attempts = user.loginAttempts + 1;
      const lockoutUntil =
        attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          ...(lockoutUntil ? { lockoutUntil } : {}),
        },
      });

      // Log failed attempt
      await this.createLoginLog(
        user.id,
        metadata?.ip ?? 'unknown',
        metadata?.userAgent,
        false,
        'Invalid password',
      );

      if (lockoutUntil) {
        throw new UnauthorizedException(
          `Account temporarily locked due to too many failed attempts. Try again in 15 minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    // === Successful login — reset attempts ===
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: metadata?.ip ?? null,
      },
    });

    // Log successful login
    await this.createLoginLog(user.id, metadata?.ip ?? 'unknown', metadata?.userAgent, true);

    // === Check if 2FA is enabled → return partial token ===
    if (user.totpEnabled) {
      const tempToken = this.generateTempToken(user);
      return {
        requires2fa: true,
        tempToken,
        user: this.sanitizeUser(user),
      };
    }

    return {
      accessToken: this.generateToken(user),
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Complete 2FA login by verifying the TOTP token.
   * @param tempToken - The temporary JWT from login() when 2FA is enabled
   * @param totpToken - The 6-digit TOTP code from Google Authenticator
   */
  async verify2fa(tempToken: string, totpToken: string) {
    // Verify the temp token
    let payload: { sub: string; scope: string };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired temporary token');
    }

    if (payload.scope !== '2fa_required') {
      throw new UnauthorizedException('Invalid token scope');
    }

    // Verify the TOTP token
    const valid = await this.twoFactorService.verifyToken(payload.sub, totpToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    // Return full access token
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: this.generateToken(user),
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Change password. Requires current password verification.
   * If user has 2FA enabled, TOTP token is required.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    totpToken?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // If 2FA is enabled, verify TOTP token
    if (user.totpEnabled) {
      if (!totpToken) {
        throw new UnauthorizedException('2FA is enabled. Please provide an authentication code.');
      }
      const totpValid = await this.twoFactorService.verifyToken(userId, totpToken);
      if (!totpValid) {
        throw new UnauthorizedException('Invalid authentication code');
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Audit log: password change
    await this.auditLogService.create({
      userId,
      action: 'change_password',
      entity: 'user',
      entityId: userId,
      detail: 'User changed their password',
    });

    return true;
  }

  async updateUser(input: UpdateUserInput) {
    const user = await this.prisma.user.findUnique({ where: { id: input.id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
      },
    });

    // Audit log: user profile updated
    await this.auditLogService.create({
      userId: input.id,
      action: 'update_user',
      entity: 'user',
      entityId: input.id,
      detail:
        input.name !== undefined ? `User name updated to: ${input.name}` : 'User profile updated',
    });

    return this.sanitizeUser(updated);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  // ========================
  //  Admin methods
  // ========================

  /**
   * List all users with pagination, sorting, and optional search.
   */
  async listUsers(options: ListUsersOptions): Promise<PaginatedUsersResult> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search } = options;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        banned: u.banned,
        bannedAt: u.bannedAt,
        bannedReason: u.bannedReason,
        totpEnabled: u.totpEnabled,
        lastLoginAt: u.lastLoginAt,
        loginAttempts: u.loginAttempts,
        lockoutUntil: u.lockoutUntil,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Ban a user by ID.
   */
  async banUser(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        bannedAt: new Date(),
        bannedReason: reason ?? null,
      },
    });

    // Audit log: user banned
    await this.auditLogService.create({
      userId: adminId,
      action: 'ban_user',
      entity: 'user',
      entityId: userId,
      detail: reason ? `User banned. Reason: ${reason}` : 'User banned',
    });

    return true;
  }

  /**
   * Unban a user by ID.
   */
  async unbanUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        bannedAt: null,
        bannedReason: null,
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });

    // Audit log: user unbanned
    await this.auditLogService.create({
      userId: adminId,
      action: 'unban_user',
      entity: 'user',
      entityId: userId,
      detail: 'User unbanned',
    });

    return true;
  }

  // ========================
  //  Private helpers
  // ========================

  private generateToken(user: { id: string; email: string; role: string }): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  /**
   * Generate a short-lived JWT used to carry the userId through the 2FA step.
   * Expires in 5 minutes.
   */
  private generateTempToken(user: { id: string; email: string }): string {
    const payload = { sub: user.id, email: user.email, scope: '2fa_required' };
    return this.jwtService.sign(payload, { expiresIn: '5m' });
  }

  private async createLoginLog(
    userId: string,
    ip: string,
    userAgent?: string,
    success?: boolean,
    failReason?: string,
  ) {
    try {
      await this.prisma.loginLog.create({
        data: { userId, ip, userAgent, success: success ?? true, failReason },
      });
    } catch (err) {
      // Non-critical — don't block login
      console.warn('Failed to create login log:', err);
    }
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    totpEnabled: boolean;
    lastLoginAt: Date | null;
    banned: boolean;
    bannedAt: Date | null;
    bannedReason: string | null;
    password?: string;
  }) {
    const { password, ...rest } = user;
    return rest;
  }
}
