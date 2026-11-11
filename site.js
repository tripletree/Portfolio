/* tripletree — portfolio v2. Vanilla JS, no build.
   Set CONFIG.email to a public address to turn the contact button into a mailto. */
const CONFIG = { email: '', github: 'https://github.com/tripletree' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const store = { get(k) { try { return localStorage.getItem('tt.' + k); } catch { return null; } }, set(k, v) { try { localStorage.setItem('tt.' + k, v); } catch { /* private mode */ } } };
const PAGE = document.body.dataset.page || 'index';
const CASES = [['atlas', 'Atlas'], ['forge', 'Forge'], ['relay', 'Relay'], ['prism', 'Prism']];
let L = 'en';
const T = (en, zh) => (L === 'zh' ? zh : en);
const onLang = [];

/* ---------- chrome ---------- */
document.body.insertAdjacentHTML('afterbegin', `
<div class="top">
  <a class="logo" href="index.html" aria-label="tripletree, home">tripletree<i></i></a>
  <nav><a href="index.html#work" data-zh="项目">Work</a><a href="index.html#services" data-zh="服务">Services</a><a class="keep" href="index.html#contact" data-zh="联系">Contact</a></nav>
</div>`);
document.body.insertAdjacentHTML('beforeend', `
<div class="bar">
  <div><i class="dot"></i><span class="path">~/tripletree/${PAGE}.md</span><span class="hide-s" id="crumb"></span></div>
  <div>
    <span class="sw" role="group" aria-label="View"><span class="hide-s" data-zh="视图">view</span><button id="vH" class="on" data-zh="人类">human</button><button id="vA">agent</button></span>
    <span class="sw" role="group" aria-label="Language"><button id="lEn" class="on">EN</button><button id="lZh">中</button></span>
    <button id="palBtn" class="hide-s"><kbd>⌘K</kbd></button>
    <span id="pct">00%</span>
  </div>
</div>
<div id="agent" aria-hidden="true"><div class="tools"><button class="cta" id="mdCopy">copy .md</button></div><pre></pre></div>
<div id="pal" role="dialog" aria-label="Command palette"><div class="box"><input placeholder="Type a command or search…" aria-label="Command"><ul></ul></div></div>
<div id="zoom"><img alt=""></div>`);

/* ---------- i18n ---------- */
function setLang(l) {
  L = l; root.lang = l; store.set('lang', l);
  $$('[data-zh]').forEach(el => { if (el.dataset.en === undefined) el.dataset.en = el.innerHTML; el.innerHTML = l === 'zh' ? el.dataset.zh : el.dataset.en; });
  $('#lEn').classList.toggle('on', l === 'en'); $('#lZh').classList.toggle('on', l === 'zh');
  $('#pal input').placeholder = T('Type a command or search…', '输入命令或搜索…');
  onLang.forEach(f => f());
  if ($('#agent').classList.contains('on')) agentView(true, true);
}
$('#lEn').onclick = () => setLang('en'); $('#lZh').onclick = () => setLang('zh');

/* ---------- reveal + scramble ---------- */
const GLY = '▚▞▙▟▛▜░▒#/<>_=+';
function scramble(el) {
  if (el.children.length || el._scr) return;
  const txt = el.textContent, n = txt.length; let f = 0; el._scr = 1;
  const tick = () => {
    const done = Math.floor(f / 2);
    el.textContent = txt.slice(0, done) + [...txt.slice(done)].map(c => (c === ' ' ? ' ' : GLY[Math.random() * GLY.length | 0])).join('').slice(0, Math.max(0, Math.min(n - done, 10)));
    if (done < n) { f++; requestAnimationFrame(tick); } else { el.textContent = txt; el._scr = 0; }
  };
  tick();
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  $$('.m', e.target).concat(e.target.matches('.m') ? [e.target] : []).forEach(scramble);
}), { threshold: .08 });
$$('.rv').forEach(el => io.observe(el));

/* ---------- status bar: scroll %, crumb ---------- */
const heads = $$('[data-crumb]');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $('#pct').textContent = String(Math.round(max > 0 ? scrollY / max * 100 : 0)).padStart(2, '0') + '%';
  let cur = ''; for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * .5) cur = h.dataset.crumb;
  $('#crumb').textContent = cur ? '› ' + cur : '';
  scrollshots();
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- scrollshots: tall screenshot scrolls with the page ---------- */
function scrollshots() {
  for (const s of $$('.scrollshot')) {
    const r = s.getBoundingClientRect(), img = $('img', s), win = $('.win', s);
    if (r.bottom < 0 || r.top > innerHeight || !img.naturalHeight) continue;
    const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (innerHeight * .85 + r.height * .35)));
    img.style.transform = `translateY(${-p * Math.max(0, img.offsetHeight - win.offsetHeight)}px)`;
  }
}

/* ---------- before / after ---------- */
$$('.ba').forEach(b => {
  const set = e => { const r = b.getBoundingClientRect(); b.style.setProperty('--x', Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100)) + '%'); };
  b.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) set(e); });
  b.addEventListener('pointerdown', set);
});

/* ---------- zoom ---------- */
document.addEventListener('click', e => {
  const img = e.target.closest('.shot img'); if (!img || img.closest('.ba')) return;
  $('#zoom img').src = img.currentSrc || img.src; $('#zoom').classList.add('on');
});
$('#zoom').onclick = () => $('#zoom').classList.remove('on');

/* ---------- agent view: the page, decompiled to markdown ---------- */
function toMarkdown() {
  const out = [], main = $('main');
  const txt = el => el.innerText.replace(/\s+/g, ' ').trim();
  $$('h1,h2,h3,p,li,dt,dd,figcaption,a.row,.model pre,.code,.skill', main).forEach(el => {
    if (el.closest('.no-md,[hidden]') || (el.matches('p,h3') && el.closest('a.row,.skill')) || !el.offsetParent) return;
    const t = txt(el); if (!t) return;
    if (el.matches('h1')) out.push('# ' + t);
    else if (el.matches('h2')) out.push('\n## ' + t);
    else if (el.matches('h3')) out.push('\n### ' + t);
    else if (el.matches('a.row')) out.push(`- [${txt($('.row-name', el))}](${el.getAttribute('href')}) — ${txt($('.row-what', el))}`);
    else if (el.matches('li')) out.push('- ' + t);
    else if (el.matches('dt')) out.push('\n**' + t + '**');
    else if (el.matches('figcaption')) out.push('\n> ' + t);
    else if (el.matches('.skill')) out.push('- `/' + txt($('b', el)) + '` — ' + txt($('p', el)));
    else if (el.matches('pre,.code')) out.push('\n```\n' + el.innerText.trim() + '\n```');
    else out.push('\n' + t);
  });
  const body = out.join('\n').replace(/\n{3,}/g, '\n\n');
  return `---\ntitle: ${document.title}\npath: ${PAGE}.md\nlang: ${L}\nview: agent        # press H for the human version\ntokens: ~${Math.round(body.length / (L === 'zh' ? 1.6 : 4))}\n---\n\n${body}\n`;
}
let agentRun = 0;
function agentView(on, instant) {
  const a = $('#agent'), pre = $('pre', a), id = ++agentRun;
  a.classList.toggle('on', on); a.setAttribute('aria-hidden', !on);
  $('#vA').classList.toggle('on', on); $('#vH').classList.toggle('on', !on);
  document.body.style.overflow = on ? 'hidden' : '';
  if (!on) return;
  const md = toMarkdown(); a.scrollTop = 0; a._md = md;
  const paint = n => { pre.innerHTML = md.slice(0, n).replace(/[&<]/g, c => (c === '&' ? '&amp;' : '&lt;')).replace(/^(#{1,3} .*)$/gm, '<span class="h">$1</span>').replace(/^(---|[a-z]+:.*)$/gm, '<span class="k">$1</span>'); };
  if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) return paint(md.length);
  let n = 0; const step = () => { if (id !== agentRun) return; n += 46; paint(n); if (n < md.length) requestAnimationFrame(step); }; step();
}
$('#vA').onclick = () => agentView(true); $('#vH').onclick = () => agentView(false);
async function copy(text) { try { await navigator.clipboard.writeText(text); } catch { const ta = Object.assign(document.createElement('textarea'), { value: text }); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } }
$('#mdCopy').onclick = async e => { await copy($('#agent')._md || toMarkdown()); e.target.textContent = 'copied ✓'; setTimeout(() => { e.target.textContent = 'copy .md'; }, 1400); };

/* ---------- command palette ---------- */
const go = h => { location.href = h; };
const CMDS = () => [
  [T('Go to index', '回到首页'), 'index', () => go('index.html')],
  ...CASES.map(([id, n], i) => [T(`Open case 0${i + 1} — ${n}`, `打开项目 0${i + 1} — ${n}`), 'case', () => go(id + '.html')]),
  [T('Services', '服务'), 'index', () => go('index.html#services')],
  [T('Contact / write a brief', '联系 / 写需求简报'), 'index', () => go('index.html#contact')],
  [T('View this page as an agent (markdown)', '以 Agent 视角查看本页（Markdown）'), 'A', () => agentView(true)],
  [T('Copy this page as markdown', '复制本页为 Markdown'), 'action', () => copy(toMarkdown())],
  [T('Switch language → 中文 / EN', '切换语言 → EN / 中文'), 'L', () => setLang(L === 'en' ? 'zh' : 'en')],
  [T('Open GitHub profile', '打开 GitHub 主页'), '↗', () => window.open(CONFIG.github, '_blank', 'noopener')],
];
let palSel = 0, palList = [];
function palRender() {
  const q = $('#pal input').value.toLowerCase();
  palList = CMDS().filter(c => c[0].toLowerCase().includes(q)); palSel = Math.min(palSel, Math.max(0, palList.length - 1));
  $('#pal ul').innerHTML = palList.map((c, i) => `<li class="${i === palSel ? 'sel' : ''}" data-i="${i}">${c[0]}<span>${c[1]}</span></li>`).join('');
}
function pal(on) { $('#pal').classList.toggle('on', on); if (on) { $('#pal input').value = ''; palSel = 0; palRender(); $('#pal input').focus(); } }
$('#palBtn').onclick = () => pal(true);
$('#pal').onclick = e => { const li = e.target.closest('li'); if (li) { pal(false); palList[+li.dataset.i][2](); } else if (e.target.id === 'pal') pal(false); };
$('#pal input').oninput = () => { palSel = 0; palRender(); };
$('#pal input').onkeydown = e => {
  if (e.key === 'ArrowDown') { palSel = (palSel + 1) % palList.length; palRender(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { palSel = (palSel - 1 + palList.length) % palList.length; palRender(); e.preventDefault(); }
  if (e.key === 'Enter' && palList[palSel]) { pal(false); palList[palSel][2](); }
};

/* ---------- keyboard ---------- */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); return pal(!$('#pal').classList.contains('on')); }
  if (k === 'escape') { pal(false); agentView(false); $('#zoom').classList.remove('on'); return; }
  if (e.target.matches('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (k === '/') { e.preventDefault(); pal(true); }
  if (k === 'a') agentView(true);
  if (k === 'h') agentView(false);
  if (k === 'l') setLang(L === 'en' ? 'zh' : 'en');
  const i = CASES.findIndex(c => c[0] === PAGE);
  if (i >= 0 && k === 'arrowright') go(CASES[(i + 1) % 4][0] + '.html');
  if (i >= 0 && k === 'arrowleft') go(CASES[(i + 3) % 4][0] + '.html');
});

/* ---------- home: ASCII field ---------- */
const cv = $('#ascii');
if (cv) {
  const cx = cv.getContext('2d'), RAMP = ' ..·:-=+*#%@', CW = 11, CH = 19;
  let W, H, cols, rows, mx = -9, my = -9, tx = .7, ty = .4, ptr = false, vis = true, f = 0;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); cols = Math.ceil(W / CW); rows = Math.ceil(H / CH); cx.font = '13px "Geist Mono", ui-monospace, Menlo, monospace'; cx.textBaseline = 'top'; };
  const draw = t => {
    requestAnimationFrame(draw); if (!vis || (f++ & 1)) return;
    if (!ptr) { tx = .66 + .22 * Math.sin(t / 3100); ty = .42 + .24 * Math.cos(t / 2300); }
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    cx.clearRect(0, 0, W, H);
    const k = t / 2600, px = mx * cols, py = my * rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const u = x / cols, v = y / rows;
      let n = Math.sin(u * 7 + k) * Math.cos(v * 5 - k * .8) + Math.sin((u + v) * 9 - k * 1.3) * .5 + Math.sin(Math.hypot(u - .5, v - .5) * 14 - k * 2) * .4;
      const d = Math.hypot((x - px) * .55, y - py), lens = Math.max(0, 1 - d / 13);
      n = (n + 1.9) / 3.8 * (.25 + u * .75) + lens * .55;                // fades toward the left so the headline stays readable
      const i = Math.max(0, Math.min(RAMP.length - 1, n * RAMP.length | 0));
      if (!i) continue;
      cx.fillStyle = lens > .25 ? '#D6FF3D' : '#ECECE6'; cx.globalAlpha = lens > .25 ? .35 + lens * .65 : .1 + n * .32;
      cx.fillText(RAMP[i], x * CW, y * CH);
    }
    cx.globalAlpha = 1;
  };
  const hero = cv.parentElement;
  hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; ptr = e.pointerType === 'mouse'; });
  hero.addEventListener('pointerleave', () => { ptr = false; });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(cv);
  addEventListener('resize', size); size(); mx = tx; my = ty; requestAnimationFrame(draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
}

/* ---------- home: index hover peek ---------- */
const rows = $('.rows');
if (rows) {
  document.body.insertAdjacentHTML('beforeend', '<div id="peek" aria-hidden="true"><img alt=""></div>');
  const peek = $('#peek'), pimg = $('img', peek); let x = 0, y = 0, cxp = 0, cyp = 0, raf = 0;
  const loop = () => { cxp += (x - cxp) * .16; cyp += (y - cyp) * .16; peek.style.left = cxp + 'px'; peek.style.top = cyp + 'px'; raf = requestAnimationFrame(loop); };
  $$('.row', rows).forEach(r => {
    r.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; pimg.src = r.dataset.img; x = cxp = e.clientX + 200; y = cyp = e.clientY; peek.classList.add('on'); cancelAnimationFrame(raf); loop(); scramble($('.row-name', r)); });
    r.addEventListener('pointermove', e => { x = Math.min(innerWidth - 280, e.clientX + 220); y = e.clientY; });
    r.addEventListener('pointerleave', () => { peek.classList.remove('on'); cancelAnimationFrame(raf); });
  });
}

/* ---------- home: brief builder ---------- */
if ($('#briefOut')) {
  const NEEDS = [['A product design sprint', '产品设计冲刺'], ['A design system', '一套设计系统'], ['An agent delivery pipeline', 'Agent 交付流水线'], ['To hire you full-time', '全职聘用']];
  const TIMES = [['This month', '本月内'], ['This quarter', '本季度'], ['Just exploring', '先了解一下']];
  const pick = { need: new Set([2]), time: 1 };
  const render = () => {
    $('#cNeed').innerHTML = NEEDS.map((n, i) => `<button class="chip" data-i="${i}" aria-pressed="${pick.need.has(i)}">${T(...n)}</button>`).join('');
    $('#cTime').innerHTML = TIMES.map((n, i) => `<button class="chip" data-i="${i}" aria-pressed="${pick.time === i}">${T(...n)}</button>`).join('');
    const org = $('#org').value.trim() || T('[your company]', '[你的公司]');
    const needs = [...pick.need].sort().map(i => '  - ' + T(...NEEDS[i])).join('\n') || T('  - (pick at least one)', '  -（至少选一项）');
    $('#briefOut').textContent = T(`# brief.md\n\nfrom: ${org}\nneed:\n${needs}\nwhen: ${TIMES[pick.time][0].toLowerCase()}\nask: a 30-minute call\n`, `# brief.md\n\n来自：${org}\n需要：\n${needs}\n时间：${TIMES[pick.time][1]}\n请求：约 30 分钟通话\n`);
    $('#sendLbl').textContent = CONFIG.email ? T('Send by email', '用邮件发送') : T('Reach me on GitHub', '在 GitHub 联系我');
    const s = $('#sendBtn');
    s.href = CONFIG.email ? `mailto:${CONFIG.email}?subject=${encodeURIComponent('Brief — ' + org)}&body=${encodeURIComponent($('#briefOut').textContent)}` : CONFIG.github;
    if (!CONFIG.email) { s.target = '_blank'; s.rel = 'noopener'; }
  };
  $('#cNeed').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const i = +b.dataset.i; pick.need.has(i) ? pick.need.delete(i) : pick.need.add(i); render(); };
  $('#cTime').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; pick.time = +b.dataset.i; render(); };
  $('#org').oninput = render;
  $('#copyBtn').onclick = async e => { await copy($('#briefOut').textContent); const s = $('span', e.currentTarget); s.textContent = T('Copied ✓', '已复制 ✓'); setTimeout(() => { s.textContent = T('Copy brief', '复制简报'); }, 1500); };
  onLang.push(render);
}

/* ---------- relay: one ticket through the pipeline ---------- */
if ($('#term')) {
  const ST = [
    { n: ['Intake', '收口'], s: ['/task-creator · human', '/task-creator · 人'], human: 1, l: [['c', '# T-4937  Driver portal — “Change date” calendar overflows on phones'], ['w', 'requirements   calendar must fit its dialog on every phone width'], ['w', 'scope          portal/ChangeDateWindow, portal/MyBookings — nothing else'], ['w', 'acceptance     AC1 fits at 375 / 390 / 1280 · AC2 filter bar wraps · AC3 browser evidence'], ['c', '→ main task created. creator stops here; planning is not its job.']] },
    { n: ['Plan', '规划'], s: ['/task-planner', '/task-planner'], l: [['', 'planner › runbook lookup: portal dialogs … found'], ['', 'planner › split: T-4937-1 fix[fe]  →blocks→  T-4937-2 verify[e2e]'], ['g', '✓ 2 subtasks, labelled, file domains do not overlap']] },
    { n: ['Dispatch', '派发'], s: ['/task-dispatcher', '/task-dispatcher'], l: [['', 'dispatcher › label fe → agent session “frontend” (persistent)'], ['g', '✓ delivered · heartbeat ok']] },
    { n: ['Build', '实现'], s: ['/task-worker · one ticket, one worktree', '/task-worker · 一票一工作区'], l: [['', '$ git worktree add ../t-4937 -b fix/t-4937 origin/dev'], ['c', 'worker › reads README (written for agents), /house-rules'], ['', 'worker › patch: 2 files changed, 31 insertions(+), 12 deletions(−)']] },
    { n: ['Gates', '门禁'], s: ['lint · types · secrets · dead code · E2E', 'lint · 类型 · 密钥 · 死代码 · E2E'], l: [['', '$ oxlint . && eslint . --max-warnings=0 && vue-tsc --build'], ['g', '✓ 0 errors, 0 warnings · types ok'], ['', '$ playwright test e2e/portal'], ['g', '  ✓ portal › change-date-window-fits-dialog @375 @390'], ['g', '  ✓ portal › bookings-filter-bar-wraps @1280']] },
    { n: ['Evidence', '证据'], s: ['before / after from a real browser', '真实浏览器的前后对比'], l: [['c', '  before  calendar 412px  > dialog 343px   ✗ overflow'], ['g', '  after   calendar 343px  ≤ dialog 343px   ✓'], ['', '  wrote 6 screenshots + raw measurement JSON']] },
    { n: ['Review', '评审'], s: ['/pr-review-hook', '/pr-review-hook'], l: [['', 'webhook › pull_request.opened → signature ok → review agent'], ['g', '✓ review posted · worker files verdict: PASS']] },
    { n: ['Sign-off', '签收'], s: ['human · reads evidence, not diffs', '人 · 看证据，不看 diff'], human: 1, l: [['w', 'AC1 ✓  AC2 ✓  AC3 ✓   — approved'], ['c', '/status-reporter › customer status sheet updated: DEV-n']] },
  ];
  let run = 0;
  const rail = () => { $('#rail').innerHTML = ST.map((s, i) => `<li class="${s.human ? 'human' : ''}"><i>${String(i + 1).padStart(2, '0')}</i><span>${T(...s.n)}<small>${T(...s.s)}</small></span></li>`).join(''); };
  const play = async () => {
    const id = ++run, term = $('#term'), wait = ms => new Promise(r => setTimeout(r, ms)); rail(); term.innerHTML = '';
    for (let i = 0; i < ST.length; i++) {
      if (id !== run) return; const li = $$('#rail li')[i]; li.classList.add('run');
      for (const [cls, text] of ST[i].l) {
        const sp = document.createElement('span'); sp.className = cls; term.appendChild(sp); const cur = document.createElement('span'); cur.className = 'cur'; term.appendChild(cur);
        if (cls === '') for (let c = 0; c < text.length; c += 3) { if (id !== run) return; sp.textContent = text.slice(0, c + 3); await wait(12); }
        sp.textContent = text + '\n'; cur.remove(); term.scrollTop = term.scrollHeight; await wait(cls === 'g' ? 240 : 150);
      }
      term.appendChild(document.createTextNode('\n')); if (id !== run) return; li.classList.remove('run'); li.classList.add('ok'); await wait(220);
    }
  };
  $('#runBtn').onclick = play; rail();
  onLang.push(() => { const d = $$('#rail li.ok').length; rail(); $$('#rail li').forEach((li, i) => { if (i < d) li.classList.add('ok'); }); });
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { play(); o.disconnect(); } }, { threshold: .3 }).observe($('#term'));
}

/* ---------- boot ---------- */
setLang(store.get('lang') === 'zh' ? 'zh' : 'en');       // English by default
onScroll(); addEventListener('load', scrollshots); addEventListener('resize', scrollshots);
