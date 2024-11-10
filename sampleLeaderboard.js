// Function to update the leaderboard after each problem
function updateLeaderboard(players, correctAnswer, problemNumber) {
    // Iterate through each player/team to update their score after the nth problem
    players.forEach(player => {
        // Extract current min and max for the nth problem
        let cMin = player.currentMin[problemNumber];
        let cMax = player.currentMax[problemNumber];

        // Check if the correct answer is within the provided interval
        if (cMin <= correctAnswer && correctAnswer <= cMax) {
            // Increment the number of correct problems
            player.correctProblemsCount += 1;

            // Add the ratio of max/min for the nth problem to the sum
            player.sumMaxMinRatios += (cMax / cMin);
        }

        // Calculate the current score using the formula:
        // Score = (10 + pS) * 2^(15 - cN)
        player.score = (10 + player.sumMaxMinRatios) * Math.pow(2, 15 - player.correctProblemsCount);
    });

    // Sort the leaderboard by score in ascending order (lowest score wins)
    players.sort((a, b) => a.score - b.score);

    // Display the updated leaderboard (IDs and scores)
    console.log("Updated Leaderboard:");
    players.forEach(player => {
        console.log(`Player ID: ${player.id}, Score: ${player.score}`);
    });
}

// Example structure for the players array (arbitrary input)
let players = [
    {
        id: "player1",
        correctProblemsCount: 0,  // Initial correct problems count
        sumMaxMinRatios: 0,       // Initial sum of max/min ratios
        currentMin: [4, 3, 2],    // Example minimums for each problem
        currentMax: [6, 5, 4],    // Example maximums for each problem
        score: 0                  // Initial score
    },
    {
        id: "player2",
        correctProblemsCount: 0,
        sumMaxMinRatios: 0,
        currentMin: [2, 1, 5],
        currentMax: [4, 3, 6],
        score: 0
    }
];

// Example of updating the leaderboard after a problem
let correctAnswer = 5;  // Example correct answer for the current problem
let problemNumber = 1;  // The index of the current problem (0-based index)

// Call the function to update the leaderboard
updateLeaderboard(players, correctAnswer, problemNumber);
