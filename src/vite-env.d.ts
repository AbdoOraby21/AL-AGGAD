/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_WHATSAPP_NUMBER?: string;
  /** 'true' => safe client demo (mock data, no writes). Any other value => off. */
  readonly VITE_DEMO_MODE?: string;
}
