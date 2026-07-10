/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.yaml' {
  const data: unknown;
  export default data;
}
