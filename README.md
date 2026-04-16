Task 1) 

a) Describe your current architecture.
The current architecture has the entirety of our functionality basically in one file, script.js. It's not organized very well, and methods were just included in the same file as we were adding on to the project.

How many JavaScript files do you have? Only two JavaScript files.

What does each file do? One is a generic script (script.js) that we included in the Assignment 2 project that encapsulates the entirety of the project and the functionality and game states it controls. The other is the required JavaScript module from Assignment 2 (streak.js), which includes the streak functionality of answering multiple questions correctly in a row.

Where are responsibilities mixed together? Responsibilities are completely mixed together inside script.js. That exact same file is responsible for grabbing the trivia questions from the API, calculating the game logic, and manually updating the visual HTML elements all at the same time.

![Current Architecture Diagram](current.png)



b)
Module 1: apifetch.js
Responsibility: This module handles grabbing the trivia questions from the API and makes sure we follow the 5-second rule.
Refactor Purpose: Added a 5-second cooldown and a local JSON fallback so the game keeps working if the API times out or blocks us.

fetchData(): The main function that goes and gets the questions.

lastFetchTime: A variable stored in localStorage to keep track of the timing between requests.

Module 2: Ui_logic.js
Responsibility: This module manages the visual updates on the screen and handles the direct HTML changes.
Refactor Purpose: Moved the UI helper methods here so script.js isn't cluttered and each file has its own specific job.
Refactor Purpose: Combined the CSS logic for the progress dots into one function so I'm not writing the same code over and over.

removeHeart(): Updates the lives display by taking away the heart icons.

markDot(): Updates the progress bar dots based on if the answer was right or wrong.

Module 3: streak.js
Responsibility: This module handles the logic and the image for the bonus streak animation.

streakImage(): Injects or removes the streak GIF depending on how many questions were answered correctly in a row.

Kept: script.js
Responsibility: This is the main file that keeps track of the game state and tells the other modules when to run.
Refactor Purpose: Renamed functions and variables to be more descriptive so it's easier to read now that the code is split up.

score, lives, and questionIndex: The main variables that track the player's progress.

initQuiz(): The starting function that sets up the game and begins the countdown.

displayQuestionAndAnswers(): Shows the current question and handles the shuffled answer buttons

![Current Architecture Diagram](proposed.png)

Task2)
Refactored Module 1: apifetch.js

Purpose: This module isolates the data-fetching logic for Trivia Blast, specifically handling requests to the Open Trivia DB API and managing rate limits.

Changes Made:

Extracted the fetchData() logic entirely out of the monolithic script.js file.

Used ES6 export syntax to make fetchData available as a dependency to the main controller.

Implemented a 5-second cooldown and a local JSON fallback. This guarantees functional equivalence by ensuring the game continues to load questions and the user experience remains unchanged even if the external API times out or blocks the IP.

Refactored Module 2: Ui_logic.js

Purpose: This module handles direct DOM manipulation and visual updates for the game's dashboard, keeping UI concerns separate from core game state logic.

Changes Made:

Extracted the removeHeart() and markDot() functions from script.js and moved the logic into this dedicated file.

Used proper ES6 export syntax on these functions and brought them into script.js using import statements.

Consolidated repetitive CSS styling for the progress dots into the single markDot() function. This extracted and simplified the logic while ensuring all visual features remained functionally identical and no features were broken during the move.

Task 3) 
Switching our Trivia project to a modular design really showed me how messy my script.js file actually was. I didn't fully realize it until I started trying to pull the logic apart and move different functionalities into their own files. Refactoring taught me that when you keep everything in one place, it’s a lot harder to change one part of the game without worrying about breaking something else. Now that the code is split up into separate modules, the project feels way more organized, and it is much easier to find exactly where certain functions live instead of scrolling through one massive file.

The biggest challenge I faced, and am still dealing with, is the API fetch. Ever since I moved the fetching code into its own module, the game hasn't been grabbing new randomized questions correctly every time I hit play. Instead, it keeps using the same ten questions from the local JSON file as a default. I'm still trying to figure out if this is happening because of the transition to a module or if it’s just the 5-second rate limit on the API blocking my requests during testing. To handle it for now, I addressed it by allowing the default set of questions to load so the user doesn't see a crash, but this only really works for a single playthrough.

If I had more time, the next thing I would refactor is the DisplayQuestionAndAnswers() function. This function controls most of the game states and core functionality, but it is still sitting in the main script. I didn't refactor it yet because I was stuck on whether it belonged in the Ui_logic.js file or if it was big enough to be in its own separate JavaScript file entirely.
