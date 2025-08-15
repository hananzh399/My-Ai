// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBkOZaNMaKTlVj27_1xF4Tg66phJwklhL4",
  authDomain: "my-ai-98137.firebaseapp.com",
  projectId: "my-ai-98137",
  storageBucket: "my-ai-98137.firebasestorage.app",
  messagingSenderId: "867036346580",
  appId: "1:86036346580:web:e6312c9d83dfe752052341",
  databaseURL: "https://my-ai-98137-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// --- 2. INITIALIZE FIREBASE & GET REFERENCES ---
try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    console.error("Firebase initialization error.", e);
}

const database = firebase.database();
const chatRef = database.ref('chat');

const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const loadingSpinner = document.getElementById('loading-spinner');
let lastMessageKeyRendered = null;

// --- 3. STOP GENERATION & UI ICONS ---
let stopAiResponse = false;
const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>`;
const stopIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>`;

// --- 4. INPUT & BUTTON STATE MANAGEMENT ---
function disableInput() {
    userInput.disabled = true;
    sendButton.disabled = true;
    micButton.disabled = true;
}

function enableInput() {
    userInput.disabled = false;
    sendButton.disabled = false;
    micButton.disabled = false;
    setSendButtonState();
    userInput.focus();
}

function setSendButtonState() {
    sendButton.innerHTML = sendIconSVG;
    sendButton.title = "Send";
    sendButton.removeEventListener('click', stopGeneration);
    sendButton.addEventListener('click', sendMessage);
}

function setStopButtonState() {
    sendButton.innerHTML = stopIconSVG;
    sendButton.title = "Stop generating";
    sendButton.disabled = false;
    sendButton.removeEventListener('click', sendMessage);
    sendButton.addEventListener('click', stopGeneration);
}

function stopGeneration() {
    stopAiResponse = true;
}

// --- 5. SPEECH RECOGNITION SETUP ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    micButton.addEventListener('click', () => {
        recognition.start();
    });

    recognition.onstart = () => {
        micButton.classList.add('listening');
        micButton.title = "Listening...";
    };

    recognition.onend = () => {
        micButton.classList.remove('listening');
        micButton.title = "Send voice message";
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        userInput.value = transcript;

        if (event.results[0].isFinal) {
            sendMessage();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        micButton.classList.remove('listening');
        micButton.title = "Send voice message";
    };

} else {
    console.warn("Speech Recognition not supported in this browser.");
    micButton.style.display = 'none';
}

// --- 6. EVENT LISTENERS ---
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// --- 7. MESSAGE LOADING & REAL-TIME SYNC ---
function initializeChat() {
    loadingSpinner.style.display = 'block';
    const query = chatRef.limitToLast(50);
    query.once('value', (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = ''; 
        enableInput();
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                addMessageToUI(message.text, message.sender, message.timestamp, childSnapshot.key, false);
                lastMessageKeyRendered = childSnapshot.key;
            });
        }
        loadingSpinner.style.display = 'none';
        listenForNewMessages();
        listenForDeletions();
    });
}

function listenForNewMessages() {
    let query = chatRef.orderByKey();
    if (lastMessageKeyRendered) {
        query = query.startAfter(lastMessageKeyRendered);
    }
    query.on('child_added', (snapshot) => {
        const message = snapshot.val();
        addMessageToUI(message.text, message.sender, message.timestamp, snapshot.key, true);
    });
}

function listenForDeletions() {
    chatRef.on('child_removed', (snapshot) => {
        const messageId = snapshot.key;
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) messageElement.remove();
    });
}

initializeChat();

// --- 8. CORE FUNCTIONS ---
async function sendMessage() {
    const messageText = userInput.value.trim();
    if (messageText === '') return;
    
    userInput.value = '';
    disableInput();
    try {
        await saveMessageToDB(messageText, 'user');
        stopAiResponse = false;
        const lowerCaseMessage = messageText.toLowerCase();
        const cannedResponse = smallTalkResponses[lowerCaseMessage];
        if (cannedResponse) {
            await saveMessageToDB(cannedResponse, 'ai');
        } else {
            const aiResponse = await getAiResponse(messageText);
            if (!stopAiResponse) {
                await saveMessageToDB(aiResponse, 'ai');
            }
        }
    } catch (error) {
        console.error("Error during message sending process:", error);
        await saveMessageToDB("An error occurred. Please try again.", 'ai');
    }
}

function saveMessageToDB(text, sender) {
    return chatRef.push({
        text: text,
        sender: sender,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

setSendButtonState();