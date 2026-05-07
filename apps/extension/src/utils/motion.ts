export const overlayMotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

export const sheetMotionProps = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 18 },
  transition: { type: "spring", visualDuration: 0.35, bounce: 0.12 },
} as const;

export const dialogMotionProps = {
  initial: { opacity: 0, y: 10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.985 },
  transition: { type: "spring", visualDuration: 0.25, bounce: 0.08 },
} as const;

export const popoverMotionProps = {
  initial: { opacity: 0, y: -6, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.985 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;

export const bannerMotionProps = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

export const contentFadeMotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.16, ease: "easeOut" },
} as const;

export const inlineMotionProps = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;

export const buttonMotionProps = {
  whileHover: { filter: "brightness(1.03)" },
  whilePress: { scale: 0.985 },
  transition: { duration: 0.14, ease: "easeOut" },
} as const;

export const subtleButtonMotionProps = {
  whileHover: { scale: 1.01 },
  whilePress: { scale: 0.985 },
  transition: { duration: 0.14, ease: "easeOut" },
} as const;

export const rowMotionTransition = {
  duration: 0.16,
  ease: "easeOut",
} as const;

export const checkToggleMotionProps = {
  whilePress: { scale: 0.92 },
  transition: { duration: 0.12, ease: "easeOut" },
} as const;

export const checkmarkMotionProps = {
  initial: { opacity: 0, scale: 0.65 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.65 },
  transition: { type: "spring", visualDuration: 0.18, bounce: 0.35 },
} as const;

export const skeletonPulseMotionProps = {
  animate: { opacity: [0.55, 0.9, 0.55] as number[] },
  transition: { duration: 1.2, repeat: Number.POSITIVE_INFINITY },
};

export const toggleKnobMotionProps = {
  layout: true,
  transition: { layout: { type: "spring", stiffness: 500, damping: 35 } },
} as const;

export function createSlideMotionProps(x: number) {
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x },
    transition: { duration: 0.2, ease: "easeOut" },
  } as const;
}
