// Datos del negocio. Reemplazar "Por confirmar" con información real.
// Fase futura: mover a la tabla `unidades` / configuración en backend.
export const PENDING = "Por confirmar";

// Número comercial confirmado: se usa como teléfono y como WhatsApp.
const COMMERCIAL_NUMBER = "55 6500 4811";

export const business = {
  name: "REY CENTRAL GRÚAS",
  // Formato internacional (52 + 10 dígitos) para enlaces wa.me y tel:.
  whatsapp: "525565004811",
  whatsappDisplay: COMMERCIAL_NUMBER,
  phone: COMMERCIAL_NUMBER,
  // Marcador reservado (dominio .example): NO es una dirección operativa. Al confirmar el correo
  // real, sustituirlo aquí y cambiar `emailConfirmed` a true para habilitar «Enviar correo».
  email: "contacto@reycentralgruas.example",
  emailConfirmed: false,
  hours: PENDING,
  coverage: ["Cobertura nacional"],
};

/** Valores que siguen pendientes de confirmar no se muestran como dato comercial en la página. */
export const isConfirmed = (value: string) => !!value && value !== PENDING;

/** Fotografía real de una unidad. `zoom` amplía la imagen al mostrarla (p. ej. para ocultar
 *  bandas del lienzo original) sin modificar el archivo. */
export type UnitPhoto = { src: string; alt: string; zoom?: number };

export type FleetUnit = {
  id: string;
  name: string;
  type: string;
  /** Solo fotografías reales de esta unidad; la galería muestra controles si hay más de una. */
  photos?: UnitPhoto[];
  note: string;
  /** Visible en el catálogo público. Las unidades sin foto ni datos verificados se conservan aquí
   *  pero no se publican hasta completarse. */
  published: boolean;
  /** Aplicaciones habituales; solo para unidades cuyo uso está confirmado. */
  applications?: string[];
};

// Campos de la ficha técnica. Se muestran como "Por confirmar" hasta contar con datos verificados.
export const fleetSpecLabels = [
  "Altura de trabajo",
  "Capacidad de canastilla",
  "Alcance horizontal",
];

// La empresa cuenta con dos grúas. Agregar fotografías y especificaciones verificadas de cada una
// conforme estén disponibles; no reutilizar la foto de una unidad para la otra.
export const fleetUnits: FleetUnit[] = [
  {
    id: "unidad-01",
    name: "Unidad 01",
    type: "Grúa con canastilla",
    photos: [
      {
        src: "/assets/grua-final-rey-central.webp",
        alt: "Grúa blanca con canastilla y trabajadores realizando trabajo en altura",
        // La fotografía trae bandas negras laterales (~7 % por lado).
        zoom: 1.16,
      },
    ],
    note: "Fotografía de la unidad disponible.",
    published: true,
    applications: [
      "Mantenimiento en altura",
      "Trabajos de iluminación",
      "Trabajos de telecomunicaciones",
    ],
  },
  {
    id: "unidad-02",
    name: "Unidad 02",
    type: "Ficha técnica en actualización",
    note: "Fotografía y características por confirmar con el equipo operativo.",
    published: false,
  },
];

/** Unidades que se muestran en la página y en el cotizador. */
export const publicFleetUnits = fleetUnits.filter((unit) => unit.published);

/** Tipos de trabajo del cotizador (paso 1). «Otro trabajo» pide una descripción libre. */
export const OTHER_WORK = "Otro trabajo";
export const quoteWorkTypes = [
  "Mantenimiento en altura",
  "Iluminación",
  "Telecomunicaciones",
  OTHER_WORK,
];

// Catálogo anterior de servicios: se conserva para interpretar solicitudes guardadas en sesión.
export const services = [
  "Instalación y mantenimiento de anuncios",
  "Luminarias",
  "Fachadas",
  "Cámaras y antenas",
  "Instalaciones eléctricas",
  "Mantenimiento comercial",
  "Mantenimiento industrial",
  "Otro trabajo en altura",
];
