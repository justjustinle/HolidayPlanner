-- migration-v14: optional photo attachment on manual (and any) expenses.
-- Proof-of-payment / screenshot stored alongside the expense row. Receipt
-- scans remain on receipts.image_url; this column is for Log expense attaches.

alter table expenses add column if not exists image_url text;
