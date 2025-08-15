// This variable will keep track of the last date displayed in the chat.
let lastDisplayedDate = null;

/**
 * Animates the text content of an element to simulate a typewriter effect.
 * @param {HTMLElement} element - The HTML element where the text will be typed.
 * @param {string} text - The full string of text to animate.
 */
function animateText(element, text) {
    let index = 0;
    element.textContent = '';
    element.classList.add('typing');
    setStopButtonState(); // Change send button to a stop button

    const chatBoxContainer = document.getElementById('chat-box-container');

    const intervalId = setInterval(() => {
        // --- Stop condition check ---
        if (stopAiResponse || index >= text.length) {
            clearInterval(intervalId);
            element.classList.remove('typing');
            enableInput(); // Re-enable input and reset button state
            return;
        }

        element.textContent += text[index];
        index++;
        chatBoxContainer.scrollTop = chatBoxContainer.scrollHeight;
    }, 15);
}

/**
 * Handles the click on the delete button.
 * @param {string} messageId - The unique ID of the message.
 */
function handleDelete(messageId) {
    if (confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        const messageRef = firebase.database().ref('chat/' + messageId);
        messageRef.remove().catch(error => console.error("Error removing message: ", error));
    }
}

/**
 * Adds a message to the chatbox UI, including all elements and event listeners.
 * @param {string} text - The content of the message.
 * @param {string} sender - The sender ('user' or 'ai').
 * @param {number} timestamp - The timestamp of the message from Firebase.
 * @param {string} messageId - The unique key of the message from Firebase.
 * @param {boolean} shouldAnimate - If true, the message will be typed out.
 */
function addMessageToUI(text, sender, timestamp, messageId, shouldAnimate) {
    const chatBox = document.getElementById('chat-box');
    const messageDate = new Date(timestamp);

    // --- DATE SEPARATOR LOGIC ---
    const dateString = messageDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateString !== lastDisplayedDate) {
        const dateElement = document.createElement('div');
        dateElement.classList.add('date-separator');
        dateElement.textContent = dateString;
        chatBox.appendChild(dateElement);
        lastDisplayedDate = dateString;
    }

    // --- MESSAGE CREATION ---
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.id = `message-${messageId}`;

    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.classList.add('bubble-wrapper');

    const textElement = document.createElement('div');
    textElement.classList.add('text');
    
    // --- ACTION BUTTONS ---
    const copyButton = document.createElement('button');
    copyButton.classList.add('copy-button');
    copyButton.title = 'Copy message';
    copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-5zm0 16H8V7h11v14z"/></svg>`;
    copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
    });

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.title = 'Delete message';
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
    deleteButton.addEventListener('click', (e) => { e.stopPropagation(); handleDelete(messageId); });

    bubbleWrapper.appendChild(textElement);
    bubbleWrapper.appendChild(copyButton);
    bubbleWrapper.appendChild(deleteButton);

    messageElement.appendChild(bubbleWrapper);

    // --- TIMESTAMP LOGIC ---
    const timeString = messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const timeElement = document.createElement('div');
    timeElement.classList.add('message-time');
    timeElement.textContent = timeString;
    messageElement.appendChild(timeElement);

    chatBox.appendChild(messageElement);

    // --- ANIMATION OR INSTANT TEXT ---
    if (sender === 'ai' && shouldAnimate) {
        animateText(textElement, text);
    } else {
        textElement.textContent = text;
    }

    const chatBoxContainer = document.getElementById('chat-box-container');
    chatBoxContainer.scrollTop = chatBoxContainer.scrollHeight;
}