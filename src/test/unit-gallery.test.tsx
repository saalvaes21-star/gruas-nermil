import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UnitGallery } from "@/components/site/UnitGallery";

// jsdom no implementa PointerEvent; sin él los eventos llegan sin coordenadas.
if (!("PointerEvent" in window)) {
  Object.defineProperty(window, "PointerEvent", {
    value: MouseEvent,
    writable: true,
  });
}

// Imágenes ficticias solo para la prueba: la página publica únicamente fotografías reales.
const photos = [
  { src: "/test/a.webp", alt: "Foto A" },
  { src: "/test/b.webp", alt: "Foto B" },
  { src: "/test/c.webp", alt: "Foto C" },
];

const current = () => screen.getByRole("button", { current: true });

describe("UnitGallery", () => {
  it("con una sola foto la muestra sin flechas ni indicadores", () => {
    render(<UnitGallery photos={photos.slice(0, 1)} label="Unidad 01" />);
    expect(screen.getByAltText("Foto A")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("sin fotos no renderiza nada", () => {
    const { container } = render(<UnitGallery photos={[]} label="Unidad 01" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("recorre las fotos con flechas, indicadores y teclado, de forma circular", () => {
    render(<UnitGallery photos={photos} label="Unidad 01" />);
    expect(current()).toHaveAccessibleName("Ver foto 1 de 3");

    fireEvent.click(screen.getByRole("button", { name: "Foto siguiente" }));
    expect(current()).toHaveAccessibleName("Ver foto 2 de 3");
    expect(screen.getByText("Foto 2 de 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Foto anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Foto anterior" }));
    expect(current()).toHaveAccessibleName("Ver foto 3 de 3");

    fireEvent.click(screen.getByRole("button", { name: "Ver foto 1 de 3" }));
    expect(current()).toHaveAccessibleName("Ver foto 1 de 3");

    const region = screen.getByRole("region", {
      name: "Fotografías de Unidad 01",
    });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(current()).toHaveAccessibleName("Ver foto 2 de 3");
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(current()).toHaveAccessibleName("Ver foto 1 de 3");
  });

  it("avanza con un deslizamiento táctil y no reacciona a toques cortos", () => {
    render(<UnitGallery photos={photos} label="Unidad 01" />);
    const region = screen.getByRole("region");
    fireEvent.pointerDown(region, { clientX: 300 });
    fireEvent.pointerUp(region, { clientX: 290 });
    expect(current()).toHaveAccessibleName("Ver foto 1 de 3");
    fireEvent.pointerDown(region, { clientX: 300 });
    fireEvent.pointerUp(region, { clientX: 200 });
    expect(current()).toHaveAccessibleName("Ver foto 2 de 3");
  });
});
