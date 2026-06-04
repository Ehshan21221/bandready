// ==========================================
// ANSWER KEYS
// ==========================================
const LISTENING_KEY = {
  l1: 'B', l2: '8', l3: 'BR4 7WQ', l4: 'B',
  l5: 'B', l6: 'Tuesday and Friday', l7: 'Bridge', l8: 'C',
  l9: 'TRUE', l10: 'C'
};

// Accept multiple phrasings for short-answer reading questions
const READING_KEY = {
  r1: 'TRUE', r2: 'FALSE', r3: 'FALSE', r4: 'TRUE',
  r5: 'ii', r6: 'iii', r7: 'iv',
  r8: ['vagus nerve', 'the vagus nerve'],
  r9: ['dysbiosis'],
  r10: ['mediterranean diet', 'the mediterranean diet'],
  r11: 'B', r12: 'C', r13: 'B'
};

// ==========================================
// CONFIGURATION / STATE
// ==========================================
let timerInterval = null;
let scores = {};

// Restore progress on init
function loadSavedProgress() {
  try {
    const saved = localStorage.getItem('bandready_progress');
    if (saved) {
      const data = JSON.parse(saved);
      // Text and Selection element mapping restoration
      const fields = ['l2', 'l3', 'l6', 'l7', 'r8', 'r9', 'r10', 'r5', 'r6', 'r7'];
      fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && data[id]) el.value = data[id];
      });

      if (data.w1) { 
        const el = document.getElementById('w1'); 
        if(el) { el.value = data.w1; updateWC('w1', 'wc1'); }
      }
      if (data.w2) { 
        const el = document.getElementById('w2'); 
        if(el) { el.value = data.w2; updateWC('w2', 'wc2'); }
      }

      // Radio elements restoration
      const radios = ['l1', 'l4', 'l5', 'l8', 'l9', 'l10', 'r1', 'r2', 'r3', 'r4', 'r11', 'r12', 'r13'];
      radios.forEach(name => {
        if (data[name]) {
          const el = document.querySelector(`input[name="${name}"][value="${data[name]}"]`);
          if (el) { el.checked = true; el.closest('.opt')?.classList.add('sel'); }
        }
      });
    }
  } catch(e) { console.error("Error loading progress", e); }
}

function saveProgress() {
  try {
    const data = {};
    ['l2', 'l3', 'l6', 'l7', 'r8', 'r9', 'r10', 'r5', 'r6', 'r7', 'w1', 'w2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    });
    ['l1', 'l4', 'l5', 'l8', 'l9', 'l10', 'r1', 'r2', 'r3', 'r4', 'r11', 'r12', 'r13'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      if (el) data[name] = el.value;
    });
    localStorage.setItem('bandready_progress', JSON.stringify(data));
  } catch(e) { console.error("Error saving progress", e); }
}

// ==========================================
// ROUTING / SCREEN SPA NAVIGATION
// ==========================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if(el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  stopTimer();
  showScreen('home');
}

function startTest() {
  showScreen('select');
}

function startModule(mod) {
  stopTimer();
  showScreen(mod);
  const times = { listening: 1800, reading: 3600, writing: 3600 };
  if (times[mod]) startTimer(mod, times[mod]);
  if (mod === 'listening') buildMatrix('matrix-l', 'l', 10);
  if (mod === 'reading') buildMatrix('matrix-r', 'r', 13);
}

// ==========================================
// CORE TEST TIMERS
// ==========================================
function startTimer(mod, secs) {
  let remaining = secs;
  const el = document.getElementById('timer-' + mod);
  function tick() {
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    if (el) { 
      el.textContent = '⏱ ' + m + ':' + s; 
      el.classList.toggle('warn', remaining < 300); 
    }
    if (--remaining < 0) {
      stopTimer();
      alert('Time is up! Submitting your answers now.');
      if (mod === 'listening') submitListening();
      else if (mod === 'reading') submitReading();
      else if (mod === 'writing') submitWriting();
    }
  }
  tick();
  timerInterval = setInterval(tick, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// ==========================================
// EXAM INTERACTION MATRIX TRACKING
// ==========================================
function buildMatrix(containerId, prefix, count) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    const cell = document.createElement('div');
    cell.className = 'q-cell';
    cell.textContent = i;
    cell.id = 'cell-' + prefix + i;
    cell.onclick = () => scrollToQ(prefix + i);
    box.appendChild(cell);
  }
}

function scrollToQ(key) {
  const el = document.getElementById('qblock-' + key);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function markCellAnswered(prefix, num) {
  const cell = document.getElementById('cell-' + prefix + num);
  if (cell) cell.classList.add('answered');
}

// ==========================================
// TEXT FIELD WORD COMPILER
// ==========================================
function updateWC(inputId, countId) {
  const text = document.getElementById(inputId).value.trim();
  const words = text === '' ? 0 : text.split(/\s+/).length;
  const target = { wc1: '150–200', wc2: '250–300+' };
  document.getElementById(countId).textContent = words + ' words · Target: ' + target[countId] + ' words';
  saveProgress();
}

// ==========================================
// PARSING STRINGS AND VALUE CHECKS
// ==========================================
function radio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}
function inp(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}
function matches(user, key) {
  const u = norm(user);
  if (Array.isArray(key)) return key.some(k => norm(k) === u);
  return norm(key) === u;
}

// ==========================================
// IELTS OFFICIAL BAND TRANSLATOR MATRIX
// ==========================================
function listeningBand(raw) {
  const scaled = raw * 4; // Approximates /40 standard
  if (scaled >= 39) return 9.0;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8.0;
  if (scaled >= 32) return 7.5;
  if (scaled >= 30) return 7.0;
  if (scaled >= 26) return 6.5;
  if (scaled >= 23) return 6.0;
  if (scaled >= 18) return 5.5;
  if (scaled >= 16) return 5.0;
  if (scaled >= 13) return 4.5;
  return 4.0;
}

// Out of 13 scaled to academic standard matrix maps
function readingBand(raw) {
  const scaled = Math.round(raw * 3.07);
  if (scaled >= 39) return 9.0;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8.0;
  if (scaled >= 33) return 7.5;
  if (scaled >= 30) return 7.0;
  if (scaled >= 27) return 6.5;
  if (scaled >= 23) return 6.0;
  if (scaled >= 19) return 5.5;
  if (scaled >= 15) return 5.0;
  if (scaled >= 13) return 4.5;
  return 4.0;
}

function bandDesc(b) {
  if (b >= 8.5) return 'Expert user — outstanding performance';
  if (b >= 7.5) return 'Very good user — minor inaccuracies only';
  if (b >= 6.5) return 'Competent user — generally effective command';
  if (b >= 5.5) return 'Modest user — partial command, frequent errors';
  return 'Limited user — basic competence in familiar situations';
}

// ==========================================
// SYSTEM SCORE SUBMISSIONS
// ==========================================
function submitListening() {
  stopTimer();
  const ua = {
    l1: radio('l1'), l2: inp('l2'), l3: inp('l3'), l4: radio('l4'),
    l5: radio('l5'), l6: inp('l6'), l7: inp('l7'), l8: radio('l8'),
    l9: radio('l9'), l10: radio('l10')
  };
  let correct = 0;
  Object.keys(LISTENING_KEY).forEach(k => { if (matches(ua[k], LISTENING_KEY[k])) correct++; });
  scores.listening = { correct, total: 10, ua, key: LISTENING_KEY };
  saveProgress();
  showResults();
}

function submitReading() {
  stopTimer();
  const ua = {
    r1: radio('r1'), r2: radio('r2'), r3: radio('r3'), r4: radio('r4'),
    r5: inp('r5'), r6: inp('r6'), r7: inp('r7'),
    r8: inp('r8'), r9: inp('r9'), r10: inp('r10'),
    r11: radio('r11'), r12: radio('r12'), r13: radio('r13')
  };
  let correct = 0;
  Object.keys(READING_KEY).forEach(k => { if (matches(ua[k], READING_KEY[k])) correct++; });
  scores.reading = { correct, total: 13, ua, key: READING_KEY };
  saveProgress();
  showResults();
}

function submitWriting() {
  stopTimer();
  const t1 = document.getElementById('w1').value.trim().split(/\s+/).filter(Boolean).length;
  const t2 = document.getElementById('w2').value.trim().split(/\s+/).filter(Boolean).length;
  scores.writing = { task1: t1, task2: t2 };
  saveProgress();
  showResults();
}

function submitSpeaking() {
  scores.speaking = { completed: true };
  showResults();
}

// ==========================================
// SCORE COMPILER ENGINE DISPLAY
// ==========================================
function showResults() {
  let totalBand = 0, count = 0;
  let cardsHTML = '';
  let reviewHTML = '';

  if (scores.listening) {
    const b = listeningBand(scores.listening.correct);
    totalBand += b; count++;
    cardsHTML += `<div class="sc"><div class="val">${scores.listening.correct}/${scores.listening.total}</div><div class="lbl">Listening Score</div></div>
    <div class="sc"><div class="val">${b.toFixed(1)}</div><div class="lbl">Listening Band</div></div>`;
    reviewHTML += buildReview('Listening — Answer Review', scores.listening.ua, scores.listening.key,
      ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10']);
  }

  if (scores.reading) {
    const b = readingBand(scores.reading.correct);
    totalBand += b; count++;
    cardsHTML += `<div class="sc"><div class="val">${scores.reading.correct}/${scores.reading.total}</div><div class="lbl">Reading Score</div></div>
    <div class="sc"><div class="val">${b.toFixed(1)}</div><div class="lbl">Reading Band</div></div>`;
    reviewHTML += buildReview('Reading — Answer Review', scores.reading.ua, scores.reading.key,
      ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13']);
  }

  if (scores.writing) {
    cardsHTML += `<div class="sc"><div class="val">${scores.writing.task1}</div><div class="lbl">Task 1 Words</div></div>
    <div class="sc"><div class="val">${scores.writing.task2}</div><div class="lbl">Task 2 Words</div></div>`;
  }

  if (scores.speaking) {
    cardsHTML += `<div class="sc"><div class="val">✓</div><div class="lbl">Speaking Done</div></div>`;
  }

  const overall = count > 0 ? Math.round((totalBand / count) * 2) / 2 : null;
  document.getElementById('result-band').textContent = overall !== null ? overall.toFixed(1) : '—';
  document.getElementById('result-desc').textContent = overall !== null ? bandDesc(overall) : 'No graded modules completed.';
  document.getElementById('score-cards').innerHTML = cardsHTML;
  document.getElementById('review-container').innerHTML = reviewHTML;
  showScreen('results');
}

function buildReview(title, ua, key, keys) {
  let rows = keys.map((k, i) => {
    const user = ua[k] || '';
    const ok = matches(user, key[k]);
    const displayKey = Array.isArray(key[k]) ? key[k][0] : key[k];
    return `<div class="review-row">
      <span class="r-num">Q${i + 1}</span>
      <span class="r-user ${ok ? 'ok' : 'bad'}">${user || '<em style="color:var(--g300)">No answer</em>'}</span>
      <span class="r-correct">${ok ? '' : '✓ ' + displayKey}</span>
      <span>${ok ? '<span class="r-icon-ok">✓</span>' : '<span class="r-icon-bad">✗</span>'}</span>
    </div>`;
  }).join('');

  return `<div class="review-block">
    <div class="review-head">${title}</div>
    <div style="display:grid;grid-template-columns:36px 1fr 1fr 28px;gap:10px;padding:8px 18px;background:var(--g50);font-family:var(--mono);font-size:.68rem;color:var(--g500);text-transform:uppercase;letter-spacing:.5px">
      <span>#</span><span>Your Answer</span><span>Correct Answer</span><span></span>
    </div>
    ${rows}
  </div>`;
}

// ==========================================
// EVENT DELEGATION LIFECYCLES
// ==========================================
document.addEventListener('change', function(e) {
  if (e.target.type === 'radio') {
    const name = e.target.name;
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => r.closest('.opt')?.classList.remove('sel'));
    e.target.closest('.opt')?.classList.add('sel');
    
    const num = name.replace(/[^0-9]/g, '');
    const prefix = name.charAt(0);
    markCellAnswered(prefix, num);
    saveProgress();
  }
});

document.addEventListener('input', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    saveProgress();
    const id = e.target.id;
    if (id && id.length > 0) {
      const match = id.match(/^([lr])(\d+)$/);
      if (match) markCellAnswered(match[1], match[2]);
    }
  }
});

window.addEventListener('load', loadSavedProgress);
