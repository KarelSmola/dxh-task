# 🍽️ Restaurant Menu Summarizer

REST API služba a frontend aplikace pro extrakci a sumarizaci denního menu z webových stránek restaurací pomocí LLM API.

## 📋 Popis

Tato služba umožňuje získat strukturovaná data o denním menu restaurace z libovolné URL adresy. Služba:
1. Získá obsah stránky pomocí web scraperu
2. Pomocí LLM API (OpenAI GPT-4) extrahuje a strukturová menu pro dnešní den
3. Uloží výsledek do cache pro rychlejší následné dotazy
4. Vrátí strukturovaná data v JSON formátu

## 🚀 Rychlý start

### Předpoklady

- Node.js 18+ a npm
- OpenAI API klíč

### Instalace a spuštění

#### Backend (REST API)

1. **Nainstaluj závislosti:**
```bash
npm install
```

2. **Nastav environment proměnné:**
```bash
cp .env.example .env
# Uprav .env a přidej svůj OPENAI_API_KEY
```

3. **Sestav projekt:**
```bash
npm run build
```

4. **Spusť server:**
```bash
npm start
```

Pro vývoj s hot-reload:
```bash
npm run dev
```

Backend poběží na `http://localhost:3000`

#### Frontend (React aplikace)

1. **Přejdi do složky frontend:**
```bash
cd frontend
```

2. **Nainstaluj závislosti:**
```bash
npm install
```

3. **Spusť vývojový server:**
```bash
npm run dev
```

Frontend poběží na `http://localhost:5173`

**Poznámka:** Ujisti se, že backend běží na portu 3000, než spustíš frontend.

## 🐳 Docker

### Sestavení a spuštění

```bash
# Sestav image
docker build -t menu-summarizer .

# Spusť kontejner
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key_here menu-summarizer
```

### Docker Compose

```bash
docker-compose up
```

## 📡 API Dokumentace

### POST /summarize

Sumarizuje menu z URL adresy restaurace.

**Request:**
```json
{
  "url": "https://www.restaurace-example.cz/menu",
  "date": "2025-10-22"  // volitelné, výchozí: dnešní datum
}
```

**Response (200 OK):**
```json
{
  "restaurant_name": "Restaurace Example",
  "date": "2025-10-22",
  "day_of_week": "středa",
  "menu_items": [
    {
      "category": "polévka",
      "name": "Hovězí vývar s nudlemi",
      "price": 45,
      "allergens": ["1", "3", "9"]
    },
    {
      "category": "hlavní jídlo",
      "name": "Kuřecí řízek s bramborovou kaší",
      "price": 145,
      "allergens": ["1", "3", "7"],
      "weight": "150g"
    }
  ],
  "daily_menu": true,
  "source_url": "https://www.restaurace-example.cz/menu"
}
```

**Chybové odpovědi:**
- `400` - Neplatný request (chybějící nebo neplatná URL)
- `404` - Stránka nenalezena
- `502` - Chyba LLM služby
- `504` - Timeout při načítání stránky
- `500` - Vnitřní chyba serveru

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

## 📝 Příklady použití

### cURL

```bash
curl -X POST http://localhost:3000/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.restaurace-example.cz/menu"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.restaurace-example.cz/menu'
  })
});

const menu = await response.json();
console.log(menu);
```

## 🧪 Testování

```bash
# Spusť všechny testy
npm test

# Spusť testy s coverage
npm run test:coverage

# Spusť testy ve watch módu
npm run test:watch
```

### Testy zahrnují:
- **Unit testy:**
  - `ScraperService` - testování extrakce textu z HTML
  - `LLMService` - testování validace a normalizace dat
  
- **Integrační testy:**
  - Kompletní flow od API requestu po response
  
- **Cache testy:**
  - Ověření, že druhý request se stejnou URL a datem nepoužije LLM API

## 🏗️ Architektura

### Technologie

**Backend:**
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Web Scraping:** Cheerio + Puppeteer (Varianta A - vlastní scraper s fallback)
- **LLM API:** OpenAI GPT-4o s structured outputs a Vision API
- **Cache:** SQLite (persistentní storage)
- **Testy:** Jest + Supertest

**Frontend:**
- **Framework:** React 18
- **Build tool:** Vite
- **Styling:** Tailwind CSS
- **HTTP client:** Axios

### Struktura projektu

```
dxh-task/
├── src/                    # Backend source
│   ├── types/              # TypeScript typy
│   ├── services/           # Business logika
│   │   ├── scraper.ts     # Web scraping
│   │   ├── llm.ts         # LLM integrace
│   │   ├── cache.ts       # Cache management
│   │   └── menuService.ts # Orchestrace
│   ├── routes/            # API routes
│   └── index.ts           # Entry point
├── src/__tests__/         # Integrační testy
├── src/services/__tests__/ # Unit testy
├── frontend/              # Frontend aplikace
│   ├── src/
│   │   ├── components/   # React komponenty
│   │   ├── services/     # API klient
│   │   └── types/        # TypeScript typy
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 💡 Rozhodnutí o řešení

### Web Content Retrieval - Varianta A (Cheerio + Puppeteer)

Zvolil jsem **Varianta A - vlastní scraper s Cheerio a Puppeteer** z následujících důvodů:
- **Kontrola:** Plná kontrola nad procesem získávání dat
- **Rychlost:** Cheerio je rychlý a lehký (pouze server-side rendering) - používá se jako první volba
- **Fallback:** Puppeteer pro JavaScript-renderovaný obsah (SPA, React, Vue)
- **Náklady:** Žádné dodatečné náklady na externí API (kromě LLM)
- **Flexibilita:** Snadné přidání custom logiky pro specifické stránky
- **Inteligentní detekce:** Automaticky detekuje, kdy použít Puppeteer (když Cheerio nenajde menu)

**Implementace:**
- Nejprve se zkusí Cheerio (rychlejší)
- Pokud se nenajde menu obsah (polévka, cena, Kč), automaticky se použije Puppeteer
- Puppeteer spustí headless browser, počká na načtení JavaScriptu a extrahuje obsah
- Podpora pro cookie bannery, scrollování a lazy loading

Alternativa s LLM built-in search by byla užitečná, ale vlastní scraper poskytuje větší kontrolu a flexibilitu.

### Caching - SQLite

Zvolil jsem **SQLite** pro cache z následujících důvodů:
- **Persistentní storage:** Data přežijí restart serveru
- **Jednoduchost:** Žádná externí závislost (na rozdíl od PostgreSQL/Redis)
- **Výkon:** Pro tento use case je SQLite dostačující
- **TTL implementace:** Snadná implementace expirace na půlnoc

Cache klíč: `URL + datum` - menu se mění denně, takže každý den má vlastní cache entry. Expirace nastává automaticky o půlnoci následujícího dne.

### LLM Integration

- **Model:** GPT-4o pro nejlepší kvalitu extrakce
- **Vision API:** Podpora pro extrakci menu z obrázků (např. Cafe Imperial)
- **Structured outputs:** JSON schema pro konzistentní výstup
- **Function calling:** Implementováno pro normalizaci cen, detekci dne v týdnu a konverzi vah (pouze pro text, ne pro Vision API)
- **Prompt engineering:** Detailní systémový prompt s instrukcemi pro extrakci

### Error Handling

Implementováno komplexní error handling pro:
- Network chyby (timeout, nedostupná stránka)
- HTTP chyby (404, 500)
- LLM API chyby
- Neplatné vstupy
- Parsing chyby

## ⚠️ Edge Cases

Následující edge cases jsou řešeny nebo dokumentovány:

✅ **Stránka není dostupná (404, timeout):** 
- Error handling s vhodnými HTTP status codes
- Informativní chybové zprávy

✅ **Menu není v textové podobě (pouze obrázek):**
- Implementováno: GPT-4o Vision API pro extrakci menu z obrázků
- Funguje pro stránky jako Cafe Imperial, kde je menu v obrázku
- Automatická detekce obrázků s menu a použití Vision API

✅ **Menu neobsahuje dnešní den:**
- LLM vrací prázdné `menu_items`, ale zachovává metadata
- `daily_menu: false` indikuje, že se nejedná o denní menu

✅ **Nekonzistentní formát cen:**
- Function calling normalizuje různé formáty ("145,-", "145 Kč", "145") → 145

✅ **Chybějící alergeny:**
- Alergeny jsou volitelné pole v MenuItem

✅ **Cache invalidace:**
- Automatická expirace o půlnoci
- Možnost manuálního cleanupu

⚠️ **Menu načtené JavaScriptem (SPA, React, Vue):**
- Implementováno: Puppeteer jako fallback pro JavaScript-renderovaný obsah
- Automatická detekce, kdy použít Puppeteer (když Cheerio nenajde menu)
- **Omezení:** Některé stránky (např. Barabizna) mohou vyžadovat specifické interakce nebo načítají menu z externího API, což může způsobit, že menu nebude nalezeno

## 🔐 Environment Variables

```bash
PORT=3000                    # Port serveru (výchozí: 3000)
OPENAI_API_KEY=sk-...       # OpenAI API klíč (povinné)
NODE_ENV=development        # Node environment
```

## 📊 Testovací URL

Pro testování můžete použít následující restaurace s denním menu:

### ✅ Fungující URL

- **Cafe Imperial** - `https://www.cafeimperial.cz/poledni-nabidka/`
  - Menu je v obrázku, aplikace ho úspěšně extrahuje pomocí GPT-4o Vision API
  - Funguje správně s detekcí obrázků a Vision API

### ⚠️ Neúplně fungující URL

- **Barabizna** - `https://www.barabizna.cz/#denni-menu`
  - Menu je pravděpodobně načtené pomocí JavaScriptu nebo vyžaduje specifickou interakci
  - Aplikace detekuje stránku, ale nenachází menu položky
  - Možné příčiny: menu načtené až po kliknutí, v iframe, nebo z externího API
  - **Status:** Aplikace vrací prázdné `menu_items`, ale správně identifikuje název restaurace

## 🚧 Co bych chtěl dodělat

- [ ] OCR podpora pro menu pouze v obrázcích
- [ ] Rate limiting pro API endpointy
- [ ] API key autentizace
- [ ] Webhook notifikace při změně menu
- [ ] Detekce vegetariánských/veganských jídel
- [ ] Filtrování podle alergenů
- [ ] Monitoring a logging (Winston/Pino)
- [ ] Metriky (Prometheus)

## 🤝 Kontakt

karelsmola21@gmail.com

