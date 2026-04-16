/**
 * Fetches trivia questions from the Open Trivia Database.
 * Implements a 5-second cooldown and falls back to a local JSON file if the API fails.
 * @returns {Promise<Object>} A promise that resolves to the trivia question data.
 */
export async function fetchData() {
  try {
    // --- THE FIX: 5-Second Cooldown Enforcer ---
    const lastFetch = localStorage.getItem("lastFetchTime");
    const now = Date.now();

    // If we fetched less than 5000 milliseconds (5 seconds) ago...
    if (lastFetch && now - lastFetch < 5000) {
      const timeToWait = 5000 - (now - lastFetch);
      console.warn(
        `⏳ Rate limit protection! Waiting ${Math.round(timeToWait / 1000)}s before fetching...`,
      );

      // Pause the code execution until the 5 seconds are fully up
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }

    // Record the exact time we are making this new request
    localStorage.setItem("lastFetchTime", Date.now());
    // --------------------------------------------

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

    // Force the browser to grab fresh questions, no caching allowed
    const response = await fetch(apiUrl, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API fetch failed, loading fallback questions:", error);
    try {
      const fallback = await fetch("triviaAPI.json");
      const data = await fallback.json();

      // Scramble the fallback questions so they feel random
      if (data && data.results) {
        data.results.sort(() => Math.random() - 0.5);
      }
      return data;
    } catch (fallbackError) {
      console.error("Fallback failed too!", fallbackError);
      return null;
    }
  }
}
