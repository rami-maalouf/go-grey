const slider = document.querySelector("#comparison");
const stage = slider.closest(".feed-stage");
// both copies share one grid cell and one native scroll position.
for (const layer of stage.querySelectorAll(".feed-bar, .post-stack")) {
  const gray = layer.cloneNode(true);
  gray.classList.add("gray-copy");
  gray.setAttribute("aria-hidden", "true");
  gray.inert = true;
  layer.after(gray);
}
let split = 50;

function setSplit(value) {
  split = Math.round(Math.max(0, Math.min(100, value)));
  stage.style.setProperty("--split", split + "%");
  slider.setAttribute("aria-valuenow", split);
  slider.setAttribute("aria-valuetext", split + " percent in color");
}

slider.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  slider.setPointerCapture(event.pointerId);
  slider.focus({ preventScroll: true });
});
slider.addEventListener("pointermove", (event) => {
  if (!slider.hasPointerCapture(event.pointerId)) return;
  const bounds = stage.getBoundingClientRect();
  setSplit(100 * (event.clientX - bounds.left) / bounds.width);
});
slider.addEventListener("keydown", (event) => {
  const values = {
    ArrowLeft: split - 1, ArrowDown: split - 1,
    ArrowRight: split + 1, ArrowUp: split + 1,
    PageDown: split - 10, PageUp: split + 10, Home: 0, End: 100,
  };
  if (!(event.key in values)) return;
  event.preventDefault();
  setSplit(values[event.key]);
});

// demonstrate the divider once when the feed first comes into view.
const motion = matchMedia("(prefers-reduced-motion: reduce)");
if (!motion.matches) {
  let hint;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < 0.5) return;
    observer.disconnect();
    hint = stage.animate(
      [50, 65, 42, 50].map(value => ({
        "--split": value + "%",
        easing: "ease-in-out",
      })),
      { duration: 1450, delay: 280 },
    );
  }, { threshold: 0.5 });

  function takeControl() {
    observer.disconnect();
    if (hint && hint.playState !== "finished") {
      const position = parseFloat(getComputedStyle(stage).getPropertyValue("--split"));
      hint.cancel();
      setSplit(position);
    }
    hint = null;
  }

  for (const event of ["pointerdown", "focusin", "wheel", "keydown"]) {
    stage.addEventListener(event, takeControl, { capture: true, passive: true, once: true });
  }
  motion.addEventListener("change", takeControl, { once: true });
  observer.observe(stage);
}
