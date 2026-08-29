"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptOrganizerSkill = void 0;
const common_1 = require("@nestjs/common");
const coze_coding_dev_sdk_1 = require("coze-coding-dev-sdk");
const supabase_client_1 = require("../storage/database/supabase-client");
const fs = require("fs");
const CATEGORY_META = {
    building_history: { label: '建筑史', icon: '🏛️', description: '建造、修缮、损毁、扩建' },
    craft_culture: { label: '工艺文化', icon: '🪵', description: '木雕/石雕/砖雕/彩绘技法与流派' },
    iconography: { label: '图像寓意', icon: '🎨', description: '壁画/雕刻/装饰的文化含义' },
    biography: { label: '人物传记', icon: '👤', description: '与祠堂相关的人的生命故事' },
    folk_custom: { label: '民俗风情', icon: '🏮', description: '祭祀、节庆、仪式、禁忌' },
    village_change: { label: '村落变迁', icon: '🏘️', description: '社区、宗族、经济变化' },
};
const STORY_ARCHIVE_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>村庄记忆 · 故事档案馆 v3</title>
<style>
:root {
  --bg:#0f1117; --card:#1a1d27; --border:#2a2e3a;
  --text:#e4e4e7; --text2:#9ca3af; --text3:#6b7280;
  --accent:#FF6A00; --accent-soft:rgba(255,106,0,.12); --accent-border:rgba(255,106,0,.3);
  --green:#34d399; --yellow:#fbbf24; --red:#f87171; --blue:#60a5fa; --purple:#a78bfa; --pink:#f472b6; --cyan:#22d3ee;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);line-height:1.7}

/* ── Header ── */
.header{padding:48px 40px 28px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,#0f1117,#1a1520)}
.header-top{display:flex;align-items:center;gap:12px;margin-bottom:6px}
.badge{background:var(--accent);color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.badge-outline{background:transparent;border:1px solid var(--accent-border);color:var(--accent)}
.header h1{font-size:28px;font-weight:700;letter-spacing:-.5px}
.header p{color:var(--text2);font-size:14px;margin-top:2px}
.stats-row{display:flex;gap:28px;margin-top:18px;flex-wrap:wrap}
.stat-box{display:flex;align-items:baseline;gap:6px}
.stat-num{font-size:26px;font-weight:700;color:var(--accent)}
.stat-label{font-size:13px;color:var(--text2)}

/* ── Nav ── */
.nav{position:sticky;top:0;z-index:100;background:rgba(15,17,23,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);display:flex;padding:0 40px;overflow-x:auto}
.nav-tab{padding:14px 18px;font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;transition:.2s;white-space:nowrap}
.nav-tab:hover{color:var(--text)}
.nav-tab.active{color:var(--accent);border-bottom-color:var(--accent)}

.content{padding:32px 40px;max-width:1200px}
.section{margin-bottom:40px}
.section-head{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.section-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.section-title{font-size:18px;font-weight:600}
.tab-panel{display:none}
.tab-panel.active{display:block}

/* ── Narrative Cards ── */
.narr-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:20px;transition:border-color .2s}
.narr-card:hover{border-color:var(--accent-border)}
.narr-top{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.narr-icon{font-size:24px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:10px;flex-shrink:0}
.narr-name{font-size:17px;font-weight:600}
.cat-badge{font-size:11px;padding:2px 10px;border-radius:20px;font-weight:500;margin-left:8px}
.cat-building_history{background:rgba(96,165,250,.12);color:var(--blue)}
.cat-craft_culture{background:rgba(255,106,0,.12);color:var(--accent)}
.cat-iconography{background:rgba(167,139,250,.12);color:var(--purple)}
.cat-biography{background:rgba(52,211,153,.12);color:var(--green)}
.cat-folk_custom{background:rgba(244,114,182,.12);color:var(--pink)}
.cat-village_change{background:rgba(34,211,238,.12);color:var(--cyan)}

/* Completeness bar */
.comp-wrap{display:flex;align-items:center;gap:10px;margin-left:auto}
.comp-bar{width:80px;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden}
.comp-fill{height:100%;border-radius:3px;transition:width .3s}
.comp-num{font-size:13px;font-weight:600;min-width:36px;text-align:right}

/* Visitor hook */
.visitor-hook{font-size:15px;font-weight:500;color:var(--accent);margin-bottom:14px;padding:12px 16px;background:var(--accent-soft);border-radius:10px;border-left:3px solid var(--accent)}
/* Narrative text */
.narr-text{font-size:14px;line-height:2;color:var(--text);margin-bottom:14px;text-align:justify}
.narr-text em{color:var(--purple);font-style:normal;font-weight:500}
/* Key quote */
.key-quote{font-size:13px;color:var(--purple);padding:10px 16px;background:rgba(167,139,250,.06);border-left:3px solid var(--purple);border-radius:0 8px 8px 0;margin-bottom:14px}
/* Missing pieces */
.missing{margin-top:12px}
.missing-title{font-size:12px;font-weight:600;color:var(--yellow);margin-bottom:6px;letter-spacing:.5px}
.missing-list{display:flex;flex-wrap:wrap;gap:6px}
.missing-tag{font-size:12px;padding:4px 12px;border-radius:20px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);color:var(--yellow)}

/* ── Fragments ── */
.frag-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:14px;cursor:pointer;transition:border-color .2s}
.frag-card:hover{border-color:var(--accent-border)}
.frag-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.frag-icon{font-size:20px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:var(--accent-soft);border-radius:8px;flex-shrink:0}
.frag-name{font-size:15px;font-weight:600}
.frag-summary{color:var(--accent);font-size:14px;font-weight:500;padding-left:14px;border-left:3px solid var(--accent);margin-bottom:10px}
.flags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.flag{font-size:12px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid var(--border)}
.flag-verify{border-color:rgba(251,191,36,.3);color:var(--yellow)}
.flag-new{border-color:rgba(52,211,153,.3);color:var(--green)}
.flag-ok{border-color:rgba(96,165,250,.2);color:var(--blue)}
.frag-detail{display:none;margin-top:14px}
.frag-card.open .frag-detail{display:block}
.dialect-block,.mandarin-block{padding:14px 16px;border-radius:8px;font-size:14px;margin-bottom:10px;line-height:1.8}
.dialect-block{background:rgba(167,139,250,.06);border:1px solid rgba(167,139,250,.15)}
.mandarin-block{background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.15)}
.block-label{font-size:11px;font-weight:600;letter-spacing:1px;margin-bottom:6px}
.dialect-block .block-label{color:var(--purple)}
.mandarin-block .block-label{color:var(--blue)}

/* ── Timeline ── */
.timeline{position:relative;padding-left:28px}
.timeline::before{content:'';position:absolute;left:7px;top:8px;bottom:8px;width:2px;background:linear-gradient(180deg,var(--accent),var(--purple));border-radius:2px}
.tl-item{position:relative;margin-bottom:24px;padding-left:20px}
.tl-dot{position:absolute;left:-24px;top:8px;width:16px;height:16px;border-radius:50%;border:3px solid var(--accent);background:var(--bg)}
.tl-dot.guess{border-color:var(--yellow)}
.tl-dot.confirmed{border-color:var(--green);background:var(--green)}
.tl-period{font-size:15px;font-weight:600;color:var(--accent);margin-bottom:4px}
.tl-confidence{font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px;font-weight:500;vertical-align:middle}
.conf-确定{background:rgba(52,211,153,.15);color:var(--green)}
.conf-待核实{background:rgba(251,191,36,.15);color:var(--yellow)}
.conf-推测{background:rgba(167,139,250,.15);color:var(--purple)}
.tl-events{font-size:14px;line-height:1.8}
.tl-people{font-size:12px;color:var(--text2);margin-top:4px}
.tl-people span{background:rgba(255,255,255,.06);padding:1px 8px;border-radius:10px;margin-right:6px}

/* ── Characters ── */
.char-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.char-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:22px;transition:border-color .2s}
.char-card:hover{border-color:var(--accent-border)}
.char-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.char-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#ff9a44);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0}
.char-name{font-size:16px;font-weight:600}
.char-aliases{font-size:12px;color:var(--text2)}
.char-mention{margin-left:auto;font-size:11px;color:var(--text2);background:rgba(255,255,255,.05);padding:2px 8px;border-radius:10px}
.char-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.char-tag{font-size:12px;padding:3px 10px;border-radius:20px;background:var(--accent-soft);color:var(--accent);border:1px solid var(--accent-border)}
.char-threads{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.char-thread{font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(96,165,250,.1);color:var(--blue);border:1px solid rgba(96,165,250,.2)}
.char-story{font-size:13px;color:var(--text2);line-height:1.8;margin-bottom:10px}
.char-quote{font-size:13px;color:var(--purple);padding:8px 14px;background:rgba(167,139,250,.06);border-left:3px solid var(--purple);border-radius:0 8px 8px 0;margin-bottom:8px}
.char-verify{font-size:12px;color:var(--yellow);margin-top:6px}

/* ── Relationship ── */
.rel-canvas-wrap{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;min-height:380px;position:relative;overflow:hidden}
.rel-svg{width:100%;height:380px}
.rel-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;margin-top:16px}
.rel-item{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;padding:12px 16px;font-size:13px}
.rel-type{font-size:11px;font-weight:600;padding:2px 10px;border-radius:10px;white-space:nowrap;flex-shrink:0}
.rel-arrow{color:var(--accent);font-weight:700;flex-shrink:0}

/* ── Cross Ref & Plan ── */
.insight-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px 20px;margin-bottom:10px;font-size:14px;line-height:1.8;color:var(--text2)}
.insight-card strong{color:var(--text);font-weight:600}
.plan-card{background:var(--card);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:10px;padding:16px 20px;margin-bottom:10px;font-size:14px;line-height:1.8;color:var(--text2)}
.plan-card strong{color:var(--text)}
</style>
</head>
<body>

<div class="header">
  <div class="header-top">
    <span class="badge">村庄记忆</span>
    <span class="badge badge-outline">故事档案馆 v3</span>
    <span style="font-size:12px;color:var(--text3);margin-left:8px">__NOTE__</span>
  </div>
  <h1>__TITLE__</h1>
  <p>__SUBTITLE__</p>
  <div class="stats-row" id="statsRow"></div>
</div>

<div class="nav" id="navBar"></div>

<div class="content" id="mainContent"></div>

<script>
// ═══════════════════════════════════════════════════
//  Data — will be loaded from JSON
// ═══════════════════════════════════════════════════
let DATA = __DATA_JSON__;

const CAT_META = {
  building_history: { label:'建筑史', icon:'🏛️', cls:'cat-building_history' },
  craft_culture:    { label:'工艺文化', icon:'🪵', cls:'cat-craft_culture' },
  iconography:      { label:'图像寓意', icon:'🎨', cls:'cat-iconography' },
  biography:        { label:'人物传记', icon:'👤', cls:'cat-biography' },
  folk_custom:      { label:'民俗风情', icon:'🏮', cls:'cat-folk_custom' },
  village_change:   { label:'村落变迁', icon:'🏘️', cls:'cat-village_change' },
};

function catOf(k){ if(CAT_META[k]) return CAT_META[k]; for(const kk in CAT_META){ if(CAT_META[kk].label===k) return CAT_META[kk]; } return {label:k,cls:''}; }

const TYPE_COLORS = {
  '师徒':'#FF6A00','父子':'#60a5fa','祖孙':'#34d399','雇佣':'#fbbf24',
  '夫妻':'#f472b6','邻里':'#22d3ee','同行':'#a78bfa','合作':'#FF6A00',
  '家族长辈-晚辈':'#a78bfa','叔侄':'#a78bfa','主雇':'#fbbf24'
};

function compColor(v) {
  if (v >= 80) return 'var(--green)';
  if (v >= 60) return 'var(--blue)';
  if (v >= 30) return 'var(--yellow)';
  return 'var(--red)';
}

function compLabel(v) {
  if (v >= 80) return '丰满';
  if (v >= 60) return '可用';
  if (v >= 30) return '骨架';
  return '碎片';
}

// ═══════════════════════════════════════════════════
//  Render functions
// ═══════════════════════════════════════════════════

function renderStats() {
  const d = DATA;
  const el = document.getElementById('statsRow');
  const items = [
    [d.narratives.length, '故事线'],
    [d.fragments.length, '新片段'],
    [d.characters.length, '人物档案'],
    [d.timeline.length, '时间节点'],
    [d.relationship_map.length, '关系线索'],
  ];
  el.innerHTML = items.map(([n,l]) =>
    \`<div class="stat-box"><span class="stat-num">\${n}</span><span class="stat-label">\${l}</span></div>\`
  ).join('');
}

function renderNav() {
  const tabs = [
    ['narratives','导览故事'],
    ['fragments','采访原文'],
    ['timeline','时间脉络'],
    ['characters','人物档案'],
    ['relations','关系图谱'],
    ['insights','关联 & 计划'],
  ];
  document.getElementById('navBar').innerHTML = tabs.map(([id,label], i) =>
    \`<div class="nav-tab\${i===0?' active':''}" data-tab="\${id}">\${label}</div>\`
  ).join('');

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
    });
  });
}

// ── Narratives ──
function renderNarratives() {
  const html = DATA.narratives.map(n => {
    const cat = catOf(n.category);
    const color = compColor(n.completeness);
    const label = compLabel(n.completeness);
    const missingHtml = n.missing_pieces.length
      ? \`<div class="missing"><div class="missing-title">📋 还缺什么</div><div class="missing-list">\${n.missing_pieces.map(m=>\`<span class="missing-tag">\${m}</span>\`).join('')}</div></div>\`
      : '';
    // Highlight dialect quotes in narrative (wrapped in「」)
    const narrativeHtml = n.narrative.replace(/[「""]([^」""]+)[」""]/g, '<em>「$1」</em>');

    return \`<div class="narr-card">
      <div class="narr-top">
        <div class="narr-icon" style="background:var(--accent-soft)">\${cat.icon || '📖'}</div>
        <div>
          <span class="narr-name">\${n.story_thread_name}</span>
          <span class="cat-badge \${cat.cls}">\${cat.label}</span>
        </div>
        <div class="comp-wrap">
          <span style="font-size:11px;color:var(--text3)">\${label}</span>
          <div class="comp-bar"><div class="comp-fill" style="width:\${n.completeness}%;background:\${color}"></div></div>
          <span class="comp-num" style="color:\${color}">\${n.completeness}%</span>
        </div>
      </div>
      <div class="visitor-hook">\${n.visitor_hook}</div>
      <div class="narr-text">\${narrativeHtml}</div>
      <div class="key-quote">"\${n.key_quote}"</div>
      \${missingHtml}
    </div>\`;
  }).join('');

  return \`<div class="section">
    <div class="section-head">
      <div class="section-icon" style="background:var(--accent-soft)">📖</div>
      <span class="section-title">导览故事 <span style="font-weight:400;font-size:13px;color:var(--text2)">（每条故事线的可读导览版本）</span></span>
    </div>
    \${html}
  </div>\`;
}

// ── Fragments ──
function renderFragments() {
  const html = DATA.fragments.map((f, i) => {
    const cat = catOf(f.category);
    const flagsHtml = (f.flags||[]).map(fl => {
      let cls = 'flag';
      if (fl.includes('待核实')) cls += ' flag-verify';
      else if (fl.includes('新发现')) cls += ' flag-new';
      else cls += ' flag-ok';
      return \`<span class="\${cls}">\${fl}</span>\`;
    }).join('');
    return \`<div class="frag-card" onclick="this.classList.toggle('open')">
      <div class="frag-header">
        <div class="frag-icon">\${f.icon || cat.icon || '📝'}</div>
        <span class="frag-name">\${f.story_thread_name}</span>
        <span class="cat-badge \${cat.cls||''}" style="margin-left:auto">\${cat.label||f.category}</span>
      </div>
      <div class="frag-summary">\${f.summary}</div>
      <div class="flags">\${flagsHtml}</div>
      <div class="frag-detail">
        <div class="dialect-block"><div class="block-label">方言原文</div>\${f.dialect_original}</div>
        <div class="mandarin-block"><div class="block-label">普通话转写</div>\${f.mandarin_text}</div>
      </div>
    </div>\`;
  }).join('');

  return \`<div class="section">
    <div class="section-head">
      <div class="section-icon" style="background:rgba(96,165,250,.12)">📝</div>
      <span class="section-title">采访原文 <span style="font-weight:400;font-size:13px;color:var(--text2)">（点击展开方言/普通话对照）</span></span>
    </div>
    \${html}
  </div>\`;
}

// ── Timeline ──
function renderTimeline() {
  const html = DATA.timeline.map(t => {
    const dotCls = t.confidence === '确定' ? 'confirmed' : t.confidence === '推测' ? 'guess' : '';
    const peopleHtml = (t.related_people||[]).map(p => \`<span>\${p}</span>\`).join('');
    return \`<div class="tl-item">
      <div class="tl-dot \${dotCls}"></div>
      <div class="tl-period">\${t.period}<span class="tl-confidence conf-\${t.confidence}">\${t.confidence}</span></div>
      <div class="tl-events">\${t.events.join(' → ')}</div>
      \${peopleHtml ? \`<div class="tl-people">\${peopleHtml}</div>\` : ''}
    </div>\`;
  }).join('');

  return \`<div class="section">
    <div class="section-head">
      <div class="section-icon" style="background:rgba(96,165,250,.12)">📅</div>
      <span class="section-title">时间脉络</span>
    </div>
    <div class="timeline">\${html}</div>
  </div>\`;
}

// ── Characters ──
function renderCharacters() {
  const html = DATA.characters.map(c => {
    const tagsHtml = c.tags.map(t=>\`<span class="char-tag">\${t}</span>\`).join('');
    const threadsHtml = (c.related_story_threads||[]).map(t=>\`<span class="char-thread">📖 \${t}</span>\`).join('');
    const quotesHtml = (c.key_quotes||[]).map(q=>\`<div class="char-quote">"\${q}"</div>\`).join('');
    const verifyHtml = (c.verify_flags||[]).length ? \`<div class="char-verify">⚠️ \${c.verify_flags.join(' · ')}</div>\` : '';
    const aliasStr = (c.aliases||[]).length ? \`又称：\${c.aliases.join('、')}\` : '';
    return \`<div class="char-card">
      <div class="char-top">
        <div class="char-avatar">\${c.name.charAt(0)}</div>
        <div><div class="char-name">\${c.name}</div><div class="char-aliases">\${aliasStr}</div></div>
        <span class="char-mention">提及 \${c.mention_count} 次</span>
      </div>
      <div class="char-tags">\${tagsHtml}</div>
      \${threadsHtml ? \`<div class="char-threads">\${threadsHtml}</div>\` : ''}
      <div class="char-story">\${c.story}</div>
      \${quotesHtml}
      \${verifyHtml}
    </div>\`;
  }).join('');

  return \`<div class="section">
    <div class="section-head">
      <div class="section-icon" style="background:rgba(52,211,153,.12)">👤</div>
      <span class="section-title">人物档案</span>
    </div>
    <div class="char-grid">\${html}</div>
  </div>\`;
}

// ── Relationships ──
function renderRelations() {
  // SVG graph
  const names = [...new Set(DATA.relationship_map.flatMap(r => [r.from, r.to]))];
  const cx = 350, cy = 190, radius = 150;
  const positions = {};
  names.forEach((name, i) => {
    const angle = (2 * Math.PI * i / names.length) - Math.PI/2;
    positions[name] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  let svgContent = '';
  // edges
  DATA.relationship_map.forEach(r => {
    const f = positions[r.from], t = positions[r.to];
    if (!f || !t) return;
    const color = TYPE_COLORS[r.type] || '#666';
    const mx = (f.x+t.x)/2, my = (f.y+t.y)/2;
    svgContent += \`<line x1="\${f.x}" y1="\${f.y}" x2="\${t.x}" y2="\${t.y}" stroke="\${color}" stroke-width="2" stroke-opacity="0.5"/>\`;
    svgContent += \`<text x="\${mx}" y="\${my-6}" text-anchor="middle" fill="\${color}" font-size="11" font-weight="500">\${r.type}</text>\`;
  });
  // nodes
  Object.entries(positions).forEach(([name, pos]) => {
    svgContent += \`<circle cx="\${pos.x}" cy="\${pos.y}" r="24" fill="#1a1d27" stroke="#FF6A00" stroke-width="2"/>\`;
    svgContent += \`<text x="\${pos.x}" y="\${pos.y+1}" text-anchor="middle" dominant-baseline="central" fill="#FF6A00" font-size="14" font-weight="700">\${name.charAt(0)}</text>\`;
    svgContent += \`<text x="\${pos.x}" y="\${pos.y+40}" text-anchor="middle" fill="#e4e4e7" font-size="12" font-weight="500">\${name}</text>\`;
  });

  const listHtml = DATA.relationship_map.map(r => {
    const color = TYPE_COLORS[r.type] || '#666';
    return \`<div class="rel-item">
      <strong>\${r.from}</strong><span class="rel-arrow">→</span><strong>\${r.to}</strong>
      <span class="rel-type" style="background:\${color}22;color:\${color}">\${r.type}</span>
      <span style="color:var(--text2);font-size:12px">\${r.detail}</span>
    </div>\`;
  }).join('');

  return \`<div class="section">
    <div class="section-head">
      <div class="section-icon" style="background:rgba(167,139,250,.12)">🔗</div>
      <span class="section-title">人物关系图谱</span>
    </div>
    <div class="rel-canvas-wrap"><svg class="rel-svg" viewBox="0 0 700 380">\${svgContent}</svg></div>
    <div class="rel-list">\${listHtml}</div>
  </div>\`;
}

// ── Cross References & Plan ──
function renderInsights() {
  const crossHtml = (DATA.cross_references||[]).map(c =>
    \`<div class="insight-card">\${c.replace(/「([^」]+)」/g, '<strong>「$1」</strong>')}</div>\`
  ).join('');

  const planHtml = (DATA.next_interview_plan||[]).map(p =>
    \`<div class="plan-card">\${p.replace(/「([^」]+)」/g, '<strong>「$1」</strong>')}</div>\`
  ).join('');

  return \`
    <div class="section">
      <div class="section-head">
        <div class="section-icon" style="background:rgba(96,165,250,.12)">🔄</div>
        <span class="section-title">跨故事线关联</span>
      </div>
      \${crossHtml}
    </div>
    <div class="section">
      <div class="section-head">
        <div class="section-icon" style="background:var(--accent-soft)">📋</div>
        <span class="section-title">下次采访计划</span>
      </div>
      \${planHtml}
    </div>\`;
}

// ═══════════════════════════════════════════════════
//  Init
// ═══════════════════════════════════════════════════
async function init() {
  renderStats();
  renderNav();

  const panels = [
    ['narratives', renderNarratives],
    ['fragments', renderFragments],
    ['timeline', renderTimeline],
    ['characters', renderCharacters],
    ['relations', renderRelations],
    ['insights', renderInsights],
  ];

  const main = document.getElementById('mainContent');
  main.innerHTML = panels.map(([id, fn]) =>
    \`<div id="tab-\${id}" class="tab-panel\${id==='narratives'?' active':''}">\${fn()}</div>\`
  ).join('');
}

init();
</script>
</body>
</html>
`;
let TranscriptOrganizerSkill = class TranscriptOrganizerSkill {
    constructor() {
        this.SINGLE_CALL_LIMIT = 4000;
    }
    get client() {
        return (0, supabase_client_1.getSupabaseClient)();
    }
    getASRClient() {
        return new coze_coding_dev_sdk_1.ASRClient(new coze_coding_dev_sdk_1.Config());
    }
    getLLMClient() {
        return new coze_coding_dev_sdk_1.LLMClient(new coze_coding_dev_sdk_1.Config());
    }
    getStorage() {
        return new coze_coding_dev_sdk_1.S3Storage({
            endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
            accessKey: process.env.COZE_BUCKET_ACCESS_KEY || '',
            secretKey: process.env.COZE_BUCKET_SECRET_KEY || '',
            bucketName: process.env.COZE_BUCKET_NAME,
            region: 'cn-beijing',
        });
    }
    async uploadAudio(file) {
        if (!file)
            throw new common_1.BadRequestException('未收到音频文件');
        const storage = this.getStorage();
        let fileBuffer;
        if (file.path) {
            fileBuffer = await fs.promises.readFile(file.path);
        }
        else if (file.buffer) {
            fileBuffer = file.buffer;
        }
        else {
            throw new common_1.BadRequestException('无法获取文件内容');
        }
        const fileName = `audio/${Date.now()}_${file.originalname || 'recording.wav'}`;
        const audioKey = await storage.uploadFile({
            fileContent: fileBuffer,
            fileName,
            contentType: file.mimetype || 'audio/wav',
        });
        return { audio_key: audioKey };
    }
    async transcribe(topicId, audioKey, subtopicId, intervieweeName) {
        const storage = this.getStorage();
        const audioUrl = await storage.generatePresignedUrl({ key: audioKey, expireTime: 3600 });
        const asrClient = this.getASRClient();
        let transcript = '';
        try {
            const result = await asrClient.recognize({ uid: 'village-memory', url: audioUrl });
            transcript = result.text || '';
        }
        catch (err) {
            console.error('ASR 识别失败:', err);
            throw new common_1.BadRequestException('语音识别失败，请重试');
        }
        if (!transcript)
            throw new common_1.BadRequestException('未识别到语音内容');
        const analysis = await this.organizeTranscript(topicId, transcript, { hasAudio: true });
        const record = await this.saveRecordAndUpdateStoryThreads(topicId, {
            subtopicId,
            audioKey,
            text: transcript,
            analysis,
            intervieweeName,
        });
        return this.formatResult(transcript, analysis, record?.id);
    }
    async transcribeText(topicId, text, subtopicId, intervieweeName) {
        const analysis = await this.organizeTranscript(topicId, text, { hasAudio: false });
        const record = await this.saveRecordAndUpdateStoryThreads(topicId, {
            subtopicId,
            text,
            analysis,
            intervieweeName,
        });
        return this.formatResult(text, analysis, record?.id);
    }
    async getStoryMap(topicId) {
        const { data: records, error } = await this.client
            .from('interview_records')
            .select('ai_analysis, created_at')
            .eq('topic_id', topicId)
            .eq('status', 'completed')
            .order('created_at', { ascending: true });
        if (error)
            throw new Error(`查询失败: ${error.message}`);
        const narrativeMap = new Map();
        const allCharacters = new Map();
        const allTimeline = [];
        const allRelationships = [];
        for (const r of records || []) {
            const analysis = r.ai_analysis;
            if (!analysis)
                continue;
            for (const n of analysis.narratives || []) {
                narrativeMap.set(n.story_thread_name, n);
            }
            for (const c of analysis.characters || []) {
                const existing = allCharacters.get(c.name);
                if (!existing || c.story.length > existing.story.length) {
                    allCharacters.set(c.name, {
                        ...c,
                        tags: [...new Set([...(existing?.tags || []), ...c.tags])],
                        key_quotes: [...new Set([...(existing?.key_quotes || []), ...c.key_quotes])],
                        mention_count: (existing?.mention_count || 0) + c.mention_count,
                    });
                }
            }
            allTimeline.push(...(analysis.timeline || []));
            allRelationships.push(...(analysis.relationship_map || []));
        }
        const uniqueTimeline = this.deduplicateTimeline(allTimeline);
        const uniqueRelationships = this.deduplicateRelationships(allRelationships);
        return {
            narratives: [...narrativeMap.values()].sort((a, b) => b.completeness - a.completeness),
            characters: [...allCharacters.values()].sort((a, b) => b.mention_count - a.mention_count),
            timeline: uniqueTimeline,
            relationship_map: uniqueRelationships,
            total_interviews: (records || []).length,
        };
    }
    async getByTopic(topicId) {
        const { data, error } = await this.client
            .from('interview_records')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`查询采访记录失败: ${error.message}`);
        return data || [];
    }
    async confirmRecord(recordId, editedText, subtopicId) {
        const { data: record, error: fetchErr } = await this.client
            .from('interview_records')
            .select('*')
            .eq('id', recordId)
            .single();
        if (fetchErr)
            throw new Error(`查询记录失败: ${fetchErr.message}`);
        if (!record)
            throw new Error('记录不存在');
        const finalSubtopicId = subtopicId || record.subtopic_id;
        const updateData = { confirm_status: 'confirmed' };
        if (editedText && editedText.trim()) {
            updateData.transcript_text = editedText.trim();
            updateData.mandarin_text = editedText.trim();
        }
        if (subtopicId) {
            updateData.subtopic_id = subtopicId;
        }
        const { error: updateErr } = await this.client
            .from('interview_records')
            .update(updateData)
            .eq('id', recordId)
            .select()
            .single();
        if (updateErr)
            throw new Error(`确认记录失败: ${updateErr.message}`);
        const finalText = editedText?.trim() || record.transcript_text || record.mandarin_text || '';
        const title = record.interviewee_name
            ? `${record.interviewee_name}的采访记录`
            : `采访记录 ${new Date(record.created_at).toLocaleDateString('zh-CN')}`;
        const tags = ['历史采访沉淀'];
        if (finalSubtopicId) {
            const { data: subtopic } = await this.client
                .from('subtopics')
                .select('name')
                .eq('id', finalSubtopicId)
                .maybeSingle();
            if (subtopic?.name)
                tags.push(subtopic.name);
        }
        const { data: material, error: matErr } = await this.client
            .from('reference_materials')
            .insert({
            topic_id: record.topic_id,
            subtopic_id: finalSubtopicId || null,
            source: 'interview',
            title,
            content: finalText,
            tags,
            structured_data: record.ai_analysis || null,
        })
            .select()
            .single();
        if (matErr)
            throw new Error(`保存到资料库失败: ${matErr.message}`);
        return { record: { ...record, confirm_status: 'confirmed', subtopic_id: finalSubtopicId }, material };
    }
    async rejectRecord(recordId) {
        const { data, error } = await this.client
            .from('interview_records')
            .update({ confirm_status: 'rejected' })
            .eq('id', recordId)
            .select()
            .single();
        if (error)
            throw new Error(`驳回记录失败: ${error.message}`);
        return data;
    }
    async uploadAndParseDocument(file, topicId, subtopicId, intervieweeName) {
        if (!file)
            throw new common_1.BadRequestException('未收到文档文件');
        const storage = this.getStorage();
        let fileBuffer;
        if (file.path) {
            fileBuffer = await fs.promises.readFile(file.path);
        }
        else if (file.buffer) {
            fileBuffer = file.buffer;
        }
        else {
            throw new common_1.BadRequestException('无法获取文件内容');
        }
        const ext = (file.originalname || 'document.txt').split('.').pop()?.toLowerCase() || 'txt';
        const fileName = `documents/${Date.now()}_${file.originalname || 'document'}`;
        const docKey = await storage.uploadFile({
            fileContent: fileBuffer,
            fileName,
            contentType: file.mimetype || this.getMimeType(ext),
        });
        const docUrl = await storage.generatePresignedUrl({ key: docKey, expireTime: 3600 });
        let extractedText = '';
        try {
            const fetchClient = new coze_coding_dev_sdk_1.FetchClient(new coze_coding_dev_sdk_1.Config());
            const response = await fetchClient.fetch(docUrl);
            if (response.status_code !== 0) {
                throw new Error(`文档解析失败: ${response.status_message || '未知错误'}`);
            }
            extractedText = response.content
                .filter((item) => item.type === 'text')
                .map((item) => item.text)
                .join('\n');
            if (!extractedText) {
                throw new common_1.BadRequestException('文档中未提取到有效文本内容');
            }
        }
        catch (err) {
            console.error('文档解析失败:', err);
            throw new common_1.BadRequestException('文档解析失败，请确认文件格式正确（支持 PDF/Word/TXT）');
        }
        const analysis = await this.organizeTranscript(topicId, extractedText, { hasAudio: false });
        await this.saveRecordAndUpdateStoryThreads(topicId, {
            subtopicId,
            audioKey: docKey,
            text: extractedText,
            analysis,
            intervieweeName,
        });
        return {
            ...this.formatResult(extractedText, analysis),
            document_key: docKey,
            document_name: file.originalname,
        };
    }
    getMimeType(ext) {
        const map = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain',
            csv: 'text/csv',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };
        return map[ext] || 'application/octet-stream';
    }
    async saveRecordAndUpdateStoryThreads(topicId, opts) {
        const { subtopicId, audioKey, text, analysis, intervieweeName } = opts;
        const { data: record, error } = await this.client
            .from('interview_records')
            .insert({
            topic_id: topicId,
            subtopic_id: subtopicId || null,
            audio_key: audioKey || null,
            transcript_text: text,
            dialect_original: analysis.fragments.map((s) => s.dialect_original).join('\n\n') || text,
            mandarin_text: analysis.fragments.map((s) => s.mandarin_text).join('\n\n') || text,
            status: 'completed',
            confirm_status: 'pending',
            interviewee_name: intervieweeName || null,
            ai_analysis: analysis,
        })
            .select()
            .single();
        if (error)
            throw new Error(`保存采访记录失败: ${error.message}`);
        if (subtopicId) {
            await this.client
                .from('subtopics')
                .update({ transcript_status: 'transcribed' })
                .eq('id', subtopicId);
        }
        const matchedIds = analysis.fragments
            .map((s) => s.story_thread_id)
            .filter((id) => !!id && id !== subtopicId);
        for (const id of [...new Set(matchedIds)]) {
            await this.client
                .from('subtopics')
                .update({ transcript_status: 'transcribed' })
                .eq('id', id);
        }
        return record;
    }
    formatResult(transcript, analysis, recordId) {
        return {
            transcript,
            record_id: recordId || null,
            fragments: analysis.fragments,
            narratives: analysis.narratives,
            timeline: analysis.timeline,
            characters: analysis.characters,
            relationship_map: analysis.relationship_map,
            cross_references: analysis.cross_references,
            next_interview_plan: analysis.next_interview_plan,
        };
    }
    async organizeTranscript(topicId, text, opts = { hasAudio: false }) {
        const { data: topic } = await this.client
            .from('topics')
            .select('name, description')
            .eq('id', topicId)
            .maybeSingle();
        const { data: subtopics } = await this.client
            .from('subtopics')
            .select('id, name, icon, transcript_status, summary')
            .eq('topic_id', topicId);
        const { data: existingRecords } = await this.client
            .from('interview_records')
            .select('mandarin_text, dialect_original, ai_analysis, created_at')
            .eq('topic_id', topicId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10);
        const existingNarratives = [];
        const knownCharacters = [];
        for (const r of existingRecords || []) {
            const prev = r.ai_analysis;
            if (!prev)
                continue;
            for (const n of prev.narratives || []) {
                if (!existingNarratives.find((e) => e.story_thread_name === n.story_thread_name)) {
                    existingNarratives.push(n);
                }
            }
            for (const c of prev.characters || []) {
                knownCharacters.push(`${c.name}（${c.tags.join('、')}）`);
            }
        }
        const subtopicList = (subtopics || [])
            .map((s) => `${s.id}|${s.icon || '📌'} ${s.name}|${s.transcript_status}|${s.summary || ''}`)
            .join('\n');
        const buildCtxStrings = (sessionNarratives = [], sessionCharacters = []) => {
            const merged = [...existingNarratives];
            for (const n of sessionNarratives) {
                const idx = merged.findIndex((e) => e.story_thread_name === n.story_thread_name);
                if (idx >= 0)
                    merged[idx] = n;
                else
                    merged.push(n);
            }
            const storyLineSummary = merged.length > 0
                ? merged.map((n) => `【${CATEGORY_META[n.category]?.label || n.category}】${n.story_thread_name}（完整度${n.completeness}%）\n` +
                    `  导览：${n.narrative.substring(0, 150)}...\n` +
                    `  缺失：${n.missing_pieces.join('；') || '暂无'}`).join('\n\n')
                : '暂无已有故事线（这是第一次采访）';
            const knownCharStr = [...new Set([...knownCharacters, ...sessionCharacters])].join('；') || '暂无';
            return { storyLineSummary, knownCharStr };
        };
        const timeRangeField = opts.hasAudio
            ? '"time_range": "估算的时间范围，如 [00:00-05:30]",'
            : '';
        const systemPrompt = `你是"村庄记忆"的故事档案师，兼具口述历史学者的严谨和资深导游的叙事魅力。

## 你的角色

你不是简单的转录员。你是一个有记忆的导游——记得之前所有的采访内容，知道哪些故事已经讲得很完整、哪些还有缺口。每次新采访进来，你要做两件事：
1. 把新内容归到对的故事线里（如果是新故事，就开一条新线）
2. 融合新旧信息，更新该故事线的导览叙事

## 六大故事分类

每段采访内容必须归入以下分类之一：
- **building_history**（建筑史）：祠堂的建造、修缮、损毁、扩建、选址、风水
- **craft_culture**（工艺文化）：木雕/石雕/砖雕/彩绘/灰塑的技法、流派、材料、匠人传承
- **iconography**（图像寓意）：壁画/雕刻/装饰图案的文化含义（如八仙过海、双龙戏珠、麒麟送子、梅兰竹菊）
- **biography**（人物传记）：与祠堂命运交织的人的生命故事
- **folk_custom**（民俗风情）：在祠堂举行的祭祀、节庆、婚丧、宗族仪式
- **village_change**（村落变迁）：围绕祠堂展开的社区、宗族、经济、人口变化

## 导览叙事写作要求

这是整个 skill 最重要的输出。每条故事线要写一段 200-500 字的导览文字，要求：

1. **开头抓人**：用一个问题、一个画面或一句老人的原话开头，让听的人立刻被吸引
2. **有节奏**：大事件用短句，细节用长句，留有停顿感。不是平铺直叙的百科全书
3. **保留人味**：适当嵌入方言原话（用引号标出），让游客感受到这是真实的口述，不是编的
4. **有温度**：不只是信息罗列，要有情感。一个匠人一辈子的坚守、一场大火毁掉的不只是建筑
5. **承认不确定**：遇到待核实的信息，用"据老人回忆""村中流传的说法是"等措辞，而不是编造细节
6. **为游客服务**：适当加入"你现在看到的这根梁上的..."等指引性语言，让故事和实物对应

如果已有故事线有旧版叙事，你要在旧版基础上融入新信息更新，不是从零重写。

## 故事完整度评估

每条故事线给一个 0-100 的完整度分数：
- 0-30：碎片级，只有只言片语
- 30-60：骨架级，主线清楚但缺细节
- 60-80：可用级，可以给游客讲了但还有明显缺口
- 80-100：丰满级，信息充足、有细节、有温度

同时列出 missing_pieces（缺失的信息），要具体到可执行的采访问题。

## 方言处理原则

- 方言原话一个字都不能改，完整保留
- 普通话转写是辅助理解层，忠实转写不润色
- 导览叙事里可以选择性嵌入最生动的方言原话（加引号），增强现场感

## 待核实标记

自动识别并标记：
- 具体日期/年份（如"清道光年间""1920年代"）
- 人名
- 事实性断言（如"建于嘉庆年间""共有三进"）
- 传闻性说法（"听老人讲""据说""好像是"）

## 输出格式

严格返回以下 JSON（不要在 JSON 外面写任何文字）：
{
  "fragments": [
    {
      "story_thread_id": "匹配到的已有故事线ID，没有则为null",
      "story_thread_name": "故事线名称",
      "category": "building_history|craft_culture|iconography|biography|folk_custom|village_change",
      "icon": "emoji图标",
      "dialect_original": "方言原话（完整保留）",
      "mandarin_text": "普通话转写",
      "summary": "一两句概括",
      ${timeRangeField}
      "flags": ["⚠️ 待核实：xxx", "🆕 新发现：xxx", "✅ 信息明确"]
    }
  ],
  "narratives": [
    {
      "story_thread_name": "故事线名称",
      "category": "分类",
      "narrative": "200-500字的导览叙事（如果有旧版就融合更新）",
      "key_quote": "最具感染力的一句方言原话",
      "visitor_hook": "一句话引子，吸引游客注意力",
      "completeness": 65,
      "missing_pieces": ["缺少XXX信息", "需要再问XXX"]
    }
  ],
  "timeline": [
    {
      "period": "时间描述 (公历年份区间)",
      "events": ["事件1", "事件2"],
      "related_people": ["人物A"],
      "source_fragments": [0, 2],
      "confidence": "确定|待核实|推测"
    }
  ],
  "characters": [
    {
      "name": "主要称呼",
      "aliases": ["别名"],
      "tags": ["标签1", "标签2"],
      "story": "50-150字人物小传",
      "key_quotes": ["方言原话"],
      "related_story_threads": ["故事线名称1", "故事线名称2"],
      "mention_count": 3,
      "verify_flags": ["待核实信息"]
    }
  ],
  "relationship_map": [
    {
      "from": "人物A",
      "to": "人物B",
      "type": "关系类型",
      "detail": "关系细节",
      "source_fragment": 0
    }
  ],
  "cross_references": [
    "故事线A和故事线B有关联：..."
  ],
  "next_interview_plan": [
    "建议下次采访问XXX，因为故事线「YYY」还缺ZZZ"
  ]
}

## 关键注意

- 同一次采访可能涉及多条故事线，同一条故事线也可能跨多次采访积累
- story_thread_name 是故事线的唯一标识，同名的就是同一条线，务必与已有故事线名称保持一致
- 如果本次采访的内容无法匹配任何已有故事线，就创建新的
- narratives 是对外展示的，要真正好读；fragments 是原始素材，忠实记录
- characters 中的 related_story_threads 要列出此人出现在哪些故事线中，方便跨线追踪
- next_interview_plan 要具体、可执行，格式是"问谁""问什么""为了补全哪条故事线"`;
        const runChunk = async (chunkText, sessionNarratives, sessionCharacters, chunkInfo = '') => {
            const { storyLineSummary, knownCharStr } = buildCtxStrings(sessionNarratives, sessionCharacters);
            const userPrompt = `## 话题
${topic?.name || '未知话题'}${topic?.description ? ` — ${topic.description}` : ''}

## 子话题列表（ID|名称|状态|摘要）
${subtopicList || '暂无子话题'}

## 已有故事线（之前采访积累的故事线及其状态）
${storyLineSummary}

## 已知人物
${knownCharStr}

## 本次采访内容${chunkInfo}
${chunkText}

请进行专业整理。如果有已有故事线，务必将本次内容与对应故事线融合，更新导览叙事。`;
            const llmClient = this.getLLMClient();
            try {
                const response = await llmClient.invoke([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ], { temperature: 0.4 });
                return this.parseLLMResponse(response.content.trim());
            }
            catch (err) {
                console.error(`LLM 整理失败${chunkInfo}:`, err);
                return this.fallbackResult(chunkText, subtopics);
            }
        };
        if (text.length <= this.SINGLE_CALL_LIMIT) {
            return runChunk(text, [], []);
        }
        const chunks = this.splitIntoChunks(text, this.SINGLE_CALL_LIMIT);
        console.log(`[长文本整理] 原文 ${text.length} 字 → 拆分为 ${chunks.length} 段`);
        const partials = [];
        const sessionNarratives = [];
        const sessionCharacters = [];
        for (let i = 0; i < chunks.length; i++) {
            const info = `（第 ${i + 1}/${chunks.length} 段）`;
            const res = await runChunk(chunks[i], sessionNarratives, sessionCharacters, info);
            partials.push(res);
            for (const n of res.narratives) {
                const idx = sessionNarratives.findIndex((e) => e.story_thread_name === n.story_thread_name);
                if (idx >= 0)
                    sessionNarratives[idx] = n;
                else
                    sessionNarratives.push(n);
            }
            for (const c of res.characters) {
                sessionCharacters.push(`${c.name}（${c.tags.join('、')}）`);
            }
        }
        return this.mergeChunkResults(partials);
    }
    parseLLMResponse(content) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ||
            content.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) {
            console.warn('LLM 返回中未找到 JSON，原文:', content.substring(0, 200));
            throw new Error('LLM 返回格式异常');
        }
        const raw = jsonMatch[1] || jsonMatch[0];
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (parseErr) {
            const salvaged = this.salvageJson(raw);
            if (salvaged) {
                console.warn('JSON 被截断，已尝试修复并解析出部分内容');
                parsed = salvaged;
            }
            else {
                console.error('JSON 解析失败:', parseErr, '原文片段:', raw.substring(0, 300));
                throw new Error('LLM 返回的 JSON 解析失败');
            }
        }
        return {
            fragments: Array.isArray(parsed.fragments) ? parsed.fragments : [],
            narratives: Array.isArray(parsed.narratives) ? parsed.narratives : [],
            timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
            characters: Array.isArray(parsed.characters) ? parsed.characters : [],
            relationship_map: Array.isArray(parsed.relationship_map) ? parsed.relationship_map : [],
            cross_references: Array.isArray(parsed.cross_references) ? parsed.cross_references : [],
            next_interview_plan: Array.isArray(parsed.next_interview_plan) ? parsed.next_interview_plan : [],
        };
    }
    salvageJson(raw) {
        if (!raw)
            return null;
        const stack = [];
        let inString = false;
        let escaped = false;
        let safeCutIndex = -1;
        for (let i = 0; i < raw.length; i++) {
            const ch = raw[i];
            if (inString) {
                if (escaped) {
                    escaped = false;
                }
                else if (ch === '\\') {
                    escaped = true;
                }
                else if (ch === '"') {
                    inString = false;
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === '{' || ch === '[') {
                stack.push(ch);
            }
            else if (ch === '}' || ch === ']') {
                stack.pop();
                safeCutIndex = i;
            }
            else if (ch === ',') {
                safeCutIndex = i;
            }
        }
        if (safeCutIndex < 0)
            return null;
        let truncated = raw.slice(0, safeCutIndex + 1);
        truncated = truncated.replace(/,\s*$/, '');
        const closers = [];
        const openStack = [];
        let s = false;
        let esc = false;
        for (let i = 0; i < truncated.length; i++) {
            const ch = truncated[i];
            if (s) {
                if (esc)
                    esc = false;
                else if (ch === '\\')
                    esc = true;
                else if (ch === '"')
                    s = false;
                continue;
            }
            if (ch === '"')
                s = true;
            else if (ch === '{' || ch === '[')
                openStack.push(ch);
            else if (ch === '}' || ch === ']')
                openStack.pop();
        }
        for (let i = openStack.length - 1; i >= 0; i--) {
            closers.push(openStack[i] === '{' ? '}' : ']');
        }
        const repaired = truncated + closers.join('');
        try {
            return JSON.parse(repaired);
        }
        catch {
            return null;
        }
    }
    fallbackResult(text, subtopics) {
        return {
            fragments: [
                {
                    story_thread_id: subtopics?.[0]?.id || null,
                    story_thread_name: subtopics?.[0]?.name || '未分类采访',
                    category: 'building_history',
                    icon: '📌',
                    dialect_original: text,
                    mandarin_text: text,
                    summary: '采访内容（LLM 整理失败，返回原文）',
                    flags: ['⚠️ 待核实：LLM 整理失败，需人工整理'],
                },
            ],
            narratives: [],
            timeline: [],
            characters: [],
            relationship_map: [],
            cross_references: [],
            next_interview_plan: [],
        };
    }
    deduplicateTimeline(timeline) {
        const map = new Map();
        for (const t of timeline) {
            const existing = map.get(t.period);
            if (existing) {
                existing.events = [...new Set([...existing.events, ...t.events])];
                existing.related_people = [...new Set([...existing.related_people, ...t.related_people])];
            }
            else {
                map.set(t.period, { ...t });
            }
        }
        return [...map.values()];
    }
    deduplicateRelationships(rels) {
        const map = new Map();
        for (const r of rels) {
            const key = `${r.from}-${r.to}-${r.type}`;
            const existing = map.get(key);
            if (!existing || r.detail.length > existing.detail.length) {
                map.set(key, r);
            }
        }
        return [...map.values()];
    }
    splitIntoChunks(text, maxChars) {
        const chunks = [];
        let current = '';
        const flush = () => {
            if (current.trim())
                chunks.push(current.trim());
            current = '';
        };
        const pushPiece = (piece) => {
            if (!piece)
                return;
            if (piece.length > maxChars) {
                flush();
                const sentences = piece
                    .split(/(?<=[。！？；!?;\n])/)
                    .filter((s) => s.length > 0);
                for (const s of sentences) {
                    if (s.length > maxChars) {
                        for (let i = 0; i < s.length; i += maxChars) {
                            flush();
                            chunks.push(s.slice(i, i + maxChars));
                        }
                    }
                    else if ((current + s).length > maxChars) {
                        flush();
                        current = s;
                    }
                    else {
                        current += s;
                    }
                }
                return;
            }
            if ((current + '\n\n' + piece).length > maxChars) {
                flush();
                current = piece;
            }
            else {
                current = current ? current + '\n\n' + piece : piece;
            }
        };
        const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        for (const p of paragraphs)
            pushPiece(p.trim());
        flush();
        return chunks.length > 0 ? chunks : [text];
    }
    mergeChunkResults(results) {
        const fragments = [];
        const narrativeMap = new Map();
        const charMap = new Map();
        const allTimeline = [];
        const allRels = [];
        const crossSet = new Set();
        const planSet = new Set();
        for (const r of results) {
            fragments.push(...(r.fragments || []));
            for (const n of r.narratives || []) {
                const existing = narrativeMap.get(n.story_thread_name);
                if (!existing ||
                    n.completeness > existing.completeness ||
                    (n.completeness === existing.completeness &&
                        n.narrative.length > existing.narrative.length)) {
                    narrativeMap.set(n.story_thread_name, n);
                }
            }
            for (const c of r.characters || []) {
                const existing = charMap.get(c.name);
                if (!existing) {
                    charMap.set(c.name, { ...c });
                }
                else {
                    charMap.set(c.name, {
                        ...existing,
                        aliases: [...new Set([...existing.aliases, ...c.aliases])],
                        tags: [...new Set([...existing.tags, ...c.tags])],
                        key_quotes: [...new Set([...existing.key_quotes, ...c.key_quotes])],
                        related_story_threads: [
                            ...new Set([...existing.related_story_threads, ...c.related_story_threads]),
                        ],
                        verify_flags: [...new Set([...existing.verify_flags, ...c.verify_flags])],
                        story: c.story.length > existing.story.length ? c.story : existing.story,
                        mention_count: existing.mention_count + c.mention_count,
                    });
                }
            }
            allTimeline.push(...(r.timeline || []));
            allRels.push(...(r.relationship_map || []));
            for (const x of r.cross_references || [])
                crossSet.add(x);
            for (const x of r.next_interview_plan || [])
                planSet.add(x);
        }
        return {
            fragments,
            narratives: [...narrativeMap.values()].sort((a, b) => b.completeness - a.completeness),
            timeline: this.deduplicateTimeline(allTimeline),
            characters: [...charMap.values()].sort((a, b) => b.mention_count - a.mention_count),
            relationship_map: this.deduplicateRelationships(allRels),
            cross_references: [...crossSet],
            next_interview_plan: [...planSet],
        };
    }
    renderStoryArchiveHtml(result, meta = {}) {
        const escHtml = (s) => String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const title = escHtml(meta.title || '村庄记忆 · 故事档案馆');
        const subtitle = escHtml(meta.subtitle || '口述历史整理成果');
        const note = escHtml(meta.note || `累计 ${result.narratives?.length || 0} 条故事线持续积累中`);
        const dataJson = JSON.stringify(result).replace(/</g, '\\u003c');
        return STORY_ARCHIVE_TEMPLATE
            .replace('__DATA_JSON__', () => dataJson)
            .replace('__TITLE__', () => title)
            .replace('__SUBTITLE__', () => subtitle)
            .replace('__NOTE__', () => note);
    }
    async aggregateTopic(topicId) {
        const { data: records, error } = await this.client
            .from('interview_records')
            .select('ai_analysis, created_at')
            .eq('topic_id', topicId)
            .eq('status', 'completed')
            .order('created_at', { ascending: true });
        if (error)
            throw new Error(`查询失败: ${error.message}`);
        const analyses = (records || [])
            .map((r) => r.ai_analysis)
            .filter((a) => !!a);
        if (analyses.length === 0) {
            return {
                fragments: [],
                narratives: [],
                timeline: [],
                characters: [],
                relationship_map: [],
                cross_references: [],
                next_interview_plan: [],
            };
        }
        return this.mergeChunkResults(analyses);
    }
    async uploadHtml(html, name = 'story-archive') {
        try {
            const storage = this.getStorage();
            const key = `archive/${name}_${Date.now()}.html`;
            await storage.uploadFile({
                fileContent: Buffer.from(html, 'utf8'),
                fileName: key,
                contentType: 'text/html; charset=utf-8',
            });
            return await storage.generatePresignedUrl({ key, expireTime: 7 * 24 * 3600 });
        }
        catch (err) {
            console.error('HTML 上传失败:', err);
            return null;
        }
    }
    async transcribeTextToArchive(topicId, text, subtopicId, meta) {
        const analysis = await this.organizeTranscript(topicId, text, { hasAudio: false });
        await this.saveRecordAndUpdateStoryThreads(topicId, { subtopicId, text, analysis });
        const merged = await this.aggregateTopic(topicId);
        const html = this.renderStoryArchiveHtml(merged, meta);
        const url = await this.uploadHtml(html, topicId);
        return { analysis, merged, html, url };
    }
    async renderTopicArchive(topicId, meta) {
        const merged = await this.aggregateTopic(topicId);
        const html = this.renderStoryArchiveHtml(merged, meta);
        const url = await this.uploadHtml(html, topicId);
        return { merged, html, url };
    }
    renderArchiveFromResult(result, meta) {
        return this.renderStoryArchiveHtml(result, meta);
    }
};
exports.TranscriptOrganizerSkill = TranscriptOrganizerSkill;
exports.TranscriptOrganizerSkill = TranscriptOrganizerSkill = __decorate([
    (0, common_1.Injectable)()
], TranscriptOrganizerSkill);
//# sourceMappingURL=transcript-organizer.skill.js.map