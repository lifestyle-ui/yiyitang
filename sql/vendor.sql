-- 廠商 / 合作夥伴
create table if not exists "Vendor" (
  id text primary key,
  name text not null,                 -- 廠商名稱
  category text,                      -- 類型：診所 / 檢驗所 / 供應商 / 其他
  "contactPerson" text,               -- 聯絡窗口姓名
  "contactTitle" text,                -- 窗口職稱
  phone text,
  "lineId" text,
  email text,
  address text,
  cooperation text,                   -- 合作方式
  "bookingFlow" text,                 -- 預約流程
  notes text,                         -- 備註
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
