# Marco Regulatorio Ganadero Chile — Referencia SmartCow

## Fuentes

- SAG Chile: Identificación Animal Oficial — https://www.sag.gob.cl/ambitos-de-accion/identificacion-animal-oficial
- SAG Chile: Programa Oficial de Trazabilidad Animal — https://www.sag.gob.cl/ambitos-de-accion/programa-oficial-de-trazabilidad-animal
- SAG Chile: Registro de Movimiento Animal — https://www.sag.gob.cl/ambitos-de-accion/registro-de-movimiento-animal
- SAG Chile: Distribuidores DIIO — https://www.sag.gob.cl/content/solicitud-para-distribuidores-de-dispositivo-de-identificacion-individual-oficial-diio
- SAG Chile: Formulario Identificación Individual Oficial — https://www.sag.gob.cl/sites/default/files/imprenta_identificacion_individual_oficial_vf.pdf
- SAG Chile: Instructivo Trazabilidad Bovino — https://www.sag.gob.cl/sites/default/files/i-pp-tz-001-derogado.pdf
- SAG Chile: Noticias DIIO / DEA — https://www.sag.gob.cl/noticias/si-compras-diio-o-aretes-para-tus-animales-no-olvides-tu-declaracion-de-existencia-animal
- SAG Chile: Resolución 975 / Trazabilidad — https://www.portalagrochile.cl/2023/01/11/sag-informa-sobre-resolucion-975-nuevas-responsabilidades-para-asegurar-trazabilidad-animal/
- SIPEC Chile: Manual Usuario Externo — https://www.sag.gob.cl/sites/default/files/MANUAL%20USUARIO%20EXTERNO%20TITULAR%20SIPECWEB%20OCT%202024.pdf
- ICAR / SAG: Programa Trazabilidad Diciembre 2011 — https://old.icar.org/wp-content/uploads/2015/12/Chile.pdf
- Chileatiende: FMA — https://www.chileatiende.gob.cl/fichas/16311-obtenencion-del-formulario-de-movimiento-animal-fma
- Chileatiende: DEA — https://www.chileatiende.gob.cl/fichas/16313-declaracion-anual-de-existencia-animal
- ODEPA: Cadena carne bovina Chile 2016 — https://www.odepa.gob.cl/wp-content/uploads/2017/12/cadenaCarneBovina.pdf
- ODEPA: Boletín carne bovina mayo 2025 — https://www.odepa.gob.cl/publicaciones/boletines/boletin-de-carne-bovina-mayo-2025
- ODEPA: Boletín semanal AFECH 2025 — https://www.odepa.gob.cl/wp-content/uploads/2026/01/BoletinSemanalAfech_20251230.pdf
- ODEPA: Página principal estadísticas bovinos — https://www.odepa.gob.cl/estadisticas-del-sector/estadisticas-por-rubro/bovinos
- INE Chile: Producción carne bovina Q1 2025 — https://www.ine.gob.cl/sala-de-prensa/prensa/general/noticia/2025/05/06/
- INDAP: Seguro ganadero bovino — https://www.indap.gob.cl/plataforma-de-servicios/programa-contratacion-de-seguro-bovino
- INDAP: Financiamiento — https://www.indap.gob.cl/servicios-indap/plataforma-de-servicios/financiamiento
- BCN Chile: Ley 20.596 (abigeato/FMA) — https://www.bcn.cl/leychile/
- AFECH: Boletín precios — https://afech.cl
- Corporación de la Carne: Informes — https://www.corporaciondelacarne.cl
- ScIELO Chile: NCh 1306 / NCh 1423 — https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0301-732X1999000100008

---

## SAG — Servicio Agrícola y Ganadero

El SAG es el organismo técnico del Ministerio de Agricultura de Chile responsable de:
- Sanidad animal y vegetal
- Trazabilidad del ganado bovino (y otras especies)
- Inspección de plantas faenadoras
- Certificación de exportaciones cárnicas
- Control de enfermedades de importancia económica y zoosanitaria

**Web**: https://www.sag.gob.cl
**Normativa vigente**: Resolución SAG N° 975 (2022) — actualización de responsabilidades de trazabilidad animal. Decreto 94 de 2009 — marco inicial del programa trazabilidad.

---

### Sistema de Trazabilidad Animal (SAG)

**Nombre oficial**: Programa Oficial de Trazabilidad Animal

**Qué es**: Sistema obligatorio de registro e identificación de animales que permite al SAG rastrear cualquier bovino desde su nacimiento hasta la faena. El objetivo es el control sanitario rápido ante brotes (fiebre aftosa, brucelosis, tuberculosis) y la habilitación de Chile para exportar carne con certificación de origen.

**Componentes del sistema**:

| Componente | Descripción |
|-----------|-------------|
| RUP (Rol Único Pecuario) | Número único de cada predio ganadero registrado en SIPEC |
| DEA (Declaración Existencia Animal) | Inventario anual obligatorio de animales por predio |
| DIIO (Dispositivo Identif. Individual Oficial) | Arete RFID oficial que identifica a cada animal de forma única |
| FMA (Formulario Movimiento Animal) | Documento de traslado obligatorio entre predios |
| SIPECweb | Sistema informático SAG donde se registra todo lo anterior |

**Cómo funciona**:
1. El productor registra su predio en SAG → obtiene RUP
2. Declara animales anualmente → DEA
3. Identifica cada bovino con DIIO antes de los 6 meses de vida
4. Cada traslado entre predios requiere FMA en papel o digital
5. Los movimientos quedan registrados en SIPEC asociando DIIO + RUP origen + RUP destino

**Estadísticas del programa (SAG)**: El SAG publica estadísticas anuales del programa de trazabilidad en https://www.sag.gob.cl/ambitos-de-accion/estadisticas-del-programa-de-trazabilidad

---

### Identificación Animal — DIIO

**Norma técnica**: ISO 11784 (código de animal) + ISO 11785 (protocolo de transmisión RFID)

**Formato del número DIIO**:
- Prefijo de país: 152 (código ISO para Chile)
- Identificador de establecimiento/proveedor
- Número individual del animal
- Ejemplo representativo: `152 156 000 1234` (el formato exacto depende del proveedor habilitado por SAG)

**Tipos de DIIO habilitados en Chile**:

| Tipo | Descripción | Uso |
|------|-------------|-----|
| Arete doble paleta con RFID | Paleta visual impresa + chip FDX-B integrado | Estándar, el más común |
| Bolo ruminal con arete visual | Cápsula de cerámica con RFID que se deposita en el rumen + arete visual complementario | Para animales que pierden aretes |

**Obligatoriedad**:
- Desde **marzo 2013**: obligatorio en todos los bovinos que se movilicen en el territorio nacional
- Desde **septiembre 2013**: los terneros nacidos deben identificarse SOLO con DIIO RFID
- **Plazo de aplicación**: antes de los 6 meses de vida
- El DIIO debe permanecer en el animal durante toda su vida

**Proceso de obtención**:
1. El productor presenta la DEA vigente en un distribuidor habilitado por SAG
2. Compra los DIIO (uno por animal a identificar)
3. Los aplica al animal (oreja derecha habitualmente)
4. Registra los números DIIO en SIPEC asociados al animal y al predio (RUP)

**Quién puede vender DIIO**: Solo distribuidores habilitados por SAG — lista oficial en https://www.sag.gob.cl/content/solicitud-para-distribuidores-de-dispositivo-de-identificacion-individual-oficial-diio

**Sanción por incumplimiento**: Los animales sin DIIO no pueden ser movilizados legalmente ni recibidos en ferias, mataderos o frigoríficos.

---

### Formulario de Movimiento Animal (FMA)

**Nombre también usado**: "Guía de movimiento animal" (lenguaje coloquial de campo)

**Base legal**: Ley 20.596 (mejora la fiscalización para prevenir el abigeato/robo de ganado)

**Qué es**: Documento oficial SAG que debe acompañar OBLIGATORIAMENTE el traslado de animales entre predios con RUP. Es la "guía de libre tránsito" del ganado en Chile.

**Especies que lo requieren**: bovinos, equinos, porcinos, ovinos, caprinos, cérvidos, camélidos sudamericanos, jabalíes y búfalos.

**Cuándo es obligatorio**: En todo traslado entre establecimientos con RUP, independiente de la distancia o la cantidad de animales.

**Datos que contiene**:
- RUP del predio de origen
- RUP del predio de destino
- Nombre y RUT del propietario/poseedor
- Especie y categoría de animales
- Número y DIIO de cada animal (o número de lote si son grupos)
- Fecha del movimiento
- Firma del responsable
- Medio de transporte

**Cómo obtenerlo**: 
- En línea vía SIPECweb (productor con usuario registrado)
- Oficinas SAG regionales
- Unidades de Carabineros (para urgencias)

**Vigencia**: El FMA debe utilizarse dentro de las 24 horas de emitido.

**Sanción**: Traslado de ganado sin FMA = infracción sancionada por Carabineros y SAG.

---

### Normativas Clave de Clasificación Bovina

**NCh 1423 — Clasificación de Ganado en Pie**:
Norma que agrupa el ganado bovino según sexo y edad (determinada por cronometría dentaria). Define 11 clases:

| Clase | Sexo | Dentición | Edad aprox. |
|-------|------|-----------|-------------|
| Ternero/a | M/H | Leche (DL) | 0–10 meses |
| Novillito | Mc | DL* o 2D | 10–18 meses |
| Vaquilla | H | DL* o 2D | 10–24 meses |
| Torito | Ment | DL* | 10–18 meses |
| Novillo | Mc | 4–6D | 18–36 meses |
| Vaca joven | H parida | 4–6D | 24–42 meses |
| Vaca adulta | H parida | 8D | >42 meses |
| Vaca vieja | H parida | 8D* | >60 meses |
| Toruno | Manomalo | 2–8D* | variable |
| Toro | Ment | 2–8D* | >18 meses |
| Buey | Mc | 8D o 8D* | >48 meses |

*Mc = macho castrado; Ment = macho entero; H = hembra; DL = dientes de leche; D = dientes permanentes; * = desgaste marcado*

**NCh 1306 — Tipificación de Canales Bovinas**:
Clasifica la canal (carne en vara) en 6 categorías según edad, cobertura grasa, peso y color:

| Categoría | Descripción | Animal típico | Valor relativo |
|-----------|-------------|---------------|----------------|
| V | Canal joven (dientes de leche/2D) | Novillito o vaquilla joven | Máximo |
| A | 2–4 dientes permanentes, buena cobertura | Novillo joven | Alto |
| C | Hembra joven (vaquilla/vaca joven) | Vaquilla terminada | Alto |
| U | Macho adulto castrado (4–6D) | Novillo adulto | Medio |
| N | Hembra adulta (8D) | Vaca de descarte | Medio-bajo |
| O | Animal viejo (8D*) o con defectos | Toro/vaca vieja | Bajo |

**Criterios de tipificación**: sexo y edad (dentición), peso canal caliente (PCC), cobertura grasa (CG), color de músculo y grasa.

---

## ODEPA — Oficina de Estudios y Políticas Agrarias

**Rol**: Organismo técnico del Ministerio de Agricultura. Produce y publica estadísticas, análisis de mercado, precios y estudios del sector agropecuario chileno. No regula ni inspecciona — es una entidad de información y política pública.

**Web**: https://www.odepa.gob.cl

---

### Publicaciones sobre Precios Ganaderos

**Boletín mensual de carne bovina**:
- **Frecuencia**: Mensual (disponible en los primeros 10 días del mes siguiente)
- **Contenido**: Producción nacional (cabezas faenadas, toneladas en vara), precios de ganado en feria por categoría, precios de carne al consumidor, comercio exterior (importaciones y exportaciones)
- **Fuente**: https://www.odepa.gob.cl/publicaciones/boletines/boletin-de-carne-bovina-mayo-2025

**Boletín semanal AFECH (precios en feria)**:
- **Frecuencia**: Semanal (todos los martes o miércoles)
- **Contenido**: Precios promedio y precio de los 5 mejores (P5pp) por categoría y por feria ganadera, en CLP/kg vivo. Incluye número de cabezas transadas.
- **Categorías publicadas**: novillo gordo, novillo engorda, vaquilla gorda, vaquilla engorda, ternero, vaca gorda
- **Fuente**: https://www.odepa.gob.cl/contenidos-rubro/boletines-del-rubro/boletin-semanal-de-precios-asoc-gremial-de-ferias-ganaderas
- **En SmartCow**: Los datos se importan vía ETL (`src/etl/import-precios-feria.ts`) a la tabla `precios_feria`

---

### Precios de Referencia (abril 2025 — aproximados, fuente ODEPA/AFECH)

**Nota**: Los precios varían semanalmente. Consultar boletín AFECH actual en https://www.odepa.gob.cl para valores vigentes.

| Categoría | Precio CLP/kg vivo (aprox. feb. 2026) | Descripción |
|-----------|--------------------------------------|-------------|
| Novillo gordo | $2.700–$2.900 | Novillo terminado, para faena inmediata |
| Novillo engorda | $2.000–$2.200 | Novillo en proceso de engorda, compra para terminar |
| Vaquilla gorda | $2.500–$2.700 | Vaquilla terminada para faena |
| Vaquilla engorda | $1.900–$2.100 | Vaquilla en proceso, para terminar |
| Ternero | $1.800–$2.200 | Ternero al destete (~150–200 kg) |
| Vaca gorda | $1.500–$1.700 | Vaca de descarte terminada |

**Fuente**: Boletín AFECH semana 11–17 febrero 2026, Tattersall Melipilla y Tattersall Curicó. Los valores son CLP nominales sin IVA.

**Tendencia 2025**: Precio novillo gordo acumuló alza de ~13% en 2025 respecto a 2024 (fuente: ODEPA). El precio novillo gordo registró aumentos de 3.4% mensual en abril 2025.

---

### Estadísticas de Producción Chile (datos INE/ODEPA 2024–2025)

| Indicador | 2024 | Q1 2025 |
|-----------|------|---------|
| Cabezas faenadas total año | ~847.000 | 193.347 |
| Producción carne en vara (ton) | ~180.400 (+4.5% vs 2023) | 50.397 (+3.4% vs Q1 2024) |
| Peso promedio canal novillo | ~290 kg | ~290 kg |
| Peso promedio vivos faena | ~529 kg (2024) | ~535 kg (YTD 2025) |

---

## INDAP — Instituto de Desarrollo Agropecuario

**Rol**: Fomento y financiamiento del agro campesino chileno (pequeños y medianos productores). Es la institución del Estado que apoya la ganadería familiar y campesina.

**Relevancia para SmartCow**: Los predios con usuarios INDAP son productores pequeños o medianos. SmartCow puede ser una herramienta de registro y gestión para este segmento.

---

### Programas ganaderos INDAP

**Crédito Agropecuario**:
- Financia inversiones y capital de trabajo agropecuario (incluyendo compra de ganado, cercos, bodegas, maquinaria)
- Plazos: 360 días (corto plazo) hasta 10 años (largo plazo)
- Destinatarios: agricultores familiares campesinos con hasta 12 UTA de capital

**Seguro Ganadero Bovino**:
- Subsidia hasta el **95% del costo de la prima** del seguro
- Cubre riesgos de producción pecuaria bovina: muerte por enfermedad, accidentes, partos distócicos
- Requisito: estar inscrito en SIPEC con RUP activo
- Fuente: https://www.indap.gob.cl/plataforma-de-servicios/programa-contratacion-de-seguro-bovino

**Apoyo técnico en genética**:
- INDAP financia planes de mejoramiento genético (uso de semen de toros evaluados, IATF)
- Programa activo hace >16 años en ganadería campesina del sur de Chile

---

## AFECH — Asociación Gremial de Ferias de Chile

**Qué es**: Gremio que agrupa a las ferias ganaderas de Chile (recintos de remate de ganado vivo). Calcula y publica los precios promedio de ganado transado en ferias cada semana.

**Rol en el mercado**: Las ferias ganaderas son el mercado spot de ganado vivo en Chile. Los precios AFECH son el precio de referencia del sector para negociar compra-venta entre crianceros y engorderos.

---

### Boletín AFECH

**Qué publica**: Precio promedio y precio de los 5 primeros (P5pp, ponderado por cabezas transadas) para cada categoría de ganado, por feria. El P5pp refleja la calidad premium del mercado.

**Frecuencia**: Semanal (publicado en odepa.gob.cl)

**Ferias principales incluidas**: Tattersall Melipilla, Tattersall Curicó, Tattersall Temuco, Tattersall Osorno, Ferias de Chillán, Ferias de Los Ángeles, entre otras.

**Cómo se usa en SmartCow**: Los ETL importan estos datos a `precios_feria`. El chat ganadero puede consultarlos vía `query_db` para orientar al productor sobre precios de mercado vigentes.

---

## Obligaciones Legales Resumidas

| Registro/Acción | Cuándo | Responsable | Organismo | Sanción incumplimiento |
|-----------------|--------|-------------|-----------|----------------------|
| Registrar predio (obtener RUP) | Antes de tener animales | Propietario | SAG | Sin RUP no puede comprar DIIO ni mover ganado |
| Declaración Existencia Animal (DEA) | Anualmente (fecha que indica SAG) | Propietario/tenedor | SAG/SIPEC | Sin DEA no puede comprar DIIO |
| Identificar con DIIO | Antes de 6 meses de vida del animal | Propietario | SAG | Sin DIIO el animal no puede movilizarse legalmente |
| Formulario de Movimiento Animal (FMA) | Antes de cada traslado entre predios | Propietario/tenedor | SAG | Infracción Ley 20.596, sanción por Carabineros |
| Registro de movimientos en SIPEC | Al realizar cada movimiento | Propietario/tenedor | SAG/SIPEC | Incumplimiento del programa de trazabilidad |
| Faena en planta habilitada | Siempre para consumo humano | Productor/frigorífico | SAG | Infracción sanitaria grave (faena clandestina) |
| Inspección veterinaria en faena | En cada faena comercial | Frigorífico | SAG | Inhabilita la planta frigorífica |

---

## Categorías Oficiales de Ganado (Faena) en Chile

### Categorías de la NCh 1423 (Ganado en Pie para Clasificación)

Usadas en ferias y plantas para determinar el precio de compra:

| Categoría | Código | Sexo | Dentición | Equivalente EN |
|-----------|--------|------|-----------|----------------|
| Novillito | Novito | Macho castrado | DL*/2D | Young steer |
| Vaquilla | Vaquilla | Hembra | DL*/2D | Heifer |
| Torito | Torito | Macho entero | DL* | Young bull |
| Novillo | Novillo | Macho castrado | 4–6D | Steer |
| Vaca joven | Vaca j. | Hembra parida | 4–6D | Young cow |
| Vaca adulta | Vaca a. | Hembra parida | 8D | Cow |
| Vaca vieja | Vaca v. | Hembra parida | 8D* | Old cow |
| Toruno | Toruno | Macho entero anómalo | 2–8D* | Cryptorchid |
| Toro | Toro | Macho entero | 2–8D* | Bull |
| Buey | Buey | Macho castrado adulto | 8D/8D* | Ox |
| Ternero/a | Ternero | M o H | DL | Calf |

### Tipificación de Canales (NCh 1306)

Categorías usadas en plantas faenadoras para el precio de la canal:

| Código | Descripción | % de la faena nacional (aprox.) |
|--------|-------------|--------------------------------|
| V | Canal joven (novillito/vaquilla, DL–2D) | ~40–57% |
| A | Canal joven con 2–4 dientes permanentes | ~10–15% |
| C | Canal hembra joven (vaquilla/vaca joven) | ~8–12% |
| U | Canal macho castrado adulto (4–6D) | ~5–8% |
| N | Canal hembra adulta (8D) | ~5–8% |
| O | Canal viejo o con defectos | ~3–5% |

**Nota**: La categoría V representa el mayor porcentaje de la faena chilena (~57% según datos región X, ScIELO 1999). Refleja que Chile produce principalmente novillos jóvenes de calidad.

---

## Enfermedades de Declaración Obligatoria (Bovinos)

El SAG exige notificación inmediata de:
- Fiebre aftosa (Chile es país libre — condición que permite exportar)
- Brucelosis bovina
- Tuberculosis bovina
- Leucosis bovina enzoótica
- Encefalopatía espongiforme bovina (BSE / "vaca loca")

**Importancia para SmartCow**: El módulo de tratamientos (`tratamientos`) y el historial sanitario permiten al SAG trazar el historial de un animal ante una alerta sanitaria.

---

## Contexto Internacional — Benchmarks Comparativos

| Indicador | Chile | Argentina | Uruguay | Brasil | EE.UU. |
|-----------|-------|-----------|---------|--------|--------|
| GDP feedlot (kg/día) | 1.2–1.5 | 1.3–1.5 | 1.2–1.4* | 1.1–1.4 | ~2.1 |
| Tasa preñez (% campo) | 60–75% | 65–75% | 70–80% | 55–70% | 85–92% |
| Rendimiento canal (%) | 52–55% | 52–56% | 54–57% | 50–53% | 60–64%** |
| Peso faena novillo (kg vivo) | 480–550 | 420–480 | 480–530 | 400–500 | 550–650 |
| Días en feedlot (promedio) | 60–120 | 90–120 | 60–90* | 90–120 | 120–180 |
| % ganado terminado en feedlot | ~15–20% | ~35–40% | ~15–20%* | ~15% | ~95% |

*Uruguay: mayoría pastoreo, feedlot para exportación premium.
**EE.UU.: rendimiento más alto por genética especializada y dietas de alto grano.

**Fuentes benchmark**:
- MLA Agri-Benchmark: feedlot global performance (2019)
- USDA FAS Argentina Report 2025
- ScienceDirect: "Future of beef production in South America" (2024)

**Nota sobre Chile**: Chile no tiene un programa nacional de benchmarking feedlot publicado. Los valores indicados son estimaciones de la industria y estudios académicos (UACh, UCh). Argentina y Uruguay publican estadísticas más detalladas. El sector chileno está menos concentrado y tecnificado que el argentino.

---

## Importaciones de Carne Bovina Chile

Chile es importador neto de carne bovina (la producción nacional no cubre la demanda):

| Proveedor | Participación (2024) | Notas |
|-----------|---------------------|-------|
| Brasil | Principal proveedor | ~70%+ del volumen importado |
| Paraguay | Segundo proveedor | Carne magra para procesamiento |
| Argentina | Tercer proveedor | Volumen creció +21% (ene–sep 2024) |
| Uruguay | Participación menor | Carne de calidad premium |

**Tendencia**: Brasil impulsa más exportaciones a Chile en 2025. Los aranceles chinos a competidores de Chile abren oportunidades para la industria local (fuente: Emol, enero 2026).

---

## Resumen: Qué debe registrar un sistema como SmartCow para cumplir trazabilidad SAG

| Dato | Tabla SmartCow | Obligatoriedad SAG |
|------|----------------|-------------------|
| Predio con RUP | `predios` (campo necesario) | Obligatorio |
| Número DIIO por animal | `animales` (campo `eid` o `diio`) | Obligatorio |
| Fecha de nacimiento | `animales` o `partos` | Recomendado |
| Fecha de identificación (areteo) | `areteos` | Recomendado |
| Movimientos entre predios | `movimientos_potrero` o similar | Obligatorio (FMA) |
| Baja del animal (muerte/faena/venta) | `bajas` | Recomendado |
| Tratamientos veterinarios | `tratamientos` | Recomendado (trazabilidad sanitaria) |
| Pesajes | `pesajes` | No obligatorio SAG, sí para gestión |
