# Changelog - 2025-12-29

## Features
- **Admin Transaction Tables (Bills, Orders, Void)**: 
  - Implemented **Server-Side Pagination** (Manual Pagination) to handle large datasets efficiently.
  - Added **Date Range Filtering** (Start Date - End Date).
  - Configured default date range to **Today** (Start of Day to End of Day).
  - Integrated `MaterialReactTable` for standardized data display.

## Fixes
- **Admin Bills**: Resolved row expansion issue (Tree View) by implementing explicit `expanded` state management.
- **BackWidget**: Fixed `AbortError` (signal aborted without reason) occurring on component unmount.
- **Admin Orders**: 
  - Fixed valid `Chip` variant `soft` -> `filled`/`outlined`.
  - Refactored column definitions to be compatible with `MRT_ColumnDef`.
  - Removed residual legacy code that caused syntax errors.

## Refactor / Revert
- **Cashier Scope**: Fully reverted experimental pagination changes in `BillsListItem` and `TransactionListItem` to restore original client-side behavior.
