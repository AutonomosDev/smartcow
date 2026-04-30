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
        <span className="kind">Plan</span>
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

          <h1 className="art-h1">Plan: Captura datos AgroApp — ruta Excel del UI + Puppeteer</h1>

          <h2 className="art-h2">Context</h2>
          <p className="art-p">El approach anterior (23k × <code>/Consulta</code>, ~4h) era la ruta más lenta posible. César demostró la ruta correcta: el botón "Exportar Excel" del UI AgroApp baja 74,777 tratamientos en 2 minutos. Si el UI puede, nosotros también.</p>

          <p className="art-p">Por qué mi HTTP directo falla (7 Excels probados, 0 filas):<br/>
          El bundle Angular envía algo que mi <code>curl</code> no: probablemente una cookie de sesión que se setea al cargar <code>http://www.agroapp.cl</code> (no el backend <code>:8080</code>), más headers <code>Origin</code>/<code>Referer</code> correctos. El <code>/Consulta</code> funciona sin nada de eso porque es un endpoint público simple; los <code>getAll*</code>/<code>generarExcel*</code> requieren contexto de navegador.</p>

          <p className="art-p">Evidencia acumulada (ya local):</p>
          <ul className="art-ul">
            <li><a href="#"><code className="link">docs/export_agroapp/Ventas_Historial_18-04-2026_1.xlsx</code></a> — 846 ventas (resumen por rampa, sin DIIOs)</li>
            <li><a href="#"><code className="link">docs/export_agroapp/Tratamientos_Historial_18-04-2026_1.xlsx</code></a> — 74,777 tratamientos con DIIO</li>
            <li><a href="#"><code className="link">docs/export_agroapp/Partos_Historial_18-04-2026.xlsx</code></a> — 8,121 partos con DIIO madre</li>
          </ul>

          <h2 className="art-h2">Objetivo</h2>
          <p className="art-p">Pasar los Excels del UI a PostgreSQL en local, automatizar el download para el futuro, y dejar al chat ganadero respondiendo con datos reales.</p>

          <h2 className="art-h2">Approach — 2 pistas en paralelo</h2>
          <p className="art-p"><b>Pista 1 — Importar lo que ya tenemos + pedir los que faltan (rápido)</b></p>
          <p className="art-p">Input: Excels en <code>docs/export_agroapp/</code> que César exporta manualmente desde AgroApp.</p>
          <p className="art-p">Scope del import:</p>
          <ol className="art-ol">
            <li>Nuevo script <a href="#"><code className="link">src/etl/import-agroapp-excel.ts</code></a> que acepta un <code>.xlsx</code> y su tipo (<code>tratamientos</code>, <code>partos</code>, <code>ventas</code>, <code>ganado</code>,…).</li>
            <li>Por tipo, mapea columnas Excel → tabla Drizzle:
              <ul className="art-ul sub">
                <li>Tratamientos: Diio, Fundo, Fecha, Diagnóstico, Medicamento+SAG, Serie-Venc, Dosis → <code>tratamientos</code></li>
                <li>Partos: Diio (madre), Fundo, Tipo/Subtipo, Sexo, Fecha parto, Total partos → <code>partos</code></li>
                <li>Ganado Actual: Diio, Fundo, Tipo, Raza, Padre, Abuelo, DIIO madre, Fecha nac → <code>animales</code> (upsert)</li>
                <li>Ventas: ID, Fundo, Animales, Peso, Fecha venta → <code>ventas</code> (agregado, sin DIIO individual)</li>
              </ul>
            </li>
            <li>Resolver <code>predio_id</code> por nombre de fundo (lowercase trim). Crear 3 predios nuevos que aparecen en Tratamientos: Mediería Frival, Mediería Oller, Corrales del Sur.</li>
          </ol>

        </div>
      </div>

      {saveOpen && (
        <div className="modal-back" onClick={(e)=>{ if(e.target.classList.contains('modal-back')) setSaveOpen(false); }}>
          <div className="modal">
            <div className="modal-hd">
              <span className="tt">Guardar o compartir</span>
              <div className="x" onClick={()=>setSaveOpen(false)}>{I.x({s:15})}</div>
            </div>
            <div className="modal-sub">Plan: Captura datos AgroApp — ruta Excel del UI + Puppeteer</div>
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
                  <div className="t2">{saving==='routine'?'Creando routine…':'Re-ejecutable con /routine plan-agroapp'}</div>
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
            <div className="modal-sub">Plan: Captura datos AgroApp</div>
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
                  <div className="t2">{copied==='link'?'✓ smartcow.cl/p/plan-agroapp':'Acceso solo para equipo SmartCow'}</div>
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
