#!/bin/bash
# HerdMaster Pro — Agent Pipeline Launcher
# Usage: ./.agents/run.sh <agent> <feature>
# Example: ./.agents/run.sh product feat-milk-tracking

set -e

AGENT=$1
FEATURE=$2

if [ -z "$AGENT" ] || [ -z "$FEATURE" ]; then
  echo "=== HerdMaster Pro Agent Pipeline ==="
  echo ""
  echo "Usage: $0 <agent> <feature-name>"
  echo ""
  echo "Agents:"
  echo "  product   — Создать спецификацию из user story"
  echo "  backend   — Реализовать серверную логику"
  echo "  qa        — Протестировать реализацию"
  echo "  frontend  — Реализовать UI"
  echo "  release   — Финализировать и задеплоить"
  echo ""
  echo "Example:"
  echo "  $0 product feat-milk-tracking"
  echo "  $0 backend feat-milk-tracking"
  echo ""
  echo "Active features:"
  if [ -d "features/active" ] && [ "$(ls -A features/active 2>/dev/null)" ]; then
    ls -1 features/active/
  else
    echo "  (none)"
  fi
  exit 1
fi

FEATURE_DIR="features/active/$FEATURE"
PROMPT_FILE=".agents/prompts/$AGENT.md"

# Validate agent
if [ ! -f "$PROMPT_FILE" ]; then
  echo "Error: Agent prompt not found: $PROMPT_FILE"
  echo "Available agents: product, backend, qa, frontend, release"
  exit 1
fi

# Create feature directory
mkdir -p "$FEATURE_DIR/handoffs"

echo "=== HerdMaster Pro: $AGENT Agent ==="
echo "Feature: $FEATURE"
echo "Directory: $FEATURE_DIR/"
echo ""
echo "Copy and paste this into Claude Code:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

case $AGENT in
  product)
    echo "Ты — Product Agent. Прочитай свой промпт: $PROMPT_FILE"
    echo ""
    echo "Фича: $FEATURE_DIR/"
    echo ""
    echo "User Story:"
    echo "(впиши user story здесь)"
    echo ""
    echo "Создай спецификацию и хэндофф."
    ;;
  backend)
    echo "Ты — Backend Agent. Прочитай свой промпт: $PROMPT_FILE"
    echo ""
    echo "Фича: $FEATURE_DIR/"
    echo "Спецификация: $FEATURE_DIR/spec.md"
    echo "Хэндофф: $FEATURE_DIR/handoffs/01-product.md"
    echo ""
    echo "Реализуй backend по спецификации и создай хэндофф."
    ;;
  qa)
    echo "Ты — QA Agent. Прочитай свой промпт: $PROMPT_FILE"
    echo ""
    echo "Фича: $FEATURE_DIR/"
    echo "Хэндофф backend: $FEATURE_DIR/handoffs/02-backend.md"
    echo ""
    echo "Протестируй реализацию и создай хэндофф."
    ;;
  frontend)
    echo "Ты — Frontend Agent. Прочитай свой промпт: $PROMPT_FILE"
    echo ""
    echo "Фича: $FEATURE_DIR/"
    echo "Хэндофф QA: $FEATURE_DIR/handoffs/03-qa.md"
    echo ""
    echo "Реализуй UI и создай хэндофф."
    ;;
  release)
    echo "Ты — Release Agent. Прочитай свой промпт: $PROMPT_FILE"
    echo ""
    echo "Фича: $FEATURE_DIR/"
    echo "Хэндофф frontend: $FEATURE_DIR/handoffs/04-frontend.md"
    echo ""
    echo "Финализируй и подготовь к релизу."
    ;;
  *)
    echo "Unknown agent: $AGENT"
    echo "Available: product, backend, qa, frontend, release"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
