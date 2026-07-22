#!/usr/bin/env bash
set -euo pipefail

tool_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

diff -u "$tool_root/skills/exportdou/SKILL.md" "$tool_root/SKILL.md"

if [[ -n "${EXPORTDOU_PUBLIC_SKILL_PATH:-}" ]]; then
  diff -u "$tool_root/skills/exportdou/SKILL.md" "$EXPORTDOU_PUBLIC_SKILL_PATH"
fi
