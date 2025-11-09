/**
 * LLM service using OpenAI API with structured outputs and function calling
 */

import OpenAI from 'openai';
import axios from 'axios';
import { MenuSummary, MenuItem } from '../types/menu';

export class LLMService {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Normalizes price from various formats to number
   * Example: "145,-" → 145, "145 Kč" → 145, "145" → 145
   */
  private normalizePrice(priceString: string): number {
    // Remove currency symbols, spaces, and commas
    const cleaned = priceString.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  }

  /**
   * Detects day of week from various formats
   * Example: "středa", "Wednesday", "st", "3" → "středa"
   */
  private detectDayOfWeek(dayString: string): string {
    const dayMap: Record<string, string> = {
      'pondělí': 'pondělí', 'monday': 'pondělí', 'po': 'pondělí', '1': 'pondělí',
      'úterý': 'úterý', 'tuesday': 'úterý', 'út': 'úterý', '2': 'úterý',
      'středa': 'středa', 'wednesday': 'středa', 'st': 'středa', '3': 'středa',
      'čtvrtek': 'čtvrtek', 'thursday': 'čtvrtek', 'čt': 'čtvrtek', '4': 'čtvrtek',
      'pátek': 'pátek', 'friday': 'pátek', 'pá': 'pátek', '5': 'pátek',
      'sobota': 'sobota', 'saturday': 'sobota', 'so': 'sobota', '6': 'sobota',
      'neděle': 'neděle', 'sunday': 'neděle', 'ne': 'neděle', '7': 'neděle'
    };

    const normalized = dayString.toLowerCase().trim();
    return dayMap[normalized] || dayString;
  }

  /**
   * Converts weight/measure to standard format
   * Example: "150g", "150 g", "150g" → "150g"
   */
  private normalizeWeight(weightString: string): string {
    return weightString.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * Downloads an image and converts it to base64
   */
  private async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      const buffer = Buffer.from(response.data);
      return buffer.toString('base64');
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts and summarizes menu from page content using LLM
   * @param pageContent - Text content from the scraped page
   * @param url - Source URL
   * @param currentDate - Current date in YYYY-MM-DD format
   * @param dayOfWeek - Current day of week in Czech
   * @param menuImages - Optional array of image URLs containing menu
   * @returns Structured menu summary
   */
  async extractMenu(
    pageContent: string,
    url: string,
    currentDate: string,
    dayOfWeek: string,
    menuImages?: string[]
  ): Promise<MenuSummary> {
    try {
      // Define function tools for structured processing
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'normalize_price',
            description: 'Normalizes price from various formats (e.g., "145,-", "145 Kč", "145") to a number',
            parameters: {
              type: 'object',
              properties: {
                price_string: {
                  type: 'string',
                  description: 'Price string in any format'
                }
              },
              required: ['price_string']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'detect_day_of_week',
            description: 'Detects and normalizes day of week from various formats',
            parameters: {
              type: 'object',
              properties: {
                day_string: {
                  type: 'string',
                  description: 'Day string in any format'
                }
              },
              required: ['day_string']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'normalize_weight',
            description: 'Converts weight/measure to standard format (e.g., "150g")',
            parameters: {
              type: 'object',
              properties: {
                weight_string: {
                  type: 'string',
                  description: 'Weight string in any format'
                }
              },
              required: ['weight_string']
            }
          }
        }
      ];

      // System prompt with clear instructions
      const systemPrompt = `Jsi expert na extrakci a strukturování menu z restaurací. Tvá úloha je:
1. Najít menu pro zadaný den (${dayOfWeek}, ${currentDate})
2. Extrahovat všechny položky menu s kategoriemi, názvy, cenami a alergeny
3. Normalizovat ceny do číselného formátu
4. Identifikovat název restaurace
5. Rozpoznat, zda se jedná o denní menu (daily_menu: true) nebo týdenní menu

DŮLEŽITÉ INSTRUKCE:
- Pokud menu není explicitně označené datem nebo dnem v týdnu, extrahuj VŠECHNA dostupná menu na stránce
- Pro "polední nabídka", "denní menu" nebo "Denní menu" extrahuj všechna jídla, která jsou zobrazená
- Pokud stránka obsahuje pouze jedno menu bez data, extrahuj ho jako menu pro zadaný den
- Menu může být v různých formátech - hledej názvy jídel, ceny, kategorie (polévka, hlavní jídlo, dezert)
- Pokud vidíš pouze odkazy nebo navigaci k menu, ale ne samotné menu položky, vrať prázdné menu_items
- Pokud nenajdeš žádné menu, vrať prázdné menu_items, ale zachovej restaurant_name a další metadata

Formát odpovědi musí být striktně JSON podle poskytnuté struktury.`;

      // Prepare messages with text and/or images
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
      ];

      // If we have menu images, use vision API
      if (menuImages && menuImages.length > 0) {
        console.log(`Found ${menuImages.length} menu image(s), using vision API`);
        
        // Download first menu image and convert to base64
        try {
          const imageBase64 = await this.downloadImageAsBase64(menuImages[0]);
          const imageMimeType = menuImages[0].toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          
          messages.push({
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extrahuj menu z tohoto obrázku. Hledám menu pro den ${dayOfWeek} (${currentDate}). Pokud je v obrázku menu, extrahuj všechna jídla s kategoriemi, názvy, cenami a alergeny. Vrať odpověď POUZE jako validní JSON objekt s těmito poli: restaurant_name (string), date (string ve formátu YYYY-MM-DD), day_of_week (string), menu_items (array objektů s category, name, price, allergens, weight), daily_menu (boolean), source_url (string).`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageMimeType};base64,${imageBase64}`
                }
              }
            ]
          });
        } catch (error) {
          console.error('Error downloading image, falling back to text:', error);
          // Fallback to text if image download fails
          messages.push({
            role: 'user',
            content: `Extrahuj menu z následujícího obsahu stránky. Hledám menu pro den ${dayOfWeek} (${currentDate}), ale pokud menu není označené datem, extrahuj všechna dostupná menu:\n\n${pageContent.substring(0, 12000)}${pageContent.length > 12000 ? '...' : ''}\n\nVrať strukturovaná data v JSON formátu.`
          });
        }
      } else {
        // No images, use text only
        messages.push({
          role: 'user',
          content: `Extrahuj menu z následujícího obsahu stránky. Hledám menu pro den ${dayOfWeek} (${currentDate}), ale pokud menu není označené datem, extrahuj všechna dostupná menu:\n\n${pageContent.substring(0, 12000)}${pageContent.length > 12000 ? '...' : ''}\n\nVrať strukturovaná data v JSON formátu.`
        });
      }

      // Use structured outputs with JSON schema
      // Note: When using vision API, we need to be careful with tools and response_format
      const requestConfig: any = {
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.3 // Lower temperature for more consistent extraction
      };

      // Check if we're using vision API (has images)
      const hasImages = menuImages && menuImages.length > 0 && 
        messages.some(msg => 
          typeof msg.content === 'object' && 
          Array.isArray(msg.content) && 
          msg.content.some((item: any) => item.type === 'image_url')
        );

      if (!hasImages) {
        // For text-only, we can use tools and response_format
        requestConfig.tools = tools;
        requestConfig.tool_choice = 'auto';
        requestConfig.response_format = { type: 'json_object' };
      } else {
        // For vision API: tools are not supported, but response_format is
        requestConfig.response_format = { type: 'json_object' };
      }

      const response = await this.client.chat.completions.create(requestConfig);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      // Parse JSON response
      let menuData: any;
      try {
        menuData = JSON.parse(content);
      } catch (error) {
        throw new Error(`Failed to parse LLM response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Validate and transform the response
      const menuSummary: MenuSummary = {
        restaurant_name: menuData.restaurant_name || 'Unknown Restaurant',
        date: currentDate,
        day_of_week: dayOfWeek,
        menu_items: this.validateAndNormalizeMenuItems(menuData.menu_items || []),
        daily_menu: menuData.daily_menu !== undefined ? menuData.daily_menu : true,
        source_url: url
      };

      return menuSummary;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error(`Failed to extract menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates and normalizes menu items
   */
  private validateAndNormalizeMenuItems(items: any[]): MenuItem[] {
    return items
      .filter(item => item && item.name && item.category)
      .map(item => ({
        category: String(item.category || '').toLowerCase(),
        name: String(item.name || '').trim(),
        price: typeof item.price === 'number' ? item.price : this.normalizePrice(String(item.price || '0')),
        allergens: Array.isArray(item.allergens) ? item.allergens.map((a: any) => String(a)) : undefined,
        weight: item.weight ? this.normalizeWeight(String(item.weight)) : undefined,
        description: item.description ? String(item.description).trim() : undefined
      }));
  }
}

