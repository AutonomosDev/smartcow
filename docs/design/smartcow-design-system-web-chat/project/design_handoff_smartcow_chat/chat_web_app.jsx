// App shell — macOS window + chat + artifact
const { useState: useS } = React;

const App = () => {
  const I = window.Ico;

  // Tweaks
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "panel": true,
    "artifact": "plan",
    "generating": false
  }/*EDITMODE-END*/;

  const [artVisible, setArtVisible] = useS(TWEAKS.panel);
  const [tweaksOpen, setTweaksOpen] = useS(false);
  const [editMode, setEditMode] = useS(false);
  const [sbOpen, setSbOpen] = useS(false);
  const [artWidth, setArtWidth] = useS(() => {
    try { return parseInt(localStorage.getItem('cw_art_w')) || 560; } catch { return 560; }
  });
  const dragRef = React.useRef({ dragging:false, startX:0, startW:0 });

  const onDragStart = (e) => {
    dragRef.current = { dragging:true, startX:e.clientX, startW:artWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.currentTarget.classList.add('dragging');
  };
  React.useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      const dx = dragRef.current.startX - e.clientX;
      const nw = Math.max(320, Math.min(window.innerWidth - 420, dragRef.current.startW + dx));
      setArtWidth(nw);
    };
    const onUp = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.querySelectorAll('.divider').forEach(d => d.classList.remove('dragging'));
      try { localStorage.setItem('cw_art_w', String(artWidth)); } catch {}
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [artWidth]);

  React.useEffect(() => {
    const listen = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setEditMode(true);
      if (e.data.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', listen);
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
    return () => window.removeEventListener('message', listen);
  }, []);

  const setTweak = (k, v) => {
    window.parent.postMessage({type:'__edit_mode_set_keys', edits:{[k]:v}}, '*');
    if (k === 'panel') setArtVisible(v);
  };

  return (
    <div className="win">

      {/* macOS titlebar */}
      <div className="titlebar">
        <div className="tl">
          <span className="d r"/>
          <span className="d y"/>
          <span className="d g"/>
        </div>
        <div className="nav-arrows">
          <div className="a" title="Menú" onClick={()=>setSbOpen(o=>!o)}>{I.hamburger({s:15})}</div>
          <div className="a">{I.chevron({s:16, left:true})}</div>
          <div className="a">{I.chevron({s:16, right:true})}</div>
        </div>
        <div className="title-center">
          <span className="folder-ic">{I.folder({s:13})}</span>
          <span>smartcow_prod</span>
          <span className="sep">/</span>
          <span>Initialize project setup</span>
          <span className="chev">▾</span>
        </div>
        <div className="title-right">
          {!artVisible && (
            <div className="reopen-btn" onClick={()=>{setArtVisible(true); setTweak('panel', true);}} title="Reabrir Plan">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>
              <span>Plan</span>
            </div>
          )}
          <div className="a" title="Buscar">{I.search({s:14})}</div>
        </div>
      </div>

      {/* Sidebar overlay */}
      <Sidebar open={sbOpen} onClose={()=>setSbOpen(false)}/>

      {/* Body split */}
      <div className="body">

        {/* Left: chat */}
        <div className="pane-left">
          <Messages/>
          <Composer/>
        </div>

        {/* Drag divider */}
        {artVisible && <div className="divider" onMouseDown={onDragStart} title="Arrastrar para redimensionar"/>}

        {/* Right: artifact */}
        {artVisible && (
          <div className="pane-right" style={{width:artWidth}}>
            <Artifact visible={artVisible} onHide={()=>{setArtVisible(false); setTweak('panel', false);}}/>
          </div>
        )}

      </div>

      {/* Tweaks */}
      {editMode && (
        <>
          <div className="tw-fab" onClick={()=>setTweaksOpen(o=>!o)}>
            {I.sliders({s:12})} Tweaks
          </div>
          {tweaksOpen && (
            <div className="tw-panel">
              <h4>Vista</h4>
              <div className="tw-toggle">
                <span>Panel de artifact</span>
                <div className={`tw-switch ${artVisible?'on':''}`} onClick={()=>{setArtVisible(v=>{setTweak('panel', !v); return !v;});}}/>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Composer — bottom of chat pane
const Composer = () => {
  const I = window.Ico;
  return (
    <div className="composer">
      <div className="comp-inner">

        <div className="box git">
          <div className="branch-ic">{I.zap({s:13})}</div>
          <span className="sl-chip">/feedlot</span>
          <span className="sl-chip">/FT</span>
          <span className="sl-chip">/vaquillas</span>
          <span className="sl-chip">/partos</span>
          <span className="sl-chip">/tratamientos</span>
          <span className="sl-chip">/ventas</span>
          <span className="sl-more">más ▾</span>
        </div>

        <div className="box input">
          <span className="placeholder">Type / for commands</span>
          <span className="stop"/>
        </div>

        <div className="comp-foot">
          <span className="bypass">Bypass permissions</span>
          <div className="fi">{I.plus({s:13})}</div>
          <div className="fi">{I.plus({s:13})}</div>
          <div className="fi">{I.zap({s:13})}</div>
          <div className="right">
            <span>Sonnet 4.6</span>
            <span style={{color:'#aaa'}}>·</span>
            <span>Medium</span>
            <div className="spinner"/>
          </div>
        </div>

      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
