// Session manager shown only while NovelAI's "Load a previous session?" dialog is open,
// attached right below that dialog: list / duplicate / export / import sessions.
(() => {
  if (window.top !== window || document.getElementById('nsm-host')) return;
  const T = globalThis.SessionTool;

  const host = document.createElement('div');
  host.id = 'nsm-host';
  host.style.cssText = 'position:fixed;z-index:2147483647;display:none;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      *{box-sizing:border-box;font:13px/1.4 system-ui,sans-serif}
      button{cursor:pointer;border:1px solid #556;background:#2a2c40;color:#eee;border-radius:6px;padding:4px 9px}
      button:hover{background:#3a3d5c} button:disabled{opacity:.5;cursor:default}
      #panel{display:block;overflow:auto;background:#161726;color:#eee;border:1px solid #556;border-radius:10px;padding:10px;box-shadow:0 6px 24px #0008}
      .row{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #2c2e48}
      .row img{width:48px;height:48px;object-fit:cover;border-radius:4px;background:#000;flex:none}
      .info{flex:1;min-width:0} .id{color:#99a;font-size:11px;white-space:pre-wrap;word-break:break-all}
      .actions{display:flex;gap:4px;flex-direction:column}
      #msg{margin:6px 0;color:#9cf;white-space:pre-wrap} #msg.err{color:#f99}
      header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
    </style>
    <div id="panel">
      <header><b>🗂 セッション管理</b><span><button id="imp">取り込み</button> <button id="rel">更新</button></span></header>
      <div id="msg"></div>
      <button id="reload" hidden>ページを再読み込み</button>
      <div id="list"></div>
      <input id="file" type="file" accept=".zip" hidden>
    </div>`;
  document.documentElement.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const panel = $('#panel');
  const IDLE = 'NovelAIを複数タブで開いていると上書きされることがあります。操作は1タブで。';
  const msg = (t, err, needReload) => { $('#msg').textContent = t; $('#msg').className = err ? 'err' : ''; $('#reload').hidden = !needReload; };
  const fmt = (d) => new Date(d).toLocaleString('ja-JP');

  async function guarded(label, fn, btn) {
    if (btn) btn.disabled = true;
    msg(label + ' …');
    try { await fn(); } catch (e) { console.error(e); msg('失敗: ' + (e.message || e), true); }
    finally { if (btn) btn.disabled = false; }
  }

  async function render() {
    const list = $('#list');
    list.textContent = '';
    let sessions;
    try { sessions = await T.listSessions(); } catch (e) { msg(e.message, true); return; }
    for (const s of sessions) {
      const row = document.createElement('div');
      row.className = 'row';
      const img = document.createElement('img');
      if (typeof s.recentThumbnail === 'string' && s.recentThumbnail.startsWith('data:image/')) img.src = s.recentThumbnail;
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = '<div></div><div class="id"></div>';
      info.firstChild.textContent = `${s.name || 'History'} / ${s.imageCount ?? '?'}枚`;
      info.lastChild.textContent = `${fmt(s.lastSavedAt)}\n${s.id}`;
      const act = document.createElement('div');
      act.className = 'actions';
      const dup = document.createElement('button'); dup.textContent = '複製';
      const exp = document.createElement('button'); exp.textContent = 'ZIP保存';
      const view = document.createElement('button'); view.textContent = '一覧表示';
      view.onclick = async () => {
        const w = window.open('', '_blank'); // must open synchronously, inside the click
        if (!w) { msg('ポップアップがブロックされました。このサイトのポップアップを許可してください。', true); return; }
        w.document.title = '読み込み中 …'; w.document.body.textContent = '読み込み中 …';
        await guarded('一覧を作成中', async () => {
          try {
            const n = await SessionViewer.open(w, await T.readSession(s.id));
            msg(`別タブに${n}枚を表示しました。元のNovelAIタブは閉じないでください（画像が見えなくなります）。`);
          } catch (e) { w.close(); throw e; }
        }, view);
      };
      dup.onclick = () => guarded('複製中', async () => {
        const id = await T.duplicateSession(s.id);
        msg(`複製しました: ${id}\n再読み込みすると上のセッション一覧に反映されます。`, false, true);
        await render();
      }, dup);
      exp.onclick = () => guarded('書き出し中', async () => {
        const { blob, filename } = await T.exportSessionZip(s.id);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
        msg(`保存しました: ${filename} (${(blob.size / 1048576).toFixed(1)}MB)`);
      }, exp);
      act.append(view, dup, exp);
      row.append(img, info, act);
      list.append(row);
    }
    if (!sessions.length) list.textContent = 'セッションがありません';
  }

  $('#rel').onclick = render;
  $('#reload').onclick = () => location.reload();
  $('#imp').onclick = () => $('#file').click();
  $('#file').onchange = (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    guarded('取り込み中', async () => {
      const id = await T.importSessionZip(f);
      msg(`取り込みました: ${id}\n再読み込みすると上のセッション一覧に反映されます。`, false, true);
      await render();
    }, $('#imp'));
  };

  // Find the "Load a previous session?" card: the card around the "New Session" button,
  // i.e. the biggest ancestor that is still not the full-screen overlay.
  function findDialog() {
    const btn = [...document.querySelectorAll('button')].find((b) => /^\s*New Session\s*$/i.test(b.textContent));
    if (!btn) return null;
    let node = btn;
    while (node.parentElement && node.parentElement !== document.body) {
      const r = node.parentElement.getBoundingClientRect();
      if (r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9) break;
      node = node.parentElement;
    }
    return /previous session|Last Saved/i.test(node.textContent) ? node : null;
  }

  let wasShown = false;
  function update() {
    const d = findDialog();
    if (!d) { host.style.display = 'none'; wasShown = false; return; }
    const r = d.getBoundingClientRect();
    host.style.display = 'block';
    // Prefer the right side of the dialog, then the left, and fall back to below it.
    const GAP = 12, MIN_W = 300, MAX_W = 440;
    const roomRight = innerWidth - r.right - GAP * 2, roomLeft = r.left - GAP * 2;
    let left, top, width;
    if (roomRight >= MIN_W) { width = Math.min(MAX_W, roomRight); left = r.right + GAP; top = r.top; }
    else if (roomLeft >= MIN_W) { width = Math.min(MAX_W, roomLeft); left = r.left - GAP - width; top = r.top; }
    else { width = r.width; left = r.left; top = r.bottom + 8; }
    host.style.left = left + 'px';
    host.style.top = top + 'px';
    host.style.width = width + 'px';
    panel.style.maxHeight = Math.max(160, innerHeight - top - 90) + 'px';
    if (!wasShown) { wasShown = true; msg(IDLE); render(); }
  }
  let timer = 0;
  const schedule = () => { if (!timer) timer = setTimeout(() => { timer = 0; update(); }, 150); };
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', schedule);
  msg(IDLE);
  schedule();
})();
