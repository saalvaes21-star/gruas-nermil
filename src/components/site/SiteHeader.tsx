import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { business } from "@/config/business";
import { Button } from "@/components/ui/button";

const links = [
  ["Unidad", "#unidad"],
  ["Servicios", "#servicios"],
  ["Cotizar", "#cotizar"],
  ["Cobertura", "#cobertura"],
  ["Contacto", "#contacto"],
] as const;
const SECTION_IDS = links.map(([, href]) => href.slice(1));

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
        ? "font-semibold text-industrial-yellow"
        : "text-warm-white/80 hover:text-warm-white"
      : `block py-3 text-sm font-semibold ${isActive ? "text-industrial-yellow" : "text-warm-white"}`;
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
  const [active, setActive] = useState<string | null>(null);

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
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setActive((current) => {
          const entering = entries.find((entry) => entry.isIntersecting);
          if (entering) return entering.target.id;
          const currentLeft = entries.some(
            (entry) => !entry.isIntersecting && entry.target.id === current,
          );
          return currentLeft ? null : current;
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className="industrial-header sticky top-0 z-40 border-b border-white/10 bg-industrial-black/95 backdrop-blur"
      data-compact={compact}
    >
      <div
        className={`mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 motion-safe:transition-[padding] motion-safe:duration-200 md:grid-cols-[1fr_auto_1fr] ${compact ? "py-2" : "py-3"}`}
      >
        <a href="#" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid shrink-0 place-items-center rounded-xl border border-industrial-yellow/30 bg-white/5 text-xs font-bold text-industrial-yellow motion-safe:transition-[width,height] ${compact ? "size-8" : "size-9"}`}
          >
            RG
          </span>
          <span className="truncate text-[15px] font-bold text-warm-white">{business.name}</span>
        </a>

        <nav
          aria-label="Navegación principal"
          className="hidden shrink-0 justify-self-center gap-5 text-sm md:flex"
        >
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              label={label}
              href={href}
              isActive={active === href.slice(1)}
              variant="desktop"
            />
          ))}
        </nav>

        <div className="hidden md:block" aria-hidden />

        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 justify-self-end text-warm-white hover:bg-white/10 md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Navegación móvil"
          className="absolute inset-x-0 top-full border-b border-white/10 bg-industrial-black px-5 py-2 md:hidden"
        >
          <div className="mx-auto max-w-6xl divide-y divide-white/10">
            {links.map(([label, href]) => (
              <NavLink
                key={href}
                label={label}
                href={href}
                isActive={active === href.slice(1)}
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
