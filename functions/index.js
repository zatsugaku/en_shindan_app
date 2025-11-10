/**
 * Firebase Functions - 縁診断アプリ
 *
 * 要件定義書 v1.0 に基づく実装
 * - 60分類システム（12自然現象 × 5五行）
 * - 名前音韻分析
 * - 五行縁型判定
 * - バイオリズム計算
 * - 地域エネルギー計算
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ========================================
// 定数定義
// ========================================

// 12自然現象（PHENOMENA_MAP）
const PHENOMENA_MAP = [
  "春霞", "夏雨", "彩雲", "朝日", "夕陽", "秋風",
  "冬陽", "朧月", "霜夜", "氷刃", "春雷", "豊穣"
];

// 5五行
const GOGYOU_LIST = ["木", "火", "土", "金", "水"];

// 12位置マッピング
const POSITION_MAPPING = {
  "春霞": 1, "夏雨": 2, "彩雲": 3, "朝日": 4,
  "夕陽": 5, "秋風": 6, "冬陽": 7, "朧月": 8,
  "霜夜": 9, "氷刃": 10, "春雷": 11, "豊穣": 12
};

// バイオリズム10状態
const BIORHYTHM_STATES = [
  { name: "新生期", duration: 32, energy: "始まり" },
  { name: "発展期", duration: 35, energy: "拡張" },
  { name: "充実期", duration: 38, energy: "最大" },
  { name: "安定期", duration: 33, energy: "安定" },
  { name: "転換期", duration: 29, energy: "変化" },
  { name: "調整期", duration: 31, energy: "調整" },
  { name: "深化期", duration: 36, energy: "深化" },
  { name: "収束期", duration: 34, energy: "収束" },
  { name: "沈静期", duration: 30, energy: "静寂" },
  { name: "準備期", duration: 37, energy: "準備" }
];

// 都道府県→地域マッピング
const PREFECTURE_TO_REGION = {
  '北海道': '北海道',
  '青森県': '東北', '岩手県': '東北', '宮城県': '東北',
  '秋田県': '東北', '山形県': '東北', '福島県': '東北',
  '東京都': '関東', '神奈川県': '関東', '埼玉県': '関東',
  '千葉県': '関東', '茨城県': '関東', '栃木県': '関東', '群馬県': '関東',
  '新潟県': '中部', '富山県': '中部', '石川県': '中部', '福井県': '中部',
  '山梨県': '中部', '長野県': '中部', '岐阜県': '中部', '静岡県': '中部', '愛知県': '中部',
  '京都府': '関西', '大阪府': '関西', '兵庫県': '関西',
  '滋賀県': '関西', '奈良県': '関西', '和歌山県': '関西',
  '三重県': '関西',
  '鳥取県': '中国', '島根県': '中国', '岡山県': '中国', '広島県': '中国', '山口県': '中国',
  '徳島県': '四国', '香川県': '四国', '愛媛県': '四国', '高知県': '四国',
  '福岡県': '九州', '佐賀県': '九州', '長崎県': '九州', '熊本県': '九州',
  '大分県': '九州', '宮崎県': '九州', '鹿児島県': '九州',
  '沖縄県': '沖縄'
};

// 地域→五行マッピング
const REGION_TO_ELEMENT = {
  '北海道': '水',
  '東北': '木',
  '関東': '火',
  '中部': '土',
  '関西': '金',
  '中国': '土',
  '四国': '木',
  '九州': '火',
  '沖縄': '水'
};

// ========================================
// 60分類計算関数
// ========================================

/**
 * 生年月日から60分類と12位置を算出
 * @param {Date} birthDate - 生年月日
 * @returns {Object} { naturalType, position, element, phenomena }
 */
function calculate60Classification(birthDate) {
  // 基準日からの経過日数計算
  const baseDate = new Date('1900-01-01');
  const daysSince = Math.floor((birthDate - baseDate) / (1000 * 60 * 60 * 24));

  // 自然現象の決定（12種類）
  const phenomena = PHENOMENA_MAP[daysSince % 12];

  // 五行の決定（5種類）
  const elementIndex = Math.floor(daysSince / 60) % 5;
  const element = GOGYOU_LIST[elementIndex];

  // 60分類の組み立て
  const naturalType = `${element}の${phenomena}`;

  // 12位置へのマッピング
  const position = POSITION_MAPPING[phenomena];

  return {
    naturalType,
    position,
    element,
    phenomena
  };
}

// ========================================
// 名前音韻分析
// ========================================

/**
 * 名前のローマ字から音韻タイプを判定
 * @param {string} firstName - 名前
 * @param {string} lastName - 苗字
 * @returns {string} '結縁' | '深縁' | '広縁'
 */
function analyzeNameAcoustic(firstName, lastName) {
  const fullName = (firstName + lastName).toLowerCase();

  // 母音の種類と出現回数
  const vowels = fullName.match(/[aiueo]/g) || [];
  const uniqueVowels = new Set(vowels);
  const vowelCount = vowels.length;
  const uniqueVowelCount = uniqueVowels.size;

  // 母音の多様性率
  const diversity = uniqueVowelCount / vowelCount;

  // 判定ロジック
  if (diversity >= 0.8) {
    return '広縁';
  } else if (diversity >= 0.5) {
    return '深縁';
  } else {
    return '結縁';
  }
}

// ========================================
// 五行縁型判定
// ========================================

/**
 * 4つの診断質問から五行縁型を判定
 * @param {Object} answers - { q1, q2, q3, q4 }
 * @returns {Object} { attractionType, elementCounts, dominantElement }
 */
function determineFiveElementType(answers) {
  const { q1, q2, q3, q4 } = answers;
  const elements = [q1, q2, q3, q4];

  // 各五行の出現回数
  const counts = {
    '木': 0,
    '火': 0,
    '土': 0,
    '金': 0,
    '水': 0
  };

  elements.forEach(element => {
    if (counts[element] !== undefined) {
      counts[element]++;
    }
  });

  // 最も多い五行を決定
  const dominantElement = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0][0];

  return {
    attractionType: dominantElement + '縁型',
    elementCounts: counts,
    dominantElement: dominantElement
  };
}

// ========================================
// バイオリズム計算
// ========================================

/**
 * 診断日時点のバイオリズム状態を計算
 * @param {Date} birthDate - 生年月日
 * @param {Date} currentDate - 診断日
 * @returns {Object} バイオリズム情報
 */
function calculateBiorhythm(birthDate, currentDate) {
  // 生まれてからの総日数
  const totalDays = Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24));

  const cycleLength = BIORHYTHM_STATES.reduce((sum, s) => sum + s.duration, 0);
  const daysInCycle = totalDays % cycleLength;

  // 現在の状態を特定
  let accumulatedDays = 0;
  let currentState = null;
  let daysIntoState = 0;

  for (const state of BIORHYTHM_STATES) {
    if (daysInCycle < accumulatedDays + state.duration) {
      currentState = state;
      daysIntoState = daysInCycle - accumulatedDays;
      break;
    }
    accumulatedDays += state.duration;
  }

  const progress = Math.floor((daysIntoState / currentState.duration) * 100);

  return {
    currentState: currentState.name,
    energy: currentState.energy,
    progress: progress,
    daysIntoState: daysIntoState,
    totalDaysInState: currentState.duration
  };
}

// ========================================
// 地域エネルギー計算
// ========================================

/**
 * 出生地と現在地の地域エネルギーを計算
 * @param {string} birthPrefecture - 生まれた都道府県
 * @param {string} currentPrefecture - 現在の都道府県
 * @returns {Object} 地域エネルギー情報
 */
function calculateRegionEnergy(birthPrefecture, currentPrefecture) {
  const birthRegion = PREFECTURE_TO_REGION[birthPrefecture] || '不明';
  const currentRegion = PREFECTURE_TO_REGION[currentPrefecture] || '不明';

  return {
    birthElement: REGION_TO_ELEMENT[birthRegion] || '不明',
    currentElement: REGION_TO_ELEMENT[currentRegion] || '不明',
    birthRegion: birthRegion,
    currentRegion: currentRegion
  };
}

// ========================================
// CORS設定
// ========================================

function setCorsHeaders(res) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
  });
}

// ========================================
// Cloud Function: getDiagnosis
// ========================================

exports.getDiagnosis = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    setCorsHeaders(res);

    // Preflight対応
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed'
      });
    }

    try {
      // 入力データ取得
      const {
        birthDate,
        firstName,
        lastName,
        birthPrefecture,
        currentPrefecture,
        question1,
        question2,
        question3,
        question4
      } = req.body;

      // バリデーション
      if (!birthDate) {
        return res.status(400).json({
          success: false,
          error: 'birthDate は必須です'
        });
      }

      const parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'birthDate の形式が不正です'
        });
      }

      const currentDate = new Date();

      // 各種計算を実行
      const classification = calculate60Classification(parsedBirthDate);
      const nameType = analyzeNameAcoustic(firstName || '', lastName || '');
      const attractionType = determineFiveElementType({
        q1: question1,
        q2: question2,
        q3: question3,
        q4: question4
      });
      const biorhythm = calculateBiorhythm(parsedBirthDate, currentDate);
      const regionEnergy = calculateRegionEnergy(
        birthPrefecture || '',
        currentPrefecture || ''
      );

      // ユーザープロファイル作成
      const userProfile = {
        ...classification,
        nameType,
        ...attractionType,
        biorhythm,
        regionEnergy
      };

      // Firestoreから診断結果テンプレートを取得（将来的に実装）
      // 現在は計算結果のみを返す

      return res.status(200).json({
        success: true,
        data: {
          userProfile,
          calculatedAt: currentDate.toISOString()
        }
      });

    } catch (error) {
      functions.logger.error('getDiagnosis error', {
        message: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'サーバーエラーが発生しました'
      });
    }
  });
