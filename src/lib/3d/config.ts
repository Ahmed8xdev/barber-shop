export const DPR_MAX: [number, number] = [1, 1.5];

export const PARTICLE_COUNT = 8000;

export const FOV = 75;

export const CAMERA_PATHS = {
  hero: [
    { position: [0, 2, 12], target: [0, 0, 0], progress: 0 },
    { position: [0, 1.5, 10], target: [0, 0, 0], progress: 0.05 },
    { position: [0, 1, 8], target: [0, 0, 0], progress: 0.1 },
    { position: [0, 0.5, 12], target: [0, 0, 0], progress: 0.15 },
    { position: [0, 0, 18], target: [0, 0, 0], progress: 0.2 },
  ],
};

export const EASING = {
  spring: { stiffness: 300, damping: 20 },
  springSmooth: { stiffness: 200, damping: 25 },
  springSnappy: { stiffness: 400, damping: 15 },
} as const;

export const COLORS = {
  bronze: "#C5A880",
  bronzeDark: "#A3805B",
  gold: "#D4A843",
  champagne: "#F7E7CE",
  espresso: "#2C2520",
  sand: "#6B6661",
} as const;
