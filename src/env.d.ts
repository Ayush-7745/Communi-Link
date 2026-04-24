/// <reference types="vite/client" />

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const srcPng: string;
  export default srcPng;
}

declare module "*.jpg" {
  const srcJpg: string;
  export default srcJpg;
}

declare module "*.svg" {
  const srcSvg: string;
  export default srcSvg;
}
