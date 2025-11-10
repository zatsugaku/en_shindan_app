/**
 * Firestore 診断結果データ更新スクリプト
 *
 * 使い方:
 * 1. firestore_data.json の results セクションを更新
 * 2. node scripts/update-results.js を実行
 *
 * 既存データは上書きされます
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin初期化
const serviceAccount = require('../en-shindan-app-firebase-adminsdk-fbsvc-b6a080048f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'en-shindan-app'
});

const db = admin.firestore();

async function updateResults() {
  try {
    console.log('🔥 Firestoreに接続しています...\n');

    // JSONファイルを読み込み
    const dataPath = path.join(__dirname, '..', 'firestore_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.results) {
      console.error('❌ firestore_data.json に results セクションがありません');
      process.exit(1);
    }

    console.log('📊 診断結果データを更新中...\n');

    let updateCount = 0;
    let addCount = 0;

    for (const [resultId, resultData] of Object.entries(data.results)) {
      const docRef = db.collection('results').doc(resultId);
      const docSnapshot = await docRef.get();

      if (docSnapshot.exists) {
        await docRef.update(resultData);
        console.log(`  🔄 更新: ${resultId} - ${resultData.title || resultData.description}`);
        updateCount++;
      } else {
        await docRef.set(resultData);
        console.log(`  ✨ 新規追加: ${resultId} - ${resultData.title || resultData.description}`);
        addCount++;
      }
    }

    console.log('\n✅ 診断結果データの更新が完了しました！');
    console.log(`\n統計:`);
    console.log(`  - 更新: ${updateCount}件`);
    console.log(`  - 新規追加: ${addCount}件`);
    console.log(`  - 合計: ${Object.keys(data.results).length}件`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
updateResults()
  .then(() => {
    console.log('\n🎉 すべての処理が完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 致命的なエラー:', error);
    process.exit(1);
  });
