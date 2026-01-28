// Home page controller - handle room creation and viewer join

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function goToCreateRoom() {
  const roomCode = generateRoomCode();
  localStorage.setItem('familyfeud_roomcode', roomCode);
  localStorage.setItem('familyfeud_role', 'host');
  localStorage.removeItem('familyfeud_gamestate');
  window.location.href = 'http://localhost:8000/host';
}

function goToExistingRoom() {
  const roomCode = prompt('Masukkan kode room host:');
  if (!roomCode) return;
  
  localStorage.setItem('familyfeud_roomcode', roomCode.toUpperCase());
  localStorage.setItem('familyfeud_role', 'host');
  window.location.href = 'http://localhost:8000/host';
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
  window.location.href = 'http://localhost:8000/viewer';
}

// Allow Enter key on room code input
document.getElementById('roomCodeInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    joinRoom();
  }
});
