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
  date: string;
  day_of_week: string;
  menu_items: MenuItem[];
  daily_menu: boolean;
  source_url: string;
}

