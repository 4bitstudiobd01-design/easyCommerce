import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Access tokens expire after 15 minutes while the browser session cookie lasts 7 days.
 * Without a refresh endpoint the dashboard stayed "logged in" while every API call
 * returned 401, so merchants saw empty screens until they manually signed out.
 */
describe('RefreshTokenService', () => {
  const activeUser = {
    id: 'user-1',
    email: 'merchant@example.com',
    fullName: 'Merchant',
    role: 'STORE_OWNER',
    isActive: true,
  };

  const build = (user: unknown = activeUser, verifyImpl?: () => unknown) => {
    const findUserByEmailService = { execute: jest.fn().mockResolvedValue(user) };
    const jwtService = {
      verify: jest.fn().mockImplementation(
        verifyImpl ?? (() => ({ sub: activeUser.id, email: activeUser.email, role: activeUser.role })),
      ),
      sign: jest.fn().mockImplementation((_payload, opts) => `token-${opts?.expiresIn}`),
    };

    return {
      service: new RefreshTokenService(findUserByEmailService as any, jwtService as any),
      jwtService,
      findUserByEmailService,
    };
  };

  it('issues a new access token for a valid refresh token', async () => {
    const { service } = build();

    const result = await service.execute('valid-refresh-token');

    expect(result.accessToken).toBe('token-15m');
    expect(result.user.id).toBe('user-1');
  });

  it('rotates the refresh token so an active session keeps sliding forward', async () => {
    const { service } = build();

    const result = await service.execute('valid-refresh-token');

    expect(result.refreshToken).toBe('token-7d');
  });

  it('rejects a missing refresh token', async () => {
    const { service } = build();

    await expect(service.execute('')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired or tampered refresh token', async () => {
    const { service } = build(activeUser, () => {
      throw new Error('jwt expired');
    });

    await expect(service.execute('expired-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects refresh for an account that no longer exists', async () => {
    const { service } = build(null);

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects refresh for a deactivated account', async () => {
    // Otherwise a disabled account could keep minting access tokens for 7 more days.
    const { service } = build({ ...activeUser, isActive: false });

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token whose subject does not match the looked-up user', async () => {
    const { service } = build({ ...activeUser, id: 'someone-else' });

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });
});
