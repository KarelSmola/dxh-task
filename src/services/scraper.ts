/**
 * Web scraper service using Cheerio and Puppeteer
 * Fetches and parses HTML content from restaurant menu pages
 * Uses Puppeteer for JavaScript-rendered content
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export class ScraperService {
  /**
   * Removes hash fragment from URL (not sent to server)
   * @param url - URL with optional hash
   * @returns URL without hash
   */
  private removeHashFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.hash = '';
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just remove hash manually
      return url.split('#')[0];
    }
  }

  /**
   * Fetches HTML content from a URL
   * @param url - The URL to fetch
   * @returns HTML content as string
   * @throws Error if the request fails
   */
  async fetchPageContent(url: string): Promise<string> {
    try {
      // Remove hash from URL (not sent to server anyway)
      const cleanUrl = this.removeHashFromUrl(url);
      
      const response = await axios.get(cleanUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch page: HTTP ${response.status}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout: The server took too long to respond');
        }
        if (error.response) {
          throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
        }
        if (error.request) {
          throw new Error('Network error: Could not reach the server');
        }
      }
      throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts text content from HTML, removing scripts and styles
   * @param html - HTML content
   * @returns Cleaned text content
   */
  extractTextContent(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style, noscript').remove();
    
    // Try to find menu-specific sections first
    const menuSelectors = [
      '[id*="menu"]',
      '[class*="menu"]',
      '[id*="denni"]',
      '[class*="denni"]',
      '[id*="denní"]',
      '[class*="denní"]',
      'section',
      'article',
      '.content',
      '#content'
    ];
    
    let menuText = '';
    for (const selector of menuSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        const text = elements.text();
        if (text.length > 100 && text.length < 10000) {
          // Likely a menu section
          menuText += text + '\n\n';
        }
      }
    }
    
    // Extract text from body
    const bodyText = $('body').text();
    
    // Combine menu-specific text with body text
    const combinedText = menuText + '\n' + bodyText;
    
    // Clean up whitespace
    return combinedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Finds menu images on the page
   * @param html - HTML content
   * @returns Array of image URLs that might contain menu
   */
  findMenuImages(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const menuImages: string[] = [];
    
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      const alt = $(elem).attr('alt') || '';
      const title = $(elem).attr('title') || '';
      
      if (!src) return;
      
      // Check if image might contain menu
      const lowerAlt = alt.toLowerCase();
      const lowerTitle = title.toLowerCase();
      const lowerSrc = src.toLowerCase();
      
      const menuKeywords = ['menu', 'polední', 'nabídka', 'jídlo', 'listek', 'denní'];
      const isMenuImage = 
        menuKeywords.some(keyword => 
          lowerAlt.includes(keyword) || 
          lowerTitle.includes(keyword) || 
          lowerSrc.includes(keyword)
        ) ||
        lowerSrc.includes('menu') ||
        lowerSrc.includes('poledni');
      
      if (isMenuImage) {
        // Convert relative URLs to absolute
        const absoluteUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
        menuImages.push(absoluteUrl);
      }
    });
    
    return menuImages;
  }

  /**
   * Fetches page content using Puppeteer (for JavaScript-rendered pages)
   * @param url - The URL to fetch
   * @returns HTML content as string
   */
  async fetchPageContentWithPuppeteer(url: string): Promise<string> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate and wait for content to load
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 20000 
      });
      
      // Try to close cookie banners or popups
      try {
        // Common cookie banner selectors
        const cookieSelectors = [
          'button:has-text("Přijmout")',
          'button:has-text("Accept")',
          'button:has-text("Souhlasím")',
          '[id*="cookie"] button',
          '[class*="cookie"] button',
          '[id*="consent"] button',
          '[class*="consent"] button'
        ];
        
        for (const selector of cookieSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            await page.click(selector);
          } catch {}
        }
      } catch {}
      
      // Scroll to trigger lazy loading
      // @ts-ignore - window and document are available in browser context
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
      
      // Scroll back up
      // @ts-ignore - window and document are available in browser context
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
      
      // Try to find and click on menu section if it's a link/button
      try {
        const menuLink = await page.$('a[href*="menu"], a[href*="denni"], button:has-text("Menu")');
        if (menuLink) {
          await menuLink.click();
          await page.waitForTimeout(2000);
        }
      } catch {}
      
      // Wait for any additional content to load
      await page.waitForTimeout(2000);
      
      // Get the HTML content
      const html = await page.content();
      
      await browser.close();
      return html;
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Failed to fetch page with Puppeteer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches and extracts text content from a URL
   * @param url - The URL to process
   * @returns Cleaned text content
   */
  async scrapeMenuPage(url: string): Promise<string> {
    const html = await this.fetchPageContent(url);
    return this.extractTextContent(html);
  }

  /**
   * Fetches HTML and finds menu images
   * Tries Cheerio first, falls back to Puppeteer if needed
   * @param url - The URL to process
   * @returns Object with text content and menu images
   */
  async scrapeMenuPageWithImages(url: string): Promise<{ text: string; images: string[] }> {
    // Try Cheerio first (faster)
    let html: string;
    let text: string;
    let images: string[];
    
    try {
      html = await this.fetchPageContent(url);
      text = this.extractTextContent(html);
      images = this.findMenuImages(html, url);
      
      // Check if we got meaningful menu content
      // Be more lenient - if we see "denní menu" or similar, try Puppeteer anyway
      const hasMenuContent = 
        text.toLowerCase().includes('polévka') ||
        text.toLowerCase().includes('soup') ||
        text.toLowerCase().includes('cena') ||
        text.toLowerCase().includes('kč') ||
        text.match(/\d+\s*(kč|kc|,-)/i) !== null ||
        images.length > 0;
      
      // Check if page mentions menu but doesn't have actual menu items
      const mentionsMenuButNoItems = 
        (text.toLowerCase().includes('denní menu') || 
         text.toLowerCase().includes('polední nabídka') ||
         text.toLowerCase().includes('menu')) &&
        !hasMenuContent;
      
      // If we have menu content or images, return it
      if (hasMenuContent) {
        return { text, images };
      }
      
      // If page mentions menu but has no items, or no menu content at all, try Puppeteer
      if (mentionsMenuButNoItems || !hasMenuContent) {
        console.log('Menu mentioned but no items found, or no menu content, trying Puppeteer...');
        html = await this.fetchPageContentWithPuppeteer(url);
        text = this.extractTextContent(html);
        images = this.findMenuImages(html, url);
        
        return { text, images };
      }
      
      // If we have content but it's not menu, return it anyway (LLM will decide)
      return { text, images };
    } catch (error) {
      // If Cheerio fails, try Puppeteer
      console.log('Cheerio failed, trying Puppeteer...', error);
      try {
        html = await this.fetchPageContentWithPuppeteer(url);
        text = this.extractTextContent(html);
        images = this.findMenuImages(html, url);
        return { text, images };
      } catch (puppeteerError) {
        throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

