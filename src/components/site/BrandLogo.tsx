import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <picture>
      <source srcSet="/assets/logo-rey-central-gruas.webp" type="image/webp" />
      <img
        src="/assets/logo-rey-central-gruas.png"
        alt="Rey Central Grúas"
        width={1536}
        height={1024}
        className={cn("block w-full h-auto object-contain", className)}
      />
    </picture>
  );
}
