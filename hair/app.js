(function () {
  'use strict';

  var PRODUCTS = window.FOFO_PRODUCTS || [];
  var BUNDLES = window.FOFO_BUNDLES || [];
  var FREE_SHIP = 50;
  var SHIP_COST = 6;
  var CART_KEY = 'fofo-hair-cart';
  var THEME_KEY = 'fofo-theme';
  var LANG_KEY = 'fofo-lang';
  var I18N = window.FOFO_I18N || { page: { ar: {} }, ui: { en: {}, ar: {} }, products: {}, bundles: {} };
  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Language
     ============================================================ */
  function t(key, vars) {
    var s = I18N.ui[lang][key];
    if (s === undefined) s = I18N.ui.en[key];
    if (typeof s === 'function') return s(vars);
    return String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] !== undefined ? vars[k] : ''; });
  }
  function tr(group, key) { var g = I18N.ui[lang][group] || {}; return g[key] !== undefined ? g[key] : key; }
  // Localized product / bundle fields fall back to the English catalog.
  function P(p, field) { var ar = lang === 'ar' && I18N.products[p.id]; return ar && ar[field] !== undefined ? ar[field] : p[field]; }
  function B(b, field) { var ar = lang === 'ar' && I18N.bundles[b.id]; return ar && ar[field] !== undefined ? ar[field] : b[field]; }
  function sizeLabel(s) { return lang === 'ar' ? s.replace(/(\d+)ml/, '$1 مل').replace('Set of 3', 'طقم من 3') : s; }
  function num(s) { return '<span class="num">' + s + '</span>'; }

  function applyStatic() {
    var dict = I18N.page.ar || {};
    $$('[data-i18n]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      var ar = dict[el.dataset.i18n];
      el.innerHTML = lang === 'ar' && ar !== undefined ? ar : el.dataset.en;
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.dataset.i18nAttr.split(';').forEach(function (pair) {
        var bits = pair.split(':'), attr = bits[0], key = bits[1];
        var store = 'en' + attr.replace(/(^|-)(\w)/g, function (_, __, c) { return c.toUpperCase(); });
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) || '';
        var ar = dict[key];
        el.setAttribute(attr, lang === 'ar' && ar !== undefined ? ar : el.dataset[store]);
      });
    });
    var btn = $('#langToggle');
    if (btn) { $('#langCode').textContent = t('langLabel'); btn.setAttribute('aria-label', t('langAria')); btn.setAttribute('lang', lang === 'ar' ? 'en' : 'ar'); }
  }
  var onLangChange = [];
  function setLang(next) {
    lang = next;
    var root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyStatic();
    onLangChange.forEach(function (fn) { fn(); });
  }
  try { if (localStorage.getItem(LANG_KEY) === 'ar') { lang = 'ar'; document.documentElement.lang = 'ar'; document.documentElement.dir = 'rtl'; } } catch (e) {}
  applyStatic();

  /* ============================================================
     Packaging illustrations
     ============================================================ */
  var uid = 0;
  var CAP = '#1E2A23';
  var LABEL = '#FBFCF8';

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function labelBlock(p, x, y, w, h, size) {
    var cx = x + w / 2;
    var words = p.name.split(' ');
    var short = words[1] && (words[0] + words[1]).length <= 10 ? words[0] + ' ' + words[1] : words[0];
    var fs = Math.min(15, (w - 10) / (short.length * 0.52));
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + LABEL + '"/>' +
      '<text x="' + cx + '" y="' + (y + h * 0.3) + '" text-anchor="middle" font-family="Fraunces Var, Georgia, serif" font-style="italic" font-size="13" fill="' + CAP + '">fofo</text>' +
      '<line x1="' + (cx - 10) + '" x2="' + (cx + 10) + '" y1="' + (y + h * 0.4) + '" y2="' + (y + h * 0.4) + '" stroke="' + CAP + '" stroke-opacity=".3"/>' +
      '<text x="' + cx + '" y="' + (y + h * 0.6) + '" text-anchor="middle" font-family="Fraunces Var, Georgia, serif" font-size="' + fs.toFixed(1) + '" fill="' + CAP + '">' + esc(short) + '</text>' +
      '<text x="' + cx + '" y="' + (y + h * 0.84) + '" text-anchor="middle" font-family="JetBrains Var, monospace" font-size="6.5" letter-spacing="1" fill="' + CAP + '" fill-opacity=".6">' + esc(size.toUpperCase()) + '</text>';
  }

  function gloss(id, x, y, w, h, rx) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="url(#' + id + 'g)"/>';
  }

  function ringPath(cx, cy, r, bumps, amp, squash) {
    var d = '';
    for (var i = 0; i <= 120; i++) {
      var a = (i / 120) * Math.PI * 2;
      var rr = r + Math.sin(a * bumps) * amp;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr * squash).toFixed(1);
    }
    return d + 'Z';
  }

  function vessel(p) {
    var id = 'v' + (++uid);
    var tint = p.tint;
    var dark = shade(tint, -38);
    var size = p.sizes[0].label;
    var defs = '<defs>' +
      '<linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="' + shade(tint, -22) + '"/><stop offset=".45" stop-color="' + tint + '"/><stop offset="1" stop-color="' + shade(tint, -30) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + 'c" x1="0" x2="1"><stop offset="0" stop-color="#121A15"/><stop offset=".5" stop-color="#3A4A40"/><stop offset="1" stop-color="#121A15"/></linearGradient>' +
      '</defs>';
    var body = '';
    switch (p.vessel) {
      case 'pump':
        body =
          '<path d="M38 16h40a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4Z" fill="url(#' + id + 'c)"/>' +
          '<path d="M34 20H14a4 4 0 0 0 0 6h20Z" fill="url(#' + id + 'c)"/>' +
          '<rect x="55" y="27" width="10" height="24" fill="#2E3A33"/>' +
          '<rect x="42" y="48" width="36" height="24" rx="4" fill="url(#' + id + 'c)"/>' +
          '<rect x="20" y="68" width="80" height="168" rx="20" fill="url(#' + id + 'b)"/>' +
          gloss(id, 28, 78, 14, 140, 7) +
          labelBlock(p, 30, 120, 60, 76, size);
        break;
      case 'tube':
        body =
          '<path d="M14 18h92l-4 10H18Z" fill="' + dark + '"/>' +
          '<path d="M18 28h84c-2 60-8 120-16 172H34C26 148 20 88 18 28Z" fill="url(#' + id + 'b)"/>' +
          gloss(id, 26, 36, 12, 150, 6) +
          '<rect x="32" y="198" width="56" height="38" rx="8" fill="url(#' + id + 'c)"/>' +
          labelBlock(p, 32, 74, 56, 80, size);
        break;
      case 'dropper':
        body =
          '<path d="M60 14c10 0 14 8 14 18v44H46V32c0-10 4-18 14-18Z" fill="url(#' + id + 'c)"/>' +
          '<rect x="40" y="72" width="40" height="26" rx="4" fill="url(#' + id + 'c)"/>' +
          '<path d="M48 98h24v12c14 4 22 12 22 26v86a14 14 0 0 1-14 14H40a14 14 0 0 1-14-14v-86c0-14 8-22 22-26Z" fill="url(#' + id + 'b)" fill-opacity=".95"/>' +
          gloss(id, 32, 132, 10, 94, 5) +
          labelBlock(p, 34, 146, 52, 70, size);
        break;
      case 'spray':
        body =
          '<rect x="44" y="18" width="32" height="38" rx="8" fill="url(#' + id + 'c)"/>' +
          '<circle cx="48" cy="30" r="2.5" fill="#5A6A60"/>' +
          '<rect x="38" y="54" width="44" height="22" rx="4" fill="url(#' + id + 'c)"/>' +
          '<rect x="22" y="74" width="76" height="162" rx="14" fill="url(#' + id + 'b)"/>' +
          gloss(id, 30, 84, 12, 138, 6) +
          labelBlock(p, 32, 122, 56, 78, size);
        break;
      case 'jar':
        body =
          '<rect x="6" y="120" width="108" height="34" rx="10" fill="url(#' + id + 'c)"/>' +
          '<rect x="6" y="148" width="108" height="4" fill="#000" fill-opacity=".25"/>' +
          '<rect x="10" y="150" width="100" height="86" rx="16" fill="url(#' + id + 'b)"/>' +
          gloss(id, 18, 156, 12, 70, 6) +
          labelBlock(p, 28, 162, 64, 64, size);
        break;
      case 'scrunchie':
        body =
          '<path d="' + ringPath(60, 206, 42, 14, 4, 0.32) + '" fill="' + shade(tint, -30) + '"/>' +
          '<path d="' + ringPath(60, 204, 24, 12, 2, 0.28) + '" fill="#000" fill-opacity=".25"/>' +
          '<path d="' + ringPath(60, 176, 38, 13, 4, 0.34) + '" fill="#C9A96E"/>' +
          '<path d="' + ringPath(60, 174, 21, 11, 2, 0.3) + '" fill="#000" fill-opacity=".22"/>' +
          '<path d="' + ringPath(60, 146, 34, 12, 4, 0.36) + '" fill="url(#' + id + 'b)"/>' +
          '<path d="' + ringPath(60, 144, 18, 10, 2, 0.3) + '" fill="#000" fill-opacity=".2"/>' +
          '<path d="M40 138c8-4 22-5 34-2" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>';
        break;
    }
    return '<svg viewBox="0 0 120 240" role="img" aria-label="' + esc(t('packaging', { n: P(p, 'name') })) + '">' + defs + body + '</svg>';
  }

  var STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="m10 1.5 2.6 5.5 6 .8-4.4 4.1 1.1 6L10 15l-5.3 2.9 1.1-6L1.4 7.8l6-.8Z"/></svg>';

  /* ============================================================
     Theme
     ============================================================ */
  (function theme() {
    var root = document.documentElement;
    try {
      var s = localStorage.getItem(THEME_KEY);
      if (s === 'dark' || s === 'light') root.setAttribute('data-theme', s);
    } catch (e) {}
    $('#themeToggle').addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  })();

  /* ============================================================
     Hero — flowing strands + product stage
     ============================================================ */
  (function hero() {
    var stage = $('#heroStage');
    var pick = function (id) { return vessel(byId[id]); };
    function drawStage() {
    stage.innerHTML =
      '<div class="halo"></div><div class="arch"></div>' +
      '<div class="bottle b3 float slow">' + pick('glass-oil') + '</div>' +
      '<div class="bottle b1 float">' + pick('plush-conditioner') + '</div>' +
      '<div class="bottle b2 float slow">' + pick('cloud-wash') + '</div>' +
      '<div class="bottle b4 float">' + pick('bond-mask') + '</div>' +
      '<span class="tag t1 float slow"><i>01</i> ' + esc(t('tag1')) + '</span>' +
      '<span class="tag t2 float"><i>02</i> ' + esc(t('tag2')) + '</span>';
    }
    drawStage();
    onLangChange.push(drawStage);

    var svg = $('#strands');
    var NS = 'http://www.w3.org/2000/svg';
    var N = 34;
    var strands = [];
    var palette = ['var(--honey)', 'var(--accent)', 'var(--plum)', 'var(--honey)'];
    for (var i = 0; i < N; i++) {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('stroke', palette[i % palette.length]);
      path.setAttribute('stroke-width', (0.6 + (i % 5) * 0.35).toFixed(2));
      path.setAttribute('stroke-opacity', (0.12 + ((i * 37) % 10) / 34).toFixed(2));
      svg.appendChild(path);
      strands.push({ el: path, x: 520 + i * 19, amp: 26 + (i % 7) * 7, f: 0.0065 + (i % 4) * 0.0012, ph: i * 0.42, sweep: -0.28 - (i % 3) * 0.05 });
    }
    function draw(t) {
      for (var i = 0; i < strands.length; i++) {
        var s = strands[i], d = '';
        for (var y = -40; y <= 760; y += 20) {
          var x = s.x + s.sweep * y + Math.sin(y * s.f + s.ph + t) * s.amp * (0.4 + y / 900);
          d += (y === -40 ? 'M' : 'L') + x.toFixed(1) + ' ' + y;
        }
        s.el.setAttribute('d', d);
      }
    }
    draw(0);
    if (reduceMotion) return;
    var visible = true, raf = 0, t0 = performance.now();
    function loop(now) { draw((now - t0) / 2600); raf = requestAnimationFrame(loop); }
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(svg);
  })();

  /* ============================================================
     Catalog / filters
     ============================================================ */
  var filters = { type: 'all', kind: 'all', concern: 'all', sort: 'featured' };
  var grid = $('#productGrid');

  function priceFrom(p) { return p.sizes[0].price; }

  function renderGrid() {
    var list = PRODUCTS.filter(function (p) {
      return (filters.type === 'all' || p.types.indexOf(filters.type) > -1) &&
        (filters.kind === 'all' || p.kind === filters.kind) &&
        (filters.concern === 'all' || p.concerns.indexOf(filters.concern) > -1);
    });
    if (filters.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    if (filters.sort === 'price-asc') list.sort(function (a, b) { return priceFrom(a) - priceFrom(b); });
    if (filters.sort === 'price-desc') list.sort(function (a, b) { return priceFrom(b) - priceFrom(a); });

    grid.innerHTML = list.map(function (p, i) {
      var multi = p.sizes.length > 1;
      return '<article class="card enter" style="--d:' + (i * 0.04).toFixed(2) + 's;--tint:' + p.tint + '">' +
        '<div class="media-wrap">' +
          (p.badge ? '<span class="badge' + (p.badge === 'New' ? ' new' : '') + '">' + esc(tr('badges', p.badge)) + '</span>' : '') +
          '<button class="card-media" type="button" data-open="' + p.id + '" aria-label="' + esc(t('view', { n: P(p, 'name') })) + '">' + vessel(p) + '</button>' +
          '<button class="quick-add" type="button" data-add="' + p.id + '" aria-label="' + esc(t('addAria', { n: P(p, 'name'), p: money(priceFrom(p)) })) + '">' + esc(t('add')) + ' · ' + num(money(priceFrom(p))) + '</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-top"><span class="card-kind">' + esc(tr('kinds', p.kind)) + '</span><span class="card-rating">' + STAR + p.rating.toFixed(1) + ' <span class="visually-hidden">' + esc(t('starsFrom')) + '</span>' + num('(' + p.reviews.toLocaleString('en') + ')') + '</span></div>' +
          '<h3><button type="button" data-open="' + p.id + '">' + esc(P(p, 'name')) + '</button></h3>' +
          '<p class="card-tag">' + esc(P(p, 'tagline')) + '</p>' +
          '<p class="card-price">' + (multi ? '<small>' + esc(t('from')) + ' </small>' : '') + num(money(priceFrom(p))) + ' <small>· ' + esc(sizeLabel(p.sizes[0].label)) + '</small></p>' +
        '</div></article>';
    }).join('');

    $('#emptyState').hidden = list.length > 0;
    $('#resultCount').textContent = t('count', list.length) +
      (filters.type !== 'all' ? t('forType', { t: tr('types', filters.type) }) : '');
  }

  $('#typeFilter').addEventListener('click', function (e) {
    var b = e.target.closest('[data-type]');
    if (!b) return;
    $$('[data-type]', this).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    filters.type = b.dataset.type;
    renderGrid();
  });
  $('#typeFilter').addEventListener('keydown', function (e) {
    if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
    var btns = $$('[data-type]', this);
    var i = btns.indexOf(document.activeElement);
    var fwd = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl');
    var n = btns[(i + (fwd ? 1 : -1) + btns.length) % btns.length];
    n.focus(); n.click(); e.preventDefault();
  });
  $('#kindFilter').addEventListener('click', function (e) {
    var b = e.target.closest('[data-kind]');
    if (!b) return;
    $$('[data-kind]', this).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    filters.kind = b.dataset.kind;
    renderGrid();
  });
  $('#concernFilter').addEventListener('change', function () { filters.concern = this.value; renderGrid(); });
  $('#sortBy').addEventListener('change', function () { filters.sort = this.value; renderGrid(); });
  $('#resetFilters').addEventListener('click', function () {
    filters = { type: 'all', kind: 'all', concern: 'all', sort: filters.sort };
    $$('[data-type]').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.type === 'all')); });
    $$('[data-kind]').forEach(function (x) { x.setAttribute('aria-selected', String(x.dataset.kind === 'all')); });
    $('#concernFilter').value = 'all';
    renderGrid();
  });

  /* ============================================================
     Dialog helpers
     ============================================================ */
  function openDialog(d) {
    if (d.open) return;
    $$('dialog[open]').forEach(function (o) { o.close(); });
    d.showModal();
    document.body.classList.add('locked');
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('close', function () {
      if (!$('dialog[open]')) document.body.classList.remove('locked');
    });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-close]')) d.close();
    });
  });

  /* ============================================================
     Product detail
     ============================================================ */
  var pdp = $('#pdp');
  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    var qty = 1;
    $('#pdpBody').innerHTML =
      '<div class="pdp-media" style="--tint:' + p.tint + '">' + vessel(p) + '</div>' +
      '<div class="pdp-info">' +
        '<span class="eyebrow">' + esc(tr('kinds', p.kind)) + '</span>' +
        '<h2 id="pdpTitle">' + esc(P(p, 'name')) + '</h2>' +
        '<p class="pdp-sub">' + esc(P(p, 'tagline')) + '</p>' +
        '<div class="pdp-rating"><span class="stars">' + STAR + STAR + STAR + STAR + STAR + '</span>' + p.rating.toFixed(1) + ' · ' + p.reviews.toLocaleString('en') + ' ' + esc(t('reviews')) + '</div>' +
        '<p class="pdp-desc">' + esc(P(p, 'desc')) + '</p>' +
        '<p class="pdp-hero">' + esc(t('heroActives')) + esc(P(p, 'hero')) + '</p>' +
        '<div class="sizes" role="radiogroup" aria-label="' + esc(t('size')) + '">' + p.sizes.map(function (s, i) {
          return '<label><input type="radio" name="size" value="' + i + '"' + (i ? '' : ' checked') + '><span><b>' + num(money(s.price)) + '</b>' + esc(sizeLabel(s.label)) + '</span></label>';
        }).join('') + '</div>' +
        '<div class="buy-row">' +
          '<div class="stepper" aria-label="' + esc(t('qty')) + '"><button type="button" data-q="-1" aria-label="' + esc(t('decQty')) + '">−</button><output id="pdpQty">1</output><button type="button" data-q="1" aria-label="' + esc(t('incQty')) + '">+</button></div>' +
          '<button class="btn btn-solid" type="button" id="pdpAdd">' + esc(t('add')) + ' · <span id="pdpPrice" class="num">' + money(p.sizes[0].price) + '</span></button>' +
        '</div>' +
        '<div class="pdp-perks"><span>' + esc(t('perkShip')) + '</span><span>' + esc(t('perkGuarantee')) + '</span><span>' + esc(t('perkVegan')) + '</span></div>' +
        '<div>' +
          '<details open><summary>' + esc(t('madeFor')) + '</summary><div class="chips" style="padding-bottom:1rem">' +
            p.types.map(function (x) { return '<span>' + esc(tr('types', x)) + '</span>'; }).join('') +
            p.concerns.map(function (c) { return '<span>' + esc(tr('concerns', c)) + '</span>'; }).join('') +
          '</div></details>' +
          '<details><summary>' + esc(t('howto')) + '</summary><p>' + esc(P(p, 'howto')) + '</p></details>' +
          '<details><summary>' + esc(t('keyIng')) + '</summary><ul>' + P(p, 'ingredients').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>' +
        '</div>' +
      '</div>';

    var body = $('#pdpBody');
    var sizeIdx = function () { return +$('input[name="size"]:checked', body).value; };
    var update = function () {
      $('#pdpQty').textContent = qty;
      $('#pdpPrice').textContent = money(p.sizes[sizeIdx()].price * qty);
    };
    body.addEventListener('change', update);
    $$('[data-q]', body).forEach(function (b) {
      b.addEventListener('click', function () { qty = Math.max(1, Math.min(9, qty + +b.dataset.q)); update(); });
    });
    $('#pdpAdd').addEventListener('click', function () {
      addItem(p.id, sizeIdx(), qty);
      pdp.close();
      openCart();
    });
    openDialog(pdp);
    pdp.scrollTop = 0;
  }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { openProduct(o.dataset.open); return; }
    var a = e.target.closest('[data-add]');
    if (a) { addItem(a.dataset.add, 0, 1); return; }
    var s = e.target.closest('[data-add-set]');
    if (s) { addBundle(s.dataset.addSet); }
  });

  /* ============================================================
     Cart
     ============================================================ */
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
  cart = cart.filter(function (l) {
    return l && l.qty > 0 && (l.bundle ? BUNDLES.some(function (b) { return b.id === l.bundle; }) : byId[l.id] && byId[l.id].sizes[l.size]);
  });

  function bundleById(id) { for (var i = 0; i < BUNDLES.length; i++) if (BUNDLES[i].id === id) return BUNDLES[i]; }
  function bundleFull(b) { return b.items.reduce(function (s, id) { return s + byId[id].sizes[0].price; }, 0); }
  function bundlePrice(b) { return Math.round(bundleFull(b) * (1 - b.save)); }
  function linePrice(l) { return l.bundle ? bundlePrice(bundleById(l.bundle)) : byId[l.id].sizes[l.size].price; }

  function save() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }

  function addItem(id, size, qty) {
    var key = id + ':' + size;
    var l = cart.filter(function (x) { return x.key === key; })[0];
    if (l) l.qty = Math.min(9, l.qty + qty);
    else cart.push({ key: key, id: id, size: size, qty: qty });
    save(); renderCart(true);
    toast(t('added', { n: P(byId[id], 'name') }));
  }
  function addBundle(id) {
    var key = 'set:' + id;
    var l = cart.filter(function (x) { return x.key === key; })[0];
    if (l) l.qty = Math.min(9, l.qty + 1);
    else cart.push({ key: key, bundle: id, qty: 1 });
    save(); renderCart(true);
    openCart();
  }

  function totals() {
    var sub = 0, savings = 0, count = 0;
    cart.forEach(function (l) {
      count += l.qty;
      sub += linePrice(l) * l.qty;
      if (l.bundle) { var b = bundleById(l.bundle); savings += (bundleFull(b) - bundlePrice(b)) * l.qty; }
    });
    var ship = sub === 0 || sub >= FREE_SHIP ? 0 : SHIP_COST;
    return { sub: sub, savings: savings, count: count, ship: ship, total: sub + ship };
  }

  function renderCart(bump) {
    var tot = totals();
    var badge = $('#bagCount');
    badge.textContent = tot.count;
    $('#cartOpen').setAttribute('aria-label', t('openBag', { n: t('items', tot.count) }));
    if (bump) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
    if (!$('#cartLines')) return;

    var empty = cart.length === 0;
    $('#cartEmpty').hidden = !empty;
    $('#cartLines').hidden = empty;
    $('#cartFoot').hidden = empty;
    $('#shipMeter').hidden = empty;
    var left = FREE_SHIP - tot.sub;
    $('#shipText').innerHTML = left > 0 ? t('shipLeft', { m: num(money(left)) }) : t('shipDone');
    $('#shipBar').style.width = Math.min(100, (tot.sub / FREE_SHIP) * 100) + '%';

    $('#cartLines').innerHTML = cart.map(function (l) {
      var thumb, name, meta, full = '';
      if (l.bundle) {
        var b = bundleById(l.bundle);
        thumb = '<div class="line-thumb multi">' + b.items.slice(0, 3).map(function (id) { return vessel(byId[id]); }).join('') + '</div>';
        name = B(b, 'name'); meta = t('setMeta', { n: b.items.length });
        full = '<s class="num">' + money(bundleFull(b) * l.qty) + '</s>';
      } else {
        var p = byId[l.id];
        thumb = '<div class="line-thumb">' + vessel(p) + '</div>';
        name = P(p, 'name'); meta = sizeLabel(p.sizes[l.size].label) + ' · ' + tr('kinds', p.kind);
      }
      return '<li class="line">' + thumb +
        '<div><h3>' + esc(name) + '</h3><small>' + esc(meta) + '</small>' +
          '<div class="stepper" aria-label="' + esc(t('qtyFor', { n: name })) + '"><button type="button" data-line="' + l.key + '" data-d="-1" aria-label="' + esc(t('dec')) + '">−</button><output>' + l.qty + '</output><button type="button" data-line="' + l.key + '" data-d="1" aria-label="' + esc(t('inc')) + '">+</button></div>' +
        '</div>' +
        '<div class="line-right">' + num(money(linePrice(l) * l.qty)) + full + '<button class="remove" type="button" data-remove="' + l.key + '">' + esc(t('remove')) + '</button></div>' +
      '</li>';
    }).join('');

    $('#cartSubtotal').innerHTML = num(money(tot.sub));
    $('#cartSavings').innerHTML = num('−' + money(tot.savings));
    $('#cartSavings').parentNode.hidden = tot.savings === 0;
    $('#cartShipping').innerHTML = tot.ship ? num(money(tot.ship)) : esc(t('free'));
    $('#cartTotal').textContent = money(tot.total);

    // upsell: highest-rated product not already in the bag
    var inBag = {};
    cart.forEach(function (l) {
      if (l.bundle) bundleById(l.bundle).items.forEach(function (id) { inBag[id] = 1; });
      else inBag[l.id] = 1;
    });
    var rec = PRODUCTS.filter(function (p) { return !inBag[p.id]; })
      .sort(function (a, b) { return b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews); })[0];
    $('#upsell').innerHTML = !empty && rec
      ? '<p>' + esc(t('pairs')) + '</p><div class="upsell-item"><div class="line-thumb">' + vessel(rec) + '</div><div><b>' + esc(P(rec, 'name')) + '</b><br><small>' + esc(P(rec, 'tagline')) + '</small></div><button class="btn btn-ghost" type="button" data-add="' + rec.id + '" aria-label="' + esc(t('addAria', { n: P(rec, 'name'), p: money(priceFrom(rec)) })) + '">+ ' + num(money(priceFrom(rec))) + '</button></div>'
      : '';
  }

  $('#cart').addEventListener('click', function (e) {
    var d = e.target.closest('[data-line]');
    var r = e.target.closest('[data-remove]');
    var key = d ? d.dataset.line : r ? r.dataset.remove : null;
    if (!key) return;
    cart = cart.map(function (l) {
      if (l.key !== key) return l;
      return Object.assign({}, l, { qty: r ? 0 : Math.min(9, l.qty + +d.dataset.d) });
    }).filter(function (l) { return l.qty > 0; });
    save(); renderCart();
  });

  var cartDlg = $('#cart');
  var drawerInner = $('.drawer-inner', cartDlg);
  var drawerMarkup = drawerInner.innerHTML;
  function openCart() {
    renderCart();
    openDialog(cartDlg);
  }
  $('#cartOpen').addEventListener('click', openCart);

  cartDlg.addEventListener('click', function (e) {
    if (!e.target.closest('#checkoutBtn')) return;
    var tot = totals();
    drawerInner.innerHTML =
      '<div class="drawer-head"><h2>' + esc(t('almost')) + '</h2><button class="dialog-close static" type="button" data-close aria-label="' + esc(t('close')) + '">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="checkout-done"><div class="seal"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg></div>' +
      '<h3>' + esc(t('items', tot.count)) + ' · ' + num(money(tot.total)) + '</h3>' +
      '<p>' + esc(t('demoCheckout')) + '</p>' +
      '<button class="btn btn-ghost" type="button" id="backToBag">' + esc(t('backToBag')) + '</button></div>';
  });
  cartDlg.addEventListener('click', function (e) {
    if (e.target.closest('#backToBag')) { drawerInner.innerHTML = drawerMarkup; applyStatic(); renderCart(); }
  });
  cartDlg.addEventListener('close', function () {
    if (!$('#cartLines', drawerInner)) { drawerInner.innerHTML = drawerMarkup; applyStatic(); renderCart(); }
  });

  /* ============================================================
     Sets
     ============================================================ */
  function renderSets() {
  $('#setsGrid').innerHTML = BUNDLES.map(function (b) {
    var heights = [128, 150, 112, 138];
    return '<article class="set inview">' +
      '<div class="set-shelf">' + b.items.map(function (id, i) { return vessel(byId[id]).replace('<svg ', '<svg style="--h:' + heights[i % 4] + 'px" '); }).join('') + '</div>' +
      '<span class="set-note">' + esc(B(b, 'note')) + '</span>' +
      '<h3>' + esc(B(b, 'name')) + '</h3>' +
      '<ul>' + b.items.map(function (id) { var p = byId[id]; return '<li><span>' + esc(P(p, 'name')) + '</span><span>' + esc(sizeLabel(p.sizes[0].label)) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="set-foot"><span class="set-price"><b class="num">' + money(bundlePrice(b)) + '</b><s class="num">' + money(bundleFull(b)) + '</s></span>' +
      '<button class="btn btn-solid" type="button" data-add-set="' + b.id + '">' + esc(t('addSet')) + '</button></div>' +
    '</article>';
  }).join('');
  }
  renderSets();

  /* ============================================================
     Routine finder
     ============================================================ */
  (function finder() {
    var form = $('#finderForm');
    var steps = $$('.q', form);
    var next = $('#finderNext');
    var back = $('#finderBack');
    var result = $('#finderResult');
    var dots = $$('#finderProgress li');
    var step = 0;

    function answered() { return !!$('input:checked', steps[step]); }
    function show() {
      steps.forEach(function (s, i) { s.classList.toggle('on', i === step); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i <= step); });
      back.hidden = step === 0;
      next.textContent = step === steps.length - 1 ? t('seeRoutine') : t('next');
      next.disabled = !answered();
      next.hidden = false;
      result.hidden = true;
    }
    form.addEventListener('change', function () {
      next.disabled = !answered();
      if (!reduceMotion && step < steps.length - 1) setTimeout(function () { if (answered()) go(1); }, 260);
    });
    function go(dir) {
      if (dir > 0 && !answered()) return;
      if (dir > 0 && step === steps.length - 1) return finish();
      step = Math.max(0, Math.min(steps.length - 1, step + dir));
      show();
      var first = $('input', steps[step]);
      if (first && dir !== 0) (($('input:checked', steps[step])) || first).focus({ preventScroll: true });
    }
    next.addEventListener('click', function () { go(1); });
    back.addEventListener('click', function () {
      if (!result.hidden) { result.hidden = true; show(); return; }
      go(-1);
    });

    function recommend(type, concern, stress) {
      var fine = type === 'straight' || type === 'wavy';
      var r = [];
      r.push(concern === 'scalp' && fine ? 'clarify-rinse' : 'cloud-wash');
      r.push(fine && (concern === 'volume' || concern === 'scalp' || type === 'straight') ? 'featherlight-conditioner' : 'plush-conditioner');
      if (concern === 'scalp' || concern === 'thinning') r.push('scalp-serum');
      else if (concern === 'breakage' || stress === 'high') r.push('bond-mask');
      else r.push('milk-leave-in');
      if (type === 'curly' || type === 'coily') r.push('curl-cream');
      else if (concern === 'volume') r.push('wave-mist');
      if (stress !== 'low') r.push('heat-veil');
      else if (concern === 'frizz' || concern === 'dryness' || type === 'coily') r.push('glass-oil');
      return r.filter(function (id, i) { return r.indexOf(id) === i; });
    }

    function finish(quiet) {
      var v = function (n) { return $('input[name="' + n + '"]:checked', form).value; };
      var type = v('type'), concern = v('concern'), stress = v('stress');
      var ids = recommend(type, concern, stress);
      var total = ids.reduce(function (s, id) { return s + priceFrom(byId[id]); }, 0);
      steps.forEach(function (s) { s.classList.remove('on'); });
      dots.forEach(function (d) { d.classList.add('on'); });
      result.hidden = false;
      next.hidden = true;
      back.hidden = true;
      var typeName = lang === 'ar' ? tr('types', type) : type;
      result.innerHTML =
        '<h3>' + esc(t('routineTitle', { t: typeName })) + '</h3>' +
        '<p>' + esc(t('builtAround', { x: (I18N.ui[lang].focus || I18N.ui.en.focus)[concern] }) +
          t(stress === 'high' ? 'stressHigh' : stress === 'mid' ? 'stressMid' : 'stressLow')) + '</p>' +
        '<ol class="routine">' + ids.map(function (id) {
          var p = byId[id];
          return '<li><span class="mini">' + vessel(p) + '</span><span><b>' + esc(P(p, 'name')) + '</b><small>' + esc(P(p, 'tagline')) + '</small></span><span class="p">' + num(money(priceFrom(p))) + '</span></li>';
        }).join('') + '</ol>' +
        '<div class="actions"><button class="btn btn-light" type="button" id="addRoutine">' + t('addAll', { n: ids.length, m: num(money(total)) }) + '</button>' +
        '<button class="btn btn-ghost-light" type="button" id="finderRestart">' + esc(t('startOver')) + '</button></div>';
      $('#addRoutine').addEventListener('click', function () {
        ids.forEach(function (id) {
          var key = id + ':0';
          var l = cart.filter(function (x) { return x.key === key; })[0];
          if (l) l.qty = Math.min(9, l.qty + 1); else cart.push({ key: key, id: id, size: 0, qty: 1 });
        });
        save(); renderCart(true); openCart();
      });
      $('#finderRestart').addEventListener('click', function () { form.reset(); step = 0; show(); });
      if (!quiet) $('#addRoutine').focus({ preventScroll: true });
    }
    show();
    onLangChange.push(function () {
      if (!result.hidden) finish(true);
      else show();
    });
  })();

  /* ============================================================
     Search
     ============================================================ */
  (function search() {
    var dlg = $('#search');
    var input = $('#searchInput');
    var out = $('#searchResults');
    // Search matches English and Arabic text, whichever language is showing.
    function hay(p) {
      var ar = I18N.products[p.id] || {};
      return [p.name, p.kind, p.tagline, p.hero, p.types.join(' '), p.concerns.join(' '), p.ingredients.join(' '),
        ar.name, ar.tagline, ar.hero, (ar.ingredients || []).join(' '),
        I18N.ui.ar.kinds[p.kind], p.types.map(function (x) { return I18N.ui.ar.types[x]; }).join(' '),
        p.concerns.map(function (x) { return I18N.ui.ar.concerns[x]; }).join(' ')].join(' ').toLowerCase();
    }
    function hl(text, q) {
      if (!q) return esc(text);
      var i = text.toLowerCase().indexOf(q);
      if (i < 0) return esc(text);
      return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
    }
    function run() {
      var q = input.value.trim().toLowerCase();
      var terms = q.split(/\s+/).filter(Boolean);
      var list = PRODUCTS.filter(function (p) { var h = hay(p); return terms.every(function (t) { return h.indexOf(t) > -1; }); });
      out.innerHTML = list.length ? list.map(function (p) {
        return '<li><button type="button" data-open="' + p.id + '"><span class="line-thumb">' + vessel(p) + '</span><span><b>' + hl(P(p, 'name'), terms[0]) + '</b><small>' + esc(P(p, 'tagline')) + '</small></span>' + num(money(priceFrom(p))) + '</button></li>';
      }).join('') : '<li class="none">' + esc(t('noMatch', { q: input.value })) + '</li>';
    }
    input.addEventListener('input', run);
    function open() { input.value = ''; run(); openDialog(dlg); input.focus(); }
    $('#searchOpen').addEventListener('click', open);
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$('dialog[open]')) { e.preventDefault(); open(); }
    });
  })();

  /* ============================================================
     Misc: toast, newsletter, header, stars, scroll reveals
     ============================================================ */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  $('#letterForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = $('#letterEmail');
    var msg = $('#letterMsg');
    if (!input.checkValidity()) { msg.textContent = t('emailBad'); input.focus(); return; }
    msg.textContent = t('emailOk');
    input.value = '';
  });

  $$('.quote .stars').forEach(function (s) { s.innerHTML = STAR + STAR + STAR + STAR + STAR; });

  var header = $('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $$('.quote').forEach(function (q, i) { q.classList.add('inview'); q.style.setProperty('--d', (i * 0.08) + 's'); });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('seen'); io.unobserve(en.target); } });
  }, { threshold: 0.2 }) : null;
  $$('.inview, #bench').forEach(function (el) { io ? io.observe(el) : el.classList.add('seen'); });

  onLangChange.push(renderGrid, function () { renderCart(); }, renderSets, function () {
    $$('.quote .stars').forEach(function (s) { s.innerHTML = STAR + STAR + STAR + STAR + STAR; });
  });
  $('#langToggle').addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar'); });

  renderGrid();
  renderCart();
})();
