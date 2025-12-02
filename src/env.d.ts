/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type ENV = {
  DATABASE_URL: string;
  EMAIL_API_KEY: string;
  BUSINESS_EMAIL: string;
  R2: R2Bucket;
};

type Runtime = import('@astrojs/cloudflare').Runtime<ENV>;

declare namespace App {
  interface Locals extends Runtime {
    runtime: {
      env: ENV;
    };
  }
}
