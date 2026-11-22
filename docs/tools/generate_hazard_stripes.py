# Genera las franjas de precaución de la banda en chevrón de
# public/assets/industrial/photo-frame-angular.svg como una cinta plegada en cada vértice.
#
# Un único juego de franjas rectas (período y grosor medidos en perpendicular) se dibuja en el tramo
# superior; el tramo central muestra su reflejo especular sobre la línea de la primera unión y el
# inferior, el reflejo de este sobre la segunda unión. La reflexión conserva grosor y período y hace
# que cada franja termine exactamente donde empieza su continuación: no hay cortes en los vértices.
#
# Uso: python3 docs/tools/generate_hazard_stripes.py > fragmento.svg
import math

OUTER = [(214, 0), (45, 342), (144, 537), (0, 800)]
INNER = [(274, 0), (106, 342), (206, 533), (72, 800)]
PERIOD = 83.333     # distancia perpendicular entre franjas negras consecutivas
BLACK = 24.8        # grosor perpendicular de cada franja negra
ANGLE = 71.0        # dirección de las franjas del tramo superior (≈45° respecto a su sección)
PHASE = 61.0        # fase: cada unión queda cruzada por una franja negra completa (≥11 u de naranja a cada lado)
OVERLAP = 0.6       # solape de los recortes en cada unión para evitar líneas de antialias


def reflection(p, q):
    """Matriz afín (a b c d e f) de la reflexión sobre la recta p–q."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    length = math.hypot(dx, dy)
    ux, uy = dx / length, dy / length
    a, b = 2 * ux * ux - 1, 2 * ux * uy
    c, d = b, 2 * uy * uy - 1
    e = p[0] - (a * p[0] + c * p[1])
    f = p[1] - (b * p[0] + d * p[1])
    return (a, b, c, d, e, f)


def compose(m2, m1):
    """m2 ∘ m1 en notación SVG matrix(a b c d e f)."""
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a2 * a1 + c2 * b1, b2 * a1 + d2 * b1, a2 * c1 + c2 * d1, b2 * c1 + d2 * d1,
            a2 * e1 + c2 * f1 + e2, b2 * e1 + d2 * f1 + f2)


def stripes_path():
    t = (math.cos(math.radians(ANGLE)), math.sin(math.radians(ANGLE)))
    n = (-t[1], t[0])
    origin = (60.0, 342.0)
    span = 1400
    parts = []
    for k in range(-14, 15):
        o = k * PERIOD + PHASE
        quad = [(-span, o), (span, o), (span, o + BLACK), (-span, o + BLACK)]
        pts = [(origin[0] + u * t[0] + v * n[0], origin[1] + u * t[1] + v * n[1]) for u, v in quad]
        parts.append("M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + " Z")
    return " ".join(parts)


def fmt(m):
    return "matrix(" + " ".join(f"{v:.6f}".rstrip("0").rstrip(".") for v in m) + ")"


r1 = reflection(OUTER[1], INNER[1])
r2 = reflection(OUTER[2], INNER[2])
mid, bottom = r1, compose(r2, r1)
E = OVERLAP
regions = [
    f"M214 0 H274 L106 {342 + E} H45 Z",
    f"M45 {342 - E} H106 L206 {533 + E} L144 {537 + E} Z",
    f"M144 {537 - E} L206 {533 - E} L72 800 H0 Z",
]
print("    <!-- Franjas de precaución: cinta plegada (reflejo exacto en cada unión). Generado por")
print("         docs/tools/generate_hazard_stripes.py: período 83,333 u y franja negra 24,8 u en perpendicular. -->")
print(f'    <path id="hazardStripes" d="{stripes_path()}" />')
for i, region in enumerate(regions, 1):
    print(f'    <clipPath id="hazardSeg{i}"><path d="{region}" /></clipPath>')
print("@@BODY@@")
print('    <g clip-path="url(#hazardSeg1)" fill="#141619"><use href="#hazardStripes" /></g>')
print(f'    <g clip-path="url(#hazardSeg2)" fill="#141619"><use href="#hazardStripes" transform="{fmt(mid)}" /></g>')
print(f'    <g clip-path="url(#hazardSeg3)" fill="#141619"><use href="#hazardStripes" transform="{fmt(bottom)}" /></g>')
