#!/usr/bin/env node
// Repo Pulse — resumo rápido dos repositórios de um usuário via GitHub REST API.
// Uso: GITHUB_TOKEN=xxx node index.js <usuario>
// Requer Node 18+ (fetch nativo). Sem dependências.

const user = process.argv[2];
if (!user) {
  console.error("Uso: node index.js <usuario-github>");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "repo-pulse",
  "X-GitHub-Api-Version": "2022-11-28",
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

function daysAgo(iso) {
  return Math.floor((Date.now() - new Date(iso)) / 86_400_000);
}

async function main() {
  const repos = await gh(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`);
  const rows = repos
    .filter((r) => !r.fork)
    .map((r) => ({
      repo: r.name,
      lang: r.language ?? "-",
      stars: r.stargazers_count,
      forks: r.forks_count,
      issues: r.open_issues_count,
      "último push": `${daysAgo(r.pushed_at)}d`,
    }));

  console.log(`\nRepo Pulse — ${user} (${rows.length} repositórios)\n`);
  console.table(rows);

  const stars = rows.reduce((s, r) => s + r.stars, 0);
  const active = rows.filter((r) => parseInt(r["último push"]) <= 30).length;
  console.log(`⭐ ${stars} estrelas no total · 🔥 ${active} repositórios ativos nos últimos 30 dias\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
