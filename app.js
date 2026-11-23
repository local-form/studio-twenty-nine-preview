/* Studio Twenty Nine Nails · preview by Local Form. Front end only: nothing is sent or stored. */
(() => {
  // Hours from Google (checked 2026-11-22), minutes after midnight. 0 = Sunday.
  const HOURS = { 0: [600, 1020], 1: [570, 1170], 2: [570, 1170], 3: [570, 1170], 4: [570, 1170], 5: [570, 1170], 6: [540, 1080] };
  const SERVICES = ['Manicure', 'Gel manicure', 'Pedicure', 'Gel pedicure', 'Mani + pedi', 'Dip powder', 'Acrylic set or fill', 'Hand-painted art', 'Waxing', 'Repair or removal'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = m => { const h = Math.floor(m / 60), mm = m % 60, h12 = ((h + 11) % 12) + 1; return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm'); };

  // "Now" in New York, so the status and days are right wherever the page is opened. ?now=2026-11-24T18:10 pins it for tests.
  const pinned = new URLSearchParams(location.search).get('now');
  function nyNow() {
    if (pinned) { const [d, t] = pinned.split('T'), [y, mo, da] = d.split('-').map(Number), [h, mi] = (t || '12:00').split(':').map(Number); return { y, mo: mo - 1, d: da, dow: new Date(Date.UTC(y, mo - 1, da)).getUTCDay(), min: h * 60 + mi }; }
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23', weekday: 'short' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { y: +p.year, mo: +p.month - 1, d: +p.day, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: +p.hour * 60 + +p.minute };
  }
  const now = nyNow();
  const thanksgiving = y => { const first = new Date(Date.UTC(y, 10, 1)).getUTCDay(); return 1 + ((4 - first + 7) % 7) + 21; };
  const holiday = (y, mo, d) => mo === 10 && (d === thanksgiving(y) || d === thanksgiving(y) + 1) ? (d === thanksgiving(y) ? 'Thanksgiving' : 'Black Friday') : (mo === 11 && (d === 24 || d === 25 || d === 31)) || (mo === 0 && d === 1) ? 'Holiday' : '';

  // Status line under the hero buttons
  const st = document.querySelector('[data-status]');
  if (st) {
    const [o, c] = HOURS[now.dow];
    let txt, open = false;
    if (now.min < o) txt = 'Opens today at ' + fmt(o);
    else if (now.min < c) { txt = 'Open today till ' + fmt(c); open = true; }
    else { const nd = (now.dow + 1) % 7; txt = 'Closed now · opens tomorrow ' + fmt(HOURS[nd][0]); }
    st.textContent = txt;
    if (!open) st.parentElement.classList.add('closed');
  }

  // Next 7 bookable days
  const days = [];
  for (let i = 0; days.length < 7 && i < 9; i++) {
    const dt = new Date(Date.UTC(now.y, now.mo, now.d + i)), dow = dt.getUTCDay(), [o, c] = HOURS[dow];
    if (i === 0 && now.min > c - 90) continue; // too late to start something today
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[dow].slice(0, 3) + ' ' + dt.getUTCDate();
    days.push({ key: dt.toISOString().slice(0, 10), dow, o, c, label, long: (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[dow]) + ', ' + MON[dt.getUTCMonth()] + ' ' + dt.getUTCDate(), short: DAYS[dow].slice(0, 3) + ', ' + MON[dt.getUTCMonth()] + ' ' + dt.getUTCDate(), hol: holiday(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()), today: i === 0 });
  }
  const windows = d => {
    const w = [];
    const from = d.today ? Math.max(d.o, now.min + 30) : d.o;
    if (from < 720) w.push({ key: 'Morning', hint: fmt(d.o) + '–12' });
    if (Math.max(from, 720) < 1020 && d.c > 780) w.push({ key: 'Afternoon', hint: '12–5' });
    if (d.c >= 1140 && Math.max(from, 1020) < d.c - 45) w.push({ key: 'Evening', hint: '5–' + fmt(d.c).replace(' pm', '') });
    return w;
  };

  // ---- the card ----
  const card = document.querySelector('[data-card]'), steps = document.querySelector('[data-steps]');
  if (!card || !steps) return;
  const S = { service: '', look: '', day: null, time: '', name: '', phone: '', tech: '' };
  const ORDER = ['service', 'day', 'time', 'name'];
  let at = 'service';
  const line = k => card.querySelector(`[data-line="${k}"]`);
  const write = (k, v) => { const el = line(k); if (el.textContent === v) return; el.textContent = v; el.classList.remove('ink'); void el.offsetWidth; if (v) el.classList.add('ink'); };
  const chip = (label, sub, on, pressed) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', pressed ? 'true' : 'false'); b.innerHTML = label + (sub ? ` <small>${sub}</small>` : ''); b.addEventListener('click', on); return b; };

  function render() {
    const sc = steps.querySelector('[data-chips="service"]'); sc.replaceChildren(...SERVICES.map(s => chip(s, '', () => { S.service = s; S.look = ''; write('service', s); go(S.day ? (S.time ? 'name' : 'time') : 'day'); }, S.service === s && !S.look)));
    const dc = steps.querySelector('[data-chips="day"]'); dc.replaceChildren(...days.map(d => chip(d.label, d.hol ? '· call' : '', () => { S.day = d; write('day', d.short); if (S.time && !windows(d).some(w => w.key === S.time)) { S.time = ''; write('time', ''); } go('time'); }, S.day && S.day.key === d.key)));
    const hol = days.find(d => d.hol); steps.querySelector('[data-day-note]').textContent = hol ? `${hol.hol} hours might differ: call to check.` : `Open 7 days. Sunday ${fmt(HOURS[0][0])}–${fmt(HOURS[0][1])}.`;
    if (S.day) { const tc = steps.querySelector('[data-chips="time"]'); tc.replaceChildren(...windows(S.day).map(w => chip(w.key, w.hint, () => { S.time = w.key; write('time', w.key); go('name'); }, S.time === w.key))); }
  }
  function go(k) {
    at = k; render();
    steps.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== k; });
    const i = ORDER.indexOf(k);
    card.querySelectorAll('.lines > div').forEach((d, j) => d.classList.toggle('now', j === i));
    card.querySelector('[data-progress]').textContent = i >= 0 ? `${i + 1} of 4` : '';
    steps.querySelector('[data-back]').hidden = k === 'service' || k === 'done';
    const first = steps.querySelector(`[data-step="${k}"] .chip, [data-step="${k}"] input`);
    if (first && document.activeElement && steps.contains(document.activeElement)) first.focus({ preventScroll: true });
  }
  const nextMissing = () => !S.service ? 'service' : !S.day ? 'day' : !S.time ? 'time' : 'name';
  function open(e, from) {
    steps.hidden = false; card.classList.add('flipped'); card.querySelector('.back').removeAttribute('aria-hidden'); go(from || (at === 'done' ? 'service' : at));
    card.closest('.hero').classList.add('filling');
    if (innerWidth < 1000 || from) { const y = card.closest('.card-stage').getBoundingClientRect().top + scrollY - document.querySelector('.site-head').offsetHeight - 18; scrollTo({ top: Math.max(0, y), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    setTimeout(() => { const f = steps.querySelector('[data-step]:not([hidden]) .chip, [data-step]:not([hidden]) input'); f && f.focus({ preventScroll: true }); }, 450);
  }
  document.querySelectorAll('[data-open-card]').forEach(b => b.addEventListener('click', open));
  card.addEventListener('click', () => { if (!card.classList.contains('flipped')) open(); });
  steps.querySelector('[data-back]').addEventListener('click', () => { const i = ORDER.indexOf(at); if (i > 0) go(ORDER[i - 1]); });
  const form = steps.querySelector('form[data-step="name"]');
  form.name.addEventListener('input', e => { S.name = e.target.value.trim(); write('name', S.name); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    S.name = form.name.value.trim(); S.phone = form.phone.value.trim(); S.tech = form.tech.value.trim();
    const ok = S.name && S.phone.replace(/\D/g, '').length >= 7;
    form.querySelector('[data-err]').hidden = ok;
    if (!ok) { (S.name ? form.phone : form.name).focus(); return; }
    card.classList.add('requested');
    steps.querySelector('[data-summary]').textContent = `${S.service}${S.look ? ' (' + S.look.toLowerCase() + ')' : ''}, ${S.day.long}, ${S.time.toLowerCase()}, for ${S.name}${S.tech ? ' (with ' + S.tech + ')' : ''}.`;
    go('done'); document.dispatchEvent(new CustomEvent('card:request', { detail: S }));
  });
  steps.querySelector('[data-restart]').addEventListener('click', () => {
    Object.assign(S, { service: '', look: '', day: null, time: '', name: '', phone: '', tech: '' }); form.reset(); card.classList.remove('requested');
    ['service', 'day', 'time', 'name'].forEach(k => write(k, '')); go('service');
  });
  // keyboard: arrow keys move between chips in a row
  steps.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key) || !e.target.classList.contains('chip')) return;
    const list = [...e.target.parentElement.querySelectorAll('.chip:not(:disabled)')], i = list.indexOf(e.target), n = list[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
    n.focus(); e.preventDefault();
  });
  // services and sets put things on the card
  const startWith = (service, look) => {
    if (card.classList.contains('requested')) steps.querySelector('[data-restart]').click();
    S.service = service; S.look = look || ''; write('service', look ? 'Art · ' + look : service);
    open(null, nextMissing());
  };
  document.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => startWith(b.dataset.pick)));
  document.querySelectorAll('[data-look]').forEach(b => b.addEventListener('click', () => startWith('Hand-painted art', b.dataset.look)));

  // the plain form (same request, no card)
  const pf = document.querySelector('[data-form]');
  if (pf) {
    const opt = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t || v; return o; };
    pf.querySelector('[data-form-service]').append(...SERVICES.map(x => opt(x)));
    pf.querySelector('[data-form-day]').append(...days.map(d => opt(d.key, d.long + (d.hol ? ' (holiday: call)' : ''))), opt('other', 'Another day (add in notes)'));
        pf.addEventListener('submit', e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(pf)), ok = f.name.trim() && f.phone.replace(/\D/g, '').length >= 7;
      pf.querySelector('[data-form-err]').hidden = !!ok;
      if (!ok) { (f.name.trim() ? pf.phone : pf.name).focus(); return; }
      const d = days.find(x => x.key === f.day);
      const parts = [f.service || 'An appointment', d ? d.long : (f.day === 'other' ? 'another day' : 'any day'), f.time ? f.time.toLowerCase() : 'any time'];
      pf.querySelector('[data-form-summary]').textContent = parts.join(', ') + ', for ' + f.name.trim() + (f.tech.trim() ? ' (with ' + f.tech.trim() + ')' : '') + '.';
      const done = pf.querySelector('[data-form-done]'); done.hidden = false; done.focus({ preventScroll: true });
    });
  }

  window.S29 = { state: S, go, open };
})();

// today's row in the hours table
(() => { const p = new URLSearchParams(location.search).get('now'); let dow;
  if (p) { const [y, m, d] = p.split('T')[0].split('-').map(Number); dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
  else dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date()));
  const r = document.querySelector(`[data-hours] tr[data-dow="${dow}"]`); r && r.classList.add('today'); })();

// sections glide in as they arrive
(() => {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map();
  els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', Math.min(i, 6) * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();
