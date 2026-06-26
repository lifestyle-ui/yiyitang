"use client";

import { useState } from "react";
import { X, Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckItem = { code: string; name: string; nameEn?: string; container: string; note?: string };
type Section = { title: string; items: CheckItem[]; bundleCode?: string };

// ─── Page 1 & 2 data: 套組型 ──────────────────────────────────────────────────

const SECTIONS_PACKAGE: Section[] = [
  {
    title: "代謝系統",
    items: [
      { code: "1073", name: "Bio-META® *55\n全套代謝評估(尿液) *55", container: "1*ONU(避光)" },
      { code: "1074", name: "Cellular-META® *27\n細胞營養代謝評估(尿液) *27", container: "1*ONU(避光)" },
      { code: "1280", name: "CardioMetabolic-META®\n心血管代謝疾病評估(血液)", container: "1*S, 2*EDTA, 1*NaF" },
      { code: "1285", name: "Lipoprotein-META®\n脂蛋白代謝評估(血液)", container: "1*S, 1*EDTA" },
      { code: "1163", name: "LDL Subfraction Analysis\n低密度脂蛋白亞型分析(血液)", container: "1*S" },
      { code: "1102", name: "Endothelial-META®\n血管內皮代謝評估(血液)", container: "1*PPT" },
      { code: "1281", name: "Atherosclerosis Progression-META®\n動脈粥樣硬化進展評估(血液&尿液)", container: "1*S, 1*PPT, 1*U" },
    ],
  },
  {
    title: "營養系統",
    items: [
      { code: "1131", name: "Oxy-META®\n氧化壓力分析(血液&尿液)", container: "1*S, 2*EDTA, 2*Hep, 1*¹ₒMU" },
      { code: "0808", name: "Antioxidant Vitamin Analysis\n抗氧化維生素分析(血液)", container: "1*S, 1*EDTA, 1*Hep" },
      { code: "1436", name: "Fatty Acid-META®\n脂肪酸代謝分析(細胞膜)", container: "1*EDTA" },
      { code: "1455", name: "Fatty Acid-META®\n脂肪酸代謝分析(血片)", container: "1*DBS" },
      { code: "0845", name: "Amino Acid-META®\n胺基酸分析(血液)", container: "1*Hep" },
      { code: "1119", name: "Nutrient & Toxic Elements Analysis\n營養與毒性元素分析(血液)", container: "2*EDTA(特), 1*S(特)" },
      { code: "1120", name: "Nutrient Elements Analysis\n營養元素分析(血液)", container: "2*EDTA(特), 1*S(特)" },
      { code: "1452", name: "Cu/Zn Balance Analysis\n銅鋅平衡分析(血液)", container: "1*EDTA(特), 1*S(特)" },
      { code: "1437", name: "Methylation-META®\n甲基化代謝分析(血液)", container: "1*EDTA(甲基), 1*Hep(凍)" },
      { code: "1347", name: "Histamine Analysis\n組織胺分析(全血)", container: "1*Hep(凍)" },
      { code: "1348", name: "Kryptopyrrole Analysis\n隱吡咯分析(尿液)", container: "1*²ₒMU(避光), 1*²ₒ" },
    ],
  },
  {
    title: "內分泌系統",
    items: [
      { code: "0829", name: "Thyroid Hormone Analysis\n甲狀腺荷爾蒙分析(血液)", container: "1*S" },
      { code: "1274", name: "Stress Hormone Rhythm with CAR\n壓力荷爾蒙節律與覺醒反應分析(唾液)", container: "6*Saliva" },
      { code: "1278", name: "Stress Hormone Rhythm Analysis\n壓力荷爾蒙節律分析(唾液)", container: "4*Saliva" },
      { code: "1170", name: "Neurotransmitter-META®\n神經傳導物代謝評估(尿液)", container: "1*²ₒMU(凍)" },
      { code: "1276", name: "Neuroinflammation-META®\n神經發炎代謝評估(尿液)", container: "1*ONU(避光)" },
      { code: "1076", name: "Brain Gut Dysbiosis-META®\n腦腸軸菌相失衡分析(尿液)", container: "1*ONU(避光)" },
      { code: "1067", name: "Male Hormone-META®\n男性荷爾蒙評估(血液)", container: "1*S" },
      { code: "1068", name: "Premenopausal Hormone-META®\n停經前荷爾蒙評估(血液)", container: "1*S" },
      { code: "1069", name: "Postmenopausal Hormone-META®\n停經後荷爾蒙評估(血液)", container: "1*S" },
      { code: "1184", name: "Salivary Sex Hormone Analysis *5\n唾液性荷爾蒙分析*5", container: "1*Saliva" },
      { code: "1066", name: "Estrogen-META®\n雌激素代謝評估(尿液)", container: "1*ONU(避光)" },
    ],
  },
  {
    title: "環境毒素",
    items: [
      { code: "1055", name: "Xestro-TOX®\n環境荷爾蒙分析(尿液)", container: "1*¹ₒMU(玻璃)" },
      { code: "1357", name: "Myco-TOX®\n黴菌毒素分析(尿液)", container: "即將上市" },
      { code: "1121", name: "Toxic Elements Analysis\n毒性元素分析(血液)", container: "1*EDTA(特)" },
      { code: "0997", name: "Pb、Hg、As、Cd、Al、Ni\n毒性元素暴露分析(尿液) *6", container: "1*U(特)" },
      { code: "0999", name: "Toxic Element Provocation Analysis\n毒性元素螫合分析(尿液前&後)", container: "2*U(特)" },
    ],
  },
  {
    title: "免疫系統",
    items: [
      { code: "1187", name: "Histamine Intolerance Analysis\n組織胺不耐症分析(血液+糞便)", container: "1*S, 1*Fe" },
      { code: "1402", name: "Acute Allergy IgE Analysis-40\n急性分子過敏原 IgE 分析-40(血液)", container: "1*S" },
      { code: "1400", name: "Chronic Food Sensitivity IgG4 Analysis-22\n慢性食物敏感 IgG4 分析-22(血液)", container: "1*S" },
      { code: "1401", name: "Chronic Food Sensitivity IgG4 Analysis-88\n慢性食物敏感 IgG4 分析-88(血液)", container: "1*S" },
      { code: "1403", name: "IgE-40 + IgG4-88 Combo\n急性分子過敏-40+慢性食物敏感 IgG4-88 分析(血液)", container: "1*S" },
      { code: "1247", name: "Gluten Sensitivity/Celiac Disease Analysis\n麩質敏感/乳糜瀉分析(糞便)", container: "1*Fe" },
    ],
  },
  {
    title: "腸胃道系統",
    items: [
      { code: "0885", name: "SIBO Analysis\n小腸細菌過度增生分析(呼氣)", container: "Gas" },
      { code: "1075", name: "Dysbiosis-META®\n腸道菌相失衡分析(尿液)", container: "1*ONU(避光)" },
      { code: "0886", name: "Gut-Map®\n腸道菌相與疾病風險分析(糞便)", container: "1*Fe(菌)" },
      { code: "1362", name: "Gut-META® (1361+1245+1244)\n完整腸道代謝功能評估(糞便)", container: "1*Fe" },
      { code: "1361", name: "Gut Digestive-META®\n腸道消化與代謝功能分析(糞便)", container: "1*Fe" },
      { code: "1245", name: "Gut Immunity-META®\n腸道免疫功能分析(糞便)", container: "1*Fe" },
      { code: "1244", name: "Gut Permeability-META®\n腸道通透性分析(糞便)", container: "1*Fe" },
      { code: "1012", name: "H. Pylori Antigen\n胃幽門螺旋桿菌抗原分析(糞便)", container: "1*Fe" },
      { code: "0872", name: "Intestinal Permeability Analysis\n腸道通透性分析(尿液)", container: "1*U, 1*ONU" },
    ],
  },
  {
    title: "表觀遺傳時鐘 / 甲基化循環基因 / 疾病預測與癌症基因",
    items: [
      { code: "1295", name: "TruAge COMPLETE\n全套生理年齡評估", container: "1*EDTA" },
      { code: "1296", name: "TruAge PACE\n基礎生理年齡評估", container: "1*EDTA" },
      { code: "1439", name: "Methyl Genomics®\n甲基化循環基因分析", container: "1*EDTA" },
      { code: "1134", name: "Estro Genomics®\n雌激素代謝基因分析", container: "1*EDTA" },
      { code: "0520", name: "ApoE Genomics®\n脂蛋白 E 基因分析", container: "1*EDTA" },
      { code: "1133", name: "Cardio Genomics®\n心血管基因分析", container: "1*EDTA" },
      { code: "0854", name: "Detox Genomics®\n肝臟解毒基因分析", container: "1*EDTA" },
      { code: "0942", name: "Macular Genomics®\n黃斑部退化基因分析", container: "1*EDTA" },
      { code: "1195", name: "Male Cancer Genomics®\n男性癌症基因分析", container: "1*Swab" },
      { code: "1196", name: "Female Cancer Genomics®\n女性癌症基因分析", container: "1*Swab" },
    ],
  },
];

// ─── Page 3 & 4 data: 單項型 ──────────────────────────────────────────────────

const SECTIONS_SINGLE: Section[] = [
  {
    title: "脂蛋白與膽固醇代謝 / 脂蛋白數量、品質與抗氧化能力",
    items: [
      { code: "351-1", name: "Triglyceride", container: "紅頭 x1" },
      { code: "352-1", name: "Cholesterol-Total", container: "紅頭 x1" },
      { code: "354-1", name: "LDL-C", container: "紅頭 x1" },
      { code: "318", name: "sdLDL", container: "紅頭 x1" },
      { code: "317", name: "oxLDL", container: "紫頭 x1" },
      { code: "355-1", name: "HDL-C", container: "紅頭 x1" },
      { code: "1266", name: "HDL-C、HDL2-C、HDL3-C、HDL2-C/HDL3-C", container: "紅頭 x1" },
      { code: "308", name: "PON1", container: "紅頭 x1" },
      { code: "359", name: "Apo B", container: "紅頭 x1" },
      { code: "358", name: "Apo A1", container: "紅頭 x1" },
      { code: "363-1", name: "LP(a)", container: "紅頭 x1" },
    ],
  },
  {
    title: "甲基化代謝（可任意選擇 4 項）",
    bundleCode: "1194",
    items: [
      { code: "1342", name: "Methionine", container: "紫頭 x1◆" },
      { code: "1343", name: "SAMe", container: "紫頭 x1◆" },
      { code: "1344", name: "SAH", container: "紫頭 x1◆" },
      { code: "364-3", name: "Homocysteine", container: "紫頭 x1◆" },
      { code: "586", name: "Cystathionine", container: "紫頭 x1◆" },
      { code: "1345", name: "Cysteine", container: "紫頭 x1◆" },
    ],
  },
  {
    title: "血管內皮代謝（可任意選擇 5 項）",
    bundleCode: "1116",
    items: [
      { code: "364-2", name: "Homocysteine", container: "白頭 x1" },
      { code: "346-1", name: "MMA", container: "白頭 x1" },
      { code: "339", name: "5-MTHF", container: "白頭 x1" },
      { code: "338", name: "UMFA", container: "白頭 x1" },
      { code: "584", name: "Ornithine", container: "白頭 x1" },
      { code: "349-2", name: "Arginine", container: "白頭 x1" },
      { code: "583", name: "Citrulline", container: "白頭 x1" },
      { code: "350-2", name: "ADMA", container: "白頭 x1" },
      { code: "345-1", name: "SDMA", container: "白頭 x1" },
      { code: "1337", name: "TMAO", container: "白頭 x1" },
    ],
  },
  {
    title: "血管發炎指標",
    items: [
      { code: "365-1", name: "hsCRP", container: "紅頭 x1" },
      { code: "1210", name: "MPO", container: "紫頭 x1" },
      { code: "1211", name: "Lp-PLA2", container: "紅頭 x1" },
      { code: "366-1", name: "Fibrinogen", container: "紫頭 x1" },
    ],
  },
  {
    title: "心肌損傷指標",
    items: [
      { code: "1212", name: "NT-proBNP", container: "紅頭 x1" },
      { code: "1215", name: "hsTnT", container: "紅頭 x1" },
    ],
  },
  {
    title: "脂肪激素 / 血糖代謝 / 糖化終產物",
    items: [
      { code: "199", name: "Adiponectin", container: "紅頭 x1" },
      { code: "197", name: "Leptin", container: "紅頭 x1" },
      { code: "191", name: "Insulin-AC", container: "紅頭 x1" },
      { code: "380-1", name: "Glucose-AC", container: "灰頭 x1" },
      { code: "381", name: "Glucose-PC", container: "灰頭 x1" },
      { code: "196-1", name: "HbA1C", container: "紫頭 x1" },
      { code: "1249", name: "AGEs", container: "紫頭 x1" },
    ],
  },
  {
    title: "骨質代謝調控 / 維生素 D / 骨質流失標記",
    items: [
      { code: "211", name: "Intact-PTH", container: "紫頭 x1" },
      { code: "213", name: "Osteocalcin", container: "紫頭 x1" },
      { code: "413", name: "Ca", container: "紅頭 x1" },
      { code: "212", name: "25-OHD (D2+D3)", container: "紅頭 x1" },
      { code: "214", name: "β-CrossLaps", container: "紅頭 x1" },
    ],
  },
  {
    title: "生長因子 / 腦下垂體荷爾蒙 / 卵巢儲備功能指標",
    items: [
      { code: "181", name: "IGF-1", container: "紅頭 x1" },
      { code: "150", name: "ACTH", container: "紫頭 x1" },
      { code: "120", name: "Prolactin", container: "紅頭 x1" },
      { code: "121", name: "LH", container: "紅頭 x1" },
      { code: "122", name: "FSH", container: "紅頭 x1" },
      { code: "1341", name: "AMH", container: "紅頭 x1" },
    ],
  },
  {
    title: "甲狀腺荷爾蒙代謝 / 自體免疫抗體",
    items: [
      { code: "106", name: "TSH", container: "紅頭 x1" },
      { code: "100", name: "FT4", container: "紅頭 x1" },
      { code: "101", name: "T4", container: "紅頭 x1" },
      { code: "102", name: "FT3", container: "紅頭 x1" },
      { code: "103", name: "T3", container: "紅頭 x1" },
      { code: "104", name: "RT3", container: "紅頭 x1" },
      { code: "110", name: "Anti-TG", container: "紅頭 x1" },
      { code: "111", name: "Anti-TPO", container: "紅頭 x1" },
    ],
  },
  {
    title: "腎上腺皮質、睪丸、卵巢荷爾蒙（可任意選擇 6 項）",
    bundleCode: "1126",
    items: [
      { code: "127-3", name: "Pregnegolone", container: "紅頭 x1" },
      { code: "128-3", name: "Progesterone", container: "紅頭 x1" },
      { code: "151-3", name: "Cortisol", container: "紅頭 x1" },
      { code: "165-3", name: "Cortisone", container: "紅頭 x1" },
      { code: "154-3", name: "DHEA", container: "紅頭 x1" },
      { code: "155-3", name: "DHEA-S", container: "紅頭 x1" },
      { code: "134-3", name: "A-dione", container: "紅頭 x1" },
      { code: "129-3", name: "Testosterone", container: "紅頭 x1" },
      { code: "130-3", name: "Free Testosterone", container: "紅頭 x1" },
      { code: "132-3", name: "DHT", container: "紅頭 x1" },
      { code: "123-3", name: "E1", container: "紅頭 x1" },
      { code: "124-3", name: "E2", container: "紅頭 x1" },
      { code: "133-3", name: "SHBG", container: "紅頭 x1" },
    ],
  },
  {
    title: "唾液荷爾蒙",
    items: [
      { code: "123-5", name: "E1", container: "唾液 x1" },
      { code: "124-5", name: "E2", container: "唾液 x1" },
      { code: "125-5", name: "E3", container: "唾液 x1" },
      { code: "128-5", name: "Progesterone", container: "唾液 x1" },
      { code: "129-5", name: "Testosterone", container: "唾液 x1" },
      { code: "660", name: "DHEA", container: "唾液 x1" },
      { code: "1238", name: "Cortisol", container: "唾液 x1" },
    ],
  },
  {
    title: "環境荷爾蒙：塑化劑 / 防腐劑 / 清潔劑（可任意選擇 5 項）",
    bundleCode: "1128",
    items: [
      { code: "1004-1", name: "MMP", container: "尿液 x1" },
      { code: "1004-2", name: "MEP", container: "尿液 x1" },
      { code: "1004-3", name: "MnBP", container: "尿液 x1" },
      { code: "1004-4", name: "MBzP", container: "尿液 x1" },
      { code: "1004-5", name: "MEHP", container: "尿液 x1" },
      { code: "1005-1", name: "MP", container: "尿液 x1" },
      { code: "1005-2", name: "EP", container: "尿液 x1" },
      { code: "1005-3", name: "PP", container: "尿液 x1" },
      { code: "1005-4", name: "BP", container: "尿液 x1" },
      { code: "1006-1", name: "NP", container: "尿液 x1" },
      { code: "1006-2", name: "4-t-OP", container: "尿液 x1" },
      { code: "1006-3", name: "2,4-di-t-BP", container: "尿液 x1" },
      { code: "1006-4", name: "BPA", container: "尿液 x1" },
      { code: "1006-5", name: "Triclosan", container: "尿液 x1" },
    ],
  },
  {
    title: "氧化損傷標記 / 抗氧化物 / 抗氧化酵素 / 解毒酵素",
    items: [
      { code: "314", name: "8-OHdG", container: "尿液 x1" },
      { code: "1201", name: "F2-IsoPs", container: "尿液 x1" },
      { code: "309", name: "MDA", container: "紫頭 x1" },
      { code: "1202", name: "Nitrotyrosine", container: "紫頭 x1" },
      { code: "300", name: "SOD", container: "綠頭 x1" },
      { code: "302", name: "f-Thiols", container: "綠頭 x1" },
      { code: "303-2", name: "t-GSH", container: "綠頭 x1" },
      { code: "304", name: "GSHPx", container: "紫頭 x1" },
      { code: "306", name: "GSTs", container: "紫頭 x1" },
    ],
  },
  {
    title: "抗氧化維生素 / 脂溶性維生素（可任意選擇 5 項）",
    bundleCode: "1115",
    items: [
      { code: "320-1", name: "Retinol", container: "紫頭 x1" },
      { code: "323-1", name: "β-Carotene", container: "紫頭 x1" },
      { code: "321-1", name: "Lycopene", container: "紫頭 x1" },
      { code: "333-1", name: "Zeaxanthin", container: "紫頭 x1" },
      { code: "329-1", name: "Lutein", container: "紫頭 x1" },
      { code: "212b", name: "25-OHD (D2+D3)*", container: "紅頭 x1*" },
      { code: "326-1", name: "α-Tocopherol", container: "紫頭 x1" },
      { code: "325-1", name: "γ-Tocopherol", container: "紫頭 x1" },
      { code: "324-1", name: "δ-Tocopherol", container: "紫頭 x1" },
      { code: "327-2", name: "CoQ10", container: "紫頭 x1" },
      { code: "328-1", name: "Vitamin C**", container: "綠頭 x1**" },
    ],
  },
  {
    title: "營養礦物質 / 鐵蛋白",
    items: [
      { code: "413b", name: "Ca", container: "紅頭 x1" },
      { code: "1350", name: "Mg、K", container: "藍頭 x1★" },
      { code: "1130", name: "Na、K、Cl", container: "紅頭 x1" },
      { code: "222", name: "Ferritin", container: "紅頭 x1" },
    ],
  },
  {
    title: "組織胺不耐受 / 黏膜免疫 / 發炎 / 類風濕關節炎 / 急性過敏指標",
    items: [
      { code: "1335", name: "Histamine", container: "糞便 x1" },
      { code: "1336", name: "DAO", container: "紅頭 x1" },
      { code: "365-2", name: "hsCRP", container: "紅頭 x1" },
      { code: "292", name: "RA", container: "紅頭 x1" },
      { code: "1213", name: "Anti-CCP", container: "紅頭 x1" },
      { code: "293", name: "IgE", container: "紅頭 x1" },
    ],
  },
  {
    title: "腸道消化 / 麩質敏感 / 腸黏膜發炎、滲漏 / 胃幽門桿菌 / 潛血反應",
    items: [
      { code: "1323", name: "Anti-Gliadin sIgA", container: "糞便 x1" },
      { code: "1334", name: "Anti-htTG", container: "糞便 x1" },
      { code: "1214", name: "sIgA", container: "糞便 x1" },
      { code: "1327", name: "Calprotectin", container: "糞便 x1" },
      { code: "1012b", name: "Hp-Ag", container: "糞便 x1" },
      { code: "1222", name: "Hb/Hp Combo FOBT", container: "糞便 x1" },
    ],
  },
  {
    title: "腫瘤生化指標",
    items: [
      { code: "243", name: "AFP", container: "紅頭 x1" },
      { code: "231", name: "CEA", container: "紅頭 x1" },
      { code: "232", name: "CA-19.9", container: "紅頭 x1" },
      { code: "241", name: "CYFRA 21.1", container: "紅頭 x1" },
      { code: "233", name: "CA-15.3", container: "紅頭 x1" },
      { code: "234", name: "CA-125", container: "紅頭 x1" },
      { code: "235", name: "SCC", container: "紅頭 x1" },
      { code: "236", name: "PSA", container: "紅頭 x1" },
      { code: "237", name: "PSA-Free", container: "紅頭 x1" },
    ],
  },
  {
    title: "B 型肝炎 / C 型肝炎病毒標記",
    items: [
      { code: "813", name: "HBsAg、Anti-HBs、Anti-HCV", container: "紅頭 x1" },
      { code: "251", name: "HBsAg", container: "紅頭 x1" },
      { code: "252", name: "Anti-HBs", container: "紅頭 x1" },
      { code: "260", name: "Anti-HCV", container: "紅頭 x1" },
    ],
  },
  {
    title: "肝功能 / 腎功能生化指標",
    items: [
      { code: "1106", name: "Protein、Prealbumin、Albumin、Globulin、A/G ratio、Bilirubin-Total、Bilirubin-Direct、Alk-P、AST-GOT、ALT-GPT、GGT、Cystatin C", container: "紅頭 x1" },
      { code: "1104", name: "BUN、Creatinine、Cystatin C、eGFR、Uric acid、Microalbumin", container: "紅頭 x1\n尿液 x1" },
      { code: "1209", name: "Prealbumin", container: "紅頭 x1" },
      { code: "382", name: "Protein", container: "紅頭 x1" },
      { code: "383", name: "Albumin", container: "紅頭 x1" },
      { code: "1333", name: "Cystatin C", container: "紅頭 x1" },
      { code: "385", name: "BUN", container: "紅頭 x1" },
      { code: "386", name: "Creatinine", container: "紅頭 x1" },
      { code: "388", name: "Uric Acid", container: "紅頭 x1" },
      { code: "389", name: "AST-GOT", container: "紅頭 x1" },
      { code: "390", name: "ALT-GPT", container: "紅頭 x1" },
      { code: "391", name: "GGT", container: "紅頭 x1" },
      { code: "392", name: "Alkaline-P", container: "紅頭 x1" },
      { code: "393", name: "Bilirubin-Total", container: "紅頭 x1" },
      { code: "394", name: "Bilirubin-Direct", container: "紅頭 x1" },
      { code: "1205", name: "Microalbumin", container: "尿液 x1" },
    ],
  },
  {
    title: "血液常規 + 白血球分類 / 尿液常規",
    items: [
      { code: "673", name: "CBC", container: "紫頭 x1" },
      { code: "680", name: "CBC-DC", container: "紫頭 x1" },
      { code: "674", name: "Urine Routine", container: "尿液 x1" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Client = {
  name: string;
  medicalRecordNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
};

type Props = { client: Client; onClose: () => void };

export default function HanshiOrderForm({ client, onClose }: Props) {
  // Patient info
  const [info, setInfo] = useState({
    sendUnit: "意一堂健康管理",
    name: client.name,
    dob: client.dateOfBirth ? client.dateOfBirth.slice(0, 10) : "",
    mrn: client.medicalRecordNumber || "",
    gender: client.gender === "male" ? "M" : client.gender === "female" ? "F" : "",
    sampleDate: new Date().toISOString().slice(0, 10),
    sampleTime: "",
    reportLang: "繁體",
    isSupplement: false,
    menstrualCycle: "",
    lmp: "",
    menopauseAge: "",
    remarks: "",
  });

  // Checkbox state: code → boolean
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (code: string) => setChecked((p) => ({ ...p, [code]: !p[code] }));

  const selectedCount = Object.values(checked).filter(Boolean).length;

  const print = () => window.print();

  const sectionBg = "#e8e0d4";
  const headerBg = "#4a3728";

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #hanshi-print-root { display: block !important; position: static !important; overflow: visible !important; height: auto !important; }
          .no-print { display: none !important; }
          .hanshi-form { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-auto py-6 no-print-backdrop">
        <div id="hanshi-print-root" className="w-full max-w-5xl mx-4">

          {/* Toolbar */}
          <div className="no-print flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm">
                <X className="w-4 h-4" /> 關閉
              </button>
              <span className="text-white/60 text-xs">已選 {selectedCount} 項</span>
            </div>
            <button onClick={print}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#5c4638", color: "#fff" }}>
              <Printer className="w-4 h-4" /> 列印 / 匯出 PDF
            </button>
          </div>

          {/* Form */}
          <div className="hanshi-form bg-white rounded-xl shadow-2xl overflow-hidden" style={{ fontFamily: "sans-serif", fontSize: "13px" }}>

            {/* Title */}
            <div className="text-center py-4 text-xl font-bold tracking-widest" style={{ letterSpacing: "0.3em" }}>
              瀚 仕 功 能 醫 學 檢 測 申 請 單
            </div>

            {/* Patient info header */}
            <div className="border-t border-b" style={{ borderColor: "#bbb" }}>
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="font-medium whitespace-nowrap">送檢單位：</span>
                  <input className="flex-1 border-b border-slate-300 focus:outline-none text-sm" value={info.sendUnit}
                    onChange={(e) => setInfo((p) => ({ ...p, sendUnit: e.target.value }))} />
                </div>
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="font-medium whitespace-nowrap">姓　名：</span>
                  <input className="flex-1 border-b border-slate-300 focus:outline-none text-sm" value={info.name}
                    onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="font-medium whitespace-nowrap">出生日期：西元</span>
                  <input type="date" className="border-b border-slate-300 focus:outline-none text-sm w-36" value={info.dob}
                    onChange={(e) => setInfo((p) => ({ ...p, dob: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x border-t" style={{ borderColor: "#bbb" }}>
                <div className="px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="font-medium whitespace-nowrap">報告方式：</span>
                  {["繁體", "簡體", "英文"].map((lang) => (
                    <label key={lang} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="reportLang" value={lang} checked={info.reportLang === lang}
                        onChange={() => setInfo((p) => ({ ...p, reportLang: lang }))} />
                      {lang}
                    </label>
                  ))}
                </div>
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="font-medium whitespace-nowrap">病歷號：</span>
                  <input className="flex-1 border-b border-slate-300 focus:outline-none text-sm" value={info.mrn}
                    onChange={(e) => setInfo((p) => ({ ...p, mrn: e.target.value }))} />
                </div>
                <div className="px-3 py-2 flex items-center gap-3 text-sm">
                  <span className="font-medium">性別：</span>
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="M" checked={info.gender === "M"} onChange={() => setInfo((p) => ({ ...p, gender: "M" }))} /> 男</label>
                  <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="gender" value="F" checked={info.gender === "F"} onChange={() => setInfo((p) => ({ ...p, gender: "F" }))} /> 女</label>
                  <span className="font-medium ml-2 whitespace-nowrap">採檢日期：</span>
                  <input type="date" className="border-b border-slate-300 focus:outline-none text-sm w-32" value={info.sampleDate}
                    onChange={(e) => setInfo((p) => ({ ...p, sampleDate: e.target.value }))} />
                  <input type="time" className="border-b border-slate-300 focus:outline-none text-sm w-20" value={info.sampleTime}
                    onChange={(e) => setInfo((p) => ({ ...p, sampleTime: e.target.value }))} />
                </div>
              </div>
              <div className="px-3 py-2 border-t flex items-center gap-3 text-sm" style={{ borderColor: "#bbb" }}>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={info.isSupplement} onChange={(e) => setInfo((p) => ({ ...p, isSupplement: e.target.checked }))} />
                  <span className="font-medium">補件檢體</span>
                </label>
                <span className="text-slate-500">近三個月每隔</span>
                <input className="w-16 border-b border-slate-300 focus:outline-none text-sm text-center" value={info.menstrualCycle}
                  onChange={(e) => setInfo((p) => ({ ...p, menstrualCycle: e.target.value }))} placeholder="___" />
                <span className="text-slate-500">天來經；最近來經日(LMP)：</span>
                <input className="w-24 border-b border-slate-300 focus:outline-none text-sm text-center" value={info.lmp}
                  onChange={(e) => setInfo((p) => ({ ...p, lmp: e.target.value }))} placeholder="MM/DD" />
                <span className="text-slate-500 ml-2">；停經年齡：</span>
                <input className="w-16 border-b border-slate-300 focus:outline-none text-sm text-center" value={info.menopauseAge}
                  onChange={(e) => setInfo((p) => ({ ...p, menopauseAge: e.target.value }))} placeholder="___" />
                <span className="text-slate-500">歲</span>
              </div>
            </div>

            {/* Body: two panels */}
            <div className="p-4 flex flex-col gap-4">

              {/* == 套組型 == */}
              <div>
                <div className="text-center text-xs text-slate-400 mb-2 font-medium tracking-wider">─── 套 組 型 申 請（第一、二頁）───</div>
                <div className="grid grid-cols-2 gap-3">
                  {SECTIONS_PACKAGE.map((sec) => (
                    <SectionBlock key={sec.title} sec={sec} checked={checked} toggle={toggle} sectionBg={sectionBg} headerBg={headerBg} isPackage />
                  ))}
                </div>
              </div>

              {/* == 單項型 == */}
              <div>
                <div className="text-center text-xs text-slate-400 mb-2 font-medium tracking-wider">─── 單 項 型 申 請（第三、四頁）───</div>
                <div className="grid grid-cols-2 gap-3">
                  {SECTIONS_SINGLE.map((sec) => (
                    <SectionBlock key={sec.title} sec={sec} checked={checked} toggle={toggle} sectionBg={sectionBg} headerBg={headerBg} />
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: headerBg }}>備註欄：與實驗室連絡專區（請註明服用營養素／藥物或其它）</div>
                <textarea rows={3} className="w-full border rounded p-2 text-sm focus:outline-none resize-none" style={{ borderColor: "#ccc" }}
                  value={info.remarks} onChange={(e) => setInfo((p) => ({ ...p, remarks: e.target.value }))} />
              </div>

              {/* Footer */}
              <div className="text-[10px] text-slate-400 border-t pt-2 mt-1" style={{ borderColor: "#ddd" }}>
                台灣 104051 台北市中山區敬業一路 2 號 17F　聯絡電話：02-8501-1298　收檢體 #156　業務諮詢 #155　檢測諮詢：#161、#162<br />
                瀚仕功能醫學研究中心／瀚仕醫事檢驗所　www.redoxfm.com　2024 年 11 月版　版權所有
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SectionBlock ─────────────────────────────────────────────────────────────

function SectionBlock({ sec, checked, toggle, sectionBg, headerBg, isPackage }: {
  sec: Section; checked: Record<string, boolean>; toggle: (code: string) => void;
  sectionBg: string; headerBg: string; isPackage?: boolean;
}) {
  return (
    <div className="rounded overflow-hidden border" style={{ borderColor: "#ccc" }}>
      <div className="px-3 py-1.5 text-xs font-semibold" style={{ background: sectionBg, color: headerBg }}>
        {sec.bundleCode && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={!!checked[sec.bundleCode]} onChange={() => toggle(sec.bundleCode!)} className="w-3 h-3" />
            <span>□ {sec.bundleCode}　</span>
            <span>{sec.title}</span>
          </label>
        )}
        {!sec.bundleCode && sec.title}
      </div>
      <div className="divide-y divide-slate-100">
        {sec.items.map((item) => (
          <label key={item.code} className={`flex items-start gap-2 px-3 py-1 cursor-pointer hover:bg-slate-50 ${checked[item.code] ? "bg-amber-50" : ""}`}>
            <input type="checkbox" checked={!!checked[item.code]} onChange={() => toggle(item.code)} className="mt-0.5 w-3.5 h-3.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {isPackage ? (
                <>
                  <span className="text-slate-500 text-[11px] mr-1">{item.code}</span>
                  <span className="text-slate-800 text-[11.5px]" style={{ whiteSpace: "pre-line" }}>{item.name}</span>
                </>
              ) : (
                <span className="text-slate-800 text-[11.5px]">{item.name}</span>
              )}
            </div>
            <span className="text-slate-400 text-[10px] whitespace-pre-line flex-shrink-0 text-right">{item.container}</span>
            {!isPackage && <span className="text-slate-300 text-[10px] ml-1 flex-shrink-0">{item.code}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
