/**
 * Unit tests for ScraperService
 */

import { ScraperService } from '../scraper';

describe('ScraperService', () => {
  let scraper: ScraperService;

  beforeEach(() => {
    scraper = new ScraperService();
  });

  describe('extractTextContent', () => {
    it('should extract text content from HTML and remove scripts/styles', () => {
      const html = `
        <html>
          <head>
            <script>console.log('test');</script>
            <style>body { color: red; }</style>
          </head>
          <body>
            <h1>Restaurant Menu</h1>
            <p>Today's special: Chicken soup</p>
            <div>Price: 145 Kč</div>
          </body>
        </html>
      `;

      const result = scraper.extractTextContent(html);
      
      expect(result).toContain('Restaurant Menu');
      expect(result).toContain("Today's special: Chicken soup");
      expect(result).toContain('Price: 145 Kč');
      expect(result).not.toContain('console.log');
      expect(result).not.toContain('color: red');
    });

    it('should clean up excessive whitespace', () => {
      const html = `
        <body>
          <p>Line 1</p>
          
          
          <p>Line 2</p>
        </body>
      `;

      const result = scraper.extractTextContent(html);
      
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      // Should not have excessive newlines
      expect(result.split('\n\n').length).toBeLessThan(5);
    });
  });

  describe('fetchPageContent', () => {
    it('should throw error for invalid URL', async () => {
      await expect(
        scraper.fetchPageContent('not-a-valid-url')
      ).rejects.toThrow();
    });

    it('should throw error for non-existent domain', async () => {
      await expect(
        scraper.fetchPageContent('https://this-domain-definitely-does-not-exist-12345.com')
      ).rejects.toThrow();
    });
  });
});

