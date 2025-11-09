/**
 * Cache service using SQLite for persistent storage
 * Implements TTL-based cache invalidation (expires at midnight)
 */

import sqlite3 from 'sqlite3';
import { MenuSummary } from '../types/menu';
import path from 'path';
import { promisify } from 'util';

export class CacheService {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'menu_cache.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeDatabase();
    this.cleanupExpiredEntries();
  }

  /**
   * Initializes the database schema
   */
  private initializeDatabase(): void {
    const run = promisify(this.db.run.bind(this.db));
    
    run(`
      CREATE TABLE IF NOT EXISTS menu_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        date TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        UNIQUE(url, date)
      )
    `).catch(console.error);

    run(`
      CREATE INDEX IF NOT EXISTS idx_url_date ON menu_cache(url, date)
    `).catch(console.error);

    run(`
      CREATE INDEX IF NOT EXISTS idx_expires_at ON menu_cache(expires_at)
    `).catch(console.error);
  }

  /**
   * Gets expiration timestamp for a given date (midnight of next day)
   */
  private getExpirationTimestamp(dateString: string): number {
    const date = new Date(dateString + 'T00:00:00');
    date.setDate(date.getDate() + 1); // Next day at midnight
    return date.getTime();
  }

  /**
   * Retrieves menu from cache
   * @param url - Source URL
   * @param date - Date in YYYY-MM-DD format
   * @returns Menu summary if found and not expired, null otherwise
   */
  async get(url: string, date: string): Promise<MenuSummary | null> {
    return new Promise((resolve) => {
      this.db.get(
        'SELECT data, expires_at FROM menu_cache WHERE url = ? AND date = ?',
        [url, date],
        (err, row: any) => {
          if (err) {
            console.error('Error reading from cache:', err);
            resolve(null);
            return;
          }

          if (!row) {
            resolve(null);
            return;
          }

          // Check if expired
          const now = Date.now();
          if (now >= row.expires_at) {
            this.delete(url, date);
            resolve(null);
            return;
          }

          // Parse and return cached data
          try {
            const menu = JSON.parse(row.data) as MenuSummary;
            resolve(menu);
          } catch (parseError) {
            console.error('Error parsing cached data:', parseError);
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Stores menu in cache
   * @param url - Source URL
   * @param date - Date in YYYY-MM-DD format
   * @param data - Menu summary to cache
   */
  set(url: string, date: string, data: MenuSummary): void {
    try {
      const expiresAt = this.getExpirationTimestamp(date);
      const dataString = JSON.stringify(data);

      this.db.run(
        'INSERT OR REPLACE INTO menu_cache (url, date, data, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        [url, date, dataString, Date.now(), expiresAt],
        (err) => {
          if (err) {
            console.error('Error writing to cache:', err);
          }
        }
      );
    } catch (error) {
      console.error('Error writing to cache:', error);
      // Don't throw - caching failures shouldn't break the app
    }
  }

  /**
   * Deletes a specific cache entry
   */
  private delete(url: string, date: string): void {
    try {
      this.db.run(
        'DELETE FROM menu_cache WHERE url = ? AND date = ?',
        [url, date],
        (err) => {
          if (err) {
            console.error('Error deleting from cache:', err);
          }
        }
      );
    } catch (error) {
      console.error('Error deleting from cache:', error);
    }
  }

  /**
   * Cleans up expired entries (runs on startup and can be called periodically)
   */
  cleanupExpiredEntries(): void {
    try {
      const now = Date.now();
      this.db.run(
        'DELETE FROM menu_cache WHERE expires_at < ?',
        [now],
        function(err) {
          if (err) {
            console.error('Error cleaning up cache:', err);
          } else if (this.changes > 0) {
            console.log(`Cleaned up ${this.changes} expired cache entries`);
          }
        }
      );
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Closes the database connection
   */
  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  }
}
