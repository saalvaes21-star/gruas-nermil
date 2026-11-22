import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/site/BrandLogo";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { whatsAppUrl } from "@/lib/integrations";

const links = [
  ["Inicio", "#inicio"],
  ["Servicios", "#servicios"],
  ["Nuestras unidades", "#unidades"],
  ["Cotizar", "#cotizar"],
  ["Contacto", "#contacto"],
] as const;
const SECTION_IDS = links.map(([, href]) => href.slice(1)).filter(Boolean);

function NavLink({
  label,
  href,
  isActive,
  onClick,
  variant,
}: {
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
  variant: "desktop" | "mobile";
}) {
  const className =
    variant === "desktop"
      ? isActive
        ? "inline-flex min-h-9 items-center rounded-lg bg-industrial-yellow px-3 font-bold text-industrial-black shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark"
        : "inline-flex min-h-9 items-center rounded-lg px-2.5 font-semibold text-warm-white/76 transition-colors hover:bg-white/10 hover:text-warm-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark"
      : `block rounded-lg px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark ${isActive ? "bg-industrial-yellow text-industrial-black" : "text-warm-white hover:bg-white/10"}`;
  return (
    <a
      key={href}
      href={href}
      onClick={onClick}
      aria-current={isActive ? "location" : undefined}
      className={className}
    >
      {label}
    </a>
  );
}

export function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>("inicio");
  const quoteHref =
    whatsAppUrl("Hola, quiero cotizar un servicio de grúa.") ?? "#cotizar";

  // Throttled to one update per frame instead of once per scroll event.
  useEffect(() => {
    let ticking = false;
    const applyCompact = () => {
      setCompact(window.scrollY > 40);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyCompact);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    applyCompact();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const sections = SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      () => {
        const headerOffset = document.querySelector<HTMLElement>(
          ".industrial-header",
        )?.offsetHeight ?? 0;
        const current = sections.reduce((closest, section) => {
          const distance = Math.abs(
            section.getBoundingClientRect().top - headerOffset - 24,
          );
          return distance < closest.distance ? { id: section.id, distance } : closest;
        }, { id: "inicio", distance: Number.POSITIVE_INFINITY });
        setActive(current.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className="industrial-header sticky top-0 z-50 w-full"
      data-compact={compact}
    >
      <div className="industrial-header__bar relative mx-auto grid h-(--site-header-h) max-w-7xl grid-cols-[5rem_1fr_auto] items-center gap-3 px-4 sm:grid-cols-[6rem_1fr_auto] sm:px-5 lg:grid-cols-[7rem_1fr_auto]">
        <a
          href="#inicio"
          onClick={() => setOpen(false)}
          aria-label="Rey Central Grúas — inicio"
          data-header-logo
          className={`flex min-w-0 items-center justify-self-start rounded-lg motion-safe:transition-[width] motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark ${compact ? "w-14 sm:w-16 lg:w-20" : "w-16 sm:w-20 lg:w-24"}`}
        >
          <BrandLogo className="w-full h-auto" />
        </a>

        <nav
          aria-label="Navegación principal"
          className="industrial-nav-pill absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 text-sm lg:flex"
        >
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              label={label}
              href={href}
              isActive={
                active === href.slice(1) || (href === "#" && active === null)
              }
              variant="desktop"
            />
          ))}
        </nav>

        <div className="col-start-3 flex items-center justify-self-end gap-2">
          <a
            href={quoteHref}
            target={quoteHref.startsWith("https://") ? "_blank" : undefined}
            rel={quoteHref.startsWith("https://") ? "noreferrer" : undefined}
            className="industrial-whatsapp hidden min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-white focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark sm:inline-flex"
          >
            <WhatsAppIcon className="size-5" />
            Cotizar por WhatsApp
          </a>

          <a
            href={quoteHref}
            target={quoteHref.startsWith("https://") ? "_blank" : undefined}
            rel={quoteHref.startsWith("https://") ? "noreferrer" : undefined}
            aria-label="Cotizar por WhatsApp"
            className="industrial-whatsapp grid size-10 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-white focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark sm:hidden"
          >
            <WhatsAppIcon className="size-5" />
          </a>

          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-xl text-warm-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-industrial-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-industrial-dark lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Navegación móvil"
          className="absolute left-3 right-3 top-[calc(100%+0.25rem)] rounded-2xl border border-white/15 bg-industrial-dark px-3 py-2 text-warm-white shadow-xl lg:hidden sm:left-5 sm:right-5"
        >
          <div className="mx-auto max-w-6xl divide-y divide-white/10">
            {links.map(([label, href]) => (
              <NavLink
                key={href}
                label={label}
                href={href}
                isActive={
                  active === href.slice(1) || (href === "#" && active === null)
                }
                variant="mobile"
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
