#!/usr/bin/env node
// Markdown診断結果をスタイル付きHTMLに一括変換（デザイン改善版）

const fs = require('fs');
const path = require('path');

// 診断結果のスタイル定義（LPと統一）
const styles = {
  container: 'max-width: 900px; margin: 0 auto; padding: 40px 30px; font-family: "Yu Mincho", "游明朝", "YuMincho", "Hiragino Mincho ProN", "HG明朝E", "ＭＳ Ｐ明朝", serif; line-height: 2.1; color: #2d2d2d;',
  header: 'text-align: center; padding: 80px 40px; background: linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%); color: white; border-radius: 0; margin-bottom: 60px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);',
  title: 'font-size: 48px; margin: 0; font-weight: 500; letter-spacing: 6px;',
  subtitle: 'font-size: 17px; margin-top: 25px; opacity: 0.9; letter-spacing: 2px;',
  introSection: 'background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%); border-top: 1px solid #e0d5c7; border-bottom: 1px solid #e0d5c7; padding: 50px 40px; margin: 60px 0; border-radius: 0; box-shadow: none; letter-spacing: 1px;',
  section: 'margin: 70px 0;',
  sectionTitle: 'font-size: 32px; color: #2d1b4e; border-bottom: 2px solid #c9a961; padding-bottom: 15px; margin-bottom: 40px; font-weight: 500; letter-spacing: 3px;',
  subsectionBox: 'background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%); border-left: 3px solid #c9a961; padding: 35px 40px; margin: 35px 0; border-radius: 0; box-shadow: 0 2px 16px rgba(0,0,0,0.04);',
  subsectionTitle: 'font-size: 24px; color: #2d1b4e; margin: 0 0 25px 0; font-weight: 500; letter-spacing: 2px;',
  paragraph: 'margin: 20px 0; line-height: 2.2; font-size: 16px; letter-spacing: 0.5px;',
  listBox: 'background: #fafafa; padding: 25px 35px; margin: 25px 0; border-radius: 0; border-left: 2px solid #e0d5c7;',
  list: 'margin: 15px 0; padding-left: 30px; list-style: none;',
  listItem: 'margin: 15px 0; line-height: 2.1; letter-spacing: 0.5px; padding-left: 25px; position: relative;',
  actionBox: 'background: linear-gradient(135deg, #fdfbf7 0%, #f8f6f1 100%); border: 1px solid #e0d5c7; padding: 35px 40px; margin: 40px 0; border-radius: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.04);',
  footer: 'text-align: center; padding: 60px 40px; background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%); border-radius: 0; margin-top: 100px; border-top: 1px solid #e0d5c7;',
  button: 'display: inline-block; background: linear-gradient(135deg, #c9a961 0%, #a08445 100%); color: white; padding: 18px 55px; border-radius: 4px; text-decoration: none; font-weight: 500; margin: 15px; font-size: 16px; box-shadow: 0 6px 24px rgba(201, 169, 97, 0.35); transition: transform 0.2s; letter-spacing: 2px; border: 1px solid rgba(255, 255, 255, 0.2);'
};

// Markdownを構造化して解析
function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const structure = {
    title: '',
    intro: [],
    sections: []
  };

  let currentSection = null;
  let currentSubsection = null;
  let introMode = true;

  for (const line of lines) {
    // H1（タイトル）
    if (line.startsWith('# ')) {
      structure.title = line.replace('# ', '');
      continue;
    }

    // H2（セクション）
    if (line.startsWith('## ')) {
      introMode = false;
      if (currentSection) {
        structure.sections.push(currentSection);
      }
      currentSection = {
        title: line.replace('## ', ''),
        subsections: [],
        content: []
      };
      currentSubsection = null;
      continue;
    }

    // H3（サブセクション）
    if (line.startsWith('### ')) {
      currentSubsection = {
        title: line.replace('### ', ''),
        content: []
      };
      currentSection.subsections.push(currentSubsection);
      continue;
    }

    // 空行はスキップ
    if (line.trim() === '') {
      continue;
    }

    // 水平線
    if (line.trim() === '---') {
      continue;
    }

    // コンテンツ
    if (introMode) {
      structure.intro.push(line);
    } else if (currentSubsection) {
      currentSubsection.content.push(line);
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  if (currentSection) {
    structure.sections.push(currentSection);
  }

  return structure;
}

// コンテンツを整形
function formatContent(lines) {
  let html = '';
  let inList = false;

  for (const line of lines) {
    // リスト
    if (line.match(/^\d+\.\s/) || line.startsWith('- ')) {
      if (!inList) {
        html += `<div style="${styles.listBox}"><ul style="${styles.list}">`;
        inList = true;
      }
      const listItem = line.replace(/^\d+\.\s/, '').replace(/^-\s/, '');
      const formatted = listItem.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #555;">$1</strong>');
      html += `<li style="${styles.listItem}">${formatted}</li>`;
      continue;
    } else if (inList) {
      html += '</ul></div>';
      inList = false;
    }

    // 太字
    const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #555;">$1</strong>');

    // 段落
    html += `<p style="${styles.paragraph}">${formatted}</p>`;
  }

  if (inList) {
    html += '</ul></div>';
  }

  return html;
}

// 構造化データからHTMLを生成
function structureToHtml(structure) {
  let html = '';

  // ヘッダー
  html += `
    <div style="${styles.header}">
      <h1 style="${styles.title}">${structure.title}</h1>
      <p style="${styles.subtitle}">あなたの縁のベース</p>
    </div>`;

  // 導入部（まとめてボックス化）
  if (structure.intro.length > 0) {
    html += `<div style="${styles.introSection}">`;
    html += formatContent(structure.intro);
    html += `</div>`;
  }

  // セクション
  for (const section of structure.sections) {
    html += `<div style="${styles.section}">`;
    html += `<h2 style="${styles.sectionTitle}">${section.title}</h2>`;

    // セクション直下のコンテンツ
    if (section.content.length > 0) {
      html += formatContent(section.content);
    }

    // サブセクション（ボックス化）
    for (const subsection of section.subsections) {
      // 「今日から」「すぐに」「明日」等のアクション系はアクションボックス
      if (subsection.title.includes('今日から') ||
          subsection.title.includes('すぐに') ||
          subsection.title.includes('明日') ||
          subsection.title.includes('今週') ||
          subsection.title.includes('今月') ||
          subsection.title.includes('あなたへのメッセージ')) {
        html += `<div style="${styles.actionBox}">`;
        html += `<h3 style="${styles.subsectionTitle}">${subsection.title}</h3>`;
        html += formatContent(subsection.content);
        html += `</div>`;
      } else {
        // 通常のサブセクション
        html += `<div style="${styles.subsectionBox}">`;
        html += `<h3 style="${styles.subsectionTitle}">${subsection.title}</h3>`;
        html += formatContent(subsection.content);
        html += `</div>`;
      }
    }

    html += `</div>`;
  }

  return html;
}

// HTMLテンプレート
function createHtmlPage(content, title) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - 縁診断結果</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: linear-gradient(to bottom, #fafafa 0%, #ffffff 50%, #fafafa 100%);
      min-height: 100vh;
      padding: 20px 0;
    }
    a:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(201, 169, 97, 0.45);
    }
    .listItem::before {
      content: "—";
      position: absolute;
      left: 0;
      color: #c9a961;
      font-weight: normal;
    }
  </style>
</head>
<body>
  <div style="${styles.container}">
    ${content}

    <div style="${styles.footer}">
      <p style="margin-bottom: 30px; color: #666; font-size: 16px; line-height: 1.8;">この診断結果があなたの人生の良縁につながりますように。</p>
      <a href="/" style="${styles.button}">トップに戻る</a>
      <a href="/free" style="${styles.button}">無料診断をもう一度</a>
    </div>
  </div>
</body>
</html>`;
}

// ディレクトリ内のすべてのMarkdownファイルを変換
function convertDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let convertedCount = 0;

  files.forEach(file => {
    if (file.endsWith('.md')) {
      const mdPath = path.join(dirPath, file);
      const htmlPath = mdPath.replace('.md', '.html');

      // Markdownファイルを読み込む
      const markdown = fs.readFileSync(mdPath, 'utf-8');

      // 構造化
      const structure = parseMarkdown(markdown);

      // HTMLに変換
      const htmlContent = structureToHtml(structure);
      const fullHtml = createHtmlPage(htmlContent, structure.title);

      // HTMLファイルを書き出す
      fs.writeFileSync(htmlPath, fullHtml);

      console.log(`✅ ${file} → ${file.replace('.md', '.html')}`);
      convertedCount++;
    }
  });

  return convertedCount;
}

// メイン処理
function main() {
  const resultsDir = path.join(__dirname, '..', 'public', 'results');

  console.log('📖 診断結果をMarkdownからHTMLに変換しています...\n');

  // 各五行フォルダを処理
  const folders = ['01_火', '02_木', '03_土', '04_金', '05_水'];
  let totalConverted = 0;

  folders.forEach(folder => {
    const folderPath = path.join(resultsDir, folder);
    if (fs.existsSync(folderPath)) {
      console.log(`\n【${folder}】`);
      const count = convertDirectory(folderPath);
      totalConverted += count;
    }
  });

  console.log(`\n✨ 完了！合計 ${totalConverted} ファイルを変換しました。`);
  console.log('\nブラウザで確認してください：');
  console.log('例: public/results/01_火/火の夏雨.html');
}

main();
