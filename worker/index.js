// Serves the static export (./out). Each version lives at the root of its own subdomain.
// Only page URLs reach this script (see run_worker_first in wrangler.jsonc); every other
// file is served straight from static assets.

const SITES = {
  "toddler.hashir.dev": "/high-chair",
  "toddler2.hashir.dev": "/fridge",
  "toddler3.hashir.dev": "/casino",
};
const HOST_FOR = Object.fromEntries(Object.entries(SITES).map(([host, path]) => [path, host]));

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\.html$/, "").replace(/(.)\/$/, "$1").replace(/^\/index$/, "/");
    const onOurDomain = url.hostname.endsWith("hashir.dev");

    // /fridge on any subdomain goes to toddler2.hashir.dev/, and so on
    if (onOurDomain && HOST_FOR[path]) {
      const port = url.port ? ":" + url.port : "";
      return Response.redirect(`${url.protocol}//${HOST_FOR[path]}${port}/${url.search}`, 302);
    }

    // the root of a version subdomain serves that version's page
    const version = SITES[url.hostname];
    if (path === "/" && version) {
      return env.ASSETS.fetch(new Request(new URL(version, url), request));
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
