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

  const validSession = {
    id: 'session-1',
    userId: activeUser.id,
    isValid: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const build = (
    user: unknown = activeUser,
    verifyImpl?: () => unknown,
    session: unknown = validSession,
  ) => {
    const findUserByEmailService = { execute: jest.fn().mockResolvedValue(user) };
    const jwtService = {
      verify: jest.fn().mockImplementation(
        verifyImpl ??
          (() => ({ sub: activeUser.id, email: activeUser.email, role: activeUser.role, sid: 'session-1' })),
      ),
      sign: jest.fn().mockImplementation((_payload, opts) => `token-${opts?.expiresIn}`),
    };
    const sessionRepository = {
      findOne: jest.fn().mockResolvedValue(session),
      update: jest.fn().mockResolvedValue(undefined),
    };

    return {
      service: new RefreshTokenService(findUserByEmailService as any, jwtService as any, sessionRepository as any),
      jwtService,
      findUserByEmailService,
      sessionRepository,
    };
  };

  it('issues a new access token for a valid refresh token', async () => {
    const { service } = build();

    const result = await service.execute('valid-refresh-token');

    expect(result.accessToken).toBe('token-15m');
    expect(result.user.id).toBe('user-1');
  });

  it('rotates the refresh token so an active session keeps sliding forward', async () => {
    const { service, sessionRepository } = build();

    const result = await service.execute('valid-refresh-token');

    expect(result.refreshToken).toBe('token-7d');
    expect(sessionRepository.update).toHaveBeenCalledWith('session-1', { expiresAt: expect.any(Date) });
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

  it('rejects a token with no session id', async () => {
    const { service } = build(activeUser, () => ({
      sub: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
    }));

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the session no longer exists', async () => {
    const { service } = build(activeUser, undefined, null);

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the session has been invalidated', async () => {
    const { service } = build(activeUser, undefined, { ...validSession, isValid: false });

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the session has expired', async () => {
    const { service } = build(activeUser, undefined, {
      ...validSession,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.execute('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
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
