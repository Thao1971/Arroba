// arroba copilot — dock conversacional transversal (vanilla JS, sin dependencias)
// Se autoinyecta en cualquier página. Detecta el contexto por el <title> y usa
// window.claude.complete si está disponible; si no, responde con un fallback elegante.
(function () {
  if (window.__arrobaCopilot) return;
  window.__arrobaCopilot = true;

  var RED = '#E8001D';

  // Icono "@" — mosaico de píxeles (en línea con el logotipo de arroba)
  function arrobaSVG(size, id, glow) {
    var s = id || Math.random().toString(36).slice(2, 7);
    var grid = [
      "..XXXX..",
      ".X....X.",
      "X..XX..X",
      "X.X..X.X",
      "X.X..X.X",
      "X..XXXXX",
      ".X......",
      "..XXXX.."];
    var cell = 3.4, ox = 5, oy = 5, px = '';
    var idx = 0;
    for (var y = 0; y < grid.length; y++) {
      for (var x = 0; x < 8; x++) {
        if (grid[y][x] === 'X') {
          px += '<rect class="arrcop-px" style="--o:' + (x + y) + '" x="' + (ox + x * cell).toFixed(1) + '" y="' + (oy + y * cell).toFixed(1) + '" width="' + (cell - 0.7) + '" height="' + (cell - 0.7) + '" rx="0.7"/>';
          idx++;
        }
      }
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 36 36" fill="none" class="' + (glow ? 'arrcop-ribbon' : '') + '" style="display:block">' +
      px +
      '</svg>';
  }
  // Contexto de página: title sin sufijo "— arroba.com"
  var pageName = (document.title || 'arroba.com').replace(/\s*[—|·-]\s*arroba\.com.*$/i, '').trim() || 'arroba.com';

  // Sugerencias contextuales según la sección
  function presetsFor(name) {
    var n = name.toLowerCase();
    if (/analiza/.test(n)) return ['¿Qué sectores crecen más en España?', '¿Cómo encuentro empresas por criterios?', '¿Qué puedo analizar aquí?'];
    if (/valora/.test(n)) return ['¿Cómo se calcula una valoración?', '¿Qué múltiplos usa mi sector?', '¿Qué es el EV/EBITDA?'];
    if (/compra|vende/.test(n)) return ['¿Cómo encuentro compradores?', '¿Qué es un mandato de compra?', '¿Cómo inicio una venta?'];
    if (/investor/.test(n)) return ['¿Qué inversores encajan con mi compañía?', '¿Qué fondos tienen dry powder?', '¿Qué tesis sigue este inversor?'];
    if (/m&a|manda/.test(n)) return ['¿Qué múltiplos se pagan en mi sector?', '¿Qué operaciones ha habido este año?', '¿Quién está comprando ahora?'];
    if (/oportunidad|workbench|mis oportunidades/.test(n)) return ['¿Qué requiere mi atención hoy?', '¿Cómo avanza mi proceso?', 'Resume mis oportunidades activas'];
    if (/empresa|company/.test(n)) return ['Resume esta compañía', '¿Cuáles son sus riesgos?', '¿Quién podría comprarla?'];
    if (/sector/.test(n)) return ['¿Qué impulsa este sector?', '¿Dónde hay oportunidades de compra?', '¿Qué riesgos existen?'];
    if (/plan/.test(n)) return ['¿Qué plan me conviene?', '¿Cómo funcionan los créditos?', '¿Qué es el Success Fee?'];
    if (/registro|registration/.test(n)) return ['¿Qué necesito para registrarme?', '¿Qué es una Oportunidad?', '¿Tengo que pagar para empezar?'];
    return ['¿Qué puedo hacer en arroba?', '¿Cómo analizo una empresa?', '¿Cómo funcionan los planes?'];
  }

  // Enfoque contextual según la sección (qué capa prioriza, sin perder el resto)
  function focusFor(name) {
    var n = name.toLowerCase();
    if (/analiza/.test(n)) return 'Estás en Analiza: prioriza la Economic y Market Intelligence (macro, sectores, territorios, tendencias), sin perder el resto.';
    if (/valora/.test(n)) return 'Estás en Valora: prioriza la valoración (múltiplos, comparables, EV/EBITDA, rangos), apoyándote en Company y M&A Intelligence.';
    if (/compra|vende/.test(n)) return 'Estás en Compra/Vende: prioriza la M&A e Investor Intelligence (compradores, inversores, procesos, matching).';
    if (/investor/.test(n)) return 'Estás en Investor Intelligence: prioriza fondos, family offices, tesis y dry powder, cruzando con M&A y Company.';
    if (/m&a|m&a|manda/.test(n)) return 'Estás en M&A Intelligence: prioriza operaciones, múltiplos pagados y compradores activos.';
    if (/oportunidad|workbench|mis oportunidades/.test(n)) return 'Estás en Mis Oportunidades: prioriza el trabajo en curso, procesos, Data Rooms y próximas acciones.';
    if (/empresa|company/.test(n)) return 'Estás en una ficha de empresa: prioriza la Company Intelligence (cuentas, balance, gobierno, propiedad, señales) de esta compañía.';
    if (/sector/.test(n)) return 'Estás en una ficha sectorial: prioriza la Market Intelligence (magnitudes, concentración, M&A y joyas ocultas del sector).';
    if (/plan/.test(n)) return 'Estás en Planes: ayuda a elegir plan, explicar créditos y el modelo de éxito compartido (Finder/Success Fee).';
    if (/registro|registration/.test(n)) return 'Estás en el registro: ayuda a crear la cuenta y entender qué es una Oportunidad.';
    return 'Da una visión general de qué puede hacer arroba.';
  }

  var SYS = 'Eres arroba copilot, el único asistente de arroba.com (España). Tienes acceso a TODA la inteligencia de la plataforma, ' +
    'organizada en 5 capas: Economic Intelligence (casi 5.000 métricas macro), Market Intelligence (sectores y mercados), ' +
    'Company Intelligence (cuentas, balance, gobierno y propiedad de 3,3M de compañías), Investor Intelligence (fondos, family offices, compradores) ' +
    'y M&A Intelligence (operaciones, múltiplos, matching). Eres como un jefe de gabinete: ejecutivo, claro y conciso (3-5 frases). ' +
    'Hablas en español, con formato España (miles con punto, decimales con coma). La especialización es contextual e invisible: ' +
    'respondes con toda la inteligencia disponible pero CONTEXTUALIZAS según dónde está el usuario. ' + focusFor(pageName) + ' ' +
    'No inventes cifras concretas de empresas que no conozcas; si no tienes el dato, dilo y orienta sobre cómo obtenerlo en la plataforma.';

  // ---- estilos ----
  var css = document.createElement('style');
  css.textContent = [
    '@keyframes arrCopIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}',
    '@keyframes arrCopDot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}',
    '.arrcop-fab{transition:max-width .26s ease, padding .26s ease, background .2s ease, box-shadow .15s, transform .15s;max-width:54px;overflow:hidden;white-space:nowrap;background:transparent!important;box-shadow:none!important}',
    '.arrcop-fab:hover{max-width:250px;background:#0C0C0E!important;transform:translateY(-2px);box-shadow:0 14px 38px rgba(12,12,14,.4)!important}',
    '.arrcop-fab .arrcop-label{opacity:0;transition:opacity .2s ease .04s}',
    '.arrcop-fab:hover .arrcop-label{opacity:1}',
    '@keyframes arrcopIdle{0%,92%,100%{transform:translateY(0)}96%{transform:translateY(-3px)}}',
    '@keyframes arrcopSweep{0%{fill:rgba(232,0,29,.22)}18%{fill:#E8001D}55%{fill:#E8001D}82%{fill:rgba(232,0,29,.22)}100%{fill:rgba(232,0,29,.22)}}',
    '.arrcop-ribbon{animation:arrcopIdle 4.5s ease-in-out infinite}',
    '.arrcop-px{fill:rgba(232,0,29,.22);animation:arrcopSweep 3.4s ease-in-out infinite;animation-delay:calc(var(--o)*.12s)}',
    '.arrcop-fab:hover .arrcop-ribbon{animation:none}',
    '.arrcop-fab:hover .arrcop-px{animation:none;fill:#fff}',
    '.arrcop-send:hover{filter:brightness(1.08)}',
    '.arrcop-preset:hover{background:rgba(255,255,255,.1)!important;border-color:rgba(255,255,255,.25)!important}',
    '.arrcop-scroll::-webkit-scrollbar{width:6px}.arrcop-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:3px}'
  ].join('');
  document.head.appendChild(css);

  var root = document.createElement('div');
  root.id = 'arroba-copilot-root';
  document.body.appendChild(root);

  // Saludo inicial contextual según la sección
  function greetingFor(name) {
    var n = name.toLowerCase();
    if (/analiza/.test(n)) return 'Hola, soy arroba copilot. Aquí puedo ayudarte a analizar mercados, sectores y territorios de España, y encontrar empresas por los criterios que quieras. ¿Qué quieres explorar?';
    if (/valora/.test(n)) return 'Hola, soy arroba copilot. Puedo ayudarte a estimar el valor de una compañía, comparar múltiplos y entender qué factores mueven el precio en su sector. ¿Qué quieres valorar?';
    if (/compra|vende/.test(n)) return 'Hola, soy arroba copilot. Puedo ayudarte a encontrar empresas en venta, identificar compradores e inversores compatibles y preparar una operación. ¿Qué buscas?';
    if (/investor/.test(n)) return 'Hola, soy arroba copilot. Puedo ayudarte a identificar fondos, family offices e inversores activos en España y entender su tesis. ¿Qué inversor buscas?';
    if (/m&a|manda/.test(n)) return 'Hola, soy arroba copilot. Puedo ayudarte a seguir operaciones de M&A, múltiplos pagados y compradores activos en cada sector. ¿Qué operación quieres entender?';
    if (/oportunidad|workbench|mis oportunidades/.test(n)) return 'Hola, soy arroba copilot. He estado trabajando en tus operaciones mientras no estabas. ¿Quieres que te ponga al día de lo que requiere tu atención?';
    if (/empresa|company/.test(n)) return 'Hola, soy arroba copilot. Puedo resumir esta compañía, analizar sus cuentas y gobierno, estimar su valor o identificar quién podría comprarla. ¿Qué quieres saber de ella?';
    if (/sector/.test(n)) return 'Hola, soy arroba copilot. Puedo explicarte qué mueve este sector, su concentración, sus múltiplos de M&A y dónde están las oportunidades. ¿Qué quieres saber?';
    if (/mapa/.test(n)) return 'Hola, soy arroba copilot. Puedo ayudarte a leer el mapa empresarial de España: dónde se concentra cada sector, qué territorios crecen y dónde hay oportunidades. ¿Qué territorio o sector te interesa?';
    if (/plan/.test(n)) return 'Hola, soy arroba copilot. Puedo ayudarte a elegir el plan que encaja con tu forma de trabajar y explicarte cómo funcionan los créditos y el modelo de éxito compartido. ¿Qué te gustaría saber?';
    if (/registro|registration/.test(n)) return 'Hola, soy arroba copilot. Te acompaño en el registro y te explico cómo arroba convierte tu objetivo en una Oportunidad. ¿Empezamos?';
    return 'Hola, soy arroba copilot. Tengo toda la inteligencia económica y transaccional de España: puedo ayudarte a analizar, valorar y decidir sobre cualquier compañía. ¿En qué estás trabajando?';
  }

  var open = false, loading = false;
  var msgs = [{ role: 'agent', text: greetingFor(pageName) }];

  function el(tag, style, props) {
    var e = document.createElement(tag);
    if (style) e.setAttribute('style', style);
    if (props) for (var k in props) e[k] = props[k];
    return e;
  }

  function render() {
    root.innerHTML = '';
    if (!open) {
      var fab = el('button', 'position:fixed;bottom:24px;right:24px;z-index:2147483000;display:inline-flex;align-items:center;gap:9px;padding:7px;border-radius:999px;border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit');
      fab.className = 'arrcop-fab';
      fab.title = 'arroba copilot';
      fab.innerHTML = '<span style="width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' + arrobaSVG(40, 'fab', true) + '</span><span class="arrcop-label" style="padding-right:8px">arroba copilot</span>';
      fab.onclick = function () { open = true; render(); };
      root.appendChild(fab);
      return;
    }

    var panel = el('div', 'position:fixed;bottom:24px;right:24px;z-index:2147483000;width:min(420px,calc(100vw - 32px));background:#0C0C0E;border:1px solid #2E2E2C;border-radius:16px;overflow:hidden;box-shadow:0 18px 56px rgba(12,12,14,.45);font-family:inherit;animation:arrCopIn .22s ease both');

    // header
    var head = el('div', 'padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:13px');
    head.innerHTML =
      '<div style="width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + arrobaSVG(26, 'hd') + '</div>' +
      '<div style="flex:1"><div style="font-size:15px;font-weight:700;color:#fff">arroba copilot</div>' +
      '<div style="font-size:11.5px;color:rgba(255,255,255,.45)">Tu jefe de gabinete · ' + pageName + '</div></div>';
    var close = el('button', 'width:30px;height:30px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;font-size:14px;line-height:1', { innerHTML: '✕' });
    close.onclick = function () { open = false; render(); };
    head.appendChild(close);
    panel.appendChild(head);

    // body
    var body = el('div', 'max-height:min(46vh,360px);overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:13px');
    body.className = 'arrcop-scroll';
    msgs.forEach(function (m) {
      var row = el('div', 'display:flex;gap:9px;justify-content:' + (m.role === 'user' ? 'flex-end' : 'flex-start'));
      if (m.role === 'agent') row.appendChild(el('div', 'width:25px;height:25px;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px', { innerHTML: arrobaSVG(20) }));
      var bub = el('div', 'max-width:80%;padding:10px 14px;border-radius:' + (m.role === 'user' ? '13px 13px 4px 13px' : '13px 13px 13px 4px') + ';background:' + (m.role === 'user' ? RED : 'rgba(255,255,255,.06)') + ';color:' + (m.role === 'user' ? '#fff' : 'rgba(255,255,255,.92)') + ';font-size:13px;line-height:1.6;border:' + (m.role === 'agent' ? '1px solid rgba(255,255,255,.08)' : 'none') + ';white-space:pre-wrap');
      bub.textContent = m.text;
      row.appendChild(bub);
      body.appendChild(row);
    });
    if (loading) {
      var lr = el('div', 'display:flex;gap:9px');
      lr.appendChild(el('div', 'width:25px;height:25px;flex-shrink:0;display:flex;align-items:center;justify-content:center', { innerHTML: arrobaSVG(20) }));
      var dots = el('div', 'padding:12px 15px;border-radius:13px 13px 13px 4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);display:flex;gap:5px');
      dots.innerHTML = [0, 1, 2].map(function (j) { return '<span style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);animation:arrCopDot .8s ' + (j * 0.15) + 's infinite"></span>'; }).join('');
      lr.appendChild(dots);
      body.appendChild(lr);
    }
    panel.appendChild(body);

    // presets (solo al inicio)
    if (msgs.length <= 1 && !loading) {
      var pr = el('div', 'padding:0 20px 12px;display:flex;gap:8px;flex-wrap:wrap');
      presetsFor(pageName).forEach(function (p) {
        var b = el('button', 'padding:8px 12px;border-radius:8px;font-size:12px;font-weight:500;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.72);cursor:pointer;font-family:inherit', { textContent: p });
        b.className = 'arrcop-preset';
        b.onclick = function () { send(p); };
        pr.appendChild(b);
      });
      panel.appendChild(pr);
    }

    // input
    var foot = el('div', 'padding:13px 20px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px');
    var input = el('input', 'flex:1;padding:11px 15px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff;font-size:13px;outline:none;font-family:inherit', { placeholder: 'Pregunta a arroba copilot…', value: draft });
    input.oninput = function () { draft = input.value; };
    input.onkeydown = function (e) { if (e.key === 'Enter') send(); };
    var sendBtn = el('button', 'padding:11px 18px;border-radius:10px;border:none;background:' + RED + ';color:#fff;font-size:15px;cursor:pointer;font-weight:600', { innerHTML: '→' });
    sendBtn.className = 'arrcop-send';
    sendBtn.onclick = function () { send(); };
    foot.appendChild(input); foot.appendChild(sendBtn);
    panel.appendChild(foot);

    root.appendChild(panel);
    if (!loading) setTimeout(function () { input.focus(); body.scrollTop = body.scrollHeight; }, 30);
    else body.scrollTop = body.scrollHeight;
  }

  var draft = '';
  async function send(text) {
    var q = (text || draft || '').trim();
    if (!q || loading) return;
    draft = '';
    msgs.push({ role: 'user', text: q });
    loading = true; render();
    var answer;
    try {
      if (window.claude && window.claude.complete) {
        var hist = msgs.filter(function (m) { return m.role === 'user' || m.role === 'agent'; }).slice(-6)
          .map(function (m) { return (m.role === 'user' ? 'Usuario' : 'arroba copilot') + ': ' + m.text; }).join('\n');
        answer = await window.claude.complete(SYS + '\n\nConversación:\n' + hist + '\n\narroba copilot:');
      } else {
        answer = 'Estoy aquí para ayudarte con el análisis económico y las operaciones en ' + pageName + '. (Conecta el motor de IA para respuestas en vivo.)';
      }
    } catch (e) {
      answer = 'No he podido procesar la consulta ahora mismo. Inténtalo de nuevo en un momento.';
    }
    loading = false;
    msgs.push({ role: 'agent', text: (answer || '').toString().trim() || 'De acuerdo.' });
    render();
  }

  render();
})();
