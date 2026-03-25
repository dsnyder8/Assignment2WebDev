let score = 0;
let lives = 3;
let questionIndex = 0;
let questions = [];
let buttonClicks = 0;
let startTime = Date.now();
let timerInterval;
let correct_answer_noise = new Audio("Sounds/correctanswer.wav");
let wrong_answer_noise = new Audio("Sounds/wronganswer.mp3");
let game_over_noise = new Audio("Sounds/gameover.wav");
let streak = 0;
let questionsAnswered = 0;


function removeHeart() {
  const hearts = document.querySelectorAll(".heart");
  if (hearts.length > 0) {
    hearts[hearts.length - 1].remove();
  }
}

function markDot(index, correct) {
  let dots = document.querySelectorAll(".progress-dot");
  if (dots[index]) {
    dots[index].classList.add(correct ? "correct" : "wrong");
  }
}

function nextQuestion() {
  questionIndex++;
  if (questionIndex >= questions.length) {
    gameOver();
    return;
  }
  displayQuestionAndAnswers();
}

/*Initialize the quiz, fetch the questions and answer from the api and call displayQuestionAndAnswers */
async function initQuiz() {
  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("game-container").style.display = "block";

  const difficulty = document.getElementById("difficulty-select").value;
  if (difficulty === "easy") {
    lives = 5;
  } else if (difficulty === "hard") {
    lives = 3;
  } else {
    lives = 4;
  }

  const livesContainer = document.getElementById("lives-container");
  livesContainer.innerHTML = 'Lives: ';
  for (let i = 0; i < lives; i++) {
    const heart = document.createElement("img");
    heart.className = "heart";
    heart.src = "Images/heart.png";
    livesContainer.appendChild(heart);
  }

  const data = await fetchData();
  questions = data.results;
  displayQuestionAndAnswers();
  
}

async function fetchData() {
  try {
    const categorySelect = document.getElementById("category-select");
    const categoryID = categorySelect.value;
    
    let apiUrl = `https://opentdb.com/api.php?amount=10&type=multiple`;
    if (categoryID) {
      apiUrl += `&category=${categoryID}`;
    }
    const difficultySelect = document.getElementById("difficulty-select").value;
    if (difficultySelect) {
      apiUrl += `&difficulty=${difficultySelect}`;
    }
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

function displayQuestionAndAnswers() {
  console.log(questions);
  //clear any existing timer intervals to prevent multiple timers from running at the same time
  clearInterval(timerInterval);

  var current_question = questions[questionIndex];
  var current_answers = [
    current_question.incorrect_answers,
    current_question.correct_answer,
  ];
  current_answers = current_answers.flat(Infinity);
  current_answers.sort(() => Math.random() - 0.5);

  let question = document.querySelector(".question h2");
  let answerButtons = document.querySelectorAll(".answer-btn");

  //start the timer for the question
  startTimer();
  question.innerHTML = current_question.question;

  //loop through each answer button and add the text for the current questions answer and add an event for eve
  answerButtons.forEach((btn, index) => {
    var answerText = current_answers[index];
    btn.innerHTML = answerText;
    //on click if the answer is correct change the background color to green and turn off the buttons
    btn.onclick = () => {
      if (current_answers[index] === current_question.correct_answer) {
        correct_answer_noise.play();
        clearInterval(timerInterval);
        btn.style.backgroundColor = "green";
        streak++;
        score += 10 * streak;
        questionsAnswered += 1;
        document.querySelectorAll(".answer-btn").forEach((button) => {
          button.disabled = true;
        });
        document.getElementById("score").textContent = score;
        markDot(questionIndex, true);
        //we want to reset the button colors after 2 seconds and then go to the next question
        setTimeout(() => {
          document.querySelectorAll(".answer-btn").forEach((button) => {
            button.style.backgroundColor = "";
            button.disabled = false;
          });
          clearInterval(timerInterval);
          nextQuestion();
        }, 2000);
      } else {
        //if the answer they select is wrong change the background color to red and turn off the buttons and take away a life
        document.querySelectorAll(".answer-btn").forEach((button) => {
          button.disabled = true;
        });
        wrong_answer_noise.play();
        streak = 0;
        clearInterval(timerInterval);
        btn.style.backgroundColor = "red";

        //if the user clicks the wrong answer display the correct answer in green
        answerButtons.forEach((button) => {
          if (button.innerHTML === current_question.correct_answer) {
            button.style.backgroundColor = "green";
          }
        });
        
        lives--;
        removeHeart();
        markDot(questionIndex, false);
         if (lives <= 0) {
          btn.disabled = true;
          //stop the lives counter at 0;
          lives = 0;
           gameOver();
           return;
          }


        //wait 2 seconds go to the next question reset the button colors and then go to the next question
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

/*code implementing the end of the game and resetting the game when the player runs out of lives
      does not let user hit the buttons after the game is over */
function gameOver() {
  let answerButtons = document.querySelectorAll(".answer-btn");
  answerButtons.forEach((btn) => {
    btn.disabled = true;
  });
        document.getElementById("game-over-container").style.display = "block";
        document.getElementById("game-container").style.display = "none";

    if (lives > 0) {
      document.getElementById("game-over-heading").textContent = "Congratulations, You Win!";
      document.getElementById("game-over-heading").style.color = "green";
    } else {
      document.getElementById("game-over-heading").textContent = "Game Over and Nice Try!";
    }

    let highScore = localStorage.getItem("highScore") || 0;


    //if the score is higher than the previous high score set the new highscore in local storage and update the high score variable
    if (score > highScore) {
      localStorage.setItem("highScore", score);
      highScore = score;
      document.getElementById("final-score").textContent = `Final Score: ${score}`;
    document.getElementById("questions-correct").textContent = `Questions Correct: ${questionsAnswered}`;
    document.getElementById("high-score").textContent = `High Score: ${highScore}` + " New High Score!";
    }else{
      document.getElementById("final-score").textContent = `Final Score: ${score}`;
    document.getElementById("questions-correct").textContent = `Questions Correct: ${questionsAnswered}`;
    document.getElementById("high-score").textContent = `Highest Score: ${highScore}`;
    }
    
}

/*Start the timer for each question at 15 seconds update time remaining dynamically
      If the user does not answer when time reaches 0 then decrement a life
      counter and go to the next question. If lives = 0  when the timer ends and decrements lives display the endGame screen */
function startTimer() {
  let startTime = Date.now();
  let timerElement = document.getElementById("timer");
  let timeRemaining = 15;
  timerElement.textContent = timeRemaining;
  timerInterval = setInterval(() => {
    timeRemaining--;
    timerElement.textContent = timeRemaining;
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      markDot(questionIndex, false);
      lives--;
      removeHeart();
      if (lives === 0) {
        gameOver();
        return;
      }
      nextQuestion();
    }
  }, 1000);
}