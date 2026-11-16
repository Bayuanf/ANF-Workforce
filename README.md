# ANF Workforce — Human Resource Management System

**PT ANF Group** | Versi 1.0 (Web-based Enterprise)

ANF Workforce adalah sistem informasi pengelolaan sumber daya manusia terpadu. Sistem ini mencakup manajemen data karyawan, pencatatan kehadiran berbasis simulasi fingerprint (CSV/Excel), pendeteksian keterlambatan otomatis, pengajuan dan persetujuan cuti/izin/lembur, pengelolaan penggajian, akses slip gaji, serta pencatatan audit log.

---

## 1. Identitas Produk & Rebranding

- **Nama Perusahaan:** PT ANF Group
- **Nama Sistem:** ANF Workforce
- **Deskripsi:** Human Resource Management System
- **Tahun:** 2026

### Halaman Login (Split-Screen)

- **Sisi Kiri (Desktop):**
  - Identitas PT ANF GROUP dan ANF Workforce.
  - Background visual abstrak geometris berbasis SVG dengan animasi interaktif.
  - Mendukung aksesibilitas `prefers-reduced-motion: reduce`.
- **Sisi Kanan:**
  - Panel login dengan desain minimalis.
  - Input username atau email dan kata sandi.
  - Fitur tampil/sembunyikan kata sandi.
- **Responsivitas:**
  - Layout menyesuaikan perangkat desktop dan mobile (Android & iPhone).

---

## 2. Akses Sistem

Aplikasi menyediakan halaman autentikasi untuk membatasi akses berdasarkan peran pengguna. Kredensial akun demo tidak dipublikasikan pada repository ini.

---

## 3. Menjalankan Aplikasi & Pengujian

Aplikasi berjalan pada port default 3000:

`http://localhost:3000`

Perintah verifikasi:

```bash
# Verifikasi kepatuhan PRD Revisi ANF Workforce
node scripts/verify_rebranding.js

# Verifikasi fungsi reset & autentikasi
node scripts/verify_reset_and_redesign.js
```