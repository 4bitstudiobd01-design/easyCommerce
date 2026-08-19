import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Accept Admin server / system requests via shared key
    const adminKey = request.headers['x-admin-key'];
    const expectedKey = this.configService.get<string>('ADMIN_API_KEY');
    if (adminKey && expectedKey && adminKey === expectedKey) {
      request.user = {
        sub: 'system-admin',
        role: 'ADMIN',
        tenantId: 'system',
      };
      return true;
    }

    // 2. Standard JWT Bearer token authentication
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required for uploading files.');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'bitcommerce_jwt_secret_key_change_in_prod';
      const payload = this.jwtService.verify(token, { secret });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
