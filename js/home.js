// Home page controller - handle room creation and viewer join

// Get base URL dynamically (works for both localhost and production)
function getBaseUrl() {
  return window.location.origin;
}

function generateRoomCode() {
  // Generate unique code: random part + timestamp part
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).substring(7).toUpperCase();
  return (random + timestamp).substring(0, 6);
}

function goToCreateRoom() {
  // Generate new unique room code every time
  const roomCode = generateRoomCode();
  console.log('Creating new room with code:', roomCode);
  localStorage.setItem('familyfeud_roomcode', roomCode);
  localStorage.setItem('familyfeud_role', 'host');
  // Clear old game states
  localStorage.removeItem(`familyfeud_gamestate_${roomCode}`);
  window.location.href = getBaseUrl() + '/host';
}

function goToExistingRoom() {
  const roomCode = prompt('Masukkan kode room host:');
  if (!roomCode) return;
  
  localStorage.setItem('familyfeud_roomcode', roomCode.toUpperCase());
  localStorage.setItem('familyfeud_role', 'host');
  window.location.href = getBaseUrl() + '/host';
}

function joinRoom() {
  const roomCode = document.getElementById('roomCodeInput').value.toUpperCase().trim();
  
  if (!roomCode || roomCode.length === 0) {
    alert('Masukkan kode room terlebih dahulu!');
    return;
  }

  console.log('Joining room:', roomCode);
  localStorage.setItem('familyfeud_roomcode', roomCode);
  localStorage.setItem('familyfeud_role', 'viewer');
  console.log('Stored in localStorage:', {
    roomCode: localStorage.getItem('familyfeud_roomcode'),
    role: localStorage.getItem('familyfeud_role')
  });
  window.location.href = getBaseUrl() + '/viewer';
}

// Allow Enter key on room code input
document.getElementById('roomCodeInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    joinRoom();
  }
});
