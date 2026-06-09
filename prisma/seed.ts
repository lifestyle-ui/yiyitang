import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 建立示範客戶
  const client = await prisma.client.upsert({
    where: { id: "demo-client-001" },
    update: {},
    create: {
      id: "demo-client-001",
      name: "陳小明",
      gender: "男",
      birthDate: new Date("1980-05-15"),
      phone: "0912-345-678",
      email: "chen@example.com",
      lineId: "chen_ming",
      occupation: "工程師",
      referralSource: "朋友介紹",
      notes: "有家族性高血壓病史",
    },
  });

  // 示範諮詢記錄
  await prisma.consultation.create({
    data: {
      clientId: client.id,
      date: new Date("2026-05-20"),
      chiefComplaint: "疲勞、睡眠品質差",
      content: "客戶表示近3個月來容易疲勞，晚上入睡困難，白天精神不佳。工作壓力大，每天加班至23點。",
      doctorAdvice: "建議檢測腎上腺功能與皮質醇節律，同時補充鎂與B群。",
      nextSteps: "安排功能醫學檢測，下次回診看報告。",
    },
  });

  // 示範任務
  await prisma.task.create({
    data: {
      clientId: client.id,
      title: "提醒陳小明回診看檢測報告",
      dueDate: new Date("2026-06-15"),
      priority: "high",
      category: "follow_up",
      description: "上次安排了腎上腺功能檢測，需要追蹤結果",
    },
  });

  await prisma.task.create({
    data: {
      clientId: client.id,
      title: "確認保健品是否快用完",
      dueDate: new Date("2026-06-10"),
      priority: "medium",
      category: "prescription_refill",
    },
  });

  console.log("✅ Seed 資料建立完成");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
