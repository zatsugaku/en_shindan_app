# Firestore データ構造設計書

## プロジェクト: 縁診断Webアプリ

**作成日:** 2025-11-05
**目的:** 診断質問と結果のデータ構造を定義し、Codex CLIによるコード生成の仕様書とする

---

## コレクション構造概要

```
firestore
├── questions (診断質問コレクション)
│   ├── question_01
│   ├── question_02
│   └── question_03
│
└── results (診断結果コレクション)
    ├── result_excellent
    ├── result_good
    └── result_normal
```

---

## 1. `questions` コレクション

**説明:** ユーザーに提示する診断質問を格納

### フィールド定義

| フィールド名 | 型 | 必須 | 説明 | 例 |
|------------|-----|------|------|-----|
| `id` | string | ✅ | 質問の一意識別子 | `"question_01"` |
| `order` | number | ✅ | 質問の表示順序 | `1` |
| `text` | string | ✅ | 質問文 | `"人との出会いを大切にしていますか？"` |
| `options` | array | ✅ | 選択肢の配列 | `[{label, value}]` |

### `options` 配列の構造

```typescript
interface Option {
  label: string;  // 表示テキスト
  value: number;  // スコア値（1-5）
}
```

### サンプルデータ

```json
{
  "id": "question_01",
  "order": 1,
  "text": "人との出会いを大切にしていますか？",
  "options": [
    { "label": "とても大切にしている", "value": 5 },
    { "label": "大切にしている", "value": 4 },
    { "label": "どちらでもない", "value": 3 },
    { "label": "あまり大切にしていない", "value": 2 },
    { "label": "全く大切にしていない", "value": 1 }
  ]
}
```

---

## 2. `results` コレクション

**説明:** 診断結果とその内容を格納

### フィールド定義

| フィールド名 | 型 | 必須 | 説明 | 例 |
|------------|-----|------|------|-----|
| `id` | string | ✅ | 結果の一意識別子 | `"result_excellent"` |
| `title` | string | ✅ | 診断結果のタイトル | `"素晴らしい縁の持ち主"` |
| `description` | string | ✅ | 診断結果の詳細説明 | `"あなたは周囲の人々と...` |
| `scoreRange` | object | ✅ | 該当するスコア範囲 | `{min: 12, max: 15}` |
| `imageUrl` | string | ❌ | 結果画像のURL（オプション） | `"/images/excellent.png"` |
| `advice` | string | ✅ | アドバイス文 | `"この調子で...` |

### `scoreRange` オブジェクトの構造

```typescript
interface ScoreRange {
  min: number;  // 最小スコア
  max: number;  // 最大スコア
}
```

### サンプルデータ

```json
{
  "id": "result_excellent",
  "title": "素晴らしい縁の持ち主",
  "description": "あなたは周囲の人々と深い絆を築く才能に恵まれています。人との出会いを大切にし、その縁を育む努力を惜しみません。",
  "scoreRange": {
    "min": 12,
    "max": 15
  },
  "imageUrl": "",
  "advice": "この調子で、出会った人々との関係を大切に育ててください。あなたの温かい心が、さらに素敵な縁を引き寄せるでしょう。"
}
```

---

## 3. 診断ロジック仕様

### スコア計算方法

1. **各質問の回答値を合計**
   - 質問数: 3問
   - 各質問の値: 1〜5
   - 合計スコア範囲: 3〜15

2. **スコアに基づいて結果を判定**
   ```
   12-15点 → result_excellent（素晴らしい縁の持ち主）
   8-11点  → result_good（良好な縁）
   3-7点   → result_normal（これからの縁）
   ```

### 判定ロジック（TypeScript）

```typescript
function getDiagnosticResultId(totalScore: number): string {
  if (totalScore >= 12) return 'result_excellent';
  if (totalScore >= 8) return 'result_good';
  return 'result_normal';
}
```

---

## 4. 初期データ要件（Codex CLI生成対象）

### 質問データ（3件）

1. **question_01:** "人との出会いを大切にしていますか？"
2. **question_02:** "困っている人を見かけたら助けますか？"
3. **question_03:** "感謝の気持ちを言葉で伝えることが多いですか？"

### 結果データ（3件）

1. **result_excellent:** スコア12-15点、素晴らしい縁の持ち主
2. **result_good:** スコア8-11点、良好な縁を持つ人
3. **result_normal:** スコア3-7点、これからの成長に期待

---

## 5. Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 質問データ: 全ユーザー読み取り可能
    match /questions/{questionId} {
      allow read: if true;
      allow write: if false; // 管理者のみ
    }

    // 診断結果: 全ユーザー読み取り可能
    match /results/{resultId} {
      allow read: if true;
      allow write: if false; // 管理者のみ
    }
  }
}
```

---

## 6. データ投入方法

### Firebase CLI を使用

```bash
# JSONファイルからFirestoreへインポート
firebase firestore:import firestore_data.json
```

### JSONファイル構造

```json
{
  "questions": {
    "question_01": { /* データ */ },
    "question_02": { /* データ */ },
    "question_03": { /* データ */ }
  },
  "results": {
    "result_excellent": { /* データ */ },
    "result_good": { /* データ */ },
    "result_normal": { /* データ */ }
  }
}
```

---

## 7. TypeScript型定義（実装用）

```typescript
// 質問データの型
export interface DiagnosticQuestion {
  id: string;
  order: number;
  text: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  label: string;
  value: number;
}

// 診断結果の型
export interface DiagnosticResult {
  id: string;
  title: string;
  description: string;
  scoreRange: ScoreRange;
  imageUrl?: string;
  advice: string;
}

export interface ScoreRange {
  min: number;
  max: number;
}
```

---

## 8. Codex CLI 生成指示

このスキーマに基づき、以下を生成してください：

1. **firestore_data.json** - 初期データ（質問3件、結果3件）
2. データは日本語で、縁診断に適した内容とすること
3. 各質問は5段階の選択肢を持つこと
4. スコア範囲が重複しないこと

---

**この設計書は、Codex CLIによるコード生成とデータ生成の仕様書として使用されます。**
