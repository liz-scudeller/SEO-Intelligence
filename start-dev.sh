#!/bin/bash

# Abre o VS Code e espera ele ser fechado
code .
PID=$!
wait $PID

# Gera nome único do branch e mensagem
NOW=$(date '+%Y-%m-%d-%H-%M-%S')
BRANCH_NAME="auto-deploy-$NOW"
MSG="Auto commit - $NOW"

# Limpa arquivos sensíveis e não versionáveis
git rm --cached --ignore-unmatch .env frontend/.env backend/.env
git rm -r --cached --ignore-unmatch frontend/node_modules backend/node_modules
git rm --cached --ignore-unmatch seo-ai-powered-*.json

# Adiciona mudanças
git add .

# Cria novo branch
git checkout -b $BRANCH_NAME

# Commit e push
git commit -m "$MSG"
git push -u origin $BRANCH_NAME
