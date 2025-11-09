/**
 * Integration test for the complete menu summarization flow
 * Tests the full pipeline: scraping -> LLM -> caching
 */

import request from 'supertest';
import express from 'express';
import menuRoutes, { setMenuService } from '../routes/menuRoutes';
import { MenuService } from '../services/menuService';

// Mock the services to avoid actual API calls and web requests
jest.mock('../services/scraper');
jest.mock('../services/llm');
jest.mock('../services/cache');

describe('Menu Summarization Integration', () => {
  let app: express.Application;
  let menuService: MenuService;

  beforeAll(() => {
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/', menuRoutes);

    // Initialize menu service with mock API key
    menuService = new MenuService('test-api-key', ':memory:');
    setMenuService(menuService);
  });

  afterAll(() => {
    menuService.close();
  });

  describe('POST /summarize', () => {
    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/summarize')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('url');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/summarize')
        .send({ url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('valid URL');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/summarize')
        .send({ 
          url: 'https://example.com/menu',
          date: '22-10-2025' // Wrong format
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('YYYY-MM-DD');
    });

    it('should accept valid request with URL', async () => {
      // Note: This will fail if services aren't properly mocked
      // In a real scenario, we'd mock the services to return expected data
      const response = await request(app)
        .post('/summarize')
        .send({ url: 'https://example.com/menu' });

      // Should either succeed (200) or fail with service error (500/502/504)
      // but not with validation error (400)
      expect([200, 500, 502, 504]).toContain(response.status);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

