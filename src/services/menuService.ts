/**
 * Main menu service that orchestrates scraping, LLM extraction, and caching
 */

import { ScraperService } from './scraper';
import { LLMService } from './llm';
import { CacheService } from './cache';
import { MenuSummary } from '../types/menu';

export class MenuService {
  private scraper: ScraperService;
  private llm: LLMService;
  private cache: CacheService;

  constructor(llmApiKey: string, cacheDbPath?: string) {
    this.scraper = new ScraperService();
    this.llm = new LLMService(llmApiKey);
    this.cache = new CacheService(cacheDbPath);
  }

  /**
   * Gets current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Gets day of week in Czech for a given date
   */
  private getDayOfWeek(dateString: string): string {
    const days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    const date = new Date(dateString + 'T00:00:00');
    return days[date.getDay()];
  }

  /**
   * Summarizes menu from a restaurant URL
   * @param url - URL of the restaurant menu page
   * @param date - Optional date override (YYYY-MM-DD), defaults to today
   * @returns Menu summary
   */
  async summarizeMenu(url: string, date?: string): Promise<MenuSummary> {
    const targetDate = date || this.getCurrentDate();
    const dayOfWeek = this.getDayOfWeek(targetDate);

    // Check cache first
    const cached = await this.cache.get(url, targetDate);
    if (cached) {
      console.log(`Cache hit for ${url} on ${targetDate}`);
      return cached;
    }

    console.log(`Cache miss for ${url} on ${targetDate}, fetching...`);

    // Scrape the page (with images support)
    const { text: pageContent, images: menuImages } = await this.scraper.scrapeMenuPageWithImages(url);

    if (!pageContent || pageContent.trim().length === 0) {
      throw new Error('No content extracted from the page');
    }

    // Extract menu using LLM (with images if available)
    const menuSummary = await this.llm.extractMenu(
      pageContent,
      url,
      targetDate,
      dayOfWeek,
      menuImages.length > 0 ? menuImages : undefined
    );

    // Cache the result
    this.cache.set(url, targetDate, menuSummary);

    return menuSummary;
  }

  /**
   * Closes cache connection (for cleanup)
   */
  close(): void {
    this.cache.close();
  }
}

