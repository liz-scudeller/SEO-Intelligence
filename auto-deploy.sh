#!/bin/bash

# Nome do branch automático
BRANCH_NAME="auto-deploy"

# Garante que .env, node_modules e o JSON não sejam versionados
git rm --cached --ignore-unmatch .env frontend/.env backend/.env
git rm -r --cached --ignore-unmatch frontend/node_modules backend/node_modules
git rm --cached --ignore-unmatch seo-ai-powered-*.json

# Adiciona tudo que for permitido pelo .gitignore
git add .

# Pede mensagem de commit
echo "Digite a mensagem de commit:"
read msg

# Checa se branch existe
if git show-ref --quiet refs/heads/$BRANCH_NAME; then
  git checkout $BRANCH_NAME
else
  git checkout -b $BRANCH_NAME
fi

# Faz o commit
git commit -m "$msg"

# Push para o GitHub
git push -u origin $BRANCH_NAME
