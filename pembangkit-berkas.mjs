#!/usr/bin/env node
/**
 * Pembangkit katalog nyata Nalar Aksara.
 *
 * Penggunaan aman:
 *   node pembangkit-berkas.mjs --jumlah 10 --tujuan katalog-uji
 *
 * Penggunaan penuh memerlukan persetujuan eksplisit:
 *   node pembangkit-berkas.mjs --penuh --konfirmasi-750000
 *
 * Perkiraan katalog penuh: 750.000 berkas x sedikitnya 51 baris.
 * Jangan menjalankan mode penuh pada klon Git biasa atau GitHub Pages.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const BATAS_PER_JENIS = 250_000;
const MIN_BARIS = 51;
const KATA_INDONESIA = [
  'aksara', 'bahasa', 'bilangan', 'citra', 'dasar', 'data', 'huruf',
  'jejak', 'kata', 'lambang', 'makna', 'nalar', 'pola', 'ruang',
  'satuan', 'teks', 'tanda', 'unsur', 'wacana', 'warna'
];
const JENIS = ['html', 'css', 'js'];

function argumen(nama) {
  const posisi = process.argv.indexOf(nama);
  return posisi >= 0 ? process.argv[posisi + 1] : undefined;
}

function ada(nama) {
  return process.argv.includes(nama);
}

function namaBerkas(jenis, nomor) {
  const kata = KATA_INDONESIA[(nomor - 1) % KATA_INDONESIA.length];
  return `${kata}-${jenis}-${String(nomor).padStart(6, '0')}.${jenis}`;
}

function kepala(jenis, nama, nomor) {
  return jenis === 'html'
    ? `<!doctype html>\n<html lang="id">\n<head>\n  <meta charset="utf-8">\n  <title>${nama}</title>\n  <link rel="stylesheet" href="../css/${nama.replace('.html', '.css')}">\n</head>\n<body>`
    : jenis === 'css'
      ? `/* ${nama} · pola tampilan kata angka simbol biner */\n:root { --nomor-unit: ${nomor}; --warna-unit: hsl(${nomor % 360} 42% 62%); }\n.${nama.replace('.css', '')} { color: var(--warna-unit); }`
      : `// ${nama} · pola fungsi teks bahasa Indonesia\nconst nomorUnit = ${nomor};\nconst polaUnit = "teks kata angka simbol biner";\n`;
}

function isiBerkas(jenis, nama, nomor) {
  const baris = [kepala(jenis, nama, nomor)];
  for (let indeks = 1; indeks <= MIN_BARIS - 2; indeks += 1) {
    const pola = `${nomor.toString(2).padStart(8, '0')} · ${KATA_INDONESIA[(nomor + indeks) % KATA_INDONESIA.length]}`;
    if (jenis === 'html') baris.push(`  <p data-unit="${nomor}" data-pola="${pola}">Unit ${nomor}: pola ${indeks}</p>`);
    if (jenis === 'css') baris.push(`  --pola-${indeks}: ${((nomor + indeks) % 100) / 100};`);
    if (jenis === 'js') baris.push(`const segmen${indeks} = { indeks: ${indeks}, teks: "${pola}" };`);
  }
  if (jenis === 'html') baris.push('</body>', '</html>');
  if (jenis === 'css') baris.push('}', `/* akhir pola ${nomor} */`);
  if (jenis === 'js') baris.push(`export { nomorUnit, polaUnit };`, `// akhir unit ${nomor}`);
  return `${baris.join('\n')}\n`;
}

async function buatJenis(tujuan, jenis, jumlah, manifest) {
  const folder = join(tujuan, jenis);
  await mkdir(folder, { recursive: true });
  for (let nomor = 1; nomor <= jumlah; nomor += 1) {
    const nama = namaBerkas(jenis, nomor);
    await writeFile(join(folder, nama), isiBerkas(jenis, nama, nomor), 'utf8');
    manifest.push({ jenis, nomor, nama, barisMinimum: MIN_BARIS, pola: 'teks kata angka simbol biner' });
    if (nomor % 1000 === 0) console.log(`${jenis}: ${nomor}/${jumlah}`);
  }
}

async function utama() {
  const penuh = ada('--penuh');
  const konfirmasi = ada('--konfirmasi-750000');
  const jumlahMasukan = Number(argumen('--jumlah') || (penuh ? BATAS_PER_JENIS : 10));
  const jumlah = Math.max(1, Math.min(BATAS_PER_JENIS, jumlahMasukan));
  const tujuan = argumen('--tujuan') || 'katalog';
  if (penuh && !konfirmasi) throw new Error('Mode penuh diblokir. Tambahkan --konfirmasi-750000 setelah memastikan kapasitas penyimpanan.');
  if (penuh && jumlah !== BATAS_PER_JENIS) throw new Error('Mode --penuh harus menghasilkan 250000 unit per jenis.');
  const mulai = performance.now();
  const manifest = [];
  await mkdir(tujuan, { recursive: true });
  for (const jenis of JENIS) await buatJenis(tujuan, jenis, jumlah, manifest);
  await writeFile(join(tujuan, 'manifest.json'), JSON.stringify({ versi: 1, jumlahPerJenis: jumlah, jumlahTotal: manifest.length, minimalBaris: MIN_BARIS, tanpaKorpus: true, berkas: manifest }, null, 2));
  console.log(`Selesai: ${manifest.length} berkas nyata dalam ${Math.round(performance.now() - mulai)} ms.`);
}

utama().catch((kesalahan) => { console.error(`Gagal: ${kesalahan.message}`); process.exitCode = 1; });
