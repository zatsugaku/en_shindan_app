/**
 * 無料診断ロジック
 * Version: 1.0.0
 * 基盤: free_diagnosis_logic_complete_v1_0_0.md
 */

// ==================== 定数定義 ====================

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

// フォルダマッピング（01_火、02_木、03_土、04_金、05_水）
const FOLDER_MAP = {
  "木": "02_木",
  "火": "01_火",
  "土": "03_土",
  "金": "04_金",
  "水": "05_水"
};

// 都道府県の五行マッピング
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

const PREFECTURES_LIST = Object.keys(REGION_ELEMENT_MAP);

// ==================== 1. 60分類計算 ====================

/**
 * 60分類計算（生まれ持った縁）
 * @param {Date|string} birthDate - 生年月日
 * @returns {Object} 60分類情報
 */
function calculateNaturalType(birthDate) {
  // 日付をDateオブジェクトに変換
  const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const baseDate = new Date('1900-01-01');

  // 1900年1月1日からの経過日数を計算
  const daysSinceBase = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));

  // 自然現象（12種類）を決定
  const phenomenaIndex = daysSinceBase % 12;
  const phenomena = PHENOMENA_MAP[phenomenaIndex];

  // 五行（5種類）を決定
  const gogyouIndex = Math.floor(daysSinceBase / 60) % 5;
  const element = GOGYOU_MAP[gogyouIndex];

  // 12位置を決定
  const position = POSITION_MAPPING[phenomena];

  // 60分類名を生成
  const naturalType = `${element}の${phenomena}`;

  // フォルダとファイル名を生成
  const folder = FOLDER_MAP[element];
  const fileName = naturalType;

  return {
    naturalType,      // "火の朧月" 等
    element,          // "火"
    phenomena,        // "朧月"
    position,         // 8
    phenomenaIndex,   // 7
    gogyouIndex,      // 1
    folder,           // "01_火"
    fileName          // "火の朧月"
  };
}

// ==================== 2. 名前音韻分析 ====================

/**
 * 名前音韻分析（名前の縁）
 * @param {string} firstName - 名前（ローマ字）
 * @param {string} lastName - 苗字（ローマ字）
 * @returns {Object} 音韻分析結果
 */
function analyzeNameAcoustics(firstName, lastName) {
  // フルネームを小文字に統一
  const fullName = (firstName + lastName).toLowerCase();

  // 母音と子音を抽出
  const vowels = fullName.match(/[aeiou]/gi) || [];
  const consonants = fullName.match(/[bcdfghjklmnpqrstvwxyz]/gi) || [];

  // 基本データ
  const vowelCount = vowels.length;
  const consonantCount = consonants.length;
  const nameLength = fullName.length;
  const vowelRatio = nameLength > 0 ? vowelCount / nameLength : 0;
  const uniqueConsonants = new Set(consonants).size;

  // スコアリング
  const score = { 結縁: 0, 深縁: 0, 広縁: 0 };

  // 要素1: 母音比率
  if (vowelRatio > 0.5) {
    score.広縁 += 3;
  } else if (vowelRatio > 0.35) {
    score.結縁 += 2;
  } else {
    score.深縁 += 3;
  }

  // 要素2: 子音の種類
  if (uniqueConsonants > 5) {
    score.広縁 += 2;
  } else if (uniqueConsonants > 3) {
    score.結縁 += 2;
  } else {
    score.深縁 += 2;
  }

  // 要素3: 名前の長さ
  if (nameLength > 10) {
    score.広縁 += 2;
  } else if (nameLength > 6) {
    score.結縁 += 2;
  } else {
    score.深縁 += 2;
  }

  // 要素4: 反復音パターン
  const hasRepeat = /(.)\1/.test(fullName);
  if (hasRepeat) {
    score.深縁 += 2;
  }

  // 要素5: 開始音（母音始まり）
  if (/^[aeiou]/i.test(fullName)) {
    score.広縁 += 1;
  }

  // 最高スコアのタイプを判定
  const maxScore = Math.max(score.結縁, score.深縁, score.広縁);
  let nameType = '結縁';

  if (score.深縁 === maxScore) {
    nameType = '深縁';
  } else if (score.広縁 === maxScore) {
    nameType = '広縁';
  }

  // 同点の場合の優先順位: 結縁 > 深縁 > 広縁

  return {
    type: nameType,           // '結縁' | '深縁' | '広縁'
    scores: score,            // { 結縁: X, 深縁: Y, 広縁: Z }
    details: {
      vowelCount,
      consonantCount,
      nameLength,
      vowelRatio: Math.round(vowelRatio * 100) / 100,
      uniqueConsonants,
      hasRepeat
    }
  };
}

// ==================== 3. 五行縁型判定 ====================

/**
 * 五行縁型判定（引き寄せてきた縁）
 * @param {string} q1 - 質問1の回答（木/火/土/金/水）
 * @param {string} q2 - 質問2の回答
 * @param {string} q3 - 質問3の回答
 * @param {string} q4 - 質問4の回答
 * @returns {string} 五行縁型（木縁型/火縁型/土縁型/金縁型/水縁型）
 */
function calculateAttractionType(q1, q2, q3, q4) {
  const answers = [q1, q2, q3, q4];
  const count = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  // 各回答をカウント
  answers.forEach(answer => {
    if (count.hasOwnProperty(answer)) {
      count[answer]++;
    }
  });

  // 最多の五行を判定
  let maxElement = '木';
  let maxCount = 0;

  for (const [element, cnt] of Object.entries(count)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      maxElement = element;
    }
  }

  // 同点の場合の優先順位: 木 > 火 > 土 > 金 > 水

  return `${maxElement}縁型`;
}

// ==================== 4. 地域エネルギー ====================

/**
 * 地域エネルギー取得
 * @param {string} prefecture - 都道府県名
 * @returns {string} 五行エネルギー
 */
function getRegionElement(prefecture) {
  return REGION_ELEMENT_MAP[prefecture] || '土'; // デフォルトは土
}

// ==================== 5. 統合診断実行 ====================

/**
 * 無料診断の統合実行
 * @param {Object} formData - 入力データ
 * @returns {Object} 診断結果
 */
function executeDiagnosis(formData) {
  // 1. 60分類計算
  const naturalTypeData = calculateNaturalType(formData.birthDate);

  // 2. 名前音韻分析
  const nameAnalysis = analyzeNameAcoustics(formData.firstName, formData.lastName);

  // 3. 五行縁型判定
  const attractionType = calculateAttractionType(
    formData.workPattern,
    formData.relationshipStyle,
    formData.stressHandling,
    formData.lifestylePreference
  );

  // 4. 地域エネルギー
  const birthElement = getRegionElement(formData.birthRegion);
  const currentElement = getRegionElement(formData.currentRegion);

  // 診断結果を返す
  return {
    // 基本情報
    naturalType: naturalTypeData.naturalType,
    element: naturalTypeData.element,
    phenomena: naturalTypeData.phenomena,
    position: naturalTypeData.position,
    folder: naturalTypeData.folder,
    fileName: naturalTypeData.fileName,

    // 名前の縁
    nameType: nameAnalysis.type,
    nameDetails: nameAnalysis.details,

    // 引き寄せた縁
    attractionType,

    // 地域エネルギー
    birthRegion: formData.birthRegion,
    birthElement,
    currentRegion: formData.currentRegion,
    currentElement,

    // メタ情報
    calculatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
}

// ==================== 6. バリデーション ====================

/**
 * フォームデータのバリデーション
 * @param {Object} formData - 入力データ
 * @throws {Error} バリデーションエラー
 */
function validateFormData(formData) {
  const required = [
    'birthDate', 'firstName', 'lastName',
    'birthRegion', 'currentRegion',
    'workPattern', 'relationshipStyle',
    'stressHandling', 'lifestylePreference'
  ];

  for (const field of required) {
    if (!formData[field]) {
      throw new Error(`${field} is required`);
    }
  }

  // ローマ字チェック
  if (!/^[A-Za-z]+$/.test(formData.firstName)) {
    throw new Error('First name must be in Roman characters');
  }
  if (!/^[A-Za-z]+$/.test(formData.lastName)) {
    throw new Error('Last name must be in Roman characters');
  }

  return true;
}

// ==================== 7. メイン処理 ====================

/**
 * 診断処理の実行
 * @param {Object} formData - 入力データ
 * @returns {Object} 処理結果
 */
function processDiagnosis(formData) {
  try {
    // バリデーション
    validateFormData(formData);

    // 診断計算実行
    const diagnosisResult = executeDiagnosis(formData);

    return {
      success: true,
      data: diagnosisResult
    };

  } catch (error) {
    console.error('Diagnosis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// エクスポート（ブラウザ環境用）
if (typeof window !== 'undefined') {
  window.DiagnosisLogic = {
    processDiagnosis,
    executeDiagnosis,
    calculateNaturalType,
    analyzeNameAcoustics,
    calculateAttractionType,
    getRegionElement,
    validateFormData,
    PREFECTURES_LIST
  };
}
