/**
 * src/lib/linear-feedback.ts — Handler de la tool reportar_feedback.
 * Ticket: AUT-277
 *
 * Crea issues en Linear (team Autonomos Dev) cuando JP reporta feedback
 * desde el chat ganadero. Incluye deduplicación de 7 días.
 *
 * Requiere LINEAR_API_KEY en env. Si no está, retorna error gracioso.
 */

const LINEAR_GRAPHQL = "https://api.linear.app/graphql";
const LINEAR_TEAM_ID = "b0184c23-f78a-4035-bd78-74b75481292c";
const LINEAR_ASSIGNEE_ID = "36766122-235b-4959-8228-c0d261a54df3"; // Cesar Duran

export interface FeedbackArgs {
  tipo: string;
  titulo: string;
  descripcion: string;
  severidad?: string;
  transcript: string;
}

export interface FeedbackContext {
  email: string;
  nombre: string;
  predioNombre: string;
}

export interface FeedbackResult {
  id?: string;
  url?: string;
  identifier?: string;
  duplicado: boolean;
  mensaje: string;
  error?: string;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function linearGql<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown>,
  apiKey: string
): Promise<T> {
  const res = await fetch(LINEAR_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Linear API HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("Linear API: no data en response");
  return json.data;
}

/** Compara dos títulos y retorna fracción de palabras en común (ignora < 3 chars). */
function wordOverlap(a: string, b: string): number {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3)
    );
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / wa.size;
}

/** Busca issues recientes (7d) con título similar. Retorna el primero con overlap > 0.6. */
async function findDuplicate(
  titulo: string,
  apiKey: string
): Promise<{ id: string; url: string; identifier: string } | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Usamos las primeras 4 palabras como query de búsqueda
  const searchTerms = titulo
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");

  const query = `
    query FindDuplicate($teamId: ID!, $query: String!, $createdAfter: DateTimeOrDuration!) {
      issues(filter: {
        team: { id: { eq: $teamId } }
        createdAt: { gte: $createdAfter }
        title: { containsIgnoreCase: $query }
        state: { type: { neq: "cancelled" } }
      }, first: 10) {
        nodes { id url identifier title }
      }
    }
  `;

  try {
    const data = await linearGql<{
      issues: { nodes: Array<{ id: string; url: string; identifier: string; title: string }> };
    }>(query, { teamId: LINEAR_TEAM_ID, query: searchTerms, createdAfter: sevenDaysAgo }, apiKey);

    const match = (data.issues?.nodes ?? []).find(
      (n) => wordOverlap(titulo, n.title) > 0.6
    );
    return match ?? null;
  } catch {
    // Deduplicación no crítica — si falla, continuar sin ella
    return null;
  }
}

/** Obtiene o crea un label por nombre en el team. Retorna el ID o null si falla. */
async function getOrCreateLabel(
  name: string,
  color: string,
  apiKey: string
): Promise<string | null> {
  const queryLabels = `
    query GetLabel($teamId: ID!, $name: String!) {
      issueLabels(filter: {
        team: { id: { eq: $teamId } }
        name: { eq: $name }
      }, first: 1) {
        nodes { id }
      }
    }
  `;
  try {
    const data = await linearGql<{
      issueLabels: { nodes: Array<{ id: string }> };
    }>(queryLabels, { teamId: LINEAR_TEAM_ID, name }, apiKey);

    if (data.issueLabels?.nodes?.[0]?.id) {
      return data.issueLabels.nodes[0].id;
    }

    // Crear label
    const mutCreate = `
      mutation CreateLabel($teamId: String!, $name: String!, $color: String!) {
        issueLabelCreate(input: { teamId: $teamId, name: $name, color: $color }) {
          issueLabel { id }
        }
      }
    `;
    const created = await linearGql<{
      issueLabelCreate: { issueLabel: { id: string } };
    }>(mutCreate, { teamId: LINEAR_TEAM_ID, name, color }, apiKey);
    return created.issueLabelCreate?.issueLabel?.id ?? null;
  } catch {
    return null;
  }
}

/** Agrega un comentario a un issue existente. */
async function addComment(issueId: string, body: string, apiKey: string): Promise<void> {
  const mutation = `
    mutation AddComment($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        comment { id }
      }
    }
  `;
  await linearGql(mutation, { issueId, body }, apiKey);
}

// ─────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────

export async function ejecutarReportarFeedback(
  args: FeedbackArgs,
  ctx: FeedbackContext
): Promise<FeedbackResult> {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return {
      duplicado: false,
      error: "LINEAR_API_KEY no configurada — feedback no disponible en este entorno",
      mensaje: "No puedo crear el ticket ahora. Díselo a Cesar directamente.",
    };
  }

  // Validar tipo
  const tiposValidos = ["bug", "tweak", "feature", "cambio_estructural"];
  const tipo = tiposValidos.includes(args.tipo) ? args.tipo : "tweak";

  // Truncar campos al límite
  const titulo = args.titulo.slice(0, 60);
  const descripcion = args.descripcion.slice(0, 500);

  const ahora = new Date().toISOString().split("T")[0];
  const severidadStr = args.severidad ?? "N/A";

  // ── Prioridad: bug-bloquea = 1 (Urgent), resto = 3 (Normal)
  const priority =
    tipo === "bug" && args.severidad === "bloquea" ? 1 : 3;

  // ── Deduplicación: buscar issues similares en últimos 7 días
  const duplicado = await findDuplicate(titulo, apiKey);

  if (duplicado) {
    // Agregar transcript como comentario al issue existente
    const commentBody =
      `\`\`\`\n📎 Reporte duplicado | ${ahora} | [JP]\n──────────────────────────────────────────────────\nUsuario:   ${ctx.email}\nPredi:     ${ctx.predioNombre}\n\nCONVERSACIÓN NUEVA\n${args.transcript}\n\`\`\``;
    try {
      await addComment(duplicado.id, commentBody, apiKey);
    } catch {
      // Si falla el comentario, reportar el duplicado igualmente
    }
    return {
      id: duplicado.id,
      url: duplicado.url,
      identifier: duplicado.identifier,
      duplicado: true,
      mensaje: `Duplicado encontrado: ${duplicado.identifier} — sumé tu nota como comentario.`,
    };
  }

  // ── Obtener labels (source:jp + tipo:<tipo>)
  const [labelSourceId, labelTipoId] = await Promise.all([
    getOrCreateLabel("source:jp", "#6B5D4F", apiKey),
    getOrCreateLabel(`tipo:${tipo}`, "#1E3A2F", apiKey),
  ]);
  const labelIds = [labelSourceId, labelTipoId].filter(Boolean) as string[];

  // ── Plantilla de descripción (formato Linear code block)
  const descBody = `\`\`\`\n📋 Feedback JP | ${ahora}\n──────────────────────────────────────────────────\nTIPO:         ${tipo}\nSEVERIDAD:    ${severidadStr}\n──────────────────────────────────────────────────\nQUÉ PASA\n${descripcion}\n──────────────────────────────────────────────────\nCONTEXTO\nPredi:         ${ctx.predioNombre}\nUsuario:       ${ctx.email}\n──────────────────────────────────────────────────\nCONVERSACIÓN ORIGINAL\n${args.transcript}\n\`\`\``;

  // ── Crear issue en Linear
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        issue { id url identifier }
      }
    }
  `;

  const input: Record<string, unknown> = {
    teamId: LINEAR_TEAM_ID,
    title: titulo,
    description: descBody,
    priority,
    assigneeId: LINEAR_ASSIGNEE_ID,
  };
  if (labelIds.length > 0) input.labelIds = labelIds;

  const data = await linearGql<{
    issueCreate: { issue: { id: string; url: string; identifier: string } };
  }>(mutation, { input }, apiKey);

  const issue = data.issueCreate?.issue;
  if (!issue) throw new Error("Linear issueCreate: no retornó issue");

  return {
    id: issue.id,
    url: issue.url,
    identifier: issue.identifier,
    duplicado: false,
    mensaje: `Ticket creado: ${issue.identifier}`,
  };
}
