import { randomBytes } from 'node:crypto';
import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as mysql from 'mysql2/promise';

/**
 * CodePush MySQL Database Service
 *
 * Directly manages users in code-push-server's MySQL database.
 * This bypasses the broken HTTP registration API (code-push-server v5.7.1
 * has NO `/auth/register` endpoint — the real registration at `POST /users/`
 * requires email verification codes).
 *
 * The app container is on the `codepush` Docker network, so it can reach
 * `hyperpush-codepush-mysql:3306` directly.
 *
 * MySQL credentials: root user, no password (intra-Docker only).
 * See compose.codepush.yml for the MySQL service definition.
 */
@Injectable()
export class CodepushDbService implements OnModuleDestroy {
  private readonly logger = new Logger(CodepushDbService.name);
  private pool: mysql.Pool | null = null;

  private getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: 'hyperpush-codepush-mysql',
        port: 3306,
        user: 'root',
        password: '',
        database: 'codepush',
        waitForConnections: true,
        connectionLimit: 2,
        // Short timeout so we fail fast if code-push-server MySQL is unreachable
        connectTimeout: 3000,
      });
    }
    return this.pool;
  }

  /**
   * Ensure a user exists in code-push-server's MySQL `users` table.
   *
   * 1. Check if a user with this email already exists.
   * 2. If yes → update the username to match the email (in case it was
   *    previously registered with a different username).
   * 3. If no → insert a new user with username=email, bcrypt-hashed password,
   *    and a random `identical` short string.
   *
   * After this succeeds, `POST /auth/login { account: email, password }`
   * will work because code-push-server's auth route checks the `account`
   * field against the `username` column.
   *
   * @returns true if the user was created, false if it already existed
   * @throws Error if the database is unreachable or the INSERT fails
   */
  async ensureUser(email: string, password: string): Promise<boolean> {
    const pool = this.getPool();

    // Step 1: Check if user exists by email
    const [existing] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email],
    );

    const rows = existing as mysql.RowDataPacket[];

    if (rows.length > 0) {
      // User already exists — update username to email if needed
      const user = rows[0] as { id: number; username: string; email: string };
      if (user.username !== email) {
        this.logger.warn(
          `User ${email} exists with username "${user.username}", updating to match email`,
        );
        await pool.execute('UPDATE users SET username = ? WHERE id = ?', [email, user.id]);
      }
      return false; // already existed
    }

    // Step 2: Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a random 9-character alphanumeric `identical` string
    // (matching the format used by code-push-server: base64-url-safe)
    const identical = randomBytes(6).toString('base64').replace(/[/+]/g, '').slice(0, 9);

    await pool.execute(
      'INSERT INTO users (username, password, email, identical, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [email, hashedPassword, email, identical],
    );

    this.logger.log(`Created code-push-server user: ${email}`);
    return true; // created
  }

  /**
   * Gracefully close the MySQL connection pool.
   * Called during application shutdown.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
