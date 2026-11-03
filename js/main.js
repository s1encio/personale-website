(function(){
  "use strict";

  var topZ = 20;
  var offsets = {uber:0, projekte:1, werdegang:2, mine:3};
  var taskItems = document.getElementById('task-items');
  var chips = {};

  function winEl(id){ return document.getElementById('win-' + id); }

  function clampToViewport(el){
    var maxL = Math.max(4, window.innerWidth - el.offsetWidth - 4);
    var maxT = Math.max(4, window.innerHeight - el.offsetHeight - 56);
    var l = parseFloat(el.style.left)||0, t = parseFloat(el.style.top)||0;
    el.style.left = Math.min(Math.max(4,l), maxL) + 'px';
    el.style.top = Math.min(Math.max(4,t), maxT) + 'px';
  }

  function setActiveWin(el){
    document.querySelectorAll('.win').forEach(function(w){ w.classList.toggle('active', w === el); });
  }
  function focusWin(el){
    topZ++; el.style.zIndex = topZ;
    setActiveWin(el);
    Object.keys(chips).forEach(function(k){ chips[k].classList.toggle('active', ('win-'+k)===el.id); });
    if (phoneChip) phoneChip.classList.remove('active');
  }

  function openWin(id){
    var el = winEl(id);
    if (!el) return;
    if (!el.classList.contains('open')){
      var n = offsets[id]++ % 5;
      el.style.left = (110 + n*26) + 'px';
      el.style.top = (44 + n*22) + 'px';
      el.classList.add('open');
      clampToViewport(el);
      addChip(id, el);
    }
    focusWin(el);
    document.getElementById('start-menu').classList.remove('open');
  }
  function closeWin(id){
    var el = winEl(id);
    if (el) el.classList.remove('open');
    if (chips[id]){ chips[id].remove(); delete chips[id]; }
  }
  function addChip(id, el){
    if (chips[id]) return;
    var label = el.querySelector('.xt-label').textContent;
    var b = document.createElement('button');
    b.className = 'task-btn';
    b.textContent = label;
    b.addEventListener('click', function(){ focusWin(el); });
    taskItems.appendChild(b);
    chips[id] = b;
  }

  document.querySelectorAll('[data-win]').forEach(function(node){
    node.addEventListener('click', function(){ openWin(node.getAttribute('data-win')); });
  });
  /* ---------- EXPLORER FRAME: menu bar, toolbar, address bar, task pane and status bar ---------- */
  var EXPLORER_PLACES = [['uber', 'Persönliche Daten'], ['projekte', 'Projekte'], ['werdegang', 'Lebensgang']];
  function mk(tag, cls, text){
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function explorerPanel(title, fill){
    var p = mk('div', 'xp-panel'), h = mk('div', 'xp-panel-h'), b = mk('div', 'xp-panel-b');
    h.appendChild(mk('span', null, title));
    h.addEventListener('click', function(){ p.classList.toggle('collapsed'); });
    fill(b);
    p.appendChild(h); p.appendChild(b);
    return p;
  }
  function explorerLink(label, iconCls, onClick){
    var a = mk('a'); a.href = '#';
    a.appendChild(mk('i', iconCls || 'dot'));
    a.appendChild(document.createTextNode(label));
    a.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); onClick(); });
    return a;
  }
  function decorateExplorer(win, cfg){
    var body = win.querySelector('.win-body');
    if (!body || win.querySelector('.xp-explorer')) return;
    var ownId = win.id.replace('win-', '');
    win.classList.add('is-explorer');

    var menu = mk('div', 'xp-menubar');
    ['Datei', 'Bearbeiten', 'Ansicht', 'Favoriten', 'Extras', '?'].forEach(function(t){ menu.appendChild(mk('span', null, t)); });

    var wrap = mk('div', 'xp-explorer');
    var tools = mk('div', 'xp-toolbar');
    function tb(iconCls, label, extra, onClick){
      var t = mk('span', 'xp-tb' + (extra ? ' ' + extra : ''));
      t.appendChild(mk('i', 'tb-ic ' + iconCls));
      if (label) t.appendChild(document.createTextNode(label));
      if (onClick) t.addEventListener('click', onClick);
      return t;
    }
    tools.appendChild(tb('tb-back', 'Zurück', 'dim'));
    tools.appendChild(tb('tb-fwd', '', 'dim'));
    tools.appendChild(tb('tb-up', '', '', function(){ closeWin(ownId); }));
    tools.appendChild(mk('span', 'xp-sep'));
    tools.appendChild(tb('tb-search', 'Suchen'));
    tools.appendChild(tb('tb-folders ic-folder', 'Ordner', '', function(){ wrap.classList.toggle('side-hidden'); }));

    var addr = mk('div', 'xp-addressbar');
    addr.appendChild(mk('span', 'xp-addr-label', 'Adresse'));
    var field = mk('div', 'xp-addr-field');
    field.appendChild(mk('span', 'xp-addr-ic ic-folder'));
    var addrText = mk('span', 'xp-addr-text');
    field.appendChild(addrText);
    addr.appendChild(field);
    var go = mk('span', 'xp-go'); go.appendChild(mk('i')); go.appendChild(document.createTextNode('Wechseln zu'));
    addr.appendChild(go);

    var side = mk('div', 'xp-side');
    side.appendChild(explorerPanel('Datei- und Ordneraufgaben', function(b){
      b.appendChild(explorerLink('Neuen Ordner erstellen', 'dot', function(){ createDesktopIcon('folder'); }));
      b.appendChild(explorerLink('Diesen Ordner schließen', 'dot', function(){ closeWin(ownId); }));
    }));
    side.appendChild(explorerPanel('Weitere Orte', function(b){
      EXPLORER_PLACES.forEach(function(p){
        if (p[0] !== ownId) b.appendChild(explorerLink(p[1], 'ic-folder', function(){ openWin(p[0]); }));
      });
      b.appendChild(explorerLink('Kontakt.exe', 'dot', function(){ openPhone(); }));
    }));
    var detailName = mk('b'), detailDate = mk('span', 'muted');
    side.appendChild(explorerPanel('Details', function(b){
      b.appendChild(detailName);
      b.appendChild(mk('span', 'muted', 'Dateiordner'));
      detailDate.textContent = 'Geändert: ' + new Date().toLocaleDateString('de-CH');
      b.appendChild(detailDate);
    }));

    var status = mk('div', 'xp-status');
    var countEl = mk('span', null, cfg.count);
    status.appendChild(countEl);
    status.appendChild(mk('span', 'xs-fill'));
    var place = mk('span', 'xs-place'); place.appendChild(mk('i', 'ic-folder')); place.appendChild(document.createTextNode('Arbeitsplatz'));
    status.appendChild(place);

    function setTitle(title){
      addrText.textContent = 'C:\\Dokumente und Einstellungen\\Nazar\\Desktop\\' + title;
      detailName.textContent = title;
    }
    win.__setExplorerTitle = setTitle;
    setTitle(win.querySelector('.xt-label').textContent);

    var title = win.querySelector('.xp-title');
    title.after(menu); menu.after(tools); tools.after(addr); addr.after(wrap);
    wrap.appendChild(side); wrap.appendChild(body);
    wrap.after(status);
    if (parseFloat(win.style.width) < cfg.minWidth) win.style.width = cfg.minWidth + 'px';
  }

  /* wires close/min, focus, drag and resize onto ANY .win element — called for the
     static windows at load, and again for every dynamically created folder/text window */
  function wireWindow(win){
    win.querySelectorAll('[data-close], [data-min]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        closeWin(win.id.replace('win-',''));
      });
    });
    win.addEventListener('pointerdown', function(){ focusWin(win); });

    var bar = win.querySelector('[data-drag]');
    if (bar){
      var dragging = false, sx=0, sy=0, ox=0, oy=0;
      bar.addEventListener('pointerdown', function(e){
        if (e.target.closest('.xt-btn')) return;
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        ox = parseFloat(win.style.left)||0; oy = parseFloat(win.style.top)||0;
        bar.setPointerCapture(e.pointerId);
        focusWin(win);
      });
      bar.addEventListener('pointermove', function(e){
        if (!dragging) return;
        var nl = ox + (e.clientX - sx), nt = oy + (e.clientY - sy);
        nl = Math.min(Math.max(-win.offsetWidth+80, nl), window.innerWidth-60);
        nt = Math.min(Math.max(0, nt), window.innerHeight-56);
        win.style.left = nl+'px'; win.style.top = nt+'px';
      });
      function stopDrag(){ dragging = false; }
      bar.addEventListener('pointerup', stopDrag);
      bar.addEventListener('pointercancel', stopDrag);
    }

    var handle = document.createElement('div');
    handle.className = 'resize-handle';
    win.appendChild(handle);
    var resizing=false, rsx=0, rsy=0, sw=0, sh=0;
    handle.addEventListener('pointerdown', function(e){
      e.stopPropagation(); resizing = true;
      rsx=e.clientX; rsy=e.clientY; sw=win.offsetWidth; sh=win.offsetHeight;
      handle.setPointerCapture(e.pointerId);
      focusWin(win);
    });
    handle.addEventListener('pointermove', function(e){
      if (!resizing) return;
      win.style.width = Math.max(280, sw+(e.clientX-rsx))+'px';
      win.style.height = Math.max(180, sh+(e.clientY-rsy))+'px';
    });
    handle.addEventListener('pointerup', function(){ resizing=false; });
    handle.addEventListener('pointercancel', function(){ resizing=false; });
  }
  document.querySelectorAll('.win').forEach(wireWindow);
  decorateExplorer(winEl('uber'), { count: '3 Objekte', minWidth: 660 });
  decorateExplorer(winEl('projekte'), { count: '4 Objekte', minWidth: 660 });
  decorateExplorer(winEl('werdegang'), { count: '4 Objekte', minWidth: 660 });

  /* phone drag — separate from window drag: the phone starts CSS right-positioned
     and its screen/keys/nav must stay clickable rather than starting a drag */
  (function(){
    var bar = document.querySelector('#phone-body[data-drag]');
    var box = document.getElementById('phone');
    var dragging = false, sx=0, sy=0, ox=0, oy=0;
    bar.addEventListener('pointerdown', function(e){
      if (e.target.closest('#phone-close, .p-item, #phone-nav, #phone-keys, #phone-softkeys, #phone-detail')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      if (!box.style.left){
        /* first drag: convert CSS right-based position to an equivalent inline left, so it doesn't jump */
        var r = box.getBoundingClientRect();
        box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.right = 'auto';
      }
      ox = parseFloat(box.style.left)||0; oy = parseFloat(box.style.top)||0;
      bar.setPointerCapture(e.pointerId);
      topZ++; box.style.zIndex = topZ;
    });
    bar.addEventListener('pointermove', function(e){
      if (!dragging) return;
      var nl = ox + (e.clientX - sx), nt = oy + (e.clientY - sy);
      nl = Math.min(Math.max(-box.offsetWidth+80, nl), window.innerWidth-60);
      nt = Math.min(Math.max(0, nt), window.innerHeight-56);
      box.style.left = nl+'px'; box.style.top = nt+'px';
    });
    function stop(){ dragging = false; }
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  })();

  /* start menu */
  var startBtn = document.getElementById('start-btn');
  var startMenu = document.getElementById('start-menu');
  startBtn.addEventListener('click', function(e){
    e.stopPropagation();
    startMenu.classList.toggle('open');
  });
  document.addEventListener('click', function(e){
    if (!startMenu.contains(e.target) && e.target!==startBtn){ startMenu.classList.remove('open'); }
  });
  document.getElementById('sm-shutdown').addEventListener('click', function(){
    alert('Diese Windows-Sitzung kann nicht beendet werden — der Besucher hat keine Adminrechte.');
  });

  /* clocks */
  function tick(){
    var d = new Date();
    var p = function(n){return String(n).padStart(2,'0');};
    var t = p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
    document.getElementById('clock').textContent = t;
    document.getElementById('phone-clock').textContent = p(d.getHours())+':'+p(d.getMinutes());
  }
  tick(); setInterval(tick, 1000);

  /* nokia phone widget */
  var phone = document.getElementById('phone');
  var phoneChip = null;
  function focusPhone(){
    topZ++; phone.style.zIndex = topZ;
    setActiveWin(null);
    Object.keys(chips).forEach(function(k){ chips[k].classList.remove('active'); });
    if (phoneChip) phoneChip.classList.add('active');
  }
  function openPhone(){
    if (!phone.classList.contains('open')){
      phone.classList.add('open');
      phoneChip = document.createElement('button');
      phoneChip.className = 'task-btn';
      phoneChip.textContent = 'Kontakt.exe';
      phoneChip.addEventListener('click', focusPhone);
      taskItems.appendChild(phoneChip);
    }
    focusPhone();
    document.getElementById('start-menu').classList.remove('open');
  }
  function closePhone(){
    phone.classList.remove('open');
    if (phoneChip){ phoneChip.remove(); phoneChip = null; }
  }
  document.querySelectorAll('[data-phone]').forEach(function(el){
    el.addEventListener('click', openPhone);
  });
  document.querySelector('[data-phone-close]').addEventListener('click', function(e){
    e.stopPropagation();
    closePhone();
  });
  phone.addEventListener('pointerdown', focusPhone);

  var items = Array.prototype.slice.call(document.querySelectorAll('.p-item'));
  var sel = 0;
  var phoneView = 'list'; // 'list' | 'detail' | 'game'
  var pending = null; // {value, action}
  var menuEl = document.getElementById('phone-menu');
  var detailEl = document.getElementById('phone-detail');
  var detailValueEl = document.getElementById('phone-detail-value');
  var titleEl = document.getElementById('phone-title');
  var pkLeft = document.getElementById('pk-left');
  var pkRight = document.getElementById('pk-right');

  function renderSel(){
    items.forEach(function(it, i){ it.classList.toggle('sel', i===sel); });
  }
  function go(delta){
    if (phoneView !== 'list') return;
    sel = (sel + delta + items.length) % items.length;
    renderSel();
  }
  function showList(){
    phoneView = 'list';
    menuEl.style.display = 'flex';
    detailEl.style.display = 'none';
    titleEl.textContent = 'KONTAKT';
    pkLeft.textContent = 'Auswahl';
    pkRight.textContent = 'Zurück';
  }
  function showDetail(it){
    phoneView = 'detail';
    pending = { value: it.getAttribute('data-value'), action: it.getAttribute('data-action') };
    var label = it.textContent.replace(/^\d+\s*/, '').toUpperCase();
    menuEl.style.display = 'none';
    detailEl.style.display = 'flex';
    titleEl.textContent = label;
    detailValueEl.textContent = pending.value;
    pkLeft.textContent = it.getAttribute('data-kind') === 'tel' ? 'Wählen' : 'Öffnen';
    pkRight.textContent = 'Zurück';
  }
  function openPending(){
    if (!pending || !pending.action) return;
    window.location.href = pending.action;
  }
  function leftAction(){
    if (phoneView === 'list') showDetail(items[sel]);
    else openPending();
  }
  function rightAction(){
    if (phoneView === 'detail') showList();
    else closePhone();
  }
  document.querySelectorAll('[data-nav]').forEach(function(el){
    el.addEventListener('click', function(){ go(parseInt(el.getAttribute('data-nav'),10)); });
  });
  document.querySelector('[data-nav-go]').addEventListener('click', leftAction);
  pkLeft.addEventListener('click', leftAction);
  pkRight.addEventListener('click', rightAction);
  detailValueEl.addEventListener('click', openPending);
  items.forEach(function(it, i){
    it.addEventListener('click', function(){ sel = i; renderSel(); showDetail(it); });
  });
  showList();

  /* start button logo (reuses embedded favicon, no data duplication) */
  var favLinkEl = document.querySelector('link[rel="icon"]');
  var startFlag = document.getElementById('start-flag');
  if (favLinkEl && startFlag) startFlag.style.backgroundImage = 'url(' + favLinkEl.href + ')';

  /* ---------- NEW FOLDER / NEW TEXT FILE (right-click desktop, session-only) ----------
     Everything created here lives only in the page's DOM/JS memory — nothing is written
     to disk or localStorage, so a refresh wipes it clean, exactly like a scratch desktop. */
  var ctxMenu = document.getElementById('ctx-menu');
  var iconsWrap = document.getElementById('icons');
  var newCount = { folder: 0, doc: 0 };

  function escapeHtml(s){
    return s.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; });
  }
  function hideCtx(){ ctxMenu.classList.remove('open'); ctxMenu.innerHTML = ''; }
  function ctxItem(label, onClick){
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', function(e){ e.stopPropagation(); hideCtx(); onClick(); });
    return b;
  }
  function showCtxAt(x, y, buildFn){
    ctxMenu.innerHTML = '';
    buildFn(ctxMenu);
    ctxMenu.style.left = Math.min(x, window.innerWidth - 190) + 'px';
    ctxMenu.style.top = Math.min(y, window.innerHeight - 170) + 'px';
    ctxMenu.classList.add('open');
  }
  document.addEventListener('click', hideCtx);
  window.addEventListener('blur', hideCtx);

  function startRename(btn, onDone){
    var lb = btn.querySelector('.lb');
    var current = lb.textContent;
    var input = document.createElement('input');
    input.type = 'text'; input.className = 'lb-edit'; input.value = current;
    lb.replaceWith(input);
    input.focus(); input.select();
    var done = false;
    function commit(){
      if (done) return; done = true;
      var val = input.value.trim() || current;
      var newLb = document.createElement('span'); newLb.className = 'lb'; newLb.textContent = val;
      input.replaceWith(newLb);
      if (onDone) onDone(val);
    }
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ commit(); }
      else if (e.key === 'Escape'){ input.value = current; commit(); }
    });
    input.addEventListener('blur', commit);
    input.addEventListener('click', function(e){ e.stopPropagation(); });
    input.addEventListener('pointerdown', function(e){ e.stopPropagation(); });
  }

  function openDynamicWin(dynId, kind, title){
    var el = document.getElementById('win-' + dynId);
    if (!el){
      el = document.createElement('section');
      el.className = 'win';
      el.id = 'win-' + dynId;
      var n = Object.keys(chips).length % 6;
      el.style.left = (150 + n*24) + 'px';
      el.style.top = (70 + n*20) + 'px';
      el.style.width = kind === 'folder' ? '380px' : '360px';
      var bodyHtml = kind === 'folder'
        ? '<div class="empty-folder">Dieser Ordner ist leer.</div>'
        : '<textarea class="txt-editor" placeholder="Leeres Textdokument — wird beim Neuladen der Seite nicht gespeichert."></textarea>';
      el.innerHTML =
        '<div class="xp-title" data-drag>' +
          '<span class="xt-ic ' + (kind === 'folder' ? 'ic-folder' : 'ic-doc') + '"></span>' +
          '<span class="xt-label"></span>' +
          '<button class="xt-btn" data-min title="Minimieren">_</button>' +
          '<button class="xt-btn xt-close" data-close title="Schließen">✕</button>' +
        '</div>' +
        '<div class="win-body"' + (kind === 'doc' ? ' style="padding:0;"' : '') + '>' + bodyHtml + '</div>';
      document.getElementById('desktop').appendChild(el);
      el.querySelector('.xt-label').textContent = title;
      wireWindow(el);
      if (kind === 'folder') decorateExplorer(el, { count: '0 Objekte', minWidth: 560 });
    }
    el.querySelector('.xt-label').textContent = title;
    if (el.__setExplorerTitle) el.__setExplorerTitle(title);
    if (!el.classList.contains('open')){
      el.classList.add('open');
      clampToViewport(el);
      addChip(dynId, el);
    }
    focusWin(el);
  }

  function createDesktopIcon(kind){
    var isFolder = kind === 'folder';
    newCount[kind]++;
    var name = isFolder
      ? ('Neuer Ordner' + (newCount.folder > 1 ? ' (' + newCount.folder + ')' : ''))
      : ('Neues Textdokument' + (newCount.doc > 1 ? ' (' + newCount.doc + ')' : '') + '.txt');
    var dynId = kind + '-' + Date.now() + '-' + Math.floor(Math.random()*1000);

    var btn = document.createElement('button');
    btn.className = 'dicon';
    btn.setAttribute('data-dynamic', '1');
    btn.innerHTML = '<span class="ig ' + (isFolder ? 'ic-folder' : 'ic-doc') + '"></span><span class="lb">' + escapeHtml(name) + '</span>';
    iconsWrap.appendChild(btn);

    btn.addEventListener('click', function(){
      openDynamicWin(dynId, kind, btn.querySelector('.lb').textContent);
    });
    btn.addEventListener('contextmenu', function(e){
      e.preventDefault(); e.stopPropagation();
      showCtxAt(e.clientX, e.clientY, function(menu){
        menu.appendChild(ctxItem('Öffnen', function(){ openDynamicWin(dynId, kind, btn.querySelector('.lb').textContent); }));
        menu.appendChild(ctxItem('Umbenennen', function(){ startRename(btn, function(val){
          var win = document.getElementById('win-' + dynId);
          if (win) win.querySelector('.xt-label').textContent = val;
          if (chips[dynId]) chips[dynId].textContent = val;
        }); }));
        var hr = document.createElement('hr'); menu.appendChild(hr);
        menu.appendChild(ctxItem('Löschen', function(){
          closeWin(dynId);
          var win = document.getElementById('win-' + dynId);
          if (win) win.remove();
          btn.remove();
        }));
      });
    });

    startRename(btn); // new items start life editable, like a real desktop
  }

  document.getElementById('desktop').addEventListener('contextmenu', function(e){
    if (e.target.closest('.dicon, .win, #taskbar, #start-menu, #phone, #ctx-menu')) return;
    e.preventDefault();
    showCtxAt(e.clientX, e.clientY, function(menu){
      menu.appendChild(ctxItem('Aktualisieren', function(){}));
      var hr = document.createElement('hr'); menu.appendChild(hr);
      menu.appendChild(ctxItem('Neuer Ordner', function(){ createDesktopIcon('folder'); }));
      menu.appendChild(ctxItem('Neues Textdokument', function(){ createDesktopIcon('doc'); }));
      var hr2 = document.createElement('hr'); menu.appendChild(hr2);
      menu.appendChild(ctxItem('Eigenschaften', function(){
        alert('Anzeigeeigenschaften: 800 × 600 · 16,7 Mio. Farben.\n(Diese Seite antwortet nicht wirklich — ist nur für die Show.)');
      }));
    });
  });

  /* ---------- MINESWEEPER ---------- */
  (function(){
    var ROWS = 9, COLS = 9, MINES = 10;
    var grid = [];
    var firstClick = true, gameOver = false;
    var seconds = 0, mineTimer = null, flagCount = 0;

    var gridEl = document.getElementById('mine-grid');
    var faceEl = document.getElementById('mine-face');
    var counterEl = document.getElementById('mine-counter');
    var timerEl = document.getElementById('mine-timer');
    if (!gridEl) return;

    function pad3(n){ n = Math.max(0, Math.min(999, n)); var s = String(n); while (s.length < 3) s = '0' + s; return s; }
    function updateCounter(){ counterEl.textContent = pad3(MINES - flagCount); }

    function buildGrid(){
      gridEl.innerHTML = '';
      gridEl.style.gridTemplateColumns = 'repeat(' + COLS + ', 24px)';
      grid = [];
      for (var r = 0; r < ROWS; r++){
        var row = [];
        for (var c = 0; c < COLS; c++){
          var cell = document.createElement('div');
          cell.className = 'mine-cell';
          cell.dataset.r = r; cell.dataset.c = c;
          gridEl.appendChild(cell);
          row.push({ mine:false, revealed:false, flag:false, adj:0, el:cell });
        }
        grid.push(row);
      }
    }
    function countAdj(r, c){
      var n = 0;
      for (var dr=-1; dr<=1; dr++) for (var dc=-1; dc<=1; dc++){
        if (dr===0 && dc===0) continue;
        var rr=r+dr, cc=c+dc;
        if (rr>=0 && rr<ROWS && cc>=0 && cc<COLS && grid[rr][cc].mine) n++;
      }
      return n;
    }
    function placeMines(exR, exC){
      var placed = 0;
      while (placed < MINES){
        var r = Math.floor(Math.random()*ROWS), c = Math.floor(Math.random()*COLS);
        if (grid[r][c].mine) continue;
        if (Math.abs(r-exR)<=1 && Math.abs(c-exC)<=1) continue;
        grid[r][c].mine = true; placed++;
      }
      for (var r2=0; r2<ROWS; r2++) for (var c2=0; c2<COLS; c2++) grid[r2][c2].adj = countAdj(r2, c2);
    }
    function startTimer(){
      if (mineTimer) return;
      mineTimer = setInterval(function(){ seconds++; timerEl.textContent = pad3(seconds); }, 1000);
    }
    function stopTimer(){ clearInterval(mineTimer); mineTimer = null; }

    function reveal(r, c){
      var cell = grid[r][c];
      if (cell.revealed || cell.flag) return;
      cell.revealed = true;
      cell.el.classList.add('revealed');
      if (cell.mine){
        cell.el.classList.add('mine-hit');
        endGame(false, r, c);
        return;
      }
      if (cell.adj > 0){
        cell.el.textContent = cell.adj;
        cell.el.setAttribute('data-n', cell.adj);
      } else {
        for (var dr=-1; dr<=1; dr++) for (var dc=-1; dc<=1; dc++){
          if (dr===0 && dc===0) continue;
          var rr=r+dr, cc=c+dc;
          if (rr>=0 && rr<ROWS && cc>=0 && cc<COLS){
            var n = grid[rr][cc];
            if (!n.revealed && !n.flag && !n.mine) reveal(rr, cc);
          }
        }
      }
    }
    function checkWin(){
      var revealedCount = 0;
      for (var r=0; r<ROWS; r++) for (var c=0; c<COLS; c++) if (grid[r][c].revealed) revealedCount++;
      if (revealedCount === ROWS*COLS - MINES) endGame(true);
    }
    function endGame(won, hitR, hitC){
      gameOver = true;
      stopTimer();
      faceEl.className = 'mine-face ' + (won ? 'win' : 'dead');
      if (!won){
        for (var r=0; r<ROWS; r++) for (var c=0; c<COLS; c++){
          var cell = grid[r][c];
          if (cell.mine && !cell.flag && !(r===hitR && c===hitC)){
            cell.el.classList.add('revealed', 'mine-shown');
          }
          if (!cell.mine && cell.flag){
            cell.el.classList.add('flag-wrong');
          }
        }
      } else {
        for (var r2=0; r2<ROWS; r2++) for (var c2=0; c2<COLS; c2++){
          var cell2 = grid[r2][c2];
          if (cell2.mine && !cell2.flag){ cell2.flag = true; cell2.el.classList.add('flag'); flagCount++; }
        }
        updateCounter();
      }
    }
    function newGame(){
      gameOver = false; firstClick = true; seconds = 0; flagCount = 0;
      stopTimer();
      timerEl.textContent = '000';
      faceEl.className = 'mine-face';
      buildGrid();
      updateCounter();
    }

    gridEl.addEventListener('pointerdown', function(e){
      if (gameOver) return;
      var cellEl = e.target.closest('.mine-cell');
      if (cellEl && !grid[+cellEl.dataset.r][+cellEl.dataset.c].flag) faceEl.className = 'mine-face ohh';
    });
    gridEl.addEventListener('pointerup', function(){ if (!gameOver) faceEl.className = 'mine-face'; });
    gridEl.addEventListener('pointerleave', function(){ if (!gameOver) faceEl.className = 'mine-face'; });
    gridEl.addEventListener('click', function(e){
      var cellEl = e.target.closest('.mine-cell');
      if (!cellEl || gameOver) return;
      var r = +cellEl.dataset.r, c = +cellEl.dataset.c;
      if (grid[r][c].flag) return;
      if (firstClick){ placeMines(r, c); firstClick = false; startTimer(); }
      reveal(r, c);
      if (!gameOver) checkWin();
    });
    gridEl.addEventListener('contextmenu', function(e){
      e.preventDefault();
      var cellEl = e.target.closest('.mine-cell');
      if (!cellEl || gameOver) return;
      var r = +cellEl.dataset.r, c = +cellEl.dataset.c;
      var cell = grid[r][c];
      if (cell.revealed) return;
      cell.flag = !cell.flag;
      cell.el.classList.toggle('flag', cell.flag);
      flagCount += cell.flag ? 1 : -1;
      updateCounter();
    });
    faceEl.addEventListener('click', newGame);

    newGame();
  })();
})();

/* ---------- GRASS: the hill and meadow are painted blade by blade (once per resize) ---------- */
(function(){
  "use strict";
  var canvas = document.getElementById('ground');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var VB_W = 1600, VB_H = 900;               // same coordinate space as the #scene svg
  var HILL_MAIN = new Path2D('M0 705 C 170 640, 390 592, 650 588 C 910 584, 1110 640, 1310 692 C 1430 720, 1520 722, 1600 718 L1600 900 L0 900 Z');
  var HILL_FORE = new Path2D('M0 835 C 420 780, 920 790, 1600 748 L1600 900 L0 900 Z');
  var CREST = new Path2D('M0 705 C 170 640, 390 592, 650 588 C 910 584, 1110 640, 1310 692 C 1430 720, 1520 722, 1600 718');

  var RIDGE = new Path2D('M0 585 C 300 548, 620 540, 900 556 C 1180 572, 1400 548, 1600 562 L1600 900 L0 900 Z');
  /* y of the distant crest at a given x (cubic Bezier segments, solved for x by bisection) */
  function ridgeY(x){
    var seg = x < 900 ? [0, 300, 620, 900, 585, 548, 540, 556] : [900, 1180, 1400, 1600, 556, 572, 548, 562];
    var lo = 0, hi = 1, t = 0.5, i;
    for (i = 0; i < 24; i++){
      t = (lo + hi) / 2;
      var mt = 1 - t, bx = mt*mt*mt*seg[0] + 3*mt*mt*t*seg[1] + 3*mt*t*t*seg[2] + t*t*t*seg[3];
      if (bx < x) lo = t; else hi = t;
    }
    var m = 1 - t;
    return m*m*m*seg[4] + 3*m*m*t*seg[5] + 3*m*t*t*seg[6] + t*t*t*seg[7];
  }
  /* a few small tree groups on the far ridge: x position and size */
  var TREES = [[300,1.0],[338,0.8],[372,1.1],[690,0.9],[1010,0.8],[1112,1.1],[1146,0.9],[1180,0.8],[1330,1.0],[1362,1.2],[1492,0.9],[1524,1.1],[1566,0.8]];
  /* soft radial-gradient blob, stretched into an ellipse (used for shadows) */
  function softBlob(x, y, rx, ry, alpha){
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.04); ctx.scale(rx, ry);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(10,36,8,' + alpha + ')');
    g.addColorStop(0.55, 'rgba(10,36,8,' + (alpha * 0.55) + ')');
    g.addColorStop(1, 'rgba(10,36,8,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  /* the sun is upper right, so the shadow is cast to the left: a thin streak behind the trunk,
     a wider soft patch where the crown's shadow lands, and a dark contact spot at the foot */
  function treeShadow(cx, base, w, h, size){
    var len = h * 1.25;
    ctx.save(); ctx.clip(RIDGE);               // a shadow lies on the ground, never in the sky
    softBlob(cx - len * 0.4, base + 1.5, len * 0.55, 1.7 * size, 0.38);
    softBlob(cx - len * 0.82, base + 2, w * 1.05, w * 0.32, 0.42);
    softBlob(cx + size, base + 1, w * 0.5, 1.7 * size, 0.5);
    ctx.restore();
  }
  function treeClump(rand, cx, size){
    var base = ridgeY(cx) + 4, w = 12 * size, h = 26 * size;
    var crownY = base - h * 0.72, lean = (rand() - 0.5) * 3 * size;
    treeShadow(cx, base, w, h, size);

    /* trunk and branches first, so they show through the gaps of the crown */
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4a3a2a';
    ctx.lineWidth = 2.2 * size;
    ctx.beginPath(); ctx.moveTo(cx, base); ctx.quadraticCurveTo(cx + lean * 0.4, base - h * 0.3, cx + lean, crownY + h * 0.12); ctx.stroke();
    ctx.lineWidth = 1.1 * size;
    for (var b = 0; b < 5; b++){
      var sy = base - h * (0.28 + rand() * 0.28), dir = b % 2 ? 1 : -1;
      var ex = cx + lean + dir * (w * (0.35 + rand() * 0.55)), ey = crownY + (rand() - 0.5) * h * 0.35;
      ctx.beginPath(); ctx.moveTo(cx + lean * (0.4 + (base - sy) / h * 0.6), sy);
      ctx.quadraticCurveTo((cx + ex) / 2, sy - 2 * size, ex, ey); ctx.stroke();
    }

    /* crown: many small leaf clusters, lighter on top and on the sunlit right, with gaps */
    for (var i = 0; i < 58; i++){
      var a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      var px = cx + lean + Math.cos(a) * r * w, py = crownY + Math.sin(a) * r * h * 0.34;
      var top = 1 - (py - (crownY - h * 0.34)) / (h * 0.68), side = (px - cx) / w;
      var L = 15 + top * 11 + side * 6 + (rand() - 0.5) * 6;
      ctx.fillStyle = 'hsl(' + (96 + (rand() - 0.5) * 14) + ',' + (36 + side * 6) + '%,' + Math.max(9, L) + '%)';
      ctx.beginPath(); ctx.arc(px, py, (1.2 + rand() * 2.1) * size, 0, Math.PI * 2); ctx.fill();
    }
  }

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* the sun is upper right: the right side is lit, the left falls into shade */
  function lightAt(x, y){
    var l = 0.34 + 0.66 * Math.pow(Math.min(1, Math.max(0, (x - 150) / 1250)), 0.9);
    l -= (y - 600) / 900 * 0.18;
    return Math.min(1, Math.max(0, l));
  }

  function paintBlades(rand, o){
    var bands = 8, span = o.yBottom - o.yTop, buckets = [];
    for (var b = 0; b < bands; b++) buckets.push({});
    for (var i = 0; i < o.count; i++){
      var y = o.yTop + span * Math.pow(rand(), 0.62);      // a bit denser toward the horizon
      var x = rand() * VB_W;
      var depth = Math.min(1, Math.max(0, (y - 585) / 315)); // 0 = far, 1 = near
      var h = (2.2 + 21 * Math.pow(depth, 1.15)) * (0.65 + rand() * 0.7);
      var w = (0.55 + 1.9 * depth) * (0.8 + rand() * 0.5);
      var lean = (rand() - 0.5) * h * 0.9;
      var lit = lightAt(x, y);
      var L = 13 + lit * 34 - depth * 5 - o.darkness + (o.lift || 0) + (rand() - 0.5) * 9;
      var H = 74 + (1 - lit) * 36 + (o.hue || 0) + (rand() - 0.5) * 12;
      var S = 52 + lit * 14 - (o.desat || 0) + (rand() - 0.5) * 10;
      var qH = Math.round(H / 6) * 6, qS = Math.round(S / 8) * 8, qL = Math.round(L / 3) * 3, qW = Math.max(0.4, Math.round(w));
      var key = qH + '|' + qS + '|' + qL + '|' + qW;
      var bk = buckets[Math.min(bands - 1, Math.floor(depth * bands))];
      var e = bk[key] || (bk[key] = { H: qH, S: qS, L: qL, w: qW, segs: [] });
      e.segs.push(x, y, lean, h);
    }
    ctx.lineCap = 'round';
    for (var bi = 0; bi < bands; bi++){          // far to near, so near blades overlap far ones
      var bk2 = buckets[bi];
      for (var k in bk2){
        var e2 = bk2[k], s = e2.segs;
        ctx.beginPath();
        for (var j = 0; j < s.length; j += 4){
          ctx.moveTo(s[j], s[j + 1]);
          ctx.quadraticCurveTo(s[j] + s[j + 2] * 0.15, s[j + 1] - s[j + 3] * 0.6, s[j] + s[j + 2], s[j + 1] - s[j + 3]);
        }
        ctx.strokeStyle = 'hsl(' + e2.H + ',' + e2.S + '%,' + Math.max(6, Math.min(62, e2.L)) + '%)';
        ctx.lineWidth = e2.w;
        ctx.stroke();
      }
    }
  }

  function draw(){
    var W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var s = Math.max(W / VB_W, H / VB_H);                 // matches preserveAspectRatio="xMidYMax slice"
    var ox = (W - VB_W * s) / 2, oy = H - VB_H * s;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    var rand = rng(20260);

    /* distant ridge: the same blades, but tiny, hazy and blue-shifted by the distance */
    ctx.save(); ctx.clip(RIDGE);
    var gr0 = ctx.createLinearGradient(0, 535, 0, 700);
    gr0.addColorStop(0, '#6f9d58'); gr0.addColorStop(1, '#4f7d3c');
    ctx.fillStyle = gr0; ctx.fillRect(0, 520, VB_W, 200);
    paintBlades(rand, { yTop: 535, yBottom: 700, count: 45000, darkness: 0, lift: 9, desat: 20, hue: 8 });
    var gh0 = ctx.createLinearGradient(0, 520, 0, 640);
    gh0.addColorStop(0, 'rgba(225,240,248,.12)'); gh0.addColorStop(0.5, 'rgba(225,240,248,.34)'); gh0.addColorStop(1, 'rgba(225,240,248,.1)');
    ctx.fillStyle = gh0; ctx.fillRect(0, 520, VB_W, 200);
    ctx.restore();
    for (var tx = 0; tx < TREES.length; tx++) treeClump(rand, TREES[tx][0], TREES[tx][1]);

    /* main hill */
    ctx.save(); ctx.clip(HILL_MAIN);
    var g = ctx.createLinearGradient(0, 585, 0, 900);
    g.addColorStop(0, '#3d7a1a'); g.addColorStop(0.5, '#285c10'); g.addColorStop(1, '#163f08');
    ctx.fillStyle = g; ctx.fillRect(0, 560, VB_W, 340);
    paintBlades(rand, { yTop: 585, yBottom: 900, count: 90000, darkness: 0 });
    var gl = ctx.createRadialGradient(1250, 600, 20, 1250, 600, 800);
    gl.addColorStop(0, 'rgba(255,246,170,.34)'); gl.addColorStop(0.55, 'rgba(235,250,140,.12)'); gl.addColorStop(1, 'rgba(235,250,140,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, 560, VB_W, 340);
    var gs = ctx.createLinearGradient(0, 0, 950, 0);
    gs.addColorStop(0, 'rgba(4,28,2,.28)'); gs.addColorStop(1, 'rgba(4,28,2,0)');
    ctx.fillStyle = gs; ctx.fillRect(0, 560, VB_W, 340);
    var gh = ctx.createLinearGradient(0, 580, 0, 680);
    gh.addColorStop(0, 'rgba(210,235,215,.28)'); gh.addColorStop(1, 'rgba(210,235,215,0)');
    ctx.fillStyle = gh; ctx.fillRect(0, 560, VB_W, 140);
    ctx.restore();

    /* rim light along the sunlit crest */
    ctx.save();
    var gr = ctx.createLinearGradient(350, 0, 1350, 0);
    gr.addColorStop(0, 'rgba(245,255,180,0)'); gr.addColorStop(1, 'rgba(245,255,180,.5)');
    ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(245,255,170,.7)'; ctx.shadowBlur = 8;
    ctx.stroke(CREST); ctx.restore();

    /* darker foreground meadow with coarse blades and a few wildflowers */
    ctx.save(); ctx.clip(HILL_FORE);
    var gf = ctx.createLinearGradient(0, 740, 0, 900);
    gf.addColorStop(0, '#2a5f12'); gf.addColorStop(1, '#10340a');
    ctx.fillStyle = gf; ctx.fillRect(0, 730, VB_W, 170);
    paintBlades(rand, { yTop: 748, yBottom: 900, count: 40000, darkness: 6 });
    var gl2 = ctx.createRadialGradient(1250, 760, 20, 1250, 760, 700);
    gl2.addColorStop(0, 'rgba(255,246,170,.22)'); gl2.addColorStop(1, 'rgba(235,250,140,0)');
    ctx.fillStyle = gl2; ctx.fillRect(0, 730, VB_W, 170);
    var gs2 = ctx.createLinearGradient(0, 0, 900, 0);
    gs2.addColorStop(0, 'rgba(4,28,2,.2)'); gs2.addColorStop(1, 'rgba(4,28,2,0)');
    ctx.fillStyle = gs2; ctx.fillRect(0, 730, VB_W, 170);
    ctx.restore();
  }

  var timer;
  window.addEventListener('resize', function(){ clearTimeout(timer); timer = setTimeout(draw, 150); });
  draw();
})();
