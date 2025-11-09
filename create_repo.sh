#!/bin/bash

# Script pro vytvoření GitHub repozitáře
# Použití: ./create_repo.sh [GITHUB_TOKEN]

GITHUB_USER="karelsmola"
REPO_NAME="dxh-task"

if [ -z "$1" ]; then
  echo "⚠️  GitHub Personal Access Token není poskytnut."
  echo ""
  echo "Vytvoř repozitář ručně:"
  echo "1. Jdi na: https://github.com/new"
  echo "2. Název: $REPO_NAME"
  echo "3. Public"
  echo "4. NEZAŠKRTÁVEJ 'Initialize with README'"
  echo "5. Klikni 'Create repository'"
  echo ""
  echo "Pak spusť:"
  echo "  git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git"
  echo "  git branch -M main"
  echo "  git push -u origin main"
  exit 1
fi

TOKEN="$1"

echo "Vytvářím repozitář $REPO_NAME na GitHubu..."

# Vytvoř repozitář pomocí GitHub API
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"REST API and Frontend for extracting restaurant menus using LLM\",\"public\":true}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Repozitář úspěšně vytvořen!"
  
  # Přidej remote a pushni
  git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git 2>/dev/null || git remote set-url origin https://github.com/$GITHUB_USER/$REPO_NAME.git
  git branch -M main
  git push -u origin main
  
  echo "✅ Kód úspěšně pushnut na GitHub!"
  echo "🔗 Repozitář: https://github.com/$GITHUB_USER/$REPO_NAME"
else
  echo "❌ Chyba při vytváření repozitáře (HTTP $HTTP_CODE)"
  echo "$BODY" | head -20
  exit 1
fi
