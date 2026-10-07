import { cn } from "@/utils/cn";

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 48 48"
        className={cn("h-8 w-8", markClassName)}
        fill="none"
        aria-hidden
      >
        <path
          d="M24 4 42 14v12.5c0 10.2-7.4 19.4-18 21.5C13.4 45.9 6 36.7 6 26.5V14L24 4Z"
          stroke="#0b1f3a"
          strokeWidth="1.7"
          fill="rgba(37,99,235,0.06)"
        />
        <path
          d="M24 10.5 36.5 17.2v7.6c0 6.6-4.8 12.5-12.5 13.9-7.7-1.4-12.5-7.3-12.5-13.9v-7.6L24 10.5Z"
          stroke="#2563eb"
          strokeWidth="1.3"
          opacity="0.9"
        />
        <circle cx="24" cy="24" r="2.2" fill="#2563eb" />
        <circle cx="18.2" cy="20.2" r="1.35" fill="#0ea5e9" />
        <circle cx="30.2" cy="20.6" r="1.35" fill="#0ea5e9" />
        <circle cx="24" cy="31.2" r="1.35" fill="#1d4ed8" />
        <path
          d="M18.2 20.2 24 24 30.2 20.6M24 24v7.2"
          stroke="#2563eb"
          strokeWidth="1.1"
          opacity="0.85"
        />
      </svg>
      <span className="font-display text-[13px] font-semibold tracking-[0.18em] text-navy">
        CYBERSENTINEL
      </span>
    </div>
  );
}
