# Deriva steel-tread-plate-relieve.webp a partir de steel-tread-plate.webp (el original no se modifica).
# Refuerza el contraste local (máscara de enfoque de radio medio) sobre las luces y sombras ya
# presentes en la textura: los bordes iluminados de cada relieve ganan brillo y el lado opuesto
# sombra, con la misma dirección de luz. Se procesa en mosaico 3×3 para que la pieza siga siendo
# continua al repetirse. Geometría, tamaño (512×512) y escala del patrón no cambian.
#
# Uso: python3 docs/tools/derive_tread_relief.py [radio] [porcentaje]
import sys
from PIL import Image, ImageFilter

SRC = "public/assets/industrial/steel-tread-plate.webp"
DST = "public/assets/industrial/steel-tread-plate-relieve.webp"
radius = float(sys.argv[1]) if len(sys.argv) > 1 else 2.2
percent = int(sys.argv[2]) if len(sys.argv) > 2 else 85
out = sys.argv[3] if len(sys.argv) > 3 else DST

tile = Image.open(SRC).convert("RGB")
w, h = tile.size
big = Image.new("RGB", (w * 3, h * 3))
for i in range(3):
    for j in range(3):
        big.paste(tile, (i * w, j * h))
sharp = big.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=0))
sharp.crop((w, h, 2 * w, 2 * h)).save(out, "WEBP", quality=92, method=6)
print(out, w, "x", h)
