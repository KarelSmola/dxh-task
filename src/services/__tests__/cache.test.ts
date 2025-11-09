/**
 * Unit tests for CacheService
 */

import { CacheService } from '../cache';
import { MenuSummary } from '../../types/menu';
import path from 'path';
import fs from 'fs';

describe('CacheService', () => {
  let cacheService: CacheService;
  const testDbPath = path.join(__dirname, '../../test_cache.db');

  beforeEach(() => {
    // Clean up test database if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    cacheService = new CacheService(testDbPath);
  });

  afterEach(() => {
    cacheService.close();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('get and set', () => {
    it('should store and retrieve menu data', async () => {
      const url = 'https://example.com/menu';
      const date = '2025-10-22';
      const menuData: MenuSummary = {
        restaurant_name: 'Test Restaurant',
        date: date,
        day_of_week: 'středa',
        menu_items: [
          {
            category: 'polévka',
            name: 'Test Soup',
            price: 45
          }
        ],
        daily_menu: true,
        source_url: url
      };

      // Store
      cacheService.set(url, date, menuData);

      // Wait a bit for async write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Retrieve
      const retrieved = await cacheService.get(url, date);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.restaurant_name).toBe('Test Restaurant');
      expect(retrieved?.menu_items).toHaveLength(1);
      expect(retrieved?.menu_items[0].name).toBe('Test Soup');
    });

    it('should return null for non-existent cache entry', async () => {
      const result = await cacheService.get('https://nonexistent.com', '2025-10-22');
      expect(result).toBeNull();
    });

    it('should handle cache misses gracefully', async () => {
      const result = await cacheService.get('https://example.com/menu', '2025-10-23');
      expect(result).toBeNull();
    });

    it('should update existing cache entry', async () => {
      const url = 'https://example.com/menu';
      const date = '2025-10-22';

      const menuData1: MenuSummary = {
        restaurant_name: 'Restaurant 1',
        date: date,
        day_of_week: 'středa',
        menu_items: [],
        daily_menu: true,
        source_url: url
      };

      const menuData2: MenuSummary = {
        restaurant_name: 'Restaurant 2',
        date: date,
        day_of_week: 'středa',
        menu_items: [],
        daily_menu: true,
        source_url: url
      };

      cacheService.set(url, date, menuData1);
      cacheService.set(url, date, menuData2);

      // Wait a bit for async write
      await new Promise(resolve => setTimeout(resolve, 100));

      const retrieved = await cacheService.get(url, date);
      expect(retrieved?.restaurant_name).toBe('Restaurant 2');
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should remove expired entries', () => {
      const url = 'https://example.com/menu';
      const pastDate = '2020-01-01'; // Definitely expired
      
      const menuData: MenuSummary = {
        restaurant_name: 'Test',
        date: pastDate,
        day_of_week: 'pondělí',
        menu_items: [],
        daily_menu: true,
        source_url: url
      };

      cacheService.set(url, pastDate, menuData);
      
      // Force cleanup
      cacheService.cleanupExpiredEntries();
      
      // Entry should be removed or expired
      const result = cacheService.get(url, pastDate);
      expect(result).toBeNull();
    });
  });
});

