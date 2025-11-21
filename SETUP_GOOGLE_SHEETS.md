# Google Sheets連携セットアップ手順

既存の美しいdiagnose.htmlをそのまま使って、Googleスプレッドシートに診断データを送信する仕組みです。

---

## 📋 システム概要

```
diagnose.html（既存デザイン）
    ↓ 診断完了
Google Apps Script（Webアプリ）
    ↓ データ記録
Googleスプレッドシート
    ↓ あなたが手動でメール送信（クリック1回）
Gmail → ユーザーへ診断結果メール送信
```

---

## 🎯 Step 1: 専用Gmailアカウント作成

### 1-1. Gmailアカウント作成

1. https://accounts.google.com/signup にアクセス
2. 新しいアカウントを作成

**推奨設定:**
- メールアドレス: `enguide.shindan@gmail.com`
- 名前: **縁診断 運営チーム**
- プロフィール写真: ロゴなど（任意）

### 1-2. ログイン確認

作成したアカウントでログインできることを確認してください。

---

## 🎯 Step 2: Googleスプレッドシート作成

### 2-1. 新しいスプレッドシートを作成

1. 専用Gmailアカウントでログイン
2. https://sheets.google.com にアクセス
3. **空白のスプレッドシート**を作成
4. スプレッドシート名: **縁診断 申し込み管理**

### 2-2. ヘッダー行を設定

A1セルから以下のヘッダーを入力:

| 列 | ヘッダー名 |
|----|-----------|
| A  | タイムスタンプ |
| B  | お名前 |
| C  | 名前（ローマ字） |
| D  | 苗字（ローマ字） |
| E  | 生年月日 |
| F  | 出生地 |
| G  | 現在地 |
| H  | 質問1 |
| I  | 質問2 |
| J  | 質問3 |
| K  | 質問4 |
| L  | メールアドレス |
| M  | 送信ステータス |
| N  | 送信日時 |
| O  | 結果URL |

---

## 🎯 Step 3: Apps Script設定

### 3-1. Apps Scriptエディタを開く

1. スプレッドシートで、メニュー: **拡張機能** → **Apps Script**
2. コードエディタが開きます

### 3-2. コードを貼り付け

1. デフォルトのコード（`function myFunction() {...}`）を全て削除
2. `scripts/google-apps-script-web-receiver.js` の内容を全てコピー
3. Apps Scriptエディタに貼り付け
4. **保存**（💾アイコン）
5. プロジェクト名: **縁診断システム**

### 3-3. Webアプリとしてデプロイ

1. 右上の**デプロイ**ボタンをクリック
2. **新しいデプロイ**を選択
3. 設定:
   - **種類の選択**: ⚙️（歯車アイコン） → **ウェブアプリ**
   - **説明**: 縁診断データ受信エンドポイント
   - **次のユーザーとして実行**: 自分（your-email@gmail.com）
   - **アクセスできるユーザー**: **全員**（重要！）
4. **デプロイ**をクリック

### 3-4. 権限の承認

初回デプロイ時に権限の承認が必要です:

1. 「承認が必要です」と表示される
2. **権限を確認**をクリック
3. Googleアカウントを選択
4. **詳細**をクリック
5. **縁診断システム（安全ではないページ）に移動**をクリック
6. **許可**をクリック

### 3-5. WebアプリURLをコピー

デプロイ完了後、**ウェブアプリ URL**が表示されます。

```
例: https://script.google.com/macros/s/AKfycby.../exec
```

このURLを**メモ帳などにコピー**してください。

---

## 🎯 Step 4: フロントエンド設定

### 4-1. diagnose-v3.js の設定を更新

1. `public/free/js/diagnose-v3.js` を開く
2. 7行目の`GOOGLE_APPS_SCRIPT_URL`を先ほどコピーしたURLに置き換え:

```javascript
// 変更前
const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

// 変更後（例）
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
```

3. 保存

### 4-2. diagnose.html の読み込みスクリプトを変更

1. `public/free/diagnose.html` を開く
2. 355行目付近の`<script>`タグを変更:

```html
<!-- 変更前 -->
<script type="module" src="js/diagnose.js"></script>

<!-- 変更後 -->
<script type="module" src="js/diagnose-v3.js"></script>
```

3. 保存

---

## 🎯 Step 5: テスト送信

### 5-1. ローカルテスト

1. `public/free/diagnose.html` をブラウザで開く
2. 全ての項目を入力（テストデータでOK）
3. 4つの質問に回答
4. 送信

### 5-2. スプレッドシート確認

1. Googleスプレッドシートを開く
2. 2行目にデータが追加されていることを確認

**成功例:**
| タイムスタンプ | お名前 | 名前 | 苗字 | ... |
|---------------|--------|------|------|-----|
| 2025-11-20... | 山田太郎 | Taro | Yamada | ... |

---

## 🎯 Step 6: メール送信テスト

### 6-1. メニューが表示されるか確認

スプレッドシートのメニューバーに**「縁診断」**メニューが追加されているはずです。

もし表示されていない場合:
1. ページをリロード
2. またはApps Scriptエディタで`onOpen()`関数を実行

### 6-2. テストメール送信

1. スプレッドシートで2行目（テストデータ）を選択
2. メニュー: **縁診断** → **選択行の診断を実行してメール送信**
3. 「診断結果メールを送信しました！」と表示される
4. M列に「送信済み」、N列に送信日時、O列に結果URLが記録される

### 6-3. メール受信確認

テストで入力したメールアドレスに診断結果メールが届いているか確認してください。

**メール例:**
```
件名: 【縁診断】あなた専用の診断結果

山田太郎 様

この度は「縁診断」にお申し込みいただき、
誠にありがとうございます。

あなたの縁を診断いたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━
 診断結果: 火の朧月
━━━━━━━━━━━━━━━━━━━━━━━━━━

以下のリンクから、あなた専用の診断結果ページを
ご確認ください：

https://enguide.info/results/fire/fire-oborozuki.html?token=xxx

...
```

---

## 🎯 Step 7: 本番デプロイ

### 7-1. GitHubにコミット

```bash
cd C:\Users\user\work\en_shindan_app
git add .
git commit -m "Add Google Sheets integration for diagnosis submission

- Add diagnose-v3.js for Google Sheets submission
- Add diagnosis-submitted.html confirmation page
- Update diagnose.html with name and email fields
- Add Google Apps Script for data reception and email sending"
git push
```

### 7-2. Firebase Hostingにデプロイ

```bash
firebase deploy --only hosting
```

### 7-3. 本番テスト

1. https://enguide.info/free/diagnose.html にアクセス
2. 実際のデータで診断申し込み
3. スプレッドシートにデータが届くか確認
4. メール送信テスト

---

## 📊 日常の運用フロー

### 毎日の作業（所要時間: 2-5分）

1. **Googleスプレッドシートを開く**
2. **新規申し込みを確認**（M列が空白の行）
3. **診断実行とメール送信**
   - 各行を選択
   - メニュー: **縁診断** → **選択行の診断を実行してメール送信**

   または

   - メニュー: **縁診断** → **未送信の全診断を一括送信**

4. **完了！**

### 処理速度

- 1人あたり: 30秒（個別送信）
- 一括送信: 10人でも1-2分

---

## ⚠️ トラブルシューティング

### 問題1: スプレッドシートにデータが届かない

**原因**: Apps ScriptのWebアプリURLが間違っている

**解決策**:
1. Apps Scriptエディタを開く
2. **デプロイ** → **デプロイを管理**
3. WebアプリURLを再確認
4. `diagnose-v3.js`の`GOOGLE_APPS_SCRIPT_URL`を更新

### 問題2: CORSエラーが出る

**原因**: Apps Scriptのアクセス権限が「全員」になっていない

**解決策**:
1. Apps Scriptエディタ → **デプロイ** → **デプロイを管理**
2. 鉛筆アイコン（編集）をクリック
3. **アクセスできるユーザー**: **全員**に変更
4. **デプロイ**

### 問題3: メールが送信されない

**原因**: Gmailの1日の送信制限（100通）を超えた

**解決策**:
- 翌日まで待つ
- または複数のGmailアカウントを用意する

### 問題4: メールが迷惑メールフォルダに入る

**対策**:
- ユーザーに迷惑メールフォルダを確認してもらう
- 診断申し込み完了ページ（diagnosis-submitted.html）に注意書きあり

---

## 🎉 完了！

これで既存のdiagnose.htmlのデザインを維持したまま、Googleスプレッドシート連携が完成しました！

### システムのメリット

✅ 既存の美しいUIをそのまま使える
✅ Googleフォームの見た目は使わない
✅ 完全無料（1日100通まで）
✅ メアド100%取得
✅ 到達率100%（Gmail送信）
✅ 運用負荷最小（クリック1回/人）
✅ パーソナル感がある

---

## 📞 サポート

不明な点があれば、Claude Codeに質問してください！
