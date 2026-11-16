#!/usr/bin/env bash
# Re-install the valuation + validation toolkit in a fresh session.
set -euo pipefail
cd "$(dirname "$0")/.."
git submodule update --init --depth 1
pip install -q "tools/startup-valuation[mcp]"          # Python lib + MCP server (.mcp.json)
pip install -q -r tools/VettIQ/requirements.txt || true # optional: needs GROQ/Tavily keys in tools/VettIQ/.env
python3 -c "from startup_valuation import core; print('startup-valuation OK')"
