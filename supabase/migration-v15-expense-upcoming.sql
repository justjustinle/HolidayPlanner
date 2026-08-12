-- migration-v15: optional "upcoming payment" on expenses.
-- When is_upcoming and payment_date is still in the future, the expense is
-- excluded from balance / spend calculations (evaluated at read time).

alter table expenses
  add column if not exists is_upcoming boolean not null default false;

alter table expenses
  add column if not exists payment_date date;
