import { useEffect, useMemo, useState } from "react";
import {
  business,
  OTHER_WORK,
  publicFleetUnits,
  quoteWorkTypes,
} from "@/config/business";
import {
  buildWhatsAppMessage,
  makeFolio,
  whatsAppUrl,
} from "@/lib/integrations";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import type { ImagenSolicitud, Solicitud } from "@/types/entities";

const empty: Solicitud = {
  unidad: "",
  servicio: "",
  servicioDetalle: "",
  ubicacion: "",
  direccion: "",
  referencias: "",
  fecha: "",
  altura: "",
  personas: "",
  duracion: "",
  acceso: "",
  obstaculos: "",
  estabilizadores: "",
  observaciones: "",
  nombre: "",
  empresa: "",
  telefono: "",
  email: "",
};
const steps = ["Maniobra y altura", "Ubicación y turno", "Vista previa"];
const PLACE_STEP = 1;
const REVIEW_STEP = 2;

// Solicitudes guardadas con el catálogo anterior de servicios se traducen a los tipos actuales.
const LEGACY_WORK: Partial<Record<string, string>> = {
  Luminarias: "Iluminación",
  "Cámaras y antenas": "Telecomunicaciones",
  "Mantenimiento comercial": "Mantenimiento en altura",
  "Mantenimiento industrial": "Mantenimiento en altura",
};
const NO_PREFERENCE = "Sin preferencia";
const DURATIONS = [
  "Menos de 4 horas",
  "Medio día",
  "Día completo",
  "Varios días",
  "No estoy seguro",
];
const STORAGE_KEY = "rg-cotizacion";

// Las fotos permanecen en el dispositivo (no hay almacenamiento en servidor); estos límites
// solo evitan seleccionar archivos que el navegador no pueda previsualizar o preparar.
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const phoneDigits = (value: string) => value.replace(/\D/g, "");
/** Acepta 10 dígitos nacionales, opcionalmente con prefijo 52 o 521. */
const isValidPhone = (value: string) =>
  /^(52(1)?)?\d{10}$/.test(phoneDigits(value));
const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function stepErrors(step: number, data: Solicitud): string[] {
  if (step === 0 && !data.servicio)
    return ["Selecciona para qué necesitas la grúa."];
  if (
    step === 0 &&
    data.servicio === OTHER_WORK &&
    !data.servicioDetalle?.trim()
  )
    return ["Describe brevemente el trabajo que necesitas realizar."];
  if (step === PLACE_STEP && !data.ubicacion.trim())
    return ["Escribe la ciudad o municipio del servicio para continuar."];
  if (step !== PLACE_STEP) return [];
  const errors: string[] = [];
  if (!data.nombre?.trim()) errors.push("Escribe tu nombre.");
  if (!isValidPhone(data.telefono ?? "")) {
    errors.push(
      "Escribe un teléfono o WhatsApp de 10 dígitos, por ejemplo 55 1234 5678.",
    );
  }
  if (data.email?.trim() && !isValidEmail(data.email)) {
    errors.push("Revisa el correo electrónico o deja el campo vacío.");
  }
  return errors;
}

// Ejemplos contextuales para el campo de condiciones según el tipo de trabajo.
type ContextualConfig = { observacionesPlaceholder?: string };
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
  "Mantenimiento en altura": {
    observacionesPlaceholder:
      "Altura aproximada, tipo de trabajo, accesos, cables…",
  },
  Iluminación: {
    observacionesPlaceholder:
      "Número de luminarias o postes, altura aproximada, accesos…",
  },
  Telecomunicaciones: {
    observacionesPlaceholder:
      "Tipo de antena o equipo, altura aproximada, accesos…",
  },
};

export function QuoteWizard({
  selectedUnit,
  selectedMode,
}: {
  selectedUnit?: string;
  selectedMode?: string;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Solicitud>(empty);
  const [images, setImages] = useState<ImagenSolicitud[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisState, setAnalysisState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [analysisConsent, setAnalysisConsent] = useState(false);
  const [folio] = useState(makeFolio);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const ctx = contextual[data.servicio] ?? {};

  // Conserva temporalmente las respuestas (no las fotos) mientras el usuario navega.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const requestedUnit =
        new URLSearchParams(window.location.search).get("unidad") ?? "";
      if (saved || requestedUnit) {
        const parsed = saved ? (JSON.parse(saved) as Partial<Solicitud>) : {};
        if (parsed.servicio && !quoteWorkTypes.includes(parsed.servicio)) {
          const mapped = LEGACY_WORK[parsed.servicio];
          if (!mapped) parsed.servicioDetalle ||= parsed.servicio;
          parsed.servicio = mapped ?? OTHER_WORK;
        }
        setData({
          ...empty,
          ...parsed,
          unidad: requestedUnit || parsed.unidad || "",
        });
      }
    } catch {
      /* ignorar */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!selectedUnit && !selectedMode) return;
    setData((current) => ({
      ...current,
      unidad: selectedUnit || current.unidad,
      duracion: selectedMode || current.duracion,
    }));
    setStep(0);
  }, [selectedMode, selectedUnit]);
  useEffect(() => {
    if (loaded) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const setVal = (k: keyof Solicitud, v: string) => {
    setErrors([]);
    setData((d) => ({ ...d, [k]: v }));
  };
  const set = (k: keyof Solicitud) => (e: { target: { value: string } }) =>
    setVal(k, e.target.value);

  const goTo = (next: number) => {
    setErrors([]);
    setCopyState("idle");
    setStep(next);
  };
  const goNext = () => {
    const found = stepErrors(step, data);
    setErrors(found);
    if (!found.length) goTo(step + 1);
  };
  const message = useMemo(
    () => buildWhatsAppMessage({ ...data, fotos: images.length }, folio),
    [data, folio, images.length],
  );
  const waUrl = whatsAppUrl(message);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const problems: string[] = [];
    const accepted: File[] = [];
    Array.from(files).forEach((file) => {
      if (!PHOTO_TYPES.includes(file.type)) {
        problems.push(`«${file.name}» no es JPEG, PNG o WebP.`);
      } else if (file.size > MAX_PHOTO_BYTES) {
        problems.push(`«${file.name}» pesa más de 15 MB.`);
      } else if (images.length + accepted.length >= MAX_PHOTOS) {
        problems.push(`Puedes agregar hasta ${MAX_PHOTOS} fotografías.`);
      } else {
        accepted.push(file);
      }
    });
    setPhotoErrors([...new Set(problems)]);
    if (!accepted.length) return;
    const selected = accepted.map((file) => ({
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

  const removeImage = (index: number) => {
    setImages((p) => {
      const target = p[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return p.filter((_, j) => j !== index);
    });
    setPhotoErrors([]);
    setAnalysis(null);
    setAnalysisState("idle");
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const analyzeImages = async () => {
    if (!images.length || !analysisConsent || analysisState === "loading")
      return;
    setAnalysisState("loading");
    setAnalysisError("");
    setAnalysis(null);
    try {
      const form = new FormData();
      const selected = images.slice(0, 3);
      const prepared = await Promise.all(
        selected.map(({ file }) => prepareImage(file)),
      );
      prepared.forEach((blob, index) =>
        form.append("images", blob, `foto-${index + 1}.jpg`),
      );
      const response = await fetch("/api/analyze-images", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as AnalysisResponse & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          payload.error || "No fue posible realizar el análisis.",
        );
      setAnalysis(payload);
      setAnalysisState("idle");
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "No fue posible realizar el análisis.",
      );
      setAnalysisState("error");
    }
  };
  const summary: [string, string, number][] = [
    [
      "Trabajo",
      [data.servicio, data.servicioDetalle].filter(Boolean).join(": "),
      0,
    ],
    ["Unidad elegida", data.unidad ?? "", 0],
    [
      "Ubicación",
      [data.ubicacion, data.direccion, data.referencias]
        .filter(Boolean)
        .join(" · "),
      PLACE_STEP,
    ],
    ["Fecha estimada", data.fecha, PLACE_STEP],
    ["Turno o modalidad", data.duracion, PLACE_STEP],
    ["Condiciones", data.observaciones, PLACE_STEP],
    [
      "Fotografías",
      images.length ? `${images.length} seleccionada(s)` : "",
      PLACE_STEP,
    ],
    [
      "Preanálisis con IA",
      analysis ? `${analysis.analyses.length} foto(s) analizada(s)` : "",
      PLACE_STEP,
    ],
    ["Nombre", data.nombre ?? "", PLACE_STEP],
    ["Teléfono / WhatsApp", data.telefono ?? "", PLACE_STEP],
    ["Empresa", data.empresa ?? "", PLACE_STEP],
    ["Correo", data.email ?? "", PLACE_STEP],
  ];

  return (
    <div className="panel p-4 sm:p-5">
      <p className="mb-4 text-xs text-muted-foreground">
        Tus respuestas se conservan temporalmente en este dispositivo. Las fotos
        solo se envían al solicitar el preanálisis y no se almacenan en esta
        aplicación.
      </p>
      <p
        className="mb-2 text-sm font-bold text-card-foreground sm:hidden"
        aria-hidden
      >
        Paso {step + 1} de {steps.length}: {steps[step]}
      </p>
      <ol
        className="grid grid-cols-4 gap-1.5"
        aria-label="Progreso de la cotización"
      >
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
            <span
              className={`mt-1.5 hidden truncate text-[11px] font-semibold sm:block ${i === step ? "text-sky" : "text-muted-foreground"}`}
            >
              {i + 1}. {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 space-y-4">
        {step === 0 && (
          <>
            <fieldset>
              <legend className="font-bold text-card-foreground">
                ¿Para qué necesitas la grúa?
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {quoteWorkTypes.map((work) => (
                  <Choice
                    key={work}
                    active={data.servicio === work}
                    onClick={() => setVal("servicio", work)}
                    className="px-4 py-3 text-left"
                  >
                    {work}
                  </Choice>
                ))}
              </div>
            </fieldset>
            {data.servicio === OTHER_WORK && (
              <Field id="q-detalle" t="Describe el trabajo">
                <textarea
                  id="q-detalle"
                  rows={2}
                  className="field"
                  placeholder="Ej. limpieza de fachada, colocación de lona…"
                  value={data.servicioDetalle ?? ""}
                  onChange={set("servicioDetalle")}
                  aria-required="true"
                />
              </Field>
            )}
            <OptionGroup
              legend="Equipo de interés (opcional)"
              value={data.unidad ?? ""}
              onChange={(v) => setVal("unidad", v)}
              options={[
                ...publicFleetUnits.map((unit) => unit.name),
                NO_PREFERENCE,
              ]}
            />
            <Field id="q-altura" t="Altura requerida (aproximada)">
              <input
                id="q-altura"
                className="field"
                inputMode="numeric"
                placeholder="Ej. 12 m"
                value={data.altura}
                onChange={set("altura")}
              />
            </Field>
          </>
        )}
        {step === PLACE_STEP && (
          <>
            <p className="rounded-xl border border-primary/35 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              La disponibilidad y el traslado del equipo se confirman según la
              ubicación del proyecto.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="q-ubicacion" t="Ciudad o municipio">
                <input
                  id="q-ubicacion"
                  className="field"
                  autoComplete="address-level2"
                  placeholder="Ej. Ciudad de México, Toluca"
                  value={data.ubicacion}
                  onChange={set("ubicacion")}
                  aria-required="true"
                />
              </Field>
              <Field id="q-direccion" t="Dirección o referencia (opcional)">
                <input
                  id="q-direccion"
                  className="field"
                  autoComplete="street-address"
                  placeholder="Colonia, calle o punto de referencia"
                  value={data.direccion ?? ""}
                  onChange={set("direccion")}
                />
              </Field>
              <Field
                id="q-fecha"
                t="Fecha estimada (opcional)"
                hint="La disponibilidad se confirma para cada fecha."
              >
                <input
                  id="q-fecha"
                  type="date"
                  className="field"
                  value={data.fecha}
                  onChange={set("fecha")}
                />
              </Field>
              <Field id="q-duracion" t="Turno o modalidad (opcional)">
                <select
                  id="q-duracion"
                  className="field"
                  value={data.duracion}
                  onChange={set("duracion")}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Turno diurno">Turno diurno</option>
                  <option value="Proyecto nocturno">Proyecto nocturno</option>
                  <option value="Renta por semana/mes">Renta por semana/mes</option>
                  {DURATIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              id="q-obs"
              t="Condiciones de acceso o descripción adicional (opcional)"
            >
              <textarea
                id="q-obs"
                rows={3}
                className="field"
                placeholder={
                  ctx.observacionesPlaceholder ??
                  "Accesos, cables, horarios, restricciones…"
                }
                value={data.observaciones}
                onChange={set("observaciones")}
              />
            </Field>
            <div className="quote-photos">
              <p className="font-bold text-card-foreground">
                Fotografías del lugar (opcional)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nos ayudan a revisar acceso, espacio y obstáculos visibles.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-card-foreground">Privacidad:</strong>{" "}
                las fotos se quedan en tu dispositivo; solo se usan para evaluar
                esta solicitud. No las almacenamos ni las enviamos por ti.
              </p>
              <label className="mt-4 block cursor-pointer rounded-2xl border-2 border-dashed border-input bg-muted px-4 py-8 text-center focus-within:ring-2 focus-within:ring-ring">
                <span className="text-sm font-semibold">
                  Toca para seleccionar fotos
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Hasta {MAX_PHOTOS} fotos JPEG, PNG o WebP, de máximo 15 MB
                  cada una
                </span>
                <input
                  type="file"
                  accept={PHOTO_TYPES.join(",")}
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {photoErrors.length > 0 && (
                <ul
                  role="alert"
                  className="mt-3 space-y-1 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800"
                >
                  {photoErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
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
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 grid size-9 place-items-center rounded-full border border-border bg-background text-base font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="mt-4 rounded-2xl border border-primary/35 bg-primary/5 p-4">
                  <p className="font-bold text-card-foreground">
                    Preanálisis visual con IA
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Puede señalar acceso aparente, espacio y obstáculos
                    visibles. Analiza hasta tres fotos y no sustituye la
                    revisión de una persona.
                  </p>
                  <label className="mt-3 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={analysisConsent}
                      onChange={(event) =>
                        setAnalysisConsent(event.target.checked)
                      }
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    <span>
                      Acepto enviar temporalmente estas fotografías a Cloudflare
                      Workers AI para generar el preanálisis. Entiendo que el
                      resultado es orientativo.
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={!analysisConsent || analysisState === "loading"}
                    onClick={analyzeImages}
                    className="btn-hero mt-3 min-h-11 w-full px-5 py-3 text-sm disabled:opacity-40 sm:w-auto"
                  >
                    {analysisState === "loading"
                      ? "Analizando fotografías…"
                      : "Analizar con IA"}
                  </button>
                  {images.length > 3 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Para este preanálisis se usarán las primeras 3
                      fotografías.
                    </p>
                  )}
                  {analysisError && (
                    <p
                      role="alert"
                      className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800"
                    >
                      {analysisError}
                    </p>
                  )}
                </div>
              )}
              {analysis && (
                <div className="mt-4 space-y-3" aria-live="polite">
                  <p className="font-bold text-card-foreground">
                    Resultado del preanálisis
                  </p>
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
                          <dd className="mt-0.5 text-muted-foreground">
                            {item.access}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold">Espacio visible</dt>
                          <dd className="mt-0.5 text-muted-foreground">
                            {item.space}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold">Altura</dt>
                          <dd className="mt-0.5 text-muted-foreground">
                            {item.height}
                          </dd>
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
                        <strong className="text-card-foreground">
                          Confirmar:
                        </strong>{" "}
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
                Si no solicitas el preanálisis, las imágenes permanecen
                únicamente en tu dispositivo. Para que las recibamos, adjúntalas
                en el chat de WhatsApp al enviar tu solicitud.
              </p>
            </div>
          </>
        )}
        {step === PLACE_STEP && (
          <>
            <div>
              <p className="font-bold text-card-foreground">
                ¿Cómo te contactamos?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usamos estos datos solo para darte seguimiento a esta
                cotización.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="q-nombre" t="Nombre">
                <input
                  id="q-nombre"
                  className="field"
                  autoComplete="name"
                  value={data.nombre ?? ""}
                  onChange={set("nombre")}
                  aria-required="true"
                />
              </Field>
              <Field id="q-empresa" t="Empresa (opcional)">
                <input
                  id="q-empresa"
                  className="field"
                  autoComplete="organization"
                  value={data.empresa ?? ""}
                  onChange={set("empresa")}
                />
              </Field>
              <Field id="q-telefono" t="Teléfono o WhatsApp" hint="10 dígitos.">
                <input
                  id="q-telefono"
                  type="tel"
                  inputMode="tel"
                  className="field"
                  autoComplete="tel"
                  placeholder="55 1234 5678"
                  value={data.telefono ?? ""}
                  onChange={set("telefono")}
                  aria-required="true"
                />
              </Field>
              <Field id="q-email" t="Correo electrónico (opcional)">
                <input
                  id="q-email"
                  type="email"
                  inputMode="email"
                  className="field"
                  autoComplete="email"
                  value={data.email ?? ""}
                  onChange={set("email")}
                />
              </Field>
            </div>
          </>
        )}
        {step === REVIEW_STEP && (
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
                    onClick={() => goTo(s)}
                    className="min-h-11 px-2 text-xs font-semibold text-sky"
                    aria-label={`Editar ${k}`}
                  >
                    Editar
                  </button>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Confirmamos contigo disponibilidad y detalles antes de agendar.
            </p>
            <div className="quote-message-preview" aria-live="polite">
              <p>Mensaje que se abrirá en WhatsApp</p>
              <pre>{message}</pre>
            </div>
            {analysis && (
              <p className="mt-2 rounded-xl border border-primary/35 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                La IA analizó {analysis.analyses.length} fotografía(s). Sus
                observaciones son preliminares y requieren confirmación humana
                antes de cotizar u operar.
              </p>
            )}
            {waUrl ? (
              <>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="industrial-whatsapp mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3.5 text-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-white focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark"
                >
                  <WhatsAppIcon className="size-5" />
                  Abrir WhatsApp con mi solicitud
                </a>
                <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
                  Se abrirá WhatsApp ({business.whatsappDisplay}) con este
                  resumen prellenado. La solicitud nos llega cuando la envías
                  desde WhatsApp.
                  {images.length > 0 && " Adjunta ahí tus fotografías."}
                </p>
                <button
                  type="button"
                  onClick={copySummary}
                  className="btn-ghost mt-3 min-h-11 w-full px-5 text-sm"
                >
                  Copiar resumen
                </button>
                <p
                  aria-live="polite"
                  className="mt-1 text-center text-xs text-muted-foreground"
                >
                  {copyState === "copied" && "Resumen copiado."}
                  {copyState === "error" &&
                    "No fue posible copiar; selecciona el texto manualmente."}
                </p>
              </>
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

      {errors.length > 0 && (
        <ul
          role="alert"
          className="mt-4 space-y-1 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800"
        >
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => goTo(step - 1)}
          className="min-h-11 px-3 text-sm font-medium text-muted-foreground disabled:opacity-30"
        >
          Atrás
        </button>
        {step < steps.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            className="btn-hero min-h-11 px-6 text-sm"
          >
            {step === PLACE_STEP ? "Ver vista previa" : "Continuar"}
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
