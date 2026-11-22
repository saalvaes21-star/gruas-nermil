import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  Phone,
  CalendarCheck,
  ClipboardList,
  Gauge,
  HardHat,
  Lightbulb,
  MessageCircle,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import {
  business,
  fleetSpecLabels,
  publicFleetUnits,
  isConfirmed,
  PENDING,
} from "@/config/business";
import { whatsAppUrl } from "@/lib/integrations";
import { referenceImages } from "@/config/referenceImages";
import { Band, Section, ReferenceSlot } from "@/components/site/ui";
import { QuoteWizard } from "@/components/site/QuoteWizard";
import { Assistant } from "@/components/site/Assistant";
import { BrandLogo } from "@/components/site/BrandLogo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { UnitGallery } from "@/components/site/UnitGallery";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

const TITLE = "Rey Central Grúas | Renta de Grúas de Canastilla en CDMX y EdoMex";
const DESC =
  "Renta de grúas con canastilla para mantenimiento, iluminación, telecomunicaciones y trabajos en altura en México. Cotiza por WhatsApp; disponibilidad sujeta a confirmación.";

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

const serviceCategories = [
  {
    id: "mantenimiento",
    icon: Wrench,
    title: "Mantenimiento en Altura",
    text: "Grúas para facilitar trabajos de mantenimiento y reparación de infraestructura.",
    image: {
      ...referenceImages["service-industrial"],
      alt: "Grúa con canastilla dando acceso a la fachada de una nave industrial",
    },
  },
  {
    id: "iluminacion",
    icon: Lightbulb,
    title: "Trabajos de Iluminación",
    text: "Equipos para acceder a luminarias, postes y otras instalaciones elevadas.",
    image: {
      ...referenceImages["service-luminarias"],
      alt: "Grúa con canastilla dando acceso a una luminaria de alumbrado exterior",
    },
  },
  {
    id: "telecom",
    icon: Radio,
    title: "Trabajos de Telecomunicaciones",
    text: "Grúas para facilitar el acceso a antenas y equipos de comunicación.",
    image: {
      ...referenceImages["service-camaras"],
      alt: "Canastilla de grúa elevada junto a un equipo montado en altura",
    },
  },
];

// Textos aprobados. «Certificados» y «capacitado» requieren validación comercial documentada.
const benefits = [
  [
    SlidersHorizontal,
    "Flexibilidad",
    "Renta por día, semana o según tus necesidades.",
  ],
  [ShieldCheck, "Seguridad", "Equipos certificados y personal capacitado."],
  [Gauge, "Eficiencia", "Soluciones rápidas y adaptadas a tu proyecto."],
] as const;

/** Distintivos del Hero (mockup final): palomita + texto, en una sola línea en escritorio. */
const heroHighlights = ["Renta de grúas", "Cobertura nacional"] as const;
const serviceModes = [
  "Turno diurno",
  "Proyecto nocturno",
  "Renta por semana/mes",
] as const;

const rentalSteps = [
  [
    ClipboardList,
    "Cuéntanos tu proyecto",
    "Describe dónde, cuándo y para qué necesitas el equipo.",
  ],
  [
    MessageCircle,
    "Recibe una cotización",
    "Revisamos los requerimientos y confirmamos disponibilidad.",
  ],
  [
    CalendarCheck,
    "Coordina tu servicio",
    "Acordamos los detalles de la renta y las condiciones aplicables.",
  ],
] as const;

function CraneLineArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 142h64" />
        <path d="M34 142v-28h36v28" />
        <path d="M52 114V96" />
        <path d="M52 96 196 36" />
        <path d="M196 36v18" />
        <path d="M196 54v12" />
        <path d="M196 66a8 8 0 1 0 8 8" />
        <path d="M68 104l18 22" opacity=".65" />
        <path d="M78 142v-14M94 142v-14" opacity=".55" />
        <circle cx="196" cy="36" r="3.2" />
        <circle cx="52" cy="96" r="3.2" />
      </g>
      <g
        stroke="var(--industrial-yellow)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".7"
      >
        <path d="M52 96 196 36" strokeDasharray="5 8" />
        <path d="M112 73l16 20" />
      </g>
    </svg>
  );
}

function Index() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteContext, setQuoteContext] = useState<{
    unit: string;
    mode: string;
  } | null>(null);
  const quoteToggleRef = useRef<HTMLAnchorElement>(null);
  // Sin selección hasta que el visitante pulse «Ver ficha»: no hay unidad marcada por defecto.
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const selectedUnit = publicFleetUnits.find(
    (unit) => unit.id === selectedUnitId,
  );
  const contactUrl = whatsAppUrl(
    "Hola, quiero información sobre la renta de grúas con canastilla.",
  );
  // Medios de contacto. El correo se muestra siempre, pero solo enlaza (mailto) cuando la
  // dirección está confirmada; mientras tanto se indica como pendiente de activación.
  const contactMethods = [
    contactUrl && {
      key: "whatsapp",
      label: "WhatsApp",
      value: business.whatsappDisplay,
      action: "Escribir por WhatsApp",
      href: contactUrl,
      external: true,
    },
    isConfirmed(business.phone) && {
      key: "phone",
      label: "Teléfono",
      value: business.phone,
      action: "Llamar",
      // Número nacional de 10 dígitos con lada de México.
      href: `tel:+52${business.phone.replace(/\D/g, "")}`,
      external: false,
    },
    !!business.email && {
      key: "email",
      label: "Correo electrónico",
      value: business.email,
      action: "Enviar correo",
      href: business.emailConfirmed ? `mailto:${business.email}` : null,
      external: false,
    },
  ].filter((method) => !!method);

  // Abre el formulario integrado en «¿Cómo rentar una grúa?». Con `scroll` lo lleva a la vista
  // (respetando el header sticky vía scroll-margin) y le da el foco.
  const [quoteScrollRequest, setQuoteScrollRequest] = useState(0);
  const openQuote = useCallback((scroll: boolean) => {
    setQuoteOpen(true);
    if (scroll) setQuoteScrollRequest((n) => n + 1);
  }, []);
  // El desplazamiento espera a que el formulario ya ocupe su altura: con el formulario cerrado el
  // navegador no puede bajar lo suficiente y lo dejaría a media pantalla.
  useEffect(() => {
    if (!quoteScrollRequest) return;
    const target = document.getElementById("cotizar");
    target?.scrollIntoView({ block: "start" });
    target?.focus({ preventScroll: true });
  }, [quoteScrollRequest]);
  // Al cerrar, el foco vuelve a «Solicitar cotización» (que reaparece tras cerrar el formulario).
  const returnFocusRef = useRef(false);
  const closeQuote = useCallback(() => {
    returnFocusRef.current = true;
    setQuoteOpen(false);
  }, []);
  useEffect(() => {
    if (quoteOpen || !returnFocusRef.current) return;
    returnFocusRef.current = false;
    quoteToggleRef.current?.focus();
  }, [quoteOpen]);

  // Cualquier enlace a #cotizar (header, banner, menú móvil) abre el mismo formulario; las visitas
  // que llegan con #cotizar (p. ej. «Cotizar esta unidad», que recarga con ?unidad=) también.
  useEffect(() => {
    if (window.location.hash === "#cotizar") openQuote(true);
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (link?.getAttribute("href") !== "#cotizar") return;
      event.preventDefault();
      if (window.location.hash !== "#cotizar")
        window.history.pushState(null, "", "#cotizar");
      openQuote(true);
    };
    const onHashChange = () => {
      if (window.location.hash === "#cotizar") openQuote(true);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [openQuote]);

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
        <section
          id="inicio"
          tabIndex={-1}
          className="hero-section hero-industrial relative isolate overflow-hidden"
          aria-labelledby="hero-title"
        >
          <div className="hero-industrial__texture" aria-hidden />
          <div className="hero-header-glow" aria-hidden />
          <img
            src="/assets/industrial/steel-corner-plate.svg"
            alt=""
            aria-hidden
            className="hero-corner-plate hero-corner-plate--top"
          />
          <img
            src="/assets/industrial/steel-corner-plate.svg"
            alt=""
            aria-hidden
            className="hero-corner-plate hero-corner-plate--bottom"
          />
          <div className="hero-steel-band" aria-hidden />
          <div className="hero-layout relative z-10 mx-auto grid max-w-7xl items-center gap-7 px-4 pb-9 pt-5 sm:px-5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-0 lg:pb-11 lg:pt-8">
            <div className="hero-copy">
              <BrandLogo className="hero-logo hero-logo--official" />
              <h1 id="hero-title" className="hero-title">
                <span className="hero-title__line">A la altura de</span>{" "}
                <span className="hero-title__line hero-title-accent">
                  <svg
                    className="hero-title__chevrons"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M4 5l7 7-7 7M12 5l7 7-7 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  tus proyectos
                </span>
              </h1>
              <p className="hero-subtitle">Seguridad, precisión y confianza.</p>
              <ul className="hero-proof-strip" aria-label="Indicadores de confianza">
                <li>Operadores certificados DC-3 y Licencia Tipo E</li>
                <li>Cotización en menos de 15 min</li>
                <li>Cobertura en CDMX, EdoMex y alrededores</li>
              </ul>
              <ul className="hero-checks">
                {heroHighlights.map((item) => (
                  <li key={item} className="hero-checks__item">
                    <span className="hero-checks__icon" aria-hidden>
                      <Check strokeWidth={3.4} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hero-photo-frame hero-photo-frame--angular">
              <picture>
                <source
                  srcSet="/assets/grua-final-rey-central.webp"
                  type="image/webp"
                />
                <img
                  src="/assets/grua-final-rey-central.png"
                  alt="Grúa blanca con canastilla y trabajadores realizando trabajo en altura"
                  width={1148}
                  height={1371}
                  fetchPriority="high"
                  className="hero-photo"
                />
              </picture>
              <img
                src="/assets/industrial/photo-frame-angular.svg"
                alt=""
                aria-hidden
                className="hero-photo-frame__overlay"
              />
            </div>
          </div>
        </section>

        {/* BENEFICIOS Y CATEGORÍAS */}
        <section
          className="industrial-overview relative overflow-hidden"
          aria-labelledby="service-categories-title"
        >
          <div className="industrial-overview__texture" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10 lg:py-12">
            <h2 className="sr-only">Beneficios</h2>
            <ul className="industrial-benefit-strip grid lg:grid-cols-3">
              {benefits.map(([Icon, title, text]) => (
                <li
                  key={title}
                  className="industrial-benefit flex items-start gap-3.5"
                >
                  <span className="industrial-benefit__icon grid size-11 shrink-0 place-items-center rounded-xl">
                    <Icon className="size-[1.35rem]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-base font-extrabold text-warm-white">
                      {title}
                    </strong>
                    <span className="mt-0.5 block text-sm leading-relaxed text-warm-white/72">
                      {text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Panel de servicios: superficie propia que agrupa encabezado y tarjetas. */}
            <div
              id="servicios"
              tabIndex={-1}
              className="industrial-services-panel mt-8 scroll-mt-24 focus-visible:outline-none sm:mt-9"
            >
              <div className="industrial-categories-head text-center">
                <h2
                  id="service-categories-title"
                  className="industrial-categories-title text-[1.7rem] font-extrabold tracking-[-0.035em] text-warm-white sm:text-4xl"
                >
                  Categoría de Servicios
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-balance text-[15px] leading-relaxed text-warm-white/88">
                  Ponemos a tu disposición grúas con canastilla para facilitar
                  el acceso y desarrollo de tus proyectos en altura.
                </p>
              </div>

              <div className="mt-9 grid gap-5 md:grid-cols-3">
                {serviceCategories.map(
                  ({ id, icon: Icon, title, text, image }) => (
                    <article
                      key={id}
                      className={`industrial-category-card industrial-category-card--${id} flex flex-col overflow-hidden rounded-2xl`}
                    >
                      <ReferenceSlot {...image} aspect="16/10" />
                      <div className="industrial-category-card__body flex flex-1 flex-col p-5">
                        <span className="industrial-category-card__icon grid size-11 place-items-center rounded-xl">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <h3 className="mt-4 text-lg font-extrabold text-warm-white">
                          {title}
                        </h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-warm-white/80">
                          {text}
                        </p>
                        <a
                          href={contactUrl ?? "#cotizar"}
                          target={contactUrl ? "_blank" : undefined}
                          rel={contactUrl ? "noreferrer" : undefined}
                          className="industrial-category-card__link mt-4 inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-bold text-industrial-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow"
                        >
                          Solicitar cotización
                          <ArrowRight className="size-4" aria-hidden />
                        </a>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>

            <div className="industrial-solutions-banner mt-8">
              <div className="industrial-solutions-banner__photo" aria-hidden>
                <img
                  src="/assets/grua-final-rey-central.webp"
                  alt=""
                  width={1148}
                  height={1371}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="industrial-solutions-banner__content">
                <span
                  className="industrial-solutions-banner__badge"
                  aria-hidden
                >
                  <HardHat className="size-7" />
                </span>
                <div>
                  <p className="hero-kicker">Renta de equipo</p>
                  <h2 className="industrial-solutions-banner__title">
                    Elevamos tus{" "}
                    <span className="text-industrial-yellow">soluciones</span>.
                  </h2>
                </div>
                <a
                  href={contactUrl ?? "#cotizar"}
                  target={contactUrl ? "_blank" : undefined}
                  rel={contactUrl ? "noreferrer" : undefined}
                  className="hero-cta industrial-solutions-banner__cta"
                >
                  Solicitar cotización
                  <ArrowRight className="hero-cta__icon" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FLOTA */}
        <Band tone="soft" className="fleet-band">
          <Section
            id="unidades"
            title="Nuestras unidades"
            intro="Conoce nuestra flotilla de grúas, equipada para facilitar el acceso y desarrollo de trabajos en altura."
          >
            <div className="fleet-mode-picker" role="group" aria-label="Modalidad de servicio">
              <span className="fleet-mode-picker__label">Modalidad del servicio</span>
              <div className="fleet-mode-picker__options">
                {serviceModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={quoteContext?.mode === mode}
                    onClick={() => setQuoteContext((current) => ({
                      unit: current?.unit ?? "",
                      mode,
                    }))}
                    className="fleet-mode-picker__option"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div
              className={`fleet-grid grid gap-4 ${publicFleetUnits.length === 1 ? "fleet-grid--single" : "md:grid-cols-2 lg:grid-cols-3"}`}
            >
              {publicFleetUnits.map((unit) => {
                const isSelected = unit.id === selectedUnitId;
                return (
                  <article
                    key={unit.id}
                    className={`fleet-card panel flex min-h-full flex-col overflow-hidden ${isSelected ? "fleet-card--selected" : ""}`}
                  >
                    <div className="fleet-card__media">
                      {isSelected && (
                        <span className="fleet-card__selected">
                          Seleccionada
                        </span>
                      )}
                      {unit.photos?.length ? (
                        <UnitGallery photos={unit.photos} label={unit.type} />
                      ) : (
                        <div
                          className="fleet-card__placeholder"
                          aria-label={`Fotografía de ${unit.name} pendiente`}
                        >
                          <Truck className="size-8" aria-hidden />
                          <span>Fotografía en actualización</span>
                        </div>
                      )}
                    </div>
                    <div className="fleet-card__content flex flex-1 flex-col">
                      <h3 className="fleet-card__title">{unit.type}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                        {unit.note}
                      </p>
                      {unit.applications && (
                        <div className="mt-5">
                          <h4 className="fleet-card__label">
                            Aplicaciones habituales
                          </h4>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {unit.applications.map((application) => (
                              <li
                                key={application}
                                className="fleet-application"
                              >
                                {application}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="fleet-card__actions">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUnitId(isSelected ? null : unit.id)
                          }
                          aria-pressed={isSelected}
                          aria-controls="fleet-detail"
                          className="fleet-card__button fleet-card__button--ghost"
                        >
                          {isSelected ? "Ocultar ficha" : "Ver ficha"}
                        </button>
                        <a
                          href="#cotizar"
                          onClick={() =>
                            setQuoteContext({
                              unit: unit.name,
                              mode: quoteContext?.mode ?? serviceModes[0],
                            })
                          }
                          className="fleet-card__button fleet-card__button--primary"
                        >
                          Cotizar esta unidad
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {selectedUnit && (
              <div
                id="fleet-detail"
                role="region"
                aria-label={`Ficha de ${selectedUnit.name}`}
                className="fleet-detail panel mt-4 grid gap-4 p-4 sm:p-5 md:grid-cols-[auto_1fr] md:items-start"
              >
                <div className="fleet-detail__icon grid size-12 place-items-center rounded-xl bg-industrial-dark text-industrial-yellow">
                  <Truck className="size-6" aria-hidden />
                </div>
                <div>
                  <p className="eyebrow">Ficha de la unidad</p>
                  <h3 className="mt-1.5 text-xl font-extrabold text-industrial-dark">
                    {selectedUnit.type}
                  </h3>
                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {selectedUnit.note} Confirmamos configuración, disponibilidad y condiciones del
                    proyecto antes de asignar una unidad.
                  </p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-industrial-dark">
                        Ficha técnica
                      </h4>
                      <dl className="fleet-specs mt-2">
                        {fleetSpecLabels.map((label) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{PENDING}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                  <a
                    href={contactUrl ?? `?unidad=${encodeURIComponent(selectedUnit.name)}#cotizar`}
                    target={contactUrl ? "_blank" : undefined}
                    rel={contactUrl ? "noreferrer" : undefined}
                    className="fleet-card__button fleet-card__button--primary mt-4"
                  >
                    Solicitar cotización
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </div>
              </div>
            )}
          </Section>
        </Band>

        {/* CÓMO RENTAR + COTIZACIÓN DESPLEGABLE */}
        <Band tone="light" className="rental-band">
          <Section
            id="como-rentar"
            title="¿Cómo rentar una grúa?"
            intro="Tres pasos sencillos para solicitar tu equipo."
          >
            <ol className="rental-steps grid gap-4 md:grid-cols-3">
              {rentalSteps.map(([Icon, title, text], index) => (
                <li key={title} className="rental-step panel p-5">
                  <div className="flex items-center gap-3">
                    <span className="rental-step__number" aria-hidden>
                      {index + 1}
                    </span>
                    <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold">
                    <span className="sr-only">Paso {index + 1}: </span>
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
            {/* Con el formulario abierto, el único control de cierre está en su cabecera. */}
            {!quoteOpen && (
              <a
                ref={quoteToggleRef}
                href={contactUrl ?? "#cotizar"}
                target={contactUrl ? "_blank" : undefined}
                rel={contactUrl ? "noreferrer" : undefined}
                className="hero-cta rental-quote-toggle"
              >
                Solicitar cotización
                <ArrowRight className="hero-cta__icon" aria-hidden />
              </a>
            )}

            {/* El formulario permanece montado aunque esté cerrado: así conserva respuestas y fotos. */}
            <div
              id="cotizar"
              tabIndex={-1}
              role="region"
              aria-label="Formulario de cotización"
              className="quote-drawer scroll-mt-24 focus-visible:outline-none"
              data-open={quoteOpen}
              inert={!quoteOpen}
            >
              <div className="quote-drawer__inner">
                <div className="flex items-center justify-between gap-3 pb-3 pt-5">
                  <p className="min-w-0 text-base font-extrabold sm:text-lg">
                    Solicitud de cotización
                  </p>
                  <button
                    type="button"
                    onClick={closeQuote}
                    className="btn-ghost inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 text-sm"
                  >
                    <X className="size-4" aria-hidden />
                    Cerrar formulario
                  </button>
                </div>
                <QuoteWizard
                  selectedUnit={quoteContext?.unit}
                  selectedMode={quoteContext?.mode}
                />
              </div>
            </div>
          </Section>
        </Band>
      </main>

      {/* CONTACTO + FOOTER */}
      <footer
        id="contacto"
        tabIndex={-1}
        className="site-footer relative overflow-hidden scroll-mt-24 border-t border-white/10 bg-industrial-black text-warm-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow"
      >
        <CraneLineArt className="footer-crane-art" />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-5 lg:py-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Contacto</p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
              Habla directamente con nosotros
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-warm-white/75">
              Cotiza o resuelve dudas sobre la renta de grúas con canastilla.
            </p>
          </div>
          <ul
            className={`contact-methods mt-6 grid gap-4 sm:grid-cols-2 ${contactMethods.length >= 3 ? "lg:grid-cols-3" : ""}`}
          >
            {contactMethods.map((method) => (
              <li
                key={method.key}
                className={`contact-method contact-method--${method.key}`}
              >
                <span className="contact-method__icon" aria-hidden>
                  {method.key === "whatsapp" ? (
                    <WhatsAppIcon className="size-6" />
                  ) : method.key === "phone" ? (
                    <Phone className="size-6" />
                  ) : (
                    <Mail className="size-6" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-warm-white/65">
                    {method.label}
                  </p>
                  <p
                    className={`mt-0.5 font-extrabold tracking-tight ${method.key === "email" ? "contact-method__email text-base" : "text-xl"}`}
                  >
                    {method.key === "email" ? (
                      // Si no cabe en una línea, se parte solo después de la arroba.
                      <>
                        {method.value.split("@")[0]}@<wbr />
                        {method.value.split("@")[1]}
                      </>
                    ) : (
                      method.value
                    )}
                  </p>
                </div>
                {method.href ? (
                  <a
                    href={method.href}
                    target={method.external ? "_blank" : undefined}
                    rel={method.external ? "noreferrer" : undefined}
                    className="contact-method__action"
                  >
                    {method.key === "whatsapp" && (
                      <WhatsAppIcon className="size-5" />
                    )}
                    {method.action}
                    <span className="sr-only"> al {method.value}</span>
                  </a>
                ) : (
                  <p className="contact-method__pending">
                    <Clock className="size-4" aria-hidden />
                    Pendiente de activación
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="footer-bottom mt-8 grid gap-6 pt-6 text-sm text-warm-white/70 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <p className="text-base font-extrabold tracking-wide text-warm-white">
                {business.name}
              </p>
              <p className="mt-1.5 max-w-sm leading-relaxed">
                Renta de grúas con canastilla. Disponibilidad sujeta a
                confirmación según la ubicación del proyecto.
              </p>
              <p className="mt-3 text-xs text-warm-white/50">
                © {new Date().getFullYear()} {business.name}
              </p>
            </div>
            <nav
              aria-label="Secciones del sitio"
              className="footer-nav grid grid-cols-2 gap-x-6 gap-y-1"
            >
              <a href="#inicio">Inicio</a>
              <a href="#servicios">Servicios</a>
              <a href="#unidades">Nuestras unidades</a>
              <a href="#cotizar">Cotizar</a>
              <a href="#contacto">Contacto</a>
            </nav>
          </div>
        </div>
      </footer>

      <Assistant />
    </div>
  );
}
