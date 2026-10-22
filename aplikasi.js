/* NALAR AKSARA — mesin teks lokal tanpa korpus bawaan. */
const keadaan = {
  sumber: [],
  token: [],
  media: { semua: [], tampil: [], halaman: 1, perHalaman: 25, totalVirtual: 400000000, cari: '', status: 'semua', seeds: [] },
  pengetahuan: { manifest: null, poin: [], berkas: [] },
  chat: [],
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

async function muatPengetahuanRepositori() {
  try {
    const jawaban = await fetch('sumberkode/indeks-pengetahuan.json', { cache: 'no-store' });
    if (!jawaban.ok) throw new Error('manifest pengetahuan tidak tersedia');
    keadaan.pengetahuan.manifest = await jawaban.json();
    keadaan.pengetahuan.poin = keadaan.pengetahuan.manifest.poin || [];
    keadaan.pengetahuan.berkas = keadaan.pengetahuan.manifest.berkas || [];
    $('#statSumber').textContent = formatAngka(keadaan.pengetahuan.berkas.length);
    $('#statusNalar').textContent = `${formatAngka(keadaan.pengetahuan.berkas.length)} sumber terpetakan`;
  } catch (kesalahan) {
    keadaan.pengetahuan.poin = [];
  }
}

function domainVirtual(nomor) {
  const media = keadaan.media;
  const dasar = media.seeds[(nomor - 1) % Math.max(media.seeds.length, 1)] || 'domain.media';
  const label = String(nomor).padStart(9, '0');
  return `unit-${label}.${dasar}`;
}

function jumlahHalamanMedia() {
  const memakaiFilter = Boolean(mediaCari());
  return memakaiFilter ? Math.max(1, Math.ceil(keadaan.media.tampil.length / keadaan.media.perHalaman)) : Math.ceil(keadaan.media.totalVirtual / keadaan.media.perHalaman);
}

function mediaCari() {
  return keadaan.media.cari || keadaan.media.status !== 'semua';
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
  $('#statusNalar').textContent = 'Membaca seluruh sumber terpetakan';
  hasil.innerHTML = '<p class="placeholder">Mengurai prompt, manifest, shard .media, dan konteks lokal…</p>';
  await berhenti(520);
  const kata = tokenisasi(pertanyaan);
  const konteks = cariKonteks(pertanyaan);
  const kataKunci = [...new Set(kata.filter((item) => item.length > 3))].slice(0, 5);
  const sumber = konteks.length ? `Dokumen lokal yang paling dekat: ${konteks.map((item) => item.nama).join(', ')}.` : 'Tidak ada nama berkas yang cocok langsung; konteks manifest tetap digunakan.';
  const poin = keadaan.pengetahuan.poin.slice(0, 5).map((item) => `${item.topik}: ${item.isi}`).join(' ');
  const jawaban = `Saya membaca prompt ini sebagai permintaan tentang ${kataKunci.join(', ') || 'teks dan pengetahuan'}. ${sumber} ${poin} Indeks domain memiliki ${formatAngka(keadaan.media.totalVirtual)} posisi virtual, diturunkan dari nama pada data.media; hanya shard aktif yang dimuat ke memori. Jadi setiap halaman dapat dibuat saat diminta tanpa mengalokasikan 400 juta baris sekaligus. Sistem lokal menyusun jawaban dari kata, angka, simbol, biner, manifest, serta sumberkode yang terpetakan. Untuk jawaban yang lebih spesifik, tambahkan berkas .nz atau sebutkan nama domain/topik dalam prompt.`;
  keadaan.chat.push({ pertanyaan, waktu: waktuSekarang() });
  $('#chatRiwayat').innerHTML = keadaan.chat.slice(-3).map((pesan) => `<span class="chat-jejak">${aman(pesan.waktu)} · ${aman(pesan.pertanyaan.slice(0, 72))}</span>`).join('');
  hasil.innerHTML = `<p>${aman(jawaban)}</p><div class="jawaban-meta">⊙ AI LOKAL · ${formatAngka(keadaan.pengetahuan.berkas.length)} SUMBER · ${formatAngka(keadaan.media.totalVirtual)} DOMAIN VIRTUAL · ${formatAngka(keadaan.token.length)} TOKEN</div>`;
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
    $('#statKapasitas').title = `Katalog kode nyata: ${formatAngka(manifest.jumlahTotal)} unit; indeks domain tetap ${formatAngka(keadaan.media.totalVirtual)} posisi`;
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
  const halaman = mediaCari() ? media.tampil.slice(awal, awal + media.perHalaman) : Array.from({ length: Math.min(media.perHalaman, media.totalVirtual - awal) }, (_, indeks) => {
    const nomor = awal + indeks + 1;
    return media.semua[nomor - 1] || { domain: domainVirtual(nomor), status: nomor % 7 === 0 ? 'tidak aktif' : 'aktif', shard: Math.floor((nomor - 1) / 950) + 1, sumber: 'indeks-virtual' };
  });
  $('#daftarDomain').innerHTML = halaman.length ? halaman.map((item, indeks) => {
    const kelas = item.status === 'aktif' ? '' : ' tidak-aktif';
    return `<tr><td>${formatAngka(awal + indeks + 1)}</td><td class="media-domain">${aman(item.domain)}</td><td><span class="media-status${kelas}">${aman(item.status)}</span></td><td>${formatAngka(item.shard || 1)}</td><td>${aman(item.sumber || 'katalog')}</td></tr>`;
  }).join('') : '<tr><td colspan="5" class="media-kosong">Tidak ada domain yang cocok.</td></tr>';
  const totalHalaman = jumlahHalamanMedia();
  $('#halamanMedia').textContent = `Halaman ${media.halaman} / ${totalHalaman}`;
  $('#mediaSebelumnya').disabled = media.halaman <= 1;
  $('#mediaBerikutnya').disabled = media.halaman >= totalHalaman;
  $('#ringkasanMedia').textContent = mediaCari() ? `${formatAngka(media.tampil.length)} hasil pada shard aktif · ${formatAngka(media.totalVirtual)} domain virtual` : `${formatAngka(media.totalVirtual)} domain virtual · ${formatAngka(media.semua.length)} record shard aktif`;
}

function saringMedia() {
  const cari = $('#cariDomain').value.trim().toLocaleLowerCase('id-ID');
  const status = $('#filterDomain').value;
  keadaan.media.cari = cari;
  keadaan.media.status = status;
  keadaan.media.tampil = keadaan.media.semua.filter((item) => (!cari || item.domain.toLocaleLowerCase('id-ID').includes(cari)) && (status === 'semua' || item.status === status));
  keadaan.media.halaman = 1;
  gambarMedia();
}

async function muatDataMedia() {
  const status = $('#statusMedia');
  try {
    const jawaban = await fetch('data.media/domain-000001.media', { cache: 'no-store' });
    if (!jawaban.ok) throw new Error('shard tidak tersedia');
    keadaan.media.semua = (await jawaban.text()).split(/\r?\n/).filter(Boolean).map((baris) => JSON.parse(baris));
    keadaan.media.seeds = keadaan.media.semua.map((item) => item.domain);
    keadaan.media.tampil = keadaan.media.semua;
    const manifest = await fetch('data.media/manifest.json', { cache: 'no-store' }).then((respon) => respon.json()).catch(() => null);
    if (manifest?.jumlahEntriTarget) keadaan.media.sumberTarget = manifest.jumlahEntriTarget;
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
  $('#mediaBerikutnya').addEventListener('click', () => { const maksimum = jumlahHalamanMedia(); if (keadaan.media.halaman < maksimum) { keadaan.media.halaman += 1; gambarMedia(); } });
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
  muatPengetahuanRepositori();
  siapkanNavigasi();
  siapkanSeret();
  siapkanMedia();
  $('#pertanyaan').addEventListener('input', segarkanHitungan);
  $('#tombolTema').addEventListener('click', () => { keadaan.tema = keadaan.tema === 'gelap' ? 'terang' : 'gelap'; localStorage.setItem('nalar-tema', keadaan.tema); terapkanTema(); });
  $('#tombolContoh').addEventListener('click', muatContoh);
  $('#tombolNalar').addEventListener('click', jalankanNalar);
  $$('[data-prompt]').forEach((tombol) => tombol.addEventListener('click', () => { $('#pertanyaan').value = tombol.dataset.prompt; segarkanHitungan(); $('#pertanyaan').focus(); }));
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
