/**
 * Type definitions for menu data structures
 */

export interface MenuItem {
  category: string;
  name: string;
  price: number;
  allergens?: string[];
  weight?: string;
  description?: string;
}

export interface MenuSummary {
  restaurant_name: string;
  date: string; // YYYY-MM-DD format
  day_of_week: string;
  menu_items: MenuItem[];
  daily_menu: boolean;
  source_url: string;
}

export interface CacheEntry {
  url: string;
  date: string;
  data: MenuSummary;
  created_at: number; // timestamp
}

