// Artifact panel — exact clone of the Plan document
const Artifact = ({ visible, onHide }) => {
  const I = window.Ico;
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [copyOpen, setCopyOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(null);
  const [copied, setCopied] = React.useState(null);
  if (!visible) return null;

  const startSave = (key) => {
    setSaving(key);
    setTimeout(() => { setSaving(null); setSaveOpen(false); }, 1800);
  };
  const doCopy = (key) => {
    setCopied(key);
    setTimeout(() => { setCopied(null); setCopyOpen(false); }, 1200);
  };

  return (
    <>
      <div className="art-top">
        <span className="kind">Informe</span>
        <div className="right">
          <div className="a" title="Guardar" onClick={()=>setSaveOpen(true)}> {I.folder({s:15})}<span className="caret">▾</span></div>
          <div className="a" title="Copiar" onClick={()=>setCopyOpen(true)}>{I.copy({s:14})}</div>
          <div className="a" title="Cerrar" onClick={onHide}>{I.x({s:15})}</div>
          <div className="a" title="Layout">{I.sidebarRight({s:15})}<span className="caret">▾</span></div>
        </div>
      </div>

      <div className="art-comment-bar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>
        Select any text to leave a comment for Claude
      </div>

      <div className="art-scroll">
        <div className="art-inner">

          <h1 className="art-h1">Informe pesajes vaquillas FT — Los Aromos · abr 2026</h1>
          <p className="art-p lead">4° pesaje del ciclo · <b>523 vaquillas</b> · GDP fundo <b>1.14 kg/d</b> (target 1.20). Tres lotes en rango, FT-3 en adaptación.</p>

          <div className="art-block">
            <div className="hd">
              <span>GDP por lote · pesaje 09-04-2026</span>
              <span className="src">Target 1.20 kg/d · n=523</span>
            </div>
            <table className="art-tbl">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th className="num">Animales</th>
                  <th className="num">Peso prom</th>
                  <th className="num">GDP kg/d</th>
                  <th className="num">Δ vs target</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>FT-1</td><td className="num">142</td><td className="num">318 kg</td><td className="num">1.28</td><td className="num">+80 g</td><td><span className="tag ok">sobre target</span></td></tr>
                <tr><td>FT-2</td><td className="num">138</td><td className="num">302 kg</td><td className="num">1.21</td><td className="num">+10 g</td><td><span className="tag ok">ok</span></td></tr>
                <tr><td>FT-3</td><td className="num">127</td><td className="num">276 kg</td><td className="num">0.94</td><td className="num">−260 g</td><td><span className="tag warn">bajo target</span></td></tr>
                <tr><td>FT-4</td><td className="num">116</td><td className="num">294 kg</td><td className="num">1.15</td><td className="num">−50 g</td><td><span className="tag info">cerca</span></td></tr>
                <tr><td><b>Fundo</b></td><td className="num"><b>523</b></td><td className="num"><b>298 kg</b></td><td className="num"><b>1.14</b></td><td className="num"><b>−60 g</b></td><td><span className="tag info">promedio</span></td></tr>
              </tbody>
            </table>
          </div>

          <div className="art-block">
            <div className="hd">
              <span>GDP por lote · barras comparativas</span>
              <span className="src">kg/d · target 1.20</span>
            </div>
            <div className="art-chart">
              <div className="row">
                <span className="lbl">FT-1</span>
                <div className="track"><div className="fill" style={{width:'100%'}}/></div>
                <span className="val">1.28</span>
              </div>
              <div className="row">
                <span className="lbl">FT-2</span>
                <div className="track"><div className="fill leaf" style={{width:'94.5%'}}/></div>
                <span className="val">1.21</span>
              </div>
              <div className="row">
                <span className="lbl">Target</span>
                <div className="track"><div className="fill blue" style={{width:'93.8%'}}/></div>
                <span className="val">1.20</span>
              </div>
              <div className="row">
                <span className="lbl">Fundo</span>
                <div className="track"><div className="fill blue" style={{width:'89.1%'}}/></div>
                <span className="val">1.14</span>
              </div>
              <div className="row">
                <span className="lbl">FT-4</span>
                <div className="track"><div className="fill blue" style={{width:'89.8%'}}/></div>
                <span className="val">1.15</span>
              </div>
              <div className="row">
                <span className="lbl">FT-3</span>
                <div className="track"><div className="fill warn" style={{width:'73.4%'}}/></div>
                <span className="val">0.94</span>
              </div>
              <div className="legend">
                <span><i style={{background:'var(--green)'}}/>Sobre target</span>
                <span><i style={{background:'var(--leaf)'}}/>En target</span>
                <span><i style={{background:'var(--blue-fg)'}}/>Cerca</span>
                <span><i style={{background:'var(--warn-fg)'}}/>Bajo target</span>
              </div>
            </div>
          </div>

          <div className="art-block">
            <div className="hd">
              <span>FT-3 · recuperación GDP mes a mes</span>
              <span className="src">n=127 · ene–abr 2026</span>
            </div>
            <div className="art-spark">
              <div className="bar warn" style={{height:'15%'}}/>
              <div className="bar warn" style={{height:'45%'}}/>
              <div className="bar leaf" style={{height:'78%'}}/>
              <div className="bar" style={{height:'96%'}}/>
            </div>
            <div className="art-spark-axis">
              <span>ENE 0.00</span><span>FEB 0.18</span><span>MAR 0.54</span><span>ABR 0.94</span>
            </div>
          </div>

          <h2 className="art-h2">Proyección salida Loncoche</h2>
          <p className="art-p">A ritmo actual, con target 360 kg:</p>

          <div className="art-block">
            <div className="hd">
              <span>ETA salida · 4 lotes feedlot</span>
              <span className="src">Target 360 kg</span>
            </div>
            <table className="art-tbl">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th className="num">Peso hoy</th>
                  <th className="num">Faltan</th>
                  <th className="num">Días a target</th>
                  <th>ETA</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>FT-1</td><td className="num">318 kg</td><td className="num">42 kg</td><td className="num">32</td><td>10 may 2026</td><td><span className="tag ok">primer embarque</span></td></tr>
                <tr><td>FT-2</td><td className="num">302 kg</td><td className="num">58 kg</td><td className="num">46</td><td>24 may 2026</td><td><span className="tag ok">confirmado</span></td></tr>
                <tr><td>FT-4</td><td className="num">294 kg</td><td className="num">66 kg</td><td className="num">57</td><td>04 jun 2026</td><td><span className="tag info">confirmado</span></td></tr>
                <tr><td>FT-3</td><td className="num">276 kg</td><td className="num">84 kg</td><td className="num">~92*</td><td>~10 jul 2026</td><td><span className="tag warn">si recupera 1.15</span></td></tr>
              </tbody>
            </table>
          </div>
          <p className="art-p" style={{fontSize:13,color:'var(--ink2)'}}>* FT-3 asume recuperación a 1.15 kg/d desde próximo pesaje. Si sigue en 0.94, suma +30 días.</p>

          <h2 className="art-h2">Requiere decisión</h2>
          <p className="art-p"><b>FT-3:</b> esperar 30 días al próximo pesaje antes de ajustar, o cambiar ya la ract concentrado +0.5 kg/d por cabeza. Raciones actuales en el feedlot están homologadas por los 4 lotes; subir sólo al FT-3 implica separar silos.</p>
          <p className="art-p"><b>FT-1:</b> confirmar disponibilidad de camiones Loncoche para primera semana de mayo.</p>

          <h2 className="art-h2 sm">Fuentes</h2>
          <p className="art-p sm">Pesajes balanza Tru-Test · Planilla campo Raúl 09-04-2026 · Histórico pesajes 4 meses.</p>

        </div>
      </div>

      {saveOpen && (
        <div className="modal-back" onClick={(e)=>{ if(e.target.classList.contains('modal-back')) setSaveOpen(false); }}>
          <div className="modal">
            <div className="modal-hd">
              <span className="tt">Guardar o compartir</span>
              <div className="x" onClick={()=>setSaveOpen(false)}>{I.x({s:15})}</div>
            </div>
            <div className="modal-sub">Informe pesajes vaquillas FT — Los Aromos · abr 2026</div>
            <div className="modal-body">
              <div className={`mopt red ${saving==='pdf'?'working':''}`} onClick={()=>startSave('pdf')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 13h4M10 17h4"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Guardar como PDF</div>
                  <div className="t2">{saving==='pdf'?'Generando PDF…':'Se descarga local al equipo'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className={`mopt ${saving==='wa'?'working':''}`} onClick={()=>startSave('wa')}>
                <div className="ic">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.4c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.8-.1-1.5-.5-3.5-1.7-5.6-4.4-1.6-2.1-2-3.8-2.2-4.5-.2-.7.1-1.3.3-1.5.2-.3.5-.4.7-.4h.5c.1 0 .3 0 .5.4.2.4.6 1.5.7 1.6.1.2.1.3 0 .5l-.3.4-.4.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.5 1.9 1 .9 1.8 1.2 2.1 1.3.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.1.4.2.1.2.1.6-.1 1.2Z"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Enviar por WhatsApp a JP</div>
                  <div className="t2">{saving==='wa'?'Enviando…':'+56 9 5432 1876 · contacto frecuente'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className={`mopt blue ${saving==='drive'?'working':''}`} onClick={()=>startSave('drive')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2.5 8 13l3 5h10l-6.5-10.5zM11 18H3l5.5-9.5"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Guardar en Google Drive</div>
                  <div className="t2">{saving==='drive'?'Subiendo…':'SmartCow / Informes / Los Aromos'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className={`mopt amber ${saving==='email'?'working':''}`} onClick={()=>startSave('email')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Enviar por email</div>
                  <div className="t2">{saving==='email'?'Enviando…':'jp@agropecuaria-gonzalez.cl'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className="mopt" onClick={()=>startSave('routine')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Guardar como routine</div>
                  <div className="t2">{saving==='routine'?'Creando routine…':'Re-ejecutable con /routine pesajes-feedlot'}</div>
                </div>
                <span className="arr">→</span>
              </div>
            </div>
            <div className="modal-foot">
              {saving ? <div className="spinner"/> : <div className="dot"/>}
              <span>{saving?'procesando…':'listo para exportar · 2,431 palabras · 14 KB'}</span>
            </div>
          </div>
        </div>
      )}
      {copyOpen && (
        <div className="modal-back" onClick={(e)=>{ if(e.target.classList.contains('modal-back')) setCopyOpen(false); }}>
          <div className="modal">
            <div className="modal-hd">
              <span className="tt">Copiar o exportar</span>
              <div className="x" onClick={()=>setCopyOpen(false)}>{I.x({s:15})}</div>
            </div>
            <div className="modal-sub">Informe pesajes vaquillas FT · abr 2026</div>
            <div className="modal-body">
              <div className="mopt" onClick={()=>doCopy('md')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9l3 4 3-4v6M17 9v6M15 13l2 2 2-2"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Copiar como Markdown</div>
                  <div className="t2">{copied==='md'?'✓ Copiado al portapapeles':'Formato crudo con headings y listas'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className="mopt blue" onClick={()=>doCopy('rich')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M9 20h6M12 3v17"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Copiar como texto enriquecido</div>
                  <div className="t2">{copied==='rich'?'✓ Copiado':'Pegá directo en Docs, Notion, Gmail'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className="mopt amber" onClick={()=>doCopy('link')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Copiar link compartible</div>
                  <div className="t2">{copied==='link'?'✓ smartcow.cl/p/pesajes-aromos-abr26':'Acceso solo para equipo SmartCow'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className="mopt red" onClick={()=>doCopy('xlsx')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Exportar a Excel / CSV</div>
                  <div className="t2">{copied==='xlsx'?'✓ Generando .xlsx…':'Solo tablas y KPIs del plan'}</div>
                </div>
                <span className="arr">→</span>
              </div>
              <div className="mopt" onClick={()=>doCopy('notion')}>
                <div className="ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12l4 4v12H4zM4 4v16M16 4v4h4"/></svg>
                </div>
                <div className="txt">
                  <div className="t1">Enviar a Notion</div>
                  <div className="t2">{copied==='notion'?'✓ Creando página…':'Workspace SmartCow · /Informes'}</div>
                </div>
                <span className="arr">→</span>
              </div>
            </div>
            <div className="modal-foot">
              <div className="dot"/>
              <span>{copied?`copiado (${copied})`:'markdown · 2,431 palabras · 14 KB'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

window.Artifact = Artifact;
