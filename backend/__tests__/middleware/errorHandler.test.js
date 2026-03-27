import { describe, expect, it, jest } from '@jest/globals';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { createMockRequest, createMockResponse } from '../setup/httpMocks.js';

describe('errorHandler', () => {
  it('returns the provided status and message', () => {
    const err = new Error('Meal plan entry not found');
    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();

    err.status = 404;
    jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Meal plan entry not found' });
    expect(next).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(err.stack);

    jest.restoreAllMocks();
  });

  it('falls back to a 500 status and generic message', () => {
    const err = {};
    const req = createMockRequest();
    const res = createMockResponse();
    const next = jest.fn();

    jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(next).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(undefined);

    jest.restoreAllMocks();
  });
});
