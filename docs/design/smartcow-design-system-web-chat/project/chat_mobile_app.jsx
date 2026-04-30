// Mobile chat app — chat panel + report overlay with swipe-back
const { useState, useEffect, useRef } = React;

const App = () => {
  const I = window.Ico;
  const [reportOpen, setReportOpen] = useState(false);
  const [reportKind, setReportKind] = useState('informe');
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState('puro');
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [parallax, setParallax] = useState(true);
  const [autoOpen, setAutoOpen] = useState(true);

  const reportRef = useRef(null);
  const chatRef = useRef(null);
  const dragRef = useRef({ active:false, startX:0, dx:0 });

  useEffect(() => {
    try {
      const s = localStorage.getItem('sc_mobile_mode');
      if (s) setMode(s);
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('sc_mobile_mode', mode); } catch {} }, [mode]);

  const mono = mode === 'puro';

  const openReport = (kind='informe') => {
    setReportKind(kind);
    if (autoOpen) {
      setGenerating(true);
      setTimeout(() => {
        setReportOpen(true);
        setTimeout(() => setGenerating(false), 350);
      }, 900);
    } else {
      setReportOpen(true);
    }
  };
  const closeReport = () => setReportOpen(false);

  // Swipe-back on report panel
  useEffect(() => {
    const el = reportRef.current;
    if (!el) return;
    const onDown = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const rect = el.getBoundingClientRect();
      const relX = t.clientX - rect.left;
      if (relX < 28) {
        dragRef.current = { active:true, startX:t.clientX, dx:0 };
        el.classList.add('dragging');
        if (chatRef.current) chatRef.current.classList.add('dragging');
      }
    };
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = Math.max(0, t.clientX - dragRef.current.startX);
      dragRef.current.dx = dx;
      el.style.transform = `translateX(${dx}px)`;
      if (chatRef.current) {
        const pct = Math.min(1, dx / 390);
        const base = parallax ? -18 : 0;
        chatRef.current.style.transform = `translateX(${base * (1 - pct)}%)`;
      }
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      const dx = dragRef.current.dx;
      el.style.transform = '';
      if (chatRef.current) chatRef.current.style.transform = '';
      el.classList.remove('dragging');
      if (chatRef.current) chatRef.current.classList.remove('dragging');
      dragRef.current.active = false;
      if (dx > 80) setReportOpen(false);
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('touchstart', onDown, { passive:true });
    window.addEventListener('touchmove', onMove, { passive:true });
    window.addEventListener('touchend', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [reportOpen, parallax]);

  return (
    <div className="stage">
      <div className="phone">
        <div className="screen">
          <div className="island"/>
          <div className="sbar">
            <span>9:41</span>
            <div className="r">
              <svg viewBox="0 0 17 12"><path d="M2.6 8.4a8.5 8.5 0 0 1 12 0l1-1a9.9 9.9 0 0 0-14 0l1 1ZM5 10.8a5 5 0 0 1 7.1 0l1-1a6.4 6.4 0 0 0-9 0l1 1ZM8.5 13.2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="#000"/></svg>
              <div className="bat"><div className="bat-fill"/></div>
            </div>
          </div>

          <div className={`panels ${reportOpen ? 'report-open' : ''}`} style={!parallax ? {'--no-px':1}:{}}>
            {/* Chat panel */}
            <div ref={chatRef} className="panel panel-chat" style={!parallax && reportOpen ? {transform:'translateX(0)', filter:'none'} : undefined}>
              <div className="chat-top">
                <div className="avatar"><img src="assets/cow_robot.png" alt="SmartCow"/></div>
                <div className="info">
                  <div className="name">SmartCow</div>
                  <div className="meta">Los Aromos · jferrada</div>
                </div>
                <div className="icbtn">{I.search({s:16})}</div>
                <div className="icbtn">{I.hamburger({s:16})}</div>
              </div>

              <div className="chat-body scroll-body">
                <div className="u-msg">resumen de los últimos 7 días</div>

                <div className="routine-chip">
                  {I.play({s:10})}
                  <span>Routine · resumen-semanal · 14–20 abr</span>
                </div>

                <div className={`a-prose ${mono?'mono':''}`}>
                  8 partos sin distocia, 22 egresos a Loncoche, alertas resueltas a tiempo. Dejé el detalle completo en el informe.
                </div>

                <div className="note">
                  <div className="note-hd">
                    <div className="ttl">SEMANA — LOS AROMOS</div>
                    <div className="copy">{I.copy({s:12})}</div>
                  </div>
                  <hr className="note-rule"/>
                  <ol>
                    <li><b>Partos</b> · 8 · 0 distocia · <span className="ok">OK</span></li>
                    <li><b>Egresos</b> · 22 · +4.2% peso vs sem ant</li>
                    <li><b>Alertas</b> · <span className="warn">3 atendidas</span> &lt; 1h</li>
                    <li><b>GDP Central</b> · 1.12 kg/d · <span className="ok">+0.08</span></li>
                  </ol>
                </div>

                <button className="open-report-btn" onClick={() => openReport('informe')}>
                  Ver informe completo {I.arrowRight({s:13})}
                </button>

                <div className="a-actions">
                  <div className="a-act">{I.copy({s:12})}</div>
                  <div className="a-act">{I.refresh({s:12})}</div>
                  <div className="a-act">{I.bookmark({s:12})}</div>
                </div>

                <div className="u-msg"><span className="cmd">/plan</span> vacunación mayo</div>

                <div className={`a-prose ${mono?'mono':''}`} style={{marginTop:-4}}>
                  Armé el plan: 3 tandas (6, 8 y 17 may), 542 dosis IBR/DVB, costo total $1.53M. Dr. Méndez confirmado.<span className="caret"/>
                </div>
                <button className="open-report-btn" onClick={() => openReport('plan')}>
                  Ver plan vacunación {I.arrowRight({s:13})}
                </button>
              </div>

              <div className="comp-wrap">
                <div className="ds-pill">
                  {I.database({s:12})}
                  <b>Los Aromos</b>
                  <span className="arr">→</span>
                  <span className="src">Partos 2024</span>
                  <span className="rows">+8 filas</span>
                </div>
                <div className="slash-row">
                  <div className="chip">/resumen</div>
                  <div className="chip">/plan</div>
                  <div className="chip">/alerta</div>
                  <div className="chip">/buscar</div>
                  <div className="chip">/comparar</div>
                </div>
                <div className="input-box">
                  <div className="ic">{I.paperclip({s:14})}</div>
                  <span className="prompt">Preguntá algo a SmartCow…</span>
                  <div className="ic">{I.mic({s:14})}</div>
                  <div className="ic send" onClick={() => openReport('informe')}>{I.arrowRight({s:14})}</div>
                </div>
              </div>
            </div>

            {/* Report panel */}
            <div ref={reportRef} className="panel panel-report">
              <div className="edge-hint"/>
              <div className="rpt-top">
                <div className="back" onClick={closeReport}>{I.chevron({s:18, left:true})}</div>
                <div className="info">
                  <div className="kind">{reportKind==='informe'?'Informe':reportKind==='plan'?'Plan':'Reporte'}</div>
                  <div className="title">{
                    reportKind==='informe' ? 'Semana 14–20 abr' :
                    reportKind==='plan' ? 'Vacunación IBR/DVB · mayo' : 'Partos 2024'
                  }</div>
                </div>
                <div className="act">{I.save({s:15})}</div>
                <div className="act">{I.share({s:15})}</div>
                <div className="act">{I.more({s:15})}</div>
              </div>

              <div className="rpt-body scroll-body">
                {reportKind === 'informe' && <Informe I={I}/>}
                {reportKind === 'plan' && <Plan I={I}/>}
              </div>

              <div className={`gen-overlay ${generating?'on':''}`}>
                <div className="gen-ring"/>
                <div className="gen-t">Armando informe…</div>
                <div className="gen-s">Leyendo AgroApp · Partos · Tratamientos · Egresos</div>
              </div>

              {/* FAB chat button — back to conversation */}
              <div className="fab" onClick={closeReport} title="Volver al chat">
                {I.chat({s:22})}
                <div className="badge">2</div>
              </div>
            </div>
          </div>

          {/* Back chevron icon — needs a left-pointing chevron, monkey-patch */}
          <div className="home-ind"/>
        </div>
      </div>

      <div className="caption">
        {reportOpen
          ? '← swipe desde el borde izquierdo (o tap FAB) para volver al chat'
          : 'Tap "Ver informe completo" para abrir el reporte desde la derecha'}
      </div>

      {/* Tweaks */}
      <div className="tw-fab" onClick={() => setTweaksOpen(o=>!o)}>
        {I.sliders({s:12})} Tweaks
      </div>
      {tweaksOpen && (
        <div className="tw-panel">
          <h4>Apariencia</h4>
          <div className="tw-row">
            <span className="lbl">Respuestas</span>
            <div className="tw-seg">
              <div className={`o ${mode==='puro'?'on':''}`} onClick={() => setMode('puro')}>Notebook puro</div>
              <div className={`o ${mode==='hibrido'?'on':''}`} onClick={() => setMode('hibrido')}>Híbrido</div>
            </div>
          </div>

          <h4 style={{marginTop:14}}>Comportamiento</h4>
          <div className="tw-toggle">
            <span>Parallax del chat al abrir</span>
            <div className={`tw-switch ${parallax?'on':''}`} onClick={() => setParallax(p=>!p)}/>
          </div>
          <div className="tw-toggle">
            <span>Auto-abrir reporte al generar</span>
            <div className={`tw-switch ${autoOpen?'on':''}`} onClick={() => setAutoOpen(a=>!a)}/>
          </div>
          <div className="tw-toggle">
            <span>Reporte abierto</span>
            <div className={`tw-switch ${reportOpen?'on':''}`} onClick={() => reportOpen ? closeReport() : openReport('informe')}/>
          </div>
          <div style={{fontSize:10,color:'#999',marginTop:8,fontFamily:"'JetBrains Mono'",lineHeight:1.5}}>
            El reporte se desliza desde la derecha. Swipe desde el borde izquierdo del reporte (&lt;28px) lo devuelve al chat. FAB verde = atajo.
          </div>
        </div>
      )}
    </div>
  );
};

// ── REPORT CONTENT ────────────────────────────────
const Informe = ({I}) => (
  <>
    <h1 className="rpt-h1">Informe operativo</h1>
    <div className="rpt-sub">Los Aromos · 14–20 abr 2024<br/>jferrada · generado 21 abr 06:30</div>
    <div className="rpt-chips">
      <span className="rpt-chip">542 animales</span>
      <span className="rpt-chip">4 lotes</span>
      <span className="rpt-chip">8 partos</span>
      <span className="rpt-chip">22 egresos</span>
    </div>

    <h2 className="rpt-h2">Resumen ejecutivo</h2>
    <p className="rpt-p">Semana estable sin incidentes críticos. Engorda Central por sobre promedio, 8 partos sin distocia, sanidad bajo control. Tres puntos requieren decisión esta semana.</p>

    <div className="rpt-kpi-row">
      <div className="rpt-kpi"><div className="l">Partos</div><div className="v">8</div><div className="d">+2 vs prev</div></div>
      <div className="rpt-kpi"><div className="l">Egresos kg</div><div className="v">10.6k</div><div className="d">22 cab</div></div>
      <div className="rpt-kpi"><div className="l">GDP Ctr</div><div className="v">1.12</div><div className="d">+0.08</div></div>
    </div>

    <h2 className="rpt-h2">Alertas atendidas</h2>
    <div className="rpt-block">
      <table className="rpt-tbl">
        <thead><tr><th>Día</th><th>Alerta</th><th>Por</th><th>t</th></tr></thead>
        <tbody>
          <tr><td>Mar</td><td>Bebedero C3</td><td>Jaime</td><td className="num">13m</td></tr>
          <tr><td>Mié</td><td>Cerco Norte</td><td>Pedro</td><td className="num">52m</td></tr>
          <tr><td>Vie</td><td>Silo A 18%</td><td>Cesar</td><td className="num">3h</td></tr>
        </tbody>
      </table>
    </div>

    <h2 className="rpt-h2">Lotes — GDP</h2>
    <div className="rpt-block">
      <table className="rpt-tbl">
        <thead><tr><th>Lote</th><th>n</th><th>GDP</th><th>Δ 4sem</th></tr></thead>
        <tbody>
          <tr><td>Central</td><td className="num">186</td><td className="num">1.12</td><td className="num" style={{color:'#1e3a2f'}}>+.08</td></tr>
          <tr><td>Feedlot C3</td><td className="num">120</td><td className="num">1.35</td><td className="num" style={{color:'#1e3a2f'}}>+.11</td></tr>
          <tr><td>Oeste</td><td className="num">94</td><td className="num">0.78</td><td className="num" style={{color:'#9b5e1a'}}>−.04</td></tr>
          <tr><td>Sur</td><td className="num">42</td><td>—</td><td>—</td></tr>
        </tbody>
      </table>
    </div>

    <h2 className="rpt-h2">Requiere decisión</h2>
    <div className="rpt-alert">
      {I.alert({s:13})}
      <div><b>Oeste bajó GDP 4%</b> — inspección Jaime + muestreo sangre esta semana.</div>
    </div>
    <div className="rpt-alert">
      {I.alert({s:13})}
      <div><b>2 preñeces vencen 29 abr</b> sin arete de cría asignado.</div>
    </div>
    <div className="rpt-alert">
      {I.alert({s:13})}
      <div><b>FAV-2411 vencida</b> · $4.8M · Veterinaria del Sur.<span className="caret"/></div>
    </div>
  </>
);

const Plan = ({I}) => (
  <>
    <h1 className="rpt-h1">Plan vacunación · mayo</h1>
    <div className="rpt-sub">542 animales · 3 tandas · ventana 6–17 mayo<br/>IBR/DVB · Dr. Méndez confirmado</div>

    <div className="rpt-block">
      <div className="hd">Tanda 1 · Lun 6 may 07:00</div>
      <table className="rpt-tbl"><tbody>
        <tr><td>Animales</td><td className="num">186</td></tr>
        <tr><td>Lote</td><td>Central</td></tr>
        <tr><td>Responsable</td><td>Jaime + Méndez</td></tr>
      </tbody></table>
    </div>

    <div className="rpt-block">
      <div className="hd">Tanda 2 · Mié 8 may 07:00</div>
      <table className="rpt-tbl"><tbody>
        <tr><td>Animales</td><td className="num">214</td></tr>
        <tr><td>Lote</td><td>Feedlot + Oeste</td></tr>
        <tr><td>Responsable</td><td>Pedro + Méndez</td></tr>
      </tbody></table>
    </div>

    <div className="rpt-block">
      <div className="hd">Tanda 3 · Vie 17 may 07:00</div>
      <table className="rpt-tbl"><tbody>
        <tr><td>Animales</td><td className="num">142</td></tr>
        <tr><td>Lote</td><td>Sur + terneros</td></tr>
        <tr><td>Responsable</td><td>Jaime + Méndez</td></tr>
      </tbody></table>
    </div>

    <h2 className="rpt-h2">Costos</h2>
    <div className="rpt-block">
      <table className="rpt-tbl"><tbody>
        <tr><td>Vacuna 542 × $1.850</td><td className="num">$1.003k</td></tr>
        <tr><td>Méndez (3 visitas)</td><td className="num">$450k</td></tr>
        <tr><td>Insumos manga</td><td className="num">$80k</td></tr>
        <tr style={{fontWeight:600}}><td>Total</td><td className="num">$1.533k</td></tr>
      </tbody></table>
    </div>
    <div className="rpt-alert">
      {I.alert({s:13})}
      <div>Confirmar stock con Veterinaria del Sur antes del 30 abr.<span className="caret"/></div>
    </div>
  </>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
