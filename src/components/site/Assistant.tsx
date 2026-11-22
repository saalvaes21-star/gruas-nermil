import { useState } from "react";
import { whatsAppUrl } from "@/lib/integrations";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const options = [
  ["Quiero cotizar", "#cotizar"],
  ["Ver nuestras unidades", "#unidades"],
  ["Enviar fotografías", "#cotizar"],
  ["Consultar disponibilidad en mi zona", "#cotizar"],
  ["Hablar con una persona", "#contacto"],
] as const;

// Futuro: asistente conversacional con IA. Fase 1: menú guiado.
export function Assistant() {
  const [open, setOpen] = useState(false);
  const wa = whatsAppUrl("Hola, quiero hablar con una persona.");
  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-5 sm:right-5">
      {open && (
        <div
          id="help-options"
          className="mb-2 max-h-[calc(100dvh-6.5rem)] w-[17rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-border bg-popover p-3 shadow-xl"
        >
          <p className="font-bold">¿En qué te ayudamos?</p>
          <div className="mt-3 space-y-2">
            {options.map(([l, h]) => (
              <a
                key={l}
                href={l === "Hablar con una persona" && wa ? wa : h}
                onClick={() => setOpen(false)}
                className="block rounded-xl border border-border bg-muted px-3 py-2.5 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar ayuda" : "¿Necesitas ayuda?"}
        title={open ? "Cerrar ayuda" : "¿Necesitas ayuda?"}
        aria-expanded={open}
        aria-controls="help-options"
        className="assistant-trigger ml-auto flex size-11 rounded-full p-0 sm:h-9 sm:w-auto sm:px-2.5"
      >
        {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
        <span className="hidden text-[11px] sm:inline">{open ? "Cerrar" : "¿Necesitas ayuda?"}</span>
      </Button>
    </div>
  );
}
