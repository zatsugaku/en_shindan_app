# 縁診断アプリ - プロジェクト状態記録

**最終更新日**: 2025-11-14
**プロジェクト名**: 縁診断 (En-Shindan)
**ドメイン**: https://enguide.info/

---

## プロジェクト概要

五行思想（木・火・土・金・水）に基づく縁診断Webアプリケーション。
無料診断とプレミアム診断（準備中）の2つのサービスを提供予定。

---

## 技術スタック

- **ホスティング**: Firebase Hosting
- **データベース**: Firestore
- **バックエンド**: Firebase Functions (Node.js)
- **フロントエンド**: Vanilla JavaScript (ES6 modules)
- **認証**: なし（匿名診断）

---

## 現在のディレクトリ構成

```
en_shindan_app/
├── public/
│   ├── index.html                 # ポータルページ（サービス一覧）
│   ├── css/
│   │   └── style.css             # 共通スタイルシート
│   └── free/                     # 無料診断サービス
│       ├── index.html            # 無料診断ランディング
│       ├── diagnose.html         # 診断フロー
│       ├── firestore_data.json   # 質問データ（ローカル）
│       ├── js/
│       │   └── diagnose.js       # 診断ロジック
│       └── results/              # 診断結果ページ
│           ├── wood_type.html    # 木縁型
│           ├── fire_type.html    # 火縁型
│           ├── earth_type.html   # 土縁型
│           ├── metal_type.html   # 金縁型
│           └── water_type.html   # 水縁型
├── functions/
│   ├── index.js                  # Firebase Functions（診断API）
│   └── package.json
├── firebase.json                 # Firebase設定（リダイレクト含む）
├── firestore.rules               # Firestoreセキュリティルール
├── CLAUDE.md                     # プロジェクト憲法
├── SECURITY_COMPLETE.md          # セキュリティ完了記録
└── PROJECT_STATUS.md             # このファイル
```

---

## 実装済み機能

### ✅ 無料診断サービス
- [x] 4つの質問による簡易診断
- [x] 5つの縁タイプ判定（木・火・土・金・水）
- [x] 生年月日による60分類システム（バックエンド）
- [x] 名前の音韻分析（バックエンド）
- [x] 地域エネルギー分析（バックエンド）
- [x] 診断結果ページ（5タイプ）
- [x] レスポンシブデザイン

### ✅ インフラ・セキュリティ
- [x] Firebase Hosting デプロイ
- [x] 独自ドメイン設定（enguide.info）
- [x] SSL証明書発行
- [x] Firestore セキュリティルール設定
- [x] API制限設定（リファラー制限）
- [x] コスト最適化（Firestore読み取り回避）

### ✅ UI/UX改善
- [x] ポータルページ作成
- [x] サービス分離（/free/）
- [x] 301リダイレクト設定（SEO対策）
- [x] 「縁とは？」説明セクション追加
- [x] 5カードレイアウト最適化
- [x] ホバー効果の調整
- [x] サービス名「縁診断」へ変更

---

## バックエンドロジック概要

### 60分類システム
生年月日から以下を算出:
- **12自然現象**: 雷、沢、火、風、水、山、地、天、木、金、土、日
- **5五行**: 木、火、土、金、水
- **60タイプ**: 12 × 5 = 60種類の組み合わせ

計算式:
```javascript
const daysSince = (birthDate - '1900-01-01') / (1日のミリ秒);
const phenomena = daysSince % 12;  // 12自然現象
const element = Math.floor(daysSince / 60) % 5;  // 5五行
```

### 5五行タイプ判定
4つの質問回答から最頻出の五行を判定:
```javascript
const answers = [q1, q2, q3, q4];  // 各回答は '木', '火', '土', '金', '水'
const counts = { '木':0, '火':0, '土':0, '金':0, '水':0 };
// 最多出現の五行を dominantElement として返す
```

### 音韻分析
名前（ローマ字）から:
- 母音分布を分析
- 子音の硬度を評価
- 五行エネルギーに変換

### 地域エネルギー
都道府県別に五行エネルギーを設定:
- 北海道・東北 → 水
- 関東 → 木
- 中部 → 土
- 関西 → 火
- その他 → 金・水

---

## Firebase設定

### リダイレクト（firebase.json）
```json
{
  "redirects": [
    {
      "source": "/diagnose.html",
      "destination": "/free/diagnose.html",
      "type": 301
    },
    {
      "source": "/results/:result",
      "destination": "/free/results/:result",
      "type": 301
    }
  ]
}
```

### セキュリティルール（firestore.rules）
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /questions/{document=**} {
      allow read: if request.auth == null;
      allow write: if false;
    }
    match /results/{document=**} {
      allow read: if request.auth == null;
      allow write: if false;
    }
  }
}
```

---

## コスト最適化

### Firestore読み取り削減
- **変更前**: 診断開始時にFirestoreから質問データ取得
- **変更後**: ローカルJSON（firestore_data.json）から取得
- **効果**: 読み取りコスト $0（50万診断/月でも無料範囲内）

### 現在の想定コスト
- **50万診断/月**: 約 ¥0（無料枠内）
- **100万診断/月**: 約 ¥350（Functions呼び出し200万回）
- **Hosting**: 10GB転送まで無料

---

## 未実装機能

### 🔲 プレミアム診断
- [ ] 60分類詳細診断結果ページ（60ページ）
- [ ] 音韻分析結果の表示
- [ ] バイオリズム診断
- [ ] 地域エネルギー詳細分析
- [ ] 決済システム統合

### 🔲 多言語対応
- [ ] 英語版サイト（/en/）
- [ ] 英語版診断ロジック

### 🔲 その他
- [ ] カスタム質問データ（ユーザー提供待ち）
- [ ] SNSシェア機能
- [ ] 診断履歴保存（要認証）

---

## Git管理

- **リポジトリ**: https://github.com/zatsugaku/en_shindan_app.git
- **ブランチ**: main
- **最新コミット**: "Initial commit: 縁診断Webアプリ プロジェクトセットアップ"

---

## デプロイ履歴

| 日付 | 変更内容 |
|------|----------|
| 初回 | Firebase初期セットアップ、診断ロジック実装 |
| 2025-11-14 | ディレクトリ構造変更（/free/）、ポータルページ作成 |
| 2025-11-14 | サービス名を「縁診断」に変更 |

---

## 次のステップ

### 短期
1. ユーザーからカスタム質問データを受領
2. 質問データをfirestore_data.jsonに反映
3. 再デプロイ

### 中期
1. 60分類診断結果ページ作成（60ページ）
2. プレミアム診断フローの実装
3. 決済システム検討

### 長期
1. 英語版サイト構築
2. SNS連携機能
3. ユーザー認証・履歴保存機能

---

## 注意事項

### セキュリティ
- API Key は公開リポジトリにコミット済み（Hosting制限のみ、問題なし）
- Firestoreは読み取り専用ルール設定済み
- Firebase Functions は公開エンドポイント（CORS設定済み）

### パフォーマンス
- 質問データはローカルJSON読み込み（Firestore不使用）
- 静的ファイルはFirebase CDN経由配信
- 診断APIは初回呼び出し時のみコールドスタート発生

### ブラウザ対応
- モダンブラウザ対応（ES6 modules使用）
- IE11非対応

---

## 連絡先・リソース

- **Firebase Console**: https://console.firebase.google.com/project/en-shindan-app
- **GitHub**: https://github.com/zatsugaku/en_shindan_app
- **本番URL**: https://enguide.info/
- **Firebase URL**: https://en-shindan-app.web.app/

---

**記録者**: Claude Code
**プロジェクトステータス**: 安定稼働中（無料診断のみ）
