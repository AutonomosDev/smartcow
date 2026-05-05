"""
Mapeo de los 78 fundos legacy detectados en los archivos del cliente
a los 2 predios del modelo simplificado de smartcow_local.

Decisión arquitectónica (Cesar 2026-04-30 + AUT-388):
  - 1 holding: Agrícola Los Lagos (id=1)
  - 2 predios físicos:
      Agrícola (id=1) → etapa "crianza"
      Feedlot  (id=2) → etapas "recria" + "engorda"

Los 78 nombres únicos detectados se separan en:

  · INTERNOS: predios reales del holding. Mapean a id=1 o id=2.
              Cualquier evento (pesaje, parto, etc.) con un fundo
              interno se carga con su predio_id correspondiente.

  · EXTERNOS: destinos de venta/traslado, ferias, compradores,
              agrícolas terceras. NO son predios del holding.
              Para ventas/traslados se guardan como string en
              el campo `destino`. Para eventos internos
              (pesajes/partos/etc.) un fundo externo es DATA
              SUCIA y se descarta.
"""
from typing import Optional

# id=1 → Agrícola, id=2 → Feedlot
FUNDOS_INTERNOS: dict[str, int] = {
    # ─── Feedlot id=2 (recria + engorda) ─────────────────
    "feedlot": 2,
    "Feedlot": 2,
    "Medieria FT": 2,            # FT = Feedlot
    "Medieria Frival": 2,
    "Medieria Oller": 2,
    "Recría FT": 2,
    "Recría Feedlot": 2,
    "Corrales del Sur": 2,       # corrales engorda

    # ─── Agrícola id=1 (crianza) ─────────────────────────
    "San Pedro": 1,              # core de crianza histórico
    "Mollendo": 1,
    "Mollendo 12-03": 1,
    "Aguas Buenas": 1,
    "Arriendo Santa Isabel": 1,
    "Ag Santa Isabel": 1,
    "Santa Isabel (1)": 1,
    "Santa Isabel (2)": 1,
    "sta isabel": 1,
    "Chacaipulli": 1,
    "Medieria Chacaipulli": 1,
    "Arriendo las quebradas": 1,
}

# Fundos externos (destinos de venta, ferias, compradores).
# Ningún animal del holding "está" acá — son lugares donde el
# animal salió del holding o de donde no es nuestro.
FUNDOS_EXTERNOS: set[str] = {
    # Ferias y casas de remate
    "Tattersall Coyhaique",
    "Tattersall Río Bueno",
    "Tattersall Puerto Varas",
    "Fegosa Puerto Montt",
    "Fegosa Puerto Montt (1)",
    "Fegosa Puerto Montt (2)",
    "Fegosa Pto Montt",
    "Fegosa Pto montt",
    "Fegosa Purranque",
    "Fegosa Purranque Osorno",
    "Fegosa Purranque & Osorno",
    "Fegosa Osorno",
    "Fegosa Paillaco",
    "Feria Remehue",

    # Localidades sin afiliación clara
    "Pto Montt",
    "Pto Varas",
    "Pto varas",
    "Pta Arena",
    "Frutillar",
    "Purranque",
    "Futrono",

    # Otras agrícolas / personas (compradores)
    "Mantos Verdes",
    "Mantos Verdes (1)",
    "Mantos Verdes (2)",
    "Mantos Verdes 1",
    "Mantos Verdes 2",
    "Mantos Verdes (12-03-26)",
    "Ag Mantos Verdes (1)",
    "Ag Mantos Verdes (2)",
    "AG Mantos Verdes",
    "Agrícola Mantos Verdes",
    "Agrícola Gondesende",
    "Agrícola Gondesende (1)",
    "Agrícola Gondesende (2)",
    "Agrícola Valdivia",
    "Agrícola los Lingues",
    "Ag Santa Alejandra",
    "Ag Santa Alejandra (1)",
    "Ag Santa Alejandra (2)",
    "Doña Charo (1)",
    "Doña Charo (2)",
    "El Pampero",
    "Ganadera el Pampero",
    "Ganadera Viento Sur",
    "Inversiones El Rocio",
    "buena esperanza",
    "Ag. Rayen Lafquen",
    "ag. Rayen Lafquen",
    "Rayen Lafquen",

    # Personas (compradores particulares)
    "Hugo Reyes",
    "Mario Hernandez",
    "Oscar Hitschafeld",
    "Oscar Hitschfeld",
    "Oscar hitschfeld",
    "Oscar hitschafeldt",
    "Oscar H. Bugueno",
    "José Steffen",
    "Arlette Fuentealba",
    "Winkler",
}


def map_fundo_a_predio(fundo: Optional[str]) -> Optional[int]:
    """Devuelve predio_id (1=Agrícola, 2=Feedlot) o None si externo/desconocido.

    None significa: este fundo NO es del holding, NO carga este evento
    con un predio_id válido.
    """
    if fundo is None:
        return None
    s = str(fundo).strip()
    if not s:
        return None
    return FUNDOS_INTERNOS.get(s)


def is_externo(fundo: Optional[str]) -> bool:
    """True si el fundo es un destino externo (feria/comprador)."""
    if fundo is None:
        return False
    return str(fundo).strip() in FUNDOS_EXTERNOS


def clasificar(fundo: Optional[str]) -> tuple[str, Optional[int]]:
    """('interno'|'externo'|'desconocido', predio_id|None).

    'desconocido' = no está en ninguna lista, hay que revisar.
    """
    if fundo is None:
        return ("desconocido", None)
    s = str(fundo).strip()
    if not s:
        return ("desconocido", None)
    if s in FUNDOS_INTERNOS:
        return ("interno", FUNDOS_INTERNOS[s])
    if s in FUNDOS_EXTERNOS:
        return ("externo", None)
    return ("desconocido", None)
