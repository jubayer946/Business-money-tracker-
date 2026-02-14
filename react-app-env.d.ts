/**
 * Custom JSX intrinsic elements definition to allow dynamic or custom tag names.
 */
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Node process env is provided by the vite environment
interface ImportMetaEnv {
  readonly API_KEY: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}