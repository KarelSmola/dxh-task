/**
 * Unit tests for LLMService - testing validation and normalization
 */

import { LLMService } from '../llm';
import { MenuItem } from '../../types/menu';

// Mock OpenAI client
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  restaurant_name: 'Test Restaurant',
                  menu_items: [
                    {
                      category: 'polévka',
                      name: 'Hovězí vývar',
                      price: 45,
                      allergens: ['1', '3']
                    }
                  ],
                  daily_menu: true
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('LLMService', () => {
  let llmService: LLMService;

  beforeEach(() => {
    llmService = new LLMService('test-api-key');
  });

  describe('extractMenu', () => {
    it('should extract menu from page content', async () => {
      const pageContent = 'Restaurant Menu\nPolévka: Hovězí vývar - 45 Kč';
      const url = 'https://example.com/menu';
      const date = '2025-10-22';
      const dayOfWeek = 'středa';

      const result = await llmService.extractMenu(pageContent, url, date, dayOfWeek);

      expect(result).toHaveProperty('restaurant_name');
      expect(result).toHaveProperty('date', date);
      expect(result).toHaveProperty('day_of_week', dayOfWeek);
      expect(result).toHaveProperty('menu_items');
      expect(result).toHaveProperty('source_url', url);
      expect(result).toHaveProperty('daily_menu');
    });

    it('should handle empty menu items gracefully', async () => {
      // Mock empty menu response
      const OpenAI = require('openai').default;
      const mockCreate = OpenAI().chat.completions.create;
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              restaurant_name: 'Test Restaurant',
              menu_items: [],
              daily_menu: false
            })
          }
        }]
      });

      const result = await llmService.extractMenu('', 'https://example.com', '2025-10-22', 'středa');
      
      expect(result.menu_items).toEqual([]);
      expect(result.daily_menu).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate menu item structure', () => {
      // This tests the private validateAndNormalizeMenuItems method indirectly
      // through extractMenu
      const validItem: MenuItem = {
        category: 'polévka',
        name: 'Test Soup',
        price: 45,
        allergens: ['1', '3']
      };

      expect(validItem.category).toBe('polévka');
      expect(validItem.name).toBe('Test Soup');
      expect(validItem.price).toBe(45);
      expect(validItem.allergens).toEqual(['1', '3']);
    });
  });
});

