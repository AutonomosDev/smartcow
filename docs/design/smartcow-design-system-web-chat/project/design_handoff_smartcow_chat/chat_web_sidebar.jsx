// Sidebar — clone Claude Code left panel
const Sidebar = ({ open, onClose }) => {
  const I = window.Ico;

  return (
    <>
      {open && <div className="sb-backdrop" onClick={onClose}/>}
      <div className={`sidebar ${open?'open':''}`}>

        <div className="sb-tabs-row">
          <div className="sb-tab" title="Chats">{I.chat({s:15})}</div>
          <div className="sb-tab" title="Tareas">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h16"/></svg>
          </div>
          <div className="sb-tab code" title="Code">
            <span style={{fontSize:'11px'}}>&lt;/&gt;</span>
            <span>Code</span>
          </div>
        </div>

        <div className="sb-top-menu">
          <div className="sb-mi">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>New session</span>
          </div>
          <div className="sb-mi">
            {I.zap({s:14})}
            <span>Routines</span>
          </div>
          <div className="sb-mi">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><rect x="3" y="7" width="18" height="13" rx="2"/></svg>
            <span>Customize</span>
          </div>
          <div className="sb-mi">
            {I.chevron({s:14})}
            <span>More</span>
          </div>
        </div>

        <div className="sb-scroll">
          <div className="sb-sec">Pinned</div>
          <div className="sb-item muted">
            <span className="ic">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5M9 10.76V6a3 3 0 0 1 6 0v4.76c0 .77.26 1.52.74 2.12L19 17H5l3.26-4.12c.48-.6.74-1.35.74-2.12Z"/></svg>
            </span>
            <span className="lbl">Drag to pin</span>
          </div>

          <div className="sb-sec">smartcow_prod</div>
          <div className="sb-item active">
            <span className="ic"><SessionDot active/></span>
            <span className="lbl">Initialize project setup</span>
          </div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Importar Excels AgroApp</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Schema Drizzle — tratamientos</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Add standup command functionality</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Fix DIIO resolver bajas</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Revisar partos duplicados</span></div>

          <div className="sb-sec">agroapp_scraper</div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Puppeteer login flow</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Extraer Ventas_Historial</span></div>

          <div className="sb-sec">fundos_chile</div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Resolver predios Mediería</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Los Aromos — resumen semanal</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Normalizar nombres fundos (lowercase)</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Plan vacunación Q2 2026</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Reporte movimientos marzo</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Auditoría tratamientos ISA</span></div>
          <div className="sb-item"><span className="ic"><SessionDot/></span><span className="lbl">Integración con SAG</span></div>
        </div>

        <div className="sb-foot">
          <div className="uic">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
          </div>
          <span className="name">César</span>
          <div className="theme" title="Tema">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          </div>
        </div>
      </div>
    </>
  );
};

const SessionDot = ({ active }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeDasharray={active?"0":"2 2.5"}>
    <circle cx="12" cy="12" r="8"/>
    {active && <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>}
  </svg>
);

window.Sidebar = Sidebar;
