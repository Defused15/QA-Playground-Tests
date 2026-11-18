// QA Playground E2E report. Renders the Playwright results embedded in
// <script id="report-data" type="application/json">.
(function () {
  'use strict';

  const DATA = JSON.parse(document.getElementById('report-data').textContent);
  const TESTS = DATA.tests || [];

  // ── Formatting ──────────────────────────────────────────────────────────────

  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const fmtMs = (ms) => {
    if (ms == null || !Number.isFinite(ms)) return '–';
    if (ms < 1000) return Math.round(ms) + ' ms';
    if (ms < 60000) return (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + ' s';
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return m + ' min ' + s + ' s';
  };
  const fmtDate = (ts) =>
    new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  const fmtAgo = (ts) => {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
    const h = Math.floor(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    const d = Math.floor(h / 24);
    return d === 1 ? 'yesterday' : d + ' days ago';
  };
  const plural = (n, one, many) =>
    n.toLocaleString('en-US') + ' ' + (n === 1 ? one : many || one + 's');
  const listJoin = (a) =>
    a.length <= 1
      ? a.join('')
      : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  const OUT = {
    fail: { label: 'Failed', rank: 0 },
    flaky: { label: 'Flaky', rank: 1 },
    skip: { label: 'Skipped', rank: 2 },
    pass: { label: 'Passed', rank: 3 },
  };
  const outOf = (o) => OUT[o] || OUT.skip;
  const chip = (o, label) =>
    '<span class="chip ' +
    (OUT[o] ? o : 'skip') +
    '"><span class="dot"></span>' +
    esc(label || outOf(o).label) +
    '</span>';
  const loc = (t) => t.file + (t.line ? ':' + t.line : '');
  const fullPath = (t) => (DATA.testDir ? DATA.testDir + '/' : '') + loc(t);
  const suitePath = (t) => (t.suite || []).join(' › ');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON_COPY =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 10.5V4a1 1 0 0 1 1-1h6.5"/></svg>';
  const ICON_EXT =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5L7 9"/></svg>';
  const ICON_DOWN =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"/></svg>';
  const ICON_CLOSE =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

  // ── Tooltip (one shared element, on hover or focus of [data-tip]) ──────────

  const tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  let tipTarget = null;

  function showTip(el) {
    tipTarget = el;
    tip.textContent = el.dataset.tip;
    tip.classList.add('on');
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const x = Math.min(
      Math.max(8, r.left + r.width / 2 - w / 2),
      innerWidth - w - 8
    );
    const above = r.top - h - 8;
    const y = above > 8 ? above : Math.min(r.bottom + 8, innerHeight - h - 8);
    tip.style.transform =
      'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  }
  function hideTip() {
    tipTarget = null;
    tip.classList.remove('on');
  }
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;
    const el = e.target.closest('[data-tip]');
    if (el && el !== tipTarget) showTip(el);
    else if (!el && tipTarget) hideTip();
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tip]');
    if (el && el.matches(':focus-visible')) showTip(el);
  });
  document.addEventListener('focusout', hideTip);
  addEventListener('scroll', hideTip, { passive: true });

  // ── Toast ───────────────────────────────────────────────────────────────────

  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 1800);
  }
  function copy(text, what) {
    const done = () => toast('Copied ' + what);
    const fail = () => toast('Could not copy ' + what);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else fail();
    } catch (e) {
      fail();
    }
  }

  // ── Hero ────────────────────────────────────────────────────────────────────

  function hero() {
    const s = DATA.stats;
    const failed = TESTS.filter((t) => t.outcome === 'fail');
    const lead = document.getElementById('lead');
    const sub = document.getElementById('lead-sub');
    const n = (v) =>
      '<span class="num">' + v.toLocaleString('en-US') + '</span>';
    if (!s.total) lead.textContent = 'No tests were recorded.';
    else if (s.pass === s.total)
      lead.innerHTML = 'All ' + n(s.total) + ' tests passed.';
    else lead.innerHTML = n(s.pass) + ' of ' + n(s.total) + ' tests passed.';

    if (failed.length) {
      sub.classList.add('alert');
      const names = failed
        .slice(0, 3)
        .map((t) => t.title + ' (' + t.browser + ')');
      sub.textContent =
        'Failing: ' +
        listJoin(
          failed.length > 3
            ? names.concat(plural(failed.length - 3, 'more test'))
            : names
        ) +
        '.';
    } else {
      const parts = [];
      if (s.flaky)
        parts.push(plural(s.flaky, 'flaky test') + ' passed on retry');
      if (s.skip) parts.push(plural(s.skip, 'test') + ' skipped');
      sub.textContent = parts.length
        ? parts[0].charAt(0).toUpperCase() + listJoin(parts).slice(1) + '.'
        : '';
    }
    document.documentElement.dataset.health = failed.length ? 'fail' : 'pass';

    const meta = [];
    if (DATA.started) {
      meta.push(
        '<span><span class="lbl">Ran</span><span>' +
          esc(fmtDate(DATA.started)) +
          ', ' +
          esc(fmtAgo(DATA.started)) +
          '</span></span>'
      );
    }
    if (DATA.duration != null) {
      meta.push(
        '<span><span class="lbl">Took</span><span class="num">' +
          fmtMs(DATA.duration) +
          '</span></span>'
      );
    }
    if (DATA.browsers.length) {
      meta.push(
        '<span><span class="lbl">Browsers</span><span>' +
          esc(listJoin(DATA.browsers)) +
          '</span></span>'
      );
    }
    if (DATA.playwrightVersion) {
      meta.push(
        '<span><span class="lbl">Playwright</span><span class="num">' +
          esc(DATA.playwrightVersion) +
          '</span></span>'
      );
    }
    document.getElementById('meta').innerHTML = meta.join('');
  }

  // ── Summary ─────────────────────────────────────────────────────────────────

  function summary() {
    const s = DATA.stats;
    const stat = (num, lbl, cls, dot) =>
      '<div class="stat"><span class="num">' +
      num +
      '</span><span class="lbl' +
      (cls ? ' ' + cls : '') +
      '">' +
      (dot ? '<i class="' + dot + '" aria-hidden="true"></i>' : '') +
      lbl +
      '</span></div>';
    let html =
      '<div class="stats">' +
      stat(
        s.pass.toLocaleString('en-US') +
          ' <small>/ ' +
          s.total.toLocaleString('en-US') +
          '</small>',
        'Passed',
        '',
        'pass'
      ) +
      stat(
        s.fail.toLocaleString('en-US'),
        'Failed',
        s.fail ? 'fail' : '',
        'fail'
      ) +
      stat(s.flaky.toLocaleString('en-US'), 'Flaky', '', 'flaky') +
      stat(s.skip.toLocaleString('en-US'), 'Skipped', '', 'skip') +
      stat(fmtMs(DATA.duration), 'Duration') +
      '</div>';

    if (DATA.byBrowser.length) {
      html +=
        '<ul class="runners" aria-label="Results by browser">' +
        DATA.byBrowser
          .map(
            (b, i) =>
              '<li><span class="r-name">' +
              esc(b.name) +
              '</span>' +
              '<span class="r-bar" role="img" aria-label="' +
              esc(
                b.name +
                  ': ' +
                  b.pass +
                  ' passed, ' +
                  b.fail +
                  ' failed, ' +
                  b.flaky +
                  ' flaky, ' +
                  b.skip +
                  ' skipped'
              ) +
              '">' +
              ['pass', 'flaky', 'fail', 'skip']
                .map((k) =>
                  b[k]
                    ? '<span class="' +
                      k +
                      '" style="flex:' +
                      b[k] +
                      ';--i:' +
                      i +
                      '" data-tip="' +
                      esc(
                        b.name +
                          ': ' +
                          b[k] +
                          ' ' +
                          outOf(k).label.toLowerCase()
                      ) +
                      '"></span>'
                    : ''
                )
                .join('') +
              '</span>' +
              '<span class="r-num num">' +
              b.pass +
              '/' +
              b.total +
              '</span></li>'
          )
          .join('') +
        '</ul>';
    }
    document.getElementById('summary-body').innerHTML = html;
  }

  // ── Needs attention ─────────────────────────────────────────────────────────

  function attention() {
    const sec = document.getElementById('attention');
    const items = TESTS.filter(
      (t) => t.outcome === 'fail' || t.outcome === 'flaky'
    ).sort(
      (a, b) => outOf(a.outcome).rank - outOf(b.outcome).rank || a.i - b.i
    );
    if (!items.length) {
      sec.hidden = true;
      return;
    }
    const fails = items.filter((t) => t.outcome === 'fail').length;
    const flaky = items.length - fails;
    sec.querySelector('.sec-note').textContent =
      listJoin(
        [
          fails ? plural(fails, 'test') + ' failed' : '',
          flaky ? plural(flaky, 'test') + ' flaky' : '',
        ].filter(Boolean)
      ) + ' in this run.';
    const LIMIT = 12;
    document.getElementById('attn-list').innerHTML =
      items
        .slice(0, LIMIT)
        .map(
          (t) =>
            '<li><button class="attn-row" type="button" data-i="' +
            t.i +
            '">' +
            '<span class="attn-title">' +
            chip(t.outcome) +
            '<span class="nm">' +
            esc(t.title) +
            '</span></span>' +
            '<span class="attn-sub">' +
            esc(t.browser) +
            ', <span class="mono">' +
            esc(loc(t)) +
            '</span>' +
            (t.outcome === 'flaky'
              ? ', passed after ' + plural(t.retries, 'retry', 'retries')
              : t.retries
                ? ', failed ' + (t.retries + 1) + ' times'
                : '') +
            '</span>' +
            (t.errorLine
              ? '<span class="attn-msg ' +
                t.outcome +
                '">' +
                esc(t.errorLine) +
                '</span>'
              : '') +
            '</button></li>'
        )
        .join('') +
      (items.length > LIMIT
        ? '<li class="empty"><button class="link" type="button" data-show-all>Show all ' +
          plural(items.length, 'test') +
          ' in the table</button></li>'
        : '');
    sec.addEventListener('click', (e) => {
      if (e.target.closest('[data-show-all]')) {
        const b = document.querySelector('#table .seg [data-result="fail"]');
        if (b) b.click();
        document
          .getElementById('tests')
          .scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        return;
      }
      const b = e.target.closest('.attn-row');
      if (b) drawer.open(TESTS[Number(b.dataset.i)]);
    });
  }

  // ── Segmented control indicator ─────────────────────────────────────────────

  function moveIndicator(seg) {
    const ind = seg.querySelector('.seg-ind');
    const on = seg.querySelector(
      '[aria-selected="true"], [aria-pressed="true"]'
    );
    if (!ind || !on) return;
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }
  addEventListener('resize', () =>
    document.querySelectorAll('.seg').forEach(moveIndicator)
  );

  /** Tab-key focus trap inside `scope`. */
  function trapTab(e, scope) {
    const f = [
      ...scope.querySelectorAll(
        'button:not([tabindex="-1"]), [href], summary, video[controls], [tabindex="0"]'
      ),
    ].filter((el) => el.getClientRects().length && !el.disabled);
    if (!f.length) {
      e.preventDefault();
      return;
    }
    const first = f[0];
    const last = f[f.length - 1];
    const a = document.activeElement;
    if (!scope.contains(a) || a === scope) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    } else if (e.shiftKey && a === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && a === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ── Lightbox for screenshots ────────────────────────────────────────────────

  const lightbox = (function () {
    const root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Screenshot');
    root.innerHTML =
      '<div class="lb-bar"><span id="lb-name"></span><span class="lb-actions">' +
      '<a class="btn" id="lb-orig" target="_blank" rel="noopener">Open original' +
      ICON_EXT +
      '</a>' +
      '<button class="icon-btn" type="button" id="lb-close" aria-label="Close screenshot">' +
      ICON_CLOSE +
      '</button></span></div>' +
      '<div class="lb-stage"><img alt=""></div>';
    document.body.appendChild(root);
    const img = root.querySelector('img');
    let back = null;

    function open(url, name, from) {
      back = from;
      img.src = url;
      img.alt = name;
      root.querySelector('#lb-name').textContent = name;
      root.querySelector('#lb-orig').href = url;
      root.classList.add('open');
      root.querySelector('#lb-close').focus({ preventScroll: true });
    }
    function close() {
      if (!root.classList.contains('open')) return;
      root.classList.remove('open');
      if (back && back.isConnected) back.focus({ preventScroll: true });
    }
    root.addEventListener('click', (e) => {
      if (e.target.closest('#lb-close') || !e.target.closest('img, .lb-bar'))
        close();
    });
    return {
      open,
      close,
      isOpen: () => root.classList.contains('open'),
      root,
    };
  })();

  // ── Test drawer ─────────────────────────────────────────────────────────────

  const drawer = (function () {
    const root = document.createElement('div');
    root.className = 'drawer-root';
    root.innerHTML =
      '<div class="scrim" data-close></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dr-title" tabindex="-1">' +
      '<div class="grabber" aria-hidden="true"></div>' +
      '<header class="dr-head">' +
      '<div class="dr-meta" id="dr-meta"></div>' +
      '<p class="dr-suite" id="dr-suite"></p>' +
      '<h2 class="dr-title" id="dr-title"></h2>' +
      '<div class="dr-file"><code id="dr-file"></code>' +
      '<button class="icon-btn" type="button" id="dr-copy" aria-label="Copy spec path" data-tip="Copy spec path">' +
      ICON_COPY +
      '</button></div>' +
      '<button class="icon-btn dr-close" type="button" data-close aria-label="Close">' +
      ICON_CLOSE +
      '</button>' +
      '</header>' +
      '<div class="seg dr-tabs" role="tablist" id="dr-tabs" aria-label="Test details"></div>' +
      '<div class="dr-body" id="dr-body" role="tabpanel"></div>' +
      '</aside>';
    document.body.appendChild(root);

    const panel = root.querySelector('.drawer');
    const body = root.querySelector('#dr-body');
    const tabs = root.querySelector('#dr-tabs');
    let current = null;
    let returnFocus = null;

    const section = (title, inner, action) =>
      '<section class="dr-sec"><div class="dr-sec-head"><h3>' +
      title +
      '</h3>' +
      (action || '') +
      '</div>' +
      inner +
      '</section>';
    const attemptName = (retry) =>
      retry === 0 ? 'First attempt' : 'Retry ' + retry;

    function annotations(t) {
      if (!t.annotations.length && !(t.tags && t.tags.length)) return '';
      return (
        '<p class="annot">' +
        (t.tags || [])
          .map((g) => '<span class="tag">' + esc(g) + '</span>')
          .join('') +
        t.annotations
          .map(
            (a) =>
              '<span><span class="tag">' +
              esc(a.type) +
              '</span>' +
              esc(a.description) +
              '</span>'
          )
          .join('') +
        '</p>'
      );
    }

    function stepsView(t) {
      let html = annotations(t);
      if (t.steps.length) {
        const failedSteps = t.steps.filter((s) => s.status === 'fail').length;
        html += section(
          'Steps',
          '<ol class="steps">' +
            t.steps
              .map(
                (s) =>
                  '<li class="step ' +
                  s.status +
                  '"><span class="step-dot" aria-hidden="true"></span>' +
                  '<span class="step-title"><span class="sr">' +
                  (s.status === 'fail' ? 'Failed: ' : 'Passed: ') +
                  '</span>' +
                  esc(s.title) +
                  (s.nested
                    ? '<span class="step-sub">' +
                      plural(s.nested, 'nested step') +
                      '</span>'
                    : '') +
                  '</span>' +
                  '<span class="step-dur">' +
                  fmtMs(s.duration) +
                  '</span>' +
                  (s.error
                    ? '<pre class="err step-err">' + esc(s.error) + '</pre>'
                    : '') +
                  '</li>'
              )
              .join('') +
            '</ol>',
          '<span class="hint">' +
            plural(t.steps.length, 'step') +
            (failedSteps ? ', ' + failedSteps + ' failed' : '') +
            '</span>'
        );
      } else if (t.outcome === 'skip') {
        html += section(
          'Steps',
          '<p class="muted">This test was skipped, so no steps ran.</p>'
        );
      } else {
        html += section(
          'Steps',
          '<p class="muted">Playwright records a step for each <code>test.step()</code> block; this test has none.</p>'
        );
      }
      if (t.retries > 0) {
        html +=
          '<p class="note">' +
          (t.outcome === 'fail'
            ? 'Still failing after '
            : t.outcome === 'flaky'
              ? 'Passed after '
              : 'Finished after ') +
          plural(t.retries, 'retry', 'retries') +
          '. Earlier attempts are under Retries.</p>';
      }
      if (
        t.outcome === 'fail' &&
        t.errorLine &&
        !t.steps.some((s) => s.error)
      ) {
        html += section(
          'Error',
          '<pre class="err">' + esc(t.errorLine) + '</pre>'
        );
      }
      return html;
    }

    function errorView(t) {
      const e = t.error;
      if (!e) return '<p class="muted note">No error was recorded.</p>';
      let html = section(
        'Message',
        '<pre class="err">' + esc(e.message) + '</pre>'
      );
      if (e.snippet) {
        html += section(
          'Source',
          '<pre class="code">' + esc(e.snippet) + '</pre>'
        );
      }
      if (e.location && e.location.file) {
        html +=
          '<p class="err-loc">At <span class="mono">' +
          esc(e.location.file.split(/[\\/]/).slice(-2).join('/')) +
          (e.location.line ? ':' + esc(e.location.line) : '') +
          '</span></p>';
      }
      if (e.stack) {
        html +=
          '<details class="stack"><summary>Stack trace</summary><pre>' +
          esc(e.stack) +
          '</pre></details>';
      }
      return html;
    }

    function attachmentsView(t) {
      const list = t.attachments;
      if (!list.length) {
        return (
          '<p class="muted note">No attachments were recorded for this test. ' +
          'Screenshots and videos are kept for failing tests, and a trace on the first retry.</p>'
        );
      }
      const many = t.retries > 0;
      const cap = (a) => (many ? attemptName(a.retry) + ', ' : '') + a.name;
      const images = list.filter((a) => a.kind === 'image');
      const videos = list.filter((a) => a.kind === 'video');
      const traces = list.filter((a) => a.kind === 'trace');
      const files = list.filter((a) => a.kind === 'file');
      let html = '';
      if (images.length) {
        html += section(
          'Screenshots',
          '<div class="att-grid">' +
            images
              .map(
                (a) =>
                  '<button class="thumb" type="button" data-img="' +
                  esc(a.url) +
                  '" data-name="' +
                  esc(cap(a)) +
                  '" aria-label="View screenshot: ' +
                  esc(cap(a)) +
                  '"><img src="' +
                  esc(a.url) +
                  '" alt="" loading="lazy"><span>' +
                  esc(cap(a)) +
                  '</span></button>'
              )
              .join('') +
            '</div>'
        );
      }
      if (videos.length) {
        html += section(
          'Video',
          videos
            .map(
              (a) =>
                '<figure class="att-video"><video controls preload="none" src="' +
                esc(a.url) +
                '" aria-label="' +
                esc('Video: ' + cap(a)) +
                '"></video><figcaption class="att-cap">' +
                esc(cap(a)) +
                '</figcaption></figure>'
            )
            .join('')
        );
      }
      if (traces.length) {
        html += section(
          'Trace',
          '<ul class="att-list">' +
            traces
              .map(
                (a) =>
                  '<li><span class="nm">' +
                  esc(a.name) +
                  (many ? '<small>' + attemptName(a.retry) + '</small>' : '') +
                  '</span><span class="att-actions">' +
                  '<a class="btn" target="_blank" rel="noopener" href="' +
                  esc(
                    'https://trace.playwright.dev/?trace=' +
                      encodeURIComponent((DATA.pagesBase || '') + a.url)
                  ) +
                  '">Open in Trace Viewer' +
                  ICON_EXT +
                  '</a>' +
                  '<a class="btn" download href="' +
                  esc(a.url) +
                  '" aria-label="' +
                  esc('Download ' + a.name) +
                  '">' +
                  ICON_DOWN +
                  'Download</a></span></li>'
              )
              .join('') +
            '</ul>'
        );
      }
      if (files.length) {
        html += section(
          'Other files',
          '<ul class="att-list">' +
            files
              .map(
                (a) =>
                  '<li><span class="nm">' +
                  esc(a.name) +
                  '<small>' +
                  esc(
                    (many ? attemptName(a.retry) + ', ' : '') +
                      (a.type || 'file')
                  ) +
                  '</small></span><span class="att-actions">' +
                  '<a class="btn" target="_blank" rel="noopener" href="' +
                  esc(a.url) +
                  '" aria-label="' +
                  esc('Open ' + a.name) +
                  '">Open' +
                  ICON_EXT +
                  '</a></span></li>'
              )
              .join('') +
            '</ul>'
        );
      }
      return html;
    }

    function retriesView(t) {
      if (!t.attempts.length) {
        return '<p class="muted note">This test did not run.</p>';
      }
      const label = (a) =>
        a.rawStatus === 'timedOut'
          ? 'Timed out'
          : a.rawStatus === 'interrupted'
            ? 'Interrupted'
            : outOf(a.status).label;
      return section(
        t.attempts.length === 1 ? 'Attempt' : 'Attempts',
        '<ol class="attempts">' +
          t.attempts
            .map(
              (a) =>
                '<li><span class="a-name">' +
                attemptName(a.retry) +
                '</span>' +
                chip(a.status, label(a)) +
                '<span class="a-dur">' +
                fmtMs(a.duration) +
                '</span>' +
                (a.error
                  ? '<span class="a-err">' + esc(a.error) + '</span>'
                  : '') +
                '</li>'
            )
            .join('') +
          '</ol>',
        '<span class="hint">' +
          (t.retries
            ? plural(t.retries, 'retry', 'retries')
            : 'Passed or failed on the first attempt') +
          '</span>'
      );
    }

    const VIEWS = {
      steps: stepsView,
      error: errorView,
      attachments: attachmentsView,
      retries: retriesView,
    };

    function tabList(t) {
      const list = [['steps', 'Steps']];
      if (t.outcome === 'fail') list.push(['error', 'Error']);
      list.push(['attachments', 'Attachments', t.attachments.length]);
      list.push(['retries', 'Retries', t.retries]);
      return list;
    }

    function setTab(name, focusTab) {
      tabs.querySelectorAll('[role=tab]').forEach((b) => {
        const on = b.dataset.tab === name;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      moveIndicator(tabs);
      const tab = tabs.querySelector('[data-tab="' + name + '"]');
      body.setAttribute('aria-labelledby', tab.id);
      body.innerHTML = VIEWS[name](current);
      body.scrollTop = 0;
      if (focusTab) tab.focus();
    }

    function open(t) {
      current = t;
      returnFocus = document.activeElement;
      root.querySelector('#dr-meta').innerHTML =
        chip(t.outcome) +
        '<span>' +
        esc(t.browser) +
        '</span>' +
        '<span class="num">' +
        fmtMs(t.duration) +
        '</span>' +
        (t.retries
          ? '<span>' + plural(t.retries, 'retry', 'retries') + '</span>'
          : '');
      root.querySelector('#dr-suite').textContent = suitePath(t);
      root.querySelector('#dr-title').textContent = t.title;
      root.querySelector('#dr-file').textContent = fullPath(t);
      panel.dataset.status = t.outcome;
      tabs.innerHTML =
        '<span class="seg-ind" aria-hidden="true"></span>' +
        tabList(t)
          .map(
            ([k, l, n]) =>
              '<button role="tab" type="button" id="dr-tab-' +
              k +
              '" data-tab="' +
              k +
              '" aria-selected="false" aria-controls="dr-body">' +
              l +
              (n ? ' <span class="count">' + n + '</span>' : '') +
              '</button>'
          )
          .join('');
      root.classList.add('open');
      document.documentElement.classList.add('locked');
      setTab('steps');
      requestAnimationFrame(() => moveIndicator(tabs));
      panel.focus({ preventScroll: true });
    }

    function close() {
      if (!root.classList.contains('open')) return;
      lightbox.close();
      root.classList.remove('open');
      panel.style.transform = '';
      document.documentElement.classList.remove('locked');
      hideTip();
      body.querySelectorAll('video').forEach((v) => v.pause());
      if (returnFocus && returnFocus.isConnected && returnFocus.focus) {
        returnFocus.focus({ preventScroll: true });
      }
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) {
        close();
        return;
      }
      if (e.target.closest('#dr-copy')) {
        copy(fullPath(current), 'spec path');
        return;
      }
      const th = e.target.closest('.thumb');
      if (th) lightbox.open(th.dataset.img, th.dataset.name, th);
    });
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('[role=tab]');
      if (b) setTab(b.dataset.tab);
    });
    tabs.addEventListener('keydown', (e) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      const list = [...tabs.querySelectorAll('[role=tab]')];
      const i = list.findIndex(
        (b) => b.getAttribute('aria-selected') === 'true'
      );
      const next =
        e.key === 'Home'
          ? list[0]
          : e.key === 'End'
            ? list[list.length - 1]
            : list[
                (i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) %
                  list.length
              ];
      e.preventDefault();
      setTab(next.dataset.tab, true);
    });
    document.addEventListener('keydown', (e) => {
      if (lightbox.isOpen()) {
        if (e.key === 'Escape') {
          e.preventDefault();
          lightbox.close();
        } else if (e.key === 'Tab') trapTab(e, lightbox.root);
        return;
      }
      if (!root.classList.contains('open')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') trapTab(e, panel);
    });

    // Bottom sheet on small screens: drag the header down to dismiss.
    let drag = null;
    panel.addEventListener('pointerdown', (e) => {
      if (!matchMedia('(max-width: 720px)').matches) return;
      if (!e.target.closest('.grabber, .dr-head') || e.target.closest('button'))
        return;
      drag = { y: e.clientY, t: performance.now(), dy: 0 };
      panel.setPointerCapture(e.pointerId);
      panel.classList.add('dragging');
    });
    panel.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.dy = Math.max(0, e.clientY - drag.y);
      panel.style.transform = 'translateY(' + drag.dy + 'px)';
    });
    const endDrag = () => {
      if (!drag) return;
      const v = drag.dy / Math.max(1, performance.now() - drag.t);
      panel.classList.remove('dragging');
      if (drag.dy > panel.offsetHeight * 0.3 || (v > 0.6 && drag.dy > 40))
        close();
      else panel.style.transform = '';
      drag = null;
    };
    panel.addEventListener('pointerup', endDrag);
    panel.addEventListener('pointercancel', endDrag);

    return { open, close };
  })();

  // ── Tests table ─────────────────────────────────────────────────────────────

  function testsTable(mount) {
    const counts = { all: TESTS.length, fail: 0, flaky: 0, skip: 0, pass: 0 };
    TESTS.forEach((t) => {
      counts[t.outcome] = (counts[t.outcome] || 0) + 1;
    });
    const filters = [
      ['all', 'All'],
      ['fail', 'Failed'],
      ['flaky', 'Flaky'],
      ['skip', 'Skipped'],
      ['pass', 'Passed'],
    ].filter(([k]) => k === 'all' || counts[k]);
    const browsers = DATA.browsers || [];
    const files = DATA.files || [];

    const state = {
      q: '',
      result: 'all',
      browser: 'all',
      spec: 'all',
      page: 1,
      size: 25,
    };

    // Table state lives in the URL, so Back restores it and views can be
    // shared. Invalid values fall back to the defaults.
    const params = new URLSearchParams(location.search);
    state.q = (params.get('q') || '').slice(0, 200);
    if (filters.some(([k]) => k === params.get('result')))
      state.result = params.get('result');
    if (browsers.length > 1 && browsers.includes(params.get('browser')))
      state.browser = params.get('browser');
    if (files.length > 1 && files.includes(params.get('spec')))
      state.spec = params.get('spec');
    const p = parseInt(params.get('page'), 10);
    state.page = Number.isFinite(p) && p > 0 ? p : 1;

    function syncUrl() {
      const u = new URL(location.href);
      const set = (k, v, d) =>
        v === d ? u.searchParams.delete(k) : u.searchParams.set(k, v);
      set('q', state.q.trim(), '');
      set('result', state.result, 'all');
      set('browser', state.browser, 'all');
      set('spec', state.spec, 'all');
      set('page', String(state.page), '1');
      if (u.href !== location.href) history.replaceState(history.state, '', u);
    }

    const select = (name, label, all, values) =>
      values.length > 1
        ? '<select class="select" data-filter="' +
          name +
          '" aria-label="' +
          label +
          '"><option value="all">' +
          all +
          '</option>' +
          values
            .map(
              (n) =>
                '<option value="' +
                esc(n) +
                '"' +
                (n === state[name] ? ' selected' : '') +
                '>' +
                esc(n) +
                '</option>'
            )
            .join('') +
          '</select>'
        : '';

    mount.innerHTML =
      '<div class="tt-bar">' +
      '<label class="search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>' +
      '<input type="search" placeholder="Search tests, specs or errors" aria-label="Search tests" autocomplete="off" spellcheck="false">' +
      '<kbd aria-hidden="true">/</kbd></label>' +
      '<div class="seg" role="group" aria-label="Filter by result"><span class="seg-ind" aria-hidden="true"></span>' +
      filters
        .map(
          ([k, l]) =>
            '<button type="button" data-result="' +
            k +
            '" aria-pressed="' +
            (k === state.result) +
            '">' +
            l +
            ' <span class="count">' +
            counts[k].toLocaleString('en-US') +
            '</span></button>'
        )
        .join('') +
      '</div>' +
      select('browser', 'Filter by browser', 'All browsers', browsers) +
      select('spec', 'Filter by spec file', 'All spec files', files) +
      '</div>' +
      '<div class="tt-wrap"><table class="tt">' +
      '<thead><tr>' +
      '<th scope="col" class="c-test">Test</th>' +
      '<th scope="col" class="c-browser">Browser</th>' +
      '<th scope="col" class="c-status">Result</th>' +
      '<th scope="col" class="c-retries">Retries</th>' +
      '<th scope="col" class="c-dur">Duration</th>' +
      '</tr></thead><tbody></tbody></table></div>' +
      '<div class="tt-foot"><span class="tt-count" aria-live="polite"></span><nav class="pager" aria-label="Pages"></nav></div>';

    const $ = (s) => mount.querySelector(s);
    const input = $('input');
    const tbody = $('tbody');
    const seg = $('.seg');
    const sels = [...mount.querySelectorAll('.select')];
    input.value = state.q;
    requestAnimationFrame(() => moveIndicator(seg));

    const haystack = TESTS.map((t) =>
      [
        t.title,
        suitePath(t),
        loc(t),
        t.browser,
        t.errorLine,
        (t.tags || []).join(' '),
      ]
        .join(' ')
        .toLowerCase()
    );

    function visible() {
      const q = state.q.trim().toLowerCase();
      return TESTS.filter(
        (t) =>
          (state.result === 'all' || t.outcome === state.result) &&
          (state.browser === 'all' || t.browser === state.browser) &&
          (state.spec === 'all' || t.file === state.spec) &&
          (!q || haystack[t.i].includes(q))
      ).sort(
        (a, b) => outOf(a.outcome).rank - outOf(b.outcome).rank || a.i - b.i
      );
    }

    function render() {
      const list = visible();
      const pages = Math.max(1, Math.ceil(list.length / state.size));
      state.page = Math.min(state.page, pages);
      const start = (state.page - 1) * state.size;
      const slice = list.slice(start, start + state.size);
      syncUrl();

      tbody.innerHTML = slice.length
        ? slice
            .map(
              (t) =>
                '<tr data-i="' +
                t.i +
                '" class="' +
                t.outcome +
                '">' +
                '<td class="c-test"><button class="t-open" type="button">' +
                esc(t.title) +
                '</button>' +
                '<span class="t-file"><code>' +
                esc(loc(t)) +
                '</code>' +
                (t.suite.length ? ' · ' + esc(suitePath(t)) : '') +
                '</span></td>' +
                '<td class="c-browser">' +
                esc(t.browser) +
                '</td>' +
                '<td class="c-status">' +
                chip(t.outcome) +
                '</td>' +
                '<td class="c-retries"><span class="retries num' +
                (t.retries ? ' some' : '') +
                '">' +
                (t.retries ? plural(t.retries, 'retry', 'retries') : '–') +
                '</span></td>' +
                '<td class="c-dur num">' +
                (t.outcome === 'skip' && !t.duration
                  ? '–'
                  : fmtMs(t.duration)) +
                '</td></tr>'
            )
            .join('')
        : '<tr class="none"><td colspan="5"><div class="empty">No tests match ' +
          (state.q ? '“' + esc(state.q) + '”' : 'these filters') +
          '. <button class="link" type="button" data-reset>Clear filters</button></div></td></tr>';

      $('.tt-count').textContent = list.length
        ? start +
          1 +
          '–' +
          (start + slice.length) +
          ' of ' +
          plural(list.length, 'test')
        : '0 tests';

      const pager = $('.pager');
      if (pages <= 1) {
        pager.innerHTML = '';
        return;
      }
      const nums = [];
      for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || Math.abs(i - state.page) <= 1)
          nums.push(i);
        else if (nums[nums.length - 1] !== '…') nums.push('…');
      }
      pager.innerHTML =
        '<button type="button" data-page="' +
        (state.page - 1) +
        '" aria-label="Previous page"' +
        (state.page === 1 ? ' disabled' : '') +
        '>‹</button>' +
        nums
          .map((i) =>
            i === '…'
              ? '<span aria-hidden="true">…</span>'
              : '<button type="button" data-page="' +
                i +
                '" aria-label="Page ' +
                i +
                '"' +
                (i === state.page ? ' aria-current="page"' : '') +
                '>' +
                i +
                '</button>'
          )
          .join('') +
        '<button type="button" data-page="' +
        (state.page + 1) +
        '" aria-label="Next page"' +
        (state.page === pages ? ' disabled' : '') +
        '>›</button>';
    }

    /**
     * Re-render after a filter change. The control under the cursor stays put,
     * and when the table gets shorter it collapses with a short transition
     * instead of the page snapping up.
     */
    let collapse = null;
    function refilter(anchor) {
      if (collapse) collapse();
      const before = anchor.getBoundingClientRect().top;
      const from = mount.offsetHeight;
      mount.style.minHeight = from + 'px'; // hold the height while re-rendering
      render();
      window.scrollBy(0, anchor.getBoundingClientRect().top - before);
      // Measure the new natural height, then restore the held height and the
      // scroll position in the same frame, so nothing is painted in between.
      const y = window.scrollY;
      mount.style.minHeight = '';
      const to = mount.offsetHeight;
      if (reduceMotion || to >= from) return;
      mount.style.minHeight = from + 'px';
      window.scrollTo(0, y);
      void mount.offsetHeight; // commit the start height before transitioning
      mount.style.transition = 'min-height .28s cubic-bezier(.23, 1, .32, 1)';
      mount.style.minHeight = to + 'px';
      const done = (e) => {
        // Ignore transitions of child elements bubbling up (seg indicator, colors).
        if (e && (e.target !== mount || e.propertyName !== 'min-height'))
          return;
        mount.style.transition = '';
        mount.style.minHeight = '';
        mount.removeEventListener('transitionend', done);
        clearTimeout(timer);
        collapse = null;
      };
      const timer = setTimeout(() => done(), 400);
      mount.addEventListener('transitionend', done);
      collapse = () => done();
    }

    function setResult(k) {
      seg
        .querySelectorAll('button')
        .forEach((x) =>
          x.setAttribute('aria-pressed', String(x.dataset.result === k))
        );
      moveIndicator(seg);
      state.result = k;
    }

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.q = input.value;
        state.page = 1;
        refilter(input);
      }, 80);
    });
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      setResult(b.dataset.result);
      state.page = 1;
      refilter(seg);
    });
    sels.forEach((sel) =>
      sel.addEventListener('change', () => {
        state[sel.dataset.filter] = sel.value;
        state.page = 1;
        refilter(sel);
      })
    );

    $('.pager').addEventListener('click', (e) => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      // Keep the pager where it is on screen, even when the new page is shorter.
      const pager = $('.pager');
      const before = pager.getBoundingClientRect().top;
      const label = b.getAttribute('aria-label');
      const isStep = /Previous|Next/.test(label);
      state.page = Number(b.dataset.page);
      render();
      window.scrollBy(0, pager.getBoundingClientRect().top - before);
      // The buttons were re-rendered; keep focus on the equivalent one.
      const again = isStep
        ? pager.querySelector('[aria-label="' + label + '"]:not(:disabled)')
        : pager.querySelector('[aria-current]');
      const target = again || pager.querySelector('[aria-current]');
      if (target) target.focus({ preventScroll: true });
    });
    tbody.addEventListener('click', (e) => {
      if (e.target.closest('[data-reset]')) {
        input.value = '';
        state.q = '';
        state.browser = 'all';
        state.spec = 'all';
        sels.forEach((s) => {
          s.value = 'all';
        });
        setResult('all');
        refilter(seg);
        input.focus({ preventScroll: true });
        return;
      }
      const tr = e.target.closest('tr[data-i]');
      if (!tr) return;
      if (!e.target.closest('.t-open')) {
        tr.querySelector('.t-open').focus({ preventScroll: true });
      }
      drawer.open(TESTS[Number(tr.dataset.i)]);
    });

    // "/" or Cmd/Ctrl+K focuses search
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('.drawer-root.open') || lightbox.isOpen())
        return;
      const typing = /INPUT|TEXTAREA|SELECT/.test(
        document.activeElement.tagName
      );
      if (
        (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) ||
        (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });

    render();
  }

  // ── Theme toggle (light and dark; the default follows the system) ───────────

  (function () {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sys = matchMedia('(prefers-color-scheme: dark)');
    const current = () =>
      document.documentElement.dataset.theme ||
      (sys.matches ? 'dark' : 'light');
    const label = () =>
      btn.setAttribute(
        'aria-label',
        current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    label();
    sys.addEventListener('change', label);
    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('qapt-report-theme', next);
      } catch (e) {
        /* not persisted */
      }
      label();
    });
  })();

  // ── Boot ────────────────────────────────────────────────────────────────────

  hero();
  summary();
  attention();
  testsTable(document.getElementById('table'));

  if (!reduceMotion) {
    requestAnimationFrame(() =>
      document.documentElement.classList.add('ready')
    );
  } else document.documentElement.classList.add('ready', 'still');
})();
