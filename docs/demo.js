const slider = document.querySelector("#comparison");
const stage = slider.closest(".feed-stage");
const feed = document.querySelector("#feed");
const motion = document.querySelector("#motion");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
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

let playing = !reducedMotion.matches;
let visible = false;
let frame;
let startTime;
let startOffset;
let initialDelay = 1400;

function atEnd() {
  return feed.scrollTop >= feed.scrollHeight - feed.clientHeight - 1;
}

function tick(now) {
  if (now >= startTime) {
    feed.scrollTop = startOffset + (now - startTime) * 0.023;
    if (atEnd()) {
      playing = false;
      syncPlayback();
      return;
    }
  }
  frame = requestAnimationFrame(tick);
}

function syncPlayback() {
  cancelAnimationFrame(frame);
  motion.textContent = playing ? "Pause scroll" : atEnd() ? "Replay scroll" : "Play scroll";
  motion.classList.toggle("playing", playing);
  if (playing && visible && !document.hidden) {
    startOffset = feed.scrollTop;
    startTime = performance.now() + initialDelay;
    initialDelay = 0;
    frame = requestAnimationFrame(tick);
  }
}

function pause() {
  playing = false;
  syncPlayback();
}

motion.hidden = false;
motion.addEventListener("click", () => {
  if (!playing && atEnd()) feed.scrollTop = 0;
  playing = !playing;
  syncPlayback();
});
feed.addEventListener("wheel", pause, { passive: true });
feed.addEventListener("pointerdown", pause);
feed.addEventListener("focus", pause);
feed.addEventListener("scroll", () => {
  if (!playing) syncPlayback();
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) pause();
});
document.addEventListener("visibilitychange", syncPlayback);
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  syncPlayback();
}, { threshold: 0.2 }).observe(stage);
syncPlayback();
