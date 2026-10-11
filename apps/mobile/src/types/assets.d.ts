// Asset modules Metro serves as URLs on the web (see metro.config.js for the extension list).
declare module '*.wasm' {
  const url: string;
  export default url;
}
