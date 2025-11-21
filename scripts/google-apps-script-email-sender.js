/**
 * 縁診断 - Googleフォーム回答からメール送信
 * Google Apps Scriptで使用
 *
 * 使い方:
 * 1. Googleフォームに紐づいたスプレッドシートを開く
 * 2. 拡張機能 > Apps Script
 * 3. このコードを貼り付け
 * 4. カスタムメニューから「診断実行」を選択
 */

// ==================== 設定 ====================

// 診断ロジック用の定数（diagnosis-logic.jsと同じ）
const PHENOMENA_MAP = {
  0: "春霞", 1: "夏雨", 2: "彩雲", 3: "朝日",
  4: "夕陽", 5: "秋風", 6: "冬陽", 7: "朧月",
  8: "霜夜", 9: "氷刃", 10: "春雷", 11: "豊穣"
};

const GOGYOU_MAP = ["木", "火", "土", "金", "水"];

const POSITION_MAPPING = {
  "春霞": 1, "夏雨": 2, "彩雲": 3, "朝日": 4,
  "夕陽": 5, "秋風": 6, "冬陽": 7, "朧月": 8,
  "霜夜": 9, "氷刃": 10, "春雷": 11, "豊穣": 12
};

const PHENOMENA_EN_MAP = {
  "春霞": "harugasumi",
  "夏雨": "natsuame",
  "彩雲": "saiun",
  "朝日": "asahi",
  "夕陽": "yuhi",
  "秋風": "akikaze",
  "冬陽": "fuyuhi",
  "朧月": "oborozuki",
  "霜夜": "shimoya",
  "氷刃": "hyojin",
  "春雷": "shunrai",
  "豊穣": "houjo"
};

const FOLDER_MAP = {
  "木": "wood",
  "火": "fire",
  "土": "earth",
  "金": "metal",
  "水": "water"
};

const REGION_ELEMENT_MAP = {
  '北海道': '水', '青森県': '水', '岩手県': '木', '宮城県': '水', '秋田県': '水',
  '山形県': '木', '福島県': '木', '茨城県': '木', '栃木県': '木', '群馬県': '火',
  '埼玉県': '土', '千葉県': '木', '東京都': '火', '神奈川県': '水', '新潟県': '水',
  '富山県': '水', '石川県': '金', '福井県': '水', '山梨県': '火', '長野県': '木',
  '岐阜県': '木', '静岡県': '火', '愛知県': '火', '三重県': '水', '滋賀県': '水',
  '京都府': '金', '大阪府': '火', '兵庫県': '水', '奈良県': '土', '和歌山県': '木',
  '鳥取県': '土', '島根県': '水', '岡山県': '土', '広島県': '火', '山口県': '水',
  '徳島県': '木', '香川県': '金', '愛媛県': '水', '高知県': '水', '福岡県': '火',
  '佐賀県': '土', '長崎県': '水', '熊本県': '火', '大分県': '火', '宮崎県': '木',
  '鹿児島県': '火', '沖縄県': '水'
};

// ==================== メニュー追加 ====================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('縁診断')
    .addItem('選択行の診断を実行してメール送信', 'sendDiagnosisEmail')
    .addItem('未送信の全診断を一括送信', 'sendAllPendingDiagnosis')
    .addToUi();
}

// ==================== 診断計算ロジック ====================

/**
 * 60分類計算（診断結果の判定）
 */
function calculateNaturalType(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const baseDate = new Date('1900-01-01');

  const daysSinceBase = Math.floor((birthDate - baseDate) / (1000 * 60 * 60 * 24));

  const phenomenaIndex = daysSinceBase % 12;
  const phenomena = PHENOMENA_MAP[phenomenaIndex];

  const gogyouIndex = Math.floor(daysSinceBase / 60) % 5;
  const element = GOGYOU_MAP[gogyouIndex];

  const position = POSITION_MAPPING[phenomena];
  const naturalType = `${element}の${phenomena}`;

  const folder = FOLDER_MAP[element];
  const elementEn = FOLDER_MAP[element];
  const phenomenaEn = PHENOMENA_EN_MAP[phenomena];
  const fileName = `${elementEn}-${phenomenaEn}`;

  return {
    naturalType,
    element,
    phenomena,
    position,
    phenomenaIndex,
    gogyouIndex,
    folder,
    fileName
  };
}

/**
 * 名前音韻分析
 */
function analyzeNameAcoustics(firstName, lastName) {
  const fullName = (firstName + lastName).toLowerCase();

  const vowels = fullName.match(/[aeiou]/gi) || [];
  const consonants = fullName.match(/[bcdfghjklmnpqrstvwxyz]/gi) || [];

  const vowelCount = vowels.length;
  const consonantCount = consonants.length;
  const nameLength = fullName.length;
  const vowelRatio = nameLength > 0 ? vowelCount / nameLength : 0;
  const uniqueConsonants = new Set(consonants).size;

  const score = { 結縁: 0, 深縁: 0, 広縁: 0 };

  if (vowelRatio > 0.5) {
    score.広縁 += 3;
  } else if (vowelRatio > 0.35) {
    score.結縁 += 2;
  } else {
    score.深縁 += 3;
  }

  if (uniqueConsonants > 5) {
    score.広縁 += 2;
  } else if (uniqueConsonants > 3) {
    score.結縁 += 2;
  } else {
    score.深縁 += 2;
  }

  if (nameLength > 10) {
    score.広縁 += 2;
  } else if (nameLength > 6) {
    score.結縁 += 2;
  } else {
    score.深縁 += 2;
  }

  const hasRepeat = /(.)\\1/.test(fullName);
  if (hasRepeat) {
    score.深縁 += 2;
  }

  if (/^[aeiou]/i.test(fullName)) {
    score.広縁 += 1;
  }

  const maxScore = Math.max(score.結縁, score.深縁, score.広縁);
  let nameType = '結縁';

  if (score.深縁 === maxScore) {
    nameType = '深縁';
  } else if (score.広縁 === maxScore) {
    nameType = '広縁';
  }

  return {
    type: nameType,
    scores: score
  };
}

/**
 * 五行縁型判定
 */
function calculateAttractionType(q1, q2, q3, q4) {
  const answers = [q1, q2, q3, q4];
  const count = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  answers.forEach(answer => {
    if (count.hasOwnProperty(answer)) {
      count[answer]++;
    }
  });

  let maxElement = '木';
  let maxCount = 0;

  for (const [element, cnt] of Object.entries(count)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      maxElement = element;
    }
  }

  return `${maxElement}縁型`;
}

/**
 * 地域エネルギー取得
 */
function getRegionElement(prefecture) {
  return REGION_ELEMENT_MAP[prefecture] || '土';
}

/**
 * トークン生成（UUID v4 簡易版）
 */
function generateToken() {
  return Utilities.getUuid();
}

// ==================== メール送信 ====================

/**
 * 選択された行の診断を実行してメール送信
 */
function sendDiagnosisEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getActiveRange().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert('データ行を選択してください。');
    return;
  }

  try {
    processDiagnosisRow(sheet, row);
    SpreadsheetApp.getUi().alert('診断結果メールを送信しました！');
  } catch (error) {
    SpreadsheetApp.getUi().alert(`エラー: ${error.message}`);
  }
}

/**
 * 未送信の全診断を一括送信
 */
function sendAllPendingDiagnosis() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  let count = 0;

  for (let row = 2; row <= lastRow; row++) {
    const sentStatus = sheet.getRange(row, 13).getValue(); // M列が送信ステータス

    if (!sentStatus || sentStatus === '') {
      try {
        processDiagnosisRow(sheet, row);
        count++;
      } catch (error) {
        Logger.log(`Row ${row} error: ${error.message}`);
      }
    }
  }

  SpreadsheetApp.getUi().alert(`${count}件の診断結果メールを送信しました！`);
}

/**
 * 1行のデータを処理して診断・メール送信
 */
function processDiagnosisRow(sheet, row) {
  // スプレッドシートの列構成
  // A: タイムスタンプ
  // B: お名前（漢字）
  // C: 名前（ローマ字）
  // D: 苗字（ローマ字）
  // E: 生年月日
  // F: 出生地
  // G: 現在地
  // H: 質問1（仕事スタイル）
  // I: 質問2（人間関係）
  // J: 質問3（ストレス対処）
  // K: 質問4（ライフスタイル）
  // L: メールアドレス
  // M: 送信ステータス（空白 or 送信済み）

  const data = {
    timestamp: sheet.getRange(row, 1).getValue(),
    nameKanji: sheet.getRange(row, 2).getValue(),
    firstName: sheet.getRange(row, 3).getValue(),
    lastName: sheet.getRange(row, 4).getValue(),
    birthDate: sheet.getRange(row, 5).getValue(),
    birthRegion: sheet.getRange(row, 6).getValue(),
    currentRegion: sheet.getRange(row, 7).getValue(),
    q1: sheet.getRange(row, 8).getValue(),
    q2: sheet.getRange(row, 9).getValue(),
    q3: sheet.getRange(row, 10).getValue(),
    q4: sheet.getRange(row, 11).getValue(),
    email: sheet.getRange(row, 12).getValue()
  };

  // 質問回答から五行を抽出（「木: コツコツ派...」→「木」）
  const extractElement = (answer) => {
    const match = answer.match(/^(木|火|土|金|水)/);
    return match ? match[1] : '木';
  };

  const formData = {
    birthDate: data.birthDate,
    firstName: data.firstName,
    lastName: data.lastName,
    birthRegion: data.birthRegion,
    currentRegion: data.currentRegion,
    workPattern: extractElement(data.q1),
    relationshipStyle: extractElement(data.q2),
    stressHandling: extractElement(data.q3),
    lifestylePreference: extractElement(data.q4)
  };

  // 診断計算
  const naturalTypeData = calculateNaturalType(formData.birthDate);
  const nameAnalysis = analyzeNameAcoustics(formData.firstName, formData.lastName);
  const attractionType = calculateAttractionType(
    formData.workPattern,
    formData.relationshipStyle,
    formData.stressHandling,
    formData.lifestylePreference
  );
  const birthElement = getRegionElement(formData.birthRegion);
  const currentElement = getRegionElement(formData.currentRegion);

  // トークン生成
  const token = generateToken();

  // 結果URL生成
  const resultUrl = `https://enguide.info/results/${naturalTypeData.folder}/${naturalTypeData.fileName}.html?token=${token}`;

  // メール本文作成
  const emailBody = createEmailBody(data.nameKanji, naturalTypeData.naturalType, resultUrl);

  // メール送信
  GmailApp.sendEmail(
    data.email,
    '【縁診断】あなた専用の診断結果',
    emailBody
  );

  // 送信済みマーク
  sheet.getRange(row, 13).setValue('送信済み');
  sheet.getRange(row, 14).setValue(new Date()); // N列に送信日時
  sheet.getRange(row, 15).setValue(resultUrl); // O列に結果URL
}

/**
 * メール本文テンプレート
 */
function createEmailBody(nameKanji, naturalType, resultUrl) {
  return `${nameKanji} 様

この度は「縁診断」にお申し込みいただき、
誠にありがとうございます。

あなたの縁を診断いたしました。


━━━━━━━━━━━━━━━━━━━━━━━━━━
 診断結果: ${naturalType}
━━━━━━━━━━━━━━━━━━━━━━━━━━


以下のリンクから、あなた専用の診断結果ページを
ご確認ください：

${resultUrl}


※このリンクは7日間有効です。
※ブックマークまたはPDF保存されることを推奨いたします。


あなたの縁のかたちを知り、
より豊かな人生を歩むヒントとしてご活用ください。


━━━━━━━━━━━━━━━━━━━━━━━━━━
縁診断 運営チーム
https://enguide.info

本メールに関するお問い合わせは、
このメールに返信してください。
━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}
