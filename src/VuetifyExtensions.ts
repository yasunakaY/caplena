export const easeInAtStartThenLinear = (t: number) => (t < 0.1 ? t * t * 5 : t - 0.05)
