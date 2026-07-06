function initTheme() {
  const btn = document.getElementById("themeComplex");
  if (!btn) return console.warn("Theme button not found");

  const icon = btn.querySelector(".icoAniTheme");
  const body = document.body;
  const savedTheme = localStorage.getItem("CT");
  let isAnimating = false;

  if (savedTheme === "L") {
    body.classList.add("L");
    if (icon) icon.innerText = "sunny";
  }

  btn.addEventListener("click", () => {
    if (!icon || isAnimating) return;

    isAnimating = true;
    const nextThemeIsLight = !body.classList.contains("L");
    const motionClass = nextThemeIsLight ? "is-forward" : "is-reverse";

    icon.classList.remove("is-entering");
    icon.classList.remove("is-forward", "is-reverse");
    icon.classList.add(motionClass);
    icon.classList.add("is-leaving");

    const handleExit = () => {
      icon.removeEventListener("animationend", handleExit);
      body.classList.toggle("L", nextThemeIsLight);
      localStorage.setItem("CT", nextThemeIsLight ? "L" : "D");
      icon.innerText = nextThemeIsLight ? "sunny" : "moon_stars";
      icon.classList.remove("is-leaving");
      icon.classList.add("is-entering");

      const handleEnter = () => {
        icon.removeEventListener("animationend", handleEnter);
        icon.classList.remove("is-entering");
        icon.classList.remove("is-forward", "is-reverse");
        isAnimating = false;
      };

      icon.addEventListener("animationend", handleEnter, { once: true });
    };

    icon.addEventListener("animationend", handleExit, { once: true });
  });
}

document.addEventListener("headerLoaded", initTheme);