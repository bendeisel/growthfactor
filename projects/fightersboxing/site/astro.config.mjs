// @ts-check
import { defineConfig } from 'astro/config';

// TODO: confirm production domain with Ben before launch (email domain
// suggests fightersnashville.com). Sitemap/canonical derive from this.
export default defineConfig({
  site: 'https://fightersnashville.com',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
});
