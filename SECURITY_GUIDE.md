# セキュリティガイド - 縁診断アプリ

## 📊 現在のセキュリティ状態

### ✅ **安全な状態です**

Firebase Web API Keyが公開されているのは**正常かつ安全**です。

---

## 🛡️ 実装済みのセキュリティ対策

### 1. **Firestoreセキュリティルール**
```javascript
// questions, results コレクション
allow read: if true;      // 誰でも読み取り可能
allow write: if false;    // 書き込み完全禁止

// その他のコレクション
allow read, write: if false;  // 完全拒否
```

**保護内容:**
- ✅ データの書き込み・削除は完全禁止
- ✅ 読み取りのみ許可（診断に必要）
- ✅ 管理者のみFirebase Consoleから更新可能

### 2. **Functions セキュリティ**
- ✅ CORS設定済み
- ✅ 入力バリデーション実装
- ✅ エラーハンドリング実装

### 3. **API Key 公開について**
Firebase Web API Keyは**公開を前提に設計**されています：
- ブラウザで動作するため必然的に公開される
- セキュリティはFirestoreルールとApp Checkで保護
- Firebase公式ドキュメントでも公開を推奨

**参考:**
- https://firebase.google.com/docs/projects/api-keys

---

## 🔒 追加の推奨セキュリティ対策

### **オプション1: API制限設定（推奨）**

Firebase Consoleで設定：
```
https://console.firebase.google.com/project/en-shindan-app/settings/general/web
```

**設定項目:**
1. **HTTP referrer制限**
   - 許可: `en-shindan-app.web.app/*`
   - 許可: `en-shindan-app.firebaseapp.com/*`
   - 許可: `localhost/*` (開発用)

2. **API制限**
   - 必要なAPIのみ有効化
   - Firestore API
   - Firebase Hosting API

### **オプション2: App Check（高度な保護）**

より強固な保護のため、App Checkを有効化：

**手順:**
```bash
# 1. App Checkを有効化
firebase apps:sdkconfig web --app-id 1:903967567571:web:2b6d88cbe20054753cae26

# 2. reCAPTCHA v3を設定
# Firebase Console → App Check → reCAPTCHA v3 を選択

# 3. フロントエンドにSDK追加
```

**実装例:**
```javascript
// public/js/diagnose.js に追加
import { initializeAppCheck, ReCaptchaV3Provider } from
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-check.js';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

---

## ⚠️ やってはいけないこと

### ❌ **サービスアカウントキーの公開**
- `*firebase-adminsdk*.json` は絶対に公開しない
- `.gitignore` で除外済み（確認済み）
- これは管理者権限を持つため危険

### ❌ **シークレットキーの公開**
- OAuth Client Secret
- Private API Keys
- データベースパスワード

### ✅ **公開してOKなもの**
- Firebase Web API Key （現在公開中）
- Project ID
- App ID
- Storage Bucket名

---

## 📊 セキュリティチェックリスト

| 項目 | 状態 | 優先度 |
|------|------|--------|
| Firestoreルール設定 | ✅ 完了 | 必須 |
| サービスアカウントキー保護 | ✅ 完了 | 必須 |
| Web API Key公開 | ✅ 正常 | - |
| HTTP referrer制限 | ⚪ 未設定 | 推奨 |
| App Check | ⚪ 未設定 | オプション |
| 入力バリデーション | ✅ 完了 | 必須 |
| エラーハンドリング | ✅ 完了 | 必須 |

---

## 🔍 定期的な確認項目

### 月次チェック
1. Firebase Console → 使用状況ダッシュボード
   - 異常なアクセスがないか確認
   - 無料枠の残量確認

2. Firestore セキュリティルール
   - ルールが変更されていないか確認

3. GitHub リポジトリ
   - サービスアカウントキーが含まれていないか確認

### セキュリティアラート対応
GitHubのセキュリティアラートを受信した場合：
1. アラート内容を確認
2. Web API Keyの場合 → **問題なし**（このガイド参照）
3. その他のキーの場合 → 即座に無効化・再発行

---

## 📞 緊急時の対応

### API Keyが不正利用された場合

1. **Firebase Console → 設定 → Web App**
   ```
   https://console.firebase.google.com/project/en-shindan-app/settings/general/web
   ```

2. **Web Appを削除して再作成**
   ```bash
   # 新しいWeb App作成
   firebase apps:create WEB "縁診断アプリ（新）"

   # 新しい設定を取得
   firebase apps:sdkconfig WEB [NEW_APP_ID]

   # diagnose.jsを更新
   # 再デプロイ
   ```

3. **Firestoreルールの確認**
   - 書き込み権限が追加されていないか確認
   - 不正な変更があれば即座に修正

---

## ✅ 結論

**現在のセキュリティ状態は適切です。**

Firebase Web API Keyの公開は正常な状態であり、
Firestoreセキュリティルールで適切に保護されています。

追加の対策（HTTP referrer制限、App Check）は
オプションですが、設定することでさらに安全性が向上します。
