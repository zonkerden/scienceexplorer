const firebaseConfig = {
  apiKey: "AIzaSyD0nyKNY8bvQafKn_rCBQRKpFFcinU5A5A",
  authDomain: "science-explorer-17466.firebaseapp.com",
  projectId: "science-explorer-17466",
  storageBucket: "science-explorer-17466.appspot.com",
  messagingSenderId: "", // Optional for Firestore
  appId: "" // Optional for Firestore
};

// Initialize Firebase using compat scripts loaded in index.html
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =================================================
   SCIENCE EXPLORER — main.js  (Full Feature Build)
   ================================================= */

// ── Constants ────────────────────────────────────────
const QUESTIONS_PER_GAME  = 10;
const TIMER_SECONDS       = { easy: 20, medium: 15, hard: 10 };
const SPEED_BONUS_PER_SEC = 1;   // 1 point per second remaining
const POINTS_PER_CORRECT  = 10;
const LS_LEADERBOARD      = 'scienceExplorer_leaderboard_v2';
const LS_ACHIEVEMENTS     = 'scienceExplorer_achievements_v2';
const LS_EXPLORED         = 'scienceExplorer_explored_v2';
const LS_WIN_COUNT        = 'scienceExplorer_wins_v2';
const LS_THEME            = 'scienceExplorer_theme';
const LS_MUTE             = 'scienceExplorer_mute';

// ── Achievements Registry ─────────────────────────────
const ACHIEVEMENTS = [
    { id: 'perfect',    icon: '🏆', name: 'Perfect Score',   desc: 'Get 10/10 in a game' },
    { id: 'streak5',    icon: '🔥', name: 'On Fire!',         desc: 'Get 5 correct in a row' },
    { id: 'streak10',   icon: '🌋', name: 'Unstoppable!',     desc: 'Get 10 correct in a row' },
    { id: 'speedster',  icon: '⚡', name: 'Speed Runner',     desc: 'Earn 20+ speed bonus pts' },
    { id: 'explorer50', icon: '🗺️', name: 'Explorer',         desc: 'See 50 unique questions' },
    { id: 'explorer200',icon: '🌍', name: 'World Traveler',   desc: 'See 200 unique questions' },
    { id: 'explorer500',icon: '🧬', name: 'Master Scientist', desc: 'See all 500 questions!' },
    { id: 'wizard',     icon: '🧙', name: 'Science Wizard',   desc: 'Score 8+ in 3 separate games' },
    { id: 'lifeline',   icon: '🛟', name: 'Lifesaver',        desc: 'Use a lifeline' },
    { id: 'nocturnal',  icon: '🌙', name: 'Night Owl',        desc: 'Enable dark mode' },
    { id: 'hardmode',   icon: '🚀', name: 'Rocket Scientist', desc: 'Finish a Hard mode game' },
];

// ── State ────────────────────────────────────────────
let playerName       = '';
let selectedCat      = 'all';
let difficulty       = 'medium';
let currentQuestions = [];
let currentIndex     = 0;
let score            = 0;
let speedBonus       = 0;
let streak           = 0;
let maxStreak        = 0;
let answered         = false;
let userAnswers      = [];
let timeLeft         = 15;
let timerInterval    = null;
let lifelineUsed     = false;
let lifelines        = { fifty: true, skip: true };
let prevScreen       = 'setup-screen';

let unlockedThisRound = [];

// Persistence
let exploredSet    = new Set(JSON.parse(localStorage.getItem(LS_EXPLORED) || '[]'));
let unlockedAchs   = new Set(JSON.parse(localStorage.getItem(LS_ACHIEVEMENTS) || '[]'));
let winsByScore    = JSON.parse(localStorage.getItem(LS_WIN_COUNT) || '{}');

// ── DOM Refs ──────────────────────────────────────────
const setupScreen      = document.getElementById('setup-screen');
const quizScreen       = document.getElementById('quiz-screen');
const resultScreen     = document.getElementById('result-screen');
const leaderboardScreen= document.getElementById('leaderboard-screen');

const playerNameInput  = document.getElementById('player-name');
const categoryGrid     = document.getElementById('category-grid');
const difficultyGrid   = document.getElementById('difficulty-grid');
const exploreCount     = document.getElementById('explore-count');

const startBtn         = document.getElementById('start-btn');
const restartBtn       = document.getElementById('restart-btn');
const nextBtn          = document.getElementById('next-btn');
const fiftyBtn         = document.getElementById('fifty-btn');
const skipBtn          = document.getElementById('skip-btn');
const shareBtn         = document.getElementById('share-btn');
const leaderboardBtnSetup  = document.getElementById('leaderboard-btn-setup');
const leaderboardBtnResult = document.getElementById('leaderboard-btn-result');
const homeBtn          = document.getElementById('home-btn');
const backBtn          = document.getElementById('back-btn');
const clearLbBtn       = document.getElementById('clear-lb-btn');
const muteBtn          = document.getElementById('mute-btn');
const themeBtn         = document.getElementById('theme-btn');

const qCurrent         = document.getElementById('q-current');
const qTotal           = document.getElementById('q-total');
const liveScore        = document.getElementById('live-score');
const liveStreak       = document.getElementById('live-streak');
const scorePill        = document.getElementById('score-pill');
const streakPill       = document.getElementById('streak-pill');
const timerDisplay     = document.getElementById('timer-display');
const timerPill        = document.getElementById('timer-pill');
const timerFill        = document.getElementById('timer-fill');
const progressFill     = document.getElementById('progress-fill');
const progressBar      = document.getElementById('progress-bar');

const quizMascot       = document.getElementById('quiz-mascot');
const categoryBadge    = document.getElementById('category-badge');
const questionText     = document.getElementById('question-text');
const optionsGrid      = document.getElementById('options-grid');
const lifelinesBar     = document.getElementById('lifelines-bar');
const feedbackToast    = document.getElementById('feedback-toast');
const feedbackIcon     = document.getElementById('feedback-icon');
const feedbackMsg      = document.getElementById('feedback-msg');
const speedBonusMsg    = document.getElementById('speed-bonus-msg');

const finalScore       = document.getElementById('final-score');
const finalDenom       = document.getElementById('final-denom');
const scoreMessage     = document.getElementById('score-message');
const starRating       = document.getElementById('star-rating');
const resultTrophy     = document.getElementById('result-trophy');
const resultTitle      = document.getElementById('result-title');
const resultPlayer     = document.getElementById('result-player');
const statStreak       = document.getElementById('stat-streak');
const statBonus        = document.getElementById('stat-bonus');
const statExplored     = document.getElementById('stat-explored');
const earnedAchs       = document.getElementById('earned-achievements');
const resultBreakdown  = document.getElementById('result-breakdown');

const achievementToast = document.getElementById('achievement-toast');
const achToastIcon     = document.getElementById('ach-toast-icon');
const achToastName     = document.getElementById('ach-toast-name');
const achToastDesc     = document.getElementById('ach-toast-desc');

const leaderboardList  = document.getElementById('leaderboard-list');

const LETTERS = ['A','B','C','D'];
const CORRECT_MSGS = ['Excellent! 🎉','Brilliant! ✨','Amazing! 🧠','Spot on! 🚀','Perfect! 🔬','You nailed it! 💥','Outstanding! 🌟'];
const WRONG_MSGS   = ['Oops! Keep trying! 🌍','Science is tricky! 🤔','Almost! 💪','Every miss is a lesson! 📚','Nice try! 🔬'];
const TIMEOUT_MSGS = ['Too slow! ⏰','Time\'s up! 🕐','Faster next time! ⚡','Clock ran out! ⏱'];
const CONFETTI_COLORS = ['#56CB99','#f87171','#fbbf24','#60a5fa','#a78bfa','#f472b6','#34d399','#fb923c'];

// ── Audio System ──────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let bgmTimeout;
let bgmRunning = false;
let muted = (localStorage.getItem(LS_MUTE) === 'true');

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, type, duration, gainVal, startDelay = 0) {
    if (!audioCtx || muted) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type;
    const t = audioCtx.currentTime + startDelay;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t); osc.stop(t + duration);
}

function playSound(type) {
    if (!audioCtx || muted) return;
    if (type === 'correct') {
        playTone(660, 'sine', 0.12, 0.3);
        playTone(880, 'sine', 0.20, 0.25, 0.08);
    } else if (type === 'wrong') {
        playTone(200, 'sawtooth', 0.22, 0.28);
        playTone(150, 'sawtooth', 0.22, 0.20, 0.1);
    } else if (type === 'timeout') {
        playTone(220, 'square', 0.35, 0.22);
    } else if (type === 'click') {
        playTone(800, 'sine', 0.06, 0.15);
    } else if (type === 'end_win') {
        [440, 554, 659, 880, 1100].forEach((f,i) => playTone(f,'sine',0.45,0.18,i*0.09));
    } else if (type === 'end_ok') {
        [440, 554, 659].forEach((f,i) => playTone(f,'sine',0.4,0.15,i*0.1));
    } else if (type === 'achievement') {
        [660, 880, 1100].forEach((f,i) => playTone(f,'triangle',0.35,0.18,i*0.07));
    } else if (type === 'tick') {
        playTone(1200, 'sine', 0.05, 0.08);
    } else if (type === 'skip') {
        playTone(400, 'triangle', 0.15, 0.18);
        playTone(600, 'triangle', 0.15, 0.14, 0.1);
    }
}

// BGM — simple looping arpeggio
const BGM_NOTES = [523,659,784,659,523,440,494,523,587,698,587,523];
let bgmIdx = 0;
function startBgm() {
    if (muted || bgmRunning) return;
    bgmRunning = true;
    bgmIdx = 0;
    scheduleBgmNote();
}
function scheduleBgmNote() {
    if (!bgmRunning || muted || !audioCtx) return;
    playTone(BGM_NOTES[bgmIdx % BGM_NOTES.length], 'triangle', 0.38, 0.06);
    bgmIdx++;
    bgmTimeout = setTimeout(scheduleBgmNote, 420);
}
function stopBgm() {
    bgmRunning = false;
    clearTimeout(bgmTimeout);
}

// ── Confetti ──────────────────────────────────────────
const confCanvas = document.getElementById('confetti-canvas');
const confCtx    = confCanvas.getContext('2d');
let confParticles = [];
let confRunning   = false;

function triggerConfetti() {
    confCanvas.width  = window.innerWidth;
    confCanvas.height = window.innerHeight;
    for (let i = 0; i < 120; i++) {
        confParticles.push({
            x:  Math.random() * confCanvas.width,
            y:  -10 - Math.random() * confCanvas.height * 0.3,
            vx: (Math.random() - 0.5) * 7,
            vy: Math.random() * 3.5 + 1.5,
            gravity: 0.12,
            color:   CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            w:       Math.random() * 10 + 5,
            h:       Math.random() * 5 + 3,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 7,
            opacity: 1,
            decay:   Math.random() * 0.008 + 0.003
        });
    }
    if (!confRunning) { confRunning = true; animateConfetti(); }
}
function animateConfetti() {
    confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height);
    confParticles = confParticles.filter(p => p.opacity > 0.04 && p.y < confCanvas.height + 20);
    confParticles.forEach(p => {
        p.vy += p.gravity; p.x += p.vx; p.y += p.vy;
        p.rotation += p.rotSpeed; p.opacity -= p.decay;
        confCtx.save();
        confCtx.globalAlpha = Math.max(0, p.opacity);
        confCtx.translate(p.x, p.y);
        confCtx.rotate(p.rotation * Math.PI / 180);
        confCtx.fillStyle = p.color;
        confCtx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        confCtx.restore();
    });
    if (confParticles.length > 0) requestAnimationFrame(animateConfetti);
    else { confRunning = false; confCtx.clearRect(0, 0, confCanvas.width, confCanvas.height); }
}

// ── Particles (ambient) ───────────────────────────────
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    const ctx    = canvas.getContext('2d');
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    const parts = Array.from({length:50}, () => ({
        x:  Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        r:  Math.random() * 1.5 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.3 - 0.1,
        alpha: Math.random() * 0.5 + 0.15
    }));
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        parts.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.y < -5)  { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
            if (p.x < -5)  p.x = canvas.width + 5;
            if (p.x > canvas.width + 5) p.x = -5;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = `rgba(86,203,153,${p.alpha})`; ctx.fill();
        });
        requestAnimationFrame(tick);
    }
    tick();
})();

// ── Theme & Mute Setup ────────────────────────────────
function applyTheme() {
    const isLight = (localStorage.getItem(LS_THEME) === 'light');
    document.body.classList.toggle('light-mode', isLight);
    themeBtn.textContent = isLight ? '☀️' : '🌙';
    if (isLight && !unlockedAchs.has('nocturnal')) tryUnlockAch('nocturnal');
}
function applyMute() {
    muteBtn.textContent = muted ? '🔇' : '🔊';
    if (muted) stopBgm();
}
applyTheme(); applyMute();
updateExploreCount();

themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem(LS_THEME, isLight ? 'light' : 'dark');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
    playSound('click');
    if (isLight) tryUnlockAch('nocturnal');
});
muteBtn.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem(LS_MUTE, muted);
    applyMute();
    if (!muted) { initAudio(); if (quizScreen.classList.contains('active')) startBgm(); }
    else stopBgm();
});

// ── Category / Difficulty Selection ──────────────────
categoryGrid.addEventListener('click', e => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    categoryGrid.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCat = btn.dataset.cat;
    playSound('click');
});
difficultyGrid.addEventListener('click', e => {
    const btn = e.target.closest('.diff-btn');
    if (!btn) return;
    difficultyGrid.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
    playSound('click');
});

// ── Main Events ───────────────────────────────────────
startBtn.addEventListener('click', () => {
    playerName = playerNameInput.value.trim() || 'Scientist';
    initAudio();
    playSound('click');
    animateMascot('setup-mascot', 'spin');
    setTimeout(startGame, 300);
});
restartBtn.addEventListener('click', () => { playSound('click'); showScreen(setupScreen, 'result-screen'); updateExploreCount(); });
nextBtn.addEventListener('click', () => { playSound('click'); advanceQuestion(); });
fiftyBtn.addEventListener('click', useFiftyFifty);
skipBtn.addEventListener('click', useSkip);
shareBtn.addEventListener('click', shareScore);
leaderboardBtnSetup.addEventListener('click',  () => { prevScreen = 'setup-screen';  playSound('click'); showLeaderboard(); });
leaderboardBtnResult.addEventListener('click', () => { prevScreen = 'result-screen'; playSound('click'); showLeaderboard(); });
homeBtn.addEventListener('click', () => { playSound('click'); showScreen(setupScreen); });
backBtn.addEventListener('click',  () => { playSound('click'); showScreen(prevScreen === 'result-screen' ? resultScreen : setupScreen); });
clearLbBtn.addEventListener('click', () => {
    if (confirm('Clear all leaderboard scores?')) { localStorage.removeItem(LS_LEADERBOARD); renderLeaderboard(); }
});

// ── Game Control ──────────────────────────────────────
function startGame() {
    currentIndex = 0; score = 0; speedBonus = 0; streak = 0; maxStreak = 0;
    answered = false; userAnswers = []; unlockedThisRound = [];
    lifelines = { fifty: true, skip: true }; lifelineUsed = false;

    // Filter by category
    let pool = selectedCat === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter(q => q.category === selectedCat);
    if (pool.length < QUESTIONS_PER_GAME) pool = [...ALL_QUESTIONS];
    currentQuestions = [...pool].sort(() => 0.5 - Math.random()).slice(0, QUESTIONS_PER_GAME);

    qTotal.textContent   = currentQuestions.length;
    finalDenom.textContent = `/ ${currentQuestions.length}`;
    progressBar.setAttribute('aria-valuemax', currentQuestions.length);

    // Lifelines visibility
    lifelinesBar.style.display = difficulty === 'hard' ? 'none' : 'flex';
    fiftyBtn.disabled = false; skipBtn.disabled = false;

    hideFeedback();
    showScreen(quizScreen);
    startBgm();
    renderQuestion();
}

function renderQuestion() {
    answered = false; hideFeedback();
    stopTimer();

    const q = currentQuestions[currentIndex];

    // Track explored
    exploredSet.add(q.question);
    localStorage.setItem(LS_EXPLORED, JSON.stringify([...exploredSet]));

    // Header
    qCurrent.textContent    = currentIndex + 1;
    liveScore.textContent   = score * POINTS_PER_CORRECT + speedBonus;
    progressFill.style.width = `${(currentIndex / currentQuestions.length) * 100}%`;
    progressBar.setAttribute('aria-valuenow', currentIndex);

    // Streak
    if (streak >= 2) {
        streakPill.style.display = 'inline-flex';
        liveStreak.textContent = streak;
        streakPill.classList.remove('streakPulse');
        void streakPill.offsetWidth;
        streakPill.classList.add('streakPulse');
    } else {
        streakPill.style.display = 'none';
    }

    // Category badge
    categoryBadge.textContent = q.category;

    // Mascot – thinking face
    setMascot('quiz-mascot', '🤔');

    // Question animate in
    questionText.style.opacity = '0'; questionText.style.transform = 'translateY(8px)';
    questionText.textContent = q.question;
    requestAnimationFrame(() => {
        questionText.style.transition = 'all 0.35s ease';
        questionText.style.opacity = '1'; questionText.style.transform = 'translateY(0)';
    });

    // Render options
    optionsGrid.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.setAttribute('role', 'listitem');
        btn.dataset.idx = idx;
        btn.innerHTML = `<span class="option-letter">${LETTERS[idx]}</span><span class="option-text">${opt}</span>`;
        btn.addEventListener('click', () => handleAnswer(btn, idx));

        btn.style.opacity = '0'; btn.style.transform = 'translateY(14px)';
        optionsGrid.appendChild(btn);
        setTimeout(() => {
            btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease, all 0.18s cubic-bezier(0.22,1,0.36,1)';
            btn.style.opacity = '1'; btn.style.transform = 'translateY(0)';
        }, 50 + idx * 55);
    });

    // Start timer (after options appear)
    setTimeout(startTimer, 50 + q.options.length * 55 + 100);
}

function handleAnswer(selectedBtn, selectedIdx) {
    if (answered) return;
    answered = true;
    stopTimer();

    const q = currentQuestions[currentIndex];
    const isCorrect = (selectedIdx === q.correctIndex);

    userAnswers.push({ chosen: selectedIdx, correct: q.correctIndex, isCorrect, timed: false });

    const allBtns = optionsGrid.querySelectorAll('.option-btn');
    allBtns.forEach(b => { b.disabled = true; });

    if (isCorrect) {
        selectedBtn.classList.add('correct');
        score++;
        streak++;
        maxStreak = Math.max(maxStreak, streak);

        const bonus = Math.min(timeLeft, TIMER_SECONDS[difficulty]) * SPEED_BONUS_PER_SEC;
        speedBonus += bonus;

        liveScore.textContent = score * POINTS_PER_CORRECT + speedBonus;
        scorePill.classList.remove('pop'); void scorePill.offsetWidth; scorePill.classList.add('pop');

        setMascot('quiz-mascot', '🤩'); animateMascot('quiz-mascot', 'bounce');
        playSound('correct');
        triggerConfetti();

        if (streak >= 2) {
            streakPill.style.display = 'inline-flex';
            liveStreak.textContent = streak;
        }

        setTimeout(() => showFeedback('correct', bonus), 400);
    } else {
        selectedBtn.classList.add('wrong');
        allBtns[q.correctIndex].classList.add('correct');
        streak = 0;
        streakPill.style.display = 'none';

        setMascot('quiz-mascot', '😅'); animateMascot('quiz-mascot', 'shake');
        playSound('wrong');
        setTimeout(() => showFeedback('wrong', 0), 400);
    }
}

function handleTimeout() {
    if (answered) return;
    answered = true;
    stopTimer();

    const q = currentQuestions[currentIndex];
    userAnswers.push({ chosen: -1, correct: q.correctIndex, isCorrect: false, timed: true });

    const allBtns = optionsGrid.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    allBtns[q.correctIndex].classList.add('correct');

    streak = 0; streakPill.style.display = 'none';
    setMascot('quiz-mascot', '😮');
    playSound('timeout');
    setTimeout(() => showFeedback('timeout', 0), 300);
}

// ── Timer ─────────────────────────────────────────────
function startTimer() {
    timeLeft = TIMER_SECONDS[difficulty];
    updateTimerDisplay();

    // Instantly set full width without transition
    timerFill.style.transition = 'none';
    timerFill.style.width = '100%';
    timerFill.className = 'timer-fill';
    void timerFill.offsetWidth;
    // Then enable transition
    timerFill.style.transition = `width ${timeLeft}s linear, background 0.4s`;
    timerFill.style.width = '0%';

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 5) {
            timerFill.classList.add('danger');
            timerPill.className = 'timer-pill danger';
            setMascot('quiz-mascot', '⏰');
            if (timeLeft <= 3) playSound('tick');
        } else if (timeLeft <= Math.floor(TIMER_SECONDS[difficulty] * 0.4)) {
            timerFill.classList.add('warning');
            timerPill.className = 'timer-pill warning';
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }
function updateTimerDisplay() {
    timerDisplay.textContent = Math.max(0, timeLeft);
}

// ── Feedback Toast ────────────────────────────────────
function showFeedback(type, bonus) {
    feedbackToast.classList.remove('hidden','toast-correct','toast-wrong','toast-timeout');
    if (type === 'correct') {
        feedbackToast.classList.add('toast-correct');
        feedbackIcon.textContent = '✅';
        feedbackMsg.textContent = CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)];
        if (bonus > 0) {
            speedBonusMsg.textContent = `+${bonus} speed bonus!`;
            speedBonusMsg.classList.remove('hidden');
        } else speedBonusMsg.classList.add('hidden');
    } else if (type === 'wrong') {
        feedbackToast.classList.add('toast-wrong');
        feedbackIcon.textContent = '❌';
        feedbackMsg.textContent = WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)];
        speedBonusMsg.classList.add('hidden');
    } else {
        feedbackToast.classList.add('toast-timeout');
        feedbackIcon.textContent = '⏰';
        feedbackMsg.textContent = TIMEOUT_MSGS[Math.floor(Math.random() * TIMEOUT_MSGS.length)];
        speedBonusMsg.classList.add('hidden');
    }
    // Reset timer pill
    timerPill.className = 'timer-pill';
}
function hideFeedback() {
    feedbackToast.classList.add('hidden');
    feedbackToast.classList.remove('toast-correct','toast-wrong','toast-timeout');
    timerPill.className = 'timer-pill';
}

// ── Lifelines ─────────────────────────────────────────
function useFiftyFifty() {
    if (!lifelines.fifty || answered) return;
    lifelines.fifty = false;
    fiftyBtn.disabled = true;
    lifelineUsed = true;
    playSound('skip');

    const q = currentQuestions[currentIndex];
    const allBtns = optionsGrid.querySelectorAll('.option-btn');
    let eliminated = 0;
    allBtns.forEach(btn => {
        const idx = parseInt(btn.dataset.idx);
        if (idx !== q.correctIndex && eliminated < 2) {
            btn.classList.add('eliminated');
            eliminated++;
        }
    });
    tryUnlockAch('lifeline');
}

function useSkip() {
    if (!lifelines.skip || answered) return;
    lifelines.skip = false;
    skipBtn.disabled = true;
    lifelineUsed = true;
    answered = true;
    stopTimer();
    playSound('skip');

    userAnswers.push({ chosen: -1, correct: currentQuestions[currentIndex].correctIndex, isCorrect: false, timed: false, skipped: true });
    streak = 0; streakPill.style.display = 'none';
    setMascot('quiz-mascot', '🤔');
    tryUnlockAch('lifeline');
    setTimeout(advanceQuestion, 200);
}

// ── Advance ───────────────────────────────────────────
function advanceQuestion() {
    stopTimer();
    currentIndex++;
    if (currentIndex < currentQuestions.length) renderQuestion();
    else showResults();
}

// ── Results ───────────────────────────────────────────
function showResults() {
    stopBgm();
    progressFill.style.width = '100%';

    const total   = currentQuestions.length;
    const pct     = score / total;
    const totalPts = score * POINTS_PER_CORRECT + speedBonus;

    finalScore.textContent  = score;
    finalDenom.textContent  = `/ ${total}`;
    statStreak.textContent  = maxStreak;
    statBonus.textContent   = `+${speedBonus}`;
    statExplored.textContent = exploredSet.size;
    resultPlayer.textContent = `👤 ${playerName}`;

    // Trophy + message
    if (pct === 1) {
        resultTrophy.textContent = '🏆'; resultTitle.textContent = 'Perfect Score!';
        scoreMessage.textContent = `You're a true Science Genius! 🧪✨`;
        playSound('end_win'); triggerConfetti(); triggerConfetti();
        setMascot('quiz-mascot', '🎉');
    } else if (pct >= 0.7) {
        resultTrophy.textContent = '🌟'; resultTitle.textContent = 'Well Done!';
        scoreMessage.textContent = `Great job, keep exploring! 🚀`;
        playSound('end_win'); triggerConfetti();
    } else if (pct >= 0.4) {
        resultTrophy.textContent = '🔬'; resultTitle.textContent = 'Not Bad!';
        scoreMessage.textContent = `Science takes practice — you\'re getting there! 💪`;
        playSound('end_ok');
    } else {
        resultTrophy.textContent = '📚'; resultTitle.textContent = 'Keep Learning!';
        scoreMessage.textContent = `Keep exploring — you\'ll ace it next time! 🌱`;
        playSound('end_ok');
    }

    // Stars
    starRating.innerHTML = '';
    const starsLit = Math.round(pct * 5);
    for (let i = 0; i < 5; i++) {
        const s = document.createElement('span'); s.classList.add('star'); s.textContent = '⭐';
        if (i < starsLit) setTimeout(() => s.classList.add('lit'), 350 + i * 130);
        starRating.appendChild(s);
    }

    // Breakdown
    resultBreakdown.innerHTML = '';
    currentQuestions.forEach((q, i) => {
        const ua  = userAnswers[i];
        const item = document.createElement('div');
        const cls = ua.skipped ? 'timeout-item' : ua.isCorrect ? 'correct-item' : ua.timed ? 'timeout-item' : 'wrong-item';
        item.classList.add('breakdown-item', cls);
        const label = ua.skipped ? 'Skipped' : ua.isCorrect ? 'Correct' : ua.timed ? 'Timeout' : 'Wrong';
        const icon  = ua.isCorrect ? '✅' : ua.timed || ua.skipped ? '⏰' : '❌';
        const shortQ = q.question.length > 44 ? q.question.slice(0, 44) + '…' : q.question;
        item.innerHTML = `<span class="bd-icon">${icon}</span><span class="bd-q">${shortQ}</span><span class="bd-result">${label}</span>`;
        resultBreakdown.appendChild(item);
    });

    // Achievements
    checkAchievements(score, total, maxStreak, speedBonus);
    earnedAchs.innerHTML = '';
    unlockedThisRound.forEach(id => {
        const def = ACHIEVEMENTS.find(a => a.id === id);
        if (!def) return;
        const b = document.createElement('div'); b.classList.add('ach-badge');
        b.innerHTML = `<span>${def.icon}</span><span>${def.name}</span>`;
        earnedAchs.appendChild(b);
    });

    // Save to leaderboard
    saveScore(totalPts, score, total);

    showScreen(resultScreen);
}

// ── Achievements ──────────────────────────────────────
function tryUnlockAch(id) {
    if (unlockedAchs.has(id)) return;
    unlockedAchs.add(id);
    localStorage.setItem(LS_ACHIEVEMENTS, JSON.stringify([...unlockedAchs]));
    unlockedThisRound.push(id);
    showAchievementToast(id);
    playSound('achievement');
}

function checkAchievements(sc, total, strk, spd) {
    if (sc === total) tryUnlockAch('perfect');
    if (strk >= 5)   tryUnlockAch('streak5');
    if (strk >= 10)  tryUnlockAch('streak10');
    if (spd >= 20)   tryUnlockAch('speedster');
    if (exploredSet.size >= 50)  tryUnlockAch('explorer50');
    if (exploredSet.size >= 200) tryUnlockAch('explorer200');
    if (exploredSet.size >= 500) tryUnlockAch('explorer500');
    if (difficulty === 'hard')   tryUnlockAch('hardmode');

    // Wizard: 3 games scoring 8+
    if (sc >= 8) {
        const k = `wins_8plus`;
        winsByScore[k] = (winsByScore[k] || 0) + 1;
        localStorage.setItem(LS_WIN_COUNT, JSON.stringify(winsByScore));
        if (winsByScore[k] >= 3) tryUnlockAch('wizard');
    }
}

let achQueue = [];
let achShowing = false;
function showAchievementToast(id) {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return;
    achQueue.push(def);
    if (!achShowing) processAchQueue();
}
function processAchQueue() {
    if (achQueue.length === 0) { achShowing = false; return; }
    achShowing = true;
    const def = achQueue.shift();
    achToastIcon.textContent = def.icon;
    achToastName.textContent = def.name;
    achToastDesc.textContent = def.desc;
    achievementToast.classList.remove('hidden', 'hiding');
    setTimeout(() => {
        achievementToast.classList.add('hiding');
        setTimeout(() => {
            achievementToast.classList.add('hidden');
            achievementToast.classList.remove('hiding');
            processAchQueue();
        }, 380);
    }, 2800);
}

// ── Share Score ───────────────────────────────────────
function shareScore() {
    const totalPts = score * POINTS_PER_CORRECT + speedBonus;
    const stars = '⭐'.repeat(Math.round((score / currentQuestions.length) * 5));
    const text = `🧬 Science Explorer Quiz\n👤 ${playerName}\n📊 ${score}/${currentQuestions.length} correct (${totalPts} pts)\n🏆 Streak: ${maxStreak}  ⚡ Speed Bonus: +${speedBonus}\n${stars}\n🎮 Play at: file:///C:/Users/FAHIROZ/.gemini/antigravity/scratch/science-quiz-game/index.html`;
    navigator.clipboard.writeText(text).then(() => {
        shareBtn.textContent = '✅ Copied!';
        setTimeout(() => { shareBtn.innerHTML = '📋 Copy Score'; }, 2000);
    }).catch(() => { shareBtn.textContent = '❌ Try again'; });
    playSound('click');
}

// ── Leaderboard ───────────────────────────────────────
async function saveScore(points, sc, total) {
    const entry = {
        name:       playerName,
        points,
        score:      sc,
        total,
        maxStreak,
        speedBonus,
        difficulty,
        category:   selectedCat,
        date:       new Date().toLocaleDateString(),
        timestamp:  new Date().getTime()
    };
    
    try {
        await db.collection("leaderboard").add(entry);
        console.log("Score saved to Firebase!");
    } catch (e) {
        console.warn("Firebase not configured or failed. Falling back to local storage.", e);
        const board = JSON.parse(localStorage.getItem(LS_LEADERBOARD) || '[]');
        board.push(entry);
        board.sort((a,b) => b.points - a.points);
        board.splice(20);
        localStorage.setItem(LS_LEADERBOARD, JSON.stringify(board));
    }
}

async function showLeaderboard() {
    showScreen(leaderboardScreen);
    await renderLeaderboard();
}

async function renderLeaderboard() {
    leaderboardList.innerHTML = '<div class="lb-empty">Loading global scores... ⏳</div>';
    let board = [];
    
    try {
        const querySnapshot = await db.collection("leaderboard").orderBy("points", "desc").limit(20).get();
        querySnapshot.forEach((doc) => {
            board.push(doc.data());
        });
        
        if (board.length === 0) {
            board = JSON.parse(localStorage.getItem(LS_LEADERBOARD) || '[]');
        }
    } catch (e) {
        console.warn("Firebase not configured or failed. Falling back to local storage.", e);
        board = JSON.parse(localStorage.getItem(LS_LEADERBOARD) || '[]');
    }

    leaderboardList.innerHTML = '';
    if (board.length === 0) {
        leaderboardList.innerHTML = '<div class="lb-empty">No scores yet — play your first game! 🔬</div>';
        return;
    }
    board.forEach((e, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
        const diff = { easy:'🌱', medium:'🔬', hard:'🚀' }[e.difficulty] || '';
        const row = document.createElement('div'); row.classList.add('lb-row');
        row.innerHTML = `
            <div class="lb-rank ${rankClass}">${rankEmoji}</div>
            <div class="lb-info">
                <div class="lb-name">${escHtml(e.name)}</div>
                <div class="lb-meta">${e.score}/${e.total} correct · ${diff} ${e.difficulty} · 🔥${e.maxStreak} streak · ${e.date || ''}</div>
            </div>
            <div class="lb-points">${e.points}</div>
        `;
        leaderboardList.appendChild(row);
    });
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Mascot Helpers ────────────────────────────────────
function setMascot(id, emoji) {
    const el = document.getElementById(id);
    if (el) el.textContent = emoji;
}
function animateMascot(id, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('bounce','shake','spin');
    void el.offsetWidth;
    el.classList.add(type);
    setTimeout(() => el.classList.remove(type), 600);
}

// ── Screen Navigation ─────────────────────────────────
function showScreen(target, fromId) {
    [setupScreen, quizScreen, resultScreen, leaderboardScreen].forEach(s => s.classList.remove('active'));
    if (typeof target === 'string') target = document.getElementById(target);
    target.classList.add('active');
}

// ── Explore Count ─────────────────────────────────────
function updateExploreCount() {
    if (exploreCount) exploreCount.textContent = exploredSet.size;
}
