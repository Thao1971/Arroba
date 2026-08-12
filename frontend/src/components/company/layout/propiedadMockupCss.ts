/**
 * PROPIEDAD_MOCKUP_CSS · HARDENING-018 (2026-08-13)
 *
 * CSS calcado 1:1 del mockup canónico `ficha-empresa-f01.html` para la sección
 * Propiedad — 3 vistas (`#ownTree`, `#ownList`, `#ownGraph`) + selector `#ownSeg`
 * + motor de grafo interactivo (`.ig-*`) + tarjetas `.onode`/`.pnode` +
 * banner `.own-impl`.
 *
 * Alcance: sólo estilos de la sección Propiedad y el motor `interactiveGraph`.
 * El resto del sistema `.afk` sigue en `fichaMockupCss.ts`.
 */
export const PROPIEDAD_MOCKUP_CSS = `
/* ========== Selector de vistas #ownSeg ========== */
.segtiny{display:inline-flex;background:var(--n100);border-radius:8px;padding:3px;gap:2px;margin-bottom:18px}
.segtiny button{border:0;background:transparent;padding:6px 13px;border-radius:6px;font-size:12.5px;font-weight:600;color:var(--n500);cursor:pointer;font-family:var(--font);display:inline-flex;align-items:center;gap:6px}
.segtiny button.on{background:var(--n0);color:var(--n900);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.segtiny button svg{width:13px;height:13px}

/* ========== Propiedad · Tab Árbol ========== */
@keyframes revUp{to{opacity:1;transform:none}}
.own-th{display:flex;align-items:center;gap:8px;margin-bottom:10px;margin-top:6px}
.own-th b{font-size:11.5px;font-weight:700;color:var(--n500)}
.own-th .cnt{font-size:10.5px;font-weight:600;color:var(--n500);background:var(--n100);border:1px solid var(--n200);padding:1px 7px;border-radius:10px}
.own-th .mut{font-size:10.5px;color:var(--n400)}

.ownbar2{display:flex;height:12px;border-radius:6px;overflow:hidden;margin-bottom:14px}
.ownbar2 i{display:block;height:100%;transition:width .9s cubic-bezier(.3,.7,.3,1)}

.own-g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
@media (max-width:820px){.own-g{grid-template-columns:repeat(2,1fr)}}
@media (max-width:520px){.own-g{grid-template-columns:1fr}}

.onode{background:var(--n0);border:1px solid var(--n200);border-radius:11px;padding:12px 14px}
.onode.hl{border-color:var(--red-tint2,#ffd6d6);background:var(--red-tint,#fff1f1)}
.onode .dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:7px;vertical-align:middle}
.onode .nn{font-size:12.5px;font-weight:700;color:var(--n900)}
.onode .nr{font-size:10.5px;color:var(--n500);margin-top:3px}
.onode .np{font-size:16px;font-weight:800;color:var(--n900);margin-top:7px;font-variant-numeric:tabular-nums}
.onode.hl .np{color:var(--red)}

.own-stem{width:2px;height:26px;background:var(--n200);margin:0 auto}
.own-ent{display:flex;justify-content:center}
.own-ent .box{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#1c1a18,#34302b);border-radius:14px;padding:16px 24px;min-width:340px}
.own-ent .lg{width:44px;height:44px;border-radius:11px;background:rgba(255,87,87,.14);border:1px solid rgba(255,87,87,.35);display:grid;place-items:center;font-size:16px;font-weight:800;color:var(--red);flex-shrink:0}
.own-ent .en{font-size:15px;font-weight:800;color:#fff}
.own-ent .em{font-size:11.5px;color:rgba(255,255,255,.6);margin-top:2px}

.pnode{display:block;background:var(--n0);border:1px solid var(--n200);border-radius:11px;padding:12px 14px;transition:border-color .12s,box-shadow .12s;cursor:pointer;text-decoration:none;color:inherit}
.pnode:hover{border-color:var(--red-tint2,#ffd6d6);box-shadow:0 0 0 1px var(--red-tint2,#ffd6d6),0 8px 20px rgba(20,18,16,.06)}
.pnode .ph{display:flex;align-items:center;gap:9px;margin-bottom:8px}
.pnode .pi{width:30px;height:30px;border-radius:8px;background:var(--red-tint,#fff1f1);color:var(--red-hover,#E84545);display:grid;place-items:center;flex-shrink:0}
.pnode .pi svg{width:16px;height:16px}
.pnode .pn{font-size:12.5px;font-weight:700;color:var(--n900);flex:1;line-height:1.2}
.pnode .pr{display:flex;align-items:center;justify-content:space-between;gap:6px}
.pnode .pa{font-size:10.5px;color:var(--n500)}
.pnode .pp{font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;font-variant-numeric:tabular-nums}
.pnode .pp.ctrl{color:var(--red-hover,#E84545);background:var(--red-tint,#fff1f1)}
.pnode .pp.min{color:var(--warn,#C77D18);background:var(--warn-tint,#FFF5E5)}

.own-impl{margin-top:16px;display:flex;align-items:center;gap:12px;background:var(--red-tint,#fff1f1);border:1px solid var(--red-tint2,#ffd6d6);border-radius:8px;padding:11px 15px}
.own-impl span.t{font-size:13px;color:var(--n700);flex:1}
.own-impl .lk2{font-size:13px;color:var(--red-hover,#E84545);font-weight:650;white-space:nowrap;cursor:pointer;text-decoration:none}
.own-impl .lk2:hover{text-decoration:underline}

/* ========== Propiedad · Tab Distribución ========== */
.owbar{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--n100)}
.owbar:last-child{border:0}
.owbar .obn{width:230px;font-size:13px;color:var(--n800);display:flex;align-items:center;gap:8px}
.owbar .obt{flex:1;height:9px;border-radius:5px;background:var(--n100);overflow:hidden}
.owbar .obt i{display:block;height:100%;background:var(--red);width:0;animation:owbFill .9s cubic-bezier(.2,.7,.3,1) forwards}
.owbar .obp{width:52px;text-align:right;font-weight:750;color:var(--n900);font-variant-numeric:tabular-nums}
.owbar .obtag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--n400)}
@keyframes owbFill{from{width:0}to{width:var(--w,0%)}}

/* ========== Propiedad · Tab Grafo · motor interactiveGraph ========== */
.ig-node{opacity:0;animation:igIn .45s ease forwards;animation-delay:var(--d);transition:opacity .15s}
.ig-node circle{transition:opacity .15s}
.ig-node.ig-dim{opacity:.2}
.ig-edge{transition:opacity .15s,stroke-width .15s}
.ig-edge.ig-hot{stroke-width:3.4}
@keyframes igIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes rdIn{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.rd-poly{animation:rdIn .7s cubic-bezier(.3,.7,.3,1)}
.ig-ctl{position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:5px;z-index:4}
.ig-ctl button{width:30px;height:30px;border-radius:8px;border:1px solid var(--n200);background:var(--n0);color:var(--n600);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,.08);line-height:1}
.ig-ctl button:hover{background:var(--n100);color:var(--n900);border-color:var(--n300)}
.ig-plus{opacity:.9}
#ownGraph #controlGraph{position:relative;min-height:290px}
`;
