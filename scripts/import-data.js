/**
 * Firestore 初期データ投入スクリプト
 *
 * 実行方法:
 * node scripts/import-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin初期化（本番Firestore使用）
const serviceAccount = require('../en-shindan-app-firebase-adminsdk-fbsvc-b6a080048f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'en-shindan-app'
});

const db = admin.firestore();
console.log('🔥 本番Firestoreに接続しています...');

async function importData() {
  try {
    // JSONファイルを読み込み
    const dataPath = path.join(__dirname, '..', 'firestore_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log('データ投入を開始します...\n');

    // 質問データを投入
    console.log('📝 質問データを投入中...');
    for (const [questionId, questionData] of Object.entries(data.questions)) {
      await db.collection('questions').doc(questionId).set(questionData);
      console.log(`  ✓ ${questionId}: ${questionData.text}`);
    }

    // 診断結果データを投入
    console.log('\n📊 診断結果データを投入中...');
    for (const [resultId, resultData] of Object.entries(data.results)) {
      await db.collection('results').doc(resultId).set(resultData);
      console.log(`  ✓ ${resultId}: ${resultData.title}`);
    }

    console.log('\n✅ データ投入が完了しました！');
    console.log(`\n統計:`);
    console.log(`  - 質問数: ${Object.keys(data.questions).length}`);
    console.log(`  - 診断結果数: ${Object.keys(data.results).length}`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
importData()
  .then(() => {
    console.log('\n🎉 すべての処理が完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 致命的なエラー:', error);
    process.exit(1);
  });
