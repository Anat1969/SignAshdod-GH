const { chromium } = require('playwright');
const out = require('path').join(__dirname, '../public/examples/');
require('fs').mkdirSync(out, { recursive: true });
const font = `font-family: 'Noto Sans Hebrew','DejaVu Sans',Arial,sans-serif;`;
const base = (w, h, body, bg = '#fff') => `<!doctype html><html dir="rtl"><meta charset="utf-8"><body style="margin:0;width:${w}px;height:${h}px;background:${bg};${font}">${body}</body></html>`;

// ---- permit visualisations (architect's rendering, simple elevation) ----
function tower() { // ex1: residential tower 
  let s = '';
  for (let f = 0; f < 18; f++) for (let c = 0; c < 6; c++) s += `<rect x="${215 + c * 30}" y="${70 + f * 24}" width="20" height="15" fill="${(f + c) % 5 ? '#9fc4d6' : '#e8f1f5'}"/>`;
  return `<svg width="600" height="560" viewBox="0 0 600 560"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f2"/><stop offset="1" stop-color="#fdf6ea"/></linearGradient></defs>
  <rect width="600" height="560" fill="url(#sky)"/><rect x="0" y="500" width="600" height="60" fill="#c9c2b4"/>
  <rect x="40" y="380" width="120" height="120" fill="#e3ddd2"/><rect x="450" y="400" width="120" height="100" fill="#ddd6c9"/>
  <rect x="200" y="50" width="200" height="450" fill="#f4efe6" stroke="#8b8378"/><rect x="200" y="50" width="14" height="450" fill="#e2dccf"/>${s}
  <rect x="270" y="455" width="60" height="45" fill="#5c6f7a"/><circle cx="120" cy="480" r="26" fill="#7f9a6c"/><circle cx="480" cy="480" r="22" fill="#7f9a6c"/>
  <text x="300" y="545" font-size="15" text-anchor="middle" fill="#5a544b" style="${font}">הדמיה לדוגמה · מגדל מגורים 18 קומות</text></svg>`;
}
function midrise() { // ex2: 5 floors, shops at ground
  let s = '';
  for (let f = 0; f < 4; f++) for (let c = 0; c < 8; c++) s += `<rect x="${78 + c * 58}" y="${150 + f * 66}" width="34" height="40" fill="#a9c7d4"/><rect x="${74 + c * 58}" y="${190 + f * 66}" width="42" height="5" fill="#b8ae9c"/>`;
  return `<svg width="600" height="560"><rect width="600" height="560" fill="#eaf2f6"/><rect y="500" width="600" height="60" fill="#c9c2b4"/>
  <rect x="60" y="130" width="480" height="370" fill="#efe7d8" stroke="#8b8378"/>${s}
  <rect x="60" y="414" width="480" height="86" fill="#d9cfbd"/>${[0,1,2,3,4].map(i=>`<rect x="${78+i*92}" y="428" width="74" height="72" fill="#6f8792"/>`).join('')}
  <rect x="60" y="406" width="480" height="10" fill="#8b3a1e"/>
  <text x="300" y="545" font-size="15" text-anchor="middle" fill="#5a544b" style="${font}">הדמיה לדוגמה · מגורים מעל מסחר, 5 קומות</text></svg>`;
}
function school() { // ex3: public building
  return `<svg width="600" height="560"><rect width="600" height="560" fill="#f1f4ec"/><rect y="500" width="600" height="60" fill="#c9c2b4"/>
  <rect x="40" y="250" width="520" height="250" fill="#f6f1e7" stroke="#8b8378"/><rect x="40" y="230" width="520" height="22" fill="#4a5c45"/>
  ${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${62+i*62}" y="280" width="40" height="70" fill="#a6c3b3"/><rect x="${62+i*62}" y="380" width="40" height="70" fill="#a6c3b3"/>`).join('')}
  <rect x="250" y="400" width="100" height="100" fill="#4a5c45"/><path d="M220 230 L300 170 L380 230 Z" fill="#c4582a"/>
  <text x="300" y="545" font-size="15" text-anchor="middle" fill="#5a544b" style="${font}">הדמיה לדוגמה · מרכז קהילתי, 2 קומות</text></svg>`;
}

// ---- the sign itself, A4 landscape, in the municipal template ----
function sign(r, visual) {
  const row = (l, v) => `<div style="display:flex;border-top:2px solid #1a9faf"><div style="width:190px;padding:10px 14px;background:#e9f6f8;font-weight:700;color:#11505a">${l}</div><div style="flex:1;padding:10px 14px;font-size:20px">${v}</div></div>`;
  return `<div style="margin:24px;border:4px solid #1a7b8a;display:flex;height:650px;font-size:18px">
   <div style="width:40%;border-left:3px solid #1a7b8a;display:flex;flex-direction:column">
     <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:10px;overflow:hidden">${visual.replace('<svg width="600" height="560"', '<svg width="380" height="355" viewBox="0 0 600 560"').replace('<svg width="600" height="560" viewBox="0 0 600 560"', '<svg width="380" height="355" viewBox="0 0 600 560"')}</div>
     <div style="padding:12px 16px;border-top:1px solid #ccc;line-height:1.7">שם החברה: <b>${r.company_name}</b> · ח.פ. ${r.company_po_box}<br>כתובת הנכס: <b>${r.company_address}</b></div></div>
   <div style="flex:1;display:flex;flex-direction:column">
     <div style="background:#1a9faf;color:#fff;padding:18px 22px"><div style="display:flex;justify-content:space-between"><div>מס׳ היתר בנייה: <b>${r.permit_number}</b></div><div style="border:1px solid #fff8;padding:4px 10px;font-size:13px;text-align:center">עיריית<br>אשדוד</div></div>
       <div style="font-size:40px;font-weight:900;margin-top:8px">${r.project_name.replace(/^דוגמה \d: /, '')}</div></div>
     ${row('שם היזם', r.developer_name)}${row('שם האדריכל', r.architect_name)}${row('קבלן הביצוע', r.contractor_name + ' · רישיון ' + r.contractor_license)}
     ${row('שם המהנדס', r.engineer_name + ' · רישיון ' + r.engineer_license)}${row('מנהל העבודה', r.site_manager_name)}${row('אחראי הבטיחות', r.safety_officer_name)}
   </div></div><div style="text-align:center;color:#8a8;font-size:14px">שלט לדוגמה · ${r.site_address}</div>`;
}

// ---- organisation plan A3 ----
function plan(street, extra = '', len = 0) {
  return `<svg width="1190" height="842" style="background:#fbfaf6"><defs><pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#e7e2d6"/></pattern></defs>
  <rect width="1190" height="842" fill="url(#g)"/><rect x="0" y="690" width="1190" height="110" fill="#d6d3cc"/><text x="595" y="752" font-size="28" text-anchor="middle" fill="#555" style="${font}">רחוב ${street}</text>
  <rect x="140" y="120" width="900" height="540" fill="#f3ead8" stroke="#8b7355" stroke-width="2" stroke-dasharray="10 6"/>
  <rect x="380" y="230" width="420" height="300" fill="#e2d4bb" stroke="#8b7355"/><text x="590" y="390" font-size="26" text-anchor="middle" fill="#6b5a44" style="${font}">קונטור הבניין</text>
  <rect x="180" y="160" width="140" height="70" fill="#fff" stroke="#1b2a4a"/><text x="250" y="202" font-size="18" text-anchor="middle" style="${font}">משרד אתר</text>
  <circle cx="900" cy="230" r="70" fill="none" stroke="#c4582a" stroke-dasharray="6 6"/><text x="900" y="236" font-size="18" text-anchor="middle" fill="#c4582a" style="${font}">עגורן</text>
  <rect x="120" y="650" width="940" height="20" fill="#1a9faf"/><text x="595" y="640" font-size="18" text-anchor="middle" fill="#11505a" style="${font}">גדר אתר${len ? ` · ${len} מ'` : ''}</text>
  <rect x="520" y="660" width="150" height="34" fill="#fff" stroke="#1b2a4a"/><text x="595" y="683" font-size="16" text-anchor="middle" style="${font}">שער כניסה</text>
  <rect x="230" y="670" width="160" height="16" fill="#8b3a1e"/><text x="310" y="712" font-size="17" text-anchor="middle" fill="#8b3a1e" style="${font}">מיקום שלט הפרויקט</text>${extra}
  <rect x="860" y="30" width="300" height="70" fill="#fff" stroke="#1b2a4a"/><text x="1010" y="60" font-size="18" text-anchor="middle" style="${font}">תכנית התארגנות לדוגמה</text><text x="1010" y="86" font-size="14" text-anchor="middle" fill="#777" style="${font}">A3 · קנ"מ 1:250</text></svg>`;
}

// ---- fence dimensions diagram ----
function fence(total, devPct) {
  const W = 1000, dev = W * devPct / 100;
  return `<svg width="1190" height="500" style="background:#fbfaf6"><text x="595" y="60" font-size="28" text-anchor="middle" style="${font}">תרשים מידות גדר מדברת · דוגמה</text>
  <rect x="${95 + W - dev}" y="160" width="${dev}" height="140" fill="#1a9faf"/><rect x="95" y="160" width="${W - dev}" height="140" fill="#4a5c45"/>
  <text x="${95 + W - dev / 2}" y="238" font-size="24" fill="#fff" text-anchor="middle" style="${font}">תוכן היזם · ${devPct}%</text>
  <text x="${95 + (W - dev) / 2}" y="238" font-size="24" fill="#fff" text-anchor="middle" style="${font}">תוכן עירוני · ${100 - devPct}%</text>
  <line x1="95" y1="340" x2="1095" y2="340" stroke="#1b2a4a" stroke-width="2"/><text x="595" y="375" font-size="22" text-anchor="middle" style="${font}">אורך כולל ${total} מ' · גובה 2.5 מ'</text>
  <text x="595" y="440" font-size="16" fill="#777" text-anchor="middle" style="${font}">${(total * devPct / 100).toFixed(1)} מ' ליזם · ${(total * (100 - devPct) / 100).toFixed(1)} מ' לעירייה</text></svg>`;
}

// ---- field "photos": the sign on the site fence, clearly marked as example ----
function photo(signHtml, mode) {
  const small = mode === 'differs';
  return `<div style="position:relative;width:1200px;height:900px;overflow:hidden;background:linear-gradient(#bcd6e6,#f2ece0 55%)">
   <div style="position:absolute;bottom:0;left:0;right:0;height:240px;background:#9d978c"></div>
   <div style="position:absolute;bottom:200px;left:0;right:0;height:300px;background:repeating-linear-gradient(90deg,#d8d4cb 0 118px,#bdb8ad 118px 122px)"></div>
   <div style="position:absolute;bottom:${small ? 330 : 190}px;${small ? 'left:760px;width:300px;height:200px' : 'left:200px;width:800px;height:533px'};background:#fff;box-shadow:0 12px 30px #0005;overflow:hidden">
     <div style="position:absolute;top:0;right:0;transform:scale(${small ? 0.27 : 0.72});transform-origin:top right;width:1110px">${signHtml}</div></div>
   ${small ? `<div style="position:absolute;bottom:250px;left:200px;width:420px;height:240px;background:#efe9df;border:3px dashed #8b3a1e;display:flex;align-items:center;justify-content:center;color:#8b3a1e;font-size:26px;${font}">כאן היה אמור להיות השלט</div>` : ''}
   <div style="position:absolute;top:24px;right:24px;background:#000a;color:#fff;padding:8px 16px;font-size:22px;${font}">צילום לדוגמה</div></div>`;
}

const R = require('./examples.json');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const shot = async (name, w, h, html) => { await p.setViewportSize({ width: w, height: h }); await p.setContent(base(w, h, html)); await p.screenshot({ path: out + name, type: name.endsWith('.jpg') ? 'jpeg' : 'png', quality: name.endsWith('.jpg') ? 82 : undefined }); };
  const vis = [tower(), midrise(), school()];
  for (let i = 0; i < 3; i++) await shot(`visual-${i + 1}.png`, 600, 560, vis[i]);
  const signs = R.map((r, i) => sign(r, vis[i]));
  for (let i = 0; i < 3; i++) await shot(`sign-${i + 1}.png`, 1123, 740, signs[i]);
  await shot('plan-1.png', 1190, 842, plan('העצמאות'));
  await shot('plan-2.png', 1190, 842, plan('רוגוזין', '', R[1].fence_total_length_meters));
  await shot('fence-2.png', 1190, 500, fence(R[1].fence_total_length_meters, R[1].fence_developer_percent));
  await shot('photo-1.jpg', 1200, 900, photo(signs[0], 'match'));
  await shot('photo-2.jpg', 1200, 900, photo(signs[1], 'differs'));
  await b.close();
})();
