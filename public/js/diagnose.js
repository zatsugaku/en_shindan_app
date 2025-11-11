// Firebase SDK v9 (modular) + Diagnose flow
// Project ID: en-shindan-app
// API endpoint: https://asia-northeast1-en-shindan-app.cloudfunctions.net/getDiagnosis

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBGgpKjuUmrtf7TJasw4RcsMEzMGfMl42A',
  authDomain: 'en-shindan-app.firebaseapp.com',
  projectId: 'en-shindan-app',
  storageBucket: 'en-shindan-app.firebasestorage.app',
  messagingSenderId: '903967567571',
  appId: '1:903967567571:web:2b6d88cbe20054753cae26'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const API_ENDPOINT = 'https://asia-northeast1-en-shindan-app.cloudfunctions.net/getDiagnosis';

// 五行 → 結果ページのマッピング
const elementToPage = {
  '木': 'wood_type',
  '火': 'fire_type',
  '土': 'earth_type',
  '金': 'metal_type',
  '水': 'water_type'
};

// UI Elements
const $indicator = document.getElementById('questionIndicator');
const $qText = document.getElementById('questionText');
const $options = document.getElementById('options');
const $progress = document.getElementById('progressBar');
const $error = document.getElementById('questionError');
const $loading = document.getElementById('loading');

// Basic info inputs
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
      if (i === 0) opt.disabled = true; // プレースホルダ
      el.appendChild(opt);
    });
  };
  build($birthPref);
  build($currentPref);
}

// Local state
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

function setProgress(currentIndex) {
  const pct = Math.floor(((currentIndex) / 4) * 100);
  $progress.style.width = `${pct}%`;
}

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

function dominantFromLocal() {
  const c = { '木':0,'火':0,'土':0,'金':0,'水':0 };
  answers.forEach(a => { if (c[a] !== undefined) c[a]++; });
  return Object.entries(c).sort(([,a],[,b]) => b-a)[0][0];
}

async function onAnswer(value) {
  answers[idx] = value;
  idx++;
  if (idx < 4) {
    renderQuestion();
    return;
  }

  // All answered → call API
  try {
    // Validate required birthDate for API
    if (!$birthDate.value) {
      $error.textContent = '生年月日を入力してください。';
      $error.style.display = 'block';
      idx = 3; // stay on last question
      return;
    }

    $loading.style.display = 'flex';

    const payload = {
      birthDate: $birthDate.value,
      firstName: $firstName.value || '',
      lastName: $lastName.value || '',
      birthPrefecture: $birthPref.value || '',
      currentPrefecture: $currentPref.value || '',
      question1: answers[0],
      question2: answers[1],
      question3: answers[2],
      question4: answers[3]
    };

    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '診断APIエラー');
    }

    const element = json.data?.userProfile?.dominantElement || dominantFromLocal();
    const page = elementToPage[element];
    if (!page) throw new Error('不明な判定結果です');

    window.location.href = `/results/${page}.html`;
  } catch (e) {
    console.error(e);
    $error.textContent = `診断中にエラーが発生しました: ${e.message || e}`;
    $error.style.display = 'block';
    $loading.style.display = 'none';
  }
}

async function loadQuestionsFromFirestore() {
  const qRef = collection(db, 'questions');
  const qSnap = await getDocs(query(qRef, orderBy('order','asc')));
  const list = [];
  qSnap.forEach((doc) => list.push(doc.data()));
  // Ensure 4 items in order
  return list
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 4);
}

async function loadQuestionsFallback() {
  // Fallback to bundled JSON (for local development or Firestore issue)
  const res = await fetch('/firestore_data.json');
  const data = await res.json();
  const qs = Object.values(data.questions || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 4);
  return qs;
}

async function bootstrap() {
  populatePrefectures();
  try {
    questions = await loadQuestionsFromFirestore();
  } catch (e) {
    console.warn('Firestore読み込みに失敗。ローカルJSONにフォールバックします。', e);
    questions = await loadQuestionsFallback();
  }

  if (!questions || questions.length < 4) {
    $qText.textContent = '質問データを読み込めませんでした。時間をおいて再度お試しください。';
    return;
  }

  idx = 0;
  answers.length = 0;
  renderQuestion();
}

bootstrap();

