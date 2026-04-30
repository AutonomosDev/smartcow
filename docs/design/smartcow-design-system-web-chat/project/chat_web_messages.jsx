// Messages column — conversación de ganadero revisando pesajes de vaquillas feedlot
const Messages = () => {
  const I = window.Ico;

  return (
    <div className="chat-scroll">
      <div className="chat-inner">

        <div className="u-msg">cómo vienen los pesajes de las vaquillas del feedlot este mes?</div>

        <p className="p">Revisé los pesajes del <b>9 de abril</b> — el que hizo Raúl ayer. 523 vaquillas en los 4 lotes FT. GDP promedio del fundo <b>1.14 kg/d</b>, 60 g bajo el target de 1.20.</p>

        <div className="chat-note">
          <div className="chat-note-hd">
            <span className="ttl">GDP POR LOTE — LOS AROMOS · ABR 2026</span>
            <div className="copy" title="Copiar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </div>
          </div>
          <hr className="chat-note-rule"/>
          <table className="chat-tbl">
            <thead>
              <tr><th>Lote</th><th className="num">Peso</th><th className="num">GDP</th><th>Estado</th></tr>
            </thead>
            <tbody>
              <tr><td>FT-1</td><td className="num">318 kg</td><td className="num">1.28</td><td>sobre</td></tr>
              <tr><td>FT-2</td><td className="num">302 kg</td><td className="num">1.21</td><td>ok</td></tr>
              <tr><td>FT-3</td><td className="num">276 kg</td><td className="num">0.94</td><td>bajo</td></tr>
              <tr><td>FT-4</td><td className="num">294 kg</td><td className="num">1.15</td><td>cerca</td></tr>
            </tbody>
          </table>
        </div>

        <p className="p">Lo que salta: <b>FT-3 viene 260 g bajo target</b> — es el lote más chico (127 animales) y el que entró más tarde al feedlot (3 sem contra 6 del FT-1). Raúl me dejó nota en la planilla: "ración sin cambio, agua ok". Puede ser que todavía estén ajustándose.</p>

        <p className="p">Los otros 3 lotes vienen bien. FT-1 va a salir antes del target de 360 kg si sigue a este ritmo — 32 días más y sale para Loncoche.</p>

        <div className="u-msg">y el mes anterior cómo venía el FT-3?</div>

        <p className="p">Fui a buscar los pesajes del FT-3 de los últimos 3 meses. Tenés un patrón claro de arranque lento:</p>

        <div className="chat-note">
          <div className="chat-note-hd">
            <span className="ttl">FT-3 · HISTORIAL PESAJES</span>
            <span className="src">ene–abr 2026</span>
          </div>
          <hr className="chat-note-rule"/>
          <table className="chat-tbl">
            <thead>
              <tr><th>Fecha</th><th className="num">Peso</th><th className="num">GDP</th><th>Obs</th></tr>
            </thead>
            <tbody>
              <tr><td>15 ene</td><td className="num">248 kg</td><td className="num">—</td><td>ingreso</td></tr>
              <tr><td>12 feb</td><td className="num">253 kg</td><td className="num">0.18</td><td>adaptación</td></tr>
              <tr><td>13 mar</td><td className="num">268 kg</td><td className="num">0.54</td><td>subiendo</td></tr>
              <tr><td>09 abr</td><td className="num">276 kg</td><td className="num">0.94</td><td>actual</td></tr>
            </tbody>
          </table>
        </div>

        <p className="p">Viene subiendo bien — de 0.18 a 0.94 en 3 meses. Si la tendencia sigue, el próximo pesaje (9 may) debería rondar <b>1.15–1.20 kg/d</b>. Para ese momento ya van a estar aclimatados.</p>

        <p className="p">Una baja: hay <b>2 animales</b> que no aparecen en el último pesaje (129 → 127). Uno es baja por rengo (caravana 4421, nota del 22 mar) y otro está en el registro de tratamientos por diarrea — sigue en el lote pero lo saltaron del pesaje.</p>

        <div className="ran">
          <span>Consulté 4 pesajes · FT-3 · tabla `pesajes`</span>
          {I.chevron({s:13, right:true})}
        </div>

        <div className="u-msg">dame el informe completo para mandarle a jp</div>

        <p className="p">Armé el informe de pesajes del mes con todos los lotes del feedlot, GDP por potrero, proyección de salida a Loncoche y la alerta del FT-3. Listo en el panel de la derecha — ya podés enviárselo a JP desde el botón de arriba.</p>

        <p className="p run-wrap">
          Lo actualizo automático cada vez que Raúl carga un pesaje
          <span className="bar"/>
          <span className="bar"/>
          <span className="bar"/>
          &nbsp;así no te queda desfasado.
        </p>

      </div>
    </div>
  );
};

window.Messages = Messages;
