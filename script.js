/* =============================================================
   Global State
   Tracks the current game session: score, lives, question progress,
   and answer streak for the bonus multiplier.
   Imports from streak.js (modules)
   ============================================================= */
import { streakImage } from "./streak.js";
import { fetchData } from "./apifetch.js";
import { removeHeart, markDot } from "./Ui_logic.js";

let score = 0;
let lives = 3;
let questionIndex = 0;
let questions = [];
let buttonClicks = 0;
let timerInterval;
let streak = 0;
let questionsAnswered = 0;

// Audio feedback for correct/wrong answers and game over
let correct_answer_noise = new Audio("Sounds/correctanswer.wav");
let wrong_answer_noise = new Audio("Sounds/wronganswer.mp3");
let game_over_noise = new Audio("Sounds/gameover.wav");

/* =============================================================
   Keyboard Controls
   Allows players to select answers using number keys 1-4.
   The event listener checks if the game is active (buttons enabled)
   before triggering a click on the corresponding answer button.
   ============================================================= */
document.addEventListener("keydown", (e) => {
  // Number keys 1-4 select answer buttons during gameplay
  const key = parseInt(e.key);
  if (key >= 1 && key <= 4) {
    const buttons = document.querySelectorAll(".answer-btn");
    if (buttons[key - 1] && !buttons[key - 1].disabled) {
      buttons[key - 1].click();
    }
  }

  // Got rid of space bar start on home screen when not hovering
  // Space bar triggers Play or Play Again buttons
  if (e.key === " " || e.code === "Space") {
    //e.preventDefault();
    //const playBtn = document.getElementById("btn1");
    const restartBtn = document.getElementById("restart-btn");
    //if (playBtn && playBtn.offsetParent !== null) {
    //playBtn.click();
    //}
    // else
    if (restartBtn && restartBtn.offsetParent !== null) {
      restartBtn.click();
    }
  }
});

//RemovedHEART method deleted from here.

//removed MarkedDot method deleted from here.Moved to Ui_logic.js

// Advances to the next question, or ends the game if all questions answered
function nextQuestion() {
  questionIndex++;
  if (questionIndex >= questions.length) {
    gameOver();
    return;
  }
  displayQuestionAndAnswers();
}

/* =============================================================
   initQuiz()
   Entry point when the player clicks PLAY. Handles:
   1. Setting lives based on difficulty selection
   2. Animating the logo from the home screen into the top bar
   3. Running a 3-2-1 countdown before the first question
   4. Fetching questions from the API (started early, awaited later)
   ============================================================= */

async function initQuiz() {
  // Start the API fetch immediately so data loads during the countdown
  const dataPromise = fetchData();

  // Set lives based on selected difficulty
  const difficulty = document.getElementById("difficulty-select").value;
  if (difficulty === "easy") {
    lives = 5;
  } else if (difficulty === "hard") {
    lives = 3;
  } else {
    lives = 4;
  }

  // Dynamically generate heart icons to match the number of lives
  const livesContainer = document.getElementById("lives-container");
  livesContainer.innerHTML = '<span class="sr-only">Lives remaining:</span> ';
  for (let i = 0; i < lives; i++) {
    const heart = document.createElement("img");
    heart.className = "heart";
    heart.src = "Images/heart.png";
    heart.alt = "Life";
    livesContainer.appendChild(heart);
  }

  /* --- Logo animation: moves the home screen logo into the top bar --- */
  const logo = document.querySelector(".title");
  const logoRect = logo.getBoundingClientRect();

  document.body.appendChild(logo);

  logo.style.position = "fixed";
  logo.style.left = logoRect.left + "px";
  logo.style.top = logoRect.top + "px";
  logo.style.width = logoRect.width + "px";
  logo.style.height = logoRect.height + "px";
  logo.style.zIndex = "100";

  document.getElementById("welcome-screen").style.display = "none";
  document.querySelector("header").style.display = "none";
  document.querySelector(".overall_page").style.padding = "0";
  document.querySelector(".overall_page").style.border = "none";
  document.querySelector(".overall_page").style.margin = "0";
  document.querySelector(".question-banner").style.display = "none";
  document.querySelector(".answers").style.display = "none";
  document.getElementById("game-container").style.display = "flex";

  const topBarLogo = document.querySelector(".top-bar-logo");
  const targetRect = topBarLogo.getBoundingClientRect();

  logo.offsetHeight;
  logo.classList.add("title-animating");
  logo.style.left = targetRect.left + "px";
  logo.style.top = targetRect.top + "px";
  logo.style.width = targetRect.width + "px";
  logo.style.height = targetRect.height + "px";

  /* --- Countdown: 3, 2, 1 before the first question --- */
  const overlay = document.createElement("div");
  overlay.id = "countdown-overlay";
  document.getElementById("game-container").appendChild(overlay);

  for (let i = 3; i >= 1; i--) {
    overlay.textContent = i;
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Swap: reveal the real top bar logo and clean up the animated one
  topBarLogo.style.visibility = "";
  logo.remove();
  overlay.remove();
  document.querySelector(".question-banner").style.display = "";
  document.querySelector(".answers").style.display = "";

  // Await the API data that was fetched during the countdown
  const data = await dataPromise;

  if (!data || !data.results) {
    alert(
      "Trivia database is busy right now! Please wait 5 seconds and try again.",
    );
    location.reload();
    return;
  }

  questions = data.results;
  displayQuestionAndAnswers();
}

/* =============================================================
   displayQuestionAndAnswers()
   Renders the current question and shuffled answer buttons.
   Sets up click handlers for each button that check correctness,
   update score/lives, show feedback colors, and advance after 2s.
   Also handles the streak multiplier: consecutive correct answers
   increase the score bonus (10 * streak).
   ============================================================= */
function displayQuestionAndAnswers() {
  clearInterval(timerInterval);

  var current_question = questions[questionIndex];

  // Combine incorrect and correct answers, then shuffle randomly
  var current_answers = [
    current_question.incorrect_answers,
    current_question.correct_answer,
  ];
  current_answers = current_answers.flat(Infinity);
  current_answers.sort(() => Math.random() - 0.5);

  let question = document.querySelector(".question-banner h2");
  let answerButtons = document.querySelectorAll(".answer-btn");

  startTimer();
  question.innerHTML = current_question.question;

  // Assign each shuffled answer to a button and set up click handlers
  answerButtons.forEach((btn, index) => {
    var answerText = current_answers[index];
    btn.innerHTML = `${answerText}<span class="key-hint">${index + 1}</span>`;
    btn.onclick = () => {
      if (current_answers[index] === current_question.correct_answer) {
        // Correct answer: play sound, highlight green, add streak bonus
        correct_answer_noise.play();
        clearInterval(timerInterval);
        btn.style.backgroundColor = "green";
        streak++;
        score += 10 * streak;
        //Display the streak gif if a streak occured
        streakImage(streak);
        questionsAnswered += 1;
        document.querySelectorAll(".answer-btn").forEach((button) => {
          button.disabled = true;
        });
        document.getElementById("score").textContent = score;
        markDot(questionIndex, true);

        // Wait 2 seconds to show feedback, then advance
        setTimeout(() => {
          document.querySelectorAll(".answer-btn").forEach((button) => {
            button.style.backgroundColor = "";
            button.disabled = false;
          });
          clearInterval(timerInterval);
          nextQuestion();
        }, 2000);
      } else {
        // Wrong answer: highlight red, show correct answer in green
        document.querySelectorAll(".answer-btn").forEach((button) => {
          button.disabled = true;
        });
        wrong_answer_noise.play();
        streak = 0;
        //Remove the streak gif if question answered wrong
        streakImage(streak);
        clearInterval(timerInterval);
        btn.style.backgroundColor = "red";

        // Reveal the correct answer by highlighting it in green
        answerButtons.forEach((button, i) => {
          if (current_answers[i] === current_question.correct_answer) {
            button.style.backgroundColor = "green";
          }
        });

        lives--;
        removeHeart();
        markDot(questionIndex, false);

        // If no lives left, end the game after showing feedback
        if (lives <= 0) {
          btn.disabled = true;
          lives = 0;
          setTimeout(() => {
            gameOver();
          }, 2000);
          return;
        }

        // Wait 2 seconds to show feedback, then advance
        setTimeout(() => {
          document.querySelectorAll(".answer-btn").forEach((button) => {
            button.style.backgroundColor = "";
            button.disabled = false;
          });
          clearInterval(timerInterval);
          nextQuestion();
        }, 2000);
      }
    };
  });
}

/* =============================================================
   gameOver()
   Transitions to the end screen. Shows win or loss message based
   on remaining lives. Updates high score in localStorage if the
   current score is a new record.
   ============================================================= */
function gameOver() {
  let answerButtons = document.querySelectorAll(".answer-btn");
  answerButtons.forEach((btn) => {
    btn.disabled = true;
  });

  // Hide game and welcome screens, show game over screen
  document.getElementById("welcome-screen").style.display = "none";
  document.querySelector("header").style.display = "none";
  document.getElementById("game-over-container").style.display = "flex";
  document.getElementById("game-container").style.display = "none";

  // Display win or loss heading based on remaining lives
  if (lives > 0) {
    document.getElementById("game-over-heading").textContent = "You Win!";
    document.getElementById("game-over-heading").style.color = "green";
  } else {
    document.getElementById("game-over-heading").textContent = "Game Over!";
    document.getElementById("game-over-heading").style.color = "red";
  }

  // Check and update high score using localStorage for persistence
  let highScore = localStorage.getItem("highScore") || 0;

  document.getElementById("final-score").textContent = `Score: ${score}`;
  document.getElementById("questions-correct").textContent =
    `Correct Answers: ${questionsAnswered}`;

  if (score > highScore) {
    localStorage.setItem("highScore", score);
    highScore = score;
    document.getElementById("high-score").textContent =
      `Best Score: ${highScore} - New Record!`;
  } else {
    document.getElementById("high-score").textContent =
      `Best Score: ${highScore}`;
  }
}

/* =============================================================
   startTimer()
   Runs a 15-second countdown for each question. Updates the
   display every second. When 5 seconds remain, adds a flashing
   red warning animation. At 0 seconds, deducts a life and
   either ends the game or advances to the next question.
   ============================================================= */
function startTimer() {
  let timerElement = document.getElementById("timer");
  let timeRemaining = 15;
  let timerContainer = document.getElementById("timer-container");
  timerContainer.classList.remove("timer-warning");
  timerElement.textContent = timeRemaining;

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerElement.textContent = timeRemaining;

    // Flash red warning when time is running low
    if (timeRemaining <= 5) {
      timerContainer.classList.add("timer-warning");
    }

    // Time's up: penalize the player and move on
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      markDot(questionIndex, false);
      lives--;
      removeHeart();
      if (lives === 0) {
        setTimeout(() => {
          gameOver();
        }, 2000);
        return;
      }
      nextQuestion();
    }
  }, 1000);
}

//Since script.js is a module this is needed to be able to click the button
window.initQuiz = initQuiz;
