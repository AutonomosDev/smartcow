# Glosario Ganadero Bovino — Chile
# Bilingual Cattle Glossary — Spanish (Chile) / English

## Fuentes

- SAG Chile: Identificación Animal Oficial — https://www.sag.gob.cl/ambitos-de-accion/identificacion-animal-oficial
- SAG Chile: Programa Oficial de Trazabilidad Animal — https://www.sag.gob.cl/ambitos-de-accion/programa-oficial-de-trazabilidad-animal
- SAG Chile: Registro de Movimiento Animal — https://www.sag.gob.cl/ambitos-de-accion/registro-de-movimiento-animal
- ODEPA: Cadena carne bovina Chile — https://www.odepa.gob.cl/wp-content/uploads/2017/12/cadenaCarneBovina.pdf
- INE Chile: Caracterización producción carne bovina Chile — https://www.ine.gob.cl/docs/default-source/documentos-de-trabajo/caracterizacion-produccion-carne-bovina-en-chile-ine.pdf
- ScIELO Chile: Clasificación y tipificación bovinos, NCh 1423, NCh 1306 — https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0301-732X1999000100008
- UChile TecnoVet: "Clasificación de ganado y tipificación de sus carnes" — https://web.uchile.cl/vignette/tecnovet/
- Wikipedia Chile: Entidad rural — https://es.wikipedia.org/wiki/Entidad_rural_(Chile)
- Producción Animal AR: "Cría y Recría de Bovinos" — https://www.produccion-animal.com.ar/informacion_tecnica/cria/177-TextoCriaRecria.pdf
- CONtexto Ganadero: "Ciclo de vida productivo y reproductivo hembra bovina" — https://www.contextoganadero.com/reportaje/asi-es-el-ciclo-de-vida-productivo-y-reproductivo-de-una-hembra-bovina
- Farmquip Chile: "Ganadería intensiva, cría a terminación" — https://www.farmquip.cl/blog/255/ganaderia-intensiva-desde-la-cria-hasta-la-terminacion-a-corral/
- AFECH: https://afech.cl
- Demanet Filippi (UACh): Sistemas de Producción de Carne — https://praderasypasturas.com/rolando/
- Tru-Test/Datamars: XRS2i Stick Reader — https://us.tru-test.com/products/eid-readers/xrs2i-stick-reader
- BCN Chile: Ley 17510 mediería — https://www.bcn.cl/leychile/navegar?idNorma=29070
- SciELO Chile: "Mediería agrícola y mapuche rural" — https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0719-27892019000100131
- Vacuna la Vaca: "Definiendo la etapa de recría en vacuno" — https://www.vacunalavaca.com/recria/
- AgroGlobal: "Carne bovina: rendimiento canal y comercial" — https://agroglobalcampus.com/carne-bovina-rendimiento-canal-y-comercial/
- AGROcolun: "Protocolo IATF" — https://agrocolun.cl/protocolo-iatf-56/
- Intagri: "Diagnóstico de gestación en bovinos" — https://www.intagri.com/articulos/ganaderia/diagnostico-de-gestacion-en-bovinos

---

## Glosario

Las entradas están ordenadas alfabéticamente. Se indica la diferencia regional con Argentina/México cuando existe.

---

### ADG (Average Daily Gain)
**ES**: GDP — Ganancia Diaria de Peso
Ver entrada **GDP**.

---

### Areteo
**EN**: Ear tagging / Identification

**Definición**: Proceso de colocar el arete (o DIIO) al animal. En Chile se usa como sinónimo de identificación oficial del bovino con el dispositivo DIIO del SAG.

**Normativa**: Obligatorio antes de los 6 meses de vida del animal. En animales que se movilizan, el DIIO debe estar colocado previamente al traslado (obligatorio desde 2013). Fuente: SAG.

**En SmartCow**: La tabla `areteos` registra este evento. Incluye número DIIO asignado, fecha, predio.

**Diferencia regional**: En Argentina se llama simplemente "caravana" o "aplicación de caravana". En México "arracada" (informal). En Chile se usa el término técnico "DIIO" o coloquialmente "arete".

---

### Baja
**EN**: Removal / Exit from herd

**Definición**: Salida definitiva de un animal del inventario del predio. En SmartCow incluye todos los motivos: muerte, venta en feria, faena, traslado definitivo a otro predio.

**Tipos de baja en Chile**:
- **Muerte**: fallecimiento por enfermedad, accidente, problema reproductivo
- **Faena**: envío a planta frigorífica
- **Venta**: venta a tercero en feria o trato directo

**En SmartCow**: Tabla `bajas` registra tipo, fecha, peso al momento de baja, destino.

---

### Boletín AFECH
**EN**: AFECH Weekly Price Bulletin

**Definición**: Publicación semanal de precios de ganado vivo en remates de ferias ganaderas. Lo publica la Asociación Gremial de Ferias de Chile (AFECH) y lo distribuye ODEPA en su sitio web.

**Frecuencia**: Semanal (todos los martes/miércoles)

**Contenido**: Precios promedio y precio de los 5 primeros (P5pp) por categoría y por feria ganadera. Incluye: novillo gordo, novillo engorda, vaquilla gorda, vaquilla engorda, ternero, vaca gorda. Precio en CLP/kg vivo.

**Fuente**: https://www.odepa.gob.cl/contenidos-rubro/boletines-del-rubro/boletin-semanal-de-precios-asoc-gremial-de-ferias-ganaderas

**Referencia en SmartCow**: Tabla `precios_feria` almacena los datos del boletín AFECH, importados vía ETL desde los PDFs publicados por ODEPA.

---

### Buey
**EN**: Ox / Steer (mature castrated)

**Definición**: Macho bovino castrado de más de 4 años (boca llena, 8 dientes permanentes). En Chile es un animal viejo, generalmente de trabajo o descarte.

**Clasificación NCh 1423**: Categoría Buey (8D o 8D*)

**Diferencia regional**: En Argentina "buey" también designa al macho castrado adulto, igual que en Chile. En México "buey" se usa raramente; se prefiere "toro castrado" o "novillo adulto".

**En SmartCow**: Campo `tipo_ganado` o similar. Rara vez aparece en sistemas modernos.

---

### Carne en Vara
**EN**: Dressed carcass / Carcass beef / Hanging beef

**Definición**: La canal del bovino (sin cuero, vísceras, cabeza ni extremidades) colgada en la planta frigorífica tras la faena. Es la unidad de comercialización mayorista de la carne en Chile.

**Peso típico**: 250–300 kg para un novillo de 500 kg vivo (rendimiento ~52–54%).

**Expresión**: "kilos en vara" o "kg colgado". El precio se cotiza en CLP/kg vara o USD/kg vara para exportación.

**Diferencia regional**: Argentina también usa "carne en gancho" o "carne en vara". Brasil usa "carcaça". EE.UU. "hanging weight" o "rail weight".

---

### Conversión Alimenticia / ICE
**EN**: Feed Conversion Ratio (FCR) / Feed Efficiency

**Definición**: Kilogramos de materia seca de alimento necesarios para producir 1 kg de ganancia de peso vivo. Indicador de eficiencia productiva en feedlot.

**Fórmula**: ICE = kg MS consumidos / kg PV ganados

**Rango normal feedlot Chile/LatAm**: 6.0–8.0 kg MS / kg PV

**Nota**: A diferencia de la avicultura (FCR ~1.8) o porcicultura (~2.5), el bovino es menos eficiente (FCR 6–8). Esto se debe a que es un rumiante que destina energía a mantenimiento y fermentación ruminal.

**En SmartCow**: No existe tabla de consumo por lote. El ICE requiere datos externos de consumo.

---

### Criancero
**EN**: Cow-calf operator / Breeder

**Definición**: Productor ganadero cuya actividad principal es la crianza: tiene vacas de cría, produce terneros y los vende al destete (o los cría hasta recría). Es el primer eslabón de la cadena ganadera chilena.

**Diferencia con engordero**: El criancero produce terneros; el engordero los compra y los lleva a peso de faena.

---

### DEA — Declaración de Existencia Animal
**EN**: Annual Animal Inventory Declaration

**Definición**: Declaración anual obligatoria que todo productor con animales (bovinos, equinos, porcinos, ovinos, caprinos, etc.) debe presentar ante el SAG. Incluye el inventario de animales por especie, categoría y número en el predio.

**Obligatoriedad**: Anual. Se presenta en oficinas SAG o en línea vía SIPECweb. Es requisito para comprar DIIO/aretes oficiales.

**Fuente**: https://www.chileatiende.gob.cl/fichas/16313-declaracion-anual-de-existencia-animal

---

### Destete
**EN**: Weaning

**Definición**: Proceso de separación física y definitiva del ternero de su madre, poniendo fin a la alimentación con leche. Marca el fin de la etapa de cría y el inicio de la alimentación sólida independiente.

**Edad típica Chile**: 6–8 meses (destete convencional)
**Peso típico Chile al destete**: 150–200 kg
**Destete precoz**: 2–3 meses (técnica especial)
**Destete hiperprecoz**: 30–45 días (emergencia)

**Proceso**: Se recomienda separación gradual de mínimo 2 semanas para evitar caída de peso por estrés. Los terneros recién destetados son susceptibles a enfermedades respiratorias.

**En SmartCow**: Se registra como pesaje con fecha de destete en tabla `pesajes`, y/o como evento en la etapa de transición.

---

### DIIO — Dispositivo de Identificación Individual Oficial
**EN**: Official Individual Identification Device (RFID ear tag)

**Definición**: Arete oficial aprobado por el SAG que permite identificar de forma única a cada animal bovino en Chile. Combina un código visual (número impreso en el arete) con un chip RFID de radiofrecuencia.

**Formato del número**: No existe una longitud fija publicada oficialmente, pero los DIIO en Chile siguen la norma ISO 11784/11785. El número incluye el código de país (152 para Chile) + identificador del establecimiento + número individual. Ejemplo de formato: `152.156.0001234` (152 = código ISO Chile; 156 = código establecimiento; 0001234 = número individual del animal).

**Tipos de DIIO disponibles en Chile**:
1. **Arete doble paleta con RFID**: paleta visual (número impreso grande) + chip RFID integrado. El más común.
2. **Bolo ruminal con arete visual**: bolo de cerámica con chip RFID que se deposita en el rumen + arete visual complementario. Para animales que pierden aretes frecuentemente.

**Obligatoriedad**:
- Desde marzo 2013: obligatorio en TODOS los bovinos que se movilicen dentro del territorio nacional.
- Desde septiembre 2013: los terneros nacidos deben identificarse SOLO con DIIO RFID (no se aceptan aretes sin chip).
- Plazo de aplicación: antes de los 6 meses de vida del animal.

**Quién provee**: Solo distribuidores habilitados por el SAG. La lista está en https://www.sag.gob.cl/content/solicitud-para-distribuidores-de-dispositivo-de-identificacion-individual-oficial-diio

**Diferencia DIIO vs EID**:
- **DIIO**: nombre regulatorio chileno. Es el "arete oficial" en el lenguaje SAG y de los productores.
- **EID**: término técnico anglosajón (Electronic Identification). En SmartCow se usa EID para referirse al número leído electrónicamente por el bastón lector RFID. Es el mismo dispositivo, distinto nombre.

**En SmartCow**: El campo EID almacena el número electrónico leído por RFID. El DIIO es el número visual impreso en el arete (pueden coincidir o tener formato distinto en la representación).

**Fuente**: https://www.sag.gob.cl/ambitos-de-accion/identificacion-animal-oficial

---

### EID — Electronic Identification
**EN**: Electronic ID / RFID tag number

**Definición**: Número único leído electrónicamente del chip RFID del DIIO. En SmartCow, el campo `eid` del animal almacena este identificador leído con bastón lector (ej. Tru-Test XRS2i).

**Norma técnica**: ISO 11784 (código de animal) e ISO 11785 (protocolo de transmisión). Chile adoptó la norma ISO para sus DIIO.

**Diferencia con DIIO**: DIIO es el dispositivo físico (arete oficial SAG). EID es el número electrónico contenido en el chip. En la práctica cotidiana del predio, muchos usan ambos términos indistintamente.

---

### Ecografía reproductiva
**EN**: Reproductive ultrasound / Pregnancy diagnosis by ultrasound

**Definición**: Método de diagnóstico de preñez mediante ultrasonografía transrectal. Permite confirmar si una vaca está preñada, estimar la edad gestacional y detectar anomalías ováricas o uterinas.

**Protocolo Chile**:
- Diagnóstico precoz posible: desde día 25–28 post-inseminación
- Diagnóstico confiable (práctica habitual): día 30–45 post-inseminación
- Confirmación definitiva: día 45–60

**Campos que registrar**:
- Fecha de ecografía
- Animal ID (vaca examinada)
- Resultado: preñada/vacía/dudosa
- Días de gestación estimados
- Fecha probable de parto (calculada)
- Veterinario/técnico que realizó el examen
- Observaciones (gemelar, anomalías)

**En SmartCow**: Tabla `ecografias` registra estos campos.

---

### EID (lector) — Bastón lector RFID / Tru-Test XRS2i
**EN**: EID Stick Reader

**Definición**: Dispositivo portátil que lee el chip RFID del DIIO/arete del bovino por proximidad (hasta 30 cm). El bastón XRS2i de Tru-Test/Datamars es el modelo más usado en Chile.

**Especificaciones XRS2i**:
- Lee tags ISO HDX y FDX-B (el DIIO chileno usa FDX-B)
- Distancia de lectura: HDX hasta 30 cm, FDX hasta 33 cm
- Capacidad: hasta 1 millón de números EID en memoria
- Conectividad: Bluetooth clase 1 (hasta 90 m a indicador de balanza)
- Batería: hasta 9.5 horas (lectura continua)
- Protección: IP67 (sumergible)
- Peso: 0.73 kg

**Integración con balanzas**: Se conecta vía Bluetooth a indicadores de peso Tru-Test (S3 Gallagher, etc.), permitiendo pesar y leer EID simultáneamente.

**Fuente**: https://us.tru-test.com/products/eid-readers/xrs2i-stick-reader

---

### Engordero
**EN**: Cattle feeder / Feedlot operator

**Definición**: Productor ganadero cuya actividad es comprar animales en recría (generalmente terneros destetados de 150–300 kg) y engordarlos hasta peso de faena. Puede tener sistema a pasto, feedlot intensivo, o mixto.

---

### Faena / Faenamiento
**EN**: Slaughter / Processing

**Definición**: Proceso de sacrificio del bovino en planta frigorífica habilitada por el SAG para obtener la canal (carne en vara) y subproductos (cuero, vísceras, sebo, sangre). En Chile se requiere inspección veterinaria oficial en toda faena comercial.

**Etapas**: aturdimiento → sangrado → descuerado → eviscerado → división canal → tipificación → refrigeración.

**En SmartCow**: Cuando el tipo de baja es "faena", se registra en tabla `bajas`. El peso al ingreso a planta y el rendimiento en vara son datos que idealmente provienen de la planta.

**Diferencia regional**: En Argentina también se llama "faena". En México "sacrificio" o "rastro". En Uruguay "faena". Término consistente en el Cono Sur.

---

### FMA — Formulario de Movimiento Animal
**EN**: Animal Movement Form

**Definición**: Documento oficial del SAG que debe acompañar obligatoriamente todo movimiento de animales entre predios con RUP. Equivale a la "guía de movimiento" o "guía de libre tránsito".

**Obligatoriedad**: Todo traslado de bovinos (y equinos, porcinos, ovinos, caprinos, camélidos, venados, jabalí y búfalo) entre predios con RUP requiere FMA.

**Datos que contiene**: predio origen (RUP), predio destino (RUP), DIIO de cada animal (o número de lote), especie, categoría, cantidad, fecha de movimiento, firma del propietario.

**Obtención**: SAG en línea (SIPECweb), oficinas SAG regionales, unidades Carabineros.

**Ley**: Ley 20.596 obliga el uso del FMA para prevención del abigeato (robo de ganado).

**Fuente**: https://www.sag.gob.cl/ambitos-de-accion/registro-de-movimiento-animal

---

### Feedlot
**EN**: Feedlot / Confined feeding operation

**Definición**: Sistema de engorda intensiva donde los bovinos son confinados en corrales y reciben una ración diaria formulada (alta en energía: granos + forrajes + subproductos), sin acceso a pastoreo. El objetivo es maximizar la GDP y alcanzar el peso de faena en el menor tiempo posible.

**Características típicas Chile**:
- Corrales de tierra con comederos y bebederos
- 80–150 animales por corral (10–15 m² por cabeza)
- Ración total mezclada (RTM o TMR): 60–75% granos + 20–30% forraje + 5–10% suplementos
- Duración: 60–120 días
- GDP: 1.2–1.6 kg/día
- ICE: 6.0–8.0 kg MS/kg PV

**En SmartCow**: Los módulos `feedlot` y `crianza` (feature flags) determinan qué funcionalidades están disponibles.

**Diferencia regional**: En Argentina "feedlot" o "corral de engorda". En México "corral de engorda" o "confinamiento". El término "feedlot" se usa tal cual en Chile por el sector técnico y exportador.

---

### Frigorífico / Planta faenadora
**EN**: Slaughterhouse / Packing plant / Processing facility

**Definición**: Establecimiento industrial habilitado por el SAG para el faenamiento de animales y la producción de carne. Los frigoríficos exportadores están también habilitados por el SAG para cumplir normas de mercados de destino.

**Diferencia**: "Frigorífico" implica también capacidad de frío (cámaras frigoríficas). "Matadero" es el término antiguo, hoy en desuso formal en Chile.

---

### Fundo
**EN**: Large farm / Ranch / Estate

**Definición**: Propiedad rural de gran extensión, principalmente destinada a actividades agropecuarias o forestales. En Chile el fundo es la propiedad característica de la gran agricultura y ganadería del sur del país. Puede abarcar desde cientos hasta miles de hectáreas.

**Diferencia con predio**: "Predio" es el término genérico para cualquier propiedad rural, independiente del tamaño. Todo fundo es un predio, pero no todo predio es un fundo.

**Diferencia con parcela**: La parcela (o "parcela de agrado") es una subdivisión pequeña de tierra rural, generalmente <20 ha, usualmente para uso residencial o producción a pequeña escala.

**En SmartCow**: La tabla `fundos` representa esta entidad. Un fundo puede tener múltiples `predios` (subdivisiones o sectores).

---

### GDP — Ganancia Diaria de Peso
**EN**: ADG — Average Daily Gain

**Definición**: Kilogramos de peso vivo ganados por el animal en promedio por día, calculado entre dos pesajes.

**Fórmula**: GDP = (Peso_final - Peso_inicial) / Días

**Ver también**: Entrada completa en **kpis.md**.

---

### Gestación / Preñez
**EN**: Gestation / Pregnancy

**Definición**: Período desde la concepción hasta el parto. En bovinos europeos (Bos taurus): 278–285 días, promedio ~280 días. En bovinos cebuinos (Bos indicus): ~285 días.

**Nota práctica**: La gestación de machos es ~1 día más larga que la de hembras. Gestaciones gemelares son ~3–6 días más cortas.

**Diferencia preñez vs gestación**: "Preñez" es el estado (estar preñada). "Gestación" es el proceso y la duración. En Chile se usan indistintamente en el campo ("la vaca está preñada", "el período de gestación").

---

### Guía de Movimiento / FMA
Ver entrada **FMA**.

**EN**: Cattle movement permit / Animal movement form

**Nota**: En Chile el término oficial es "Formulario de Movimiento Animal (FMA)". En Argentina se llama "DTE (Documento de Tránsito de Hacienda)". En Uruguay "GDE (Guía de Embarque)". En México "Certificado Zoosanitario de Movilización".

---

### IATF — Inseminación Artificial a Tiempo Fijo
**EN**: FTAI — Fixed-Time Artificial Insemination

**Definición**: Protocolo de sincronización hormonal que permite inseminar a todas las vacas en un momento predefinido, sin necesidad de detectar el celo individualmente. Se aplica mediante una secuencia hormonal (GnRH + progesterona + estradiol + prostaglandinas) durante 7–9 días.

**Protocolo estándar (Ovsynch o similar)**:
- Día 0: aplicación GnRH + inserción dispositivo progesterona intravaginal
- Día 7: retiro dispositivo + prostaglandina F2α
- Día 8–9: segunda GnRH (16h post-prostaglandina)
- Día 9–10: inseminación a tiempo fijo (IATF)

**Tasa de concepción IATF en Chile**:
- Promedio: 40–65%
- Estudio UChile (Melipilla): 54% promedio (2 temporadas)
- Factores: condición corporal, nutrición, experiencia inseminador, calidad semen

**Ventaja principal**: Permite inseminar todo el rebaño en 2–3 días, facilitando el manejo y la sincronía del parto.

**En SmartCow**: Tabla `inseminaciones` registra método (IATF vs IA convencional vs monta natural), fecha, pajuela/toro usado.

---

### ICE — Índice de Conversión
Ver entrada **Conversión Alimenticia**.

---

### Intervalo entre Partos (IEP)
**EN**: Calving Interval

**Definición**: Número de días entre un parto y el siguiente de la misma vaca. El ideal es 365 días (1 parto/año). En Chile promedia 380–420 días en sistemas no tecnificados.

**Fórmula**: IEP = Fecha_parto_N+1 - Fecha_parto_N (en días)

---

### Kilos Vivos vs Kilos en Vara
**EN**: Live weight vs Carcass weight / Dressed weight

**Kilos vivos (PV)**: Peso del animal en pie, vivo, generalmente con el rumen lleno. Es el peso al que se comercializa en feria o al que ingresa a la planta.

**Kilos en vara (o kg canal)**: Peso de la canal tras la faena (sin cuero, cabeza, vísceras, patas). Es el peso al que la planta compra la carne.

**Relación**: 1 kg vara ≈ 1.85–1.95 kg vivos (con rendimiento 51–54%).

**En SmartCow**: Los pesajes de la tabla `pesajes` son siempre en kilos vivos. Los pesos de canal vienen de las plantas y pueden registrarse en `bajas` al cierre.

---

### Lote
**EN**: Lot / Batch / Management group

**Definición**: Grupo de animales manejados conjuntamente por tener características similares (peso, edad, origen, sexo). En feedlot, un lote comparte el mismo corral y ración. El lote es la unidad de gestión en SmartCow.

**En SmartCow**: Tabla `lotes`. Permite calcular GDP promedio por lote, mortalidad por lote, ICE por lote.

**Diferencia con potrero**: El lote es un agrupamiento lógico de animales. El potrero es un espacio físico de tierra. Un lote puede moverse entre potreros; un potrero puede contener distintos lotes en distintos momentos.

---

### Macho entero
**EN**: Intact male / Bull (young)

**Definición**: Macho bovino no castrado. Puede ser: ternero entero (0–6 meses), torito (joven, dientes de leche), toro (adulto reproductor), o toruno (macho entero de edad intermedia).

**Diferencia con castrado**: El macho entero tiene mayor GDP pero mayor agresividad y peor manejo en corrales mixtos. En Chile la mayoría de los novillos de engorda son castrados.

---

### Macho castrado / Castrado
**EN**: Castrated male / Steer

**Definición**: Macho bovino al que se le han extirpado los testículos. La castración temprana (2–6 meses) mejora el manejo y la calidad de la carne (mayor deposición grasa intramuscular, terneza). El castrado se denomina "novillo" en Chile una vez que tiene más de 2 dientes permanentes.

---

### Mediería / Mediero
**EN**: Sharecropping arrangement / Sharecropper (livestock)

**Definición**: Contrato agrario chileno en el que el propietario del predio o los animales cede su uso a un mediero a cambio de compartir los frutos o crías. En ganadería: el propietario aporta el predio y/o los animales; el mediero aporta trabajo y gestión; ambos se dividen las crías (generalmente 50/50) y asumen solidariamente gastos y riesgos.

**Base legal**: Ley 17.510 y normativa agraria chilena (Código del Trabajo, art. sobre mediería). Fuente: https://www.bcn.cl/leychile/navegar?idNorma=29070

**Contexto Chile**: La mediería ganadera es especialmente común en la zona sur (Araucanía, Los Ríos, Los Lagos) entre pequeños propietarios y agricultores sin tierra. Es una forma de cooperación productiva característica de la economía campesina chilena.

**En SmartCow**: Tabla `medieros`. Registra el mediero asociado a un lote o conjunto de animales, permitiendo calcular la distribución de utilidades.

**Diferencia regional**: En Argentina existe la "aparcería" que es similar. En México se llama "mediero" también pero el modelo de distribución puede variar. El término es específico de Chile/Cono Sur para la ganadería campesina.

---

### Mortalidad
**EN**: Mortality rate

**Definición**: Porcentaje de animales muertos sobre el total del inventario en un período. Ver entrada completa en **kpis.md**.

---

### Novillo
**EN**: Steer

**Definición**: Macho bovino castrado, de entre 4 y 6 dientes permanentes (aproximadamente 18–36 meses de edad). Es la categoría principal de engorda y faena en Chile.

**Clasificación NCh 1423**: Novillo (4–6D) — 4 a 6 dientes permanentes
**Peso típico faena Chile**: 480–550 kg vivos

**Diferencia regional**: En Argentina "novillo" también es el macho castrado joven/adulto, igual que Chile. En México puede llamarse "novillón" al animal más pesado, o simplemente "toro castrado". El uso es consistente en Chile y Argentina.

---

### Novillito
**EN**: Young steer / Yearling steer

**Definición**: Macho bovino castrado joven, de dientes de leche (DL*) o con 2 dientes permanentes (2D). Aproximadamente 12–20 meses de edad. Es la categoría de mayor valor en la tipificación de canales (categoría V o A).

**Clasificación NCh 1423**: Novillito (DL* o 2D)
**Clasificación canal NCh 1306**: Su canal puede clasificar en categoría V (la premium)

**Diferencia regional**: En Argentina "novillito" tiene el mismo significado. En Uruguay se usa igual. En México el término no es común; se habla de "becerro" o "añojo".

---

### ODEPA — Oficina de Estudios y Políticas Agrarias
**EN**: Office of Studies and Agricultural Policies

**Definición**: Organismo técnico del Ministerio de Agricultura de Chile. Publica estadísticas, precios de mercado, informes del sector agrícola y ganadero. Es la fuente oficial de datos de precios y producción de la ganadería chilena.

**Publicaciones ganaderas**:
- Boletín mensual de carne bovina
- Boletín semanal AFECH (precios en feria)
- Estadísticas de faena mensual (INE + ODEPA)
- Informes de importación/exportación

**Web**: https://www.odepa.gob.cl

**En SmartCow**: Los datos de `precios_feria` provienen del boletín AFECH publicado por ODEPA.

---

### Potrero
**EN**: Paddock / Pasture / Field

**Definición**: Subdivisión de tierra dentro de un predio o fundo, destinada al pastoreo o al cultivo forrajero. Es la unidad de manejo del pastoreo en Chile. Un predio puede tener múltiples potreros que se rotan para optimizar el uso de la pradera.

**Diferencia con corral**: El potrero es una parcela de tierra con pasto, típicamente varios cientos o miles de m² a varias hectáreas. El corral es una instalación de confinamiento pequeña (feedlot), sin pasto.

**Diferencia con predio**: El predio es el inmueble completo. El potrero es una subdivisión funcional del predio.

**En SmartCow**: Tabla `potreros` + tabla `movimientos_potrero`. Los movimientos entre potreros permiten el manejo rotacional y calcular la carga animal por potrero.

**Diferencia regional**: En Argentina "potrero" tiene el mismo significado. En Uruguay "potreros" o "cuadros". En Brasil "pasto" o "piquete". En México "potrero" también.

---

### Predio
**EN**: Property / Farm / Holding

**Definición**: Término genérico para cualquier propiedad rural, de cualquier tamaño, inscrita como unidad en el sistema de registro de predios. Todo establecimiento ganadero con RUP tiene un predio asociado.

**En SmartCow**: La tabla central `predios` (vinculada a `fundos` y `organizaciones`). Todos los datos del sistema están segregados por `predio_id`.

---

### Recría
**EN**: Backgrounding / Growing / Stocker phase

**Definición**: Etapa del ciclo productivo bovino entre el destete y el inicio de la engorda intensiva. El animal (ternero destetado) crece en peso y tamaño principalmente a pastoreo, preparándose para la engorda final.

**Duración Chile**: 6–12 meses (meses 6–18 de vida del animal)
**Peso entrada**: 150–200 kg (al destete)
**Peso salida**: 300–380 kg (listo para feedlot)
**GDP recría pastoreo sur Chile**: 0.5–0.8 kg/día

**Diferencia regional**: En Argentina se usa "recría" igual que en Chile. En México "desarrollo" o "fase de crecimiento". En EE.UU. "backgrounding" o "stocker" phase.

---

### Rendimiento en Vara (%)
**EN**: Dressing percentage / Carcass yield

**Definición**: Porcentaje del peso vivo del animal que se convierte en canal tras la faena.

**Fórmula**: (kg canal caliente / kg vivo ante-mortem) × 100

**Rango Chile**: 52–55% (promedio nacional ~52%).

**Ver también**: Entrada completa en **kpis.md**.

---

### RUP — Rol Único Pecuario
**EN**: Unique Livestock Registration Number

**Definición**: Número de registro asignado por el SAG a cada establecimiento ganadero en Chile. Identifica de forma única cada predio que declara tener animales. Es obligatorio para comprar DIIO, realizar movimientos de animales y participar en el programa de trazabilidad.

**Obligatoriedad**: Todo predio con bovinos debe tener RUP. Se obtiene en oficinas SAG al presentar la documentación de la propiedad.

**En SIPEC**: El RUP es la clave de registro de cada predio en el Sistema de Información Pecuaria (SIPECweb).

---

### SAG — Servicio Agrícola y Ganadero
**EN**: Agricultural and Livestock Service (Chile's USDA equivalent)

**Definición**: Organismo público del Ministerio de Agricultura de Chile. Regula y supervisa la sanidad animal y vegetal, la trazabilidad animal, la certificación de alimentos y la protección del patrimonio fitozoosanitario del país.

**Rol ganadero**: Gestiona el programa de trazabilidad, administra los DIIO, inspecciona plantas faenadoras, emite certificados zoosanitarios de exportación.

**Web**: https://www.sag.gob.cl

---

### SIPEC / SIPECweb
**EN**: Livestock Information System (SAG)

**Definición**: Sistema informático nacional del SAG donde se registra toda la información del Programa de Trazabilidad Animal: nacimientos, movimientos, identificaciones, inventarios de predios (DEA), y establecimientos (RUP).

**Acceso**: https://www.sag.gob.cl/ambitos-de-accion/acceso-directo-sipecweb — disponible para productores con RUP.

---

### Tasa de Destete
**EN**: Weaning rate / Calf crop percentage

**Definición**: Número de terneros destetados como porcentaje de las vacas expuestas al servicio. Es el indicador de eficiencia reproductiva más práctico para predios de cría.

**Ver completo en kpis.md**.

---

### Tasa de Preñez
**EN**: Pregnancy rate

**Definición**: Porcentaje de hembras preñadas sobre el total expuestas al servicio.

**Ver completo en kpis.md**.

---

### Ternero / Ternera al pie de la madre
**EN**: Suckling calf / Nursing calf

**Definición**: Animal bovino desde el nacimiento hasta el destete (0–6/8 meses), que aún mama de su madre. "Al pie de la madre" especifica que no ha sido destetado.

**Peso al nacer**: 30–45 kg
**Peso al destete**: 150–200 kg

**Clasificación NCh 1423**: Ternero/a (DL = dientes de leche sin permanentes)

**En SmartCow**: Al nacer queda registrado en tabla `partos` (como cría) y en tabla `animales` (con su propio ID).

---

### Ternero destetado
**EN**: Weaned calf / Stocker calf

**Definición**: Animal bovino recién separado de su madre, en los primeros días/semanas post-destete. Es la categoría comercializada en ferias ganaderas por los crianceros a los engorderos. Peso: 150–200 kg.

**Es diferente de "ternero al pie"**: El ternero destetado ya no mama.

---

### Toruno
**EN**: Cryptorchid bull / Stag (improperly castrated male)

**Definición**: Macho bovino con testículos no descendidos (criptorquídeo) o que fue castrado de forma incorrecta/parcial, conservando tejido testicular funcionante. Se comporta como macho entero (monta, agresivo) pero con fertilidad reducida o nula.

**Clasificación NCh 1423**: Toruno (2–8D*) — identificado por su comportamiento y conformación atípica.

**En SmartCow**: Puede aparecer como `tipo_ganado = toruno` o `macho entero` en el campo de sexo/tipo.

**Diferencia regional**: En Argentina también "toruno". En México "capón mal castrado" o "macho". Término consistente en Cono Sur.

---

### Toro
**EN**: Bull

**Definición**: Macho bovino entero (no castrado), reproductor. En Chile, el toro de servicio es evaluado anualmente con examen andrológico (morfología espermática, motilidad, capacidad de servicio).

**Clasificación NCh 1423**: Toro (2–8D*)
**Relación vaca:toro**: 1 toro por 25–30 vacas en monta natural a campo.

---

### Torito
**EN**: Young bull / Bull calf

**Definición**: Macho bovino entero joven, con dientes de leche (DL*), de hasta ~14–16 meses. Si no se castra, se convertirá en toro; si se castra, pasará a la categoría novillito.

**Clasificación NCh 1423**: Torito (DL*)

---

### Trazabilidad
**EN**: Traceability

**Definición**: Capacidad de seguir el historial completo de un animal (o producto cárnico) a lo largo de toda la cadena productiva: predio de nacimiento → predios de tránsito → planta de faena → distribución. En Chile la trazabilidad bovina está regulada por el SAG mediante el DIIO, el FMA y el SIPEC.

**Objetivo**: Control sanitario rápido ante brotes de enfermedades, y certificación de origen para mercados exportadores (especialmente Asia y UE).

**Fuente**: https://www.sag.gob.cl/ambitos-de-accion/programa-oficial-de-trazabilidad-animal

---

### Vaca
**EN**: Cow

**Definición**: Hembra bovina adulta que ya ha parido al menos una vez. En Chile, la clasificación por dentición: vaca joven (4–6D), vaca adulta (8D), vaca vieja (8D*).

**Vaca de cría**: Vaca del rebaño reproductivo que produce terneros.
**Vaca de descarte**: Vaca eliminada del rebaño (por vejez, baja producción reproductiva, enfermedad) y enviada a faena.

**Clasificación NCh 1423**: Vaca joven (4–6D), Vaca adulta (8D), Vaca vieja (8D*)

---

### Vaquilla
**EN**: Heifer

**Definición**: Hembra bovina que aún no ha parido, con dientes de leche o 2 dientes permanentes (DL* o 2D), generalmente de 12–24 meses. Puede estar en recría, en servicio por primera vez (vaquilla de primer servicio), o preñada por primera vez.

**Clasificación NCh 1423**: Vaquilla (DL* o 2D)
**Peso de primer servicio Chile**: 300–350 kg (14–18 meses de edad)

**Diferencia regional**: En Argentina "vaquillona" para la hembra joven más grande. En Chile "vaquilla" es el término estándar. En México "vaquilla" también.

---

### Vaquilla gorda / Vaquilla de engorda
**EN**: Fat heifer / Heifer for slaughter

**Definición**: Términos comerciales usados en ferias chilenas:
- **Vaquilla gorda**: hembra joven (2–3 años) terminada para faena inmediata.
- **Vaquilla de engorda**: hembra joven que aún necesita engorda antes de ir a faena.

Son las categorías que aparecen en el boletín AFECH.

---

### Zona de producción bovina en Chile
**EN**: Chile cattle production zones

**Principales regiones productoras** (>70% de bovinos nacionales):
- **Los Lagos** (33% del stock nacional): zona más importante de doble propósito y carne
- **Los Ríos** (18%): principalmente leche y carne
- **La Araucanía** (14%): cría y recría principalmente
- **Biobío** (11%): sistemas mixtos
- **Maule** (7.5%): cría y algo de engorda
- **Aysén** (5.3%): ganadería extensiva, razas de carne (Hereford, Angus)

**Fuente**: INE Chile / ODEPA censo ganadero.
