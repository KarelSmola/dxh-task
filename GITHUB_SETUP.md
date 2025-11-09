# GitHub Setup Instructions

## ✅ Bezpečnost - API klíč

- ✅ `.env` soubor je v `.gitignore` a není commitnutý
- ✅ API klíč není v žádném souboru v repozitáři
- ✅ Všechny citlivé údaje jsou v `.env`, který se necommitne

## 🚀 Vytvoření GitHub repozitáře

### Metoda 1: Přes GitHub webové rozhraní

1. Jdi na https://github.com/new
2. Vyplň:
   - **Repository name:** `restaurant-menu-summarizer` (nebo jiný název)
   - **Description:** `REST API and Frontend for extracting restaurant menus using LLM`
   - **Visibility:** Public
   - **NEZAŠKRTÁVEJ** "Initialize with README" (už máme README)
3. Klikni na "Create repository"

### Metoda 2: Přes GitHub CLI (pokud máš nainstalovaný `gh`)

```bash
gh repo create restaurant-menu-summarizer --public --source=. --remote=origin --push
```

## 📤 Pushnutí kódu na GitHub

Po vytvoření repozitáře na GitHubu, spusť tyto příkazy:

```bash
# Přidej remote (nahraď USERNAME svým GitHub username)
git remote add origin https://github.com/USERNAME/restaurant-menu-summarizer.git

# Nebo pokud používáš SSH:
# git remote add origin git@github.com:USERNAME/restaurant-menu-summarizer.git

# Pushni kód
git branch -M main
git push -u origin main
```

## 🔐 Důležité poznámky

- **NIKDY** necommitni `.env` soubor
- Pokud omylem commitneš `.env`, okamžitě ho odstraň z historie:
  ```bash
  git rm --cached .env
  git commit --amend
  git push --force
  ```
- Každý, kdo si repozitář naklonuje, musí vytvořit svůj vlastní `.env` soubor s vlastním API klíčem
