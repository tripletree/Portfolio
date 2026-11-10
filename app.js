/* tripletree portfolio — vanilla JS, no build.
   Edit CONFIG to set your public contact details. */
const CONFIG = {
  email: '',                                   // e.g. 'hello@yourdomain.com' — leave empty to route the CTA to GitHub
  github: 'https://github.com/tripletree',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const store = {
  get(k) { try { return localStorage.getItem('tt.' + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('tt.' + k, v); } catch { /* private mode */ } },
};
let L = 'en';
const T = (en, zh) => (L === 'zh' ? zh : en);
const rerender = [];              // functions to call when language changes

/* ---------------- i18n ---------------- */
function setLang(l) {
  L = l; root.lang = l; store.set('lang', l);
  $$('[data-zh]').forEach(el => {
    if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
    el.innerHTML = l === 'zh' ? el.dataset.zh : el.dataset.en;
  });
  $('#langBtn').textContent = l === 'zh' ? 'EN' : '中文';
  document.title = T('tripletree — AI-native product design, design systems, delivery pipelines', 'tripletree — AI 原生产品设计 · 设计系统 · 交付流水线');
  rerender.forEach(f => f());
  moveThumb();
}
$('#langBtn').onclick = () => setLang(L === 'en' ? 'zh' : 'en');

/* ---------------- fidelity dial ---------------- */
const dialBtns = $$('#dial button');
function moveThumb() {
  const b = dialBtns.find(x => x.getAttribute('aria-checked') === 'true');
  const t = $('#dialThumb');
  t.style.left = b.offsetLeft + 'px'; t.style.width = b.offsetWidth + 'px';
}
function setLayer(l, user) {
  if (root.dataset.layer === l && user) return;
  const apply = () => {
    root.dataset.layer = l;
    dialBtns.forEach(b => b.setAttribute('aria-checked', b.dataset.l === l));
    moveThumb(); readColors();
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (user && document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
  if (user) { $('#dialHint').classList.add('off'); store.set('seen', '1'); }
}
dialBtns.forEach(b => b.onclick = () => setLayer(b.dataset.l, true));
$$('[data-go]').forEach(b => b.onclick = () => { setLayer(b.dataset.go, true); });
addEventListener('resize', moveThumb);

/* ---------------- token console ---------------- */
const ACCENTS = [['#FF4B14', 'signal'], ['#2B4BFF', 'cobalt'], ['#0E9F6E', 'moss'], ['#C2238F', 'magenta']];
const tk = { accent: '#FF4B14', theme: 'paper', display: 'serif', radius: 14 };
const con = $('#console');
$('#swAccent').innerHTML = ACCENTS.map(([c, n]) => `<button style="background:${c}" data-v="${c}" aria-label="${n}"></button>`).join('');
function applyTokens(user) {
  root.style.setProperty('--u-accent', tk.accent);
  root.style.setProperty('--u-radius', tk.radius + 'px');
  root.style.setProperty('--u-display', tk.display === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)');
  root.dataset.theme = tk.theme;
  $$('#swAccent button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === tk.accent));
  $$('#optTheme button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === tk.theme));
  $$('#optType button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === tk.display));
  $('#rad').value = tk.radius; $('#radVal').textContent = tk.radius;
  $('#tkJson').textContent = JSON.stringify({ color: { accent: tk.accent }, theme: tk.theme, font: { display: tk.display }, radius: { card: tk.radius + 'px' } }, null, 1);
  if (user) { store.set('tk', JSON.stringify(tk)); if (root.dataset.layer !== 'shipped') setLayer('shipped', true); }
  readColors();
}
$('#swAccent').onclick = e => { const v = e.target.dataset.v; if (v) { tk.accent = v; applyTokens(true); } };
$('#optTheme').onclick = e => { const b = e.target.closest('button'); if (b) { tk.theme = b.dataset.v; applyTokens(true); } };
$('#optType').onclick = e => { const b = e.target.closest('button'); if (b) { tk.display = b.dataset.v; applyTokens(true); } };
$('#rad').oninput = e => { tk.radius = +e.target.value; applyTokens(true); };
function toggleConsole(open) {
  con.hidden = open === undefined ? !con.hidden : !open;
  $('#tkBtn').setAttribute('aria-expanded', !con.hidden);
}
$('#tkBtn').onclick = () => toggleConsole();
document.addEventListener('click', e => { if (!con.hidden && !e.target.closest('#console,#tkBtn')) toggleConsole(false); });

/* ---------------- keyboard ---------------- */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') toggleConsole(false);
  if (e.target.matches('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (k === '1') setLayer('intent', true);
  if (k === '2') setLayer('system', true);
  if (k === '3') setLayer('shipped', true);
  if (k === 'l') setLang(L === 'en' ? 'zh' : 'en');
  if (k === 't') toggleConsole();
});

/* ---------------- reveal ---------------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.rv').forEach(el => io.observe(el));

/* ---------------- hero field: noise → order ----------------
   Dots drift on a flow field. Wherever attention lands (the pointer),
   they snap to the grid and connect. That is the job description. */
const cv = $('#field'), cx = cv.getContext('2d');
let W = 0, H = 0, dots = [], colFg = '#14130F', colAc = '#FF4B14', px = -999, py = -999, tx = 0, ty = 0, hasPtr = false, fieldOn = true;
const GAP = 30;
function readColors() {
  const cs = getComputedStyle(root);
  colFg = cs.getPropertyValue('--fg').trim() || colFg; colAc = cs.getPropertyValue('--accent').trim() || colAc;
}
function sizeField() {
  const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
  dots = [];
  for (let y = GAP / 2; y < H; y += GAP) for (let x = GAP / 2; x < W; x += GAP) dots.push({ x, y, s: Math.random() * 6.28 });
}
function drawField(t) {
  if (!fieldOn) return requestAnimationFrame(drawField);
  const layer = root.dataset.layer, sys = layer === 'system';
  if (!hasPtr) { tx = W * (.68 + .2 * Math.sin(t / 2300)); ty = H * (.46 + .26 * Math.cos(t / 1900)); }
  px += (tx - px) * .08; py += (ty - py) * .08;
  cx.clearRect(0, 0, W, H);
  const R = Math.min(W, H) * .34, k = t / 1400;
  cx.lineWidth = 1;
  for (const d of dots) {
    const dist = Math.hypot(d.x - px, d.y - py);
    const order = sys ? 1 : Math.max(0, 1 - dist / R);          // 0 = noise, 1 = on grid
    const e = order * order * (3 - 2 * order);
    const n = 1 - e, amp = 13 * n;
    const ox = Math.sin(d.y * .021 + k + d.s) * amp + Math.cos(d.s * 3 + k * 1.7) * amp * .5;
    const oy = Math.cos(d.x * .019 - k + d.s) * amp;
    const x = d.x + ox, y = d.y + oy;
    if (e > .35) {
      cx.globalAlpha = sys ? .5 : e * .9; cx.strokeStyle = sys ? colFg : colAc;
      cx.beginPath(); cx.moveTo(x - 3.5, y); cx.lineTo(x + 3.5, y); cx.moveTo(x, y - 3.5); cx.lineTo(x, y + 3.5); cx.stroke();
      if (!sys && e > .6) { cx.globalAlpha = (e - .6) * .5; cx.strokeRect(x - GAP / 2 + 4, y - GAP / 2 + 4, GAP - 8, GAP - 8); }
    } else {
      cx.globalAlpha = .16 + n * .2; cx.fillStyle = colFg;
      cx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  cx.globalAlpha = 1;
  requestAnimationFrame(drawField);
}
$('#hero').addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; hasPtr = e.pointerType === 'mouse'; });
$('#hero').addEventListener('pointerleave', () => { hasPtr = false; });
new IntersectionObserver(es => { fieldOn = es[0].isIntersecting; }).observe(cv);
addEventListener('resize', sizeField);

/* ---------------- A. Sciforum ---------------- */
$$('#sciTabs button').forEach(b => b.onclick = () => {
  $$('#sciTabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  $$('#sciforum [data-panel]').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.p; });
});
const subs = $('#subs');
function renderPrice() {
  const n = +subs.value;
  const sci = n <= 100 ? 499 : n <= 200 ? 799 : 799 + Math.ceil((n - 200) / 50) * 199;
  const rows = [['Sciforum', sci, 1], ['Ex Ordo', 2826], ['Oxford Abstracts', 901], ['EasyChair', Math.round(n * 4.67)]];
  const max = 2826;
  $('#subOut').textContent = n;
  $('#bars').innerHTML = rows.map(([name, v, me]) =>
    `<div class="bar${me ? ' me' : ''}"><span>${name}</span><i style="width:${Math.min(100, v / max * 100)}%"></i><span>${v.toLocaleString('en')} CHF</span></div>`).join('');
  const pct = Math.round((1 - sci / 2826) * 100);
  $('#saveN').textContent = '−' + pct + '%';
  $('#saveT').innerHTML = T(
    `versus the market leader’s entry licence at ${n} submissions. Tiering: Basic ≤100 · Premium 101–200 · +199 CHF per extra 50. Hosting stays free after the event.`,
    `相对头部竞品入门授权，在 ${n} 篇投稿规模下。阶梯：基础版 ≤100 · 高级版 101–200 · 每增加 50 篇 +199 CHF。会后托管永久免费。`);
}
subs.oninput = renderPrice; rerender.push(renderPrice);

const STAKE = [
  ['CEO / Managing Director', 'CEO / 总经理', .9, .92, 's', 'Approves continued investment. Needs proof of strategic value for the wider ecosystem.', '审批持续投入，需要看到对整个生态的战略价值。'],
  ['CTO / Head of Engineering', 'CTO / 工程负责人', .8, .86, 'c', 'Owns cutover and data-migration risk. Gets the rollback plan first.', '对切换与数据迁移风险负责，最先拿到回滚方案。'],
  ['Head of Conferences', '会议业务负责人', .95, .8, 'c', 'Their team runs every event on the platform. Operational continuity during the freeze is the whole conversation.', '团队每天在平台上办会，冻结期间的业务连续性是沟通的全部重点。'],
  ['CFO / Finance', 'CFO / 财务', .34, .88, 'n', 'Wants the commercial path: paid contracts and contract value, not feature detail.', '关心商业路径：付费合同与合同额，而不是功能细节。'],
  ['Heads of Journal Publishing', '期刊出版负责人', .3, .76, 'n', 'Touched by partner discounts and the special-issue pipeline.', '受合作折扣与专刊稿源影响。'],
  ['Legal / Compliance', '法务 / 合规', .14, .68, 'n', 'Migration integrity and privacy. One clear page, early.', '关注迁移完整性与隐私，尽早给一页清晰说明。'],
  ['Conference team staff', '会议团队一线', .9, .2, 'c', 'Daily operators and the main source of structured MVP feedback.', '每天的使用者，也是 MVP 结构化反馈的主要来源。'],
  ['Marketing', '市场团队', .8, .32, 's', 'Runs the go-to-market: staged email, social, video.', '执行上线传播：分批邮件、社媒、视频。'],
  ['Customer support', '客户支持', .74, .16, 'c', 'Handles questions during and after the freeze. Needs scripts before launch day.', '承接冻结期间及之后的咨询，上线前就要拿到话术。'],
  ['Dev / QA', '研发 / 测试', .88, .34, 's', 'Executes migration and closes P0/P1 defects.', '执行迁移，清零 P0 / P1 缺陷。'],
  ['External organisers & chairs', '外部会议组织者', .96, .1, 'c', 'Cannot operate during the cutover window. Told early, told twice.', '切换窗口内无法操作，必须提前、反复告知。'],
  ['Other departments', '其他部门', .16, .14, 'n', 'Peripheral awareness only.', '知情即可。'],
];
let stakeSel = 2;
function renderStake() {
  const m = $('#smap'); $$('.dot', m).forEach(d => d.remove());
  STAKE.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'dot ' + s[4] + (i === stakeSel ? ' on' : ''); b.style.left = s[2] * 100 + '%'; b.style.top = (1 - s[3]) * 100 + '%';
    b.setAttribute('aria-label', T(s[0], s[1]));
    b.onmouseenter = b.onfocus = b.onclick = () => { stakeSel = i; $$('.dot', m).forEach((d, j) => d.classList.toggle('on', j === i)); info(); };
    m.appendChild(b);
  });
  info();
  function info() {
    const s = STAKE[stakeSel];
    const stance = { s: T('Supportive', '支持'), c: T('Cautious', '谨慎'), n: T('Neutral', '中立') }[s[4]];
    $('#smapInfo').innerHTML = `<span class="mono muted">${stance}</span><h5>${T(s[0], s[1])}</h5><p>${T(s[5], s[6])}</p>`;
  }
}
rerender.push(renderStake);

/* ---------------- B. Moxian ---------------- */
const CHAIN = [['lead', 'Leads', '线索'], ['cust', 'Customers', '客户'], ['opp', 'Opportunities', '商机'], ['prog', 'Programmes', '项目集'], ['proj', 'Projects', '项目'], ['task', 'Tasks', '任务'], ['issue', 'Issues', '问题'], ['time', 'Timesheets', '工时'], ['risk', 'Risks', '风险'], ['chg', 'Changes', '变更'], ['cost', 'Cost centre', '成本中心'], ['collab', 'Collaboration', '协同中心']];
const ROLES = {
  sales: {
    on: ['lead', 'cust', 'opp'], hi: ['Good morning. 3 follow-ups are due today.', '早上好，今天有 3 条待跟进。'], cta: ['+ New lead', '+ 新建线索'],
    m: [['New leads', '新增线索', '23', ''], ['Open opportunities', '进行中商机', '14', ''], ['Quotes out', '报价中', '5', ''], ['Receivables', '待回款', '86', T => T('k', '万元')]],
    rows: [['BYD · Drive unit quotation', '比亚迪 · 传动单元报价', 'Quote', '报价', 'Today', '今天'], ['Sige Drive · Solution proposal', '西格传动 · 方案报价', 'Proposal', '方案', 'Wed', '周三'], ['New lead from website form', '官网表单新线索', 'Lead', '线索', 'Thu', '周四']],
  },
  pm: {
    on: ['prog', 'proj', 'risk', 'chg', 'cost'], hi: ['2 projects need a decision this week.', '本周有 2 个项目需要你决策。'], cta: ['+ New project', '+ 新建项目'],
    m: [['Active projects', '进行中项目', '8', ''], ['Overall progress', '整体进度', '64', () => '%'], ['Open risks', '未关闭风险', '3', ''], ['Pending changes', '待审变更', '4', '']],
    rows: [['Line 3 retrofit · milestone review', '三号线改造 · 里程碑评审', 'High', '高', 'Today', '今天'], ['Budget variance over threshold', '成本偏差超阈值', 'Risk', '风险', 'Tue', '周二'], ['Change request: scope +2 stations', '变更申请：范围 +2 工位', 'Change', '变更', 'Fri', '周五']],
  },
  eng: {
    on: ['task', 'issue', 'time', 'collab'], hi: ['3 tasks are due today. Timesheet is 80% filled.', '今天有 3 个任务到期，工时已填 80%。'], cta: ['Log hours', '填报工时'],
    m: [['My tasks', '我的任务', '12', ''], ['Due today', '今日到期', '3', ''], ['Open issues', '待处理问题', '5', ''], ['Hours this week', '本周工时', '32', () => 'h']],
    rows: [['Wiring diagram rev. C', '接线图 C 版', 'Task', '任务', 'Today', '今天'], ['Sensor drift on test bench', '测试台传感器漂移', 'Issue', '问题', 'Today', '今天'], ['Review: commissioning checklist', '评审：调试检查单', 'Review', '评审', 'Thu', '周四']],
  },
};
let role = 'sales';
function renderMx() {
  const r = ROLES[role];
  $('#mxChain').innerHTML = CHAIN.map(c => `<span class="${r.on.includes(c[0]) ? 'on' : ''}">${T(c[1], c[2])}</span>`).join('');
  $('#mxNav').innerHTML = `<b>Moxian</b><span>${T('Home', '首页')}</span>` + CHAIN.filter(c => r.on.includes(c[0])).map((c, i) => `<span class="${i === 0 ? 'on' : ''}">${T(c[1], c[2])}</span>`).join('');
  $('#mxMain').innerHTML = `<div class="mx-hello"><h5>${T(...r.hi)}</h5><span class="mx-btn">${T(...r.cta)}</span></div>
    <div class="mx-metrics">${r.m.map((m, i) => `<div class="mx-metric" style="animation-delay:${i * 60}ms"><small>${T(m[0], m[1])}</small><b>${m[2]}<u>${m[3] ? m[3](T) : ''}</u></b></div>`).join('')}</div>
    <div class="mx-list">${r.rows.map((w, i) => `<div class="mx-row" style="animation-delay:${240 + i * 60}ms"><span>${T(w[0], w[1])}</span><em>${T(w[2], w[3])}</em><small>${T(w[4], w[5])}</small></div>`).join('')}</div>`;
}
$$('#mxRoles button').forEach(b => b.onclick = () => { role = b.dataset.r; $$('#mxRoles button').forEach(x => x.setAttribute('aria-selected', x === b)); renderMx(); });
rerender.push(renderMx);

/* ---------------- C. WTO pipeline ---------------- */
const STAGES = [
  { n: ['Ticket', '工单'], s: ['human · spec + acceptance criteria', '人 · 需求 + 验收标准'], human: 1, lines: [
    ['c', '# WTO-4937  Parker portal — “Change date” calendar overflows on phones'],
    ['w', 'AC1  calendar never wider than its dialog at 375 / 390 / 1280'],
    ['w', 'AC2  filter bar wraps instead of clipping'],
    ['w', 'AC3  attach before/after evidence from a real browser'] ] },
  { n: ['Worktree', '工作区'], s: ['isolated per ticket', '每单独立'], lines: [
    ['', '$ git worktree add ../wto-4937 -b fix/wto-4937 origin/dev'],
    ['', '$ pnpm worktree:setup'], ['g', '✓ node_modules linked · workspace ready'] ] },
  { n: ['Agent builds', 'Agent 实现'], s: ['reads README, skills, tokens', '读 README、技能、令牌'], lines: [
    ['c', 'agent › reading README.md (agent-friendly) … ownership, symptom table'],
    ['c', 'agent › locating ChangeDateWindow.vue, MyBookings.vue'],
    ['', 'agent › patch: 2 files changed, 31 insertions(+), 12 deletions(−)'] ] },
  { n: ['Static gates', '静态门禁'], s: ['lint · types · secrets · dead code', 'lint · 类型 · 密钥 · 死代码'], lines: [
    ['', '$ oxlint . && eslint . --max-warnings=0'], ['g', '✓ 0 errors, 0 warnings'],
    ['', '$ vue-tsc --build'], ['g', '✓ types ok'],
    ['', '$ gitleaks protect --staged && knip'], ['g', '✓ no secrets · no new dead code'] ] },
  { n: ['E2E', '端到端'], s: ['Playwright, behaviour-named', 'Playwright，按行为命名'], lines: [
    ['', '$ playwright test e2e/portal --trace off'],
    ['g', '  ✓ portal › change-date-window-fits-dialog @375'],
    ['g', '  ✓ portal › change-date-window-fits-dialog @390'],
    ['g', '  ✓ portal › bookings-filter-bar-wraps @1280'],
    ['g', '✓ 3 passed · traceability updated'] ] },
  { n: ['Evidence', '证据'], s: ['screenshots + measurements', '截图 + 测量数据'], lines: [
    ['', '$ capture before/after × 375·390·1280'],
    ['c', '  before  calendar 412px  > dialog 343px   ✗ overflow'],
    ['g', '  after   calendar 343px  ≤ dialog 343px   ✓'],
    ['', '  wrote shots-before.json, shots-after.json, 6 png'] ] },
  { n: ['PR + budgets', 'PR + 预算'], s: ['bundle size · Lighthouse CI', '包体积 · Lighthouse CI'], lines: [
    ['', '$ size-limit && lhci autorun'], ['g', '✓ within bundle budget · performance budget held'],
    ['a', '→ pull request opened with evidence attached'] ] },
  { n: ['Human review', '人工评审'], s: ['human · reads evidence, not diffs', '人 · 看证据，不看 diff'], human: 1, lines: [
    ['w', 'review › AC1 ✓  AC2 ✓  AC3 ✓   — approved'],
    ['c', '# time a person spent: writing 3 acceptance criteria, reading 6 screenshots.'] ] },
];
let runId = 0;
function renderRail() {
  $('#rail').innerHTML = STAGES.map((s, i) => `<li class="${s.human ? 'human' : ''}"><i>${i + 1}</i><span>${T(...s.n)}<small>${T(...s.s)}</small></span></li>`).join('');
}
async function runPipe() {
  const id = ++runId, term = $('#term'), items = () => $$('#rail li');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  renderRail(); term.innerHTML = '';
  for (let i = 0; i < STAGES.length; i++) {
    if (id !== runId) return;
    items()[i].classList.add('run');
    for (const [cls, text] of STAGES[i].lines) {
      const span = document.createElement('span'); span.className = cls; term.appendChild(span);
      const cur = document.createElement('span'); cur.className = 'cur'; term.appendChild(cur);
      const step = cls === '' ? 3 : 999;                       // commands type out, results print at once
      for (let c = 0; c < text.length; c += step) { if (id !== runId) return; span.textContent = text.slice(0, c + step); if (step < 999) await wait(14); }
      span.textContent = text + '\n'; cur.remove(); term.scrollTop = term.scrollHeight;
      await wait(cls === 'g' ? 260 : 170);
    }
    term.appendChild(document.createTextNode('\n'));
    if (id !== runId) return;
    items()[i].classList.remove('run'); items()[i].classList.add('ok');
    await wait(260);
  }
}
$('#runBtn').onclick = runPipe;
renderRail();
rerender.push(() => { const done = $$('#rail li.ok').length; renderRail(); $$('#rail li').forEach((li, i) => { if (i < done) li.classList.add('ok'); }); });
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { runPipe(); o.disconnect(); } }, { threshold: .35 }).observe($('#term'));

/* ---------------- D. Zhixu ---------------- */
$('#zxToggle').onclick = () => { if (root.dataset.layer !== 'shipped') setLayer('shipped', true); $('#zx').classList.toggle('light'); };

/* ---------------- contact: brief builder ---------------- */
const NEEDS = [['A product design sprint', '产品设计冲刺'], ['A design system', '一套设计系统'], ['An AI delivery pipeline', 'AI 开发流水线'], ['To hire you full-time', '全职聘用']];
const TIMES = [['This month', '本月内'], ['This quarter', '本季度'], ['Just exploring', '先了解一下']];
const pick = { need: new Set([1]), time: 1 };
function renderBrief() {
  $('#cNeed').innerHTML = NEEDS.map((n, i) => `<button class="chip" data-i="${i}" aria-pressed="${pick.need.has(i)}">${T(...n)}</button>`).join('');
  $('#cTime').innerHTML = TIMES.map((n, i) => `<button class="chip" data-i="${i}" aria-pressed="${pick.time === i}">${T(...n)}</button>`).join('');
  const org = $('#org').value.trim() || T('[your company]', '[你的公司]');
  const needs = [...pick.need].sort().map(i => '  · ' + T(...NEEDS[i])).join('\n') || T('  · (pick at least one)', '  ·（至少选一项）');
  $('#briefOut').textContent = T(
    `Hi tripletree,\n\nWe are ${org}. We need:\n${needs}\n\nTiming: ${TIMES[pick.time][0].toLowerCase()}.\n\nCould we book a 30-minute call?\n`,
    `你好 tripletree：\n\n我们是 ${org}，需要：\n${needs}\n\n时间：${TIMES[pick.time][1]}。\n\n方便约 30 分钟通话吗？\n`);
  $('#sendLbl').textContent = CONFIG.email ? T('Send by email', '用邮件发送') : T('Reach me on GitHub', '在 GitHub 联系我');
  $('#sendBtn').href = CONFIG.email
    ? `mailto:${CONFIG.email}?subject=${encodeURIComponent(T('Project brief — ', '需求简报 — ') + org)}&body=${encodeURIComponent($('#briefOut').textContent)}`
    : CONFIG.github;
  if (!CONFIG.email) { $('#sendBtn').target = '_blank'; $('#sendBtn').rel = 'noopener'; }
}
$('#cNeed').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const i = +b.dataset.i; pick.need.has(i) ? pick.need.delete(i) : pick.need.add(i); renderBrief(); };
$('#cTime').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; pick.time = +b.dataset.i; renderBrief(); };
$('#org').oninput = renderBrief;
$('#copyBtn').onclick = async () => {
  const lbl = $('#copyBtn span'), txt = $('#briefOut').textContent;
  try { await navigator.clipboard.writeText(txt); } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: txt }); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  lbl.textContent = T('Copied ✓', '已复制 ✓'); setTimeout(() => { lbl.textContent = T('Copy brief', '复制简报'); }, 1600);
};
rerender.push(renderBrief);

/* ---------------- boot ---------------- */
try { Object.assign(tk, JSON.parse(store.get('tk') || '{}')); } catch { /* ignore */ }
applyTokens(false);
setLang(store.get('lang') === 'zh' ? 'zh' : 'en');       // English by default
setLayer('shipped', false);
if (store.get('seen')) $('#dialHint').classList.add('off');
sizeField(); px = tx = W * .7; py = ty = H * .45;
requestAnimationFrame(drawField);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveThumb);
addEventListener('scroll', () => { if (scrollY > innerHeight * 1.2) $('#dialHint').classList.add('off'); }, { passive: true });
