/**
 * Test for caching functionality
 * Verifies that second call with same URL and date doesn't call LLM API
 */

import { CacheService } from '../cache';
import { MenuSummary } from '../../types/menu';

// Mock the cache service
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockClose = jest.fn();

jest.mock('../cache', () => {
  return {
    CacheService: jest.fn().mockImplementation(() => ({
      get: mockGet,
      set: mockSet,
      close: mockClose
    }))
  };
});

// Mock scraper and LLM to avoid actual API calls
const mockScrapeMenuPage = jest.fn();
const mockExtractMenu = jest.fn();

jest.mock('../scraper', () => {
  return {
    ScraperService: jest.fn().mockImplementation(() => ({
      scrapeMenuPage: mockScrapeMenuPage
    }))
  };
});

jest.mock('../llm', () => {
  return {
    LLMService: jest.fn().mockImplementation(() => ({
      extractMenu: mockExtractMenu
    }))
  };
});

// Import MenuService after mocks are set up
import { MenuService } from '../menuService';

describe('MenuService Caching', () => {
  let menuService: MenuService;

  beforeEach(() => {
    jest.clearAllMocks();
    menuService = new MenuService('test-api-key', ':memory:');
  });

  afterEach(() => {
    menuService.close();
  });

  it('should return cached data on second call without calling LLM', async () => {
    const url = 'https://example.com/menu';
    const cachedMenu: MenuSummary = {
      restaurant_name: 'Cached Restaurant',
      date: '2025-10-22',
      day_of_week: 'středa',
      menu_items: [{ category: 'polévka', name: 'Cached Soup', price: 45 }],
      daily_menu: true,
      source_url: url
    };

    // First call: cache miss, should call LLM
    mockGet.mockReturnValueOnce(null);
    mockScrapeMenuPage.mockResolvedValueOnce('Page content');
    mockExtractMenu.mockResolvedValueOnce(cachedMenu);

    const result1 = await menuService.summarizeMenu(url, '2025-10-22');

    expect(mockGet).toHaveBeenCalled();
    expect(mockScrapeMenuPage).toHaveBeenCalledTimes(1);
    expect(mockExtractMenu).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(cachedMenu);

    // Reset mocks (but keep the service instance)
    mockScrapeMenuPage.mockClear();
    mockExtractMenu.mockClear();
    mockSet.mockClear();

    // Second call: cache hit, should NOT call LLM
    mockGet.mockReturnValueOnce(cachedMenu);

    const result2 = await menuService.summarizeMenu(url, '2025-10-22');

    expect(mockGet).toHaveBeenCalled();
    expect(mockScrapeMenuPage).not.toHaveBeenCalled();
    expect(mockExtractMenu).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
    expect(result2).toEqual(cachedMenu);
  });

  it('should use different cache keys for different dates', async () => {
    const url = 'https://example.com/menu';
    const date1 = '2025-10-22';
    const date2 = '2025-10-23';

    mockGet.mockReturnValue(null);
    mockScrapeMenuPage.mockResolvedValue('Page content');
    mockExtractMenu.mockResolvedValue({
      restaurant_name: 'Test',
      date: date1,
      day_of_week: 'středa',
      menu_items: [],
      daily_menu: true,
      source_url: url
    });

    await menuService.summarizeMenu(url, date1);
    await menuService.summarizeMenu(url, date2);

    // Should be called with different dates
    expect(mockGet).toHaveBeenCalledWith(url, date1);
    expect(mockGet).toHaveBeenCalledWith(url, date2);
  });
});

