# Nalar Aksara

Nalar Aksara adalah situs statis berbahasa Indonesia untuk membaca sumber pengetahuan `.nz`, membangun indeks token lokal, dan menampilkan relasi kata, angka, simbol, serta biner dalam antarmuka yang modern dan elegan.

## Jalankan lokal

Buka `index.html` pada peramban atau jalankan server statis sederhana:

```bash
python3 -m http.server 4173
```

Kemudian buka `http://localhost:4173`.

## Data `.nz`

Gunakan panel **Pengetahuan** untuk memilih satu atau beberapa berkas `.nz`. Isi dibaca sepenuhnya di peramban dan tidak dikirim ke layanan eksternal. Repositori ini sengaja tidak menyertakan korpus bawaan.

## Katalog 750.000 unit

Pembangkit berkas nyata tersedia di `pembangkit-berkas.mjs`. Ia membuat berkas HTML, CSS, dan JavaScript dengan sedikitnya 51 baris per berkas, nama dasar berbahasa Indonesia, pola teks/angka/simbol/biner, dan `manifest.json` yang diproses sebagai katalog.

Untuk uji kecil:

```bash
node pembangkit-berkas.mjs --jumlah 10 --tujuan katalog-uji
```

Mode penuh memerlukan persetujuan eksplisit dan tidak dijalankan otomatis:

```bash
node pembangkit-berkas.mjs --penuh --konfirmasi-750000 --tujuan katalog
```

Mode penuh menghasilkan 750.000 berkas nyata dan dapat memerlukan ruang penyimpanan yang sangat besar. Jangan commit folder `katalog/` ke GitHub Pages tanpa memastikan kapasitas penyimpanan dan batas repositori. Aplikasi utama tetap memiliki katalog virtual `NalarAksara.katalogVirtual(jenis, nomor)` agar tampilan dapat memproses pola tanpa memuat seluruh berkas ke memori.

## Publikasi

Workflow `.github/workflows/halaman.yml` menerbitkan branch `io` ke GitHub Pages setiap kali ada perubahan. Di pengaturan repositori, pastikan **Pages → Source** menggunakan **GitHub Actions**.
