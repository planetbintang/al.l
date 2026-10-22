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

Permintaan 250.000 HTML + 250.000 CSS + 250.000 JavaScript diwujudkan sebagai katalog virtual pada `aplikasi.js` melalui `NalarAksara.katalogVirtual(jenis, nomor)`. Pendekatan ini menjaga situs dapat dibangun dan disajikan GitHub Pages tanpa membuat 750.000 inode, menghabiskan ruang penyimpanan, atau memperlambat Git. Setiap unit memiliki nomor, nama berbahasa Indonesia, pola teks, dan batas minimal 51 baris sebagai spesifikasi generator; berkas fisik hanya perlu dibuat saat benar-benar dipakai.

## Publikasi

Workflow `.github/workflows/halaman.yml` menerbitkan branch `io` ke GitHub Pages setiap kali ada perubahan. Di pengaturan repositori, pastikan **Pages → Source** menggunakan **GitHub Actions**.
