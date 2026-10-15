import { useEffect, useMemo, useState } from "react";
import { services } from "@/config/business";
import { buildWhatsAppMessage, makeFolio, whatsAppUrl } from "@/lib/integrations";
import type { ImagenSolicitud, Solicitud } from "@/types/entities";

const empty: Solicitud = {
  servicio: "",
  ubicacion: "",
  fecha: "",
  altura: "",
  personas: "",
  duracion: "",
  acceso: "",
  obstaculos: "",
  estabilizadores: "",
  observaciones: "",
};
const steps = ["Trabajo", "Lugar", "Condiciones", "Fotos", "Revisar"];
const UNSURE = "No estoy seguro";
const STORAGE_KEY = "rg-cotizacion";

// Preparado para preguntas contextuales por tipo de servicio (sin lógica compleja todavía).
type ContextualConfig = { alturaPlaceholder?: string; observacionesPlaceholder?: string };
type ImageAnalysis = {
  image: number;
  summary: string;
  access: string;
  space: string;
  obstacles: string[];
  height: string;
  attentionLevel: "bajo" | "medio" | "alto";
  recommendation: string;
};
type AnalysisResponse = { analyses: ImageAnalysis[]; disclaimer: string };
const contextual: Partial<Record<string, ContextualConfig>> = {
  "Instalación y mantenimiento de anuncios": {
    observacionesPlaceholder: "Tamaño aproximado del anuncio, acceso, cables…",
  },
  "Cámaras y antenas": { observacionesPlaceholder: "Dónde se instalará, cantidad de equipos…" },
};

export function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Solicitud>(empty);
  const [images, setImages] = useState<ImagenSolicitud[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisState, setAnalysisState] = useState<"idle" | "loading" | "error">("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisConsent, setAnalysisConsent] = useState(false);
  const [folio] = useState(makeFolio);
  const [loaded, setLoaded] = useState(false);
  const ctx = contextual[data.servicio] ?? {};

  // Conserva temporalmente las respuestas (no las fotos) mientras el usuario navega.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Solicitud>;
        if (
          parsed.servicio === "Trabajos en altura" ||
          parsed.servicio === "Otros trabajos especializados"
        ) {
          parsed.servicio = "Otro trabajo en altura";
        }
        setData({ ...empty, ...parsed });
      }
    } catch {
      /* ignorar */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const setVal = (k: keyof Solicitud, v: string) => setData((d) => ({ ...d, [k]: v }));
  const set = (k: keyof Solicitud) => (e: { target: { value: string } }) =>
    setVal(k, e.target.value);

  const canNext = [!!data.servicio, !!data.ubicacion, true, true, true][step];
  const message = useMemo(
    () => buildWhatsAppMessage({ ...data, fotos: images.length }, folio),
    [data, folio, images.length],
  );
  const waUrl = whatsAppUrl(message);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((p) => [...p, ...selected]);
    setAnalysis(null);
    setAnalysisState("idle");
    setAnalysisError("");
  };

  const prepareImage = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No fue posible preparar la fotografía.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.78),
    );
    if (!blob || blob.size > 2_000_000) {
      throw new Error("Una fotografía es demasiado grande para analizarla.");
    }
    return blob;
  };

  const analyzeImages = async () => {
    if (!images.length || !analysisConsent || analysisState === "loading") return;
    setAnalysisState("loading");
    setAnalysisError("");
    setAnalysis(null);
    try {
      const form = new FormData();
      const selected = images.slice(0, 3);
      const prepared = await Promise.all(selected.map(({ file }) => prepareImage(file)));
      prepared.forEach((blob, index) => form.append("images", blob, `foto-${index + 1}.jpg`));
      const response = await fetch("/api/analyze-images", { method: "POST", body: form });
      const payload = (await response.json()) as AnalysisResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "No fue posible realizar el análisis.");
      setAnalysis(payload);
      setAnalysisState("idle");
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "No fue posible realizar el análisis.",
      );
      setAnalysisState("error");
    }
  };
  const status =
    data.estabilizadores === "no" || data.acceso === "Acceso limitado"
      ? "Necesitamos confirmar contigo las condiciones de acceso"
      : images.length && data.altura && data.altura !== UNSURE
        ? "Tu solicitud parece compatible con nuestra unidad"
        : "Necesitamos revisar algunos detalles";

  const summary: [string, string, number][] = [
    ["Servicio", data.servicio, 0],
    ["Ubicación", data.ubicacion, 1],
    ["Fecha", data.fecha, 1],
    ["Altura", data.altura, 2],
    ["Personas", data.personas, 2],
    ["Duración", data.duracion, 2],
    ["Acceso de la unidad", data.acceso, 2],
    ["Obstáculos visibles", data.obstaculos, 2],
    [
      "Espacio de operación",
      {
        si: "Hay espacio para estabilizadores",
        no: "Sin espacio para estabilizadores",
        "no-se": UNSURE,
        "": "",
      }[data.estabilizadores],
      2,
    ],
    ["Fotografías", images.length ? `${images.length} seleccionada(s)` : "", 3],
    ["Preanálisis con IA", analysis ? `${analysis.analyses.length} foto(s) analizada(s)` : "", 3],
    ["Observaciones", data.observaciones, 2],
  ];

  return (
    <div className="panel p-4 sm:p-5">
      <p className="mb-4 text-xs text-muted-foreground">
        Tus respuestas se conservan temporalmente en este dispositivo. Las fotos solo se envían al
        solicitar el preanálisis y no se almacenan en esta aplicación.
      </p>
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Progreso de la cotización">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
            <span
              className={`mt-1.5 block truncate text-[11px] font-semibold ${i === step ? "text-sky" : "text-muted-foreground"}`}
            >
              {i + 1}. {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 space-y-4">
        {step === 0 && (
          <fieldset>
            <legend className="font-bold text-card-foreground">
              ¿Qué trabajo necesitas realizar?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <Choice
                  key={s}
                  active={data.servicio === s}
                  onClick={() => setVal("servicio", s)}
                  className="px-4 py-3 text-left"
                >
                  {s}
                </Choice>
              ))}
            </div>
          </fieldset>
        )}
        {step === 1 && (
          <>
            <Field
              id="q-ubicacion"
              t="Ubicación del servicio"
              hint="La usamos para revisar cobertura y traslado."
            >
              <input
                id="q-ubicacion"
                className="field"
                autoComplete="street-address"
                placeholder="Colonia, alcaldía o municipio"
                value={data.ubicacion}
                onChange={set("ubicacion")}
              />
            </Field>
            <Field id="q-fecha" t="Fecha solicitada (opcional)">
              <input
                id="q-fecha"
                type="date"
                className="field"
                value={data.fecha}
                onChange={set("fecha")}
              />
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <div className="industrial-checkpoint">
              <p className="eyebrow">Condiciones del sitio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estos datos forman parte de la cotización; no necesitas llenar otra evaluación.
              </p>
            </div>
            <OptionGroup
              legend="¿Cómo es el acceso para la unidad?"
              value={data.acceso}
              onChange={(v) => setVal("acceso", v)}
              options={["Acceso amplio", "Acceso limitado", UNSURE]}
            />
            <OptionGroup
              legend="¿Hay obstáculos visibles cerca del área donde se realizará el trabajo?"
              value={data.obstaculos}
              onChange={(v) => setVal("obstaculos", v)}
              options={["No", "Cables", "Árboles", "Vehículos u otros", UNSURE]}
            />
            <Field id="q-altura" t="Altura aproximada">
              <input
                id="q-altura"
                className="field"
                placeholder={ctx.alturaPlaceholder ?? "Ej. 3 pisos"}
                value={data.altura === UNSURE ? "" : data.altura}
                onChange={set("altura")}
                disabled={data.altura === UNSURE}
              />
              <UnsureToggle
                checked={data.altura === UNSURE}
                onChange={(c) => setVal("altura", c ? UNSURE : "")}
              />
            </Field>
            <OptionGroup
              legend="¿Cuántas personas necesitan subir?"
              value={data.personas}
              onChange={(v) => setVal("personas", v)}
              options={["1", "2", UNSURE]}
            />
            <OptionGroup
              legend="Duración aproximada"
              value={data.duracion}
              onChange={(v) => setVal("duracion", v)}
              options={["Menos de 4 horas", "Medio día", "Día completo", "Varios días", UNSURE]}
            />
            <OptionGroup
              legend="¿Hay espacio para estabilizadores?"
              value={data.estabilizadores}
              onChange={(v) => setVal("estabilizadores", v)}
              options={[
                ["si", "Sí"],
                ["no", "No"],
                ["no-se", UNSURE],
              ]}
            />
            <Field id="q-obs" t="Observaciones (opcional)">
              <textarea
                id="q-obs"
                rows={3}
                className="field"
                placeholder={
                  ctx.observacionesPlaceholder ?? "Accesos, cables, horarios, restricciones…"
                }
                value={data.observaciones}
                onChange={set("observaciones")}
              />
            </Field>
          </>
        )}
        {step === 3 && (
          <div>
            <p className="font-bold text-card-foreground">
              ¿Tienes fotos del lugar? Nos ayudan a realizar una mejor evaluación.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nos ayudan a revisar acceso, espacio y obstáculos visibles. Son opcionales.
            </p>
            <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-input bg-muted px-4 py-8 text-center focus-within:ring-2 focus-within:ring-ring">
              <span className="text-sm font-semibold">Toca para seleccionar fotos</span>
              <span className="mt-1 block text-xs text-muted-foreground">Puedes elegir varias</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img, i) => (
                  <div key={img.previewUrl} className="relative">
                    <img
                      src={img.previewUrl}
                      alt={`Foto ${i + 1}`}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar foto ${i + 1}`}
                      onClick={() => {
                        setImages((p) => p.filter((_, j) => j !== i));
                        setAnalysis(null);
                        setAnalysisState("idle");
                      }}
                      className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-background text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <div className="mt-4 rounded-2xl border border-primary/35 bg-primary/5 p-4">
                <p className="font-bold text-card-foreground">Preanálisis visual con IA</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Puede señalar acceso aparente, espacio y obstáculos visibles. Analiza hasta tres
                  fotos y no sustituye la revisión de una persona.
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={analysisConsent}
                    onChange={(event) => setAnalysisConsent(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span>
                    Acepto enviar temporalmente estas fotografías a Cloudflare Workers AI para
                    generar el preanálisis. Entiendo que el resultado es orientativo.
                  </span>
                </label>
                <button
                  type="button"
                  disabled={!analysisConsent || analysisState === "loading"}
                  onClick={analyzeImages}
                  className="btn-hero mt-3 min-h-11 w-full px-5 py-3 text-sm disabled:opacity-40 sm:w-auto"
                >
                  {analysisState === "loading" ? "Analizando fotografías…" : "Analizar con IA"}
                </button>
                {images.length > 3 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Para este preanálisis se usarán las primeras 3 fotografías.
                  </p>
                )}
                {analysisError && (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-700"
                  >
                    {analysisError}
                  </p>
                )}
              </div>
            )}
            {analysis && (
              <div className="mt-4 space-y-3" aria-live="polite">
                <p className="font-bold text-card-foreground">Resultado del preanálisis</p>
                {analysis.analyses.map((item) => (
                  <article
                    key={item.image}
                    className="rounded-2xl border border-border bg-muted p-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-bold">Fotografía {item.image}</h4>
                      <span className="rounded-full border border-primary/40 px-2.5 py-1 text-[11px] font-bold uppercase text-primary">
                        Atención {item.attentionLevel}
                      </span>
                    </div>
                    <p className="mt-2 leading-relaxed">{item.summary}</p>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <div>
                        <dt className="font-bold">Acceso aparente</dt>
                        <dd className="mt-0.5 text-muted-foreground">{item.access}</dd>
                      </div>
                      <div>
                        <dt className="font-bold">Espacio visible</dt>
                        <dd className="mt-0.5 text-muted-foreground">{item.space}</dd>
                      </div>
                      <div>
                        <dt className="font-bold">Altura</dt>
                        <dd className="mt-0.5 text-muted-foreground">{item.height}</dd>
                      </div>
                      <div>
                        <dt className="font-bold">Obstáculos visibles</dt>
                        <dd className="mt-0.5 text-muted-foreground">
                          {item.obstacles.length
                            ? item.obstacles.join(", ")
                            : "No identificados en esta imagen."}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      <strong className="text-card-foreground">Confirmar:</strong>{" "}
                      {item.recommendation}
                    </p>
                  </article>
                ))}
                <p className="rounded-xl border border-primary/35 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                  {analysis.disclaimer}
                </p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Si no solicitas el preanálisis, las imágenes permanecen únicamente en tu dispositivo.
            </p>
          </div>
        )}
        {step === 4 && (
          <div>
            <p className="eyebrow">Revisa tu solicitud · {folio}</p>
            <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-muted text-sm">
              {summary.map(([k, v, s]) => (
                <div
                  key={k}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2"
                >
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="break-words font-medium">{v || "—"}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(s)}
                    className="min-h-11 px-2 text-xs font-semibold text-sky"
                    aria-label={`Editar ${k}`}
                  >
                    Editar
                  </button>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold">
              {status}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Resultado orientativo. Confirmamos contigo los detalles antes de agendar.
            </p>
            {analysis && (
              <p className="mt-2 rounded-xl border border-primary/35 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                La IA analizó {analysis.analyses.length} fotografía(s). Sus observaciones son
                preliminares y requieren confirmación humana antes de cotizar u operar.
              </p>
            )}
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-hero mt-4 block px-5 py-3.5 text-center"
              >
                Enviar solicitud por WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="btn-hero mt-4 w-full px-5 py-3.5 opacity-70"
              >
                Enviar solicitud por WhatsApp
              </button>
            )}
            {!waUrl && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Número de WhatsApp por confirmar.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="min-h-11 px-3 text-sm font-medium text-muted-foreground disabled:opacity-30"
        >
          Atrás
        </button>
        {step < steps.length - 1 && (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="btn-hero min-h-11 px-6 text-sm disabled:opacity-40"
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({
  active,
  onClick,
  className = "",
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-xl border text-sm font-medium transition-colors ${active ? "border-primary bg-accent text-card-foreground" : "border-border bg-muted text-muted-foreground"} ${className}`}
    >
      {children}
    </button>
  );
}

function OptionGroup({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | [string, string])[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const [v, l] = typeof o === "string" ? [o, o] : o;
          return (
            <Choice
              key={v}
              active={value === v}
              onClick={() => onChange(value === v ? "" : v)}
              className="px-3.5"
            >
              {l}
            </Choice>
          );
        })}
      </div>
    </fieldset>
  );
}

function UnsureToggle({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {UNSURE}
    </label>
  );
}

function Field({
  id,
  t,
  hint,
  children,
}: {
  id: string;
  t: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {t}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
