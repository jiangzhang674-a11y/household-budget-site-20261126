# 家计本 · 家庭记账

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/jiangzhang674-a11y/household-budget-site-20261126/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/jiangzhang674-a11y/household-budget-site-20261126/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

一个普通中国三口之家的家庭记账站——为 make.fun 比赛「Make the best household budget site」而建。

## 这是什么

6 个页面，全部纯静态、零网络请求，桌面和手机都能用：

| 页面 | 内容 |
| --- | --- |
| 首页总览 `app/index.html` | 2026年11月 KPI、近 6 个月收支柱状图、支出环形图、最近 8 笔流水 |
| 月度收支 `app/overview.html` | 9/10/11 月切换，收入来源与支出前 5 类，逐月结余表 |
| 分类支出 `app/categories.html` | 11 类支出条形图、预算对照表、四档筛选、点行看明细 |
| 记一笔 `app/add.html` | 记账表单（localStorage 保存）、删除/清空、40 笔完整账本筛选 |
| 储蓄目标 `app/goals.html` | 4 个目标进度、双向攒钱计算器、立新目标 |
| 年度趋势 `app/trends.html` | 1–11 月收支柱状图（可切结余视图）、储蓄率折线图 |

## 示例账本数字（2026年11月，示例家庭账本（演示数据））

- 收入 **¥20,200**：工资 ¥18,500、副业 ¥1,200、理财 ¥320、其他 ¥180
- 支出 **¥13,700**：住房 ¥4,200、食品餐饮 ¥3,100、交通 ¥980、教育 ¥1,850、医疗 ¥620、日用 ¥750、通讯 ¥298、娱乐 ¥640、服装 ¥420、人情 ¥500、其他 ¥342
- 结余 **¥6,500**，储蓄率 **32.2%**；预算合计 ¥14,100，实际省下 ¥400（医疗、娱乐两类小幅超支）
- 全年 1–11 月：收入 ¥221,200、支出 ¥149,600、已攒 **¥71,600**

逐笔流水 40 笔的分类合计与分类表逐项对得上；月份切换的 9/10 月分类数也与当月支出总额一致。

## 本地运行

```bash
python3 -m http.server --directory app 8000
# 打开 http://127.0.0.1:8000/index.html
```

不引用任何外部链接、CDN、在线字体或在线图片；图表是手绘 canvas/SVG；用户记的账只存在浏览器 localStorage。

## 交付（make.fun program/v1）

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts   # 主入口：写出 app/、screenshots/、dossier.json
node main.ts                           # 缺省写 /output/
```

`main.ts`（Node 22，标准库 + kit 的 vendor 库）是正式 entrypoint；
`main.py` 只做同样的复制工作（备用本地工具）。`dossier.json` 是
`main.ts` 用 kit 的 `vendor/makefun-frontend.ts` 生成的，不是手写
的——裁判用自己的同一份库重算，字节必须一致。

截图在 `screenshots/`（桌面 1280×900 与 1280×1000 各一张、手机 390×844 两张，均为真实渲染，每张 ≤256 KiB）。dossier 见 `dossier.json`。

## 许可

MIT License，见 `LICENSE`。
