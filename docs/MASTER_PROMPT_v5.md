==============================================================================
ASIA CAR WASH & CAFE - MASTER PROMPT v5 (CLAUDE SONNET 5.5 SESSION-AWARE)
==============================================================================
Versi 5. Konsolidasi Master Prompt v4 dengan protokol kerja bertahap yang
dioptimalkan untuk Claude Sonnet 5.5 dan sesi coding yang dapat terputus
karena batas penggunaan. Seluruh persyaratan bisnis dan teknis v4 tetap
dipertahankan.


RINGKASAN PERUBAHAN DARI v2
------------------------------------------------------------------------------
1. Pembayaran hanya "Bayar di Kasir". Tidak ada payment gateway di web
   (Midtrans dan sejenisnya dihapus). Pelanggan tidak bisa membayar lewat web.
2. Navigasi pelanggan hanya dua tab: Beranda dan Menu. Tidak ada bar akun,
   riwayat, atau promo.
3. Beranda dirancang agar pelanggan baru langsung paham dan diarahkan ke Menu.
4. Pelanggan selalu guest. Tidak ada register, login, atau akun pelanggan.
   Login hanya untuk Owner dan Staff.
5. Ikon bulat bergambar orang di kanan atas menjadi satu-satunya pintu masuk
   login, baik di situs pelanggan maupun di admin.

TAMBAHAN VERSI 5 (SELURUH TAMBAHAN V4 TETAP BERLAKU)
------------------------------------------------------------------------------
1. Fase 0 untuk audit repository, environment, dependency, dan rencana kerja.
2. Protokol error recovery agar kegagalan satu pendekatan tidak otomatis
   menghentikan fase; wajib ada debugging berbasis bukti dan alternatif aman.
3. Git checkpoint, dokumentasi issue, dan status COMPLETED/IN PROGRESS/BLOCKED.
4. Deployment utama diarahkan ke VPS + Docker dengan Supabase PostgreSQL.
5. Ada panduan verifikasi production, backup/restore, rollback, dan monitoring.
6. Ada skenario pengujian transaksi end-to-end lintas customer, admin/KDS,
   pembayaran di kasir, struk, dan laporan.
7. Fase dipecah menjadi task kecil agar dapat dikerjakan lintas sesi Claude
   Sonnet 5.5 tanpa kehilangan progres ketika batas penggunaan tercapai.
8. Ada checkpoint handoff, work queue, dan prompt lanjutan yang wajib
   disimpan di repository setiap kali satu task selesai atau sesi hampir habis.


==============================================================================
0. CARA MEMAKAI PROMPT INI
==============================================================================
Prompt ini ditujukan untuk AI coding agent yang dapat membaca dan mengubah
repository, menjalankan terminal, menjalankan tes, dan menggunakan Git
(misalnya Claude Code, Cursor, Codex, atau agent setara). Tempel seluruh
isinya sebagai instruksi proyek/CLAUDE.md atau referensi tetap, lalu minta
agen memulai dari Fase 0. Jangan mengirim ulang seluruh prompt panjang pada
setiap sesi jika sudah tersimpan di repository atau Project Knowledge.
Untuk setiap sesi baru, berikan hanya instruksi task aktif dan minta agen
membaca docs/AI_HANDOFF.md serta docs/WORK_QUEUE.md terlebih dahulu.

Agen harus menggunakan model coding/reasoning terkuat yang tersedia dan
sesuai anggaran untuk pekerjaan arsitektur, debugging kompleks, keamanan,
dan perubahan lintas modul. Model lebih ringan boleh digunakan untuk tugas
rutin. Nama model bukan jaminan kualitas: kemampuan harus dibuktikan melalui
perubahan kode, hasil tes, dan laporan. Jika tersedia, gunakan agent kedua
sebagai reviewer independen untuk audit arsitektur, keamanan, dan hasil tes;
reviewer melaporkan temuan terlebih dahulu dan tidak mengubah repository
secara langsung tanpa persetujuan.

Peran agen: senior full-stack engineer sekaligus product designer yang
membangun sistem pemesanan nyata untuk ASIA Car Wash & Cafe (zona waktu WIB).
Bahasa antarmuka: Indonesia. Bahasa kode, nama tabel, dan commit: Inggris.

ATURAN KERJA (WAJIB)
1. Kerjakan satu fase pada satu waktu, dimulai dari Fase 0, tetapi JANGAN
   menganggap satu fase harus selesai dalam satu sesi AI. Pecah fase menjadi
   task kecil sesuai Bagian 19. Selesaikan hanya task aktif, simpan handoff,
   lalu berhenti. Lanjutkan task berikutnya hanya setelah pemilik memberi
   perintah "lanjut". Jangan melompat fase tanpa izin.
2. Jangan menyatakan fitur berfungsi jika belum dijalankan dan diuji. Pisahkan
   dengan jelas "Sudah diuji" dan "Belum diuji".
3. Jangan mengarang data: deskripsi produk, harga, jam buka, alamat, nomor
   telepon, atau dokumentasi API kasir.
4. Tidak ada tombol dekoratif dan tidak ada mock data pada hasil final. Stub
   untuk pengembangan boleh ada, tetapi diberi label jelas dan nonaktif secara
   default.
5. Jika ada hal ambigu, pakai default di Bagian 2, catat di DECISIONS.md, lalu
   lanjut. Berhenti bertanya hanya jika benar-benar buntu.
6. Rahasia (password, API key, secret webhook) tidak pernah masuk kode, repo,
   log, atau frontend.
7. Jika dua tujuan bertabrakan, urutan prioritas: integritas harga dan
   keamanan > keandalan > UX > fitur tambahan.
8. DILARANG menambahkan payment gateway, SDK pembayaran, atau halaman bayar
   online. Satu-satunya cara bayar adalah di kasir.
9. Sebelum mengubah repository, periksa kondisi Git, branch, perubahan lokal,
   dan file yang sudah ada. Jangan menimpa atau menghapus pekerjaan yang
   belum di-commit.
10. Setiap perubahan harus dapat ditelusuri. Gunakan checkpoint/commit Git
    pada titik stabil; jangan melakukan force push atau operasi destruktif
    tanpa persetujuan.
11. Error bukan alasan otomatis untuk membatalkan proyek. Ikuti Bagian 16.
    Jangan menyembunyikan error, melonggarkan tes, atau mengklaim sukses tanpa
    bukti.
12. Jika instruksi bertentangan, persyaratan bisnis dan keamanan di dokumen
    ini mengalahkan preferensi teknis agent. Catat keputusan di DECISIONS.md.


==============================================================================
1. RINGKASAN PRODUK & RUANG LINGKUP
==============================================================================
Tiga komponen:
  (a) website pelanggan mobile-first yang dibuka lewat QR meja, tanpa login;
  (b) website administrator yang terpisah dan berbasis role (Owner/Staff);
  (c) integrasi kasir lewat adapter.

Database web menu adalah sumber kebenaran untuk transaksi dan snapshot harga.

Skala: 23 meja reguler + 1 meja VIP Room + 1 lokasi non-meja "Area Tunggu /
Car Wash". Optimalkan untuk kesederhanaan dan keandalan, bukan skala besar.

Prinsip alur pelanggan: pelanggan memesan sebagai guest, lalu membayar
langsung di kasir. Web hanya mencatat pesanan. Web tidak pernah memproses
uang.

MVP (WAJIB ADA SAAT LAUNCH)
- Pelanggan: intro hero (skippable), Beranda, Menu digital, detail produk,
  keranjang, checkout (Bayar di Kasir), pelacakan pesanan, struk digital,
  Pesan Lagi, Panggil Pelayan, Minta Bill.
- QR meja dengan token acak, pengisian lokasi otomatis.
- Admin: login Owner/Staff (2FA wajib untuk Owner), dashboard, CRUD
  produk/kategori/add-on, promosi & banner, pesanan, KDS (layar
  dapur/kasir), tandai lunas, meja & QR, laporan + CSV, pengaturan,
  integrasi kasir, audit log, manajemen staff.
- kasirAdapter dengan antrean, retry, log; fallback KDS + ekspor CSV.
- PWA ringan (cache menu, mode baca saat offline).

DI LUAR RUANG LINGKUP (jangan dibangun, jangan ditambahkan tanpa persetujuan
tertulis pemilik)
- Pembayaran online apa pun (QRIS web, VA, kartu, e-wallet) dan refund
  otomatis lewat gateway.
- Akun pelanggan (register, login, profil), poin loyalti.

PHASE 2 (belum dibangun; skema tidak boleh menghalanginya)
Pre-order/reservasi, multi-cabang, printer thermal, Google Sheets, notifikasi
Telegram/WhatsApp untuk staff, dark mode, bahasa Inggris, WebSocket/Supabase
Realtime.


==============================================================================
2. KEPUTUSAN DEFAULT & HAL YANG PERLU DIKONFIRMASI
==============================================================================
Agen memakai default ini tanpa bertanya. Pemilik cafe mengonfirmasi sebelum
go-live.

 1. Pajak & service
    Default : 11%, mode eksklusif (ditambahkan di atas harga menu), bisa
              diubah Owner. Label: "Pajak & Service 11%".
    Konfirmasi ke: Cafe / akuntan

 2. Jam operasional
    Default : Placeholder 09:00-21:00 setiap hari, ditandai "belum
              dikonfirmasi". Wajib diisi sebelum go-live.
    Konfirmasi ke: Cafe

 3. Akun pelanggan
    Default : TIDAK ADA. Semua pelanggan memesan sebagai guest. Riwayat
              pesanan disimpan per perangkat. Login hanya untuk Owner dan
              Staff.
    Konfirmasi ke: Pemilik

 4. Nomor WhatsApp pelanggan
    Default : Opsional (setting Owner untuk mewajibkan).
    Konfirmasi ke: Cafe

 5. Harga belum final
    Default : Nasi Goreng Oseng Buntut Asia (Rp72.000) dan Es Buah (Rp32.000)
              di-seed dengan price_status = unconfirmed dan disembunyikan
              dari pelanggan sampai Owner mengonfirmasi.
    Konfirmasi ke: Cafe

 6. Deskripsi produk
    Default : Spesifikasi awal menyebut deskripsi sudah ada, tetapi tidak
              disertakan. Kolom dibiarkan NULL dan UI menyembunyikan
              barisnya. Tidak boleh diisi karangan.
    Konfirmasi ke: Pemilik kirim file

 7. Pembayaran
    Default : HANYA "Bayar di Kasir". Tidak ada payment gateway, tidak ada
              halaman bayar online, tidak ada pilihan metode di checkout.
    Konfirmasi ke: Pemilik

 8. Domain
    Default : Dibaca dari NEXT_PUBLIC_SITE_URL; URL QR dibangun darinya.
    Konfirmasi ke: Pemilik

 9. Logo & foto
    Default : Logo persegi 1:1 disediakan pemilik di public/brand/. Sebelum
              ada, pakai placeholder SVG teks "ASIA", bukan logo karangan.
    Konfirmasi ke: Pemilik

10. API kasir
    Default : Tidak diasumsikan. KASIR_MODE=disabled sehingga KDS menjadi
              jalur utama.
    Konfirmasi ke: Cafe

11. Akun Owner
    Default : Email dari OWNER_EMAIL, password awal dari
              OWNER_INITIAL_PASSWORD (hanya di .env). Wajib ganti password
              dan aktifkan 2FA saat login pertama.
    Konfirmasi ke: Pemilik

12. Ubah lokasi di checkout
    Default : Setting allow_change_table, default aktif.
    Konfirmasi ke: Owner

13. Add-on per kategori
    Default : Extra Shot -> Kopi. Gula Aren dan Oat Milk -> Kopi, Non-Coffee.
              Dressing Mayo -> Salad. Sambal Matah, Sambal Ijo -> Rice Bowl,
              Signature, Noodle. Rice -> Rice Bowl, Signature. Semua bisa
              diubah Owner.
    Konfirmasi ke: Cafe

14. Iced Tea
    Default : Mengikuti aturan Hot/Cold kategori Tea. Owner bisa
              menonaktifkan varian Hot per produk.
    Konfirmasi ke: Cafe

15. Salt Bread Srikaya / Coklat
    Default : Satu produk dengan pilihan varian Srikaya atau Coklat, harga
              sama.
    Konfirmasi ke: Cafe

16. Kapan pesanan masuk dapur
    Default : Setting kitchen_release_mode:
              - immediate (default): pesanan langsung masuk antrean dapur
                dengan status belum dibayar.
              - after_paid: pesanan menunggu di kolom "Menunggu Pembayaran"
                sampai staff menandai lunas.
              Berguna bila cafe khawatir pesanan iseng.
    Konfirmasi ke: Cafe

17. Metode yang dicatat saat Tandai Lunas
    Default : Tunai, EDC, atau QRIS kasir. Ini hanya catatan staff atas
              pembayaran fisik di kasir, bukan integrasi pembayaran.
    Konfirmasi ke: Cafe


==============================================================================
3. BRAND & VISUAL
==============================================================================
Konsep: European Luxury Cafe meets Modern Automotive Lounge. Mewah yang tenang
dan modern, bukan restoran generik dan bukan undangan pernikahan. Ornamen daun
emas dipakai tipis dan hemat; aksen otomotif dipakai halus (siluet mobil,
garis kecepatan tipis, pola heksagon).

TOKEN WARNA
  Navy      #0F2342  Hero, header, sidebar admin, tombol utama
  Gold      #D4AF6A  Border tipis, ikon, aksen, teks di atas navy
  Cream     #F5E9C8  Teks di atas navy, kartu hangat
  Espresso  #38271F  Section Layanan Car Wash, footer, teks isi di atas ivory
  Mocha     #684832  Sub-heading, badge, hover kartu cokelat
  Ivory     #F5EBDD  Latar utama halaman menu dan kartu

ATURAN PEMAKAIAN WARNA
- Latar halaman menu = Ivory, teks = Navy atau Espresso.
- Gold tidak dipakai sebagai teks di atas Ivory (kontras rendah); pakai Mocha
  atau Navy.
- Jangan mencampur Navy dan cokelat dalam satu komponen. Navy untuk area
  "Cafe", Espresso/Mocha untuk area "Car Wash Services".
- Kontras teks minimal WCAG AA (4.5:1) dan harus diverifikasi.
- Semua warna didefinisikan sebagai design token di tailwind.config.ts, bukan
  hex tersebar.

TIPOGRAFI
Playfair Display atau DM Serif Display untuk heading (bersih, tidak terlalu
ornamental); Inter atau DM Sans untuk isi. Self-host lewat next/font.

GAYA
Border 1px emas, radius 12-16px, shadow lembut, whitespace lega, transisi
halus 150-300 ms. Konsisten dari intro, menu, checkout, tracking, sampai
admin. Dilarang tampilan ramai.

LOGO
File persegi 1:1 dari pemilik. Logo wordmark "ASIA" dengan bintang kecil di
ujung dan ikon mobil di atasnya. Jangan menggambar ulang atau mengubah logo.

IKON PROFIL BULAT (komponen AvatarButton, dipakai di situs pelanggan dan
admin)
- Lingkaran 40 px (area sentuh minimal 44 px) di kanan atas header, berisi
  ikon siluet orang, border emas 1px, latar Navy atau Cream sesuai header.
- Satu komponen dipakai di semua halaman, posisinya tidak berpindah.
- Perilakunya didefinisikan di Bagian 5.0 (pelanggan) dan 7.1 (admin).

INTRO HERO (halaman /)
1. Latar Navy penuh. Halaman Beranda dan data menu dimuat di latar belakang
   selama intro, sehingga intro tidak menghambat loading.
2. Urutan (total maksimal 3,5 detik): logo fade-in -> ikon mobil dan bintang
   bergerak ringan -> "ASIA Car Wash & Cafe" muncul -> garis emas tergambar
   bertahap -> tagline "A Taste of Comfort, A Touch of Luxury." -> tombol
   "Explore Our Menu".
3. Tombol "Skip" terlihat sejak detik pertama.
4. Tombol Explore menuju Beranda dengan transisi halus.
5. Tampil hanya pada kunjungan pertama, ditandai localStorage
   (asia_intro_seen), kedaluwarsa 12 jam. Owner bisa mematikan intro di
   Settings. Pelanggan yang masuk lewat QR meja langsung ke /menu tanpa
   intro.
6. Hormati prefers-reduced-motion: ganti animasi dengan fade sederhana atau
   lewati.
7. Animasi memakai CSS keyframes, bukan library berat. Uji di Android
   menengah dan iPhone Safari.


==============================================================================
4. TECH STACK & ARSITEKTUR
==============================================================================
Framework   : Next.js (App Router) + TypeScript + Tailwind CSS
Database    : Supabase PostgreSQL. Migrasi SQL berversi dengan Drizzle.
Akses data  : Semua lewat server Next.js. Service role key hanya di server.
              RLS aktif tanpa policy untuk anon sehingga anon key tidak bisa
              membaca apa pun. Tidak ada klien Supabase di browser.
Auth admin  : Custom: argon2id, tabel sessions (token di-hash, bisa dicabut),
              cookie httpOnly + Secure + SameSite. Hanya untuk Owner dan
              Staff.
2FA         : TOTP (otpauth), wajib untuk Owner, opsional untuk Staff,
              10 recovery code (di-hash).
Realtime    : Polling, bukan WebSocket. Pelanggan 8 detik, admin/KDS 5 detik,
              memakai ?since=, berhenti saat tab tersembunyi, backoff saat
              error.
Rate limit  : Upstash Ratelimit (disarankan) atau tabel Postgres. Memori
              proses tidak cukup untuk serverless.
Gambar      : Kompres di browser ke WebP (maks 1200 px, <=200 KB), validasi
              ulang magic bytes dan hapus EXIF dengan sharp di server, simpan
              ke Supabase Storage. Tanpa Cloudinary.
Antrean kasir: Tabel outbox kasir_sync_queue + worker/cron tiap menit. Pada
              target VPS gunakan worker atau cron terjadwal yang memanggil
              proses aman; Supabase pg_cron dapat menjadi alternatif. Semua
              endpoint/job dilindungi CRON_SECRET. Tanpa Redis/BullMQ.
Pembayaran  : TIDAK ADA GATEWAY. Pembayaran dilakukan fisik di kasir; web
              hanya mencatat status lunas yang ditandai staff.
QR          : qrcode. Cetak lewat halaman HTML siap cetak (tanpa library PDF).
UI lain     : Framer Motion (transisi halaman dan bottom sheet), Recharts,
              dnd-kit (khusus desktop).
Test        : Vitest (unit), Playwright (e2e, viewport 390x844).
Deploy      : VPS + Docker sebagai target utama, dengan domain milik ASIA.
              Database tetap Supabase PostgreSQL. Vercel hanya alternatif jika
              pemilik menyetujui perubahan target. HTTPS wajib. README dan
              docs/DEPLOYMENT.md harus mendokumentasikan deployment VPS.
Waktu       : Simpan UTC, tampilkan dan laporkan dalam Asia/Jakarta.


==============================================================================
5. WEBSITE PELANGGAN (MOBILE-FIRST)
==============================================================================
Prinsip: terasa seperti aplikasi native, cepat dibuka, tanpa instalasi, TANPA
LOGIN, Bahasa Indonesia, dan sesederhana mungkin. Skeleton loading, empty
state, error state, dan success state di setiap daftar dan aksi.

------------------------------------------------------------------------------
5.0 NAVIGASI & STRUKTUR LAYAR (ATURAN BAKU)
------------------------------------------------------------------------------
Situs pelanggan hanya punya DUA TAB NAVIGASI: Beranda dan Menu. Tidak boleh
ada tab, bar, atau menu lain (tidak ada Akun, Pesanan, Promo, Keranjang, atau
Bantuan sebagai tab).

Header (atas, semua halaman pelanggan):
- Kiri: logo ASIA (ketuk = ke Beranda).
- Tengah/kanan: chip lokasi (mis. "Meja 12") bila lokasi sudah terisi dari
  QR.
- Kanan atas: AvatarButton (lingkaran bergambar orang).

Bottom navigation (bawah): tepat dua item, Beranda dan Menu, dengan ikon dan
label, area sentuh >= 48 px, item aktif ditandai jelas.
- Tampil di / dan /menu (termasuk /menu/[category]).
- Halaman alur (/cart, /checkout, /orders, /orders/[orderToken], /privacy,
  /product/[id]) memakai header dengan tombol Kembali dan tanpa bottom
  navigation, agar pelanggan fokus pada satu tugas.

Keranjang bukan tab. Keranjang diakses lewat tombol melayang (floating cart
pill: jumlah item + subtotal) yang hanya muncul bila keranjang berisi, tepat
di atas bottom navigation.

Pesanan aktif bukan tab. Bila perangkat ini punya pesanan yang belum selesai,
kartu "Pesanan Anda" (nomor, status, ketuk untuk melihat) muncul di bagian
atas Beranda dan Menu. Riwayat lengkap /orders dibuka dari tautan "Lihat
riwayat pesanan" di Beranda, di bagian bawah. Setelah checkout, pelanggan
otomatis diarahkan ke halaman pelacakan.

Perilaku AvatarButton di situs pelanggan:
- Diketuk membuka popover kecil berisi SATU AKSI: "Masuk sebagai Admin /
  Owner" (menuju /admin/login), dengan teks kecil "Khusus pengelola ASIA.
  Pelanggan tidak perlu login."
- Jika perangkat punya sesi admin yang valid, popover menampilkan nama + role
  dan tombol "Buka Dashboard" serta "Keluar".
- Tidak ada pendaftaran atau login pelanggan. Tidak ada halaman profil
  pelanggan.
- aria-label: "Menu pengelola".

------------------------------------------------------------------------------
5.1 ROUTE
------------------------------------------------------------------------------
/                       Intro + Beranda
/menu, /menu/[category] Menu digital
/product/[id]           Detail produk (tautan langsung; di menu tampil sebagai
                        bottom sheet)
/cart, /checkout        Keranjang dan checkout
/orders                 Riwayat pesanan di perangkat ini
/orders/[orderToken]    Pelacakan, struk, Pesan Lagi
/m/[qrToken]            Gerbang QR: validasi token, set lokasi, arahkan ke
                        /menu
/privacy                Kebijakan privasi

Tidak ada route /login, /register, /account, maupun /payment untuk pelanggan.
Login admin hanya di /admin/login.

------------------------------------------------------------------------------
5.2 BERANDA (DASHBOARD PELANGGAN)
------------------------------------------------------------------------------
Tujuan utama: pelanggan baru tidak bingung dan langsung diarahkan ke Menu.

Layar pertama (above the fold, 390x844, tanpa scroll):
1. Logo, nama cafe, tagline.
2. Chip lokasi bila ada ("Anda memesan untuk Meja 12"). Jika tidak ada lokasi
   (membuka tanpa QR), tampil teks "Lokasi dipilih saat checkout".
3. Satu tombol utama besar: "Lihat Menu & Pesan", menuju /menu dalam satu
   ketukan. Ini satu-satunya tombol dengan gaya primer di layar pertama.
4. Panduan 3 langkah "Cara Pesan", ringkas dengan ikon:
   (1) Pilih menu
   (2) Buat pesanan
   (3) Bayar di kasir (teks jelas: "Pembayaran dilakukan langsung di kasir")
5. Jika cafe sedang tutup: banner jam buka tampil di atas tombol; menu tetap
   bisa dilihat.

Di bawahnya (urut dari paling penting, semua dinamis dari database/Settings):
- Kartu "Pesanan Anda" bila ada pesanan aktif.
- Banner promosi aktif dan informasi penting dari admin.
- Carousel Menu Unggulan (maks 10 produk; ketuk kartu -> bottom sheet detail
  di /menu).
- Dua kartu besar "Makanan" dan "Minuman" yang menuju /menu pada grup
  terkait.
- Bagian Layanan Car Wash (latar Espresso/Mocha).
- Jam operasional, foto suasana cafe.
- Tombol Instagram @asiacarwashandcafe, tombol Google Maps
  (https://maps.app.goo.gl/1BwPD4VX9QfCVcxq7?g_st=ac), tombol "Bagikan menu"
  (WhatsApp).
- Tautan kecil "Lihat riwayat pesanan" dan "Kebijakan privasi".

Pelanggan yang masuk lewat QR langsung ke /menu. Di sana tampil satu kali
(bisa ditutup, ditandai localStorage) banner kecil: "Pesan dari HP Anda, bayar
di kasir setelah memesan."

------------------------------------------------------------------------------
5.3 MENU DIGITAL
------------------------------------------------------------------------------
Struktur kategori: 13 kategori tampil, dikelompokkan dalam 2 grup lewat kolom
categories.group:
- Makanan: Salad, Rice Bowl, Signature, Noodle, Western, Snack & Dessert.
- Minuman: Kopi, Non-Coffee, Tea, Coffee Mocktail, Mocktail, Juice, Water.

Navigasi di dalam Menu: tab grup di atas, chip sub-kategori sticky di
bawahnya, cukup dijangkau satu jempol. Additional Food dan Additional Drink
bukan kategori tampil; keduanya add-on dan hanya muncul di detail produk.

Fitur: pencarian dengan debounce, filter harga (di bawah Rp25.000,
Rp25.000-40.000, di atas Rp40.000), carousel Menu Unggulan (kartu besar dengan
foto), daftar produk rapi untuk sisanya. Setiap produk menampilkan foto
(placeholder brand jika belum ada), nama, deskripsi bila ada, harga, label
(Best Seller, New, Spicy, Recommended), status tersedia/habis (habis = tidak
bisa ditambahkan), dan harga asli dicoret + harga setelah diskon bila ada
diskon aktif.

------------------------------------------------------------------------------
5.4 DETAIL PRODUK (BOTTOM SHEET)
------------------------------------------------------------------------------
Foto, nama, deskripsi, harga, varian, add-on, catatan khusus (maks 140
karakter), jumlah, tombol "Tambahkan ke Keranjang".
- Varian Hot/Cold otomatis untuk kategori Kopi, Non-Coffee, Tea. Harga default
  sama; Owner dapat mengatur selisih harga per varian dan menonaktifkan varian
  per produk.
- Add-on tampil sesuai pemetaan di Bagian 2 nomor 13. Harga add-on diatur
  Owner.

------------------------------------------------------------------------------
5.5 KERANJANG
------------------------------------------------------------------------------
Tombol melayang di bawah layar (jumlah item dan subtotal) membuka /cart.
Halaman keranjang: ubah jumlah, hapus, edit varian dan add-on, rincian
diskon, total. Disimpan di localStorage dengan versi skema dan dipulihkan saat
refresh.

Sinkronisasi harga: saat keranjang dibuka dan saat checkout, panggil
POST /api/cart/validate. Jika harga berubah atau produk habis, tampilkan
perubahan dan minta pelanggan menyetujui sebelum lanjut. Keranjang tidak
pernah dipercaya sebagai sumber harga.

------------------------------------------------------------------------------
5.6 CHECKOUT (GUEST, BAYAR DI KASIR)
------------------------------------------------------------------------------
- Nama pemesan (wajib). WhatsApp (opsional atau wajib sesuai setting). Catatan
  pesanan umum. Plat nomor kendaraan (opsional, tidak disimpan jika kosong).
- Lokasi: Meja 01-23, Meja VIP Room, Area Tunggu / Car Wash. Terisi otomatis
  dari QR. Pelanggan boleh mengubah bila allow_change_table aktif; server
  tetap memvalidasi bahwa lokasi aktif.
- Checkbox persetujuan data pribadi (UU PDP) dengan tautan ke /privacy.
- Pembayaran: tidak ada pilihan metode. Tampil satu blok informasi tetap:
  "Bayar di Kasir. Setelah memesan, tunjukkan nomor pesanan ke kasir."
- Ringkasan: item, add-on, diskon, pajak/service, total akhir. Tombol "Buat
  Pesanan".
- Request hanya berisi ID produk, varian, add-on, jumlah, catatan, lokasi, dan
  idempotency key (UUID dari klien) agar klik ganda tidak membuat pesanan
  ganda. Klien tidak pernah mengirim harga, total, maupun status pembayaran.
- Rate limit 3 pesanan per menit per IP + sesi.
- Jika cafe tutup (di luar jam atau "Tutup Sementara"), menu tetap bisa dilihat
  tetapi checkout nonaktif dengan pesan jam buka.
- Layar sukses setelah pesanan dibuat: nomor pesanan besar, total, lokasi, dan
  pesan jelas "Pesanan diterima. Silakan bayar di kasir." Lalu pelanggan
  diarahkan ke halaman pelacakan.

------------------------------------------------------------------------------
5.7 PELACAKAN PESANAN
------------------------------------------------------------------------------
Halaman /orders/[orderToken] memakai token acak minimal 22 karakter, bukan
nomor pesanan berurutan, agar pesanan orang lain tidak bisa ditebak.

Tampilan: nomor pesanan, nama, waktu, lokasi, item, total, status pembayaran
(Belum dibayar, bayar di kasir / Lunas), status pesanan. Alur status:
Diterima -> Diproses -> Siap -> Diantar -> Selesai, ditambah Dibatalkan.
Pembaruan lewat polling (Bagian 4).

- Masuk antrean dapur: mengikuti setting kitchen_release_mode (Bagian 2 nomor
  16). Mode immediate (default): langsung masuk dengan status bayar unpaid.
  Mode after_paid: tampil di KDS pada kolom "Menunggu Pembayaran" sampai staff
  menandai lunas; pelanggan melihat "Menunggu pembayaran di kasir".
- Pelanggan tidak bisa mengubah status pembayaran dengan cara apa pun. Hanya
  staff yang menandai lunas di kasir.
- Tambah pesanan: pelanggan membuat pesanan baru di meja yang sama tanpa
  menghapus pesanan lama. Pesanan baru tertaut ke table_sessions yang sama dan
  di dapur tampil sebagai "Tambahan untuk Meja 12".
- Batalkan: pelanggan hanya bisa membatalkan dalam 5 menit, selama status
  masih Diterima DAN belum dibayar. Setelah itu harus lewat staff. Staff dapat
  membatalkan atau me-void satu item dengan alasan wajib; total dihitung
  ulang, tercatat di audit log, dan pelanggan melihat perubahannya. Jika
  pesanan sudah dibayar lalu dibatalkan atau di-void, pengembalian uang
  ditangani staff secara langsung di kasir, dan admin mencatat penandaan
  "perlu dikembalikan di kasir" beserta catatan.
- Panggil Pelayan / Minta Bill: dialog konfirmasi, lalu cooldown 2 menit per
  meja agar tidak spam. Tersimpan di tabel table_requests dan muncul sebagai
  notifikasi di admin/KDS.
- Pesan Lagi: pada status Selesai, salin semua item (varian dan add-on sama)
  ke keranjang dengan harga terbaru.
- Struk digital: halaman HTML berisi logo, nomor pesanan, item, pajak, total,
  metode bayar yang dicatat kasir, waktu, ucapan terima kasih, tombol bagikan
  via WhatsApp (wa.me), dan QR Instagram. Selama belum lunas, halaman
  menampilkan label "Tagihan, belum dibayar" dan bukan "Struk Lunas".
- Riwayat /orders: daftar token pesanan yang disimpan di perangkat. Nomor
  WhatsApp tidak dipakai untuk membuka riwayat tanpa verifikasi karena
  membocorkan data orang lain.

------------------------------------------------------------------------------
5.7b PWA & KONEKSI LEMAH
------------------------------------------------------------------------------
Manifest + service worker meng-cache aset statis dan data menu
(stale-while-revalidate) untuk tampilan baca. Checkout dan pelacakan selalu
butuh jaringan; saat offline tampil banner "Anda sedang offline, pemesanan
dinonaktifkan". Timeout API 8 detik dengan satu kali retry. Gambar
loading=lazy, srcset, WebP.

------------------------------------------------------------------------------
5.8 SEO & BERBAGI
------------------------------------------------------------------------------
Meta title/description, Open Graph (og:image = logo), Twitter Card, JSON-LD
LocalBusiness (nama, jam buka, tautan peta), sitemap.xml. Seluruh /admin
bernilai noindex dan tidak masuk sitemap. Alamat dan nomor telepon hanya
dimasukkan jika sudah diisi di Settings.


==============================================================================
6. ATURAN HARGA, DISKON, DAN PAJAK (SATU SUMBER KEBENARAN)
==============================================================================
Semua perhitungan ada di satu modul lib/pricing.ts, dipakai oleh checkout,
validasi keranjang, KDS, struk, dan laporan.

1. Klien hanya mengirim ID dan pilihan. Server memuat harga terkini dari
   database.
2. Harga satuan = harga dasar + selisih varian + jumlah harga add-on. Total
   baris = harga satuan x jumlah.
3. Diskon per item, tidak ditumpuk. Dari semua diskon yang berlaku (diskon di
   produk, promosi untuk produk, promosi untuk kategori) yang aktif pada waktu
   pesanan, hanya diskon terbaik yang dipakai. Diskon dihitung atas harga
   dasar + varian, add-on tidak didiskon. Persen: pembulatan ke bawah.
   Nominal: maksimal sebesar harga item. Hasil tidak pernah negatif.
4. Pajak/service = round((subtotal - diskon) x tarif). Tarif dan mode
   (eksklusif/inklusif) diatur Owner.
5. Semua nilai uang adalah integer rupiah, tidak ada float. Tampil sebagai
   Rp 42.000.
6. Snapshot di order_items: nama produk, harga dasar, varian, add-on (nama +
   harga), diskon per baris, dan tarif pajak. Mengubah atau menghapus produk
   tidak mengubah pesanan lama.
7. Klien boleh mengirim expected_total hanya untuk deteksi. Jika beda, server
   membalas 409 beserta harga baru dan UI meminta persetujuan ulang. Server
   selalu memakai hitungannya sendiri.
8. Unit test minimal 15 kasus: persen, nominal, diskon melebihi harga, diskon
   kedaluwarsa, add-on, selisih varian, pembulatan pajak, mode inklusif,
   jumlah besar, banyak diskon bersamaan.


==============================================================================
7. WEBSITE ADMINISTRATOR
==============================================================================
Terpisah dari website pelanggan (route group, layout, dan cookie sendiri).
Desktop: sidebar. Mobile: sidebar menjadi drawer. Wajib ada: tabel data dengan
search/filter/sort/pagination, modal form, dialog konfirmasi, toast, dan
skeleton. Login hanya untuk Owner dan Staff.

------------------------------------------------------------------------------
7.1 AUTENTIKASI DAN IKON PROFIL
------------------------------------------------------------------------------
- Login email + password di /admin/login. Halaman ini punya tautan "Kembali
  ke Menu". Hash argon2id. Sesi di tabel sessions, token di-hash, cookie
  httpOnly + Secure + SameSite=Lax, idle timeout 12 jam, batas mutlak 7 hari,
  bisa dicabut.
- Pintu masuk dari situs pelanggan: AvatarButton di kanan atas (Bagian 5.0).
  Jika sesi sudah valid, membuka /admin/login langsung mengarahkan ke
  dashboard.
- AvatarButton di admin (kanan atas header): menampilkan inisial nama (bukan
  siluet generik) dan membuka popover berisi nama, role, "Ganti Password",
  "Pengaturan 2FA", "Lihat Situs Pelanggan", dan "Keluar".
- Rate limit login 5 percobaan per menit per IP dan per email. 5 kali gagal
  berturut-turut mengunci akun 15 menit.
- Proteksi CSRF: pengecekan header Origin, SameSite cookie, dan token untuk
  semua mutasi.
- Ganti password (password lama wajib), logout, validasi sesi di setiap
  request.
- Owner wajib 2FA TOTP. Pengaturan 2FA dipaksa pada login pertama, disertai
  10 recovery code. Jika Owner kehilangan akses, pulihkan lewat skrip CLI
  "npm run owner:reset" yang dijalankan di server, bukan lewat web.
- Akun Owner pertama dibuat oleh seed dari OWNER_EMAIL dan
  OWNER_INITIAL_PASSWORD dengan must_change_password = true. Password tidak
  ditulis di kode, README, atau log. Seed menolak password yang lebih pendek
  dari 12 karakter pada mode production.
- Pembuatan akun Staff hanya oleh Owner di halaman Staff. Tidak ada
  pendaftaran mandiri.

------------------------------------------------------------------------------
7.2 ROLE DAN HAK AKSES
------------------------------------------------------------------------------
Kemampuan                                                   Owner   Staff
Lihat pesanan, ubah status, KDS                             Ya      Ya
Ubah ketersediaan produk (tersedia/habis)                   Ya      Ya
Tandai lunas di kasir, Buka/Tutup Cafe                      Ya      Ya
Batalkan pesanan / void item (alasan wajib)                 Ya      Ya
CRUD produk, harga, kategori, add-on, diskon, promosi       Ya      Tidak
Meja & QR (ubah, generate, cetak)                           Ya      Hanya lihat
Laporan, pelanggan, hapus/anonimkan data pelanggan          Ya      Tidak
Staff, Settings, Integrasi, Audit log                       Ya      Tidak

Penegakan di backend: setiap route handler dan server action memanggil
requireRole(). Wajib ada tes otomatis yang memanggil setiap endpoint khusus
Owner dengan sesi Staff dan memastikan hasilnya 403. Menyembunyikan tombol
saja tidak dihitung.

------------------------------------------------------------------------------
7.3 HALAMAN
------------------------------------------------------------------------------
/admin/login, /admin/dashboard, /admin/products, /admin/categories,
/admin/orders, /admin/kitchen, /admin/tables, /admin/promotions,
/admin/reports, /admin/customers, /admin/staff, /admin/settings,
/admin/integrations, /admin/audit-logs.

/admin/gallery dan halaman pembayaran tidak dibuat. Gambar banner dikelola di
Promotions; logo, hero, dan foto suasana cafe dikelola di Settings -> Tampilan
Homepage. /admin/customers di MVP berisi data pemesan dari pesanan (nama,
WhatsApp, jumlah pesanan) dan tombol anonimkan data.

------------------------------------------------------------------------------
7.4 DASHBOARD
------------------------------------------------------------------------------
- Kartu: total pesanan hari ini, omzet (lunas), pesanan belum dibayar, pesanan
  menunggu/diproses/selesai, jumlah pelanggan, menu terlaris, jam ramai.
- Grafik: omzet 7 hari dan 30 hari, jumlah pesanan, perbandingan penjualan
  produk.
- Pesanan terbaru lewat polling 5 detik, filter tanggal/meja/status/status
  bayar, ubah status, tombol "Tandai Lunas", detail pesanan.
- Notifikasi visual dan suara. Karena browser memblokir audio otomatis,
  sediakan tombol "Aktifkan Suara" yang harus ditekan sekali per sesi.
- Jika pengiriman ke kasir gagal: banner peringatan dan tombol "Kirim Ulang".
- Tombol "Buka Cafe / Tutup Cafe": saat tutup, pesanan baru ditolak dan semua
  QR menampilkan pesan tutup; tercatat siapa dan jam berapa.
- Kartu info bisnis dengan tombol Buka Instagram (@asiacarwashandcafe) dan
  Buka Google Maps (https://maps.app.goo.gl/1BwPD4VX9QfCVcxq7?g_st=ac).

------------------------------------------------------------------------------
7.5 PRODUK, KATEGORI, ADD-ON
------------------------------------------------------------------------------
Field produk: nama, kategori, harga, deskripsi, foto, label, tersedia/habis,
unggulan, varian + selisih harga, add-on, diskon (jenis, nilai, tanggal mulai,
tanggal akhir), kode produk kasir, urutan.

- Foto: upload dari perangkat, preview sebelum simpan, kompres otomatis, ganti
  atau hapus. Tolak file bukan gambar dan file mentah di atas 5 MB.
- Edit: semua field bisa diubah dan langsung tercermin di halaman pelanggan
  (cache menu maksimal 30 detik atau di-revalidate saat ada perubahan).
- Hapus: dialog konfirmasi, soft delete (deleted_at), bisa dipulihkan dari tab
  Arsip. Riwayat transaksi tidak rusak.
- Tabel: search, filter kategori, sort, pagination, toggle tersedia/habis,
  bulk action (tersedia, habis, arsip, pindah kategori), edit cepat.
- Urutan: drag-and-drop dengan dnd-kit hanya di desktop. Di mobile dan sebagai
  alternatif tersedia kolom angka urutan dan tombol naik/turun.
- Kategori: tambah, edit, hapus (diblokir selama masih ada produk aktif;
  arahkan pindahkan dulu), urutan, aktif/nonaktif, grup Makanan/Minuman.
- Add-on: tambah, edit harga, hapus (soft), hubungkan ke kategori atau produk
  tertentu.
- Produk price_status = unconfirmed tidak tampil ke pelanggan sampai Owner
  menekan "Konfirmasi Harga".

------------------------------------------------------------------------------
7.6 PROMOSI DAN INFORMASI HOMEPAGE
------------------------------------------------------------------------------
Fitur: banner promosi dengan gambar, judul, deskripsi; diskon persentase atau
nominal; target produk dan/atau kategori (promotion_targets); tanggal mulai
dan berakhir; aktif/nonaktif; urutan banner; tipe informasi untuk pengumuman
(promo weekend, menu baru, jam khusus, layanan car wash). Preview banner
sebelum dipublikasikan.

Validasi server: tanggal berakhir setelah tanggal mulai, persen 1-100,
nominal lebih dari 0, diskon tidak boleh menghasilkan harga negatif. Promosi
dievaluasi server pada saat pesanan dibuat, bukan oleh klien.

------------------------------------------------------------------------------
7.7 MEJA DAN QR
------------------------------------------------------------------------------
- Lokasi awal: Meja 01-23 (regular), Meja VIP Room (vip), Area Tunggu / Car
  Wash (waiting). Nomor meja unik (constraint database). Owner dapat tambah,
  ubah, nonaktifkan; meja yang pernah dipakai pesanan tidak bisa dihapus,
  hanya dinonaktifkan.
- Setiap meja punya qr_token acak (16 karakter, tidak berurutan). URL QR:
  NEXT_PUBLIC_SITE_URL/m/[qr_token]. Regenerate membuat token baru dan token
  lama langsung tidak berlaku.
- /m/[qrToken]: server memvalidasi token dan status meja, menyimpan lokasi di
  cookie bertanda tangan, lalu mengarahkan ke /menu. Token tidak valid
  menampilkan halaman ramah (dengan tombol ke Menu), bukan error mentah.
- Unduh PNG per meja. Cetak: halaman HTML siap cetak (satu QR per kartu atau
  grid per A4) berisi logo ASIA, nama cafe, nomor meja, QR, dan teks "Scan to
  Order". Pengguna menyimpan sebagai PDF dari dialog cetak browser. Tidak
  memakai library PDF di server.

------------------------------------------------------------------------------
7.8 KDS (LAYAR DAPUR / KASIR)
------------------------------------------------------------------------------
/admin/kitchen, layar penuh, polling 5 detik, tanpa perlu interaksi selain
tombol.
- Kolom Diterima -> Diproses -> Siap. Pada mode after_paid ada kolom tambahan
  paling kiri, "Menunggu Pembayaran".
- Kartu menampilkan lokasi, item + varian + add-on + catatan, nama pemesan,
  lencana status bayar (Belum Dibayar / Lunas), dan timer ("12 menit di
  Diproses", memerah setelah ambang yang diatur Owner).
- Tombol besar untuk pindah status; tombol "Tandai Lunas" pada pesanan belum
  dibayar (memilih metode: Tunai / EDC / QRIS kasir). Memindahkan pesanan
  belum dibayar ke "Selesai" memunculkan dialog peringatan; jika dilanjutkan,
  tercatat di audit log.
- Peringatan Panggil Pelayan dan Minta Bill; penanda "Tambahan" untuk pesanan
  lanjutan; indikator status kirim ke kasir.
- Suara untuk pesanan baru (setelah Aktifkan Suara), Screen Wake Lock agar
  layar tidak mati.
- KDS adalah jalur utama selama API kasir belum tersedia.

------------------------------------------------------------------------------
7.9 SETTINGS
------------------------------------------------------------------------------
Info cafe (nama, alamat, telepon: hanya yang diisi), jam operasional per hari
+ Tutup Sementara, pajak/service (tarif dan mode), WhatsApp wajib atau tidak,
allow_change_table, kitchen_release_mode, intro hero aktif/tidak, ambang timer
KDS, tampilan homepage (logo, hero, foto cafe), teks kebijakan privasi, masa
retensi data.

Tidak ada pengaturan metode pembayaran atau kunci gateway. Pembayaran selalu
"Bayar di Kasir".

------------------------------------------------------------------------------
7.10 LAPORAN
------------------------------------------------------------------------------
Penjualan harian, mingguan, bulanan; total omzet; total pesanan; menu
terlaris; produk kurang laku; metode bayar yang dicatat kasir (tunai/EDC/QRIS
kasir); penjualan per meja. Filter tanggal, grafik, tabel, ekspor CSV (UTF-8
dengan BOM agar terbuka benar di Excel).

Definisi omzet: pesanan dengan payment_status = paid dan order_status bukan
Dibatalkan, dilaporkan per tanggal Asia/Jakarta. Pesanan belum dibayar
ditampilkan terpisah. Angka laporan harus sama dengan hasil penjumlahan
order_items (ada tes yang membandingkannya).


==============================================================================
8. PEMBAYARAN: HANYA BAYAR DI KASIR
==============================================================================
Aturan inti: pelanggan tidak bisa membayar lewat web. Seluruh pembayaran
terjadi langsung di kasir. Tidak ada Midtrans, Xendit, Duitku, atau gateway
lain; tidak ada SDK pembayaran; tidak ada halaman bayar; tidak ada webhook
pembayaran.

Status pembayaran: hanya dua, unpaid dan paid. Pesanan dibatalkan ditangani
oleh order_status = Dibatalkan.

ALUR
1. Pelanggan membuat pesanan di web. Status bayar unpaid, metode belum
   terisi.
2. Pelanggan menunjukkan nomor pesanan ke kasir dan membayar secara fisik
   (tunai, EDC, atau QRIS milik kasir).
3. Staff atau Owner menekan "Tandai Lunas" di KDS atau halaman Pesanan, lalu
   memilih metode yang diterima (Tunai / EDC / QRIS kasir). Sistem menyimpan
   baris di payments (jumlah = total pesanan dari server, siapa yang
   menerima, waktu), mengubah payment_status menjadi paid, dan menulis audit
   log.
4. Pelanggan melihat status "Lunas" lewat polling. Struk digital berubah dari
   "Tagihan" menjadi "Struk".
5. Jika sistem kasir kelak mengirim callback status dan dokumentasinya sudah
   diterima dan diuji, callback tersebut boleh menandai pesanan lunas
   (Bagian 9). Sebelum itu, penandaan lunas hanya manual oleh staff.

KEAMANAN DAN INTEGRITAS
- Tidak ada endpoint publik yang bisa mengubah payment_status. Tes wajib:
  pemanggilan dari klien pelanggan (tanpa sesi admin) untuk menandai lunas
  hasilnya 401/403.
- Jumlah pada payments selalu dihitung server dari total pesanan, bukan dari
  input.
- Tandai Lunas hanya satu kali per pesanan (idempoten); percobaan kedua
  ditolak dengan pesan jelas.
- Tidak menyimpan data kartu atau rekening apa pun.
- Mengubah pesanan (void item) setelah lunas menandai pesanan "perlu
  penyesuaian di kasir" dan tercatat di audit log.


==============================================================================
9. INTEGRASI KASIR (kasirAdapter)
==============================================================================
Sistem kasir dibuat pihak cafe dan terpisah. Jangan mengasumsikan API-nya ada.
Integrasi tidak boleh dinyatakan selesai sebelum dokumentasi API kasir
diterima dan diuji.

MODE (KASIR_MODE)
- disabled : default; KDS jadi jalur utama.
- webhook  : kirim ke KASIR_API_URL.
- stub     : server tiruan khusus pengembangan, berlabel jelas, tidak boleh
             aktif di production.

INTERFACE ADAPTER
sendOrder, cancelOrder, mapProduct, parseStatusWebhook, healthCheck. Detail
endpoint, autentikasi, dan format menyusul dari dokumentasi kasir.
docs/KASIR_INTEGRATION.md berisi daftar pertanyaan untuk pihak cafe: endpoint,
jenis autentikasi, ID produk, idempotensi, callback status (termasuk apakah
kasir dapat mengirim status "sudah dibayar"), sinkronisasi stok, sandbox.

ALUR PENGIRIMAN (OUTBOX)
Saat pesanan layak dikirim (sesuai kitchen_release_mode), baris dimasukkan ke
kasir_sync_queue dalam transaksi yang sama dengan pesanan. Worker cron
mengirim HTTP POST JSON dengan header Idempotency-Key (= nomor pesanan).
Respons dan galat dicatat di kasir_sync_logs dengan rahasia disamarkan.

RETRY
Exponential backoff 30 detik, 2 menit, 10 menit, 30 menit, 2 jam. Setelah
percobaan terakhir status menjadi failed, dashboard menampilkan peringatan,
dan Owner/Staff dapat menekan "Kirim Ulang". Kegagalan kasir tidak boleh
membatalkan atau menghalangi pesanan; pesanan tetap tampil di KDS.

MAPPING
kasir_product_id per produk dan per add-on (boleh kosong). Item tanpa mapping
memunculkan peringatan di halaman Integrations dan tetap dikirim dengan nama.
Harga di database web menu tetap sumber kebenaran; selisih harga dari kasir
hanya ditampilkan untuk disetujui Owner, tidak menimpa otomatis. Sinkronisasi
stok adalah Phase 2.

CONTOH PAYLOAD (final menyesuaikan dokumentasi kasir)

{
  "order_id": "ORD-20261116-0001",
  "idempotency_key": "ORD-20261116-0001",
  "location": "Meja 12",
  "customer_name": "Budi",
  "vehicle_plate": null,
  "created_at": "2026-11-16T10:30:00+07:00",
  "items": [
    {
      "menu_id": "KOP-006",
      "kasir_product_id": "SKU-001",
      "name": "Kopi Susu Gula Aren",
      "qty": 2,
      "unit_price": 32000,
      "discount": 0,
      "options": ["Cold", "Extra Shot"],
      "note": "Es dipisah"
    }
  ],
  "subtotal": 76000,
  "discount": 0,
  "tax": 8360,
  "total": 84360,
  "payment_method": "cashier",
  "payment_status": "unpaid",
  "notes": "Tolong cepat ya"
}

(Angka di atas hanya ilustrasi format. Nilai sebenarnya dihitung
lib/pricing.ts.)

WEBHOOK MASUK
POST /api/webhook/kasir. Verifikasi HMAC-SHA256 atas raw body memakai
KASIR_WEBHOOK_SECRET (header X-Signature), toleransi timestamp 5 menit, tolak
replay. Hanya boleh mengubah status pesanan yang sah, dan, bila didukung
dokumentasi kasir, menandai lunas (tercatat di payments dan audit log). TIDAK
BOLEH mengubah harga.

FALLBACK
MVP = KDS + ekspor CSV. Phase 2 = printer thermal, Google Sheets, notifikasi
Telegram/WhatsApp resmi.


==============================================================================
10. SKEMA DATABASE
==============================================================================
PostgreSQL. Semua tabel punya id, created_at, updated_at kecuali tabel log.
Uang disimpan sebagai integer rupiah.

users
  name, email (unik), password_hash, role (owner/staff), totp_secret
  (terenkripsi), totp_enabled, failed_attempts, locked_until,
  must_change_password, is_active

user_recovery_codes
  user_id, code_hash, used_at

sessions
  user_id, token_hash (unik), expires_at, last_seen_at, ip, user_agent

categories
  name, slug (unik), group (food/drink), sort_order, is_active, deleted_at

menu_items
  category_id, name, description (boleh NULL), price (>= 0), price_status,
  image_url, labels, is_featured, is_available,
  discount_type/value/start_at/end_at, kasir_product_id, sort_order,
  deleted_at

menu_variants
  menu_item_id, name, price_difference, is_active, sort_order

addons
  name, price, group (food/drink), is_active, sort_order, kasir_product_id,
  deleted_at

addon_categories
  addon_id, category_id

menu_item_addons
  menu_item_id, addon_id, is_enabled (override per produk)

promotions
  title, description, image_url, kind (discount/info), discount_type,
  discount_value, start_at, end_at, is_active, sort_order

promotion_targets
  promotion_id, target_type (item/category), target_id

tables
  table_number (unik), table_name, table_type (regular/vip/waiting),
  qr_token (unik), qr_regenerated_at, is_active, sort_order

table_sessions
  table_id, opened_at, closed_at, closed_by

orders
  order_number (unik), public_token (unik), idempotency_key (unik),
  session_id, customer_name, customer_phone (NULL), table_id,
  location_snapshot, vehicle_plate (NULL), subtotal, discount, tax_rate, tax,
  total, payment_status (unpaid/paid), payment_method (NULL sampai lunas:
  cash/edc/qris_cashier), paid_at (NULL), paid_by (NULL),
  needs_cashier_adjustment (bool), order_status, cancel_reason, consent_at,
  notes

order_counters
  date (PK), last_number (untuk ORD-YYYYMMDD-0001, diinkremen dalam
  transaksi)

order_items
  order_id, menu_item_id, product_name_snapshot, price_snapshot,
  variant_snapshot (jsonb), addons_snapshot (jsonb), discount_snapshot,
  quantity, notes, line_total, voided_at, void_reason

order_status_logs
  order_id, status, changed_by, created_at

payments
  order_id (unik), method (cash/edc/qris_cashier), amount, received_by,
  paid_at, note. Satu baris per pesanan lunas, dibuat hanya oleh staff atau
  callback kasir terverifikasi.

table_requests
  table_id, session_id, type (waiter/bill), status, handled_by

kasir_sync_queue
  order_id, status, retry_count, next_attempt_at, last_attempt_at, last_error

kasir_sync_logs
  order_id, idempotency_key (unik), request_payload, response_payload,
  status (pending/sent/failed), retry_count, next_attempt_at,
  last_attempt_at, last_error

settings
  key (unik), value (jsonb)

audit_logs
  user_id, action, entity, entity_id, changes (jsonb), ip, created_at.
  Hanya INSERT, tanpa UPDATE/DELETE.

Tidak ada tabel customer_accounts dan tidak ada tabel payment_events (tidak
ada gateway).

ATURAN INTEGRITAS
- Foreign key ke apa pun yang dirujuk pesanan memakai ON DELETE RESTRICT.
  Produk, kategori, add-on, dan meja memakai soft delete atau nonaktif.
- Check constraint: harga >= 0, jumlah > 0, persen 1-100, end_at > start_at,
  payment_status = 'paid' mensyaratkan paid_at dan payment_method terisi.
- Index: orders(created_at), orders(order_status, payment_status),
  orders(table_id), orders(updated_at) untuk polling,
  menu_items(category_id, sort_order) yang deleted_at IS NULL.
- Anonimisasi: pesanan lebih dari 12 bulan (atau permintaan hapus data)
  menghapus nama, WhatsApp, dan plat nomor, tetapi angka transaksi tetap ada
  untuk laporan.


==============================================================================
11. KEAMANAN, PRIVASI, DAN PERFORMA
==============================================================================
KEAMANAN (WAJIB)
- Validasi semua input di server (zod). Query terparameter (tidak ada SQL
  string concat). Escape keluaran, tidak ada dangerouslySetInnerHTML untuk
  konten pengguna.
- Security header: CSP, X-Content-Type-Options, Referrer-Policy, HSTS,
  frame-ancestors none. CORS hanya untuk domain sendiri; API admin tidak bisa
  diakses dari origin pelanggan.
- Rate limit: login 5/menit, checkout 3/menit, tracking 1 per 5 detik per
  pesanan, Panggil Pelayan/Minta Bill cooldown 2 menit per meja, upload dan
  webhook kasir dibatasi wajar.
- Endpoint yang mengubah status pembayaran hanya bisa dipanggil dengan sesi
  Owner/Staff (atau webhook kasir terverifikasi).
- Rahasia hanya di environment variable. API key tidak pernah dikirim ke
  frontend; .env masuk .gitignore; sertakan .env.example tanpa nilai asli.
- Logging terstruktur tanpa PII dan tanpa rahasia. Error ke pelanggan bersifat
  umum; detail hanya di log server.
- Backup: backup harian Supabase + ekspor mingguan terjadwal ke penyimpanan
  terpisah, dan uji restore satu kali sebelum go-live.

PRIVASI (UU PDP)
Persetujuan eksplisit di checkout; halaman /privacy; WhatsApp dan plat nomor
opsional; plat nomor tidak disimpan bila kosong; fitur anonimkan data
pelanggan di admin; retensi 12 bulan. Karena tidak ada akun pelanggan, data
pribadi hanya berasal dari pesanan.

PERFORMA
Target di jaringan 4G Android menengah, LCP kurang dari 2,5 detik untuk /menu
dan JS awal ringan. Gambar WebP <=200 KB, lazy loading, skeleton. Laporkan
hasil Lighthouse apa adanya.

ENVIRONMENT VARIABLE (.env.example)
NEXT_PUBLIC_SITE_URL, DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
SESSION_SECRET, TOTP_ENCRYPTION_KEY, OWNER_EMAIL, OWNER_INITIAL_PASSWORD,
KASIR_MODE, KASIR_API_URL, KASIR_API_KEY, KASIR_AUTH_TYPE,
KASIR_WEBHOOK_SECRET, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
CRON_SECRET.

(Tidak ada variabel Midtrans atau gateway lain.)


==============================================================================
12. DATA AWAL (SEED)
==============================================================================
Seed bersifat idempoten (upsert berdasarkan slug/nama). Nama dan harga di
bawah tidak boleh diubah, dikoreksi ejaannya, atau dibulatkan tanpa
persetujuan. [*] = unggulan. Deskripsi tidak diisi (lihat Bagian 2 nomor 6).
Seed juga membuat 25 lokasi (Meja 01-23, Meja VIP Room, Area Tunggu / Car
Wash) dengan token QR acak, pengaturan default (termasuk
kitchen_release_mode = immediate), dan akun Owner dari .env.

MAKANAN (grup food)

Salad:
  - Beef Teriyaki Salad 42.000 [*]
  - Grill Chicken Salad 39.000

Rice Bowl:
  - Beef Teriyaki 42.000
  - Beef Blackpaper 42.000
  - Chicken Salted Egg 42.000 [*]
  - Chicken Sambal Matah 38.000
  - Chicken Cabe Ijo 38.000
  - Nasi Semur Daging 48.000 [*]

Signature:
  - Nasi Sop Buntut Asia 90.000 [*]
  - Oseng Buntut Asia 75.000
  - Nasi Goreng Smoked Beef 36.000
  - Nasi Goreng Kampung 32.000
  - Nasi Goreng Asia 32.000
  - Nasi Goreng Oseng Buntut Asia 72.000 [*] (unconfirmed)

Noodle:
  - Mie Ayam Asia 27.000 [*]
  - Mie Goreng 32.000
  - Mie Tek-Tek Asia 40.000

Western:
  - Chicken Cordon Blue 72.000
  - Spaghetti Bolognese 37.000
  - Spaghetti Aglio Olio 37.000 [*]
  - Fettuccini Creamy Mushroom 37.000
  - Fusili Creamy Tomato 37.000

Snack & Dessert:
  - Pisang Goreng 20.000
  - Kentang Goreng 22.000
  - Cireng 19.000
  - Asia Mix Platters 48.000 [*]
  - Pangsit Kuah Asia 22.000 [*]
  - Siomay Dimsum 24.000
  - Kuotie 24.000
  - Telur 1/2 17.000
  - Cookies 18.000
  - Salt Bread 18.000
  - Pain Au 31.000
  - Croissant Butter 27.000
  - Salt Bread Srikaya / Coklat 27.000 (varian Srikaya, Coklat)
  - Roti Bakar Coklat 19.000
  - Roti Bakar Keju 19.000
  - Roti Bakar Keju Coklat 22.000
  - Es Buah 32.000 [*] (unconfirmed)

MINUMAN (grup drink)

Kopi (Hot/Cold):
  - Espresso 20.000
  - Kopi Tubruk Asia 18.000
  - Americano 22.000
  - Cappuccino 34.000
  - Cafe Latte 34.000
  - Kopi Susu Gula Aren 32.000 [*]
  - Toffeccino 37.000
  - Coffee Butterscotch 37.000 [*]
  - Salted Caramel Coffee 37.000

Non-Coffee (Hot/Cold):
  - Matcha Latte 37.000
  - Red Velvet Latte 32.000
  - Chocolate Latte 32.000 [*]

Tea (Hot/Cold):
  - Iced Tea 16.000
  - Lemon Tea 25.000
  - Lychee Tea 27.000
  - Peach Tea 27.000 [*]

Coffee Mocktail:
  - Peachy Triple Americano 27.000
  - Lemonade Americano 27.000
  - Lychee Americano 27.000
  - Mont Blanc 42.000 [*]

Mocktail:
  - Virgin Mojito 27.000
  - Lychee Mojito 27.000 [*]
  - Blue Ocean 27.000

Juice:
  - Watermelon 20.000
  - Pineapple 20.000
  - Strawberry 27.000
  - Mango 27.000
  - Mix Juice (Pineapple, Watermelon) 27.000 [*]
  - Mix Juice (Mango, Strawberry) 30.000

Water:
  - Mineral Water E+ 18.000
  - Cleo 8.000
  - Soda Water 16.000

ADD-ON (bukan kategori tampil)

Makanan:
  - Dressing Mayo 5.000
  - Sambal Matah 6.000
  - Sambal Ijo 6.000
  - Rice 8.000

Minuman:
  - Extra Shot 6.000 (di spesifikasi awal tertulis "Espresso Extra Shot")
  - Gula Aren 4.000
  - Oat Milk 6.000

PEMERIKSAAN SEED (WAJIB LULUS)
13 kategori, 71 produk (39 makanan, 32 minuman), 7 add-on, 25 lokasi.
17 produk bertanda unggulan, 2 di antaranya unconfirmed sehingga tersembunyi
di awal. Carousel Menu Unggulan menampilkan maksimal 10 produk menurut
urutan.


==============================================================================
13. FASE PENGERJAAN DAN KRITERIA LULUS
==============================================================================
Satu fase hanya dianggap selesai jika seluruh kriteria lulus dan hasil tes
dilaporkan. Jangan lompat ke fase berikutnya.

FASE 0 - Pre-development audit & rencana implementasi
Periksa repository dan branch aktif; status Git dan perubahan yang belum
di-commit; struktur proyek; package manager; versi Node.js; dependency;
konfigurasi build; environment variables (tanpa mencetak nilainya); koneksi
Supabase bila akses tersedia; status migrasi; dan aset yang sudah ada. Jangan
menginisialisasi ulang atau menimpa proyek yang sudah berjalan. Buat rencana
implementasi berdasarkan dependensi antarfitur, catat risiko teknis, dan
perbarui docs/DECISIONS.md. Buat branch kerja bila repository mendukung.
Lulus bila:
- kondisi awal repository dan stack terdokumentasi;
- tidak ada perubahan pengguna yang tertimpa;
- kompatibilitas runtime dan dependency diperiksa;
- kebutuhan environment dicatat di .env.example tanpa secret;
- rencana fase dan risiko utama disetujui/dicatat;
- baseline lint, typecheck, test, dan build dijalankan jika proyek sudah
  memiliki perintah tersebut; hasil yang gagal dicatat sebagai baseline,
  bukan disembunyikan.

FASE 1 - Fondasi & database
Setup proyek, struktur folder, validasi env (zod), migrasi, seed, design
token, lib/pricing.ts + tes.
Lulus bila:
- db:migrate dan db:seed berjalan dua kali tanpa duplikat;
- pemeriksaan seed di Bagian 12 lulus;
- tes pricing (>= 15 kasus) lulus;
- .env.example dan README langkah awal ada;
- tidak ada dependensi payment gateway di package.json.

FASE 2 - Autentikasi & shell admin
Login Owner/Staff, argon2id, sesi, lockout, rate limit, CSRF, 2FA Owner, role
guard, ganti password, layout sidebar, AvatarButton admin, helper audit log.
Lulus bila:
- 5 login gagal mengunci akun;
- semua endpoint Owner dari sesi Staff = 403;
- atribut cookie benar;
- alur 2FA dan recovery code berjalan;
- aksi sensitif menulis baris audit;
- avatar admin menampilkan menu Ganti Password, 2FA, dan Keluar yang
  berfungsi.

FASE 3 - Produk & promosi
CRUD produk, kategori, add-on, varian, diskon, promosi, upload foto, Settings
dasar.
Lulus bila:
- ubah harga tampil di API menu dalam <= 30 detik;
- soft delete dan pulihkan berfungsi;
- upload bukan gambar atau di atas 5 MB ditolak;
- diskon tidak pernah menghasilkan harga negatif;
- pemetaan add-on sesuai Bagian 2 nomor 13.

FASE 4 - Website pelanggan
Intro hero, Beranda, Menu, detail produk, keranjang, checkout (Bayar di
Kasir), pelacakan polling, struk, Pesan Lagi, PWA, header dengan AvatarButton
pelanggan, bottom navigation dua tab.
Lulus bila (e2e Playwright 390x844):
- alur scan /m/token -> pesan -> lihat status berhasil;
- dari / tombol "Lihat Menu & Pesan" terlihat tanpa scroll dan satu ketukan
  membawa ke /menu;
- bottom navigation berisi tepat dua item (Beranda, Menu) dan tidak ada tab
  lain di halaman mana pun;
- avatar bulat tampil di kanan atas, popover berisi tautan ke /admin/login,
  dan tidak ada UI daftar/login pelanggan;
- checkout tidak menampilkan pilihan metode pembayaran, hanya info "Bayar di
  Kasir"; layar sukses menampilkan nomor pesanan dan instruksi bayar di
  kasir;
- keranjang pulih setelah refresh; harga berubah memicu 409 dan layar
  persetujuan ulang; saat cafe tutup checkout nonaktif;
- prefers-reduced-motion dihormati; klik ganda "Buat Pesanan" hanya membuat
  satu pesanan.

FASE 5 - Manajemen pesanan, pembayaran kasir & laporan
Dashboard, KDS, status, Tandai Lunas, suara, Panggil Pelayan/Minta Bill,
batal/void, kitchen_release_mode, laporan, CSV.
Lulus bila:
- perubahan status oleh staff terlihat pelanggan dalam <= 10 detik;
- Tandai Lunas oleh staff mengubah status bayar yang terlihat pelanggan
  dalam <= 10 detik, menulis baris payments dan audit log, dan kedua kalinya
  ditolak;
- percobaan menandai lunas tanpa sesi admin ditolak (401/403) dan klien tidak
  bisa mengirim status bayar saat membuat pesanan;
- mode after_paid menahan pesanan di kolom Menunggu Pembayaran sampai lunas;
- cooldown 2 menit bekerja; pembatalan pelanggan hanya dalam 5 menit dan
  hanya bila belum dibayar;
- void menghitung ulang total; angka laporan sama dengan jumlah order_items;
  mengubah harga produk tidak mengubah pesanan lama.

FASE 6 - Meja & QR
CRUD meja, QR, halaman cetak.
Lulus bila:
- token QR tidak berurutan;
- regenerate membuat token lama tidak berlaku;
- token tidak valid menampilkan halaman ramah;
- halaman cetak menghasilkan kartu A4 yang benar;
- meja yang pernah dipakai pesanan tidak bisa dihapus.

FASE 7 - Integrasi kasir
Adapter, outbox, retry, log, webhook kasir, halaman Integrations, stub
pengembangan.
Lulus bila (dengan stub):
- sukses, timeout, HTTP 500, dan pengiriman ganda tertangani;
- jadwal retry benar;
- Kirim Ulang manual berfungsi;
- tanda tangan webhook divalidasi;
- pesanan tetap berjalan saat kasir mati.
Status integrasi dengan kasir asli tetap "belum selesai" sampai dokumentasi
API diterima dan diuji.

FASE 8 - Pengujian akhir & deployment
Tes keamanan, beban ringan (30 pengguna bersamaan), restore backup, deploy
produksi ke VPS, README bertahap, daftar UAT, dan verifikasi seluruh alur
transaksi lintas modul dari QR hingga laporan.
Deployment production harus mengikuti Bagian 17.
Lulus bila:
- seluruh daftar Bagian 11 terverifikasi;
- semua QR dipindai dari HP nyata;
- restore backup berhasil;
- health check, HTTPS, DNS, worker/cron, logging, dan restart container
  diverifikasi;
- skenario rollback aplikasi didokumentasikan dan diuji secara aman;
- simulasi end-to-end QR -> menu -> keranjang -> checkout -> KDS/admin ->
  pembayaran fisik dicatat lunas -> struk -> laporan berhasil;
- checklist go-live terisi (jam operasional, harga unconfirmed, logo, foto,
  akun Owner dan 2FA, kebijakan privasi, konfirmasi kitchen_release_mode).


==============================================================================
14. DEFINISI SELESAI DAN LARANGAN
==============================================================================
- Setiap fitur terhubung ke database yang sama antara website pelanggan dan
  admin. Semua perubahan tersimpan.
- Tidak ada tombol tanpa fungsi, tidak ada mock data pada hasil final, tidak
  ada fitur yang dihapus dari ruang lingkup MVP.
- PEMBAYARAN HANYA DI KASIR. Tidak ada kode, dependensi, route, atau UI untuk
  pembayaran online. Pelanggan tidak punya cara membayar di web.
- NAVIGASI PELANGGAN HANYA BERANDA DAN MENU, dengan avatar bulat kanan atas
  sebagai satu-satunya pintu login. TIDAK ADA AKUN PELANGGAN.
- Identitas visual ASIA tidak diubah. Harga dan nama menu tidak diubah tanpa
  persetujuan.
- Semua harga divalidasi dan dihitung ulang di backend; pesanan lama tidak
  berubah ketika produk diedit.
- Kode modular dan terdokumentasi; README menjelaskan instalasi lokal,
  konfigurasi Supabase, deployment, backup, dan cara menambah adapter kasir
  baru.
- Dilarang mengklaim fitur berfungsi tanpa bukti tes. Laporan akhir wajib
  berisi daftar "Sudah diuji", "Belum diuji", dan "Keterbatasan".


==============================================================================
15. STRUKTUR FOLDER
==============================================================================
asia-cafe/
|-- app/
|   |-- (customer)/     # /, menu, product, cart, checkout, orders,
|   |                   # m/[qrToken], privacy
|   |-- (admin)/admin/  # login, dashboard, products, categories, orders,
|   |                   # kitchen, tables, promotions, reports, customers,
|   |                   # staff, settings, integrations, audit-logs
|   `-- api/            # orders, cart/validate, menu, auth, admin/*,
|                       # webhook/kasir, cron/*
|-- components/         # customer/ (BottomNav, FloatingCart,
|                       # ActiveOrderCard), admin/, shared/ (AvatarButton),
|                       # ui/
|-- lib/
|   |-- pricing.ts      # satu-satunya tempat hitung harga
|   |-- auth/           # session, argon2, totp, csrf, requireRole
|   |-- kasir/          # kasirAdapter, mapping, stub
|   `-- ratelimit.ts, qr.ts, validators.ts, env.ts, audit.ts
|-- server/             # services (termasuk markOrderPaid), jobs (outbox
|                       # worker), repositories
|-- db/                 # schema, migrations, seed
|-- public/             # brand/, icons, manifest
|-- tests/              # unit/, e2e/
|-- docs/               # KASIR_INTEGRATION.md, DEPLOYMENT.md, DECISIONS.md
|-- .env.example
`-- README.md

(Tidak ada folder lib/payment/ dan tidak ada route payment.)

==============================================================================
16. ERROR RECOVERY, DEBUGGING & CONTINUITY PROTOCOL
==============================================================================
Bagian ini WAJIB dipatuhi selama seluruh proses pengembangan, pengujian,
dan deployment. Kesalahan pada satu pendekatan tidak otomatis menggagalkan
fase atau proyek.

16.1 PRINSIP UTAMA
- Jangan langsung berhenti hanya karena satu perintah, library, API,
  migration, implementasi, atau deployment gagal.
- Prioritaskan menemukan dan memperbaiki akar masalah, bukan menyembunyikan
  pesan error atau membuat tes terlihat berhasil.
- Pertahankan seluruh progres yang sudah berhasil.
- Jangan menghapus fitur yang sudah selesai untuk mengatasi masalah fitur
  lain tanpa persetujuan pemilik.
- Jangan mengubah aturan bisnis, keamanan, harga, pembayaran, atau ruang
  lingkup tanpa persetujuan.
- Bedakan bug pada kode, kesalahan konfigurasi, keterbatasan dependency,
  gangguan jaringan, kegagalan layanan eksternal, dan akses yang belum ada.

16.2 PROSEDUR SETIAP MENEMUKAN ERROR
1. Catat pesan error lengkap, perintah, file/lokasi, langkah reproduksi,
   lingkungan, dan hasil yang diharapkan.
2. Periksa log dan kode aktual. Jangan menebak penyebab tanpa bukti.
3. Identifikasi akar masalah dan modul yang terdampak.
4. Periksa dokumentasi resmi versi library/framework/API yang benar-benar
   digunakan. Jangan mengandalkan API yang sudah usang atau tidak terbukti.
5. Buat perubahan sekecil mungkin yang memperbaiki akar masalah.
6. Jalankan ulang tes/perintah yang gagal.
7. Jalankan regression test pada modul yang terdampak dan alur yang terkait.
8. Catat hasil dan bukti. Jangan menyatakan selesai jika belum terverifikasi.

16.3 STRATEGI ALTERNATIF
Jika pendekatan pertama gagal:
- Pendekatan 1: perbaiki implementasi saat ini dan konfigurasi yang relevan.
- Pendekatan 2: gunakan metode/library/implementasi alternatif yang masih
  kompatibel dengan stack dan persyaratan proyek.
- Pendekatan 3: sederhanakan solusi teknis, tetapi pertahankan kebutuhan
  bisnis, integritas data, keamanan, dan pengalaman pengguna.
Jangan mengulang solusi yang sama tanpa perubahan dan alasan baru. Sebelum
mengganti library, layanan, database, atau arsitektur, periksa kompatibilitas,
biaya, risiko migrasi, dan dampak operasional. Perubahan besar memerlukan
persetujuan pemilik.

Jika semua pendekatan yang wajar belum berhasil:
- jangan mengarang keberhasilan atau menghapus tes;
- dokumentasikan penyebab, bukti, dan percobaan yang telah dilakukan;
- tandai BLOCKED bila membutuhkan akses, informasi, atau keputusan eksternal;
- lanjutkan pekerjaan lain yang independen dalam fase yang sedang berjalan;
- ajukan pertanyaan hanya jika keputusan pemilik benar-benar diperlukan.
Jangan melanjutkan ke fase berikutnya sebelum perintah "lanjut".

16.4 LARANGAN SAAT DEBUGGING
DILARANG:
- menghapus fitur atau mengubah perilaku bisnis tanpa persetujuan;
- mengubah tes agar selalu lulus, menghapus assertion, atau menonaktifkan
  lint/typecheck/security check untuk menyamarkan masalah;
- mengabaikan TypeScript error, migration error, atau error build;
- menonaktifkan autentikasi, authorization, CSRF, rate limit, validasi,
  audit log, atau RLS untuk mengatasi error;
- menggunakan mock/stub sebagai pengganti layanan production tanpa label
  dan persetujuan yang sesuai;
- mengarang endpoint, API, dokumentasi, atau hasil integrasi kasir;
- mencetak secret/token/password ke log atau commit;
- menjalankan DROP DATABASE, reset database production, menghapus data
  transaksi, atau force push tanpa persetujuan eksplisit.

16.5 GIT, CHECKPOINT & PEMULIHAN
- Gunakan Git sejak awal dan pertahankan branch kerja yang jelas.
- Periksa git status sebelum perubahan besar.
- Buat commit checkpoint pada kondisi stabil setelah bagian penting atau
  fase lulus. Gunakan pesan commit yang menjelaskan perubahan.
- Jangan memasukkan .env, credential, dump sensitif, atau secret ke Git.
- Sebelum refactor besar, pastikan ada checkpoint yang dapat dipulihkan.
- Jika perubahan menyebabkan regresi, gunakan diff/log Git untuk mengisolasi
  dan memulihkan bagian bermasalah tanpa membuang pekerjaan lain.
- Jangan menganggap rollback kode otomatis berarti rollback database aman.

16.6 DOKUMENTASI WAJIB
Pelihara file berikut:
- docs/KNOWN_ISSUES.md: masalah, dampak, status, dan workaround.
- docs/DECISIONS.md: keputusan teknis, alasan, alternatif, dan konsekuensi.
- docs/TEST_REPORT.md: perintah, lingkungan, hasil, tanggal, dan bukti tes.
Setiap issue mencatat deskripsi, langkah reproduksi, akar masalah (jika
teridentifikasi), solusi yang dicoba, hasil, serta pekerjaan lanjutan.
Jangan mencatat secret atau data pelanggan sensitif.

16.7 STATUS PEKERJAAN
Gunakan status:
- COMPLETED: implementasi selesai dan seluruh kriteria penerimaan yang
  relevan lulus dengan bukti.
- IN PROGRESS: masih ada pekerjaan atau pengujian yang berjalan.
- BLOCKED: membutuhkan akses, informasi, layanan eksternal, atau keputusan
  pemilik yang belum tersedia.
BLOCKED bukan berarti proyek dibatalkan. Pertahankan progres dan lanjutkan
pekerjaan independen yang memungkinkan dalam fase yang sama.

16.8 SYARAT MENYATAKAN PERBAIKAN BERHASIL
- Error awal tidak lagi muncul pada langkah reproduksi yang sama.
- Tes yang sebelumnya gagal berhasil dijalankan.
- Regression test terkait lulus.
- Build, typecheck, dan lint lulus bila relevan.
- Tidak ada penurunan keamanan, integritas data, atau perubahan bisnis yang
  tidak disetujui.
- Bukti dan keterbatasan dicatat di docs/TEST_REPORT.md.


==============================================================================
17. PRODUCTION DEPLOYMENT, VPS & POST-DEPLOYMENT
==============================================================================
Target utama deployment adalah VPS menggunakan Docker, dengan domain milik
ASIA (termasuk domain .id jika itu domain yang dipilih pemilik). Database
utama tetap Supabase PostgreSQL sesuai Bagian 4. Jangan memindahkan database
atau mengganti provider tanpa persetujuan.

17.1 KOMPONEN DEPLOYMENT
Siapkan dan dokumentasikan:
- Dockerfile multi-stage untuk build dan runtime production.
- docker-compose.yml untuk aplikasi dan worker yang memang diperlukan.
- Reverse proxy Nginx atau Caddy.
- HTTPS/SSL otomatis dan konfigurasi renewal.
- DNS domain: A/AAAA sesuai dukungan VPS, dan record lain hanya jika
  diperlukan oleh layanan yang benar-benar digunakan.
- Environment production terpisah dari development; secret disimpan di
  environment server, bukan repository atau frontend.
- Health check endpoint dan restart policy container.
- Worker/cron untuk outbox kasir dengan autentikasi CRON_SECRET.
- Logging terstruktur, rotasi log, dan monitoring resource VPS.
- Panduan deploy, update, rollback, backup, restore, dan troubleshooting.

17.2 DATABASE & MIGRASI
- Supabase PostgreSQL tetap menjadi database utama.
- Drizzle menjadi jalur migrasi schema yang terkendali dan berversi.
- Jangan menjalankan dua mekanisme migrasi yang saling bertabrakan.
- Backup sebelum perubahan schema berisiko.
- Jalankan migrasi production secara terencana dan verifikasi hasilnya.
- Jangan menjalankan seed data contoh ke production tanpa pemeriksaan;
  seed Owner dan data bisnis harus mengikuti aturan Bagian 2 dan 12.
- Jangan pernah menghapus atau mereset database production untuk memperbaiki
  masalah deployment.

17.3 VERIFIKASI SETELAH DEPLOY
Jangan menyatakan website live dan siap digunakan hanya karena container
berjalan atau halaman utama dapat dibuka. Verifikasi:
- DNS dan domain mengarah ke VPS yang benar.
- HTTPS aktif dan sertifikat valid.
- aplikasi dan health check merespons.
- koneksi Supabase production berfungsi.
- migrasi selesai dan schema sesuai.
- login Owner/Staff dan 2FA berjalan.
- QR mengarah ke domain production dan token valid.
- customer dapat melihat menu dan membuat pesanan.
- pesanan tampil di admin/KDS.
- Staff dapat menandai lunas dengan otorisasi yang benar.
- struk, laporan, dan audit log sesuai.
- worker/cron dan retry outbox berjalan.
- backup dan prosedur restore telah diuji.
- tidak ada secret yang terekspos di browser, repository, atau log.

17.4 BACKUP & RESTORE
- Dokumentasikan frekuensi, retensi, lokasi, enkripsi, dan penanggung jawab
  backup.
- Jangan menganggap backup berhasil hanya karena job selesai; periksa hasil.
- Uji restore ke lingkungan terpisah/non-production secara berkala.
- Catat waktu backup, waktu restore, dan hasil pemeriksaan integritas.
- Jangan melakukan restore yang menimpa production tanpa persetujuan
  eksplisit dan rencana pemulihan yang jelas.

17.5 ROLLBACK & INSIDEN PRODUCTION
Jika rilis baru menyebabkan gangguan:
1. Identifikasi versi, perubahan, dan dampak terhadap pelanggan/transaksi.
2. Periksa log, health check, database, dan worker.
3. Hentikan penyebaran perubahan bermasalah.
4. Pulihkan versi aplikasi stabil terakhir bila aman.
5. Periksa kompatibilitas schema sebelum rollback aplikasi.
6. Jangan melakukan rollback database destruktif secara otomatis.
7. Pastikan transaksi yang sudah tercatat tetap aman dan tidak terduplikasi.
8. Jalankan smoke test dan alur transaksi penting setelah pemulihan.
9. Dokumentasikan insiden, penyebab, dampak, dan tindakan pencegahan.

17.6 PEMELIHARAAN SETELAH GO-LIVE
- Pantau error aplikasi, uptime, CPU, RAM, disk, koneksi database, dan worker.
- Pantau antrean outbox, retry, dan kegagalan integrasi kasir.
- Periksa backup dan restore secara berkala.
- Update dependency secara terkontrol dengan tes sebelum production.
- Catat setiap perubahan production dan siapa yang menyetujuinya.
- Sediakan prosedur kontak dan penanganan jika layanan eksternal bermasalah.


==============================================================================
18. PENGUJIAN LINTAS FITUR & QUALITY GATE
==============================================================================
Selain tes unit per modul dan E2E per fase, jalankan pengujian lintas fitur
untuk membuktikan bahwa seluruh komponen utama terhubung.

18.1 SKENARIO TRANSAKSI UTAMA
Jalankan skenario end-to-end berikut di staging dengan data uji:
1. Customer memindai QR meja yang valid.
2. Sistem memvalidasi token dan mengisi lokasi meja.
3. Customer membuka menu, memilih produk/varian/add-on, dan mengisi
   keranjang.
4. Customer checkout dengan satu-satunya metode "Bayar di Kasir".
5. Server memvalidasi harga, menghitung total, dan membuat satu pesanan.
6. Pesanan muncul di admin/KDS sesuai kitchen_release_mode.
7. Staff mengubah status pesanan dan customer melihat pembaruan.
8. Staff menerima pembayaran fisik di kasir dan menandai lunas.
9. Status pembayaran, payments, dan audit log tersimpan dengan benar.
10. Customer melihat status dan membuka struk digital.
11. Owner melihat transaksi yang sesuai di laporan.
12. Uji kasus gagal: klik ganda, timeout, retry, staff tanpa izin, harga
    berubah, dan kasir eksternal tidak tersedia.

18.2 QUALITY GATE
Sebelum fase dinyatakan COMPLETED, jalankan pemeriksaan yang relevan:
- unit test;
- integration test;
- E2E/Playwright;
- lint dan typecheck;
- production build;
- pemeriksaan keamanan dan authorization;
- pemeriksaan migrasi dan integritas data;
- regression test untuk fitur yang sudah selesai.
Tidak semua tes harus diulang tanpa alasan pada setiap perubahan kecil,
tetapi semua tes yang terdampak wajib dijalankan. Fase tidak lulus jika
kriteria wajibnya gagal atau belum memiliki bukti.

18.3 FORMAT LAPORAN AKHIR SETIAP FASE
Laporkan:
- Status: COMPLETED / IN PROGRESS / BLOCKED.
- Ringkasan implementasi.
- File dibuat/diubah.
- Perintah yang dijalankan.
- Tes lulus dan gagal beserta hasil aktual.
- Bagian "Sudah diuji" dan "Belum diuji".
- Error yang ditemukan dan cara penanganannya.
- Risiko, keterbatasan, dan keputusan yang diperlukan.
- Checkpoint/commit Git yang dibuat.
Jangan mengklaim fitur atau integrasi eksternal berfungsi jika hanya diuji
menggunakan stub. Integrasi kasir asli tetap berstatus belum selesai sampai
API resmi tersedia dan benar-benar diuji.



==============================================================================
19. CLAUDE SONNET 5.5 - SESSION-AWARE WORKFLOW & CONTINUITY
==============================================================================
Bagian ini wajib digunakan ketika agen utama adalah Claude Sonnet 5.5, baik
melalui Claude Code maupun antarmuka Claude yang terhubung ke repository.
Tujuannya bukan menebak kuota akun, melainkan memastikan pekerjaan tetap aman
dan dapat dilanjutkan ketika batas penggunaan, batas konteks, atau sesi
percakapan berakhir.

19.1 PAHAMI DUA JENIS BATAS
Jangan mencampuradukkan:
A. Batas penggunaan/kuota akun: jumlah penggunaan yang tersedia dalam periode
   tertentu. Batas ini bergantung pada paket, model, panjang percakapan,
   kompleksitas proyek, file yang dibaca, dan penggunaan tools.
B. Batas konteks: banyaknya informasi yang dapat diproses dalam satu
   percakapan. Percakapan panjang, file besar, banyak diff, dan log yang
   ditempel berulang dapat menghabiskan konteks lebih cepat.

Jangan mengarang angka kuota, jumlah prompt, token, atau durasi sesi yang
dijamin. Jangan menganggap semua akun memiliki batas yang sama. Jika memakai
Claude Code, gunakan /status untuk memeriksa status penggunaan dan /context
untuk memeriksa konteks bila tersedia. Ikuti indikator dan pesan limit yang
benar-benar ditampilkan oleh akun.

19.2 ATURAN UKURAN TASK
- Satu task harus memiliki satu hasil utama yang jelas dan dapat diverifikasi.
- Default: satu task menyentuh 1-3 file utama atau satu subfitur kecil.
  Batas ini adalah pedoman, bukan larangan jika perubahan teknis memang
  membutuhkan file tambahan.
- Hindari task besar seperti "selesaikan seluruh Fase 2" atau "buat seluruh
  dashboard". Pecah menjadi implementasi kecil, tes, dan verifikasi.
- Jangan menggabungkan pekerjaan yang tidak berkaitan dalam satu sesi.
- Jangan memulai refactor besar, migrasi besar, dan fitur baru sekaligus.
- Jika task ternyata lebih besar dari perkiraan, pecah lagi sebelum mengubah
  banyak file.
- Jangan berhenti di tengah perubahan yang berisiko meninggalkan repository
  dalam keadaan rusak. Prioritaskan menyelesaikan satu unit perubahan kecil,
  menjalankan pemeriksaan minimal, lalu membuat checkpoint.
- Tidak ada target waktu, jumlah pesan, atau token tetap. Ukuran task harus
  disesuaikan dengan indikator penggunaan aktual dan kompleksitas perubahan.

19.3 URUTAN KERJA DI AWAL SETIAP SESI
Sebelum coding:
1. Baca CLAUDE.md (jika ada), docs/AI_HANDOFF.md, docs/WORK_QUEUE.md,
   docs/DECISIONS.md, dan bagian relevan dari docs/TEST_REPORT.md.
2. Jalankan git status --short dan periksa branch aktif.
3. Pastikan tidak ada perubahan lokal pemilik yang akan tertimpa.
4. Identifikasi task aktif yang belum selesai; jangan mengulang task COMPLETED.
5. Baca hanya file yang relevan dengan task. Jangan memindai atau mencetak
   seluruh repository tanpa alasan.
6. Buat rencana singkat: tujuan, file yang akan disentuh, tes yang akan
   dijalankan, dan risiko.
7. Mulai implementasi hanya setelah ruang lingkup task jelas.

Jika repository belum memiliki dokumen handoff, buat dokumen tersebut saat
Fase 0. Jangan membuat ulang dokumen yang sudah ada secara membabi buta.

19.4 PROTOKOL HEMAT KUOTA DAN KONTEKS
- Gunakan Claude Sonnet 5.5 untuk implementasi rutin, fitur, test, dan bug
  yang penyebabnya sudah cukup jelas.
- Untuk keputusan arsitektur besar atau debugging lintas modul yang kompleks,
  susun analisis terarah terlebih dahulu. Jangan melakukan eksplorasi luas
  tanpa pertanyaan teknis yang spesifik.
- Hindari meminta Claude mengulang seluruh isi spesifikasi atau merangkum
  seluruh repository pada setiap sesi.
- Jangan menempelkan file besar, lockfile, hasil build, node_modules, atau log
  panjang ke percakapan. Sebutkan path file dan minta baca bagian yang relevan.
- Jangan menjalankan perintah eksplorasi yang menghasilkan ribuan baris.
  Gunakan grep, find, sed, atau perintah terarah sesuai kebutuhan.
- Jangan membaca ulang file yang sama jika isinya belum berubah dan konteks
  yang diperlukan sudah tercatat.
- Jangan menjalankan test suite penuh berulang kali setelah setiap perubahan
  kecil. Jalankan test paling relevan dahulu; jalankan regression suite yang
  lebih luas pada checkpoint atau quality gate.
- Jangan meminta laporan panjang setelah setiap perubahan. Gunakan format
  laporan ringkas pada Bagian 19.8.
- Jangan menggunakan web search atau tools eksternal jika tidak dibutuhkan
  untuk task aktif. Untuk API/library yang belum pasti atau berubah, periksa
  dokumentasi resmi secara terarah.
- Jangan mengorbankan keamanan, validasi, kualitas tes, atau integritas data
  hanya untuk menghemat penggunaan.

19.5 PEMECAHAN FASE MENJADI TASK KECIL
Sebelum memulai fase, buat daftar task berurutan di docs/WORK_QUEUE.md.
Setiap task wajib memiliki:
- ID unik, misalnya F2-T01;
- tujuan dan hasil yang diharapkan;
- prasyarat;
- file/modul yang kemungkinan disentuh;
- tes penerimaan;
- status TODO / IN PROGRESS / COMPLETED / BLOCKED;
- catatan dependensi atau risiko.

Contoh pemecahan Fase 2 (sesuaikan setelah audit Fase 0; jangan anggap
daftar ini sebagai keputusan arsitektur final):
F2-T01: Audit kebutuhan auth, skema database, dan pilihan library auth.
F2-T02: Implementasi fondasi session dan penyimpanan token hash.
F2-T03: Login Owner/Staff dan validasi kredensial.
F2-T04: Logout, expiry, cookie aman, dan proteksi session.
F2-T05: Middleware/guard serta requireRole di server-side.
F2-T06: Halaman login dan shell/layout admin.
F2-T07: TOTP 2FA Owner dan recovery code.
F2-T08: CSRF, rate limit, dan pengujian kontrol akses.
F2-T09: Regression test, dokumentasi, dan quality gate Fase 2.

Task boleh dipecah lagi menjadi subtask jika masih terlalu besar. Jangan
memaksakan jumlah task di atas; gunakan ukuran kerja yang benar-benar kecil
dan dapat diuji.

19.6 PROTOKOL MENJELANG BATAS PENGGUNAAN ATAU AKHIR SESI
Jika indikator penggunaan mulai rendah, muncul peringatan limit, konteks
mendekati penuh, atau agen memperkirakan sesi akan berakhir:
1. Jangan memulai fitur baru atau refactor besar.
2. Selesaikan titik aman terkecil yang sedang dikerjakan.
3. Jalankan pemeriksaan minimum yang relevan. Jika belum sempat, catat dengan
   jelas bahwa pemeriksaan belum dijalankan.
4. Simpan perubahan yang valid. Jangan commit perubahan yang rusak atau
   belum dipahami hanya demi membuat checkpoint.
5. Perbarui docs/WORK_QUEUE.md dan docs/AI_HANDOFF.md.
6. Catat file yang berubah, bagian yang selesai, bagian yang belum selesai,
   error terakhir, hasil tes, dan langkah berikutnya yang spesifik.
7. Berikan satu prompt lanjutan yang siap disalin untuk sesi baru.
8. Jangan mengklaim fase selesai jika baru sebagian task yang selesai.

Jika batas tercapai mendadak dan agen tidak sempat melakukan handoff, sesi
berikutnya wajib memeriksa Git diff/status dan dokumen terakhir sebelum
melanjutkan. Jangan mengasumsikan perubahan terakhir sudah lengkap.

19.7 FORMAT DOKUMEN HANDOFF PERSISTEN
Buat dan pelihara:

A. docs/WORK_QUEUE.md
Daftar seluruh fase dan task, dengan status TODO / IN PROGRESS / COMPLETED /
BLOCKED. Perbarui hanya task yang berubah. Jangan menghapus riwayat penting.

B. docs/AI_HANDOFF.md
Isi ringkas dan selalu mutakhir:
- Proyek dan fase aktif.
- Task aktif dan status.
- Tujuan task.
- Perubahan yang sudah selesai.
- File yang dibuat/diubah.
- Perintah dan tes terakhir beserta hasil.
- Error/risiko yang masih terbuka.
- Keputusan yang sudah dibuat (rujuk DECISIONS.md).
- Langkah berikutnya yang tepat.
- Hal yang TIDAK boleh diulang atau diubah.
- Status Git: branch dan commit terakhir (jika ada).

C. docs/SESSION_LOG.md
Catatan ringkas per sesi: tanggal, task yang dikerjakan, hasil, tes,
checkpoint/commit, dan alasan sesi berakhir. Hindari menyalin seluruh
percakapan atau menyimpan secret/data pelanggan.

D. docs/TEST_REPORT.md dan docs/KNOWN_ISSUES.md
Tetap mengikuti Bagian 16. Jangan menduplikasi isi panjang; tautkan atau
rujuk bagian yang relevan.

Dokumen handoff bukan pengganti kode atau tes. Sesi baru wajib memverifikasi
kondisi repository aktual, bukan percaya sepenuhnya pada catatan sesi.

19.8 FORMAT OUTPUT RINGKAS SETIAP TASK
Di akhir setiap task, laporkan:
TASK: [ID dan nama]
STATUS: COMPLETED / IN PROGRESS / BLOCKED
HASIL: [maksimal beberapa poin]
FILE: [path file yang berubah]
TES: [perintah dan PASS/FAIL/NOT RUN]
GIT: [commit/hash atau "belum commit"]
RISIKO/BLOCKER: [jika ada]
NEXT: [satu task berikutnya]
HANDOFF: [docs/AI_HANDOFF.md sudah diperbarui: Ya/Tidak]

Jangan membuat ringkasan panjang yang mengulang spesifikasi. Berikan detail
tambahan hanya untuk error, risiko keamanan, perubahan skema, atau keputusan
yang membutuhkan persetujuan.

19.9 PENGGUNAAN /COMPACT, /CLEAR, DAN SESI BARU (CLAUDE CODE)
Jika menggunakan Claude Code dan percakapan masih aktif:
- Gunakan /compact saat konteks mulai penuh tetapi task yang sama masih perlu
  dilanjutkan. Pastikan ringkasan mempertahankan task aktif, keputusan,
  file berubah, tes, dan langkah berikutnya.
- Gunakan /clear hanya setelah handoff persisten tersimpan dan ketika memulai
  task baru yang tidak membutuhkan riwayat percakapan lama. File repository
  harus tetap menjadi sumber kesinambungan.
- Gunakan /status untuk melihat status penggunaan akun jika tersedia.
- Gunakan /context untuk memeriksa penggunaan konteks jika tersedia.
- Jangan menganggap /compact atau /clear mengembalikan kuota akun yang sudah
  terpakai; keduanya membantu pengelolaan konteks percakapan.
Jika menggunakan Claude.ai web/desktop tanpa terminal Claude Code, simpan
handoff yang sama ke repository dan mulai percakapan baru dengan prompt
lanjutan yang dibuat agen. Perintah slash Claude Code tidak berlaku di semua
antarmuka.

19.10 PROMPT LANJUTAN OTOMATIS
Di akhir task/sesi, buat prompt singkat yang merujuk ke dokumen repository.
Format yang disarankan:

"Lanjutkan proyek ASIA Car Wash & Cafe sesuai Master Prompt v5 dan kondisi
repository saat ini. Baca CLAUDE.md (jika ada), docs/AI_HANDOFF.md,
docs/WORK_QUEUE.md, serta task aktif yang dirujuk. Periksa git status dan
diff sebelum mengubah file. Jangan mengulang task COMPLETED. Kerjakan hanya
task [ID] [nama task], ikuti kriteria penerimaannya, jalankan tes relevan,
perbarui dokumen handoff, lalu berhenti. Jangan lanjut ke task/fase berikutnya
tanpa instruksi saya."

Jika sesi sebelumnya berhenti mendadak, prompt harus meminta agen memeriksa
kondisi repository dan merekonsiliasi dokumen handoff dengan Git sebelum
melanjutkan. Jika ada perbedaan, kondisi kode dan Git aktual lebih utama
daripada catatan yang sudah usang; dokumentasikan rekonsiliasinya.

19.11 KRITERIA TASK SELESAI
Satu task hanya boleh COMPLETED jika:
- hasil utama task sudah diimplementasikan;
- tes penerimaan task lulus atau alasan tes tidak dapat dijalankan dicatat;
- tidak ada error baru yang diketahui dan diabaikan;
- perubahan aman tersimpan di repository;
- work queue dan handoff diperbarui.
Jika tes wajib gagal, status tetap IN PROGRESS atau BLOCKED. Task COMPLETED
tidak otomatis berarti fase COMPLETED. Fase hanya lulus jika seluruh task
wajib di fase itu dan quality gate fase terpenuhi.
