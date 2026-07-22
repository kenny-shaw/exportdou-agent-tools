# ExportDou Agent Tools

Official CLI and Agent Skill for ExportDou (https://exportdou.cn), a durable public Douyin comment export service.

## CLI

~~~bash
npx exportdou login
npx exportdou export "https://www.douyin.com/video/..." --limit 1000
npx exportdou status "<task-id>" --json
npx exportdou preview "<task-id>" --limit 20 --json
npx exportdou download "<task-id>" --output comments.csv
~~~

The CLI never asks for Douyin cookies. It submits public video links to ExportDou, returns a task ID immediately, and lets the task continue in the cloud.

## Agent Skill

~~~bash
npx skills add kenny-shaw/exportdou-agent-tools --skill exportdou
~~~

The Skill teaches compatible agents to submit each export once, preserve the task ID, use one-shot status checks, preview small JSON samples for analysis, and download full CSV/XLSX results when needed.

## Links

- Website: https://exportdou.cn
- API: https://exportdou.cn/developers
- Skill: https://exportdou.cn/SKILL.md
- npm: https://www.npmjs.com/package/exportdou
- skills.sh: https://www.skills.sh/kenny-shaw/exportdou-agent-tools/exportdou
