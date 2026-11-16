# Valuation + validation toolkit

Install in a fresh session: `bash tools/setup.sh`.

| Path | What | Use |
|---|---|---|
| `tools/startup-valuation` | 80+ formulas, Python lib + MCP server | `.mcp.json` registers it; `valuation/namo_valuation.py` uses it |
| `tools/Startup-Valuation-Studio` | offline browser calculator (Berkus/Scorecard/RFS) | open `startup_valuation_studio_demo.html` |
| `tools/startup-skill` | 8-phase validation/strategy skills | vendored into `.claude/skills/startup-*` |
| `tools/idea-validation-agents` | market-demand / TAM / pricing skills | vendored into `.claude/skills/iv-*` |
| `tools/VettIQ` | FastAPI+Streamlit Go/No-Go app | needs its own API keys in `tools/VettIQ/.env` |

All MIT. Submodules are pinned to the commit that was installed on 2026-11-16.
