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

// --- ANONYMOUS USER ID MANAGEMENT ---
function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('userSessionId');
    if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('userSessionId', sessionId);
    }
    return sessionId;
}

const userSessionId = getOrCreateSessionId();
const chatRef = database.ref('chats/' + userSessionId);

const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const micButton = document.getElementById('mic-button');
const loadingSpinner = document.getElementById('loading-spinner');
const chatBoxContainer = document.getElementById('chat-box-container');
let lastMessageKeyRendered = null;

// --- 3. STOP GENERATION & UI ICONS ---
let stopAiResponse = false;
const sendIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>`;
const stopIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2-2.25v-9z" /></svg>`;

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

function updateButtonVisibility() {
    const text = userInput.value.trim();
    if (text) {
        micButton.style.display = 'none';
        sendButton.style.display = 'flex';
    } else {
        micButton.style.display = 'flex';
        sendButton.style.display = 'none';
    }
}

// --- 5. SPEECH RECOGNITION SETUP ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    micButton.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            return;
        }
        try {
            recognition.start();
        } catch(e) {
            console.error("Speech recognition could not start.", e);
            alert("Could not start voice recognition. Please ensure you have granted microphone permissions in your browser.");
        }
    });

    recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('listening');
        micButton.title = "Stop listening";
    };

    recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('listening');
        micButton.title = "Send voice message";
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        userInput.value = transcript;
        updateButtonVisibility();

        if (event.results[0].isFinal) {
            sendMessage();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("Microphone access was denied. Please go into your browser's settings and allow this site to access your microphone.");
        } else if (event.error === 'network') {
            alert("A network error occurred during speech recognition. Please check your connection.");
        }
        isListening = false;
        micButton.classList.remove('listening');
        micButton.title = "Send voice message";
    };
} else {
    console.warn("Speech Recognition not supported in this browser.");
    micButton.disabled = true;
    micButton.title = "Voice input not supported on this browser";
}

// --- 6. EVENT LISTENERS ---
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', updateButtonVisibility);

let scrollTimeout;
chatBoxContainer.addEventListener('scroll', () => {
    document.body.classList.add('is-scrolling');
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
    }, 150);
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
                addMessageToUI(message.text, message.sender, message.timestamp, childSnapshot.key, false, message.responseTime);
                lastMessageKeyRendered = childSnapshot.key;
            });
        }
        loadingSpinner.style.display = 'none';
        listenForNewMessages();
        listenForDeletions();
    }, (error) => {
        console.error("Firebase read failed: " + error.code);
        loadingSpinner.style.display = 'none';
    });
}

function listenForNewMessages() {
    let query = chatRef.orderByKey();
    if (lastMessageKeyRendered) {
        query = query.startAfter(lastMessageKeyRendered);
    }
    query.on('child_added', (snapshot) => {
        const message = snapshot.val();
        addMessageToUI(message.text, message.sender, message.timestamp, snapshot.key, true, message.responseTime);
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
    
    disableInput();
    try {
        await saveMessageToDB(messageText, 'user');
        
        userInput.value = '';
        updateButtonVisibility();
        
        stopAiResponse = false;
        
        const startTime = Date.now();
        const aiResponse = await getAiResponse(messageText);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (!stopAiResponse) {
            await saveMessageToDB(aiResponse, 'ai', responseTime);
        }
    } catch (error) {
        console.error("Error during message sending process:", error);
    }
}

function saveMessageToDB(text, sender, responseTime = null) {
    const messageData = {
        text: text,
        sender: sender,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    if (responseTime !== null) {
        messageData.responseTime = responseTime;
    }

    return chatRef.push(messageData);
}

setSendButtonState();
updateButtonVisibility();