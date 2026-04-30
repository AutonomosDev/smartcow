// Messages column — clones the reference conversation exactly
const Messages = () => {
  const I = window.Ico;

  return (
    <div className="chat-scroll">
      <div className="chat-inner">

        <p className="p">Resumen de lo logrado:</p>

        <table className="chat-tbl">
          <thead>
            <tr><th>Tabla</th><th className="num">Antes</th><th className="num">Ahora</th><th>Fuente</th></tr>
          </thead>
          <tbody>
            <tr><td>animales</td><td className="num">5,979</td><td className="num">8,227</td><td>GanadoActual + Bajas</td></tr>
            <tr><td>tratamientos</td><td className="num">29,169</td><td className="num">62,177</td><td>+33k recuperados</td></tr>
            <tr><td>pesajes</td><td className="num">25,705</td><td className="num">42,652</td><td>+17k recuperados</td></tr>
            <tr><td>partos</td><td className="num">10,580</td><td className="num">16,194</td><td>+5,614 nuevos</td></tr>
            <tr><td>inseminaciones</td><td className="num">0</td><td className="num">4,900</td><td>¡Nuevo!</td></tr>
          </tbody>
        </table>

        <p className="p">El gap restante (~42k tratamientos y ~156k pesajes huérfanos) son animales que fueron vendidos — no aparecen en GanadoActual ni Bajas porque AgroApp los elimina del sistema al vender. Para recuperarlos necesitaría el padrón histórico completo de animales vendidos, que AgroApp no exporta directamente. Eso es un problema estructural del sistema fuente, no de nuestro pipeline.</p>

        <p className="p">Typecheck and commit.</p>

        <div className="ran">
          <span>Ran 3 commands</span>
          {I.chevron({s:13, right:true})}
        </div>

        <p className="p">Listo. Resumen ejecutado:</p>

        <p className="p"><b>Logrado:</b></p>
        <ul className="list">
          <li>Descubrí el patrón de API de AgroApp vía Puppeteer: <code>generarExcel &gt; ruta_dl</code> en <code>/ExcelWeb/</code> — callable directo con curl sin browser</li>
          <li>Descargué 4 Excels nuevos: GanadoActual (6,153), Bajas (1,431), Inseminaciones (4,900), Traslados (198)</li>
          <li>Implementé 3 importadores nuevos: <code>ganado</code>, <code>bajas</code>, <code>inseminaciones</code></li>
          <li>DB: animales 5,979→8,227 | tratamientos +62,177 | partos +16,194 | inseminaciones +4,900 (nuevo)</li>
        </ul>

        <p className="p"><b>Gap restante:</b> ~42k tratamientos y ~156k pesajes huérfanos son animales vendidos por rampa — AgroApp no los preserva en Bajas. Necesitaría un módulo "Historial de Ventas con DIIO individual" que actualmente no existe en los exports. Ese es el techo del sistema fuente.</p>

        <div className="u-msg">DALE</div>

        <p className="p">Voy a hacer el pipeline completo automatizado — un script que descarga todos los Excels de AgroApp y los importa en orden correcto.</p>

        <div className="ran">
          <span>Ran a command, created a file</span>
          {I.chevron({s:13, right:true})}
        </div>

        <p className="p run-wrap">
          Ahora lo pruebo — pero primero necesito saber los filt
          <span className="bar"/>
          <span className="bar"/>
          <span className="bar"/>
          &nbsp;exactos de Tratamientos y Partos (que no probé antes). Voy a probar uno primero.
        </p>

      </div>
    </div>
  );
};

window.Messages = Messages;
