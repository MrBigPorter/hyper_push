import * as crypto from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as otplib from 'otplib';

import { AuditLogService } from '../audit-log/audit-log.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Service for Google Authenticator (TOTP) two-factor authentication.
 *
 * TOTP secrets are encrypted at rest using AES-256-GCM with a key derived
 * from the TOTP_ENCRYPTION_KEY environment variable.
 */
@Injectable()
export class TwoFactorService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    configService: ConfigService,
  ) {
    const key = configService.get<string>('TOTP_ENCRYPTION_KEY');
    if (!key) {
      throw new Error('TOTP_ENCRYPTION_KEY environment variable is required');
    }
    this.encryptionKey = key;
  }

  /**
   * Derive a 256-bit encryption key from the env secret using SHA-256.
   */
  private getEncryptionKey(): Buffer {
    return crypto.createHash('sha256').update(this.encryptionKey).digest();
  }

  /**
   * Encrypt a TOTP secret before storing in the database.
   */
  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt a TOTP secret stored in the database.
   */
  private decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedData.split(':');
    const ivHex = parts[0] ?? '';
    const authTagHex = parts[1] ?? '';
    const ciphertext = parts[2] ?? '';
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate a new TOTP secret for a user.
   * Returns the unencrypted secret and the otpauth URI for QR code generation.
   */
  async generateSecret(userId: string): Promise<{ secret: string; uri: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate a cryptographically random secret key
    const secret = otplib.generateSecret();
    const serviceName = 'HyperPush';
    const uri = otplib.generateURI({ label: user.email, issuer: serviceName, secret });

    // Encrypt and store the secret
    const encrypted = this.encrypt(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: encrypted },
    });

    // Audit log: 2FA setup initiated (secret generated)
    await this.auditLogService.create({
      userId,
      action: 'setup_2fa',
      entity: 'user',
      entityId: userId,
      detail: '2FA secret generated',
    });

    return { secret, uri };
  }

  /**
   * Verify a TOTP token against the user's stored secret.
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      throw new UnauthorizedException('2FA not set up');
    }

    const secret = this.decrypt(user.totpSecret as string);
    try {
      const result = otplib.verifySync({ token, secret });
      return result.valid;
    } catch {
      return false;
    }
  }

  /**
   * Enable 2FA for a user after verifying the current TOTP token.
   */
  async enable2fa(userId: string, token: string): Promise<boolean> {
    const valid = await this.verifyToken(userId, token);
    if (!valid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });

    // Audit log: 2FA enabled
    await this.auditLogService.create({
      userId,
      action: 'enable_2fa',
      entity: 'user',
      entityId: userId,
      detail: '2FA enabled',
    });

    return true;
  }

  /**
   * Disable 2FA for a user. Requires current password verification.
   */
  async disable2fa(userId: string, _password: string, totpToken?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // If 2FA is enabled, verify the TOTP token
    if (user.totpEnabled && totpToken) {
      const valid = await this.verifyToken(userId, totpToken);
      if (!valid) {
        throw new UnauthorizedException('Invalid authentication code');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });

    // Audit log: 2FA disabled
    await this.auditLogService.create({
      userId,
      action: 'disable_2fa',
      entity: 'user',
      entityId: userId,
      detail: '2FA disabled',
    });

    return true;
  }
}
