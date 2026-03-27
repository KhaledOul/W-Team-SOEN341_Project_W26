import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  mockAdminAuth,
  resetFirebaseAdminMocks,
} from '../setup/firebaseAdminMocks.js';
import { createMockRequest, createMockResponse } from '../setup/httpMocks.js';

jest.unstable_mockModule('../../src/firebaseAdmin.js', () => ({
  adminAuth: mockAdminAuth,
}));

const { verifyToken } = await import('../../src/middleware/auth.js');

describe('verifyToken', () => {
  beforeEach(() => {
    resetFirebaseAdminMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a valid bearer token and calls next', async () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer valid-token',
      },
    });
    const res = createMockResponse();
    const next = jest.fn();
    const decodedUser = { uid: 'user-123', email: 'user@example.com' };

    mockAdminAuth.verifyIdToken.mockResolvedValue(decodedUser);

    await verifyToken(req, res, next);

    expect(mockAdminAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(decodedUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a missing authorization header', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing or invalid Authorization header',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed authorization header', async () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Token valid-token',
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Missing or invalid Authorization header',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token', async () => {
    const req = createMockRequest({
      headers: {
        authorization: 'Bearer expired-token',
      },
    });
    const res = createMockResponse();
    const next = jest.fn();

    mockAdminAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

    await verifyToken(req, res, next);

    expect(mockAdminAuth.verifyIdToken).toHaveBeenCalledWith('expired-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});
