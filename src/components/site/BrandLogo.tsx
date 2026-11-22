import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = "auto",
}: {
  className?: string;
  priority?: "high" | "auto";
}) {
  return (
    <picture>
      <source srcSet="/logo-rey-central-oficial.webp" type="image/webp" />
      <img
        src="/logo-rey-central-oficial.png"
        alt="Rey Central de Grúas"
        width={1261}
        height={1016}
        decoding="async"
        fetchPriority={priority}
        sizes="(min-width: 1024px) 280px, 80px"
        className={cn("block w-full h-auto object-contain", className)}
      />
    </picture>
  );
}
