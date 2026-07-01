import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_CYCLE_STEPS: Record<string, string[]> = {
  "初診諮詢": [
    "§ 初診階段",
    "問卷收集",
    "安排諮詢時間",
    "諮詢當天：完成諮詢記錄",
    "醫師確認診斷與治療方向",
  ],
  "檢測": [
    "§ 檢測安排",
    "提供檢測報價",
    "預約檢測時間",
    "檢體採集衛教",
    "採集當天：確認狀況、完成採集",
    "§ 等待報告",
    "確認檢體送出",
    "等待報告產出",
    "§ 報告解析",
    "預約報告解析時間",
    "報告解析諮詢",
    "醫師開立後續計畫",
  ],
  "健康計畫": [
    "§ 出貨作業",
    "提供保健品報價",
    "產品打包與寄送",
    "確認客戶收到保健品",
    "§ 追蹤關懷",
    "第1週追蹤關懷",
    "第3週追蹤關懷",
    "§ 後續安排",
    "預約下次回診",
  ],
  "AMD": [],
  "排毒10天": [
    "§ 前置作業",
    "INBODY 測量（開始前）",
    "說明十天飲食原則及禁忌食物",
    "確認保健品備齊（UltraClear Plus pH／MSM／綠藻錠／Liver Protect）",
    "§ Day 1–2｜初始期",
    "飲食：遵循基本飲食及烹調原則",
    "保健品：UltraClear Plus pH 早晚各1匙、MSM 早晚各3顆、綠藻錠 早晚各15顆、Liver Protect 早晚各1顆",
    "追蹤：確認排毒反應（頭暈、疲倦、口氣、情緒等）",
    "§ Day 3–4｜限制期",
    "飲食：主食限馬鈴薯／南瓜／地瓜／山藥／青豆仁；蛋白質限鱸魚／鱈魚／鮭魚／草魚／鯖魚",
    "保健品：UltraClear Plus pH Day3早晚各1匙、Day4晚飯後各2匙，其餘同上",
    "§ Day 5–7｜深度排毒期",
    "飲食：不可吃主食；水果限蘋果／梨，份數增為3份",
    "保健品：UltraClear Plus pH 早晚各4匙，其餘同上",
    "追蹤：確認飲食執行狀況與排毒反應",
    "§ Day 8｜過渡期",
    "飲食：放寬水果種類；主食限白米／馬鈴薯／南瓜／地瓜／山藥／青豆仁",
    "保健品：UltraClear Plus pH 早午晚各2匙，其餘同上",
    "§ Day 9–10｜收尾期",
    "飲食：同 Day 1–2 原則",
    "保健品：UltraClear Plus pH 早晚各2匙（Day10可補足空腹份量），其餘同上",
    "§ 療程結束",
    "INBODY 測量（結束）",
    "追蹤關懷：確認整體感受與身體變化",
    "預約回診",
  ],
  "回診": [
    "§ 回診流程",
    "Gather 收集",
    "Tell 重述",
    "Order 排序",
    "Initiate 啟動",
    "Track 追蹤",
  ],
};

type StepTemplate = {
  label: string;
  role?: string | null;
  deliverable?: string | null;
  isKeyOutput?: boolean;
  defaultOffset?: string | null;
  hasDueTracking?: boolean;
};

async function getStepsForType(type: string): Promise<StepTemplate[]> {
  // 1. Check CycleTypeStep (rich templates)
  const { data: richSteps } = await supabase
    .from("CycleTypeStep")
    .select("label, role, deliverable, isKeyOutput, defaultOffset, hasDueTracking")
    .eq("cycleType", type)
    .order("sortOrder", { ascending: true });
  if (richSteps && richSteps.length > 0) return richSteps;

  // 2. Fall back to OptionConfig (legacy)
  const { data: optSteps } = await supabase
    .from("OptionConfig")
    .select("label")
    .eq("category", `cycleStep_${type}`)
    .order("sortOrder", { ascending: true });
  if (optSteps && optSteps.length > 0) return optSteps.map((r) => ({ label: r.label }));

  // 3. Fall back to hardcoded defaults
  return (DEFAULT_CYCLE_STEPS[type] ?? DEFAULT_CYCLE_STEPS["回診"]).map((label) => ({ label }));
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  const { data: cycles, error } = await supabase
    .from("VisitCycle")
    .select("*, steps:VisitCycleStep(*)")
    .eq("clientId", id)
    .order("startDate", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (cycles || []).map((c) => ({
    ...c,
    steps: (c.steps || []).sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder),
  }));

  return NextResponse.json(result);
}

function parseOffset(startDate: Date, offset: string | null | undefined): string | null {
  if (!offset) return null;
  const match = offset.match(/^\+(\d+)([dw])$/);
  if (!match) return null;
  const n = parseInt(match[1]);
  const days = match[2] === "w" ? n * 7 : n;
  const d = new Date(startDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { type, notes, customSteps } = await req.json();
  const steps = customSteps && Array.isArray(customSteps) && customSteps.length > 0
    ? customSteps
    : await getStepsForType(type);
  const now = new Date().toISOString();
  const startDate = new Date();
  const cycleId = crypto.randomUUID();

  const { error: ce } = await supabase
    .from("VisitCycle")
    .insert({ id: cycleId, clientId: id, type, status: "active", startDate: now, createdAt: now, notes: notes ?? null });

  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 });

  const { error: se } = await supabase.from("VisitCycleStep").insert(
    steps.map((step, i) => ({
      id: crypto.randomUUID(),
      cycleId,
      label: step.label,
      sortOrder: i,
      status: "pending",
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      role: step.role ?? null,
      deliverable: step.deliverable ?? null,
      isKeyOutput: step.isKeyOutput ?? false,
      deliverableDone: false,
      defaultOffset: step.defaultOffset ?? null,
      hasDueTracking: step.hasDueTracking ?? false,
      dueDate: step.hasDueTracking ? parseOffset(startDate, step.defaultOffset) : null,
    }))
  );

  if (se) return NextResponse.json({ error: se.message }, { status: 500 });

  const { data } = await supabase
    .from("VisitCycle")
    .select("*, steps:VisitCycleStep(*)")
    .eq("id", cycleId)
    .single();

  return NextResponse.json(data, { status: 201 });
}
