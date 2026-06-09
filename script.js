// =============================
// AI Study Assistant (ALE)
// =============================

const API_KEY = prompt("Apni OpenRouter API Key yahan daalein:");
const MODEL = "openrouter/free";

const copyBtn = document.getElementById("copyBtn");
const askBtn = document.getElementById("askBtn");
const clearBtn = document.getElementById("clearBtn");
const question = document.getElementById("question");
const answerLog = document.getElementById("answer");
const placeholder = document.getElementById("placeholder");
const loading = document.getElementById("loading");

// Menu Elements
const menuBtn = document.getElementById("menuBtn");
const settingsPanel = document.getElementById("settingsPanel");
const darkTheme = document.getElementById("darkTheme");
const lightTheme = document.getElementById("lightTheme");

let lastResponseText = ""; 
let currentUtterance = null; // Audio tracking instance

askBtn.addEventListener("click", askAI);
question.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        askAI();
    }
});

clearBtn.addEventListener("click", () => {
    window.speechSynthesis.cancel();
    question.value = "";
    answerLog.innerHTML = `
        <div class="placeholder-message" id="placeholder">
            <div class="bot-img-wrapper large-avatar">
                <img src="https://cdn-icons-png.flaticon.com/512/4140/4140047.png" alt="ALE Avatar" class="bot-custom-img">
            </div>
            <p>Hi! Main aapki AI Assistant ALE hu. Mujhse kuch bhi puchiye! 😊</p>
        </div>
    `;
    lastResponseText = "";
    settingsPanel.classList.remove("active");
});

async function askAI() {
    const userQuestion = question.value.trim();
    if (!userQuestion) {
        alert("Please enter your question.");
        return;
    }

    if (placeholder) {
        placeholder.style.display = "none";
    }

    // User message bubble add karte hi instantly list me display hoga
    const userRow = document.createElement("div");
    userRow.className = "chat-row user-row";
    userRow.innerHTML = `<div class="user-message-bubble">${userQuestion}</div>`;
    answerLog.appendChild(userRow);

    // Textarea instant empty taaki chat history upar shift ho jaye safely
    question.value = "";
    autoScroll();

    loading.style.display = "flex";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        // Tone strict matching rule for Hinglish/Natural Mixed behavior
                        content: "Mera naam ALE hai. Main ek ultra-smart female AI Study Assistant hu. Mujhe humesha user ke mixed behavior (Hinglish/Hindi typed in Roman letters) me hi reply karna hai. Mujhe pure Hindi script me nahi likhna, balki Roman letters (jaise: 'Haan dear, main samjha sakti hu', 'Yeh bohot simple hai') me chat karni hai. Mujhe user ke query ke subject ko khud analyze karke samajhna hai bina unke bataye. Mera tone humesha intelligent, helpful aur female assistant jaisa hona chahiye."
                    },
                    {
                        role: "user",
                        content: userQuestion
                    }
                ]
            })
        });

        const data = await response.json();
        loading.style.display = "none";

        if (!response.ok) {
            appendAIResponse("Error: Data fetch karne me koi dikkat aayi hai.");
            return;
        }

        if (data.choices && data.choices.length > 0) {
            const aiText = data.choices[0].message.content;
            lastResponseText = aiText; 
            appendAIResponse(aiText);
        } else {
            appendAIResponse("Sorry, mujhe iska koi response nahi mila.");
        }
    } catch (error) {
        loading.style.display = "none";
        appendAIResponse(`Error: ${error.message}`);
    }
}

function appendAIResponse(fullText) {
    const aiRow = document.createElement("div");
    aiRow.className = "chat-row ai-row";

    aiRow.innerHTML = `
        <div class="bot-img-wrapper">
            <img src="Ale.jpg" alt="ALE Avatar" class="bot-custom-img">
        </div>
        <div class="ai-message-container">
            <div class="ai-message-bubble">
                <div class="message-content"></div>
            </div>
            <div class="audio-action-area">
                <button class="speak-btn"><i class="fa-solid fa-volume-high"></i> Listen</button>
            </div>
        </div>
    `;
    
    answerLog.appendChild(aiRow);
    const contentTarget = aiRow.querySelector(".message-content");
    const speakBtn = aiRow.querySelector(".speak-btn");

    let index = 0;
    let partialText = "";
    
    const interval = setInterval(() => {
        if (index < fullText.length) {
            partialText += fullText.charAt(index);
            contentTarget.innerHTML = marked.parse(partialText);
            index++;
            autoScroll(); // Isse text likhte-likhte upar automatically shift hota rahega
        } else {
            clearInterval(interval);
        }
    }, 12);

    // Speaker Text-to-Speech handler click handler
    speakBtn.addEventListener("click", () => {
        handleTextToSpeech(fullText, speakBtn);
    });
}

function handleTextToSpeech(textToSpeak, buttonElement) {
    // Agar pehle se kuch bol raha hai toh pehle stop karega
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (buttonElement.classList.contains("playing")) {
            buttonElement.classList.remove("playing");
            buttonElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
            return;
        }
    }

    // Markdown tags clean karne ke liye taaki text normal sound kare
    const cleanText = textToSpeak.replace(/[#*`_]/g, '');

    currentUtterance = new SpeechSynthesisUtterance(cleanText);
    
    // Auto voice matching algorithm for Female Voice selection
    const voices = window.speechSynthesis.getVoices();
    
    // Pehle Hindi voice check karega (agar pure hindi words hain), nahi toh standard English female voice select karega
    let selectedVoice = voices.find(voice => (voice.lang.includes("hi-IN") || voice.lang.includes("hi")) && voice.name.toLowerCase().includes("female"));
    
    if(!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.includes("en") && (voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("google") || voice.name.toLowerCase().includes("zira")));
    }
    
    if(selectedVoice) {
        currentUtterance.voice = selectedVoice;
    }

    currentUtterance.pitch = 1.1; // Thodi soft/female voice tone sharp karne ke liye
    currentUtterance.rate = 1.0;  // Normal human speed

    currentUtterance.onstart = () => {
        buttonElement.classList.add("playing");
        buttonElement.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
    };

    currentUtterance.onend = () => {
        buttonElement.classList.remove("playing");
        buttonElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Listen';
    };

    window.speechSynthesis.speak(currentUtterance);
}

// Chrome/Safari voices loading handler async fix
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function autoScroll() {
    answerLog.scrollTop = answerLog.scrollHeight;
}

copyBtn.addEventListener("click", () => {
    if(!lastResponseText) return;
    navigator.clipboard.writeText(lastResponseText);
    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
    setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Last Response';
    }, 2000);
});

menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle("active");
});

document.addEventListener("click", (e) => {
    if (!settingsPanel.contains(e.target) && !menuBtn.contains(e.target)) {
        settingsPanel.classList.remove("active");
    }
});

function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        lightTheme.classList.add("active");
        darkTheme.classList.remove("active");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        darkTheme.classList.add("active");
        lightTheme.classList.remove("active");
        localStorage.setItem("theme", "dark");
    }
}

darkTheme.addEventListener("click", () => applyTheme("dark"));
lightTheme.addEventListener("click", () => applyTheme("light"));

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);