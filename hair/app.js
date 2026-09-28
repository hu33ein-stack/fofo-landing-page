(function () {
  'use strict';

  var PRODUCTS = window.FOFO_PRODUCTS || [];
  var BUNDLES = window.FOFO_BUNDLES || [];
  var FREE_SHIP = 50;
  var SHIP_COST = 6;
  var CART_KEY = 'fofo-hair-cart';
  var THEME_KEY = 'fofo-theme';

  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     Packaging illustrations
     ============================================================ */
  var uid = 0;
  var CAP = '#2B1E18';
  var LABEL = '#FFFBF6';

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
    var t = p.tint;
    var dark = shade(t, -38);
    var size = p.sizes[0].label;
    var defs = '<defs>' +
      '<linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="' + shade(t, -22) + '"/><stop offset=".45" stop-color="' + t + '"/><stop offset="1" stop-color="' + shade(t, -30) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + id + 'c" x1="0" x2="1"><stop offset="0" stop-color="#1A110D"/><stop offset=".5" stop-color="#4A362B"/><stop offset="1" stop-color="#1A110D"/></linearGradient>' +
      '</defs>';
    var body = '';
    switch (p.vessel) {
      case 'pump':
        body =
          '<path d="M38 16h40a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H38a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4Z" fill="url(#' + id + 'c)"/>' +
          '<path d="M34 20H14a4 4 0 0 0 0 6h20Z" fill="url(#' + id + 'c)"/>' +
          '<rect x="55" y="27" width="10" height="24" fill="#3A2A21"/>' +
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
          '<circle cx="48" cy="30" r="2.5" fill="#6E5446"/>' +
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
          '<path d="' + ringPath(60, 206, 42, 14, 4, 0.32) + '" fill="' + shade(t, -30) + '"/>' +
          '<path d="' + ringPath(60, 204, 24, 12, 2, 0.28) + '" fill="#000" fill-opacity=".25"/>' +
          '<path d="' + ringPath(60, 176, 38, 13, 4, 0.34) + '" fill="#E3B27F"/>' +
          '<path d="' + ringPath(60, 174, 21, 11, 2, 0.3) + '" fill="#000" fill-opacity=".22"/>' +
          '<path d="' + ringPath(60, 146, 34, 12, 4, 0.36) + '" fill="url(#' + id + 'b)"/>' +
          '<path d="' + ringPath(60, 144, 18, 10, 2, 0.3) + '" fill="#000" fill-opacity=".2"/>' +
          '<path d="M40 138c8-4 22-5 34-2" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>';
        break;
    }
    return '<svg viewBox="0 0 120 240" role="img" aria-label="' + esc(p.name) + ' packaging">' + defs + body + '</svg>';
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
    stage.innerHTML =
      '<div class="halo"></div><div class="arch"></div>' +
      '<div class="bottle b3 float slow">' + pick('glass-oil') + '</div>' +
      '<div class="bottle b1 float">' + pick('plush-conditioner') + '</div>' +
      '<div class="bottle b2 float slow">' + pick('cloud-wash') + '</div>' +
      '<div class="bottle b4 float">' + pick('bond-mask') + '</div>' +
      '<span class="tag t1 float slow"><i>01</i> slip you can feel</span>' +
      '<span class="tag t2 float"><i>02</i> 48h frizz shield</span>';

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
          (p.badge ? '<span class="badge' + (p.badge === 'New' ? ' new' : '') + '">' + esc(p.badge) + '</span>' : '') +
          '<button class="card-media" type="button" data-open="' + p.id + '" aria-label="View ' + esc(p.name) + '">' + vessel(p) + '</button>' +
          '<button class="quick-add" type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to bag, ' + money(priceFrom(p)) + '">Add to bag · ' + money(priceFrom(p)) + '</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-top"><span class="card-kind">' + p.kind + '</span><span class="card-rating">' + STAR + p.rating.toFixed(1) + ' <span class="visually-hidden">stars from</span>(' + p.reviews.toLocaleString() + ')</span></div>' +
          '<h3><button type="button" data-open="' + p.id + '">' + esc(p.name) + '</button></h3>' +
          '<p class="card-tag">' + esc(p.tagline) + '</p>' +
          '<p class="card-price">' + (multi ? '<small>from </small>' : '') + money(priceFrom(p)) + ' <small>· ' + p.sizes[0].label + '</small></p>' +
        '</div></article>';
    }).join('');

    $('#emptyState').hidden = list.length > 0;
    $('#resultCount').textContent = list.length + (list.length === 1 ? ' formula' : ' formulas') +
      (filters.type !== 'all' ? ' for ' + filters.type + ' hair' : '');
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
    var n = btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
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
        '<span class="eyebrow">' + p.kind + '</span>' +
        '<h2 id="pdpTitle">' + esc(p.name) + '</h2>' +
        '<p class="pdp-sub">' + esc(p.tagline) + '</p>' +
        '<div class="pdp-rating"><span class="stars">' + STAR + STAR + STAR + STAR + STAR + '</span>' + p.rating.toFixed(1) + ' · ' + p.reviews.toLocaleString() + ' reviews</div>' +
        '<p class="pdp-desc">' + esc(p.desc) + '</p>' +
        '<p class="pdp-hero">Hero actives — ' + esc(p.hero) + '</p>' +
        '<div class="sizes" role="radiogroup" aria-label="Size">' + p.sizes.map(function (s, i) {
          return '<label><input type="radio" name="size" value="' + i + '"' + (i ? '' : ' checked') + '><span><b>' + money(s.price) + '</b>' + s.label + '</span></label>';
        }).join('') + '</div>' +
        '<div class="buy-row">' +
          '<div class="stepper" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease quantity">−</button><output id="pdpQty">1</output><button type="button" data-q="1" aria-label="Increase quantity">+</button></div>' +
          '<button class="btn btn-solid" type="button" id="pdpAdd">Add to bag · <span id="pdpPrice">' + money(p.sizes[0].price) + '</span></button>' +
        '</div>' +
        '<div class="pdp-perks"><span>Free shipping over $' + FREE_SHIP + '</span><span>90-day guarantee</span><span>Vegan & cruelty-free</span></div>' +
        '<div>' +
          '<details open><summary>Made for</summary><div class="chips" style="padding-bottom:1rem">' +
            p.types.map(function (t) { return '<span>' + t + '</span>'; }).join('') +
            p.concerns.map(function (c) { return '<span>' + c + '</span>'; }).join('') +
          '</div></details>' +
          '<details><summary>How to use</summary><p>' + esc(p.howto) + '</p></details>' +
          '<details><summary>Key ingredients</summary><ul>' + p.ingredients.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details>' +
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
    toast(byId[id].name + ' added to your bag');
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
    var t = totals();
    var badge = $('#bagCount');
    badge.textContent = t.count;
    $('#cartOpen').setAttribute('aria-label', 'Open bag, ' + t.count + (t.count === 1 ? ' item' : ' items'));
    if (bump) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
    if (!$('#cartLines')) return;

    var empty = cart.length === 0;
    $('#cartEmpty').hidden = !empty;
    $('#cartLines').hidden = empty;
    $('#cartFoot').hidden = empty;
    $('#shipMeter').hidden = empty;
    var left = FREE_SHIP - t.sub;
    $('#shipText').innerHTML = left > 0
      ? 'You’re <b>' + money(left) + '</b> away from free shipping.'
      : 'You’ve unlocked <b>free carbon-neutral shipping</b>.';
    $('#shipBar').style.width = Math.min(100, (t.sub / FREE_SHIP) * 100) + '%';

    $('#cartLines').innerHTML = cart.map(function (l) {
      var thumb, name, meta, full = '';
      if (l.bundle) {
        var b = bundleById(l.bundle);
        thumb = '<div class="line-thumb multi">' + b.items.slice(0, 3).map(function (id) { return vessel(byId[id]); }).join('') + '</div>';
        name = b.name; meta = b.items.length + ' full-size products · save 20%';
        full = '<s>' + money(bundleFull(b) * l.qty) + '</s>';
      } else {
        var p = byId[l.id];
        thumb = '<div class="line-thumb">' + vessel(p) + '</div>';
        name = p.name; meta = p.sizes[l.size].label + ' · ' + p.kind;
      }
      return '<li class="line">' + thumb +
        '<div><h3>' + esc(name) + '</h3><small>' + esc(meta) + '</small>' +
          '<div class="stepper" aria-label="Quantity for ' + esc(name) + '"><button type="button" data-line="' + l.key + '" data-d="-1" aria-label="Decrease">−</button><output>' + l.qty + '</output><button type="button" data-line="' + l.key + '" data-d="1" aria-label="Increase">+</button></div>' +
        '</div>' +
        '<div class="line-right">' + money(linePrice(l) * l.qty) + full + '<button class="remove" type="button" data-remove="' + l.key + '">Remove</button></div>' +
      '</li>';
    }).join('');

    $('#cartSubtotal').textContent = money(t.sub);
    $('#cartSavings').textContent = '−' + money(t.savings);
    $('#cartSavings').parentNode.hidden = t.savings === 0;
    $('#cartShipping').textContent = t.ship ? money(t.ship) : 'Free';
    $('#cartTotal').textContent = money(t.total);

    // upsell: highest-rated product not already in the bag
    var inBag = {};
    cart.forEach(function (l) {
      if (l.bundle) bundleById(l.bundle).items.forEach(function (id) { inBag[id] = 1; });
      else inBag[l.id] = 1;
    });
    var rec = PRODUCTS.filter(function (p) { return !inBag[p.id]; })
      .sort(function (a, b) { return b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews); })[0];
    $('#upsell').innerHTML = !empty && rec
      ? '<p>Pairs beautifully</p><div class="upsell-item"><div class="line-thumb">' + vessel(rec) + '</div><div><b>' + esc(rec.name) + '</b><br><small>' + esc(rec.tagline) + '</small></div><button class="btn btn-ghost" type="button" data-add="' + rec.id + '">+ ' + money(priceFrom(rec)) + '</button></div>'
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
    var t = totals();
    drawerInner.innerHTML =
      '<div class="drawer-head"><h2>Almost there</h2><button class="dialog-close static" type="button" data-close aria-label="Close">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="checkout-done"><div class="seal"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg></div>' +
      '<h3>' + t.count + (t.count === 1 ? ' item' : ' items') + ' · ' + money(t.total) + '</h3>' +
      '<p>This storefront is a demo, so no payment is taken here. Connect Shopify or Stripe Checkout to the button to go live.</p>' +
      '<button class="btn btn-ghost" type="button" id="backToBag">Back to bag</button></div>';
  });
  cartDlg.addEventListener('click', function (e) {
    if (e.target.closest('#backToBag')) { drawerInner.innerHTML = drawerMarkup; renderCart(); }
  });
  cartDlg.addEventListener('close', function () {
    if (!$('#cartLines', drawerInner)) { drawerInner.innerHTML = drawerMarkup; renderCart(); }
  });

  /* ============================================================
     Sets
     ============================================================ */
  $('#setsGrid').innerHTML = BUNDLES.map(function (b) {
    var heights = [128, 150, 112, 138];
    return '<article class="set inview">' +
      '<div class="set-shelf">' + b.items.map(function (id, i) { return vessel(byId[id]).replace('<svg ', '<svg style="--h:' + heights[i % 4] + 'px" '); }).join('') + '</div>' +
      '<span class="set-note">' + esc(b.note) + '</span>' +
      '<h3>' + esc(b.name) + '</h3>' +
      '<ul>' + b.items.map(function (id) { var p = byId[id]; return '<li><span>' + esc(p.name) + '</span><span>' + p.sizes[0].label + '</span></li>'; }).join('') + '</ul>' +
      '<div class="set-foot"><span class="set-price"><b>' + money(bundlePrice(b)) + '</b><s>' + money(bundleFull(b)) + '</s></span>' +
      '<button class="btn btn-solid" type="button" data-add-set="' + b.id + '">Add set</button></div>' +
    '</article>';
  }).join('');

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
      next.textContent = step === steps.length - 1 ? 'See my routine' : 'Next';
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

    function finish() {
      var v = function (n) { return $('input[name="' + n + '"]:checked', form).value; };
      var type = v('type'), concern = v('concern'), stress = v('stress');
      var ids = recommend(type, concern, stress);
      var total = ids.reduce(function (s, id) { return s + priceFrom(byId[id]); }, 0);
      steps.forEach(function (s) { s.classList.remove('on'); });
      dots.forEach(function (d) { d.classList.add('on'); });
      result.hidden = false;
      next.hidden = true;
      back.hidden = true;
      result.innerHTML =
        '<h3>Your ' + type + '-hair routine</h3>' +
        '<p>Built around ' + ({ dryness: 'lasting moisture', frizz: 'frizz control', breakage: 'strength and repair', volume: 'root lift and body', scalp: 'a calm, balanced scalp', thinning: 'density and scalp health' })[concern] +
          (stress === 'high' ? ', with bond repair for colour and heat.' : stress === 'mid' ? ', with heat protection for styling days.' : '.') + '</p>' +
        '<ol class="routine">' + ids.map(function (id) {
          var p = byId[id];
          return '<li><span class="mini">' + vessel(p) + '</span><span><b>' + esc(p.name) + '</b><small>' + esc(p.tagline) + '</small></span><span class="p">' + money(priceFrom(p)) + '</span></li>';
        }).join('') + '</ol>' +
        '<div class="actions"><button class="btn btn-light" type="button" id="addRoutine">Add all ' + ids.length + ' · ' + money(total) + '</button>' +
        '<button class="btn btn-ghost-light" type="button" id="finderRestart">Start over</button></div>';
      $('#addRoutine').addEventListener('click', function () {
        ids.forEach(function (id) {
          var key = id + ':0';
          var l = cart.filter(function (x) { return x.key === key; })[0];
          if (l) l.qty = Math.min(9, l.qty + 1); else cart.push({ key: key, id: id, size: 0, qty: 1 });
        });
        save(); renderCart(true); openCart();
      });
      $('#finderRestart').addEventListener('click', function () { form.reset(); step = 0; show(); });
      $('#addRoutine').focus({ preventScroll: true });
    }
    show();
  })();

  /* ============================================================
     Search
     ============================================================ */
  (function search() {
    var dlg = $('#search');
    var input = $('#searchInput');
    var out = $('#searchResults');
    function hay(p) { return [p.name, p.kind, p.tagline, p.hero, p.types.join(' '), p.concerns.join(' '), p.ingredients.join(' ')].join(' ').toLowerCase(); }
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
        return '<li><button type="button" data-open="' + p.id + '"><span class="line-thumb">' + vessel(p) + '</span><span><b>' + hl(p.name, terms[0]) + '</b><small>' + esc(p.tagline) + '</small></span><span>' + money(priceFrom(p)) + '</span></button></li>';
      }).join('') : '<li class="none">No matches for “' + esc(input.value) + '”. Try “frizz”, “oil” or “curls”.</li>';
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
    if (!input.checkValidity()) { msg.textContent = 'That email doesn’t look quite right.'; input.focus(); return; }
    msg.textContent = 'You’re in. Check your inbox for 15% off.';
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

  renderGrid();
  renderCart();
})();
