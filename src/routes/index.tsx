import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Building,
  Camera,
  CheckCircle2,
  Lock,
  Maximize,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import hero from "@/assets/hero-grua.jpg";
import craneCutout from "@/assets/grua-cutout.png";
import { business, services, unitSpecs, PENDING } from "@/config/business";
import { referenceImages, type ReferenceImageKey } from "@/config/referenceImages";
import { Band, Section, LockNote, FeatureItem, ReferenceSlot } from "@/components/site/ui";
import { QuoteWizard } from "@/components/site/QuoteWizard";
import { Assistant } from "@/components/site/Assistant";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const TITLE = "Renta de grúa con canastilla en CDMX | Renta de Grúa CDMX";
const DESC =
  "Renta de grúa con canastilla para instalaciones, mantenimiento y trabajos en altura en CDMX y zona metropolitana. Cotiza por WhatsApp.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const VISIBLE_SERVICES_COUNT = 3;

// 9 servicios, 6 slots de imagen: los 4 menos específicos comparten el slot genérico "industrial".
const serviceImageSlot: Record<string, ReferenceImageKey> = {
  "Otro trabajo en altura": "service-altura",
  "Instalación y mantenimiento de anuncios": "service-anuncios",
  Luminarias: "service-luminarias",
  Fachadas: "service-fachadas",
  "Cámaras y antenas": "service-camaras",
  "Instalaciones eléctricas": "service-industrial",
  "Mantenimiento comercial": "service-industrial",
  "Mantenimiento industrial": "service-industrial",
};

const trustBar = [
  [Truck, "Grúa con canastilla"],
  [Users, "Atención directa"],
  [MapPin, "CDMX y zona metropolitana"],
  [Lock, "Evaluación previa"],
] as const;

const securityPoints = [
  [Lock, "Evaluación previa", "Revisamos la información antes de confirmar."],
  [MapPin, "Condiciones del sitio", "El entorno puede determinar cómo debe realizarse el trabajo."],
  [
    Truck,
    "Acceso de la unidad",
    "Consideramos el espacio disponible para llegar y posicionar el equipo.",
  ],
  [CheckCircle2, "Confirmación del servicio", "Confirmamos contigo los detalles antes de agendar."],
] as const;

const specIcon: Record<string, typeof Maximize> = {
  "Altura de trabajo": Maximize,
  "Alcance lateral": Ruler,
  "Capacidad de canastilla": Building,
  "Número de personas": Users,
  "Tipo de brazo": ArrowRight,
  Estabilizadores: CheckCircle2,
};

const whyUs = [
  [
    Truck,
    "Conoces la unidad asignada para el servicio",
    "Te mostramos la unidad antes de confirmar.",
  ],
  [
    Camera,
    "Puedes enviar fotografías del lugar",
    "Nos ayudan a revisar acceso, espacio y obstáculos.",
  ],
  [
    Ruler,
    "Cotización según las condiciones del trabajo",
    "El costo se define con base en tu caso específico.",
  ],
  [
    MessageCircle,
    "Seguimiento directo por WhatsApp",
    "Resuelve dudas y da seguimiento sin intermediarios.",
  ],
] as const;

function Crane360Viewer() {
  const [angle, setAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; angle: number } | null>(null);

  const normalizeAngle = (value: number) => {
    const normalized = ((((value + 180) % 360) + 360) % 360) - 180;
    setAngle(normalized);
  };

  const displayAngle = ((Math.round(angle) % 360) + 360) % 360;
  return (
    <div
      id="vista-360"
      className="overflow-hidden rounded-2xl border border-industrial-yellow/40 bg-industrial-black text-warm-white shadow-lg"
    >
      <div
        className="crane-360-stage group relative aspect-[16/9] cursor-grab overflow-hidden active:cursor-grabbing"
        style={{ touchAction: "pan-y", perspective: "900px" }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStart.current = { x: event.clientX, angle };
          setIsDragging(true);
        }}
        onPointerMove={(event) => {
          if (!dragStart.current) return;
          normalizeAngle(dragStart.current.angle + (event.clientX - dragStart.current.x) * 0.8);
        }}
        onPointerUp={() => {
          dragStart.current = null;
          setIsDragging(false);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          setIsDragging(false);
        }}
        role="img"
        aria-label={`Vista interactiva de la grúa, ángulo ${displayAngle} grados`}
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-industrial-yellow/20 shadow-[0_0_80px_rgba(247,179,0,0.08)]"
        />
        <div
          className={`absolute inset-3 ${isDragging ? "" : "transition-transform duration-300 ease-out"}`}
          style={{
            transform: `rotateY(${angle}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            <img
              src={craneCutout}
              alt=""
              width={1280}
              height={864}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="size-full select-none object-contain p-4 drop-shadow-2xl"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <img
              src={craneCutout}
              alt=""
              width={1280}
              height={864}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="size-full -scale-x-100 select-none object-contain p-4 drop-shadow-2xl"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-industrial-black/20 via-transparent to-industrial-black/20" />
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-black tracking-tight text-industrial-yellow">360°</p>
            <p className="truncate text-sm font-bold">Explora la unidad</p>
          </div>
          <p className="mt-0.5 text-[11px] text-warm-white/65">
            Arrastra la imagen o usa los controles
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-industrial-yellow/60 bg-white/5 px-3 py-1 text-xs font-bold text-industrial-yellow">
          {displayAngle}°
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-white/10 p-3">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/5 text-xl text-industrial-yellow hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-industrial-yellow"
          onClick={() => normalizeAngle(angle - 30)}
          aria-label="Girar la vista a la izquierda"
        >
          ←
        </button>
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          value={angle}
          onChange={(event) => setAngle(Number(event.target.value))}
          className="w-full accent-industrial-yellow"
          aria-label="Ángulo de la vista de la grúa"
        />
        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/5 text-xl text-industrial-yellow hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-industrial-yellow"
          onClick={() => normalizeAngle(angle + 30)}
          aria-label="Girar la vista a la derecha"
        >
          →
        </button>
      </div>
    </div>
  );
}

const faqs = [
  [
    "¿Qué tipo de trabajos puede realizar la unidad?",
    "Trabajos en altura como anuncios, luminarias, fachadas, cámaras, antenas e instalaciones eléctricas. Cada caso se evalúa antes de confirmar.",
  ],
  [
    "¿Cómo se cotiza un servicio?",
    "Llena la cotización guiada o escríbenos por WhatsApp con el tipo de trabajo, ubicación, altura y fecha.",
  ],
  [
    "¿Puedo enviar fotografías?",
    "Sí. Las fotos del lugar nos ayudan a revisar accesos, espacio y obstáculos.",
  ],
  [
    "¿Con cuánto tiempo debo reservar?",
    "Por confirmar. Te recomendamos escribirnos con la mayor anticipación posible.",
  ],
  [
    "¿Trabajan fuera de CDMX?",
    "Atendemos CDMX y zona metropolitana. Otras zonas se revisan caso por caso.",
  ],
  [
    "¿Cómo sé si la grúa puede entrar al lugar?",
    "Con fotos y datos del acceso hacemos una revisión previa; en algunos casos se requiere visita.",
  ],
  [
    "¿Qué información necesitan para cotizar?",
    "Tipo de trabajo, ubicación, altura aproximada, fecha, duración, número de personas y fotos del sitio.",
  ],
  [
    "¿Qué revisan antes de confirmar el servicio?",
    "En el mismo formulario de cotización revisamos acceso, espacio de operación, obstáculos, altura y fotografías del lugar; después confirmamos contigo los detalles antes de agendar.",
  ],
];

function Index() {
  const [showAllServices, setShowAllServices] = useState(false);
  const visibleServices = showAllServices ? services : services.slice(0, VISIBLE_SERVICES_COUNT);

  // Mobile browsers can restore the previous scroll position after React has mounted (often
  // once large images finish loading). Keep a fresh, hashless visit at the hero during that
  // initial loading window, but stop immediately if the visitor starts interacting.
  useLayoutEffect(() => {
    if (window.location.hash) return;

    let userInteracted = false;
    const resetToTop = () => {
      if (!userInteracted && !window.location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };
    const markInteraction = () => {
      userInteracted = true;
    };
    const timers = [0, 50, 200, 500, 1000, 1800].map((delay) =>
      window.setTimeout(resetToTop, delay),
    );

    resetToTop();
    window.addEventListener("load", resetToTop);
    window.addEventListener("pageshow", resetToTop);
    window.addEventListener("touchstart", markInteraction, { passive: true });
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("wheel", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("load", resetToTop);
      window.removeEventListener("pageshow", resetToTop);
      window.removeEventListener("touchstart", markInteraction);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("wheel", markInteraction);
      window.removeEventListener("keydown", markInteraction);
    };
  }, []);

  // Moves focus to the target section when navigating by anchor: on mount (direct link with
  // a hash), on hashchange (browser back/forward), and on any in-page anchor click — even when
  // the href repeats the current hash, which fires no hashchange event on its own.
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    const focusHashTarget = (hash: string) => {
      if (!hash) return;
      document.getElementById(hash)?.focus({ preventScroll: true });
    };
    const onHashChange = () => focusHashTarget(window.location.hash.slice(1));
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement)?.closest?.(
        "a[href^='#']",
      ) as HTMLAnchorElement | null;
      const href = link?.getAttribute("href");
      if (!href || href.length < 2) return;
      requestAnimationFrame(() => focusHashTarget(href.slice(1)));
    };
    window.history.scrollRestoration = "manual";
    focusHashTarget(window.location.hash.slice(1));
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick);
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow"
      >
        {/* HERO */}
        <section className="relative isolate flex min-h-[60svh] items-center overflow-hidden sm:min-h-[68vh] md:min-h-[78vh]">
          <img
            src={hero}
            alt="Grúa con canastilla trabajando en altura"
            width={1920}
            height={1280}
            fetchPriority="high"
            className="absolute inset-0 -z-20 size-full object-cover"
          />
          <div
            aria-hidden
            className="hero-industrial-overlay absolute inset-0 -z-10"
          />

          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-5 sm:py-16 md:py-18">
            <div className="max-w-[46ch]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-white">
                Grúa con canastilla · CDMX y zona metropolitana
              </span>
              <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-tight text-warm-white sm:text-5xl">
                Renta de grúa con canastilla para trabajos en altura
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-warm-white/80">
                Cuéntanos qué necesitas, envía fotos del lugar y te ayudamos a evaluar el servicio.
              </p>
            </div>
          </div>
        </section>

        {/* LLAMADO PRINCIPAL: único bloque de acciones de la portada */}
        <section className="primary-cta bg-industrial-yellow text-industrial-black">
          <div className="mx-auto max-w-5xl px-4 py-5 text-center sm:px-5 md:py-6">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              ¿Necesitas una grúa con canastilla?
            </h2>
            <p className="mx-auto mt-2 max-w-prose text-[15px]">
              Cuéntanos qué trabajo necesitas realizar.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#cotizar"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-industrial-black px-6 py-3.5 text-[15px] font-bold text-warm-white"
              >
                Cotizar servicio
              </a>
            </div>
          </div>
        </section>

        {/* BARRA DE CONFIANZA */}
        <div className="section-soft border-b border-black/5">
          <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-3 text-xs font-semibold sm:gap-x-8 sm:px-5 sm:text-sm">
            {trustBar.map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-industrial-yellow" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* SEGURIDAD */}
        <Band tone="light">
          <Section
            eyebrow="Seguridad"
            title="Seguridad desde el primer contacto"
            intro="Antes de confirmar un servicio revisamos las condiciones básicas del lugar, el acceso y las características del trabajo."
          >
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_1.3fr] md:items-center">
              <div className="industrial-lock-stage relative mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[2rem]">
                <div
                  aria-hidden
                  className="industrial-lock-stage__ring absolute inset-6 rounded-[1.4rem]"
                />
                <div className="animated-lock" aria-hidden="true">
                  <span className="animated-lock__shackle" />
                  <span className="animated-lock__body">
                    <span className="animated-lock__keyhole" />
                  </span>
                </div>
                <span className="absolute -bottom-2 -right-2 grid size-14 place-items-center rounded-full bg-industrial-yellow text-industrial-black shadow-lg">
                  <ShieldCheck className="size-7" aria-hidden />
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {securityPoints.map(([Icon, title, text]) => (
                  <FeatureItem key={title} icon={Icon} title={title} text={text} />
                ))}
              </div>
            </div>
            <LockNote
              title="Seguridad antes de operar"
              text="Cada servicio se evalúa previamente antes de su confirmación."
              className="panel mt-5 p-4"
            />
          </Section>
        </Band>

        {/* UNIDAD */}
        <Band tone="soft">
          <Section
            id="unidad"
            title="Asignamos la unidad adecuada para tu servicio"
            intro="Seleccionamos el equipo que mejor se adapte al tipo de trabajo, la altura, el acceso y el espacio disponible."
          >
            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <Crane360Viewer />
              <div>
                <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">
                  {unitSpecs.map((s) => {
                    const Icon = specIcon[s.label] ?? CheckCircle2;
                    return (
                      <div key={s.label} className="panel flex items-center gap-2.5 p-3">
                        <Icon className="size-4 shrink-0 text-industrial-yellow" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="mt-0.5 font-bold text-sky">{s.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Especificaciones sujetas a confirmación de la unidad.
                </p>
              </div>
            </div>
          </Section>
        </Band>

        {/* SERVICIOS */}
        <Band tone="light">
          <Section id="servicios" title="Servicios">
            <div id="services-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleServices.map((s) => (
                <article key={s} className="panel flex flex-col overflow-hidden">
                  <ReferenceSlot {...referenceImages[serviceImageSlot[s]]} />
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-bold">{s}</h3>
                    <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
                      Descripción y ejemplo de trabajo por agregar.
                    </p>
                    <a
                      href="#cotizar"
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-sky"
                    >
                      Cotizar este servicio →
                    </a>
                  </div>
                </article>
              ))}
            </div>
            {services.length > VISIBLE_SERVICES_COUNT && (
              <button
                type="button"
                aria-expanded={showAllServices}
                aria-controls="services-grid"
                onClick={() => setShowAllServices((v) => !v)}
                className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-muted text-sm font-semibold text-sky sm:w-auto sm:px-6"
              >
                {showAllServices ? "Ver menos servicios" : "Ver todos los servicios"}
              </button>
            )}
          </Section>
        </Band>

        {/* POR QUÉ ELEGIRNOS */}
        <Band tone="soft">
          <Section
            eyebrow="Atención directa"
            title="Por qué elegirnos"
            intro="Buscamos conocer las condiciones del trabajo antes de confirmar el servicio."
          >
            <div className="grid gap-4 md:grid-cols-2 md:items-center">
              <ReferenceSlot {...referenceImages["why-choose-us"]} aspect="4/3" />
              <div className="grid gap-4">
                {whyUs.map(([Icon, title, text]) => (
                  <FeatureItem key={title} icon={Icon} title={title} text={text} />
                ))}
              </div>
            </div>
          </Section>
        </Band>

        {/* COTIZADOR */}
        <Band>
          <Section
            id="cotizar"
            title="Cotización guiada y evaluación del servicio"
            intro="Cuéntanos qué trabajo necesitas, dónde se realizará y qué condiciones tiene el lugar. Si cuentas con fotografías, también puedes agregarlas."
          >
            <LockNote
              text="Tus datos y fotografías se utilizan para evaluar tu solicitud."
              className="mb-4"
            />
            <QuoteWizard />
          </Section>
        </Band>

        {/* EJEMPLOS DE TRABAJOS */}
        <Band tone="light">
          <Section
            eyebrow="Portafolio"
            title="Ejemplos de trabajos con grúa de canastilla"
            intro="Estos ejemplos muestran algunos de los trabajos para los que puede utilizarse una unidad de esta categoría."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ReferenceSlot
                {...referenceImages["example-altura"]}
                aspect="3/4"
                className="sm:row-span-2"
              />
              <ReferenceSlot {...referenceImages["example-fachada"]} aspect="16/10" />
              <ReferenceSlot {...referenceImages["example-anuncio"]} aspect="16/10" />
            </div>
          </Section>
        </Band>

        {/* COBERTURA */}
        <Band tone="soft">
          <Section id="cobertura" eyebrow="Cobertura" title="¿Trabajamos en tu zona?">
            <div className="panel p-4">
              <div className="flex flex-wrap gap-2">
                {business.coverage.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="field"
                  placeholder="Ingresa tu ubicación o código postal"
                  aria-label="Ubicación o código postal"
                />
                <button className="btn-ghost shrink-0 px-5 py-3 text-sm">Consultar</button>
              </form>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Confirmamos disponibilidad y cobertura antes de agendar.
              </p>
            </div>
          </Section>
        </Band>

        {/* FAQ */}
        <Band tone="light">
          <Section id="faq" eyebrow="Dudas" title="Preguntas frecuentes">
            <Accordion type="single" collapsible className="space-y-1.5">
              {faqs.map(([q, a], i) => (
                <AccordionItem key={q} value={`faq-${i}`} className="panel px-4">
                  <AccordionTrigger className="gap-3 text-[15px] font-semibold">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>
        </Band>
      </main>

      {/* CONTACTO + FOOTER */}
      <footer
        id="contacto"
        tabIndex={-1}
        className="scroll-mt-24 border-t border-white/10 bg-industrial-black text-warm-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow"
      >
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5">
          <p className="eyebrow">Contacto</p>
          <h2 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
            Habla directamente con nosotros
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {[
              ["WhatsApp", business.whatsapp || PENDING],
              ["Teléfono", business.phone],
              ["Correo", business.email],
              ["Horarios", business.hours],
            ].map(([k, v]) => (
              <div key={k} className="panel p-3.5">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 break-words font-semibold">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 text-sm text-warm-white/70 sm:grid-cols-3">
            <div>
              <p className="font-bold text-warm-white">{business.name}</p>
              <p className="mt-1">Cobertura: {business.coverage.join(" y ")}</p>
            </div>
            <nav className="flex flex-col gap-1">
              <a href="#unidad">Unidad</a>
              <a href="#servicios">Servicios</a>
              <a href="#cotizar">Cotizar</a>
              <a href="#cobertura">Cobertura</a>
              <a href="#contacto">Contacto</a>
            </nav>
            <div className="flex flex-col gap-1">
              <span>Aviso de privacidad (por publicar)</span>
              <span>Términos (por publicar)</span>
              <span>
                © {new Date().getFullYear()} {business.name}
              </span>
            </div>
          </div>
        </div>
      </footer>

      <Assistant />
    </div>
  );
}
