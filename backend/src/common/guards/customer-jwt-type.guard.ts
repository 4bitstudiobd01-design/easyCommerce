import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Runs after JwtAuthGuard. That guard is fully payload-agnostic — it only
 * verifies the JWT signature and attaches the claims to request.user — so a
 * merchant JWT and a customer JWT both pass it equally. This guard is the
 * discriminator that keeps the two audiences separate: a customer JWT carries
 * `type: 'customer'`; a merchant JWT never does, so it's rejected here.
 */
@Injectable()
export class CustomerJwtTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.type !== 'customer') {
      throw new UnauthorizedException('This endpoint requires a customer session.');
    }
    return true;
  }
}
