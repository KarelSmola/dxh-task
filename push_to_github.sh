#!/bin/bash

# Automatický push na GitHub
# Zkusí vytvořit repozitář pomocí GitHub API, pokud máš token
# Jinak použije git příkazy (musíš nejdřív vytvořit repozitář na GitHubu)

GITHUB_USER="karelsmola"
REPO_NAME="dxh-task"

echo "🚀 Připravuji push na GitHub..."

# Zkontroluj, jestli už existuje remote
if git remote get-url origin > /dev/null 2>&1; then
  echo "✅ Remote 'origin' už existuje"
  REMOTE_URL=$(git remote get-url origin)
  echo "   URL: $REMOTE_URL"
else
  echo "📝 Přidávám remote 'origin'..."
  git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git
fi

# Zkontroluj branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "📝 Přejmenovávám branch na 'main'..."
  git branch -M main
fi

echo ""
echo "📤 Pushuji kód na GitHub..."
echo "   Pokud repozitář ještě neexistuje, vytvoř ho na:"
echo "   https://github.com/new"
echo "   Název: $REPO_NAME"
echo "   Public"
echo ""

# Zkus push
if git push -u origin main 2>&1; then
  echo ""
  echo "✅ Úspěšně pushnuto na GitHub!"
  echo "🔗 Repozitář: https://github.com/$GITHUB_USER/$REPO_NAME"
else
  echo ""
  echo "⚠️  Push selhal. Možné příčiny:"
  echo "   1. Repozitář ještě neexistuje na GitHubu"
  echo "   2. Nemáš oprávnění k pushnutí"
  echo ""
  echo "Vytvoř repozitář na: https://github.com/new"
  echo "Pak znovu spusť: ./push_to_github.sh"
fi
