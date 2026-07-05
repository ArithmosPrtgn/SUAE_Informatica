document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/sitewide/nav/navGoogleSheets.html");

    if (!res.ok) {
      throw new Error(`Erro ao fetchar nav: ${res.status}`);
    }

    const data = await res.text();
    const parsed = new DOMParser().parseFromString(data, "text/html");
    const navElements = Array.from(parsed.body?.children ?? []);

    if (navElements.length === 0) {
      throw new Error("Cadê o <nav>?");
    }

    const mountPoint = document.getElementById("NavLoL");

    if (mountPoint) {
      mountPoint.replaceWith(...navElements);
      document.dispatchEvent(new Event("headerLoaded"));
      return;
    }

    document.body.append(...navElements);
    document.dispatchEvent(new Event("headerLoaded"));
  } catch (error) {
    console.error("Erro ao carregar nav:", error);
  }
});
