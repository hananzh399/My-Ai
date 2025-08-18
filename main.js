// --- NEW: SPEECH SYNTHESIS SETUP ---
// This will handle the text-to-speech functionality.
const synth = window.speechSynthesis;
let currentUtterance = null;

// This variable will keep track of the last date displayed in the chat.
let lastDisplayedDate = null;

/**
 * Reads a given text aloud using the browser's speech synthesis API.
 * Manages the play/stop state and visual feedback on the button.
 * @param {string} text - The text to be spoken.
 * @param {HTMLElement} buttonElement - The button that was clicked.
 */
function speakText(text, buttonElement) {
    if (synth.speaking) {
        synth.cancel();
        if (currentUtterance && currentUtterance.text === text) {
            return;
        }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    utterance.onstart = () => {
        document.querySelectorAll('.speak-button.speaking').forEach(btn => btn.classList.remove('speaking'));
        buttonElement.classList.add('speaking');
    };

    utterance.onend = () => {
        buttonElement.classList.remove('speaking');
        currentUtterance = null;
    };
    
    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance error', event);
        buttonElement.classList.remove('speaking');
        currentUtterance = null;
    };

    synth.speak(utterance);
}

/**
 * Animates the text content of an element to simulate a typewriter effect.
 * --- UPDATED: Now accepts messageId to control the live timer. ---
 */
function animateText(element, text, messageId) {
    let index = 0;
    element.textContent = '';
    element.classList.add('typing');
    setStopButtonState();

    const chatBoxContainer = document.getElementById('chat-box-container');
    
    // --- NEW: Live Timer Logic ---
    const timerElement = document.getElementById(`timer-${messageId}`);
    const messageTimeElement = document.getElementById(`time-${messageId}`);
    if (timerElement) timerElement.style.display = 'inline'; // Show the timer
    if (messageTimeElement) messageTimeElement.style.display = 'none'; // Hide the final timestamp

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        if (timerElement) {
            timerElement.textContent = `Typing for ${(elapsedTime / 1000).toFixed(2)}s`;
        }
    }, 100); // Update the timer every 100ms

    const intervalId = setInterval(() => {
        if (stopAiResponse || index >= text.length) {
            clearInterval(intervalId);
            clearInterval(timerInterval); // --- NEW: Stop the live timer ---
            element.classList.remove('typing');
            
            // --- NEW: Transition from live timer to final timestamp ---
            if (timerElement) {
                const finalTime = Date.now() - startTime;
                timerElement.textContent = `Finished in ${(finalTime / 1000).toFixed(2)}s`;
                setTimeout(() => {
                    timerElement.style.display = 'none';
                    if (messageTimeElement) messageTimeElement.style.display = 'inline';
                }, 2000); // Wait 2 seconds before swapping to the final time
            }
            
            enableInput();
            return;
        }

        element.textContent += text[index];
        index++;
        chatBoxContainer.scrollTop = chatBoxContainer.scrollHeight;
    }, 15);
}

/**
 * Handles the click on the delete button.
 */
function handleDelete(messageId) {
    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        chatRef.child(messageId).remove()
            .catch(error => console.error("Error removing message: ", error));
    }
}

/**
 * --- UPDATED: Function now creates elements with unique IDs for the timers ---
 */
function addMessageToUI(text, sender, timestamp, messageId, shouldAnimate, responseTime = null) {
    const chatBox = document.getElementById('chat-box');
    const messageDate = new Date(timestamp);

    const dateString = messageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateString !== lastDisplayedDate) {
        const dateElement = document.createElement('div');
        dateElement.classList.add('date-separator');
        dateElement.textContent = dateString;
        chatBox.appendChild(dateElement);
        lastDisplayedDate = dateString;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.id = `message-${messageId}`;

    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.classList.add('bubble-wrapper');
    
    const textElement = document.createElement('div');
    textElement.classList.add('text');
    
    const copyButton = document.createElement('button');
    copyButton.classList.add('copy-button');
    copyButton.title = 'Copy message';
    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-5zm0 16H8V7h11v14z"/></svg>`;
    copyButton.addEventListener('click', (e) => { e.stopPropagation(); navigator.clipboard.writeText(text); });

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.title = 'Delete message';
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
    deleteButton.addEventListener('click', (e) => { e.stopPropagation(); handleDelete(messageId); });

    bubbleWrapper.appendChild(textElement);
    bubbleWrapper.appendChild(copyButton);

    if (sender === 'ai') {
        const speakButton = document.createElement('button');
        speakButton.classList.add('speak-button');
        speakButton.title = 'Read aloud';
        speakButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
        speakButton.addEventListener('click', (e) => { e.stopPropagation(); speakText(text, speakButton); });
        bubbleWrapper.appendChild(speakButton);
    }
    
    bubbleWrapper.appendChild(deleteButton);
    messageElement.appendChild(bubbleWrapper);

    // MOBILE FIX: Add click listener to the entire message to toggle controls
    messageElement.addEventListener('click', () => {
        // Find any other message that has its controls open and close it
        const currentlyOpen = document.querySelector('.chat-message.controls-visible');
        if (currentlyOpen && currentlyOpen !== messageElement) {
            currentlyOpen.classList.remove('controls-visible');
        }
        // Toggle controls for the clicked message
        messageElement.classList.toggle('controls-visible');
    });
    
    const metaContainer = document.createElement('div');
    metaContainer.classList.add('message-meta');

    if (sender === 'ai') {
        const liveTimerElement = document.createElement('span');
        liveTimerElement.classList.add('live-timer');
        liveTimerElement.id = `timer-${messageId}`;
        liveTimerElement.style.display = 'none';
        metaContainer.appendChild(liveTimerElement);
    }

    const timeString = messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const timeElement = document.createElement('div');
    timeElement.classList.add('message-time');
    timeElement.textContent = timeString;
    timeElement.id = `time-${messageId}`;
    metaContainer.appendChild(timeElement);
    
    messageElement.appendChild(metaContainer);

    chatBox.appendChild(messageElement);

    if (sender === 'ai' && shouldAnimate && text) {
        const textSpan = document.createElement('span');
        textElement.appendChild(textSpan);
        animateText(textSpan, text, messageId);
    } else if (text) {
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textElement.appendChild(textSpan);
    }

    const chatBoxContainer = document.getElementById('chat-box-container');
    chatBoxContainer.scrollTop = chatBoxContainer.scrollHeight;
}