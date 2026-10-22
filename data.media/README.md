# data.media — Katalog Domain Dunia

Folder ini memakai format **.media (JSONL)**. Setiap shard `domain-XXXXXX.media` berisi **950 record**, satu record per baris:

```json
{"domain":"google.com","status":"aktif","sumber":"seed-katalog-media","shard":1,"urutan":1}
```

`manifest.json` mendeskripsikan target 500.000 berkas dan 475.000.000 entri. Repositori menyimpan satu shard contoh agar GitHub Pages tetap ringan. Katalog penuh tidak di-commit ke Git karena 500.000 inode dan 475 juta entri akan membebani Git, proses deploy, dan browser.

## Membuat katalog penuh

Jalankan pada disk atau object storage khusus, bukan pada klon repositori publik:

```bash
node pembangkit-data-media.mjs --jumlah 500000 --penuh --konfirmasi-500000 --tujuan /path/storage/data.media
```

Untuk melanjutkan pekerjaan yang terputus, gunakan rentang:

```bash
node pembangkit-data-media.mjs --jumlah 500000 --mulai 120001 --sampai 130000 --tujuan /path/storage/data.media
```

Status `aktif`/`tidak aktif` pada generator adalah status katalog deterministik berbasis seed, bukan hasil pemeriksaan jaringan real-time. Lakukan health-check terpisah sebelum menyebut status sebagai status live.
