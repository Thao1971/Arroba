// arroba copilot — composer fino (vanilla JS), estilo GPT/Claude/Gemini.
// Chips contextuales en UNA línea (máx 3) · fila inferior: [+] adjuntar · textarea · enviar.
// Minimizar arriba a la derecha → icono @ (mosaico, barrido diagonal). Carga con <script src>.
(function () {
  if (window.__arrobaComposer) return;
  window.__arrobaComposer = true;

  var pageName = (document.title || 'arroba.com').replace(/\s*[—|·-]\s*arroba\.com.*$/i, '').trim() || 'arroba.com';

  // Próxima mejor acción según la página (máx 3, una línea)
  var presets = (function () {
    var n = pageName.toLowerCase();
    if (/valora/.test(n)) return ['¿Cómo se calcula este valor?', 'Múltiplos del sector', 'Valoración avanzada'];
    if (/mandato/.test(n)) return ['Resumen del proceso', 'Responder Q&A', 'Avanzar de fase'];
    if (/advisor|mandatos/.test(n)) return ['¿Qué requiere atención?', 'Resumir mi cartera', 'Honorarios potenciales'];
    if (/data room/.test(n)) return ['Resumir preguntas', 'Borradores de respuesta', '¿Qué riesgos hay?'];
    if (/matching/.test(n)) return ['Mejores encajes', 'Enviar NDA', 'Comparar compradores'];
    if (/empresa|company|workspace/.test(n)) return ['Resume esta compañía', '¿Cuáles son sus riesgos?', '¿Quién la compraría?'];
    if (/territorio|mapa/.test(n)) return ['Sectores líderes', 'Oportunidades de compra', 'Empresas destacadas'];
    if (/oportunidad|workbench/.test(n)) return ['¿Qué requiere atención?', 'Avances del proceso', 'Próximos pasos'];
    if (/sector/.test(n)) return ['¿Qué impulsa el sector?', 'Oportunidades de compra', 'Riesgos del sector'];
    return ['Analizar una empresa', 'Valorar un negocio', 'Buscar oportunidades'];
  })().slice(0, 3);

  var css = document.createElement('style');
  css.textContent = [
    '.cop-wrap{position:fixed;left:0;right:0;bottom:0;z-index:90;display:flex;justify-content:center;padding:0 20px 22px;pointer-events:none;font-family:var(--font-body,system-ui,sans-serif)}',
    '.cop-wrap::before{content:"";position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(to top,var(--bg) 36%,transparent);pointer-events:none}',
    '.cop{position:relative;pointer-events:auto;width:100%;max-width:680px}',
    // panel de conversación (oculto hasta abrir)
    '.cop-panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:0 18px 56px rgba(12,12,14,.18);max-height:0;overflow:hidden;opacity:0;transition:max-height .26s ease,opacity .2s ease,margin .2s ease}',
    '.cop.open .cop-panel{max-height:min(52vh,420px);overflow-y:auto;opacity:1;margin-bottom:10px}',
    '.cop-msgs{padding:16px 18px;display:flex;flex-direction:column;gap:13px}',
    '.cmsg{display:flex;gap:10px;max-width:92%}.cmsg.user{align-self:flex-end;flex-direction:row-reverse}',
    '.cmsg .mav{width:24px;height:24px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-top:2px}',
    '.cmsg.bot .mav{background:var(--primary,#E8001D);color:#fff}.cmsg.user .mav{background:#A8C03E;color:#0C0C0E}',
    '.cmsg .mtxt{font-size:14px;line-height:1.6;padding:8px 13px;border-radius:13px}',
    '.cmsg.bot .mtxt{background:var(--surface-2);border-bottom-left-radius:4px;color:var(--text)}',
    '.cmsg.user .mtxt{background:var(--primary,#E8001D);color:#fff;border-bottom-right-radius:4px}',
    // chips: una sola línea
    '.cop-chips{display:flex;gap:8px;margin-bottom:9px;overflow:hidden;flex-wrap:nowrap}',
    '.ccchip{flex:0 1 auto;min-width:0;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;color:var(--text);background:var(--surface);border:1px solid var(--border);padding:7px 13px;border-radius:999px;cursor:pointer;transition:all .12s;font-family:inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(12,12,14,.05)}',
    '.ccchip .cs{color:var(--primary,#E8001D);font-weight:700;flex-shrink:0}',
    '.ccchip:hover{border-color:var(--primary,#E8001D);color:var(--primary,#E8001D)}',
    '.cop.open .cop-chips{display:none}',
    // barra de entrada: + · textarea · enviar
    '.cop-bar{position:relative;display:flex;align-items:flex-end;gap:8px;background:var(--surface);border:1px solid var(--border-strong);border-radius:24px;padding:7px 7px 7px 8px;box-shadow:0 8px 30px rgba(12,12,14,.12)}',
    '.cop.open .cop-bar{border-radius:16px}',
    '.ci-add{width:38px;height:38px;border-radius:50%;border:1px solid var(--border);background:var(--surface);color:var(--text-muted,#636360);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:all .12s}',
    '.ci-add:hover{background:var(--surface-2);color:var(--text)}',
    '.cop-bar textarea{flex:1;border:none;outline:none;background:transparent;color:var(--text);font-family:inherit;font-size:15px;line-height:1.5;resize:none;max-height:130px;padding:9px 2px}',
    '.cop-bar textarea::placeholder{color:var(--text-subtle,#ADADAA)}',
    '.ci-send{width:38px;height:38px;border-radius:50%;border:none;background:var(--primary,#E8001D);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;transition:filter .12s,opacity .12s;opacity:.45}',
    '.ci-send.on{opacity:1}.ci-send.on:hover{filter:brightness(1.1)}',
    // minimizar arriba-derecha
    '.ci-min{position:absolute;top:1px;right:4px;width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--surface);color:var(--text-muted,#636360);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(12,12,14,.12);transition:all .12s;z-index:5}',
    '.ci-min:hover{background:var(--surface-2);color:var(--text)}',
    '.cop.open .ci-min{top:8px;right:8px}',
    // icono minimizado
    '.cop-min{position:fixed;right:24px;bottom:24px;z-index:95;pointer-events:auto;width:52px;height:52px;border-radius:50%;border:1px solid var(--border);background:var(--surface);box-shadow:0 10px 32px rgba(12,12,14,.22);display:none;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s}',
    '.cop-min:hover{transform:translateY(-2px)}',
    'body.cop-mini .cop-wrap{display:none}body.cop-mini .cop-min{display:flex}.cop-min svg{display:block}',
    '.cm-px{fill:rgba(232,0,29,.22);animation:cmSweep 3.4s ease-in-out infinite;animation-delay:calc(var(--o)*.12s)}',
    '@keyframes cmSweep{0%,82%,100%{fill:rgba(232,0,29,.22)}18%,55%{fill:var(--primary,#E8001D)}}',
    '.cop-min:hover .cm-px{animation:none;fill:var(--primary,#E8001D)}',
    '@media(max-width:560px){.cop{max-width:100%}.ccchip:nth-child(3){display:none}}'
  ].join('');
  document.head.appendChild(css);

  var chipsHtml = presets.map(function (p) {
    return '<button class="ccchip" data-q="' + p.replace(/"/g, '&quot;') + '"><span class="cs">✦</span> ' + p + '</button>';
  }).join('');

  var wrap = document.createElement('div');
  wrap.className = 'cop-wrap';
  wrap.innerHTML =
    '<div class="cop" id="arrCop">' +
      '<button class="ci-min" id="arrMin" title="Minimizar"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg></button>' +
      '<div class="cop-panel"><div class="cop-msgs" id="arrMsgs">' +
        '<div class="cmsg bot"><span class="mav">✦</span><div class="mtxt">Hola, soy arroba copilot. ¿En qué te ayudo en <b>' + pageName + '</b>?</div></div>' +
      '</div></div>' +
      '<div class="cop-chips" id="arrChips">' + chipsHtml + '</div>' +
      '<div class="cop-bar">' +
        '<button class="ci-add" id="arrAdd" title="Adjuntar ficheros"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></button>' +
        '<textarea id="arrTa" rows="1" placeholder="Escribe a arroba copilot…"></textarea>' +
        '<button class="ci-send" id="arrSend" title="Enviar"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' +
        '<input type="file" id="arrFile" multiple style="display:none"/>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var minBtn = document.createElement('button');
  minBtn.className = 'cop-min';
  minBtn.title = 'Abrir arroba copilot';
  minBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 36 36"></svg>';
  document.body.appendChild(minBtn);
  (function () {
    var G = ["..XXXX..", ".X....X.", "X..XX..X", "X.X..X.X", "X.X..X.X", "X..XXXXX", ".X......", "..XXXX.."];
    var cell = 3.4, ox = 5, oy = 5, s = '';
    for (var y = 0; y < G.length; y++) for (var x = 0; x < 8; x++) { if (G[y][x] === 'X') s += '<rect class="cm-px" style="--o:' + (x + y) + '" x="' + (ox + x * cell).toFixed(1) + '" y="' + (oy + y * cell).toFixed(1) + '" width="' + (cell - 0.7) + '" height="' + (cell - 0.7) + '" rx="0.7"/>'; }
    minBtn.querySelector('svg').innerHTML = s;
  })();

  var cop = document.getElementById('arrCop'), ta = document.getElementById('arrTa'), msgs = document.getElementById('arrMsgs'), send = document.getElementById('arrSend');
  document.getElementById('arrMin').onclick = function () {
    if (cop.classList.contains('open')) { cop.classList.remove('open'); ta.blur(); }
    else { document.body.classList.add('cop-mini'); }
  };
  minBtn.onclick = function () { document.body.classList.remove('cop-mini'); ta.focus(); };
  // contraído por defecto: solo el icono @ hasta que se use
  document.body.classList.add('cop-mini');
  document.getElementById('arrAdd').onclick = function () { document.getElementById('arrFile').click(); };
  document.getElementById('arrFile').onchange = function () { if (this.files.length) addMsg('user', '📎 ' + this.files.length + ' fichero(s) adjuntado(s)'); };
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'; send.classList.toggle('on', !!ta.value.trim()); });

  function addMsg(role, text) {
    var d = document.createElement('div'); d.className = 'cmsg ' + role;
    d.innerHTML = '<span class="mav">' + (role === 'bot' ? '✦' : 'D') + '</span><div class="mtxt"></div>';
    d.querySelector('.mtxt').textContent = text; msgs.appendChild(d);
    cop.classList.add('open'); msgs.parentElement.scrollTop = msgs.scrollHeight;
  }
  async function ask(q) {
    q = (q || ta.value || '').trim(); if (!q) return;
    ta.value = ''; ta.style.height = 'auto'; send.classList.remove('on'); addMsg('user', q);
    var typing = document.createElement('div'); typing.className = 'cmsg bot'; typing.innerHTML = '<span class="mav">✦</span><div class="mtxt">…</div>'; msgs.appendChild(typing); msgs.parentElement.scrollTop = msgs.scrollHeight;
    var ans;
    try {
      if (window.claude && window.claude.complete) {
        ans = await window.claude.complete('Eres arroba copilot, asistente de inteligencia económica de arroba.com (España). Te llamas "arroba copilot" (nunca "@Copilot" ni "Copilot" a secas). Tono de jefe de gabinete, conciso (3-5 frases), español, formato España. El usuario está en "' + pageName + '". Pregunta: ' + q);
      } else { ans = 'Estoy aquí para ayudarte en ' + pageName + '. (Conecta el motor de IA para respuestas en vivo.)'; }
    } catch (e) { ans = 'No he podido procesar la consulta ahora mismo.'; }
    typing.remove(); addMsg('bot', (ans || '').toString().trim() || 'De acuerdo.');
  }
  send.onclick = function () { ask(); };
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } });
  document.getElementById('arrChips').addEventListener('click', function (e) { var b = e.target.closest('.ccchip'); if (b) ask(b.getAttribute('data-q')); });

  // API pública: las cajas de búsqueda de las homes "entregan" su consulta aquí
  window.arrobaCopilot = {
    ask: function (q) { document.body.classList.remove('cop-mini'); ask(q); },
    prefill: function (q) {
      document.body.classList.remove('cop-mini');
      ta.value = q || ''; ta.dispatchEvent(new Event('input')); ta.focus();
      try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
      msgs.parentElement && ta.scrollIntoView({ block: 'nearest' });
    },
    focus: function () { document.body.classList.remove('cop-mini'); ta.focus(); }
  };
})();
