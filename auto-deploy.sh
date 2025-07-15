#!/bin/bash

BRANCH_NAME="auto-deploy"

git rm --cached --ignore-unmatch .env frontend/.env backend/.env
git rm -r --cached --ignore-unmatch frontend/node_modules backend/node_modules
git rm --cached --ignore-unmatch seo-ai-powered-*.json

git add .

echo "Digite a mensagem de commit:"
read msg

if git show-ref --quiet refs/heads/$BRANCH_NAME; then
  git checkout $BRANCH_NAME
else
  git checkout -b $BRANCH_NAME
fi

if git diff --cached --quiet; then
  echo "Nenhuma mudança para commitar."
  exit 0
fi

git commit -m "$msg"
git push -u origin $BRANCH_NAME
