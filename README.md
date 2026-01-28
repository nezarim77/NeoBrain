# Family Feud - Lokal

Demo game Family Feud sederhana untuk dipakai secara lokal oleh host dan viewers dengan sistem room code.

## Cara Menjalankan

1. **Setup server HTTP:**

```bash
python -m http.server 8000
```

2. **Buka halaman menu:**
   - http://localhost:8000/home.html

## Alur Permainan

### Host:
1. Klik **"Buat Room Baru"** di halaman menu
2. Akan mendapat room code unik (misal: ABC123)
3. **Bagikan room code ke viewers**
4. Pilih pertanyaan, bongkar jawaban, kelola skor
5. Viewers akan melihat update secara real-time

### Viewers:
1. Buka http://localhost:8000/home.html
2. Klik **"Mode Viewer"**
3. Masukkan room code dari host
4. Klik **"Join Room"**
5. Lihat pertanyaan dan jawaban secara real-time

## Fitur Host:
- Buat room dengan kode unik otomatis
- Pilih pertanyaan dari database
- Bongkar jawaban satu per satu
- Berikan poin ke team A atau B
- Reset skor dan mulai round baru
- Copy room code dengan satu klik

## Fitur Viewer:
- Join room dengan kode 6 karakter
- Lihat pertanyaan real-time
- Tonton jawaban dibongkar
- Lihat skor kedua tim
- Auto-update setiap 2 detik
- Status koneksi ke host

## Data Pertanyaan

Edit file `data/questions.json` untuk menambah/mengubah pertanyaan:

```json
[
  {
    "question": "Pertanyaan...",
    "answers": [
      {"text": "Jawaban 1", "points": 35},
      {"text": "Jawaban 2", "points": 25}
    ]
  }
]
```

## File Struktur

```
NeoBrain/
├── home.html          # Landing page menu
├── index.html         # Host control page
├── viewer.html        # Viewer display page
├── js/
│   ├── home.js        # Menu logic & room creation
│   ├── app.js         # Host game logic
│   └── viewer.js      # Viewer sync logic
├── css/
│   ├── home.css       # Menu styling
│   ├── styles.css     # Host styling
│   └── viewer.css     # Viewer styling
└── data/
    └── questions.json # Question database
```