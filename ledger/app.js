(() => {
  const $ = (s) => document.querySelector(s);
  const sessions = [];
  const status = (t, err) => { $('#status').textContent = t; $('#status').className = err ? 'err' : ''; };
  const stamp = () => new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);

  function save(text, mime, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }

  function refresh() {
    const n = sessions.reduce((a, s) => a + s.rows.length, 0);
    $('#save').hidden = !sessions.length;
    $('#list').innerHTML = '';
    for (const [i, s] of sessions.entries()) {
      const li = document.createElement('li');
      li.textContent = `${s.name} / ${s.rows.length}枚 / ${s.fileName} `;
      const rm = document.createElement('button'); rm.textContent = '外す';
      rm.onclick = () => { sessions.splice(i, 1); refresh(); };
      li.append(rm); $('#list').append(li);
    }
    $('#preview').srcdoc = sessions.length ? Ledger.toHTML(sessions) : '';
    $('#preview').hidden = !sessions.length;
    if (sessions.length) status(`${sessions.length}セッション / ${n}枚を読み込みました。`);
  }

  async function addFiles(files) {
    for (const f of files) {
      try {
        status(`${f.name} を読み込み中 …`);
        sessions.push(await Ledger.loadSession(await f.arrayBuffer(), f.name));
      } catch (e) { console.error(e); status('失敗: ' + (e.message || e), true); return; }
    }
    refresh();
  }

  $('#html').onclick = () => save(Ledger.toHTML(sessions), 'text/html', `novelai-ledger_${stamp()}.html`);
  $('#csv').onclick = () => save(Ledger.toCSV(sessions), 'text/csv', `novelai-ledger_${stamp()}.csv`);
  $('#pick').onclick = () => $('#file').click();
  $('#file').onchange = (e) => { addFiles([...e.target.files]); e.target.value = ''; };
  const dz = $('#drop');
  ['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('on'); }));
  ['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('on'); }));
  dz.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files].filter((f) => /\.zip$/i.test(f.name))));
})();
