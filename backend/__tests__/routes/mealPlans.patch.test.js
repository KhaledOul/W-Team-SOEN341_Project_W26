import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import {
  createSnapshot,
  mockAdminAuth,
  mockAdminDb,
  mockEntryRef,
  mockEntriesCollectionRef,
  mockMealPlanDocRef,
  mockMealPlansCollectionRef,
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

describe('PATCH /api/meal-plans/:week/entries/:entryId', () => {
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

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .send({ dayOfWeek: 'Tuesday' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Missing or invalid Authorization header',
    });
  });

  it('returns 401 when token verification fails', async () => {
    const app = createApp();

    mockAdminAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer invalid-token')
      .send({ dayOfWeek: 'Tuesday' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when the request body is not a JSON object', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send([]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Request body must be a JSON object' });
  });

  it('returns 400 when no patch fields are provided', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'At least one of dayOfWeek or mealType must be provided',
    });
  });

  it('returns 400 when unknown fields are provided', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ title: 'Pasta' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Unknown field(s): title' });
  });

  it('returns 400 when dayOfWeek is invalid', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ dayOfWeek: 'Funday' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error:
        'dayOfWeek must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
    });
  });

  it('returns 400 when mealType is invalid', async () => {
    const app = createApp();

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ mealType: 'brunch' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'mealType must be one of: breakfast, lunch, dinner, snack',
    });
  });

  it('returns 404 when the meal plan entry does not exist', async () => {
    const app = createApp();

    queueEntrySnapshots(createSnapshot({ id: entryId, exists: false }));

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ dayOfWeek: 'Tuesday' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Meal plan entry not found' });
  });

  it('returns 200 with the updated entry when the patch succeeds', async () => {
    const app = createApp();
    const updatedEntry = {
      dayOfWeek: 'Tuesday',
      mealType: 'dinner',
    };

    queueEntrySnapshots(
      createSnapshot({
        id: entryId,
        exists: true,
        data: { dayOfWeek: 'Monday', mealType: 'lunch' },
      }),
      createSnapshot({
        id: entryId,
        exists: true,
        data: updatedEntry,
      })
    );

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ dayOfWeek: 'Tuesday' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: entryId,
      ...updatedEntry,
    });
    expect(mockAdminDb.collection).toHaveBeenCalledWith('mealPlans');
    expect(mockMealPlansCollectionRef.doc).toHaveBeenCalledWith(mealPlanId);
    expect(mockMealPlanDocRef.collection).toHaveBeenCalledWith('entries');
    expect(mockEntriesCollectionRef.doc).toHaveBeenCalledWith(entryId);
    expect(mockEntryRef.update).toHaveBeenCalledWith({ dayOfWeek: 'Tuesday' });
  });

  it('returns 500 when Firestore get throws unexpectedly', async () => {
    const app = createApp();

    mockEntryRef.get.mockRejectedValue(new Error('Firestore get failed'));

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ mealType: 'dinner' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Firestore get failed' });
  });

  it('returns 500 when Firestore update throws unexpectedly', async () => {
    const app = createApp();

    queueEntrySnapshots(
      createSnapshot({
        id: entryId,
        exists: true,
        data: { dayOfWeek: 'Monday', mealType: 'lunch' },
      })
    );
    mockEntryRef.update.mockRejectedValue(new Error('Firestore update failed'));

    const response = await request(app)
      .patch(`/api/meal-plans/${mealPlanId}/entries/${entryId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ mealType: 'dinner' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Firestore update failed' });
  });
});
