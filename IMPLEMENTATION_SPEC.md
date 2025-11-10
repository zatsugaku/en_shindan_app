# 縁診断サイト - 実装仕様書（Codex CLI用）

## 📋 概要

Firebase Hostingで動作する静的HTML縁診断サイトを実装する。
診断結果ページは事前生成型で、各結果に固有URLを割り当てる。

---

## 🏗️ ファイル構成

```
public/
├── index.html              ✅ 完成済み
├── diagnose.html           🔨 実装が必要
├── css/
│   └── style.css          ✅ 完成済み（必要に応じて追加）
├── js/
│   └── diagnose.js        🔨 実装が必要
└── results/
    ├── wood_type.html     🔨 生成スクリプトで作成
    ├── fire_type.html     🔨 生成スクリプトで作成
    ├── earth_type.html    🔨 生成スクリプトで作成
    ├── metal_type.html    🔨 生成スクリプトで作成
    └── water_type.html    🔨 生成スクリプトで作成
```

---

## 📝 実装タスク

### タスク1: 診断フォームページ（diagnose.html）

**要件:**
- Firestoreから質問データを取得（GET /questions）
- 4つの質問を順番に表示
- 各質問に5つの選択肢（木・火・土・金・水）
- ユーザーが全て回答したら診断APIを呼び出し
- 診断結果に基づいて該当の結果ページへリダイレクト

**UI:**
- シンプルで使いやすいフォーム
- 現在の質問番号を表示（例: 質問 1/4）
- 進捗バー
- 回答ボタンは五行カラー（CSS変数使用）

**API:**
```javascript
// Firestore直接読み取り（Firebase SDK使用）
const questionsRef = collection(db, 'questions');
const questionsSnapshot = await getDocs(questionsRef);

// 診断API呼び出し
POST https://asia-northeast1-en-shindan-app.cloudfunctions.net/getDiagnosis
{
  "birthDate": "YYYY-MM-DD",
  "firstName": "名前",
  "lastName": "苗字",
  "birthPrefecture": "東京都",
  "currentPrefecture": "東京都",
  "question1": "木",
  "question2": "火",
  "question3": "土",
  "question4": "金"
}

// レスポンスから縁型を判定
response.data.userProfile.dominantElement
// → "木" なら /results/wood_type.html へリダイレクト
```

**縁型とファイル名のマッピング:**
```javascript
const elementToPage = {
  '木': 'wood_type',
  '火': 'fire_type',
  '土': 'earth_type',
  '金': 'metal_type',
  '水': 'water_type'
};
```

---

### タスク2: 診断ロジックJS（js/diagnose.js）

**要件:**
- Firebase SDKを使用（CDN経由でロード）
- Firestore設定:
  - Project ID: `en-shindan-app`
  - apiKey: Firebase Consoleから取得
- 質問データ取得
- フォーム送信処理
- 診断API呼び出し
- リダイレクト処理

**Firebase設定例:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Firebase Consoleから取得
  projectId: "en-shindan-app",
  storageBucket: "en-shindan-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

### タスク3: 診断結果ページテンプレート

**要件:**
- `firestore_data.json` の results データを元に5つのHTMLファイルを生成
- 各ページに含める情報:
  - タイトル（title）
  - 説明（description）
  - 特徴リスト（characteristics）
  - 相性（compatibility）
  - アドバイス（advice）
  - ラッキースポット（luckySpots）
  - ラッキーカラー（luckyColors）
  - シェアボタン（Twitter, LINE）
  - 「もう一度診断する」リンク

**デザイン:**
- 五行カラーを背景に使用
- 読みやすいレイアウト
- モバイルフレンドリー

---

### タスク4: 結果ページ生成スクリプト（scripts/generate-result-pages.js）

**要件:**
- `firestore_data.json` を読み込み
- results セクションの各データからHTMLを生成
- テンプレートエンジンは不要（文字列テンプレートでOK）
- 生成先: `public/results/`

**実行方法:**
```bash
node scripts/generate-result-pages.js
```

**出力:**
```
✅ public/results/wood_type.html 生成完了
✅ public/results/fire_type.html 生成完了
✅ public/results/earth_type.html 生成完了
✅ public/results/metal_type.html 生成完了
✅ public/results/water_type.html 生成完了
```

---

## 🎨 デザインガイドライン

**カラーパレット（CSS変数）:**
```css
--color-wood: #4CAF50;   /* 緑 */
--color-fire: #FF5722;   /* 赤 */
--color-earth: #795548;  /* 茶色 */
--color-metal: #9E9E9E;  /* グレー */
--color-water: #2196F3;  /* 青 */
```

**フォント:**
- 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif

**レスポンシブ:**
- モバイルファースト
- ブレークポイント: 600px

---

## 🔧 技術スタック

- HTML5
- CSS3（既存のstyle.cssを拡張）
- Vanilla JavaScript（フレームワーク不使用）
- Firebase SDK（CDN）
- Node.js（結果ページ生成スクリプト用）

---

## ✅ 完成条件

1. ✅ index.html からdiagnose.html へ遷移できる
2. ✅ 質問がFirestoreから正しく読み込まれる
3. ✅ 4つの質問に回答できる
4. ✅ 診断APIが正しく呼ばれる
5. ✅ 診断結果ページへリダイレクトされる
6. ✅ 各結果ページが正しく表示される
7. ✅ モバイルで正しく動作する
8. ✅ Firebase Hostingにデプロイ可能

---

## 📌 注意事項

- Firebase APIキーは公開リポジトリにコミットOK（Web API Key）
- セキュリティはFirestoreルールで制御済み
- 結果ページはSEO最適化（meta descriptionなど）
- OGPタグも追加（SNSシェア対応）
- シンプルで高速な実装を優先

---

**参考:**
- API仕様: `functions/index.js`
- データ構造: `firestore_data.json`
- 既存スタイル: `public/css/style.css`
