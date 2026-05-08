import { type VariantProps, cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-sm font-semibold cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        accent:
          "uppercase tracking-[0.4px] border border-accent-edge bg-accent text-accent-ink shadow-btn",
        ghost: "bg-transparent border border-dashed border-stroke text-ink",
        ghostAccent: "bg-transparent border border-solid border-accent-edge text-accent-ink-str",
        destructive: "bg-destructive text-destructive-ink border border-transparent",
        destructiveOutline:
          "text-destructive bg-transparent border border-destructive-edge hover:bg-destructive-soft",
        icon: "bg-transparent border border-transparent text-ink-muted hover:bg-surface hover:text-ink",
        plainIcon: "bg-transparent border-0 text-ink-muted hover:text-ink",
        link: "bg-transparent border-0 text-accent-ink-str hover:underline",
        dangerLink: "bg-transparent border-0 text-destructive hover:underline",
        warnLink: "bg-transparent border-0 text-warn-ink",
        tab: "bg-transparent border-0 uppercase tracking-[0.5px] rounded-none",
        subtab: "bg-transparent border border-b-0 uppercase tracking-[0.5px] rounded-t-md",
      },
      size: {
        xs: "h-6 px-2 text-[10px]",
        sm: "h-[26px] px-2.5 text-[11px]",
        md: "h-8 px-2.5 text-xs",
        lg: "h-11 px-3.5 text-sm",
        iconSm: "w-6 h-6 p-0 text-base leading-none shrink-0",
        iconMd: "w-7 h-7 p-0 text-sm shrink-0",
        link: "h-auto px-0 py-0 text-[10px]",
        tab: "h-auto px-3 py-1.5 text-[11px]",
        subtab: "h-auto px-3 py-2 text-[11px]",
      },
      full: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "accent",
      size: "md",
      full: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
