import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <picture>
      <source srcSet="/logo-rey-central-oficial.webp" type="image/webp" />
      <img
        src="/logo-rey-central-oficial.png"
        alt="Rey Central de Grúas"
        width={1261}
        height={1016}
        className={cn("block w-full h-auto object-contain", className)}
      />
    </picture>
  );
}
