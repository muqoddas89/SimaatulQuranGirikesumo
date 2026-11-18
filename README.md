# Website Informasi Donasi Simaatul Qur'an Girikesumo 2027

Website statis untuk **GitHub Pages**, dengan API read-only berbasis **Google Apps Script** dan database asli **Google Sheets**. Tiga kategori dipisahkan: Aghniya (umum), Air Mineral, Donasi Warga/RT (6 RW).

## Google Sheets yang sudah dibuat

https://docs.google.com/spreadsheets/d/1bMjfQNxCt-stzNBv66nAI96ETsXLzOpnDDOUcqxrq_g/edit

Sheet yang digunakan persis: `DONASI_AGHNIYA`, `DONASI_AIR`, `DONASI_WARGA_RT`, `MASTER_RT`. Sheet tambahan `REKAP` dan `PANDUAN` tetap ada.

### 1 — Masukkan data
- Gunakan tanggal asli Google Sheets (bukan string bebas).
- Isikan `ID Transaksi` unik, nama donatur yang diizinkan untuk publikasi, nilai nominal atau jumlah air.
- Gunakan dropdown status **Terverifikasi** supaya transaksi masuk ke laporan. Status Menunggu/Ditolak tidak ikut ditampilkan.
- Air hanya dihitung menjadi total dus ketika `Satuan` tepat `Dus`; transaksi unit lain tetap terlihat di tabel dan tidak dipaksa menjadi dus.
- Donasi warga harus memiliki `RW` seperti `RW 01` dan `RT` seperti `RT 03`. Enam RW sudah disiapkan; masukkan daftar RT yang benar ke `MASTER_RT`.
- Jangan memasukkan data pribadi sensitif yang tidak untuk publik; nama donatur/penyetor di tiga sheet akan tersedia lewat API publik setelah diverifikasi. Gunakan 'Hamba Allah' bila anonim.

### 2 — Pasang Apps Script (WAJIB sekali)
1. Buka spreadsheet pada tautan di atas, pilih **Ekstensi → Apps Script**.
2. Hapus kode standar `Code.gs`, lalu **tempel SELURUH isi file `google-apps-script/Code.gs`** dari paket ini. Simpan.
3. Pilih fungsi `testPublicData`, klik Run/Jalankan, lalu berikan persetujuan akses ketika diminta. Log harus berisi `ok:true`.
4. Pilih **Deploy → New deployment → Select type: Web app**.
5. Pada `Execute as`, pilih **Me** (pemilik spreadsheet). Pada `Who has access`, pilih **Anyone** supaya pengunjung tidak perlu login; akses ini hanya membuka data publik yang telah diverifikasi. Akun organisasi tertentu bisa membatasi pilihan ini.
6. Klik Deploy, salin **Web app URL** yang berakhir `/exec`.
7. Edit file **`config.js`** pada repository GitHub. Isikan:

```js
window.DONATION_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycb.../exec',
  apiTimeoutMs: 15000,
  pageSize: 8,
  refreshMs: 120000
};
```

Jangan menggunakan URL editor Apps Script atau URL `/dev`. Gunakan URL Web App `/exec`. Setelah memperbarui kode Apps Script, pilih **Deploy → Manage deployments → Edit → New version → Deploy** agar perubahan backend aktif.

### 3 — Unggah ke GitHub Pages
1. Buat repository publik misalnya `donasi-girikesumo-2027` pada GitHub.
2. Unggah `index.html`, `styles.css`, `app.js`, `config.js`, seluruh folder `assets`, dan `.nojekyll` ke root repository. Folder `google-apps-script` dan `data` boleh ikut sebagai dokumentasi, tetapi **jangan menyimpan data donatur sensitif di repository**.
3. Pada **Settings → Pages**, pilih **Deploy from a branch**, branch `main`, folder `/(root)` lalu Save.
4. Akses halaman `https://NAMA-AKUN.github.io/donasi-girikesumo-2027/`.
5. Tes data dengan mengisi satu transaksi contoh di Google Sheets lalu beri status Terverifikasi, pastikan muncul di situs. Hapus transaksi uji setelahnya.

### 4 — Perilaku koneksi
- Sebelum API diatur, tampilan tetap tersedia dengan total **Rp 0 / 0 Dus** serta pesan 'Koneksi belum aktif'. **Tidak ada data donatur atau nominal simulasi yang menyamar sebagai data nyata.**
- Setelah API aktif, data ditarik saat halaman dibuka dan diperbarui setiap 2 menit (jika tab tetap terbuka).
- Jika koneksi gagal, dashboard menampilkan peringatan. Jika sempat memuat data sebelumnya, data terakhir di sesi itu tetap terlihat dengan label peringatan; tidak ada angka fiktif sebagai pengganti.
- Hanya transaksi `Terverifikasi` yang dikirim API. `REKAP` sheet dan website memakai logika yang sejalan.

### Keamanan dan batasan
- Deployment `Anyone` membuat data yang dikeluarkan API dapat diakses oleh masyarakat umum, bukan hanya lewat antarmuka website. Pastikan panitia menyetujui nama yang ditampilkan sebelum verifikasi.
- Script dijalankan atas nama pemilik Google Sheets (Execute as Me) tetapi hanya menjalankan fungsi baca di API publik. Jangan menambahkan operasi tulis tanpa autentikasi yang tepat.
- GitHub Pages dan Apps Script memiliki kuota/batas pemakaian. Jika kebutuhan sangat besar, gunakan backend berbasis autentikasi dan caching yang lebih terkelola.
- Data bukan real-time detik-ke-detik; pembaruan memerlukan pemuatan/refresh, dan batas cache serta jeda dapat berlaku.
