/**
 * aurora-bg.js — 「极光 · 家」仪表盘按时间段变化的背景
 *
 * 用法：Home Assistant → 设置 → 仪表盘 → 右上角「资源」→ 添加资源
 *   URL:  https://cdn.jsdelivr.net/gh/xxrfeng/ha-aurora-bg@1/aurora-bg.js
 *   类型: JavaScript 模块
 *
 * 行为：
 *   - 只在 /aurora-home 路由生效，其他页面完全不做事。
 *   - 按本机时间分四个时段叠加一层「氛围光」，底层仍是仪表盘自己配置的
 *     --view-background（含 light-dark() 明暗两套配色），所以浅色/深色模式下
 *     文字对比度不会被破坏，只是色相随时间变化。
 *   - 每 20 秒自检一次（HA 切视图会重建背景元素），切页/切回标签页也会立即重绘。
 *   - 找不到元素时静默失败，不影响页面其他功能。
 */
(() => {
  "use strict";

  const DASHBOARD_PATH = "/aurora-home";

  // 时段划分：start 为起始小时（含），到下一段的 start 为止。顺序需按时间递增。
  const PHASES = [
    {
      id: "dawn",
      start: 5,
      name: "清晨",
      // 暖橙 + 淡桃色，像刚亮起来的天
      overlay: [
        "radial-gradient(900px 600px at 88% -8%, light-dark(rgba(255,186,120,.55), rgba(154,52,18,.55)) 0%, rgba(255,186,120,0) 60%)",
        "radial-gradient(800px 520px at 6% 104%, light-dark(rgba(255,214,170,.45), rgba(120,53,15,.45)) 0%, rgba(255,214,170,0) 62%)",
      ].join(","),
    },
    {
      id: "day",
      start: 8,
      name: "白天",
      // 天蓝 + 薄青，通透干净
      overlay: [
        "radial-gradient(1100px 700px at 78% -10%, light-dark(rgba(125,211,252,.50), rgba(3,105,161,.45)) 0%, rgba(125,211,252,0) 62%)",
        "radial-gradient(900px 600px at 0% 100%, light-dark(rgba(165,243,252,.40), rgba(8,145,178,.40)) 0%, rgba(165,243,252,0) 60%)",
      ].join(","),
    },
    {
      id: "dusk",
      start: 16,
      name: "黄昏",
      // 落日橙 + 品红，最浓的一段
      overlay: [
        "radial-gradient(1000px 660px at 92% 100%, light-dark(rgba(251,146,60,.60), rgba(194,65,12,.60)) 0%, rgba(251,146,60,0) 62%)",
        "radial-gradient(900px 600px at 4% -8%, light-dark(rgba(244,114,182,.50), rgba(131,24,67,.55)) 0%, rgba(244,114,182,0) 60%)",
      ].join(","),
    },
    {
      id: "night",
      start: 19,
      name: "夜晚",
      // 靛蓝 + 深青，安静一点
      overlay: [
        "radial-gradient(1000px 700px at 50% -18%, light-dark(rgba(129,140,248,.45), rgba(49,46,129,.70)) 0%, rgba(129,140,248,0) 62%)",
        "radial-gradient(900px 620px at 100% 108%, light-dark(rgba(56,189,248,.30), rgba(12,74,110,.55)) 0%, rgba(56,189,248,0) 60%)",
      ].join(","),
    },
  ];

  const TICK_MS = 20000;

  function phaseFor(hour) {
    let current = PHASES[PHASES.length - 1];
    for (const phase of PHASES) {
      if (hour >= phase.start) current = phase;
    }
    return current;
  }

  function hourNow() {
    // 调试用：控制台执行 window.__AURORA_HOUR = 18 可锁定时段
    const override = window.__AURORA_HOUR;
    if (typeof override === "number" && override >= 0 && override < 24) return override;
    return new Date().getHours();
  }

  /** 在整棵 DOM（含 shadowRoot）里广搜第一个匹配元素 */
  function deepQuery(selector, root = document) {
    const queue = [root];
    const seen = new Set();
    while (queue.length) {
      const node = queue.shift();
      if (!node || seen.has(node)) continue;
      seen.add(node);
      if (node.querySelector) {
        const hit = node.querySelector(selector);
        if (hit) return hit;
      }
      const all = node.querySelectorAll ? node.querySelectorAll("*") : [];
      for (const el of all) {
        if (el.shadowRoot) queue.push(el.shadowRoot);
      }
    }
    return null;
  }

  function isDashboardActive() {
    return location.pathname.startsWith(DASHBOARD_PATH);
  }

  function apply() {
    if (!isDashboardActive()) return;
    const root = deepQuery("hui-root");
    if (!root) return;
    const bg = root.shadowRoot && root.shadowRoot.querySelector("hui-view-background");
    if (!bg) return;

    const phase = phaseFor(hourNow());
    const configBg = bg.style.getPropertyValue("--view-background").trim();
    if (!configBg) return; // 视图没有配背景时不动它

    const value = phase.overlay + "," + configBg;
    if (bg.dataset.auroraPhase !== phase.id || bg.style.getPropertyValue("background") !== value) {
      bg.style.setProperty("background", value, "important");
      bg.dataset.auroraPhase = phase.id;
      root.dataset.auroraPhase = phase.id;
      root.dataset.auroraPhaseName = phase.name;
    }
  }

  let timer = null;

  function schedule() {
    if (timer !== null) return;
    timer = window.setInterval(apply, TICK_MS);
  }

  function start() {
    apply();
    schedule();
    window.addEventListener("location-changed", apply);
    window.addEventListener("popstate", apply);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) apply();
    });
    // HA 首次渲染较晚，补几次
    [300, 1200, 3000, 6000].forEach((ms) => window.setTimeout(apply, ms));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
