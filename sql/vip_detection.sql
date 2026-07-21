-- VIP 年度檢測進度追蹤
create table if not exists "VipDetection" (
  id text primary key,
  "clientId" text references "Client"(id) on delete cascade,
  "clientName" text not null,
  "monthNum" int not null,                 -- 1..12 排序用
  month text not null,                     -- "1月"
  "packageType" text not null,             -- "檢測 (大)" 等
  items text,                              -- JSON: [{code,name}]
  "scheduledDate" date,                    -- 預約日期
  "kitSentAt" timestamptz,                 -- ① 寄管具
  "sampleCollectedAt" timestamptz,         -- ② 檢體回收
  "sentToLabAt" timestamptz,               -- ③ 送檢
  "completedAt" timestamptz,               -- ④ 完成
  "reportExplainedAt" timestamptz,         -- 報告解說
  notes text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "VipDetection_client_idx" on "VipDetection" ("clientId");
create index if not exists "VipDetection_month_idx" on "VipDetection" ("monthNum");
