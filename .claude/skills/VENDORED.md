# Vendored skills

These skills are copied into the repo so that every Claude Code session (including
ephemeral cloud sessions) has them without a plugin install. Each folder keeps its
upstream LICENSE.

| Skill folder | Upstream | Commit | License |
| --- | --- | --- | --- |
| `impeccable/` (+ `../agents/impeccable-*.md`) | https://github.com/pbakaus/impeccable (`plugin/`) | df07b8e518e10cdecd8cd7712d9958b6f396250e | Apache-2.0 |
| `arena/` | https://github.com/Jakeschincariol/arena-skill (`skills/arena`) | 18dfc928b135629e0eddfdd445a06400d04ed439 | MIT |
| `taste-skill/`, `redesign-skill/`, `output-skill/`, `soft-skill/`, `minimalist-skill/`, `brutalist-skill/` | https://github.com/Leonxlnx/taste-skill (`skills/`) | d631a8827f99414d2b6daba4ef08b7f8701751d7 | MIT |

To use the plugin versions instead (local Claude Code), run
`/plugin marketplace add pbakaus/impeccable` and `/plugin marketplace add Jakeschincariol/arena-skill`,
then delete the matching folders here so the skills are not listed twice.
