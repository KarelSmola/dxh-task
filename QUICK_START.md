# 🚀 Rychlý start - Push na GitHub

## Krok 1: Vytvoř repozitář na GitHubu

1. Otevři: **https://github.com/new**
2. Vyplň:
   - **Repository name:** `dxh-task`
   - **Description:** `REST API and Frontend for extracting restaurant menus using LLM`
   - **Visibility:** ✅ Public
   - ⚠️ **NEZAŠKRTÁVEJ** "Initialize with README"
3. Klikni **"Create repository"**

## Krok 2: Pushni kód

Po vytvoření repozitáře spusť:

```bash
cd /Users/karelsmola/Documents/Coding/dxh-task
./push_to_github.sh
```

Nebo ručně:

```bash
git remote add origin https://github.com/karelsmola/dxh-task.git
git branch -M main
git push -u origin main
```

## ✅ Hotovo!

Repozitář bude dostupný na: **https://github.com/karelsmola/dxh-task**

---

**Alternativa s tokenem (automaticky):**
Pokud máš GitHub Personal Access Token, můžeš spustit:
```bash
./create_repo.sh TVUJ_TOKEN
```
