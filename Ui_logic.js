/* =============================================================
   Helper Functions
   Small utilities used across multiple game states.
   ============================================================= */

/**
 * Updates the lives display by removing a heart icon from the DOM.
 */
export function removeHeart() {
  const hearts = document.querySelectorAll(".heart");
  if (hearts.length > 0) {
    hearts[hearts.length - 1].remove();
  }
}

/**
 * Updates a specific progress bar dot to indicate a correct or incorrect answer.
 * @param {number} index - The index of the progress dot to update (e.g., the current question number).
 * @param {boolean} isCorrect - True if the answer was correct, false if it was wrong.
 */
export function markDot(index, correct) {
  let dots = document.querySelectorAll(".progress-dot");
  if (dots[index]) {
    dots[index].classList.add(correct ? "correct" : "wrong");
  }
}
