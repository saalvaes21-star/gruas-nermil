import "./lib/error-capture";
import { env as cloudflareEnv } from "cloudflare:workers";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

type Env = {
  AI?: AiBinding;
};

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 2_000_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function extractModelText(output: unknown): string {
  if (typeof output === "string") return output;
  if (!output || typeof output !== "object") return "";
  const record = output as Record<string, unknown>;
  if (typeof record.answer === "string") return record.answer;
  if (typeof record.response === "string") return record.response;
  if (typeof record.result === "string") return record.result;
  if (record.result && typeof record.result === "object") return extractModelText(record.result);
  const choices = record.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as
      { message?: { content?: unknown; reasoning_content?: unknown }; text?: unknown } | undefined;
    if (typeof first?.message?.content === "string" && first.message.content.trim()) {
      return first.message.content;
    }
    if (Array.isArray(first?.message?.content)) {
      return first.message.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object") {
            const item = part as Record<string, unknown>;
            if (typeof item.text === "string") return item.text;
            if (typeof item.content === "string") return item.content;
          }
          return "";
        })
        .join("");
    }
    if (typeof first?.message?.reasoning_content === "string") {
      return first.message.reasoning_content;
    }
    if (typeof first?.text === "string") return first.text;
  }
  return "";
}

function extractTranslatedText(output: unknown): string {
  if (typeof output === "string") return output;
  if (!output || typeof output !== "object") return "";
  const record = output as Record<string, unknown>;
  if (typeof record.translated_text === "string") return record.translated_text;
  if (typeof record.translation === "string") return record.translation;
  if (record.result && typeof record.result === "object") {
    return extractTranslatedText(record.result);
  }
  return "";
}

async function translateAnalysis(env: Env, source: Record<string, unknown>) {
  if (!env.AI) return source;

  const obstacles = Array.isArray(source.obstaculos)
    ? source.obstaculos.filter((item): item is string => typeof item === "string").join(" | ")
    : "";
  const values = [
    source.resumen,
    source.acceso,
    source.espacio,
    source.altura,
    source.recomendacion,
    obstacles,
  ].map((value) => (typeof value === "string" ? value.trim() : ""));

  const markedText = values.map((value, index) => `[[[${index}]]]${value}`).join("\n");
  const output = await env.AI.run("@cf/meta/m2m100-1.2b", {
    text: markedText,
    source_lang: "english",
    target_lang: "spanish",
  });
  const translated = extractTranslatedText(output);
  if (!translated) return source;

  const translatedValues = new Map<number, string>();
  const marker = /\[\[\[(\d)\]\]\]/g;
  const matches = [...translated.matchAll(marker)];
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    translatedValues.set(
      Number(current[1]),
      translated.slice((current.index ?? 0) + current[0].length, next?.index).trim(),
    );
  }
  if (translatedValues.size < 5) return source;

  return {
    ...source,
    resumen: translatedValues.get(0) || source.resumen,
    acceso: translatedValues.get(1) || source.acceso,
    espacio: translatedValues.get(2) || source.espacio,
    altura: translatedValues.get(3) || source.altura,
    recomendacion: translatedValues.get(4) || source.recomendacion,
    obstaculos: (translatedValues.get(5) || obstacles)
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function parseModelJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("La IA no devolvió un resultado estructurado.");
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : fallback;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function handleImageAnalysis(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!env.AI) return json({ error: "El análisis con IA no está configurado todavía." }, 503);

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Origen de solicitud no permitido." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "No fue posible leer las fotografías." }, 400);
  }

  const images = form
    .getAll("images")
    .filter((value): value is File => value instanceof File)
    .slice(0, MAX_IMAGES);
  if (!images.length) return json({ error: "Selecciona al menos una fotografía." }, 400);
  if (images.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES)) {
    return json({ error: "Cada fotografía debe ser JPEG, PNG o WebP de máximo 2 MB." }, 400);
  }

  const prompt = `Analiza esta fotografía como apoyo preliminar para cotizar una grúa con canastilla.
Responde exclusivamente en español y únicamente con un objeto JSON válido, sin markdown, con estas claves:
{
  "resumen": "descripción breve de lo realmente visible",
  "acceso": "observación sobre acceso aparente para una unidad; si no se ve, indícalo",
  "espacio": "observación sobre espacio aparente para posicionar unidad y estabilizadores; si no se ve, indícalo",
  "obstaculos": ["solo obstáculos visibles como cables, árboles, vehículos, marquesinas o mobiliario"],
  "altura": "estimación visual cualitativa; nunca inventes metros",
  "nivelAtencion": "bajo, medio o alto según señales visibles, sin afirmar que el sitio es seguro",
  "recomendacion": "qué debe confirmar una persona antes de cotizar u operar"
}
No identifiques personas, matrículas, domicilios ni datos personales. No declares seguridad, compatibilidad definitiva ni autorización de operación. Si la imagen no permite evaluar algo, dilo claramente.`;

  try {
    const analyses = [];
    for (let index = 0; index < images.length; index += 1) {
      const file = images[index];
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      const output = await env.AI.run("@cf/moondream/moondream3.1-9B-A2B", {
        task: "query",
        image: `data:${file.type};base64,${base64}`,
        question: prompt,
        reasoning: false,
        stream: false,
        max_tokens: 1200,
        temperature: 0.1,
      });
      const modelText = extractModelText(output);
      let parsed = parseModelJson(modelText);
      try {
        parsed = await translateAnalysis(env, parsed);
      } catch {
        // El resultado visual original sigue siendo útil si la traducción no está disponible.
      }
      const obstacles = Array.isArray(parsed.obstaculos)
        ? parsed.obstaculos
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim().slice(0, 180))
            .filter(Boolean)
            .slice(0, 6)
        : [];
      const level = ["bajo", "medio", "alto"].includes(String(parsed.nivelAtencion))
        ? String(parsed.nivelAtencion)
        : "medio";
      const recommendation = cleanText(
        parsed.recomendacion,
        "Confirmar las condiciones directamente antes de cotizar u operar.",
      );
      analyses.push({
        image: index + 1,
        summary: cleanText(parsed.resumen, "No fue posible describir claramente la fotografía."),
        access: cleanText(parsed.acceso, "El acceso no puede confirmarse con esta fotografía."),
        space: cleanText(parsed.espacio, "El espacio de operación no puede confirmarse."),
        obstacles,
        height: cleanText(parsed.altura, "La altura no puede estimarse con precisión."),
        attentionLevel: level,
        recommendation: /identidad|identity/i.test(recommendation)
          ? "Confirmar en sitio el acceso, el espacio de operación y cualquier obstáculo antes de cotizar u operar."
          : recommendation,
      });
    }

    return json({
      analyses,
      disclaimer:
        "Preanálisis automático orientativo. No sustituye la inspección ni la decisión de una persona y no constituye una evaluación de seguridad.",
    });
  } catch (error) {
    console.error("Image analysis failed", error);
    return json(
      { error: "No pudimos analizar las fotografías en este momento. Inténtalo nuevamente." },
      502,
    );
  }
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env | undefined, ctx: unknown) {
    try {
      if (new URL(request.url).pathname === "/api/analyze-images") {
        return await handleImageAnalysis(request, env ?? (cloudflareEnv as Env));
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
