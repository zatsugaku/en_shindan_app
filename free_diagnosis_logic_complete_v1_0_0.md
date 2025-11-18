# 無料診断システム - 診断ロジック完全仕様書
**Version**: 1.0.0  
**作成日**: 2025-11-18  
**対象**: 縁パワースポット診断 - 無料診断アプリ  
**基盤**: Projects指針 v3.1.2 準拠

---

## 🎯 無料診断の位置づけ

### **有料版との関係**
```yaml
無料診断の役割:
✅ 60分類の診断（生まれ持った縁）
✅ 五行縁型の判定（引き寄せてきた縁）
✅ 名前音韻分析（名前の縁）
✅ 3セクション構成のレポート（3,800-4,000字）
✅ 有料版への導線

無料版で提供しないもの:
❌ パワースポット具体的な推薦（18箇所）
❌ バイオリズム情報（10状態）
❌ 最適訪問時期
❌ 相性スコアの数値表示
❌ 個別補正の詳細説明
```

---

## 📊 入力仕様（11項目）

### **基本情報（5項目）**

```javascript
const BASIC_INFO_FIELDS = {
  birthDate: {
    type: 'date',
    label: '生年月日',
    required: true,
    min: '1900-01-01',
    max: new Date().toISOString().split('T')[0],
    purpose: '60分類計算のベース'
  },
  
  firstName: {
    type: 'text',
    label: '名前（ローマ字）',
    required: true,
    pattern: '[A-Za-z]+',
    placeholder: '例: Taro',
    purpose: '名前音韻分析'
  },
  
  lastName: {
    type: 'text',
    label: '苗字（ローマ字）',
    required: true,
    pattern: '[A-Za-z]+',
    placeholder: '例: Yamada',
    purpose: '名前音韻分析'
  },
  
  birthRegion: {
    type: 'select',
    label: '出生地（都道府県）',
    required: true,
    options: PREFECTURES_LIST,
    purpose: '地域エネルギー計算（軽く使用）'
  },
  
  currentRegion: {
    type: 'select',
    label: '現在地（都道府県）',
    required: true,
    options: PREFECTURES_LIST,
    purpose: '必須だが無料版ではほぼ使用しない'
  }
};
```

### **診断質問（4問、各5択）**

```javascript
const DIAGNOSIS_QUESTIONS = [
  {
    id: 'workPattern',
    question: 'これまでの仕事や主な活動について、最も当てはまるものは？',
    options: [
      { value: '木', label: '新しいことを学んだり、人とのつながりを広げることが多い', icon: '🌱' },
      { value: '火', label: '人前で話したり、活発に動き回ることが多い', icon: '🔥' },
      { value: '土', label: '継続的で安定した作業や、人をサポートすることが多い', icon: '🌍' },
      { value: '金', label: '効率化や改善、質の向上に取り組むことが多い', icon: '⚡' },
      { value: '水', label: '状況に応じて柔軟に対応したり、情報を扱うことが多い', icon: '💧' }
    ]
  },
  
  {
    id: 'relationshipStyle',
    question: '人間関係において、あなたが自然に取る行動は？',
    options: [
      { value: '木', label: '相手の成長を支援したり、新しい可能性を一緒に探る', icon: '🌱' },
      { value: '火', label: '場を盛り上げたり、皆のモチベーションを高める', icon: '🔥' },
      { value: '土', label: '安心できる環境を作ったり、調和を重視する', icon: '🌍' },
      { value: '金', label: '的確なアドバイスをしたり、質の高い関係を築く', icon: '⚡' },
      { value: '水', label: '相手に合わせて柔軟に対応したり、深く理解しようとする', icon: '💧' }
    ]
  },
  
  {
    id: 'stressHandling',
    question: 'ストレスを感じる時や困った時の対処法は？',
    options: [
      { value: '木', label: '新しい環境に身を置いたり、学びや成長の機会を求める', icon: '🌱' },
      { value: '火', label: '人と話したり、活動的になって発散する', icon: '🔥' },
      { value: '土', label: '安定した環境で休息を取ったり、信頼できる人に相談する', icon: '🌍' },
      { value: '金', label: '計画を立て直したり、効率的な解決策を考える', icon: '⚡' },
      { value: '水', label: '状況を客観視したり、流れに任せて様子を見る', icon: '💧' }
    ]
  },
  
  {
    id: 'lifestylePreference',
    question: '理想的な生活環境や過ごし方は？',
    options: [
      { value: '木', label: '変化に富み、常に新しい刺激や学びがある環境', icon: '🌱' },
      { value: '火', label: '人とのつながりが豊富で、エネルギッシュに活動できる環境', icon: '🔥' },
      { value: '土', label: '安定していて、信頼できる人に囲まれた穏やかな環境', icon: '🌍' },
      { value: '金', label: '質の高い環境で、効率的に目標を達成できる環境', icon: '⚡' },
      { value: '水', label: '自由度が高く、状況に応じて柔軟に選択できる環境', icon: '💧' }
    ]
  }
];
```

---

## 🔧 診断ロジック実装

### **1. 60分類計算（生まれ持った縁）**

```javascript
// 基本定数
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

/**
 * 60分類計算
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
  
  return {
    naturalType,      // "火の朧月" 等
    element,          // "火"
    phenomena,        // "朧月"
    position,         // 8
    phenomenaIndex,   // 7
    gogyouIndex      // 1
  };
}
```

### **2. 名前音韻分析（名前の縁）**

```javascript
/**
 * 名前音韻分析
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
```

### **3. 五行縁型判定（引き寄せてきた縁）**

```javascript
/**
 * 五行縁型判定
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
```

### **4. 地域エネルギー（軽く使用）**

```javascript
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

/**
 * 地域エネルギー取得
 * @param {string} prefecture - 都道府県名
 * @returns {string} 五行エネルギー
 */
function getRegionElement(prefecture) {
  return REGION_ELEMENT_MAP[prefecture] || '土'; // デフォルトは土
}
```

---

## 🎯 統合診断実行

```javascript
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
```

---

## 📄 出力形式（重要）

### **テンプレート構造**

```javascript
// 60分類ごとにテンプレートが存在
const DIAGNOSIS_TEMPLATES = {
  "木の春霞": {
    intro: "導入段落（200-300字）",
    section1: {
      title: "あなたの縁の本質",
      content: "1,500字程度の詳細解説"
    },
    section2: {
      title: "縁を活かす場所と人",
      content: "1,500字程度の詳細解説"
    },
    section3: {
      title: "今日からできること",
      content: "1,000字程度の実践ヒント"
    }
  },
  // ... 全60種類
};
```

### **テンプレート取得と変数置換**

```javascript
/**
 * 診断レポート生成
 * @param {Object} diagnosisResult - executeDiagnosis()の戻り値
 * @returns {Object} レポート
 */
function generateReport(diagnosisResult) {
  // テンプレート取得
  const template = DIAGNOSIS_TEMPLATES[diagnosisResult.naturalType];
  
  if (!template) {
    throw new Error(`Template not found for ${diagnosisResult.naturalType}`);
  }
  
  // 変数置換（最小限）
  const report = {
    naturalType: diagnosisResult.naturalType,
    element: diagnosisResult.element,
    phenomena: diagnosisResult.phenomena,
    
    intro: replaceVariables(template.intro, diagnosisResult),
    
    sections: [
      {
        title: template.section1.title,
        content: replaceVariables(template.section1.content, diagnosisResult)
      },
      {
        title: template.section2.title,
        content: replaceVariables(template.section2.content, diagnosisResult)
      },
      {
        title: template.section3.title,
        content: replaceVariables(template.section3.content, diagnosisResult)
      }
    ],
    
    ctaMessage: generateCTAMessage(diagnosisResult)
  };
  
  return report;
}

/**
 * 変数置換ヘルパー
 */
function replaceVariables(text, data) {
  return text
    .replace(/\{naturalType\}/g, data.naturalType)
    .replace(/\{element\}/g, data.element)
    .replace(/\{phenomena\}/g, data.phenomena)
    // 必要に応じて他の変数も追加可能
    // ただし、技術用語（五行縁型、名前音韻タイプ等）は直接表示しない
}
```

---

## 🚨 重要な制約と方針

### **表示してはいけないもの（技術用語排除）**

```yaml
❌ 絶対に表示しない:
- 「あなたは火縁型です」
- 「名前音韻タイプ: 深縁」
- 「位置12番」
- 「相性88%」
- 「補正値+8%」
- 「12位置システム」
- パワースポットの具体名
- バイオリズムの状態

✅ 代わりに自然な表現で織り込む:
- 「これまでの人生で、こんなパターンがあったかもしれません」
- 「名前の響きには、不思議な力があります」
- 「生まれた日、名前、生まれた土地が重なり合って〜」
```

### **品質基準（必須遵守）**

```yaml
✅ 必須事項:
- 希少性表現の完全禁止
  - 「希少」「レア」「特別」禁止
  - 「60分の1」は希少ではない

- 両対応表現の使用
  - 「もしそうであったなら〜」
  - 「もしそうではなく〜」
  - すべてのユーザーが当てはまると感じる

- 「縁のベース」概念
  - 持って生まれた縁 = 生まれた時のベース
  - 運命決定論ではない

- 統計学的根拠の簡素化
  - 複雑な計算説明を避ける
  - 「古来より伝わる統計学的分析では〜」程度
```

---

## 🔄 処理フロー全体

```javascript
// 完全な処理フロー
async function processDiagnosis(formData) {
  try {
    // 1. バリデーション
    validateFormData(formData);
    
    // 2. 診断計算実行
    const diagnosisResult = executeDiagnosis(formData);
    
    // 3. レポート生成
    const report = generateReport(diagnosisResult);
    
    // 4. 結果返却
    return {
      success: true,
      data: {
        diagnosis: diagnosisResult,
        report: report
      }
    };
    
  } catch (error) {
    console.error('Diagnosis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// バリデーション
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
```

---

## 📦 必要なデータファイル

### **1. 診断テンプレート（60種類）**
```
DIAGNOSIS_TEMPLATES = {
  "木の春霞": { /* 詳細テンプレート */ },
  "木の夏雨": { /* 詳細テンプレート */ },
  // ... 全60種類
}
```

**参照**: 別プロジェクトで作成中の60テンプレート
**基準**: `火の朧月.md` がS級サンプル

### **2. 都道府県リスト**
```javascript
const PREFECTURES_LIST = [
  '北海道', '青森県', '岩手県', // ... 全47都道府県
];
```

---

## 🎯 実装チェックリスト

```
□ 基本ロジック実装
  □ calculateNaturalType() - 60分類計算
  □ analyzeNameAcoustics() - 名前音韻分析
  □ calculateAttractionType() - 五行縁型判定
  □ getRegionElement() - 地域エネルギー
  □ executeDiagnosis() - 統合診断

□ テンプレートシステム
  □ 60種類のテンプレート準備
  □ generateReport() - レポート生成
  □ replaceVariables() - 変数置換

□ バリデーション
  □ validateFormData() - 入力チェック
  □ エラーハンドリング

□ 品質保証
  □ 技術用語の完全排除確認
  □ 両対応表現の使用確認
  □ 希少性表現の排除確認
  □ 文字数確認（3,800-4,000字）

□ テスト
  □ 全60分類でテスト実行
  □ エッジケースの確認
  □ 計算精度の検証
```

---

## 📚 参照ドキュメント

```yaml
有料版仕様:
- enpower_projects_guideline_v3_1_2.md
  → システム全体の基盤理論

品質基準:
- diagnosis_output_standards_v2_1.md
  → テンプレート作成の品質基準

サンプル:
- 火の朧月.md
  → S級サンプルテンプレート

データベース:
- 09_prefecture_database.json
  → 都道府県データ
```

---

**🔥 重要**: この診断ロジックは有料版と無料版の共通基盤です。計算精度100%、品質基準完全遵守で実装してください。
