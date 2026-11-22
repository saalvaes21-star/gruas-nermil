import serviceAlturaImg from "@/assets/reference/service-altura.webp";
import serviceAnunciosImg from "@/assets/reference/service-anuncios.webp";
import serviceLuminariasImg from "@/assets/reference/service-luminarias.webp";
import serviceFachadasImg from "@/assets/reference/service-fachadas.webp";
import serviceCamarasImg from "@/assets/reference/service-camaras.webp";
import serviceIndustrialImg from "@/assets/reference/service-industrial.webp";
import whyChooseUsImg from "@/assets/reference/why-choose-us.webp";

// Catálogo central de las fotografías de referencia.
// Para sustituir un slot por una foto real del negocio más adelante:
//   1. Guardar el nuevo archivo como src/assets/reference/<slot>.webp (mismo nombre).
//   2. El import de arriba ya apunta ahí — solo hay que reemplazar el archivo físico,
//      o repetir el patrón de import si cambia el nombre.
// No importar un archivo que todavía no existe: rompe el build.

export type ReferenceImageKey =
  | "service-altura"
  | "service-anuncios"
  | "service-luminarias"
  | "service-fachadas"
  | "service-camaras"
  | "service-industrial"
  | "why-choose-us";

export interface ReferenceImage {
  slot: ReferenceImageKey;
  src: string | null;
  alt: string;
}

export const referenceImages: Record<ReferenceImageKey, ReferenceImage> = {
  "service-altura": {
    slot: "service-altura",
    src: serviceAlturaImg,
    alt: "Grúa con canastilla realizando trabajo técnico en altura",
  },
  "service-anuncios": {
    slot: "service-anuncios",
    src: serviceAnunciosImg,
    alt: "Grúa con canastilla utilizada para instalación de anuncio comercial",
  },
  "service-luminarias": {
    slot: "service-luminarias",
    src: serviceLuminariasImg,
    alt: "Trabajo de mantenimiento de luminaria mediante grúa con canastilla",
  },
  "service-fachadas": {
    slot: "service-fachadas",
    src: serviceFachadasImg,
    alt: "Grúa con canastilla realizando mantenimiento en fachada",
  },
  "service-camaras": {
    slot: "service-camaras",
    src: serviceCamarasImg,
    alt: "Instalación de cámara en altura mediante grúa con canastilla",
  },
  "service-industrial": {
    slot: "service-industrial",
    src: serviceIndustrialImg,
    alt: "Trabajo de mantenimiento industrial con grúa de canastilla",
  },
  "why-choose-us": {
    slot: "why-choose-us",
    src: whyChooseUsImg,
    alt: "Operación profesional de grúa con canastilla en entorno urbano",
  },
};
