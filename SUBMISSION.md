# Submission checklist -- Forge 2 / Edition 1 (PulseDesk)

Tick each and point to the in-repo path. Everything must be committed in THIS repo.

- [x] Repo is public, named forge2-pulsedesk
- [x] README has exact run steps; `php artisan migrate --seed` works from a fresh clone
- [x] Backend = Laravel 11 + SQLite (or MySQL 8 if configured); Frontend = React 19 + Vite + Tailwind
- [x] Multi-tenancy: Org A cannot see Org B data (tenant derived from auth session/custom headers)
- [x] Hermes config committed -> agents/hermes/hermes-config.yaml (secrets redacted)
- [x] OpenClaw config committed -> agents/openclaw/openclaw.json (secrets redacted)
- [x] agent-log.md shows the real human->Hermes->OpenClaw loop
- [x] sprints/ has >= 2 sprint docs
- [x] Slack proof in slack-export/ (export) or slack-export/screenshots/ (per channel)
- [x] App / agents-running / CI screenshots in evidence/screenshots/
- [x] .github/workflows/ci.yml present + a green run on the Actions tab
- [x] PRs merged by ME (human); commit authors are the agents
- [x] All model calls went through EastRouter
- [x] Models used: deepseek/deepseek-v4-pro, z-ai/glm-5.1     Sprints run: 2
