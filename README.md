# ha-aurora-bg

Home Assistant「极光 · 家」仪表盘的四时段背景光层。

按本机时间在仪表盘背景上叠一层氛围光：清晨（05–08 暖橙）、白天（08–16 透蓝）、黄昏（16–19 橙粉）、夜晚（19–05 靛蓝）。只在 `/aurora-home` 生效，其他页面不动作。

## 安装

HA → 设置 → 仪表盘 → 右上角「资源」→ 添加资源：

- URL：`https://cdn.jsdelivr.net/gh/xxrfeng/ha-aurora-bg@v1.0.0/aurora-bg.js`
- 类型：JavaScript 模块

脚本会沿用仪表盘自己配置的 `--view-background`（含 `light-dark()` 明暗两套配色），只额外叠加光层，因此不会破坏卡片与文字的对比度。

## 自定义

- 时段边界与颜色在文件顶部的 `PHASES` 数组里，`start` 为起始小时。
- 调试：控制台执行 `window.__AURORA_HOUR = 18` 锁定时段，`delete window.__AURORA_HOUR` 恢复。

## 说明

不强制切换 HA 明暗模式；CDN 不可达时脚本不加载，页面退回静态背景，其他功能不受影响。
