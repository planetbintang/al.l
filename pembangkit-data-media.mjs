#!/usr/bin/env node
/**
 * Membuat data.media sebagai JSONL shard.
 *
 * Setiap berkas berisi tepat 950 record domain. Default aman hanya membuat
 * 1 shard contoh. Untuk katalog penuh jalankan di storage terpisah:
 * node pembangkit-data-media.mjs --jumlah 500000 --penuh --konfirmasi-500000
 */
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const TARGET_FILES = 500_000;
const PER_FILE = 950;
const ROOT = resolve(process.cwd(), 'data.media');
const SEED_FILE = join(ROOT, 'domain-seeds.txt');

const arg = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const has = (name) => process.argv.includes(name);
const pad = (value) => String(value).padStart(6, '0');

function domainUntuk(seed, file, row) {
  // Seed asli diputar agar setiap record stabil dan dapat dicari tanpa DB.
  if (row < 120) return seed[(row + file - 1) % seed.length];
  const basis = seed[(row * 17 + file) % seed.length].split('.')[0];
  const tld = ['com', 'org', 'net', 'co', 'io', 'id', 'uk', 'de', 'fr', 'jp'][file % 10];
  return `${basis}-${file}-${row}.${tld}`;
}

function record(domain, file, row) {
  const aktif = ((file * 31 + row * 17) % 11) > 2;
  return JSON.stringify({
    domain,
    status: aktif ? 'aktif' : 'tidak aktif',
    sumber: 'seed-katalog-media',
    shard: file,
    urutan: row
  });
}

async function loadSeeds() {
  const isi = await readFile(SEED_FILE, 'utf8');
  return isi.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

async function buatShard(folder, seeds, file) {
  const tujuan = join(folder, `domain-${pad(file)}.media`);
  const baris = [];
  for (let row = 1; row <= PER_FILE; row += 1) {
    baris.push(record(domainUntuk(seeds, file, row - 1), file, row));
  }
  await writeFile(tujuan, `${baris.join('\n')}\n`, 'utf8');
  return tujuan;
}

async function utama() {
  const penuh = has('--penuh');
  const konfirmasi = has('--konfirmasi-500000');
  const jumlah = Math.max(1, Math.min(TARGET_FILES, Number(arg('--jumlah', 1))));
  const mulai = performance.now();
  if (penuh && !konfirmasi) throw new Error('Mode penuh diblokir. Tambahkan --konfirmasi-500000 setelah memastikan kapasitas storage.');
  if (penuh && jumlah !== TARGET_FILES) throw new Error('Mode --penuh harus menghasilkan 500000 berkas.');
  const seeds = await loadSeeds();
  const folder = resolve(arg('--tujuan', ROOT));
  await mkdir(folder, { recursive: true });
  const mulaiDari = Math.max(1, Number(arg('--mulai', 1)));
  const akhir = Math.min(jumlah, Number(arg('--sampai', jumlah)));
  for (let file = mulaiDari; file <= akhir; file += 1) {
    await buatShard(folder, seeds, file);
    if (file === mulaiDari || file % 100 === 0 || file === akhir) console.log(`data.media: ${file}/${jumlah}`);
  }
  const metadata = {
    versi: 1, format: 'media-jsonl', jumlahBerkasTarget: TARGET_FILES,
    berkasDibuatDalamPerintahIni: Math.max(0, akhir - mulaiDari + 1),
    entriPerBerkas: PER_FILE, status: ['aktif', 'tidak aktif'],
    polaNama: 'domain-XXXXXX.media', diperbarui: new Date().toISOString()
  };
  await writeFile(join(folder, 'manifest-generated.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(`Selesai dalam ${Math.round(performance.now() - mulai)} ms.`);
}

utama().catch((error) => { console.error(`Gagal: ${error.message}`); process.exitCode = 1; });
