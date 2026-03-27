import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import {
  createSnapshot,
  mockAdminAuth,
  mockAdminDb,
  mockEntryRef,
  queueEntrySnapshots,
  resetFirebaseAdminMocks,
} from '../setup/firebaseAdminMocks.js';

jest.unstable_mockModule('../../src/firebaseAdmin.js', () => ({
  adminAuth: mockAdminAuth,
  adminDb: mockAdminDb,
  default: {},
}));

const { default: mealPlanRoutes } = await import('../../src/routes/mealPlans.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/meal-plans', mealPlanRoutes);
  app.use(errorHandler);
  return app;
}

describe('DELETE /api/meal-plans/:week/entries/:entryId', () => {
  const mealPlanId = 'user-1_2026-W13';
  const entryId = 'entry-1';

  beforeEach(() => {
    resetFirebaseAdminMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when the authorization header is missing', async () => {
    const app = createApp();

    const response = await request(app).delete(
      `/api/meal-plans/${mealPlanId}/entries/${entryId}`
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Missing or invalid Authorization header',
    });
  });

  it('returns 401 when token verification fails', async () => {
    const app = createApp();

    mockAdminAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

    const response = await request(app)
      .delete(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when the meal plan entry does not exist', async () => {
    const app = createApp();

    queueEntrySnapshots(createSnapshot({ id: entryId, exists: false }));

    const response = await request(app)
      .delete(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Meal plan entry not found' });
  });

  it('returns 204 and deletes the entry when it exists', async () => {
    const app = createApp();

    queueEntrySnapshots(
      createSnapshot({
        id: entryId,
        exists: true,
        data: { dayOfWeek: 'Monday', mealType: 'lunch' },
      })
    );

    const response = await request(app)
      .delete(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(mockAdminDb.collection).toHaveBeenCalledWith('mealPlans');
    expect(mockEntryRef.delete).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when Firestore delete throws unexpectedly', async () => {
    const app = createApp();

    queueEntrySnapshots(
      createSnapshot({
        id: entryId,
        exists: true,
        data: { dayOfWeek: 'Monday', mealType: 'lunch' },
      })
    );
    mockEntryRef.delete.mockRejectedValue(new Error('Firestore delete failed'));

    const response = await request(app)
      .delete(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Firestore delete failed' });
  });
});
