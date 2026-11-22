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
      <source srcSet="/logo-rey-central-v4.webp" type="image/webp" />
      <img
        src="/logo-rey-central-v4.png"
        alt="Rey Central de Grúas"
        width={1297}
        height={1043}
        decoding="async"
        fetchPriority={priority}
        sizes="(min-width: 1024px) 280px, 80px"
        className={cn("block h-auto w-full overflow-visible object-contain", className)}
      />
    </picture>
  );
}
