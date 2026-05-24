export const BASE_STYLES = `
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:25mm 20mm}
body{font-family:'Segoe UI',-apple-system,sans-serif;font-size:11px;color:#1a1a1a;line-height:1.65}
.cover{page-break-after:always;display:flex;flex-direction:column;justify-content:center;min-height:75vh;padding:40px 0}
.cover-type{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#001F3F;font-weight:600;border-bottom:3px solid #001F3F;display:inline-block;padding-bottom:4px;margin-bottom:20px}
.cover h1{font-size:26px;font-weight:700;color:#001F3F;margin-bottom:8px;line-height:1.2}
.cover-sub{font-size:13px;color:#555;margin-bottom:32px}
.dctrl{width:100%;border-collapse:collapse;margin:16px 0}
.dctrl td{padding:7px 12px;border:1px solid #d1d5db;font-size:11px}
.dctrl td:first-child{background:#f0f4f8;font-weight:600;color:#333;width:35%;text-transform:uppercase;font-size:10px;letter-spacing:.3px}
h2{font-size:13px;font-weight:700;color:#001F3F;margin:24px 0 8px;padding-bottom:4px;border-bottom:2px solid #001F3F;text-transform:uppercase;letter-spacing:.5px}
h3{font-size:11.5px;font-weight:600;color:#1a1a1a;margin:14px 0 6px}
p,li{margin-bottom:5px}
ol,ul{padding-left:20px;margin:6px 0}
table.dt{width:100%;border-collapse:collapse;margin:8px 0;font-size:10px}
table.dt th,table.dt td{padding:6px 8px;border:1px solid #d1d5db;text-align:left}
table.dt th{background:#f0f4f8;font-weight:600;color:#333;text-transform:uppercase;font-size:9px;letter-spacing:.4px}
.y{color:#059669;font-weight:600} .n{color:#dc2626;font-weight:600} .p{color:#d97706;font-weight:600} .na{color:#888}
.rb{display:inline-block;padding:4px 14px;border-radius:6px;font-weight:700;font-size:14px}
.rh{background:#fee2e2;color:#dc2626} .rm{background:#fef3c7;color:#d97706} .rl{background:#d1fae5;color:#059669}
.pre{white-space:pre-wrap;padding:0 2px}
.ft{margin-top:40px;padding-top:12px;border-top:2px solid #001F3F;font-size:9px;color:#888;text-align:center}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
.sb{border:1px solid #d1d5db;border-radius:6px;padding:14px;min-height:70px}
.sl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:28px}
.sn{border-top:1px solid #333;padding-top:4px;font-size:10px;font-weight:600}
.mx{border-collapse:collapse;width:100%;margin:10px 0}
.mx td,.mx th{border:1px solid #d1d5db;padding:6px 8px;text-align:center;font-size:10px}
.mx th{background:#f0f4f8;font-weight:600}
.mx .c1{background:#d1fae5} .mx .c2{background:#fef9c3} .mx .c3{background:#fef3c7} .mx .c4{background:#fed7aa} .mx .c5{background:#fee2e2}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase}
`;

export const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

export function openPrintWindow(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>NCompliant</title><style>${BASE_STYLES}</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

export function docCtrl(rows: [string, string][]) {
  return `<table class="dctrl">${rows.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
}
