/**
 * REST API routes for menu summarization
 */

import { Router, Request, Response } from 'express';
import { MenuService } from '../services/menuService';

const router = Router();

// Initialize menu service (will be set by app)
let menuService: MenuService | null = null;

export function setMenuService(service: MenuService): void {
  menuService = service;
}

/**
 * POST /summarize
 * Summarizes menu from a restaurant URL
 * 
 * Request body:
 * {
 *   "url": "https://example.com/menu",
 *   "date": "2025-10-22" // optional, defaults to today
 * }
 * 
 * Response:
 * {
 *   "restaurant_name": "...",
 *   "date": "2025-10-22",
 *   "day_of_week": "středa",
 *   "menu_items": [...],
 *   "daily_menu": true,
 *   "source_url": "..."
 * }
 */
router.post('/summarize', async (req: Request, res: Response) => {
  if (!menuService) {
    return res.status(500).json({ error: 'Menu service not initialized' });
  }

  try {
    const { url, date } = req.body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: "url" is required and must be a string' 
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        error: 'Invalid request: "url" must be a valid URL' 
      });
    }

    // Validate date format if provided
    if (date && typeof date === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ 
          error: 'Invalid request: "date" must be in YYYY-MM-DD format' 
        });
      }
    }

    // Summarize menu
    const menuSummary = await menuService.summarizeMenu(url, date);

    return res.status(200).json(menuSummary);
  } catch (error) {
    console.error('Error summarizing menu:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Network error')) {
        return res.status(504).json({ 
          error: 'Gateway timeout: Could not fetch the menu page',
          details: error.message
        });
      }
      if (error.message.includes('HTTP 404') || error.message.includes('404')) {
        return res.status(404).json({ 
          error: 'Page not found: The menu URL could not be accessed',
          details: error.message
        });
      }
      if (error.message.includes('OpenAI API')) {
        return res.status(502).json({ 
          error: 'LLM service error: Failed to process menu content',
          details: error.message
        });
      }
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

