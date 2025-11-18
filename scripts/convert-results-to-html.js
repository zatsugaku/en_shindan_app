#!/usr/bin/env node
// Markdown診断結果をスタイル付きHTMLに一括変換（デザイン改善版）

const fs = require('fs');
const path = require('path');

// 診断結果のスタイル定義
const styles = {
  container: 'max-width: 800px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif; line-height: 1.9; color: #333;',
  header: 'text-align: center; padding: 50px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; margin-bottom: 50px; box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);',
  title: 'font-size: 42px; margin: 0; font-weight: bold; letter-spacing: 2px;',
  subtitle: 'font-size: 18px; margin-top: 20px; opacity: 0.95; letter-spacing: 1px;',
  introSection: 'background: linear-gradient(to bottom, #f9f9f9 0%, #ffffff 100%); border-left: 5px solid #667eea; padding: 30px; margin: 40px 0; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);',
  section: 'margin: 50px 0;',
  sectionTitle: 'font-size: 28px; color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 12px; margin-bottom: 30px; font-weight: bold;',
  subsectionBox: 'background: #fafafa; border-left: 4px solid #764ba2; padding: 25px 30px; margin: 25px 0; border-radius: 8px;',
  subsectionTitle: 'font-size: 22px; color: #764ba2; margin: 0 0 20px 0; font-weight: bold;',
  paragraph: 'margin: 18px 0; line-height: 2.0; font-size: 16px;',
  listBox: 'background: #f5f5f5; padding: 20px 30px; margin: 20px 0; border-radius: 8px;',
  list: 'margin: 10px 0; padding-left: 25px;',
  listItem: 'margin: 12px 0; line-height: 1.9;',
  actionBox: 'background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-left: 5px solid #2196f3; padding: 25px 30px; margin: 30px 0; border-radius: 12px; box-shadow: 0 2px 12px rgba(33, 150, 243, 0.15);',
  footer: 'text-align: center; padding: 50px 30px; background: #f5f5f5; border-radius: 16px; margin-top: 80px;',
  button: 'display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 48px; border-radius: 50px; text-decoration: none; font-weight: bold; margin: 12px; font-size: 16px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); transition: transform 0.2s;'
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
      const formatted = listItem.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #667eea;">$1</strong>');
      html += `<li style="${styles.listItem}">${formatted}</li>`;
      continue;
    } else if (inList) {
      html += '</ul></div>';
      inList = false;
    }

    // 太字
    const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #667eea;">$1</strong>');

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
