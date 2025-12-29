# Riwayat Perubahan (Changelog)

<details open>
<summary><strong>29 Desember 2025</strong></summary>

### Fitur Baru
- **Tabel Transaksi Admin (Bills, Orders, Void)**:
  - Implementasi **Server-Side Pagination** (Manual) untuk menangani data besar.
  - Penambahan **Filter Rentang Tanggal** (Start - End), default ke "Hari Ini".
  - Integrasi `MaterialReactTable` untuk standarisasi tampilan.

### Perbaikan (Fixes)
- **Admin Bills**: Memperbaiki masalah expand baris (Tree View) dengan manajemen state eksplisit.
- **BackWidget**: Memperbaiki `AbortError` saat komponen di-unmount.
- **Admin Orders**:
  - Mengganti varian `Chip` `soft` menjadi `filled`/`outlined` (validasi MUI).
  - Refactor definisi kolom untuk kompatibilitas tipe.
  - Menghapus kode residu yang menyebabkan error syntax.
- **Daftar Tagihan (Kasir)**: Fix request ganda saat load dengan validasi `totalRangeActive` (Komit: `04ec8e4`).

### Refactor / Revert
- **Lingkup Kasir**: Revert total perubahan pagination eksperimental di `BillsListItem` dan `TransactionListItem`.

### Git Log (Detail)
- feat: implement server-side pagination, date filtering and fix UI bugs [Commit: 9ec332e]
- fix(pos): prevent double request on bills list load by respecting totalRangeActive [Commit: 04ec8e4]
</details>

<details>
<summary><strong>28 Desember 2025</strong></summary>

### Fitur Baru
- **Split Bill**: Implementasi dialog dan logika `Split Quantity` pada item transaksi (Komit: `b1c584a`).

### Git Log (Detail)
- feat: implement split quantity dialog and logic [Commit: b1c584a]
</details>
