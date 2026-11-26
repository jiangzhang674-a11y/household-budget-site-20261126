/* 家计本 · 演示账本数据
   户主是一家三口（夫妻加一个小学生），住在二线城市，一个月进账两万上下。
   这里的每一笔数都只是演示：拿来让人试试记账、看统计、算储蓄目标，
   跟任何真实家庭无关。数与数之间是互相咬合的，改一处就要连带改几处：
   11 类预算加起来 14,100，实际花掉 13,700，省下 400；当月收入 20,200；
   11 月的 40 笔流水按分类一加，正好等于分类表里的实际数；1–11 月
   收入 221,200、支出 149,600、结余 71,600，储蓄率 32.2%。 */
"use strict";

/* 每行：[名称, 金额] */
const INCOME_ROWS = [
  ["丈夫工资", 10500],
  ["妻子工资", 8000],
  ["副业兼职", 1200],
  ["理财收益", 320],
  ["其他收入", 180],
];

/* 每行：[key, 分类名, 预算, 实际, 配色, 是否必要开销] */
const CATEGORY_ROWS = [
  ["housing", "住房", 4200, 4200, "#0e7a5f", true],
  ["food", "食品餐饮", 3200, 3100, "#e8960c", true],
  ["transport", "交通出行", 1000, 980, "#3a86c8", true],
  ["education", "教育", 2000, 1850, "#7c5cbf", true],
  ["medical", "医疗健康", 500, 620, "#c0392b", true],
  ["daily", "日用百货", 800, 750, "#2a9d8f", true],
  ["phone", "通讯", 300, 298, "#6b7a73", true],
  ["fun", "娱乐休闲", 600, 640, "#e76f51", false],
  ["clothes", "服装", 500, 420, "#b5838d", false],
  ["gift", "人情往来", 600, 500, "#8a5a00", false],
  ["other", "其他", 400, 342, "#9aa5a0", false],
];

/* 每行：[月份, 月份短名, 收入, 支出] —— 1–11 月，合计见文件头注释 */
const MONTH_ROWS = [
  ["2026-01", "1月", 19800, 13200],
  ["2026-02", "2月", 19600, 14800],
  ["2026-03", "3月", 20100, 12900],
  ["2026-04", "4月", 19900, 13100],
  ["2026-05", "5月", 20300, 13600],
  ["2026-06", "6月", 20100, 13400],
  ["2026-07", "7月", 20600, 14200],
  ["2026-08", "8月", 20400, 13900],
  ["2026-09", "9月", 20000, 13300],
  ["2026-10", "10月", 20200, 13500],
  ["2026-11", "11月", 20200, 13700],
];

/* 每行：[日期, 收支, 分类 key, 事项, 金额] —— 2026 年 11 月，共 40 笔 */
const FLOW_ROWS = [
  ["2026-11-01", "expense", "transport", "地铁公交充值", 200],
  ["2026-11-01", "expense", "phone", "话费", 198],
  ["2026-11-01", "expense", "phone", "宽带费", 100],
  ["2026-11-02", "expense", "food", "超市买菜", 480],
  ["2026-11-02", "expense", "fun", "视频会员", 45],
  ["2026-11-03", "expense", "food", "外卖午餐", 96],
  ["2026-11-04", "expense", "medical", "药房买药", 180],
  ["2026-11-05", "expense", "housing", "房贷还款", 4200],
  ["2026-11-05", "expense", "other", "快递费", 42],
  ["2026-11-06", "expense", "education", "孩子英语课", 900],
  ["2026-11-07", "expense", "food", "菜市场买菜", 320],
  ["2026-11-07", "expense", "clothes", "孩子冬装", 260],
  ["2026-11-08", "expense", "food", "外卖晚餐", 128],
  ["2026-11-08", "expense", "daily", "日用品采购", 420],
  ["2026-11-09", "expense", "transport", "加油", 350],
  ["2026-11-10", "income", "income", "丈夫工资", 10500],
  ["2026-11-10", "income", "income", "妻子工资", 8000],
  ["2026-11-10", "expense", "food", "超市买菜", 560],
  ["2026-11-10", "expense", "fun", "电影票", 120],
  ["2026-11-11", "expense", "education", "钢琴课", 650],
  ["2026-11-12", "expense", "food", "家庭聚餐", 520],
  ["2026-11-12", "expense", "other", "理发", 100],
  ["2026-11-13", "expense", "daily", "纸巾洗护", 180],
  ["2026-11-14", "expense", "transport", "停车费", 120],
  ["2026-11-15", "expense", "food", "超市买菜", 430],
  ["2026-11-15", "expense", "gift", "朋友乔迁礼金", 500],
  ["2026-11-16", "expense", "transport", "打车", 86],
  ["2026-11-16", "expense", "fun", "家庭出游", 475],
  ["2026-11-17", "expense", "medical", "牙科检查", 440],
  ["2026-11-18", "expense", "food", "水果", 156],
  ["2026-11-18", "income", "income", "副业兼职", 1200],
  ["2026-11-19", "expense", "education", "学习用品", 300],
  ["2026-11-20", "expense", "clothes", "丈夫衬衫", 160],
  ["2026-11-20", "income", "income", "理财收益", 320],
  ["2026-11-21", "expense", "food", "外卖午餐", 88],
  ["2026-11-22", "expense", "daily", "五金小件", 150],
  ["2026-11-22", "income", "income", "其他收入", 180],
  ["2026-11-23", "expense", "transport", "加油", 224],
  ["2026-11-24", "expense", "other", "杂项", 200],
  ["2026-11-25", "expense", "food", "超市买菜", 322],
];

/* 每行：[目标名, 目标金额, 已攒, 备注] —— 目标合计 168,000，已攒 60,100 */
const GOAL_ROWS = [
  ["家庭应急基金", 30000, 18500, "够 3 个月开销，防失业生病"],
  ["孩子教育金", 50000, 12000, "初中课外班与升学准备"],
  ["换车首付", 80000, 24000, "现车车龄 9 年，计划两年后换"],
  ["家庭旅行基金", 8000, 5600, "明年暑假全家出游"],
];

var SAMPLE = {
  household: "示例家庭 · 三口之家",
  note: "本页数字为示例家庭账本（演示数据），用于展示记账、统计与储蓄工具的用法。",
  month: "2026-11",
  monthLabel: "2026年11月",
  currency: "¥",
  income: INCOME_ROWS.map(function (row) {
    return { label: row[0], amount: row[1] };
  }),
  categories: CATEGORY_ROWS.map(function (row) {
    return { key: row[0], name: row[1], budget: row[2], actual: row[3], color: row[4], need: row[5] };
  }),
  months: MONTH_ROWS.map(function (row) {
    return { m: row[0], label: row[1], income: row[2], expense: row[3] };
  }),
  transactions: FLOW_ROWS.map(function (row) {
    return { date: row[0], type: row[1], cat: row[2], name: row[3], amount: row[4] };
  }),
  goals: GOAL_ROWS.map(function (row) {
    return { name: row[0], target: row[1], saved: row[2], note: row[3] };
  }),
};

/* ---- 只算示例账本本身的合计，用户自己记的账不算在内 ---- */
function sumAmounts(list, field) {
  let total = 0;
  for (const item of list) total += item[field];
  return total;
}
function totalIncome() {
  return sumAmounts(SAMPLE.income, "amount");
}
function totalExpense() {
  return sumAmounts(SAMPLE.categories, "actual");
}
function totalBudget() {
  return sumAmounts(SAMPLE.categories, "budget");
}
function catName(key) {
  if (key === "income") return "收入";
  const found = SAMPLE.categories.find(function (c) { return c.key === key; });
  return found ? found.name : key;
}
function fmt(n) {
  return "¥" + Number(n).toLocaleString("zh-CN");
}
