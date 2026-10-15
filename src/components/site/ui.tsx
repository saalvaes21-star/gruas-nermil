import type { ReactNode } from "react";
import {
  Building,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  Maximize,
  Truck,
  type LucideIcon,
} from "lucide-react";

/** Full-bleed color band wrapping a centered container: dark (default), light (warm-white) or soft (light-surface gray). */
export function Band({
  tone = "dark",
  className = "",
  children,
}: {
  tone?: "dark" | "light" | "soft";
  className?: string;
  children: ReactNode;
}) {
  const toneClass = tone === "light" ? "section-light" : tone === "soft" ? "section-soft" : "";
  return (
    <section className={`industrial-band ${toneClass} ${className}`}>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-5 md:py-7">{children}</div>
    </section>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      className="scroll-mt-24 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow"
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      {intro && (
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function Soon({ children = "Próximamente" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
      {children}
    </span>
  );
}

/** Lock-icon reassurance note. Reused in the quote section and the security section. */
export function LockNote({
  title,
  text,
  className = "",
}: {
  title?: string;
  text: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-current/20 bg-current/10">
        <Lock className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        {title && <p className="text-sm font-bold">{title}</p>}
        <p
          className={
            title ? "mt-0.5 text-sm text-muted-foreground" : "text-sm text-muted-foreground"
          }
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/** Icon + title + one-line text. Reused for the Seguridad points and the Por qué elegirnos benefits. */
export function FeatureItem({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-industrial-yellow/15 text-industrial-yellow">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

const SLOT_ICON: Record<string, LucideIcon> = {
  "service-altura": Maximize,
  "service-anuncios": Building,
  "service-luminarias": Lightbulb,
  "service-fachadas": Building,
  "service-camaras": Camera,
  "service-industrial": Truck,
  "why-choose-us": CheckCircle2,
  "example-fachada": ImageIcon,
  "example-anuncio": ImageIcon,
  "example-altura": ImageIcon,
};

/**
 * Photographic slot reserved at the final layout size/aspect-ratio.
 * `slot` is the semantic asset name (e.g. "service-altura" → src/assets/reference/service-altura.webp).
 * Pass `src`/`alt` (from src/config/referenceImages.ts) once the real file exists — the slot then
 * renders the actual photo at the exact same footprint, so there is no layout shift either way.
 */
export function ReferenceSlot({
  slot,
  src,
  alt,
  aspect = "4/3",
  priority = false,
  className = "",
}: {
  slot: string;
  src?: string | null;
  alt?: string;
  aspect?: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div
        className={`industrial-photo-frame relative overflow-hidden rounded-2xl border border-border bg-muted ${className}`}
        style={{ aspectRatio: aspect }}
      >
        <img
          src={src}
          alt={alt ?? slot}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          className="size-full object-cover"
        />
        <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur">
          Imagen de referencia
        </span>
      </div>
    );
  }

  const Icon = SLOT_ICON[slot] ?? ImageIcon;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-input bg-muted ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-muted-foreground">
        <Icon className="size-6" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-widest">{slot}</span>
      </div>
      <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur">
        Imagen de referencia
      </span>
    </div>
  );
}
