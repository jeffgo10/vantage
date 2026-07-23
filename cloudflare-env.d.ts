/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  ASSETS: Fetcher;
  PANORAMAS: R2Bucket;
  IMAGES: ImagesBinding;
  WORKER_SELF_REFERENCE: Fetcher;
  HYPERDRIVE?: Hyperdrive;
}
