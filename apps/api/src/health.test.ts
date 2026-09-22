import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';

describe('GET /health', () => {
  it('responde con el nombre del servicio y el estado de la base', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect([200, 503]).toContain(res.status);
    expect(res.body.service).toBe('@fleetrust-backoffice/api');
    expect(res.body.surface).toBe('BACKOFFICE');
    expect(['ok', 'error']).toContain(res.body.db);
  });
});
