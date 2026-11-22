import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UnitPhoto } from "@/config/business";

const SWIPE_THRESHOLD = 40;

/**
 * Galería de fotografías reales de una unidad. Con una sola foto se muestra la imagen sin controles;
 * con varias se añaden flechas, indicadores, flechas del teclado y deslizamiento táctil.
 * No avanza sola: el visitante controla el recorrido.
 */
export function UnitGallery({
  photos,
  label,
}: {
  photos: UnitPhoto[];
  label: string;
}) {
  const [index, setIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const count = photos.length;

  if (count === 0) return null;
  const photoStyle = (photo: UnitPhoto) =>
    ({ "--photo-zoom": photo.zoom ?? 1 }) as CSSProperties;

  if (count === 1) {
    const [photo] = photos as [UnitPhoto];
    return (
      <div className="unit-gallery">
        <img
          src={photo.src}
          alt={photo.alt}
          loading="lazy"
          decoding="async"
          className="unit-gallery__image"
          style={photoStyle(photo)}
        />
      </div>
    );
  }

  const go = (next: number) => setIndex((next + count) % count);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = event.clientX;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD)
      go(delta < 0 ? index + 1 : index - 1);
  };

  return (
    <div
      className="unit-gallery unit-gallery--multiple"
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Fotografías de ${label}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (pointerStart.current = null)}
    >
      <div
        className="unit-gallery__track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            className="unit-gallery__slide"
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${count}`}
            aria-hidden={i !== index}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="unit-gallery__image"
              style={photoStyle(photo)}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="unit-gallery__arrow unit-gallery__arrow--prev"
        aria-label="Foto anterior"
        onClick={() => go(index - 1)}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        className="unit-gallery__arrow unit-gallery__arrow--next"
        aria-label="Foto siguiente"
        onClick={() => go(index + 1)}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
      <div className="unit-gallery__dots">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            className="unit-gallery__dot"
            aria-label={`Ver foto ${i + 1} de ${count}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Foto {index + 1} de {count}
      </p>
    </div>
  );
}
