import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "yyyy/MM/dd", { locale: zhTW });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "yyyy/MM/dd HH:mm", { locale: zhTW });
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhTW });
}

export function calculateAge(birthDate: Date | string | null | undefined) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "待處理",
  in_progress: "進行中",
  done: "已完成",
  scheduled: "已安排",
  completed: "已完成",
  cancelled: "已取消",
  active: "有效",
  expired: "已過期",
  refilled: "已補充",
  paused: "暫停",
  suggested: "建議中",
  quoted: "已報價",
  sampled: "已採檢",
  waiting: "等待報告",
  report_received: "已收到報告",
  doctor_interpreted: "醫師已判讀",
  staff_explained: "健管師已解說",
};

export const CATEGORY_LABELS: Record<string, string> = {
  follow_up: "追蹤",
  lab_test: "檢測",
  prescription_refill: "保健品補充",
  consultation: "諮詢",
};
