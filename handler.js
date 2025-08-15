// --- AI CONFIGURATION AND DATA ---

// NOTE: We no longer need an API key or a URL.

// Pre-defined replies for common, simple phrases
const smallTalkResponses = {
    'hi': 'Hello! How can I help you with our printers today?',
    'hello': 'Hi there! What can I tell you about the Chroma 200 or Mono-Pro?',
    'how are you': "I'm just a bot, but I'm ready to help! Do you have a question about our printers?",
    'how are you?': "I'm just a bot, but I'm ready to help! Do you have a question about our printers?",
    'bye': 'Goodbye! Feel free to ask if you have more questions.',
    'goodbye': 'Goodbye! Have a great day.',
    'thanks': 'You\'re welcome! Let me know if there\'s anything else I can help with.',
    'thank you': 'You\'re very welcome! Is there anything else you need assistance with?'
};

// We can still use this context for our rule-based answers.
const AI_CONTEXT = {
    chroma200: {
        name: "Chroma 200",
        type: "Color Inkjet Printer",
        features: "Wireless printing, 20 pages per minute, and photo quality.",
        price: "$150",
        bestFor: "Home users and photographers."
    },
    monoPro: {
        name: "Mono-Pro",
        type: "Black and White Laser Printer",
        features: "High-speed (40 pages per minute), is network-ready, and has duplex (two-sided) printing.",
        price: "$250",
        bestFor: "Small businesses and offices with high-volume printing needs."
    }
};

/**
 * Simulates an AI response based on keywords in the user's message.
 * This function works in any browser and requires no API key.
 * @param {string} userMessage - The message from the user.
 * @returns {Promise<string>} The AI's response text.
 */
function getAiResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();

    // --- RULE-BASED LOGIC ---

    // Rule for a long paragraph
    if (lowerCaseMessage.includes('paragraph')) {
        let response = "Of course, here is a paragraph for you. The advent of digital technology has irrevocably transformed the landscape of communication, fostering an era of unprecedented connectivity and information exchange. In this globally networked society, geographical barriers have dissolved, allowing for instantaneous interaction across continents. This digital revolution has not only reshaped personal relationships but has also fundamentally altered the dynamics of business, education, and politics. Information, once a scarce commodity, is now abundantly available, empowering individuals with knowledge at their fingertips. However, this constant influx of data presents its own set of challenges, including the rise of misinformation and the need for critical digital literacy skills. As we continue to navigate this intricate digital world, it becomes increasingly crucial to balance the benefits of technological advancement with the ethical considerations necessary to ensure a healthy, informed, and equitable global community for generations to come.";
        return Promise.resolve(response);
    }

    // Rule for Chroma 200
    if (lowerCaseMessage.includes('chroma') || lowerCaseMessage.includes('color') || lowerCaseMessage.includes('photo')) {
        const printer = AI_CONTEXT.chroma200;
        let response = `The ${printer.name} is a ${printer.type}. It features ${printer.features}. It costs ${printer.price} and is best for ${printer.bestFor}`;
        return Promise.resolve(response);
    }
    
    // Rule for Mono-Pro
    if (lowerCaseMessage.includes('mono-pro') || lowerCaseMessage.includes('business') || lowerCaseMessage.includes('office') || lowerCaseMessage.includes('laser')) {
        const printer = AI_CONTEXT.monoPro;
        let response = `The ${printer.name} is our ${printer.type}. It has features like ${printer.features}. The price is ${printer.price}, and it's perfect for ${printer.bestFor}`;
        return Promise.resolve(response);
    }

    // Rule for Price
    if (lowerCaseMessage.includes('price') || lowerCaseMessage.includes('cost') || lowerCaseMessage.includes('how much')) {
        const chroma = AI_CONTEXT.chroma200;
        const mono = AI_CONTEXT.monoPro;
        let response = `We have two models! The ${chroma.name} for home use is ${chroma.price}, and the high-volume ${mono.name} for offices is ${mono.price}.`;
        return Promise.resolve(response);
    }

    // Rule for Speed
    if (lowerCaseMessage.includes('speed') || lowerCaseMessage.includes('fast') || lowerCaseMessage.includes('pages per minute')) {
        let response = "The Chroma 200 prints at 20 pages per minute, while the high-speed Mono-Pro prints at 40 pages per minute.";
        return Promise.resolve(response);
    }

    // Default Fallback Rule
    // This is returned if no other keywords are matched.
    const defaultResponse = "I can help with questions about the price, features, or differences between our Chroma 200 and Mono-Pro printers. What would you like to know?";
    return Promise.resolve(defaultResponse);
}