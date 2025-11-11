# 🔒 緊急セキュリティ対応 - Google API Key制限

## ⚠️ 状況

**公開されているAPIキー:**
```
AIzaSyBGgpKjuUmrtf7TJasw4RcsMEzMGfMl42A
```

**種類:** Firebase Web API Key
**リスクレベル:** 中（制限追加で低に下げられる）

---

## ✅ 現在の保護状態

| 保護層 | 状態 |
|--------|------|
| Firestoreルール | ✅ 読み取り専用（書き込み禁止） |
| サービスアカウント | ✅ 保護済み |
| API制限 | ❌ **未設定（至急追加必要）** |

---

## 🚨 至急実施すべき対応

### **手順: API制限の追加**

#### **ステップ1: Google Cloud Console にアクセス**

```
https://console.cloud.google.com/apis/credentials?project=en-shindan-app
```

#### **ステップ2: APIキーを編集**

1. 「認証情報」タブを開く
2. APIキー一覧から以下を見つける:
   ```
   ブラウザキー (自動作成元 Firebase)
   ```
   または
   ```
   AIzaSyBGgpKjuUmrtf7TJasw4RcsMEzMGfMl42A
   ```
3. 右側の「⋮」→「編集」をクリック

#### **ステップ3: アプリケーションの制限を追加**

**「アプリケーションの制限」セクション:**
- 「HTTP リファラー（ウェブサイト）」を選択
- 以下を追加:
  ```
  https://en-shindan-app.web.app/*
  https://en-shindan-app.firebaseapp.com/*
  http://localhost:5000/*
  http://localhost/*
  ```

#### **ステップ4: APIの制限を追加**

**「API の制限」セクション:**
- 「キーを制限」を選択
- 以下のAPIを許可:
  - ✅ Cloud Firestore API
  - ✅ Firebase Hosting API
  - ✅ Identity Toolkit API
  - ✅ Token Service API

#### **ステップ5: 保存**

「保存」ボタンをクリック

---

## 📊 制限追加後の状態

| リスク | 制限前 | 制限後 |
|--------|--------|--------|
| 第三者サイトからの利用 | ⚠️ 可能 | ✅ 不可能 |
| 無料枠の悪用 | ⚠️ 可能 | ✅ 不可能 |
| データ読み取り | ⚠️ 可能 | ✅ 許可サイトのみ |
| データ書き込み | ✅ 不可能 | ✅ 不可能 |

---

## ⏱️ 緊急度の判断

### **中程度の緊急性**

**今すぐデータが漏洩する危険はありません**が、以下のリスクがあります：

1. **無料枠の消費**
   - 第三者が大量にリクエストすると無料枠を使い切る可能性

2. **データの読み取り**
   - 診断結果データは公開前提なので大きな問題ではない
   - ただし、意図しない利用は避けたい

3. **サービス妨害**
   - 悪意ある大量アクセスでサービスが停止する可能性

### **データ流出リスク: 低**
- ✅ 書き込みは完全禁止
- ✅ サービスアカウントは保護済み
- ✅ ユーザーの個人情報は保存していない

---

## 🔄 代替案（時間がない場合）

### **オプションA: APIキーの再発行**

より安全な方法として、新しいAPIキーを発行して古いキーを無効化：

```bash
# 1. Firebase Console で新しいWeb Appを作成
firebase apps:create WEB "縁診断アプリ（新）"

# 2. 新しい設定を取得
firebase apps:sdkconfig WEB [NEW_APP_ID]

# 3. public/js/diagnose.js を更新

# 4. 再デプロイ
firebase deploy --only hosting

# 5. 古いWeb Appを削除
```

### **オプションB: 一時的な無効化**

最も安全だが、サイトが動かなくなる：

```
Google Cloud Console → 認証情報 → APIキー → 無効化
```

**注意:** これを実行するとサイトが停止します

---

## ✅ 完了確認

制限追加後、以下を確認：

1. **サイトが正常に動作するか**
   ```
   https://en-shindan-app.web.app/diagnose.html
   ```

2. **他のドメインから使えないか（確認テスト）**
   - 別のサイトから同じAPIキーを使おうとしてもエラーになることを確認

3. **Firebase Console で使用状況を確認**
   ```
   https://console.firebase.google.com/project/en-shindan-app/usage
   ```

---

## 📞 サポート

制限追加中に問題が発生した場合は、すぐにお知らせください。

**重要:** 制限を追加してもサイトは正常に動作します。むしろ制限がない方がリスクです。
