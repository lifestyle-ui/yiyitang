"use client";

import { useState, useEffect, useRef } from "react";
import { X, Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = { code: string; name: string; nameZh: string; container: string };
type Section = { title: string; items: Item[]; bundleCode?: string; bundleNote?: string };

// ─── Colour tokens (matching original) ───────────────────────────────────────

const SEC = { bg: "#c5d8e8", color: "#1a3a4a", borderColor: "#8ab0c8" }; // blue-grey section header

// ─── Page 1 data ──────────────────────────────────────────────────────────────

const PAGE1_LEFT: Section[] = [
  {
    title: "代謝系統",
    items: [
      { code: "1073", name: "Bio-META®\xa0*55", nameZh: "全套代謝評估(尿液) *55", container: "1*ONU(避光)" },
      { code: "1074", name: "Cellular-META®\xa0*27", nameZh: "細胞營養代謝評估(尿液) *27", container: "1*ONU(避光)" },
      { code: "1280", name: "CardioMetabolic-META®", nameZh: "心血管代謝疾病評估(血液)", container: "1*S, 2*EDTA, 1*NaF" },
      { code: "1285", name: "Lipoprotein-META®", nameZh: "脂蛋白代謝評估(血液)", container: "1*S, 1*EDTA" },
      { code: "1163", name: "LDL Subfraction Analysis", nameZh: "低密度脂蛋白亞型分析(血液)", container: "1*S" },
      { code: "1102", name: "Endothelial-META®", nameZh: "血管內皮代謝評估(血液)", container: "1*PPT" },
      { code: "1281", name: "Atherosclerosis Progression-META®", nameZh: "動脈粥樣硬化進展評估(血液&尿液)", container: "1*S, 1*PPT, 1*U" },
    ],
  },
  {
    title: "營養系統",
    items: [
      { code: "1131", name: "Oxy-META®", nameZh: "氧化壓力分析(血液&尿液)", container: "1*S,2*EDTA,2*Hep,1*¹ₒMU" },
      { code: "0808", name: "Antioxidant Vitamin Analysis", nameZh: "抗氧化維生素分析(血液)", container: "1*S, 1*EDTA, 1*Hep" },
      { code: "1436", name: "Fatty Acid-META®", nameZh: "脂肪酸代謝分析(細胞膜)", container: "1*EDTA" },
      { code: "1455", name: "Fatty Acid-META®", nameZh: "脂肪酸代謝分析(血片)", container: "1*DBS" },
      { code: "0845", name: "Amino Acid-META®", nameZh: "胺基酸分析(血液)", container: "1*Hep" },
      { code: "1119", name: "Nutrient & Toxic Elements Analysis", nameZh: "營養與毒性元素分析(血液)", container: "2*EDTA(特), 1*S(特)" },
      { code: "1120", name: "Nutrient Elements Analysis", nameZh: "營養元素分析(血液)", container: "2*EDTA(特), 1*S(特)" },
      { code: "1452", name: "Cu/Zn Balance Analysis", nameZh: "銅鋅平衡分析(血液)", container: "1*EDTA(特), 1*S(特)" },
      { code: "1437", name: "Methylation-META®", nameZh: "甲基化代謝分析(血液)", container: "1*EDTA(甲基), 1*Hep(凍)" },
      { code: "1347", name: "Histamine Analysis", nameZh: "組織胺分析(全血)", container: "1*Hep(凍)" },
      { code: "1348", name: "Kryptopyrrole Analysis", nameZh: "隱吡咯分析(尿液)", container: "1*²ₒMU(避光), 1*²ₒ" },
    ],
  },
];

const PAGE1_RIGHT: Section[] = [
  {
    title: "內分泌系統",
    items: [
      { code: "0829", name: "Thyroid Hormone Analysis", nameZh: "甲狀腺荷爾蒙分析(血液)", container: "1*S" },
      { code: "1274", name: "Stress Hormone Rhythm with CAR", nameZh: "壓力荷爾蒙節律與覺醒反應分析(唾液)", container: "6*Saliva" },
      { code: "1278", name: "Stress Hormone Rhythm Analysis", nameZh: "壓力荷爾蒙節律分析(唾液)", container: "4*Saliva" },
      { code: "1170", name: "Neurotransmitter-META®", nameZh: "神經傳導物代謝評估(尿液)", container: "1*²ₒMU(凍)" },
      { code: "1276", name: "Neuroinflammation-META®", nameZh: "神經發炎代謝評估(尿液)", container: "1*ONU(避光)" },
      { code: "1076", name: "Brain Gut Dysbiosis-META®", nameZh: "腦腸軸菌相失衡分析(尿液)", container: "1*ONU(避光)" },
      { code: "1067", name: "Male Hormone-META®", nameZh: "男性荷爾蒙評估(血液)", container: "1*S" },
      { code: "1068", name: "Premenopausal Hormone-META®", nameZh: "停經前荷爾蒙評估(血液)", container: "1*S" },
      { code: "1069", name: "Postmenopausal Hormone-META®", nameZh: "停經後荷爾蒙評估(血液)", container: "1*S" },
      { code: "1184", name: "Salivary Sex Hormone Analysis\xa0*5", nameZh: "唾液性荷爾蒙分析*5", container: "1*Saliva" },
      { code: "1066", name: "Estrogen-META®", nameZh: "雌激素代謝評估(尿液)", container: "1*ONU(避光)" },
    ],
  },
  {
    title: "環境毒素",
    items: [
      { code: "1055", name: "Xestro-TOX®", nameZh: "環境荷爾蒙分析(尿液)", container: "1*¹ₒMU(玻璃)" },
      { code: "1357", name: "Myco-TOX®", nameZh: "黴菌毒素分析(尿液)", container: "即將上市" },
      { code: "1121", name: "Toxic Elements Analysis", nameZh: "毒性元素分析(血液)", container: "1*EDTA(特)" },
      { code: "0997", name: "Pb、Hg、As、Cd、Al、Ni", nameZh: "毒性元素暴露分析(尿液) *6", container: "1*U(特)" },
      { code: "0999", name: "Toxic Element Provocation Analysis", nameZh: "毒性元素螫合分析(尿液前&後)", container: "2*U(特)" },
    ],
  },
];

// ─── Page 2 data ──────────────────────────────────────────────────────────────

const PAGE2_LEFT: Section[] = [
  {
    title: "免疫系統",
    items: [
      { code: "1187", name: "Histamine Intolerance Analysis", nameZh: "組織胺不耐症分析(血液+糞便)", container: "1*S, 1*Fe" },
      { code: "1402", name: "Acute Allergy IgE Analysis-40", nameZh: "急性分子過敏原 IgE 分析-40(血液)", container: "1*S" },
      { code: "1400", name: "Chronic Food Sensitivity IgG4 Analysis-22", nameZh: "慢性食物敏感 IgG4 分析-22(血液)", container: "1*S" },
      { code: "1401", name: "Chronic Food Sensitivity IgG4 Analysis-88", nameZh: "慢性食物敏感 IgG4 分析-88(血液)", container: "1*S" },
      { code: "1403", name: "IgE-40 + IgG4-88 Combo", nameZh: "急性分子過敏-40+慢性食物敏感 IgG4-88 分析(血液)", container: "1*S" },
      { code: "1247", name: "Gluten Sensitivity/Celiac Disease Analysis", nameZh: "麩質敏感/乳糜瀉分析(糞便)", container: "1*Fe" },
    ],
  },
  {
    title: "腸胃道系統",
    items: [
      { code: "0885", name: "SIBO Analysis", nameZh: "小腸細菌過度增生分析(呼氣)", container: "Gas" },
      { code: "1075", name: "Dysbiosis-META®", nameZh: "腸道菌相失衡分析(尿液)", container: "1*ONU(避光)" },
      { code: "0886", name: "Gut-Map®", nameZh: "腸道菌相與疾病風險分析(糞便)", container: "1*Fe(菌)" },
      { code: "1362", name: "Gut-META®\xa0(1361+1245+1244)", nameZh: "完整腸道代謝功能評估(糞便)", container: "1*Fe" },
      { code: "1361", name: "Gut Digestive-META®", nameZh: "腸道消化與代謝功能分析(糞便)", container: "1*Fe" },
      { code: "1245", name: "Gut Immunity-META®", nameZh: "腸道免疫功能分析(糞便)", container: "1*Fe" },
      { code: "1244", name: "Gut Permeability-META®", nameZh: "腸道通透性分析(糞便)", container: "1*Fe" },
      { code: "1012", name: "H. Pylori Antigen", nameZh: "胃幽門螺旋桿菌抗原分析(糞便)", container: "1*Fe" },
      { code: "0872", name: "Intestinal Permeability Analysis", nameZh: "腸道通透性分析(尿液)", container: "1*U, 1*ONU" },
    ],
  },
];

const PAGE2_RIGHT: Section[] = [
  {
    title: "表觀遺傳時鐘 / 甲基化循環基因 / 疾病預測與癌症基因",
    items: [
      { code: "1295", name: "TruAge COMPLETE", nameZh: "全套生理年齡評估", container: "1*EDTA" },
      { code: "1296", name: "TruAge PACE", nameZh: "基礎生理年齡評估", container: "1*EDTA" },
      { code: "1439", name: "Methyl Genomics®", nameZh: "甲基化循環基因分析", container: "1*EDTA" },
      { code: "1134", name: "Estro Genomics®", nameZh: "雌激素代謝基因分析", container: "1*EDTA" },
      { code: "0520", name: "ApoE Genomics®", nameZh: "脂蛋白 E 基因分析", container: "1*EDTA" },
      { code: "1133", name: "Cardio Genomics®", nameZh: "心血管基因分析", container: "1*EDTA" },
      { code: "0854", name: "Detox Genomics®", nameZh: "肝臟解毒基因分析", container: "1*EDTA" },
      { code: "0942", name: "Macular Genomics®", nameZh: "黃斑部退化基因分析", container: "1*EDTA" },
      { code: "1195", name: "Male Cancer Genomics®", nameZh: "男性癌症基因分析", container: "1*Swab" },
      { code: "1196", name: "Female Cancer Genomics®", nameZh: "女性癌症基因分析", container: "1*Swab" },
    ],
  },
];

// ─── Page 3 data (individual items) ──────────────────────────────────────────

const PAGE3_LEFT: Section[] = [
  {
    title: "脂蛋白與膽固醇代謝 / 脂蛋白數量、品質與抗氧化能力",
    items: [
      { code: "351-1", name: "Triglyceride", nameZh: "", container: "紅頭 x1" },
      { code: "352-1", name: "Cholesterol-Total", nameZh: "", container: "紅頭 x1" },
      { code: "354-1", name: "LDL-C", nameZh: "", container: "紅頭 x1" },
      { code: "318", name: "sdLDL", nameZh: "", container: "紅頭 x1" },
      { code: "317", name: "oxLDL", nameZh: "", container: "紫頭 x1" },
      { code: "355-1", name: "HDL-C", nameZh: "", container: "紅頭 x1" },
      { code: "1266", name: "HDL-C、HDL₂-C、HDL₃-C、HDL₂-C/HDL₃-C", nameZh: "", container: "紅頭 x1" },
      { code: "308", name: "PON1", nameZh: "", container: "紅頭 x1" },
      { code: "359", name: "Apo B", nameZh: "", container: "紅頭 x1" },
      { code: "358", name: "Apo A1", nameZh: "", container: "紅頭 x1" },
      { code: "363-1", name: "LP(a)", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "甲基化代謝（可任意選擇 4 項）",
    bundleCode: "1194",
    items: [
      { code: "1342", name: "Methionine", nameZh: "", container: "紫頭 x1◆" },
      { code: "364-3", name: "Homocysteine", nameZh: "", container: "紫頭 x1◆" },
      { code: "1343", name: "SAMe", nameZh: "", container: "紫頭 x1◆" },
      { code: "586", name: "Cystathionine", nameZh: "", container: "紫頭 x1◆" },
      { code: "1344", name: "SAH", nameZh: "", container: "紫頭 x1◆" },
      { code: "1345", name: "Cysteine", nameZh: "", container: "紫頭 x1◆" },
    ],
  },
  {
    title: "血管內皮代謝（可任意選擇 5 項）",
    bundleCode: "1116",
    items: [
      { code: "364-2", name: "Homocysteine", nameZh: "", container: "白頭 x1" },
      { code: "349-2", name: "Arginine", nameZh: "", container: "白頭 x1" },
      { code: "346-1", name: "MMA", nameZh: "", container: "白頭 x1" },
      { code: "583", name: "Citrulline", nameZh: "", container: "白頭 x1" },
      { code: "339", name: "5-MTHF", nameZh: "", container: "白頭 x1" },
      { code: "350-2", name: "ADMA", nameZh: "", container: "白頭 x1" },
      { code: "338", name: "UMFA", nameZh: "", container: "白頭 x1" },
      { code: "345-1", name: "SDMA", nameZh: "", container: "白頭 x1" },
      { code: "584", name: "Ornithine", nameZh: "", container: "白頭 x1" },
      { code: "1337", name: "TMAO", nameZh: "", container: "白頭 x1" },
    ],
  },
  {
    title: "血管發炎指標",
    items: [
      { code: "365-1", name: "hsCRP", nameZh: "", container: "紅頭 x1" },
      { code: "1210", name: "MPO", nameZh: "", container: "紫頭 x1" },
      { code: "1211", name: "Lp-PLA2", nameZh: "", container: "紅頭 x1" },
      { code: "366-1", name: "Fibrinogen", nameZh: "", container: "紫頭 x1" },
    ],
  },
  {
    title: "心肌損傷指標",
    items: [
      { code: "1212", name: "NT-proBNP", nameZh: "", container: "紅頭 x1" },
      { code: "1215", name: "hsTnT", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "脂肪激素 / 血糖代謝 / 糖化終產物",
    items: [
      { code: "199", name: "Adiponectin", nameZh: "", container: "紅頭 x1" },
      { code: "197", name: "Leptin", nameZh: "", container: "紅頭 x1" },
      { code: "191", name: "Insulin-AC", nameZh: "", container: "紅頭 x1" },
      { code: "380-1", name: "Glucose-AC", nameZh: "", container: "灰頭 x1" },
      { code: "381", name: "Glucose-PC", nameZh: "", container: "灰頭 x1" },
      { code: "196-1", name: "HbA1C", nameZh: "", container: "紫頭 x1" },
      { code: "1249", name: "AGEs", nameZh: "", container: "紫頭 x1" },
    ],
  },
  {
    title: "骨質代謝調控 / 維生素 D / 骨質流失標記",
    items: [
      { code: "211", name: "Intact-PTH", nameZh: "", container: "紫頭 x1" },
      { code: "213", name: "Osteocalcin", nameZh: "", container: "紫頭 x1" },
      { code: "413", name: "Ca", nameZh: "", container: "紅頭 x1" },
      { code: "212", name: "25-OHD (D2+D3)", nameZh: "", container: "紅頭 x1" },
      { code: "214", name: "β-CrossLaps", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "生長因子 / 腦下垂體荷爾蒙 / 卵巢儲備功能指標",
    items: [
      { code: "181", name: "IGF-1", nameZh: "", container: "紅頭 x1" },
      { code: "150", name: "ACTH", nameZh: "", container: "紫頭 x1" },
      { code: "120", name: "Prolactin", nameZh: "", container: "紅頭 x1" },
      { code: "121", name: "LH", nameZh: "", container: "紅頭 x1" },
      { code: "122", name: "FSH", nameZh: "", container: "紅頭 x1" },
      { code: "1341", name: "AMH", nameZh: "", container: "紅頭 x1" },
    ],
  },
];

const PAGE3_RIGHT: Section[] = [
  {
    title: "甲狀腺荷爾蒙代謝 / 自體免疫抗體",
    items: [
      { code: "106", name: "TSH", nameZh: "", container: "紅頭 x1" },
      { code: "100", name: "FT4", nameZh: "", container: "紅頭 x1" },
      { code: "101", name: "T4", nameZh: "", container: "紅頭 x1" },
      { code: "102", name: "FT3", nameZh: "", container: "紅頭 x1" },
      { code: "103", name: "T3", nameZh: "", container: "紅頭 x1" },
      { code: "104", name: "RT3", nameZh: "", container: "紅頭 x1" },
      { code: "110", name: "Anti-TG", nameZh: "", container: "紅頭 x1" },
      { code: "111", name: "Anti-TPO", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "腎上腺皮質、睪丸、卵巢荷爾蒙（可任意選擇 6 項）",
    bundleCode: "1126",
    items: [
      { code: "127-3", name: "Pregnegolone", nameZh: "", container: "紅頭 x1" },
      { code: "129-3", name: "Testosterone", nameZh: "", container: "紅頭 x1" },
      { code: "128-3", name: "Progesterone", nameZh: "", container: "紅頭 x1" },
      { code: "130-3", name: "Free Testosterone", nameZh: "", container: "紅頭 x1" },
      { code: "151-3", name: "Cortisol", nameZh: "", container: "紅頭 x1" },
      { code: "132-3", name: "DHT", nameZh: "", container: "紅頭 x1" },
      { code: "165-3", name: "Cortisone", nameZh: "", container: "紅頭 x1" },
      { code: "123-3", name: "E1", nameZh: "", container: "紅頭 x1" },
      { code: "154-3", name: "DHEA", nameZh: "", container: "紅頭 x1" },
      { code: "124-3", name: "E2", nameZh: "", container: "紅頭 x1" },
      { code: "155-3", name: "DHEA-S", nameZh: "", container: "紅頭 x1" },
      { code: "133-3", name: "SHBG", nameZh: "", container: "紅頭 x1" },
      { code: "134-3", name: "A-dione", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "唾液荷爾蒙",
    items: [
      { code: "123-5", name: "E1", nameZh: "", container: "唾液 x1" },
      { code: "124-5", name: "E2", nameZh: "", container: "唾液 x1" },
      { code: "125-5", name: "E3", nameZh: "", container: "唾液 x1" },
      { code: "128-5", name: "Progesterone", nameZh: "", container: "唾液 x1" },
      { code: "129-5", name: "Testosterone", nameZh: "", container: "唾液 x1" },
      { code: "660", name: "DHEA", nameZh: "", container: "唾液 x1" },
      { code: "1238", name: "Cortisol", nameZh: "", container: "唾液 x1" },
    ],
  },
  {
    title: "環境荷爾蒙：塑化劑 / 防腐劑 / 清潔劑（可任意選擇 5 項）",
    bundleCode: "1128",
    items: [
      { code: "1004-1", name: "MMP", nameZh: "", container: "尿液 x1" },
      { code: "1004-2", name: "MEP", nameZh: "", container: "尿液 x1" },
      { code: "1004-3", name: "MnBP", nameZh: "", container: "尿液 x1" },
      { code: "1004-4", name: "MBzP", nameZh: "", container: "尿液 x1" },
      { code: "1004-5", name: "MEHP", nameZh: "", container: "尿液 x1" },
      { code: "1005-1", name: "MP", nameZh: "", container: "尿液 x1" },
      { code: "1005-2", name: "EP", nameZh: "", container: "尿液 x1" },
      { code: "1005-3", name: "PP", nameZh: "", container: "尿液 x1" },
      { code: "1005-4", name: "BP", nameZh: "", container: "尿液 x1" },
      { code: "1006-1", name: "NP", nameZh: "", container: "尿液 x1" },
      { code: "1006-2", name: "4-t-OP", nameZh: "", container: "尿液 x1" },
      { code: "1006-3", name: "2,4-di-t-BP", nameZh: "", container: "尿液 x1" },
      { code: "1006-4", name: "BPA", nameZh: "", container: "尿液 x1" },
      { code: "1006-5", name: "Triclosan", nameZh: "", container: "尿液 x1" },
    ],
  },
  {
    title: "氧化損傷標記 / 抗氧化物 / 抗氧化酵素 / 解毒酵素",
    items: [
      { code: "314", name: "8-OHdG", nameZh: "", container: "尿液 x1" },
      { code: "1201", name: "F2-IsoPs", nameZh: "", container: "尿液 x1" },
      { code: "309", name: "MDA", nameZh: "", container: "紫頭 x1" },
      { code: "1202", name: "Nitrotyrosine", nameZh: "", container: "紫頭 x1" },
      { code: "300", name: "SOD", nameZh: "", container: "綠頭 x1" },
      { code: "302", name: "f-Thiols", nameZh: "", container: "綠頭 x1" },
      { code: "303-2", name: "t-GSH", nameZh: "", container: "綠頭 x1" },
      { code: "304", name: "GSHPx", nameZh: "", container: "紫頭 x1" },
      { code: "306", name: "GSTs", nameZh: "", container: "紫頭 x1" },
    ],
  },
];

// ─── Page 4 data ──────────────────────────────────────────────────────────────

const PAGE4_LEFT: Section[] = [
  {
    title: "抗氧化維生素 / 脂溶性維生素（可任意選擇 5 項）",
    bundleCode: "1115",
    items: [
      { code: "320-1", name: "Retinol", nameZh: "", container: "紫頭 x1" },
      { code: "326-1", name: "α-Tocopherol", nameZh: "", container: "紫頭 x1" },
      { code: "323-1", name: "β-Carotene", nameZh: "", container: "紫頭 x1" },
      { code: "325-1", name: "γ-Tocopherol", nameZh: "", container: "紫頭 x1" },
      { code: "321-1", name: "Lycopene", nameZh: "", container: "紫頭 x1" },
      { code: "324-1", name: "δ-Tocopherol", nameZh: "", container: "紫頭 x1" },
      { code: "333-1", name: "Zeaxanthin", nameZh: "", container: "紫頭 x1" },
      { code: "327-2", name: "CoQ10", nameZh: "", container: "紫頭 x1" },
      { code: "329-1", name: "Lutein", nameZh: "", container: "紫頭 x1" },
      { code: "328-1", name: "Vitamin C**", nameZh: "", container: "綠頭 x1**" },
      { code: "212", name: "25-OHD (D2+D3)*", nameZh: "", container: "紅頭 x1*" },
    ],
  },
  {
    title: "營養礦物質 / 鐵蛋白",
    items: [
      { code: "413", name: "Ca", nameZh: "", container: "紅頭 x1" },
      { code: "1350", name: "Mg、K", nameZh: "", container: "藍頭 x1★" },
      { code: "1130", name: "Na、K、Cl", nameZh: "", container: "紅頭 x1" },
      { code: "222", name: "Ferritin", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "組織胺不耐受 / 黏膜免疫 / 發炎 / 類風濕關節炎 / 急性過敏指標",
    items: [
      { code: "1335", name: "Histamine", nameZh: "", container: "糞便 x1" },
      { code: "1336", name: "DAO", nameZh: "", container: "紅頭 x1" },
      { code: "365-1", name: "hsCRP", nameZh: "", container: "紅頭 x1" },
      { code: "292", name: "RA", nameZh: "", container: "紅頭 x1" },
      { code: "1213", name: "Anti-CCP", nameZh: "", container: "紅頭 x1" },
      { code: "293", name: "IgE", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "腸道消化 / 麩質敏感 / 腸黏膜發炎、滲漏 / 胃幽門桿菌 / 潛血反應",
    items: [
      { code: "1323", name: "Anti-Gliadin sIgA", nameZh: "", container: "糞便 x1" },
      { code: "1334", name: "Anti-htTG", nameZh: "", container: "糞便 x1" },
      { code: "1214", name: "sIgA", nameZh: "", container: "糞便 x1" },
      { code: "1327", name: "Calprotectin", nameZh: "", container: "糞便 x1" },
      { code: "1012", name: "Hp-Ag", nameZh: "", container: "糞便 x1" },
      { code: "1222", name: "Hb/Hp Combo FOBT", nameZh: "", container: "糞便 x1" },
    ],
  },
  {
    title: "腫瘤生化指標",
    items: [
      { code: "243", name: "AFP", nameZh: "", container: "紅頭 x1" },
      { code: "231", name: "CEA", nameZh: "", container: "紅頭 x1" },
      { code: "232", name: "CA-19.9", nameZh: "", container: "紅頭 x1" },
      { code: "241", name: "CYFRA 21.1", nameZh: "", container: "紅頭 x1" },
      { code: "233", name: "CA-15.3", nameZh: "", container: "紅頭 x1" },
      { code: "234", name: "CA-125", nameZh: "", container: "紅頭 x1" },
      { code: "235", name: "SCC", nameZh: "", container: "紅頭 x1" },
      { code: "236", name: "PSA", nameZh: "", container: "紅頭 x1" },
      { code: "237", name: "PSA-Free", nameZh: "", container: "紅頭 x1" },
    ],
  },
  {
    title: "B 型肝炎 / C 型肝炎病毒標記",
    items: [
      { code: "813", name: "HBsAg、Anti-HBs、Anti-HCV", nameZh: "", container: "紅頭 x1" },
      { code: "251", name: "HBsAg", nameZh: "", container: "紅頭 x1" },
      { code: "252", name: "Anti-HBs", nameZh: "", container: "紅頭 x1" },
      { code: "260", name: "Anti-HCV", nameZh: "", container: "紅頭 x1" },
    ],
  },
];

const PAGE4_RIGHT: Section[] = [
  {
    title: "肝功能 / 腎功能生化指標",
    items: [
      { code: "1106", name: "Protein、Prealbumin、Albumin、Globulin、A/G ratio、Bilirubin-Total、Bilirubin-Direct、Alk-P、AST-GOT、ALT-GPT、GGT、Cystatin C", nameZh: "", container: "紅頭 x1" },
      { code: "1104", name: "BUN、Creatinine、Cystatin C、eGFR、Uric acid、Microalbumin", nameZh: "", container: "紅頭 x1 / 尿液 x1" },
      { code: "1209", name: "Prealbumin", nameZh: "", container: "紅頭 x1" },
      { code: "382", name: "Protein", nameZh: "", container: "紅頭 x1" },
      { code: "383", name: "Albumin", nameZh: "", container: "紅頭 x1" },
      { code: "1333", name: "Cystatin C", nameZh: "", container: "紅頭 x1" },
      { code: "385", name: "BUN", nameZh: "", container: "紅頭 x1" },
      { code: "386", name: "Creatinine", nameZh: "", container: "紅頭 x1" },
      { code: "388", name: "Uric Acid", nameZh: "", container: "紅頭 x1" },
      { code: "389", name: "AST-GOT", nameZh: "", container: "紅頭 x1" },
      { code: "390", name: "ALT-GPT", nameZh: "", container: "紅頭 x1" },
      { code: "391", name: "GGT", nameZh: "", container: "紅頭 x1" },
      { code: "392", name: "Alkaline-P", nameZh: "", container: "紅頭 x1" },
      { code: "393", name: "Bilirubin-Total", nameZh: "", container: "紅頭 x1" },
      { code: "394", name: "Bilirubin-Direct", nameZh: "", container: "紅頭 x1" },
      { code: "1205", name: "Microalbumin", nameZh: "", container: "尿液 x1" },
    ],
  },
  {
    title: "血液常規 + 白血球分類 / 尿液常規",
    items: [
      { code: "673", name: "CBC", nameZh: "", container: "紫頭 x1" },
      { code: "680", name: "CBC-DC", nameZh: "", container: "紫頭 x1" },
      { code: "674", name: "Urine Routine", nameZh: "", container: "尿液 x1" },
    ],
  },
];

// ─── Shared patient header ────────────────────────────────────────────────────

type PatientInfo = {
  sendUnit: string; name: string; dob: string; mrn: string;
  gender: string; sampleDate: string; sampleTime: string; reportLang: string;
  isSupplement: boolean; menstrualCycle: string; lmp: string; menopauseAge: string;
};

function PageHeader({ info, setInfo }: { info: PatientInfo; setInfo: (fn: (p: PatientInfo) => PatientInfo) => void }) {
  const cell = "border border-black px-1.5 py-1 text-[11px]";
  return (
    <div className="border border-black" style={{ borderCollapse: "collapse" }}>
      {/* Row 1 */}
      <div className="flex" style={{ borderBottom: "1px solid black" }}>
        <div className={`${cell} flex items-center gap-1 flex-1`} style={{ borderRight: "1px solid black" }}>
          <span className="font-medium whitespace-nowrap">送檢單位：</span>
          <input className="flex-1 focus:outline-none bg-transparent min-w-0 text-[11px]" value={info.sendUnit} onChange={(e) => setInfo((p) => ({ ...p, sendUnit: e.target.value }))} />
        </div>
        <div className={`${cell} flex items-center gap-1 flex-1`} style={{ borderRight: "1px solid black" }}>
          <span className="font-medium whitespace-nowrap">姓　名：</span>
          <input className="flex-1 focus:outline-none bg-transparent min-w-0 text-[11px]" value={info.name} onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className={`${cell} flex items-center gap-1`} style={{ minWidth: 200 }}>
          <span className="font-medium whitespace-nowrap">出生日期：西元</span>
          <input type="date" className="focus:outline-none bg-transparent text-[11px] w-28" value={info.dob} onChange={(e) => setInfo((p) => ({ ...p, dob: e.target.value }))} />
        </div>
      </div>
      {/* Row 2 */}
      <div className="flex" style={{ borderBottom: "1px solid black" }}>
        <div className={`${cell} flex items-center gap-1.5`} style={{ borderRight: "1px solid black", minWidth: 220 }}>
          <span className="font-medium whitespace-nowrap">報告方式：</span>
          {["繁體", "簡體", "英文"].map((l) => (
            <label key={l} className="flex items-center gap-0.5 cursor-pointer whitespace-nowrap">
              <input type="radio" name="rl" value={l} checked={info.reportLang === l} onChange={() => setInfo((p) => ({ ...p, reportLang: l }))} className="w-3 h-3" />{l}
            </label>
          ))}
        </div>
        <div className={`${cell} flex items-center gap-1 flex-1`} style={{ borderRight: "1px solid black" }}>
          <span className="font-medium whitespace-nowrap">病歷號：</span>
          <input className="flex-1 focus:outline-none bg-transparent min-w-0 text-[11px]" value={info.mrn} onChange={(e) => setInfo((p) => ({ ...p, mrn: e.target.value }))} />
        </div>
        <div className={`${cell} flex items-center gap-2 flex-1`}>
          <span className="font-medium">性別：</span>
          {[["M","男"],["F","女"]].map(([v,l]) => (
            <label key={v} className="flex items-center gap-0.5 cursor-pointer">
              <input type="radio" name="gdr" value={v} checked={info.gender === v} onChange={() => setInfo((p) => ({ ...p, gender: v }))} className="w-3 h-3" />{l}
            </label>
          ))}
          <span className="font-medium ml-2 whitespace-nowrap">採檢日期：</span>
          <input type="date" className="focus:outline-none bg-transparent text-[11px] w-24" value={info.sampleDate} onChange={(e) => setInfo((p) => ({ ...p, sampleDate: e.target.value }))} />
          <input type="time" className="focus:outline-none bg-transparent text-[11px] w-16" value={info.sampleTime} onChange={(e) => setInfo((p) => ({ ...p, sampleTime: e.target.value }))} />
          <span className="font-medium ml-1">時</span>
        </div>
      </div>
      {/* Row 3 */}
      <div className={`${cell} flex items-center gap-2`}>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={info.isSupplement} onChange={(e) => setInfo((p) => ({ ...p, isSupplement: e.target.checked }))} className="w-3 h-3" />
          <span className="font-medium">補件檢體：</span>
        </label>
        <span>近三個月每隔</span>
        <input className="w-10 border-b border-black focus:outline-none bg-transparent text-center text-[11px]" value={info.menstrualCycle} onChange={(e) => setInfo((p) => ({ ...p, menstrualCycle: e.target.value }))} />
        <span>天來經；最近來經日(LMP)：</span>
        <input className="w-16 border-b border-black focus:outline-none bg-transparent text-center text-[11px]" value={info.lmp} onChange={(e) => setInfo((p) => ({ ...p, lmp: e.target.value }))} placeholder="月/日" />
        <span>；□停經年齡：</span>
        <input className="w-10 border-b border-black focus:outline-none bg-transparent text-center text-[11px]" value={info.menopauseAge} onChange={(e) => setInfo((p) => ({ ...p, menopauseAge: e.target.value }))} />
        <span>歲</span>
      </div>
    </div>
  );
}

// ─── Section column (for pages 1-2, package items) ───────────────────────────

function PkgSection({ sec, checked, toggle }: { sec: Section; checked: Record<string, boolean>; toggle: (c: string) => void }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div className="px-2 py-0.5 text-[11px] font-bold" style={{ background: SEC.bg, color: SEC.color, border: `1px solid ${SEC.borderColor}` }}>
        {sec.title}
      </div>
      <div style={{ border: `1px solid ${SEC.borderColor}`, borderTop: "none" }}>
        {sec.items.map((item) => (
          <label key={item.code} className="flex items-start gap-1 px-2 py-0.5 cursor-pointer" style={{ borderBottom: "1px solid #ddd" }}>
            <input type="checkbox" checked={!!checked[item.code]} onChange={() => toggle(item.code)} className="mt-0.5 w-3 h-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10.5px] font-medium text-slate-700">{item.code} </span>
              <span className="text-[10.5px] text-slate-800">{item.name}</span>
              {item.nameZh && <div className="text-[10px] text-slate-600 leading-tight">{item.nameZh}</div>}
            </div>
            <span className="text-[9.5px] text-slate-500 whitespace-nowrap ml-1 flex-shrink-0">{item.container}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Section column (for pages 3-4, individual items with CODE column) ────────

function SingleSection({ sec, checked, toggle }: { sec: Section; checked: Record<string, boolean>; toggle: (c: string) => void }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div className="px-2 py-0.5 text-[10.5px] font-bold" style={{ background: SEC.bg, color: SEC.color, border: `1px solid ${SEC.borderColor}` }}>
        {sec.bundleCode && (
          <label className="inline-flex items-center gap-1 mr-1 cursor-pointer">
            <input type="checkbox" checked={!!checked[sec.bundleCode]} onChange={() => toggle(sec.bundleCode!)} className="w-3 h-3" />
            <span>□{sec.bundleCode}</span>
          </label>
        )}
        {sec.title}
      </div>
      <table className="w-full" style={{ border: `1px solid ${SEC.borderColor}`, borderTop: "none", borderCollapse: "collapse" }}>
        <tbody>
          {sec.items.map((item) => (
            <tr key={item.code} style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td className="px-1 py-0.5 w-5 text-center align-middle" style={{ borderRight: "1px solid #ddd" }}>
                <input type="checkbox" checked={!!checked[item.code]} onChange={() => toggle(item.code)} className="w-3 h-3" />
              </td>
              <td className="px-1 py-0.5 text-[10px] text-slate-500 align-middle whitespace-nowrap" style={{ borderRight: "1px solid #ddd", width: 54 }}>
                {item.code}
              </td>
              <td className="px-1 py-0.5 text-[10.5px] text-slate-800 align-middle flex-1">
                {item.name}
              </td>
              <td className="px-1 py-0.5 text-[9.5px] text-slate-500 align-middle whitespace-nowrap text-right" style={{ borderLeft: "1px solid #ddd" }}>
                {item.container}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── One A4 page ──────────────────────────────────────────────────────────────

function FormPage({ info, setInfo, leftSecs, rightSecs, checked, toggle, type, remarks, setRemarks }: {
  info: PatientInfo; setInfo: (fn: (p: PatientInfo) => PatientInfo) => void;
  leftSecs: Section[]; rightSecs: Section[];
  checked: Record<string, boolean>; toggle: (c: string) => void;
  type: "pkg" | "single";
  remarks?: string; setRemarks?: (v: string) => void;
}) {
  const Sec = type === "pkg" ? PkgSection : SingleSection;
  return (
    <div className="hanshi-page bg-white" style={{
      width: "210mm", minHeight: "297mm", padding: "10mm 10mm 8mm",
      fontFamily: "'Noto Serif TC', 'Microsoft JhengHei', sans-serif",
      fontSize: "11px", boxSizing: "border-box", pageBreakAfter: "always",
    }}>
      {/* Page title */}
      <div className="text-center font-bold mb-2" style={{ fontSize: 18, letterSpacing: "0.4em" }}>
        瀚 仕 功 能 醫 學 檢 測 申 請 單
      </div>

      {/* Patient header */}
      <div className="mb-3">
        <PageHeader info={info} setInfo={setInfo} />
      </div>

      {/* Two-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", alignItems: "start" }}>
        <div>{leftSecs.map((s) => <Sec key={s.title} sec={s} checked={checked} toggle={toggle} />)}</div>
        <div>
          {rightSecs.map((s) => <Sec key={s.title} sec={s} checked={checked} toggle={toggle} />)}
          {setRemarks !== undefined && (
            <div style={{ marginTop: 6 }}>
              <div className="px-2 py-0.5 text-[10.5px] font-bold" style={{ background: SEC.bg, color: SEC.color, border: `1px solid ${SEC.borderColor}` }}>
                備註欄：與實驗室連絡專區（請註明服用營養素／藥物或其它）
              </div>
              <textarea rows={4} className="w-full focus:outline-none resize-none text-[11px] p-1" style={{ border: `1px solid ${SEC.borderColor}`, borderTop: "none" }}
                value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1 text-[8.5px] text-slate-500" style={{ borderTop: "1px solid #bbb" }}>
        台灣 104051 台北市中山區敬業一路 2 號 17F　聯絡電話：02-8501-1298　收檢體 #156　業務諮詢 #155　檢測諮詢：#161、#162、採檢管具諮詢 #161、#162
        <br />瀚仕功能醫學研究中心／瀚仕醫事檢驗所　www.redoxfm.com　2024 年 11 月版　REDOX 版權所有
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Client = { id: string; name: string; medicalRecordNumber?: string | null; dateOfBirth?: string | null; gender?: string | null };

type HanshiSavedData = { items: { code: string }[]; info: Partial<PatientInfo> };

export default function HanshiOrderForm({ client, onClose, onRefresh, initialData, readOnly }: { client: Client; onClose: () => void; onRefresh?: () => void; initialData?: HanshiSavedData; readOnly?: boolean }) {
  const [info, setInfo] = useState<PatientInfo>(() => ({
    sendUnit: initialData?.info?.sendUnit ?? "意一堂健康管理",
    name: initialData?.info?.name ?? client.name,
    dob: initialData?.info?.dob ?? (client.dateOfBirth ? client.dateOfBirth.slice(0, 10) : ""),
    mrn: initialData?.info?.mrn ?? client.medicalRecordNumber ?? "",
    gender: initialData?.info?.gender ?? (client.gender === "male" ? "M" : client.gender === "female" ? "F" : ""),
    sampleDate: initialData?.info?.sampleDate ?? new Date().toISOString().slice(0, 10),
    sampleTime: initialData?.info?.sampleTime ?? "",
    reportLang: initialData?.info?.reportLang ?? "繁體",
    isSupplement: initialData?.info?.isSupplement ?? false,
    menstrualCycle: initialData?.info?.menstrualCycle ?? "",
    lmp: initialData?.info?.lmp ?? "",
    menopauseAge: initialData?.info?.menopauseAge ?? "",
  }));
  const [remarks1, setRemarks1] = useState("");
  const [remarks2, setRemarks2] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    initialData ? Object.fromEntries(initialData.items.map(i => [i.code, true])) : {}
  );
  const [saving, setSaving] = useState(false);
  const toggle = (code: string) => setChecked((p) => ({ ...p, [code]: !p[code] }));
  const selected = Object.values(checked).filter(Boolean).length;

  // Collect all items across all pages for lookup
  const allItems = [...PAGE1_LEFT, ...PAGE1_RIGHT, ...PAGE2_LEFT, ...PAGE2_RIGHT,
    ...PAGE3_LEFT, ...PAGE3_RIGHT, ...PAGE4_LEFT, ...PAGE4_RIGHT].flatMap((s) => [
    ...(s.bundleCode ? [{ code: s.bundleCode, name: s.title, nameZh: "", container: "" }] : []),
    ...s.items,
  ]);

  const saveToLabTests = async () => {
    const checkedItems = allItems.filter((item) => checked[item.code]);
    if (checkedItems.length === 0) { alert("請先勾選檢測項目"); return; }
    setSaving(true);
    await fetch(`/api/clients/${client.id}/lab-tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testDate: info.sampleDate,
        testType: "瀚仕功能醫學檢測申請單",
        status: "scheduled",
        findings: JSON.stringify({ items: checkedItems.map(i => ({ code: i.code, name: i.name, nameZh: i.nameZh })), info }),
      }),
    });
    setSaving(false);
    onRefresh?.();
    onClose();
  };

  const pageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const update = () => {
      const pageW = pageRef.current ? pageRef.current.offsetWidth : 870;
      setZoom(Math.min(1, (window.innerWidth - 48) / pageW));
    };
    // measure after first render (zoom=1 so we get the true width)
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #hanshi-root { display: block !important; position: static !important; overflow: visible !important; background: white !important; }
          .no-print { display: none !important; }
          .hanshi-page-wrapper { zoom: 1 !important; }
          .hanshi-page { page-break-after: always; box-shadow: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden" style={{ background: "rgba(0,0,0,0.6)" }}>
        {/* Toolbar */}
        <div className="no-print sticky top-0 z-10 flex items-center gap-3 px-4 py-2 flex-wrap" style={{ background: "#2d1f17" }}>
          <button onClick={onClose} className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm">
            <X className="w-4 h-4" /> 關閉
          </button>
          <div className="w-px h-4 bg-white/20" />
          {!readOnly && (
            <button onClick={saveToLabTests} disabled={saving}
              className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium"
              style={{ background: selected > 0 ? "#2d6a3f" : "#1a4028", color: selected > 0 ? "#fff" : "#6aaa80" }}>
              {saving ? "儲存中..." : selected > 0 ? `✓ 新增至檢測記錄 (${selected} 項)` : "新增至檢測記錄（請先勾選）"}
            </button>
          )}
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium" style={{ background: "#5c4638", color: "#fff" }}>
            <Printer className="w-4 h-4" /> 列印 / 匯出 PDF
          </button>
        </div>

        {/* Pages */}
        <div id="hanshi-root" className="flex flex-col items-center py-6 gap-4">
          {[
            <FormPage key="p1" info={info} setInfo={setInfo} leftSecs={PAGE1_LEFT} rightSecs={PAGE1_RIGHT} checked={checked} toggle={toggle} type="pkg" />,
            <FormPage key="p2" info={info} setInfo={setInfo} leftSecs={PAGE2_LEFT} rightSecs={PAGE2_RIGHT} checked={checked} toggle={toggle} type="pkg" remarks={remarks1} setRemarks={setRemarks1} />,
            <FormPage key="p3" info={info} setInfo={setInfo} leftSecs={PAGE3_LEFT} rightSecs={PAGE3_RIGHT} checked={checked} toggle={toggle} type="single" />,
            <FormPage key="p4" info={info} setInfo={setInfo} leftSecs={PAGE4_LEFT} rightSecs={PAGE4_RIGHT} checked={checked} toggle={toggle} type="single" remarks={remarks2} setRemarks={setRemarks2} />,
          ].map((page, i) => (
            <div key={i} className="hanshi-page-wrapper shadow-2xl"
              style={{ zoom: zoom < 1 ? zoom : undefined }}
              ref={i === 0 ? pageRef : undefined}>
              {page}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
