const comparison = document.querySelector("#comparison");
const painting = comparison.closest(".painting");

function updateComparison() {
  painting.style.setProperty("--split", comparison.value + "%");
  comparison.setAttribute("aria-valuetext", comparison.value + " percent in color");
}

comparison.addEventListener("input", updateComparison);
updateComparison();
