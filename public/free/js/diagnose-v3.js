// 縁診断フォームロジック（Google Sheets連携版）
// Version: 3.0.0 - Google Sheets送信対応

// ==================== 設定 ====================

// Google Apps Script WebアプリのURL
// セットアップ後にここを更新してください
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzw5ff-AubNaEh_q0XVDxkD2fAWPWjflA0iN5mDokPhHK5ZlAFs-VstwqyoFbyknhm8/exec';

// ==================== UI Elements ====================

const $indicator = document.getElementById('questionIndicator');
const $qText = document.getElementById('questionText');
const $options = document.getElementById('options');
const $progress = document.getElementById('progressBar');
const $error = document.getElementById('questionError');
const $loading = document.getElementById('loading');

// Basic info inputs
const $nameKanji = document.getElementById('nameKanji');
const $email = document.getElementById('email');
const $firstName = document.getElementById('firstName');
const $lastName = document.getElementById('lastName');
const $birthDate = document.getElementById('birthDate');
const $birthPref = document.getElementById('birthPrefecture');
const $currentPref = document.getElementById('currentPrefecture');

const PREFS = [
  '未選択', '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
  '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

function populatePrefectures() {
  const build = (el) => {
    el.innerHTML = '';
    PREFS.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = p === '未選択' ? '' : p;
      opt.textContent = p;
      if (i === 0) opt.disabled = true;
      el.appendChild(opt);
    });
  };
  build($birthPref);
  build($currentPref);
}

// ==================== Local state ====================

let questions = [];
let idx = 0;
const answers = [];

const valueToClass = {
  '木': 'wood',
  '火': 'fire',
  '土': 'earth',
  '金': 'metal',
  '水': 'water'
};

// ==================== Progress ====================

function setProgress(currentIndex) {
  const pct = Math.floor(((currentIndex) / 4) * 100);
  $progress.style.width = `${pct}%`;
}

// ==================== Question Rendering ====================

function renderQuestion() {
  const q = questions[idx];
  if (!q) return;
  $indicator.textContent = `質問 ${idx + 1}/4`;
  $qText.textContent = q.text || '';
  $options.innerHTML = '';
  $error.style.display = 'none';

  (q.options || []).forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = `option-btn ${valueToClass[opt.value] || ''}`;
    btn.textContent = opt.label || opt.value;
    btn.addEventListener('click', () => onAnswer(opt.value));
    $options.appendChild(btn);
  });

  setProgress(idx);
}

// ==================== Answer Handling ====================

async function onAnswer(value) {
  answers[idx] = value;
  idx++;
  if (idx < 4) {
    renderQuestion();
    return;
  }

  // All answered → submit to Google Sheets
  try {
    // Validate required fields
    if (!$nameKanji.value) {
      $error.textContent = 'お名前を入力してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    if (!$email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($email.value)) {
      $error.textContent = '有効なメールアドレスを入力してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    if (!$birthDate.value) {
      $error.textContent = '生年月日を入力してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    if (!$firstName.value || !/^[A-Za-z]+$/.test($firstName.value)) {
      $error.textContent = '名前をローマ字（半角英字）で入力してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    if (!$lastName.value || !/^[A-Za-z]+$/.test($lastName.value)) {
      $error.textContent = '苗字をローマ字（半角英字）で入力してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    if (!$birthPref.value) {
      $error.textContent = '出生地（都道府県）を選択してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    if (!$currentPref.value) {
      $error.textContent = '現在地（都道府県）を選択してください。';
      $error.style.display = 'block';
      idx = 3;
      return;
    }

    $loading.style.display = 'flex';

    // フロントエンドで診断計算を実行
    const formData = {
      birthDate: $birthDate.value,
      firstName: $firstName.value,
      lastName: $lastName.value,
      birthRegion: $birthPref.value,
      currentRegion: $currentPref.value,
      workPattern: answers[0],
      relationshipStyle: answers[1],
      stressHandling: answers[2],
      lifestylePreference: answers[3]
    };

    // diagnosis-logic.js の processDiagnosis を使用
    const diagnosisResult = window.DiagnosisLogic.processDiagnosis(formData);

    if (!diagnosisResult.success) {
      throw new Error(diagnosisResult.error || '診断計算エラー');
    }

    const data = diagnosisResult.data;

    // 診断結果を含めてGoogleスプレッドシートに送信
    const submissionData = {
      nameKanji: $nameKanji.value,
      email: $email.value,
      firstName: $firstName.value,
      lastName: $lastName.value,
      birthDate: $birthDate.value,
      birthRegion: $birthPref.value,
      currentRegion: $currentPref.value,
      workPattern: answers[0],
      relationshipStyle: answers[1],
      stressHandling: answers[2],
      lifestylePreference: answers[3],
      // 診断結果を追加
      diagnosisResult: data.naturalType,     // 「火の朧月」など
      folder: data.folder,                   // "fire"
      fileName: data.fileName,               // "fire-oborozuki"
      nameType: data.nameType,               // 「結縁」など
      attractionType: data.attractionType    // 「木縁型」など
    };

    // Submit to Google Apps Script
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });

    if (!response.ok) {
      throw new Error('送信に失敗しました');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '送信エラー');
    }

    // Success - show confirmation page
    window.location.href = 'diagnosis-submitted.html';

  } catch (e) {
    console.error(e);
    $error.textContent = `診断申し込み中にエラーが発生しました: ${e.message || e}`;
    $error.style.display = 'block';
    $loading.style.display = 'none';
    idx = 3;
  }
}

// ==================== Load Questions ====================

async function loadQuestionsFallback() {
  const res = await fetch('firestore_data.json');
  const data = await res.json();
  const qs = Object.values(data.questions || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 4);
  return qs;
}

// ==================== Bootstrap ====================

async function bootstrap() {
  populatePrefectures();

  // ローカルJSONから質問データを読み込み
  questions = await loadQuestionsFallback();

  if (!questions || questions.length < 4) {
    $qText.textContent = '質問データを読み込めませんでした。時間をおいて再度お試しください。';
    return;
  }

  idx = 0;
  answers.length = 0;
  renderQuestion();
}

bootstrap();
