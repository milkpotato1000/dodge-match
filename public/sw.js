const CACHE = "dodge-match-tile-match-v3";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE),
        shell = await fetch("/");
      if (!shell.ok) throw Error("App shell unavailable");
      const html = await shell.clone().text();
      const builtAssets = [
        ...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g),
      ].map((match) => match[1]);
      await cache.addAll([
        ...new Set([
          "/chart.json",
          "/assets/dog.png",
          "/assets/loading.png",
          "/assets/dog-cry.png",
          "/icon.svg",
          "/manifest.webmanifest",
          ...builtAssets,
        ]),
      ]);
      await cache.put("/", shell);
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
