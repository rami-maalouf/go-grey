const slider = document.querySelector("#comparison");
const stage = slider.closest(".feed-stage");
// both copies share one grid cell and one native scroll position.
for (const layer of stage.querySelectorAll(".feed-bar, .post-stack")) {
  const gray = layer.cloneNode(true);
  gray.classList.add("grey-copy");
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
