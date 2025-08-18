/**
 * Sends the user's message to our secure backend,
 * which then communicates with the real Google Gemini AI.
 * @param {string} userMessage - The message from the user.
 * @returns {Promise<string>} The AI's response text.
 */
async function getAiResponse(userMessage) {
    
    // The URL of your local backend server. This MUST match the port you set in your `server.js` file.
    const BACKEND_API_URL = 'http://localhost:3000/ask-ai';

    // If there's no text, there's nothing to do.
    if (!userMessage) {
        return Promise.resolve("Please send a message.");
    }

    try {
        // Prepare the data payload to send to your backend.
        // The backend expects an object with a `message` property.
        const requestBody = {
            message: userMessage
        };

        // Use the `fetch` API to make a network request to your backend server.
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST', // We use POST because we are sending data in the body.
            headers: {
                'Content-Type': 'application/json' // Tell the server we are sending JSON data.
            },
            body: JSON.stringify(requestBody) // Convert our JavaScript object into a JSON string.
        });

        // If the server responds with an error (e.g., status 500), we handle it here.
        if (!response.ok) {
            const errorData = await response.json(); // Try to get the error message from the backend.
            console.error("Error from backend:", errorData.error);
            return `Sorry, an error occurred: ${errorData.error || 'Unknown server error'}`;
        }

        // If the request was successful, parse the JSON response from the backend.
        const aiData = await response.json();
        
        // Return the 'reply' text from the AI, which the backend forwards from Gemini.
        return aiData.reply;

    } catch (error) {
        // This 'catch' block handles network errors, like if the backend server isn't running.
        console.error("Failed to fetch AI response from the backend:", error);
        return "Sorry, I'm having trouble connecting to my brain right now. Is the backend server running?";
    }
}