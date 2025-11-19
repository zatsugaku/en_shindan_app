import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();

const RECAPTCHA_SECRET_KEY = functions.config().recaptcha?.secret || "";

/**
 * reCAPTCHA v3トークンを検証
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    // スコアが0.5以上なら人間と判定
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

/**
 * 診断トークン生成 + Firestore記録
 */
export const generateDiagnosisToken = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    // CORS設定
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { recaptchaToken, diagnosisData } = req.body;

      if (!recaptchaToken) {
        res.status(400).json({ error: "reCAPTCHA token required" });
        return;
      }

      // reCAPTCHA検証
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        res.status(403).json({ error: "reCAPTCHA verification failed" });
        return;
      }

      // アクセストークン生成
      const accessToken = uuidv4();

      // Firestoreに記録
      const db = admin.firestore();
      await db.collection("diagnosis_records").add({
        token: accessToken,
        diagnosisData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });

      res.status(200).json({
        success: true,
        token: accessToken,
      });
    } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

/**
 * トークン検証（結果ページ用）
 */
export const verifyDiagnosisToken = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    // CORS設定
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const token = req.query.token as string;

      if (!token) {
        res.status(400).json({ valid: false, error: "Token required" });
        return;
      }

      // Firestoreからトークンを検索
      const db = admin.firestore();
      const snapshot = await db
        .collection("diagnosis_records")
        .where("token", "==", token)
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(200).json({ valid: false, error: "Token not found" });
        return;
      }

      const record = snapshot.docs[0].data();
      const expiresAt = record.expiresAt?.toDate();

      // 有効期限チェック
      if (expiresAt && expiresAt < new Date()) {
        res.status(200).json({ valid: false, error: "Token expired" });
        return;
      }

      res.status(200).json({
        valid: true,
        diagnosisData: record.diagnosisData,
      });
    } catch (error) {
      console.error("Error verifying token:", error);
      res.status(500).json({ valid: false, error: "Internal server error" });
    }
  });
