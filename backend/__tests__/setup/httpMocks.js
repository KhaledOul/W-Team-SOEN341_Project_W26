import { jest } from '@jest/globals';

export function createMockRequest(overrides = {}) {
  return {
    headers: {},
    ...overrides,
  };
}

export function createMockResponse() {
  const res = {};

  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);

  return res;
}
