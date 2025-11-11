/**
 * 結果ページ生成スクリプト
 * - firestore_data.json の results セクションから 5 つの HTML を生成
 * - 出力先: public/results/
 *
 * 実行: node scripts/generate-result-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'firestore_data.json');
const OUT_DIR = path.join(ROOT, 'public', 'results');

const elementColorClass = {
  '木': 'wood',
  '火': 'fire',
  '土': 'earth',
  '金': 'metal',
  '水': 'water'
};

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildShareLinks(title, pagePath) {
  const siteBase = 'https://en-shindan-app.web.app';
  const url = encodeURIComponent(`${siteBase}${pagePath}`);
  const text = encodeURIComponent(`${title} | 縁診断`);
  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    line: `https://social-plugins.line.me/lineit/share?url=${url}`
  };
}

function renderHTML(resultId, data) {
  const colorClass = elementColorClass[data.element] || '';
  const pagePath = `/results/${resultId}.html`;
  const share = buildShareLinks(data.title, pagePath);
  const compat = (data && data.compatibility) ? data.compatibility : {};
  const compatGood = Array.isArray(compat.good) ? compat.good.join('・') : '';
  const compatNeutral = Array.isArray(compat.neutral) ? compat.neutral.join('・') : '';
  const compatChallenging = Array.isArray(compat.challenging) ? compat.challenging.join('・') : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(data.title)} | 縁診断</title>
  <meta name="description" content="${esc(data.description)}" />
  <meta property="og:title" content="${esc(data.title)} | 縁診断" />
  <meta property="og:description" content="${esc(data.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://en-shindan-app.web.app${pagePath}" />
  <link rel="canonical" href="https://en-shindan-app.web.app${pagePath}" />
  <link rel="stylesheet" href="/css/style.css" />
  <style>
    .result-hero { border-radius: 16px; color: #fff; padding: 28px 20px; margin-bottom: 20px; }
    .result-hero.wood { background: var(--color-wood); }
    .result-hero.fire { background: var(--color-fire); }
    .result-hero.earth { background: var(--color-earth); }
    .result-hero.metal { background: var(--color-metal); color: #111; }
    .result-hero.water { background: var(--color-water); }

    .section { background: #fff; border-radius: 16px; box-shadow: var(--shadow); padding: 20px; margin-bottom: 16px; }
    .section h2 { font-size: 1.2rem; color: var(--color-primary); margin-bottom: 10px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.25); font-size: .9rem; }
    .list { margin-left: 18px; }
    .list li { margin: 6px 0; }
    .compat { display: grid; grid-template-columns: 1fr; gap: 4px; }
    .compat-row { display: flex; justify-content: space-between; padding: 6px 10px; background: #f7f7f7; border-radius: 8px; }
    .actions { text-align: center; margin-top: 12px; }
    .share { display: flex; gap: 12px; justify-content: center; margin-top: 8px; }
    .share a { text-decoration: none; padding: 10px 14px; border-radius: 8px; color: #fff; }
    .share a.twitter { background: #1DA1F2; }
    .share a.line { background: #06C755; }
  </style>
</head>
<body>
  <div class="container">
    <header class="result-hero ${colorClass}">
      <h1 class="title" style="font-size:1.8rem; margin-bottom: 6px;">${esc(data.title)}</h1>
      <div class="badge">五行: ${esc(data.element)}</div>
    </header>

    <main class="content" style="margin-bottom: 18px;">
      <section class="section">
        <h2>説明</h2>
        <p>${esc(data.description)}</p>
      </section>

      <section class="section">
        <h2>特徴</h2>
        <ul class="list">
          ${(data.characteristics || []).map(c => `<li>${esc(c)}</li>`).join('')}
        </ul>
      </section>

      <section class="section">
        <h2>相性</h2>
        <div class="compat">
          <div class="compat-row"><span>良い</span><strong>${esc(compatGood)}</strong></div>
          <div class="compat-row"><span>ふつう</span><strong>${esc(compatNeutral)}</strong></div>
          <div class="compat-row"><span>難しい</span><strong>${esc(compatChallenging)}</strong></div>
        </div>
      </section>

      <section class="section">
        <h2>アドバイス</h2>
        <p>${esc(data.advice)}</p>
      </section>

      <section class="section">
        <h2>ラッキースポット / カラー</h2>
        <p>スポット: ${esc((data.luckySpots || []).join('、 '))}</p>
        <p>カラー: ${esc((data.luckyColors || []).join('、 '))}</p>
      </section>

      <section class="section">
        <h2>共有する</h2>
        <div class="share">
          <a class="twitter" target="_blank" rel="noopener" href="${share.twitter}">Twitterでシェア</a>
          <a class="line" target="_blank" rel="noopener" href="${share.line}">LINEでシェア</a>
        </div>
        <div class="actions" style="margin-top:12px;">
          <a href="/diagnose.html" class="btn-primary" style="padding:10px 20px; font-size:1rem;">もう一度診断する</a>
        </div>
      </section>
    </main>

    <footer>
      <p>&copy; 2025 縁診断.</p>
    </footer>
  </div>
</body>
</html>`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const results = data.results || {};

  ensureDir(OUT_DIR);

  const entries = Object.entries(results);
  if (!entries.length) {
    console.error('❌ results データが見つかりません');
    process.exit(1);
  }

  entries.forEach(([id, item]) => {
    const html = renderHTML(id, item);
    const outPath = path.join(OUT_DIR, `${id}.html`);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`✅ public/results/${id}.html 生成完了`);
  });
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('❌ 生成中にエラーが発生しました:', e);
    process.exit(1);
  }
}
