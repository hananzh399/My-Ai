// --- 1. DOM ELEMENTS ---
const statusDisplay = document.getElementById('status-display');
const micButton = document.getElementById('mic-button');
const userTranscript = document.getElementById('user-transcript');
const aiTranscript = document.getElementById('ai-transcript');

// --- 2. SPEECH & SYNTHESIS SETUP ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
const wakeWordRecognition = new SpeechRecognition(); // New recognizer for the wake word
const synth = window.speechSynthesis;

let conversationActive = false;

// --- 3. WAKE WORD RECOGNITION CONFIGURATION ---
wakeWordRecognition.continuous = true;
wakeWordRecognition.lang = 'en-US';
wakeWordRecognition.interimResults = false;

const startWakeWordListener = () => {
    try {
        // Only start if not already running
        if (!conversationActive) {
            wakeWordRecognition.start();
            console.log("Wake word listener started.");
        }
    } catch (e) {
        // This can happen if start() is called when it's already running.
        console.error("Wake word listener could not start.", e);
    }
};

wakeWordRecognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    if (transcript.includes("hi lark") && !conversationActive) {
        console.log("Wake word 'Hi Lark' detected!");
        micButton.click(); // Programmatically start the conversation
    }
};

// Start listening for the wake word when the page loads
window.onload = () => {
    startWakeWordListener();
};


// --- 4. MAIN SPEECH RECOGNITION CONFIGURATION ---
recognition.continuous = true; // Listen continuously for commands
recognition.lang = 'en-US';
recognition.interimResults = false;

// --- 5. CORE CONVERSATION LOGIC ---

/**
 * Stops the conversation cleanly and speaks a farewell message.
 */
function endConversation() {
    conversationActive = false;
    if (synth.speaking) {
        synth.cancel();
    }
    micButton.classList.remove('listening');
    document.body.classList.remove('ai-speaking');

    const utterance = new SpeechSynthesisUtterance("Bye");
    utterance.onstart = () => {
        statusDisplay.textContent = 'AI is speaking...';
        aiTranscript.textContent = `“Bye”`;
    };
    utterance.onend = () => {
        // This is the final state. Conversation is OFF.
        statusDisplay.textContent = 'Press the core to begin';
        console.log("Conversation ended. Restarting wake word listener.");
        startWakeWordListener(); // Go back to passively listening for "Hi Lark"
    };
    synth.speak(utterance);
}


/**
 * Starts the conversation flow by listening to the user.
 */
function startConversation() {
    if (synth.speaking) {
        synth.cancel();
    }
    userTranscript.textContent = '';
    aiTranscript.textContent = '';
    statusDisplay.textContent = 'Listening...';
    micButton.classList.add('listening');
    try {
        recognition.start();
    } catch (e) {
        console.error("Main recognition could not start", e);
    }
}

/**
 * Speaks the given text using the browser's TTS engine.
 * @param {string} text - The text for the AI to speak.
 */
function speak(text) {
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => {
            statusDisplay.textContent = 'AI is speaking...';
            micButton.classList.remove('listening');
            document.body.classList.add('ai-speaking');
        };
        // When the AI is done speaking, listen for the user again.
        utterance.onend = () => {
            document.body.classList.remove('ai-speaking');
            if (conversationActive) {
                // Automatically start listening for the next user input
                startConversation();
            }
        };
        aiTranscript.textContent = `“${text}”`;
        synth.speak(utterance);
    }
}

/**
 * Processes the user's spoken input and gets a response from the AI.
 * @param {string} transcript - The text transcribed from user's speech.
 */
async function processUserInput(transcript) {
    userTranscript.textContent = `You: “${transcript}”`;
    statusDisplay.textContent = 'AI is thinking...';
    micButton.classList.remove('listening');

    try {
        const aiResponse = await getAiResponse(transcript);
        speak(aiResponse);
    } catch (error) {
        console.error("Error getting AI response:", error);
        speak("I'm sorry, I encountered an error. Please try again.");
    }
}


// --- 6. EVENT LISTENERS ---

micButton.addEventListener('click', () => {
    if (conversationActive) {
        conversationActive = false;
        recognition.stop();
        synth.cancel();
        micButton.classList.remove('listening');
        document.body.classList.remove('ai-speaking');
        statusDisplay.textContent = 'Press the core to begin';
        startWakeWordListener();
    } else {
        wakeWordRecognition.stop();
        conversationActive = true;
        startConversation();
    }
});

recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log("Heard:", transcript);

    // Use .includes() for more robust command detection
    if (transcript.includes("bye")) {
        console.log("'Bye' command detected. Ending conversation.");
        recognition.stop();
        endConversation();
        return; // IMPORTANT: Stop further processing
    }

    if (transcript.includes("stop") && synth.speaking) {
        console.log("'Stop' command detected. Stopping speech.");
        synth.cancel(); // Stop the AI from speaking. The utterance.onend will fire and restart listening.
        return; // IMPORTANT: Don't process "stop" as a query
    }

    // If it's not a command, process it as regular input.
    recognition.stop(); // Temporarily stop listening to process this phrase.
    processUserInput(transcript);
};

recognition.onend = () => {
    // This is called when recognition stops naturally or via recognition.stop()
    micButton.classList.remove('listening');
};

recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (event.error !== 'no-speech') {
        statusDisplay.textContent = 'Sorry, I had trouble hearing. Try again.';
    }
    micButton.classList.remove('listening');
    if (conversationActive) {
        conversationActive = false;
        startWakeWordListener();
    }
};