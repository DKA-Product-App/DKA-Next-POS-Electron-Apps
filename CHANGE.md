# Riwayat Perubahan (Changelog) - 2025-12-29

## Fitur Baru (3 Hari Terakhir)
- **Tabel Transaksi Admin (Bills, Orders, Void)**:
  - Implementasi **Server-Side Pagination** (Manual) untuk menangani data besar dengan lebih efisien.
  - Penambahan **Filter Rentang Tanggal** (Start - End), default ke "Hari Ini".
  - Integrasi `MaterialReactTable` untuk standarisasi tampilan data.
- **Split Bill**: Implementasi dialog dan logika untuk memecah kuantitas item (Split Quantity) (Komit: `b1c584a` - 28 Des).

## Perbaikan (Fixes)
- **Admin Bills**: Memperbaiki masalah expand baris (Tree View) dengan manajemen state eksplisit.
- **BackWidget**: Memperbaiki `AbortError` yang terjadi saat komponen di-unmount.
- **Admin Orders**:
  - Mengganti varian `Chip` yang tidak valid (`soft`) menjadi `filled`/`outlined`.
  - Memperbarui definisi kolom agar kompatibel dengan library baru.
  - Membersihkan kode sampah yang menyebabkan error syntax.
- **Daftar Tagihan (Kasir)**: Mencegah request ganda saat memuat data dengan memvalidasi state `totalRangeActive` (Komit: `04ec8e4`).

## Refactor / Revert
- **Lingkup Kasir**: Mengembalikan sepenuhnya perubahan eksperimental pagination di `BillsListItem` dan `TransactionListItem` ke perilaku client-side semula (sesuai permintaan untuk tidak mengubah konsep awal).
