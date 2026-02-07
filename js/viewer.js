// Viewer interface - displays game state from non-host perspective
// Uses SharedState or localStorage to sync with host

let questionText, answersGrid, scoreAEl, scoreBEl, strikesEl, revealedEl, totalEl;
let backViewerBtn, viewerRoomCodeEl, connectionStatusEl;

let pollInterval = null;
let lastState = null;
let roomCode = localStorage.getItem('familyfeud_roomcode') || '';

console.log('Viewer loaded. Room code:', roomCode);

// Initialize DOM elements when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired. Room code:', roomCode);
  
  questionText = document.getElementById('questionText');
  answersGrid = document.getElementById('answersGrid');
  scoreAEl = document.getElementById('scoreA');
  scoreBEl = document.getElementById('scoreB');
  strikesEl = document.getElementById('strikes');
  revealedEl = document.getElementById('revealed');
  totalEl = document.getElementById('total');
  backViewerBtn = document.getElementById('backViewerBtn');
  viewerRoomCodeEl = document.getElementById('viewerRoomCode');
  connectionStatusEl = document.getElementById('connectionStatus');

  // Check if all elements exist
  if (!backViewerBtn) {
    console.error('backViewerBtn not found!');
  }
  if (!viewerRoomCodeEl) {
    console.error('viewerRoomCodeEl not found!');
  }

  if (roomCode) {
    initializeViewer();
  } else {
    console.error('No room code found! User should input room code from home page.');
    window.location.href = window.location.origin;
  }
});

function initializeViewer() {
  // Display room code
  if (viewerRoomCodeEl) {
    viewerRoomCodeEl.textContent = roomCode;
  }

  // Setup event listeners
  if (backViewerBtn) {
    backViewerBtn.addEventListener('click', () => {
      console.log('Back button clicked');
      // Clear room code when exiting viewer
      localStorage.removeItem('familyfeud_roomcode');
      localStorage.removeItem('familyfeud_role');
      window.location.href = window.location.origin;
    });
  }

  // Check for game state periodically
  async function checkConnection() {
    const state = await getGameStateWithFallback();
    console.log('Checking connection. State:', state);
    if (state) {
      connectionStatusEl.textContent = '✓ Terhubung';
      connectionStatusEl.style.color = '#6aba4a';
    } else {
      connectionStatusEl.textContent = '⚠ Menunggu host...';
      connectionStatusEl.style.color = '#ffaa44';
    }
  }

  // Initial check and first render
  (async () => {
    await checkConnection();
    const initialState = await getGameStateWithFallback();
    renderState(initialState);
  })();
  
  // Check connection every 2 seconds along with polling
  setInterval(() => checkConnection(), 2000);

  // Start auto-polling (always on)
  pollInterval = setInterval(() => pollUpdates(), 2000);

  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (pollInterval) clearInterval(pollInterval);
  });
}

function animateScore(element) {
  element.classList.remove('animate-score');
  // Trigger reflow to restart animation
  void element.offsetWidth;
  element.classList.add('animate-score');
}

// Game state key based on room code
function getStateKey() {
  return `familyfeud_gamestate_${roomCode}`;
}

// Fetch game state from server (preferred method)
async function fetchGameStateFromServer() {
  try {
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/rooms/${roomCode}/state`;
    const response = await fetch(apiUrl);
    if (response.ok) {
      const state = await response.json();
      console.log('Fetched state from server:', state);
      return state;
    }
  } catch (e) {
    console.warn('Failed to fetch state from server:', e);
  }
  return null;
}

function getGameState() {
  try {
    const key = getStateKey();
    console.log('Looking for state with key:', key);
    const stored = localStorage.getItem(key);
    console.log('Found state in localStorage:', stored);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Gagal membaca state:', e);
    return null;
  }
}

// Get game state (try server first, then fallback to localStorage)
async function getGameStateWithFallback() {
  // Try to fetch from server first
  let state = await fetchGameStateFromServer();
  // If server doesn't have it, fall back to localStorage
  if (!state) {
    state = getGameState();
  }
  return state;
}

function renderState(state) {
  if (!state) return;

  // Update scoreboard with animation
  const currentScoreA = parseInt(scoreAEl.textContent);
  const currentScoreB = parseInt(scoreBEl.textContent);
  const newScoreA = state.scoreA || 0;
  const newScoreB = state.scoreB || 0;

  if (newScoreA !== currentScoreA) {
    scoreAEl.textContent = newScoreA;
    animateScore(scoreAEl);
  }

  if (newScoreB !== currentScoreB) {
    scoreBEl.textContent = newScoreB;
    animateScore(scoreBEl);
  }

  // Update strikes
  strikesEl.textContent = state.strikes || 0;

  // Update question
  if (state.current) {
    questionText.textContent = state.current.question || '(Pertanyaan belum dipilih)';
    totalEl.textContent = state.current.answers.length;
    
    // Render answers
    answersGrid.innerHTML = '';
    const revealedCount = (state.revealedAnswers || []).length;
    revealedEl.textContent = revealedCount;

    state.current.answers.forEach((answer, idx) => {
      const isRevealed = state.revealedAnswers && state.revealedAnswers.includes(idx);
      const card = document.createElement('div');
      card.className = `answer-card ${isRevealed ? 'revealed' : 'hidden'}`;
      card.innerHTML = `
        <div class="answer-text">${isRevealed ? answer.text : '?'}</div>
        <div class="answer-points">${isRevealed ? answer.points : ''}</div>
      `;
      answersGrid.appendChild(card);
    });
  } else {
    questionText.textContent = '(Menunggu pertanyaan...)';
    answersGrid.innerHTML = '';
    totalEl.textContent = '0';
    revealedEl.textContent = '0';
  }
}

async function pollUpdates() {
  const state = await getGameStateWithFallback();
  
  if (state && JSON.stringify(state) !== JSON.stringify(lastState)) {
    renderState(state);
    lastState = state;
  }
}

// (Event listeners and initialization moved to initializeViewer function)
