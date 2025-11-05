import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * 診断ロジック関数
 * ユーザーの回答を受け取り、適切な診断結果IDを返す
 */
export const getDiagnosticResult = functions.https.onCall(
  async (data, context) => {
    try {
      // ユーザーの回答を取得
      const answers = data.answers as number[];

      if (!answers || !Array.isArray(answers)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "回答データが不正です"
        );
      }

      // 簡単な診断ロジック（後で拡張）
      // 例: 回答の合計値で診断結果を決定
      const score = answers.reduce((sum, answer) => sum + answer, 0);
      const averageScore = score / answers.length;

      let resultId: string;

      if (averageScore >= 4) {
        resultId = "result_excellent";
      } else if (averageScore >= 3) {
        resultId = "result_good";
      } else if (averageScore >= 2) {
        resultId = "result_normal";
      } else {
        resultId = "result_poor";
      }

      // Firestoreから診断結果を取得
      const db = admin.firestore();
      const resultDoc = await db
        .collection("diagnostic_results")
        .doc(resultId)
        .get();

      if (!resultDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "診断結果が見つかりません"
        );
      }

      return {
        resultId: resultId,
        result: resultDoc.data(),
      };
    } catch (error) {
      console.error("Error in getDiagnosticResult:", error);
      throw new functions.https.HttpsError(
        "internal",
        "診断処理中にエラーが発生しました"
      );
    }
  }
);
