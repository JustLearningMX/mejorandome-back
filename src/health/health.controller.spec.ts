import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

describe('HealthController', () => {
  it('should return health status', () => {
    const service = new HealthService();
    const controller = new HealthController(service);

    const response = controller.check();

    expect(response.status).toBe('ok');
    expect(typeof response.timestamp).toBe('string');
    expect(typeof response.uptime).toBe('number');
  });
});
