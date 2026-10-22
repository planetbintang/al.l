# data.media — Katalog Domain Dunia

Folder ini memakai format **.media (JSONL)**. Setiap shard `domain-XXXXXX.media` berisi **950 record**, satu record per baris. Katalog bulk lokal sudah dibuat di `data.media/bulk/` dengan **500.000 file fisik** (`domain-000001.media` sampai `domain-500000.media`). Setiap file berisi 950 nama domain, satu nama per baris.

`bulk-manifest.json` mencatat spesifikasi katalog bulk. Folder `bulk/` sengaja masuk `.gitignore` karena 500.000 inode tidak cocok diunggah ke GitHub; file fisiknya tetap berada pada storage sandbox ini.

Contoh satu baris:

```text
google.com
```

## Membuat ulang katalog bulk

```bash
node pembangkit-data-media.mjs --jumlah 500000 --penuh --konfirmasi-500000 --tujuan /path/storage/data.media
```

Generator memakai format `.media`, membuat 950 nama domain per file, dan dapat dilanjutkan dengan rentang `--mulai` serta `--sampai`.
