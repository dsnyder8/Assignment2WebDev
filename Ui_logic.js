/* =============================================================
   Helper Functions
   Small utilities used across multiple game states.
   ============================================================= */

// Removes the last heart icon from the lives display
export function removeHeart() {
  const hearts = document.querySelectorAll(".heart");
  if (hearts.length > 0) {
    hearts[hearts.length - 1].remove();
  }
}

// Updates a progress dot to show correct (green) or wrong (red)
export function markDot(index, correct) {
  let dots = document.querySelectorAll(".progress-dot");
  if (dots[index]) {
    dots[index].classList.add(correct ? "correct" : "wrong");
  }
}
