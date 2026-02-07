// Global variables
let gameData = [];
let editingTeam = null;
let state = {
  current: null,
  revealedAnswers: [],
  strikes: 0,
  scoreA: 0,
  scoreB: 0
};

const roomCode = localStorage.getItem('familyfeud_roomcode') || 'UNKNOWN';
const STATE_KEY = `familyfeud_gamestate_${roomCode}`;

// DOM elements - will be initialized after DOM loads
let questionSelect, loadQuestionBtn, addCustomBtn, customModal, customForm;
let customQuestionInput, answersContainer, questionText, answersList;
let revealNextBtn, strikeBtn, awardA, awardB, scoreAEl, scoreBEl;
let newRoundBtn, resetBtn, backBtn, copyCodeBtn, roomCodeEl;
let strikesEl, revealedCountEl, totalAnswersEl;
let editScoreModal, scoreInput, editTeamName;

// Initialize DOM elements when page loads
document.addEventListener('DOMContentLoaded', function() {
  questionSelect = document.getElementById('questionSelect');
  loadQuestionBtn = document.getElementById('loadQuestionBtn');
  addCustomBtn = document.getElementById('addCustomBtn');
  customModal = document.getElementById('customQuestionModal');
  customForm = document.getElementById('customQuestionForm');
  customQuestionInput = document.getElementById('customQuestion');
  answersContainer = document.getElementById('answersContainer');
  questionText = document.getElementById('questionText');
  answersList = document.getElementById('answersList');
  revealNextBtn = document.getElementById('revealNextBtn');
  strikeBtn = document.getElementById('strikeBtn');
  awardA = document.getElementById('awardA');
  awardB = document.getElementById('awardB');
  scoreAEl = document.getElementById('scoreA');
  scoreBEl = document.getElementById('scoreB');
  newRoundBtn = document.getElementById('newRoundBtn');
  resetBtn = document.getElementById('resetBtn');
  backBtn = document.getElementById('backBtn');
  copyCodeBtn = document.getElementById('copyCodeBtn');
  roomCodeEl = document.getElementById('roomCode');
  strikesEl = document.getElementById('strikes');
  revealedCountEl = document.getElementById('revealedCount');
  totalAnswersEl = document.getElementById('totalAnswers');
  editScoreModal = document.getElementById('editScoreModal');
  scoreInput = document.getElementById('scoreInput');
  editTeamName = document.getElementById('editTeamName');

  // Initialize the app
  initializeApp();
});

function initializeApp() {
  // Load state if exists
  const stored = localStorage.getItem(STATE_KEY);
  if (stored) {
    state = JSON.parse(stored);
    scoreAEl.textContent = state.scoreA;
    scoreBEl.textContent = state.scoreB;
    
    // If there's a current question being played, restore it
    if (state.current) {
      strikesEl.textContent = state.strikes;
      revealedCountEl.textContent = state.revealedAnswers.length;
      totalAnswersEl.textContent = state.current.answers.length;
      questionText.textContent = state.current.question;
      
      // Render answers with correct revealed/hidden state
      answersList.innerHTML = state.current.answers.map((a, i) => {
        const isRevealed = state.revealedAnswers.includes(i);
        return `<div class="answer ${isRevealed ? '' : 'hidden'}" data-idx="${i}"><div class="text">${a.text}</div><div class="points">${a.points}</div></div>`;
      }).join('');
    }
  }
  
  loadData();
  roomCodeEl.textContent = roomCode;
  
  // Setup event listeners
  loadQuestionBtn.addEventListener('click', () => {
    const idx = parseInt(questionSelect.value, 10);
    renderQuestion(idx);
  });

  addCustomBtn.addEventListener('click', () => {
    openCustomModal();
  });

  customForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCustomQuestion(e);
  });

  revealNextBtn.addEventListener('click', revealNext);
  strikeBtn.addEventListener('click', strike);
  awardA.addEventListener('click', () => award('A'));
  awardB.addEventListener('click', () => award('B'));
  newRoundBtn.addEventListener('click', newRound);
  resetBtn.addEventListener('click', resetScores);
  backBtn.addEventListener('click', () => {
    // Clear room code and game state when exiting
    localStorage.removeItem('familyfeud_roomcode');
    localStorage.removeItem('familyfeud_gamestate_' + roomCode);
    localStorage.removeItem('familyfeud_role');
    window.location.href = window.location.origin;
  });

  copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(roomCode);
    copyCodeBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyCodeBtn.textContent = '📋 Copy'; }, 2000);
  });

  // Edit score modal events
  scoreInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveEditScore();
    }
  });

  editScoreModal.addEventListener('click', (e) => {
    if (e.target === editScoreModal) {
      closeEditScoreModal();
    }
  });

  // Custom modal events
  customModal.addEventListener('click', (e) => {
    if (e.target === customModal) {
      closeCustomModal();
    }
  });

  // Small UX: click on an answer to toggle reveal
  answersList.addEventListener('click', (e) => {
    const ans = e.target.closest('.answer');
    if (!ans) return;
    ans.classList.toggle('hidden');
    const idx = parseInt(ans.getAttribute('data-idx'), 10);
    const isRevealed = !ans.classList.contains('hidden');
    
    if (isRevealed && !state.revealedAnswers.includes(idx)) {
      state.revealedAnswers.push(idx);
    } else if (!isRevealed && state.revealedAnswers.includes(idx)) {
      state.revealedAnswers = state.revealedAnswers.filter(i => i !== idx);
    }
    
    revealedCountEl.textContent = state.revealedAnswers.length;
    saveState();
  });
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  syncStateToServer(); // Also sync to server
}

function syncStateToServer() {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/rooms/${roomCode}/state`;
  
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(state)
  }).catch(err => {
    console.warn('Failed to sync state to server:', err);
  });
}

function animateScore(element) {
  element.classList.remove('animate-score');
  // Trigger reflow to restart animation
  void element.offsetWidth;
  element.classList.add('animate-score');
}

function openEditScoreModal(team) {
  editingTeam = team;
  const currentScore = team === 'A' ? state.scoreA : state.scoreB;
  scoreInput.value = currentScore;
  editTeamName.textContent = `Team ${team}`;
  editScoreModal.classList.add('show');
  scoreInput.focus();
}

function closeEditScoreModal() {
  editScoreModal.classList.remove('show');
  editingTeam = null;
  scoreInput.value = '';
}

function saveEditScore() {
  const newScore = parseInt(scoreInput.value, 10);
  
  if (isNaN(newScore) || newScore < 0) {
    alert('Masukkan angka yang valid (0 atau lebih)');
    return;
  }
  
  if (editingTeam === 'A') {
    state.scoreA = newScore;
    scoreAEl.textContent = newScore;
    animateScore(scoreAEl);
  } else if (editingTeam === 'B') {
    state.scoreB = newScore;
    scoreBEl.textContent = newScore;
    animateScore(scoreBEl);
  }
  
  saveState();
  closeEditScoreModal();
}

async function loadData(){
  try{
    const res = await fetch('data/questions.json');
    gameData = await res.json();
    questionSelect.innerHTML = gameData.map((q,idx)=>`<option value="${idx}">${q.question}</option>`).join('');
  }catch(e){
    console.error('gagal muat data',e);
  }
}

function renderQuestion(idx){
  const q = gameData[idx];
  state.current = JSON.parse(JSON.stringify(q));
  // Don't reset revealedAnswers, strikes - keep them from previous state for this question
  // Only reset if it's a completely new question selection
  const isNewQuestion = !state.revealedAnswers || state.revealedAnswers.length === 0;
  
  if (isNewQuestion) {
    state.revealedAnswers = [];
    state.strikes = 0;
  }
  
  strikesEl.textContent = state.strikes;
  revealedCountEl.textContent = state.revealedAnswers.length;
  totalAnswersEl.textContent = state.current.answers.length;
  questionText.textContent = state.current.question;
  
  // Render answers with correct hidden/revealed state
  answersList.innerHTML = state.current.answers.map((a,i) => {
    const isRevealed = state.revealedAnswers.includes(i);
    return `<div class="answer ${isRevealed ? '' : 'hidden'}" data-idx="${i}"><div class="text">${a.text}</div><div class="points">${a.points}</div></div>`;
  }).join('');
  
  saveState();
}

function revealNext(){
  const hidden = answersList.querySelectorAll('.answer.hidden');
  if(hidden.length===0) return;
  const el = hidden[0];
  el.classList.add('revealing');
  setTimeout(() => {
    el.classList.remove('hidden');
    el.classList.remove('revealing');
  }, 150);
  const idx = parseInt(el.getAttribute('data-idx'), 10);
  state.revealedAnswers.push(idx);
  revealedCountEl.textContent = state.revealedAnswers.length;
  saveState();
}

function strike(){
  state.strikes++;
  strikesEl.textContent = state.strikes;
  saveState();
  if(state.strikes>=3){
    alert('3 strikes! Round over.');
  }
}

function award(team){
  // sum of revealed answers points
  const revealedEls = answersList.querySelectorAll('.answer:not(.hidden)');
  let sum = 0;
  revealedEls.forEach(el=>{ sum += parseInt(el.querySelector('.points').textContent,10)||0});
  if(team==='A') {
    state.scoreA += sum;
    scoreAEl.textContent = state.scoreA;
    animateScore(scoreAEl);
  } else {
    state.scoreB += sum;
    scoreBEl.textContent = state.scoreB;
    animateScore(scoreBEl);
  }
  saveState();
}

function newRound(){
  state.current = null;
  state.revealedAnswers = [];
  questionText.textContent = '(Pertanyaan belum dipilih)';
  answersList.innerHTML = '';
  state.strikes = 0;
  strikesEl.textContent = state.strikes;
  revealedCountEl.textContent = state.revealedAnswers.length;
  totalAnswersEl.textContent = 0;
  saveState();
}

function resetScores(){
  state.scoreA = 0;
  state.scoreB = 0;
  scoreAEl.textContent = state.scoreA;
  scoreBEl.textContent = state.scoreB;
  saveState();
}

// Event listeners are set up in initializeApp() function after DOM is loaded
// Small UX: click on an answer to toggle reveal
// (Moved to initializeApp function)

// Custom Question Functions
function openCustomModal() {
  customQuestionInput.value = '';
  answersContainer.innerHTML = '';
  addAnswerField();
  addAnswerField();
  customModal.classList.add('show');
}

function closeCustomModal() {
  customModal.classList.remove('show');
}

function addAnswerField() {
  const idx = answersContainer.children.length + 1;
  const defaultPoints = 40 - (idx - 1) * 5;
  const div = document.createElement('div');
  div.className = 'answer-input-group';
  div.innerHTML = `
    <input type="text" placeholder="Jawaban ${idx}" class="answer-text" required>
    <input type="number" placeholder="Poin" class="answer-points" min="1" max="100" value="${defaultPoints}" required>
    <button type="button" class="btn-remove" onclick="this.closest('.answer-input-group').remove()">Hapus</button>
  `;
  answersContainer.appendChild(div);
}

function saveCustomQuestion(e) {
  e.preventDefault();
  
  const question = customQuestionInput.value.trim();
  if (!question) {
    alert('Masukkan pertanyaan!');
    return;
  }
  
  const answerInputs = answersContainer.querySelectorAll('.answer-input-group');
  if (answerInputs.length === 0) {
    alert('Tambahkan minimal satu jawaban!');
    return;
  }
  
  const answers = [];
  let hasError = false;
  
  answerInputs.forEach((group, idx) => {
    const text = group.querySelector('.answer-text').value.trim();
    const pointsInput = group.querySelector('.answer-points').value.trim();
    const points = parseInt(pointsInput, 10);
    
    if (!text) {
      alert(`Jawaban ${idx + 1} tidak boleh kosong!`);
      hasError = true;
      return;
    }
    
    if (!pointsInput || isNaN(points) || points < 1) {
      alert(`Jawaban ${idx + 1} harus punya poin minimal 1!`);
      hasError = true;
      return;
    }
    
    answers.push({ text, points });
  });
  
  if (hasError) return;
  if (answers.length === 0) return;
  
  // Add to gameData
  const newQuestion = { question, answers };
  gameData.push(newQuestion);
  
  // Update select dropdown
  const idx = gameData.length - 1;
  const option = document.createElement('option');
  option.value = idx;
  option.textContent = question;
  questionSelect.appendChild(option);
  
  // Load the new question
  questionSelect.value = idx;
  renderQuestion(idx);
  
  closeCustomModal();
  alert('Soal baru ditambahkan!');
}

// Close modal when clicking outside
// (Moved to initializeApp function)

// Event listeners for edit score modal
// (Moved to initializeApp function)
