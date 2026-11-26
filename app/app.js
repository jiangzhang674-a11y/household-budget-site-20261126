/* 家计本 · 全站共用的脚本：只跑在浏览器本地，不连任何外部服务。
   里头有三样东西：顶部导航当前页高亮、手绘的 canvas / SVG 图表、
   以及浏览器本地账本（localStorage）的读写。
   最重要的一条口径：用户在「记一笔」页记的账，必须在全站同步——
   首页的 KPI、分类页的实际数、首页环形图、月度页、年度趋势里 11 月
   那一栏，全都走同一套“演示数 + 用户账”的合并口径，不许各算各的。
   用户还没记过账时，合并出来的数就等于演示数本身。 */
"use strict";

/* ---- 当前页的导航高亮 ---- */
(function highlightNav() {
  const here = location.pathname.split("/").pop().split("?")[0] || "index.html";
  document.querySelectorAll(".topbar nav a, footer nav a").forEach(function (link) {
    if (link.getAttribute("href") === here) link.classList.add("active");
  });
})();

/* ---- 浏览器本地账本：演示流水 + 用户自己记的账 ---- */
var STORE_KEY = "jiajiben-ledger-v1";

function loadUserEntries() {
  let parsed = [];
  try {
    parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch (err) {
    parsed = [];
  }
  return Array.isArray(parsed) ? parsed : [];
}
function saveUserEntries(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}
function allTransactions() {
  return SAMPLE.transactions.concat(loadUserEntries());
}

/* 用户账在某个月里的收支合计。缺省算 2026-11，只认日期前缀对得上的账。 */
function userMonthTotals(month) {
  const m = month || "2026-11";
  const sums = { income: 0, expense: 0 };
  for (const entry of loadUserEntries()) {
    if (!entry.date || entry.date.indexOf(m) !== 0) continue;
    if (entry.type === "income") sums.income += entry.amount;
    else sums.expense += entry.amount;
  }
  return sums;
}

/* 用户账在某个月里按支出分类的合计（缺省 2026-11）。收入不进分类。 */
function userCatTotals(month) {
  const m = month || "2026-11";
  const byCat = {};
  for (const entry of loadUserEntries()) {
    if (!entry.date || entry.date.indexOf(m) !== 0) continue;
    if (entry.type !== "expense") continue;
    byCat[entry.cat] = (byCat[entry.cat] || 0) + entry.amount;
  }
  return byCat;
}

/* 合并后的分类表：演示实际数加上该分类的用户支出；预算一分不动。 */
function effectiveCategories(month) {
  const extra = userCatTotals(month);
  return SAMPLE.categories.map(function (c) {
    const mine = extra[c.key] || 0;
    return {
      key: c.key,
      name: c.name,
      budget: c.budget,
      actual: c.actual + mine,
      sampleActual: c.actual,
      userActual: mine,
      color: c.color,
      need: c.need,
    };
  });
}

/* 合并后的当月收支：演示收支各加用户账；同时把用户账那部分单独带出来。 */
function effectiveMonthTotals(month) {
  const m = month || "2026-11";
  const u = userMonthTotals(m);
  return {
    income: totalIncome() + u.income,
    expense: totalExpense() + u.expense,
    userIncome: u.income,
    userExpense: u.expense,
  };
}

/* 本月结余的实时值：演示结余加上用户账的净影响。储蓄目标页的
   计算器拿这个数当默认值，不写死。 */
function currentMonthlySurplus() {
  const t = effectiveMonthTotals("2026-11");
  return t.income - t.expense;
}

/* 合并后的 1–11 月：只有 11 月可能带上用户账，其余月份原样是演示数。 */
function effectiveMonths() {
  const u = userMonthTotals("2026-11");
  return SAMPLE.months.map(function (m) {
    if (m.m !== "2026-11") return { m: m.m, label: m.label, income: m.income, expense: m.expense };
    return { m: m.m, label: m.label, income: m.income + u.income, expense: m.expense + u.expense };
  });
}

/* ---- 手绘图表：不引任何图表库，直接画 canvas ---- */
function setupCanvas(cv, hCss) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth || (cv.parentNode && cv.parentNode.clientWidth) || 600;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(hCss * dpr);
  cv.style.height = hCss + "px";
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx: ctx, w: w, h: hCss };
}

function paintGrid(ctx, left, right, top, bottom, width, ceiling) {
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#6b7a73";
  ctx.strokeStyle = "#e2ddd2";
  for (let g = 0; g <= 4; g++) {
    const y = top + ((bottom - top) * g) / 4;
    const val = ceiling * (1 - g / 4);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - right, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText("¥" + val / 1000 + "k", left - 6, y + 4);
  }
}

/* 分组柱状图：labels 是横轴，a / b 是两组柱子（收入与支出，或预算与实际）。 */
function drawGroupedBars(cv, labels, a, b, aLabel, bLabel) {
  const s = setupCanvas(cv, 260);
  const ctx = s.ctx, W = s.w, H = s.h;
  const padL = 46, padR = 10, padT = 14, padB = 26;
  const ceiling = Math.ceil(Math.max.apply(null, a.concat(b)) / 5000) * 5000;
  const slot = (W - padL - padR) / labels.length;
  paintGrid(ctx, padL, padR, padT, H - padB, W, ceiling);
  labels.forEach(function (lb, i) {
    const bw = Math.min(22, (slot - 14) / 2);
    const x0 = padL + i * slot + (slot - 2 * bw - 4) / 2;
    const hA = ((H - padT - padB) * a[i]) / ceiling;
    const hB = ((H - padT - padB) * b[i]) / ceiling;
    ctx.fillStyle = "#0e7a5f";
    ctx.fillRect(x0, H - padB - hA, bw, hA);
    ctx.fillStyle = "#e8960c";
    ctx.fillRect(x0 + bw + 4, H - padB - hB, bw, hB);
    ctx.fillStyle = "#22302b";
    ctx.textAlign = "center";
    ctx.fillText(lb, padL + i * slot + slot / 2, H - 8);
  });
  ctx.fillStyle = "#0e7a5f";
  ctx.fillRect(padL, 0, 12, 12);
  ctx.fillStyle = "#22302b";
  ctx.textAlign = "left";
  ctx.fillText(aLabel, padL + 16, 11);
  const wA = ctx.measureText(aLabel).width;
  ctx.fillStyle = "#e8960c";
  ctx.fillRect(padL + 22 + wA, 0, 12, 12);
  ctx.fillStyle = "#22302b";
  ctx.fillText(bLabel, padL + 38 + wA, 11);
}

/* 横向条形图：每行一个分类，条长按金额来。 */
function drawHbars(cv, rows) {
  const rowH = 34;
  const s = setupCanvas(cv, rows.length * rowH + 30);
  const ctx = s.ctx, W = s.w;
  const padL = 78, padR = 64, padT = 8;
  const ceiling = Math.max.apply(null, rows.map(function (r) { return r.value; }));
  ctx.font = "13px sans-serif";
  rows.forEach(function (r, i) {
    const y = padT + i * rowH;
    const bw = ((W - padL - padR) * r.value) / ceiling;
    ctx.fillStyle = "#22302b";
    ctx.textAlign = "right";
    ctx.fillText(r.label, padL - 8, y + 16);
    ctx.fillStyle = "#ece8dd";
    ctx.fillRect(padL, y + 4, W - padL - padR, 16);
    ctx.fillStyle = r.color || "#0e7a5f";
    ctx.fillRect(padL, y + 4, Math.max(bw, 2), 16);
    ctx.fillStyle = "#22302b";
    ctx.textAlign = "left";
    ctx.fillText("¥" + r.value.toLocaleString("zh-CN"), padL + bw + 6, y + 16);
  });
}

/* 折线图：一般画储蓄率走势，纵轴单位由调用方给（"%"）。 */
function drawLine(cv, labels, values, unit) {
  const s = setupCanvas(cv, 220);
  const ctx = s.ctx, W = s.w, H = s.h;
  const padL = 44, padR = 14, padT = 16, padB = 26;
  let hi = values[0], lo = values[0];
  values.forEach(function (v) {
    if (v > hi) hi = v;
    if (v < lo) lo = v;
  });
  const ceiling = Math.ceil((hi + 3) / 5) * 5;
  const floor = Math.max(0, Math.floor((lo - 3) / 5) * 5);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#6b7a73";
  ctx.strokeStyle = "#e2ddd2";
  for (let g = 0; g <= 4; g++) {
    const y = padT + ((H - padT - padB) * g) / 4;
    const val = ceiling - ((ceiling - floor) * g) / 4;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(val + unit, padL - 6, y + 4);
  }
  const step = (W - padL - padR) / (labels.length - 1);
  const pointY = function (v) {
    return padT + (H - padT - padB) * (1 - (v - floor) / (ceiling - floor));
  };
  ctx.strokeStyle = "#0e7a5f";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  values.forEach(function (v, i) {
    const x = padL + i * step;
    if (i === 0) ctx.moveTo(x, pointY(v));
    else ctx.lineTo(x, pointY(v));
  });
  ctx.stroke();
  ctx.lineWidth = 1;
  values.forEach(function (v, i) {
    const x = padL + i * step;
    ctx.fillStyle = "#0e7a5f";
    ctx.beginPath();
    ctx.arc(x, pointY(v), 3.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#22302b";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x, H - 8);
  });
}

/* 环形图（SVG）：parts 是合并后的分类实际，圆心写合并后的支出合计。 */
function donutSVG(parts, size) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  let total = 0;
  parts.forEach(function (p) { total += p.value; });
  let offset = 0;
  const arcs = parts.map(function (p) {
    const len = (circ * p.value) / total;
    const seg = `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${p.color}" stroke-width="34" stroke-dasharray="${len.toFixed(1)} ${(circ - len).toFixed(1)}" stroke-dashoffset="${(-offset).toFixed(1)}"/>`;
    offset += len;
    return seg;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-label="分类支出环形图">` +
    `<circle cx="100" cy="100" r="100" fill="#fff"/>` + arcs.join("") +
    `<text x="100" y="96" text-anchor="middle" font-size="15" fill="#6b7a73">本月支出</text>` +
    `<text x="100" y="120" text-anchor="middle" font-size="19" font-weight="bold" fill="#22302b">¥${total.toLocaleString("zh-CN")}</text></svg>`;
}

/* ---- 流水表：每笔一行，收入带 + 号、支出带 − 号 ---- */
function txRows(list) {
  return list
    .map(function (t) {
      const isIncome = t.type === "income";
      return `<tr><td>${t.date.slice(5)}</td><td>${t.name}</td><td>${catName(t.cat)}</td>` +
        `<td class="num ${isIncome ? "pos" : "neg"}">${isIncome ? "+" : "−"}¥${t.amount.toLocaleString("zh-CN")}</td></tr>`;
    })
    .join("");
}
