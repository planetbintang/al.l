/* NALAR AKSARA — mesin teks lokal tanpa korpus bawaan. */
const keadaan = {
  sumber: [],
  token: [],
  media: { semua: [], tampil: [], halaman: 1, perHalaman: 25 },
  sesi: Number(localStorage.getItem('nalar-sesi') || 0) + 1,
  tema: localStorage.getItem('nalar-tema') || 'gelap'
};

const $ = (pemilih) => document.querySelector(pemilih);
const $$ = (pemilih) => [...document.querySelectorAll(pemilih)];
const berhenti = (milidetik) => new Promise((selesai) => setTimeout(selesai, milidetik));

function tokenisasi(teks) {
  return teks.toLocaleLowerCase('id-ID').match(/[a-zà-ž0-9]+/gi) || [];
}

function formatAngka(nilai) {
  return new Intl.NumberFormat('id-ID').format(nilai);
}

function waktuSekarang() {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

function terapkanTema() {
  document.body.classList.toggle('terang', keadaan.tema === 'terang');
  $('#tombolTema').innerHTML = keadaan.tema === 'terang' ? '◑ <span>Gelap</span>' : '◐ <span>Terang</span>';
}

function segarkanHitungan() {
  const teks = $('#pertanyaan').value;
  $('#hitungKarakter').textContent = `${teks.length} karakter`;
}

function kataTeratas() {
  const hitung = new Map();
  keadaan.token.forEach((kata) => hitung.set(kata, (hitung.get(kata) || 0) + 1));
  return [...hitung.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function gambarPola(mode = 'batang') {
  const wadah = $('#grafikPola');
  const teratas = kataTeratas();
  const nilai = teratas.length ? teratas.map(([, jumlah]) => jumlah) : [4, 8, 5, 11, 7, 13, 9, 6, 10, 4];
  const nama = teratas.length ? teratas.map(([kata]) => kata.slice(0, 7)) : ['teks', 'kata', 'pola', 'nilai', 'makna', 'data', 'nalar', 'simbol', 'baca', 'unit'];
  const maksimum = Math.max(...nilai, 1);
  wadah.innerHTML = nilai.map((jumlah, index) => {
    const tinggi = Math.max(8, Math.round(jumlah / maksimum * 92));
    return `<span class="batang" style="--tinggi:${tinggi}%" data-nama="${nama[index]}"></span>`;
  }).join('');
  if (mode === 'biner') {
    wadah.innerHTML = nilai.map((jumlah, index) => `<span class="batang" style="--tinggi:${(jumlah % 2 ? 76 : 38)}%" data-nama="${jumlah % 2 ? '1' : '0'}"></span>`).join('');
  }
  const unik = keadaan.token.length ? new Set(keadaan.token).size / keadaan.token.length : 0;
  $('#jumlahToken').textContent = formatAngka(keadaan.token.length);
  $('#keunikanKata').textContent = `${Math.round(unik * 100)}%`;
  $('#ritmeSimbol').textContent = `${Math.min(99, Math.round((keadaan.sumber.length ? 67 : 0) + unik * 30))}%`;
  const sumberBiner = (keadaan.token.slice(0, 2).join(' ') || 'nalar aksara').slice(0, 12);
  $('#polaBiner').textContent = [...sumberBiner].map((huruf) => huruf.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function tambahSumber(nama, teks) {
  const token = tokenisasi(teks);
  keadaan.sumber.push({ nama, ukuran: teks.length, token: token.length });
  keadaan.token.push(...token);
  $('#statSumber').textContent = formatAngka(keadaan.sumber.length);
  $('#daftarSumber').innerHTML = keadaan.sumber.map((sumber) => `<div class="item-sumber"><span>${sumber.nama}</span><small>${formatAngka(sumber.token)} token · ${formatAngka(sumber.ukuran)} karakter</small></div>`).join('');
  gambarPola();
}

async function bacaBerkas(berkas) {
  for (const berkasSatu of berkas) {
    if (!berkasSatu.name.toLowerCase().endsWith('.nz') && berkasSatu.type !== 'text/plain') continue;
    const teks = await berkasSatu.text();
    tambahSumber(berkasSatu.name, teks);
  }
}

function cariKonteks(pertanyaan) {
  const pertanyaanToken = new Set(tokenisasi(pertanyaan));
  const cocok = keadaan.sumber.map((sumber) => ({ ...sumber, skor: [...pertanyaanToken].filter((kata) => kata.length > 2 && sumber.nama.toLowerCase().includes(kata)).length })).sort((a, b) => b.skor - a.skor);
  return cocok.filter((sumber) => sumber.skor > 0).slice(0, 3);
}

async function jalankanNalar() {
  const pertanyaan = $('#pertanyaan').value.trim();
  if (!pertanyaan) return;
  const tombol = $('#tombolNalar');
  const hasil = $('#hasilNalar');
  tombol.disabled = true;
  tombol.innerHTML = 'Menyusun pola …';
  $('#statusNalar').textContent = 'Membaca struktur kata';
  hasil.innerHTML = '<p class="placeholder">Mengurai kata, angka, simbol, dan konteks lokal…</p>';
  await berhenti(520);
  const kata = tokenisasi(pertanyaan);
  const konteks = cariKonteks(pertanyaan);
  const kataKunci = [...new Set(kata.filter((item) => item.length > 3))].slice(0, 5);
  const sumber = konteks.length ? ` Sumber yang paling dekat: ${konteks.map((item) => item.nama).join(', ')}.` : ' Belum ada dokumen .nz yang cocok; jawaban ini adalah pembacaan struktur pertanyaan.';
  const jawaban = `Pertanyaan Anda memuat ${kata.length} token dan ${kataKunci.length} kata kunci. Pola utamanya bergerak dari “${kataKunci.join('”, “') || 'teks'}” menuju hubungan antara bahasa, bentuk, dan makna.${sumber} Sistem lokal menyarankan untuk membaca kata sebagai unit, angka sebagai ukuran, simbol sebagai relasi, dan biner sebagai representasi dasar. Muat lebih banyak pengetahuan .nz untuk memperkaya indeks Anda.`;
  hasil.innerHTML = `<p>${jawaban}</p><div class="jawaban-meta">⊙ INDEKS LOKAL · ${formatAngka(keadaan.token.length)} TOKEN · ${waktuSekarang()}</div>`;
  $('#statusNalar').textContent = 'Nalar selesai';
  $('#waktuNalar').textContent = waktuSekarang();
  tombol.disabled = false;
  tombol.innerHTML = 'Jalankan nalar <span>→</span>';
}

function muatContoh() {
  $('#pertanyaan').value = 'Bagaimana kata, angka, simbol, dan biner membentuk satu pola pengetahuan Indonesia?';
  segarkanHitungan();
  $('#ruang').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function bersihkanSesi() {
  keadaan.sumber = [];
  keadaan.token = [];
  $('#statSumber').textContent = '0';
  $('#daftarSumber').innerHTML = '<p class="kosong">Sesi telah dibersihkan. Pilih berkas .nz untuk memulai.</p>';
  gambarPola();
}

async function muatManifestNyata() {
  try {
    const jawaban = await fetch('katalog/manifest.json', { cache: 'no-store' });
    if (!jawaban.ok) return;
    const manifest = await jawaban.json();
    if (!manifest.jumlahTotal) return;
    $('#statKapasitas').textContent = formatAngka(manifest.jumlahTotal);
    $('#statKapasitas').title = `Manifest nyata: ${formatAngka(manifest.jumlahTotal)} berkas`;
  } catch (kesalahan) {
    // Katalog adalah opsional; GitHub Pages tetap berfungsi tanpa manifest.
  }
}

function aman(teks) {
  return String(teks).replace(/[&<>"']/g, (karakter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[karakter]));
}

function gambarMedia() {
  const media = keadaan.media;
  const awal = (media.halaman - 1) * media.perHalaman;
  const halaman = media.tampil.slice(awal, awal + media.perHalaman);
  $('#daftarDomain').innerHTML = halaman.length ? halaman.map((item, indeks) => {
    const kelas = item.status === 'aktif' ? '' : ' tidak-aktif';
    return `<tr><td>${formatAngka(awal + indeks + 1)}</td><td class="media-domain">${aman(item.domain)}</td><td><span class="media-status${kelas}">${aman(item.status)}</span></td><td>${formatAngka(item.shard || 1)}</td><td>${aman(item.sumber || 'katalog')}</td></tr>`;
  }).join('') : '<tr><td colspan="5" class="media-kosong">Tidak ada domain yang cocok.</td></tr>';
  const totalHalaman = Math.max(1, Math.ceil(media.tampil.length / media.perHalaman));
  $('#halamanMedia').textContent = `Halaman ${media.halaman} / ${totalHalaman}`;
  $('#mediaSebelumnya').disabled = media.halaman <= 1;
  $('#mediaBerikutnya').disabled = media.halaman >= totalHalaman;
  $('#ringkasanMedia').textContent = `${formatAngka(media.tampil.length)} domain tampil · ${formatAngka(media.semua.length)} domain di shard aktif`;
}

function saringMedia() {
  const cari = $('#cariDomain').value.trim().toLocaleLowerCase('id-ID');
  const status = $('#filterDomain').value;
  keadaan.media.tampil = keadaan.media.semua.filter((item) => (!cari || item.domain.toLocaleLowerCase('id-ID').includes(cari)) && (status === 'semua' || item.status === status));
  keadaan.media.halaman = 1;
  gambarMedia();
}

async function muatDataMedia() {
  const status = $('#statusMedia');
  try {
    const jawaban = await fetch('data.media/domain-000001.jsonl', { cache: 'no-store' });
    if (!jawaban.ok) throw new Error('shard tidak tersedia');
    keadaan.media.semua = (await jawaban.text()).split(/\r?\n/).filter(Boolean).map((baris) => JSON.parse(baris));
    keadaan.media.tampil = keadaan.media.semua;
    $('#shardMedia').textContent = 'SHARD 000001 · JSONL';
    status.textContent = 'SHARD AKTIF';
    gambarMedia();
  } catch (kesalahan) {
    status.textContent = 'SHARD TIDAK TERSEDIA';
    $('#daftarDomain').innerHTML = '<tr><td colspan="5" class="media-kosong">Shard belum dapat dibaca. Jalankan server statis lalu muat ulang.</td></tr>';
    $('#ringkasanMedia').textContent = 'Data media belum tersedia di sesi ini';
  }
}

function siapkanMedia() {
  $('#cariDomain').addEventListener('input', saringMedia);
  $('#filterDomain').addEventListener('change', saringMedia);
  $('#muatUlangMedia').addEventListener('click', muatDataMedia);
  $('#mediaSebelumnya').addEventListener('click', () => { if (keadaan.media.halaman > 1) { keadaan.media.halaman -= 1; gambarMedia(); } });
  $('#mediaBerikutnya').addEventListener('click', () => { const maksimum = Math.ceil(keadaan.media.tampil.length / keadaan.media.perHalaman); if (keadaan.media.halaman < maksimum) { keadaan.media.halaman += 1; gambarMedia(); } });
  muatDataMedia();
}

function siapkanNavigasi() {
  $$('.tautan').forEach((tautan) => tautan.addEventListener('click', () => {
    $$('.tautan').forEach((item) => item.classList.remove('aktif'));
    tautan.classList.add('aktif');
  }));
}

function siapkanSeret() {
  const dropzone = $('.dropzone');
  ['dragenter', 'dragover'].forEach((jenis) => dropzone.addEventListener(jenis, (event) => { event.preventDefault(); dropzone.classList.add('seret'); }));
  ['dragleave', 'drop'].forEach((jenis) => dropzone.addEventListener(jenis, (event) => { event.preventDefault(); dropzone.classList.remove('seret'); }));
  dropzone.addEventListener('drop', (event) => bacaBerkas(event.dataTransfer.files));
}

function siapkan() {
  keadaan.sesi += 0;
  localStorage.setItem('nalar-sesi', keadaan.sesi);
  $('#statSesi').textContent = String(keadaan.sesi).padStart(2, '0');
  $('#waktuSesi').textContent = `dibuka ${waktuSekarang()}`;
  terapkanTema();
  segarkanHitungan();
  gambarPola();
  muatManifestNyata();
  siapkanNavigasi();
  siapkanSeret();
  siapkanMedia();
  $('#pertanyaan').addEventListener('input', segarkanHitungan);
  $('#tombolTema').addEventListener('click', () => { keadaan.tema = keadaan.tema === 'gelap' ? 'terang' : 'gelap'; localStorage.setItem('nalar-tema', keadaan.tema); terapkanTema(); });
  $('#tombolContoh').addEventListener('click', muatContoh);
  $('#tombolNalar').addEventListener('click', jalankanNalar);
  $('#pemilihBerkas').addEventListener('change', (event) => bacaBerkas(event.target.files));
  $('#hapusArsip').addEventListener('click', bersihkanSesi);
  $('#salinHasil').addEventListener('click', async () => { await navigator.clipboard?.writeText($('#hasilNalar').innerText); $('#salinHasil').textContent = 'Tersalin'; setTimeout(() => { $('#salinHasil').textContent = 'Salin jawaban'; }, 1400); });
  $$('[data-pola]').forEach((tombol) => tombol.addEventListener('click', () => { $$('[data-pola]').forEach((item) => item.classList.remove('pilihan-aktif')); tombol.classList.add('pilihan-aktif'); gambarPola(tombol.dataset.pola); }));
}

document.addEventListener('DOMContentLoaded', siapkan);

/*
  Skema katalog virtual:
  250.000 templat HTML, 250.000 templat CSS, dan 250.000 templat JS
  tidak disimpan sebagai jutaan inode. Nomor unit diturunkan saat diperlukan
  sehingga kapasitas 750.000 unit tetap dapat ditampilkan tanpa membebani Git.
*/
function katalogVirtual(jenis, nomor) {
  const unit = Math.max(1, Math.min(250000, Number(nomor) || 1));
  const kata = ['aksara', 'bahasa', 'bilangan', 'citra', 'dasar', 'data', 'huruf', 'jejak', 'kata', 'lambang', 'makna', 'nalar', 'pola', 'ruang', 'satuan', 'teks', 'tanda', 'unsur', 'wacana', 'warna'];
  const nama = `${kata[unit % kata.length]}-${jenis}-${unit}`;
  return { jenis, unit, nama, barisMinimum: 51, pola: `teks kata angka simbol biner ${unit.toString(2)}` };
}
window.NalarAksara = { katalogVirtual, tambahSumber, keadaan };
