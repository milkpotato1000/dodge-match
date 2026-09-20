const CACHE = "dodge-match-deploy-path-v5";
const appUrl = (path = "") => new URL(path, self.registration.scope).toString();
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE),
        shell = await fetch(appUrl());
      if (!shell.ok) throw Error("App shell unavailable");
      const html = await shell.clone().text();
      const builtAssets = [
        ...html.matchAll(/(?:src|href)="([^\"]*\/assets\/[^\"]+)"/g),
      ].map((match) => new URL(match[1], self.location.origin).toString());
      await cache.addAll([
        ...new Set([
          appUrl("chart.json"),
          appUrl("assets/dog.png"),
          appUrl("assets/loading.png"),
          appUrl("assets/dog-cry.png"),
          appUrl("icon.svg"),
          appUrl("manifest.webmanifest"),
          ...builtAssets,
        ]),
      ]);
      await cache.put(appUrl(), shell);
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("dodge-match-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== location.origin
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)),
          );
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request, { ignoreVary: true })
          .then((cached) => cached || Response.error()),
      ),
  );
});
