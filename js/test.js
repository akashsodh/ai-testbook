console.log("TEST.JS SCRIPT LOADED AND RUNNING!");
// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें (main.js के समान)
const firebaseConfig = {
    apiKey: "AIzaSyA5MtfhOJkaZQlRTkzSKZuPtq4dmrsg9sc",
    authDomain: "aitestbook.firebaseapp.com",
    projectId: "aitestbook", // Realtime Database के लिए projectId ज़रूरी नहीं, पर SDK के लिए है
    databaseURL: "https://aitestbook-default-rtdb.asia-southeast1.firebasedatabase.app/", // <<--- यह Realtime Database के लिए महत्वपूर्ण है!
    storageBucket: "aitestbook.firebasestorage.app",
    messagingSenderId: "881340974074",
    appId: "1:881340974074:web:7e355216ae6521e77fda43"
};

// Firebase को इनिशियलाइज़ करें
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
// Realtime Database सर्विस को एक्सेस करें
const rtdb = firebase.database();

const quizContainer = document.getElementById('quiz-container');
const testTitleElement = document.getElementById('test-title');
const submitButton = document.getElementById('submit-test-btn');
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');

let currentQuestions = []; // वर्तमान टेस्ट के प्रश्न स्टोर करने के लिए

// URL से यूनिट आईडी प्राप्त करें
const urlParams = new URLSearchParams(window.location.search);
const unitId = urlParams.get('unit');

async function loadQuestions(unitId) {
    if (!unitId) {
        quizContainer.innerHTML = "<p>कोई यूनिट चयनित नहीं है। कृपया होम पेज पर वापस जाएं और एक यूनिट चुनें।</p>";
        return;
    }

    try {
        // यूनिट के डेटा का रेफरेंस लें, जैसे 'tests/unit1'
        const unitRef = rtdb.ref(`tests/${unitId}`);
        const snapshot = await unitRef.get(); // डेटा एक बार पढ़ें

        if (!snapshot.exists()) {
            quizContainer.innerHTML = "<p>यह टेस्ट यूनिट नहीं मिली।</p>";
            return;
        }

        const testData = snapshot.val(); // यूनिट का डेटा
        testTitleElement.textContent = testData.title || `टेस्ट: ${unitId}`;
        currentQuestions = testData.questions; // यह एक ऐरे होनी चाहिए

        if (!currentQuestions || !Array.isArray(currentQuestions) || currentQuestions.length === 0) {
            quizContainer.innerHTML = "<p>इस यूनिट में कोई प्रश्न उपलब्ध नहीं है या सही फॉर्मेट में नहीं हैं।</p>";
            return;
        }

        displayQuestions(currentQuestions);
        submitButton.style.display = 'block';

    } catch (error) {
        console.error("प्रश्न लोड करने में त्रुटि:", error);
        quizContainer.innerHTML = "<p>प्रश्न लोड करने में विफल।</p>";
    }
}

function displayQuestions(questions) {
        console.log("TEST.JS: displayQuestions function ko call kiya gaya, data:", questions); // <-- यह लाइन जोड़ें
    let questionsHtml = '';
    questions.forEach((q, index) => {
        // सुनिश्चित करें कि q एक ऑब्जेक्ट है और उसमें question और options प्रॉपर्टीज़ हैं
        if (q && typeof q.question === 'string' && Array.isArray(q.options)) {
            questionsHtml += `
                <div class="question-card" id="question-${index}">
                    <p><b>प्रश्न ${index + 1}:</b> ${q.question}</p>
                    <div class="options">
            `;
            q.options.forEach((option, i) => {
                questionsHtml += `
                        <label>
                            <input type="radio" name="question${index}" value="${option}">
                            ${option}
                        </label>
                `;
            });
            questionsHtml += `
                    </div>
                </div>
            `;
        } else {
            console.warn(`प्रश्न ${index + 1} का फॉर्मेट सही नहीं है:`, q);
        }
    });
    quizContainer.innerHTML = questionsHtml;
}

function calculateScore() {
    let score = 0;
    currentQuestions.forEach((q, index) => {
        const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
        // सुनिश्चित करें कि q ऑब्जेक्ट है और उसमें answer प्रॉपर्टी है
        if (selectedOption && q && typeof q.answer === 'string' && selectedOption.value === q.answer) {
            score++;
        }
    });
    return score;
}

submitButton.addEventListener('click', () => {
    const totalScore = calculateScore();
    scoreElement.textContent = `${totalScore} / ${currentQuestions.length}`;
    resultContainer.style.display = 'block';
    submitButton.style.display = 'none';

    currentQuestions.forEach((q, index) => {
        const questionCard = document.getElementById(`question-${index}`);
        if (!questionCard) return; // अगर प्रश्न कार्ड नहीं मिला तो आगे न बढ़ें

        const correctAnswerElement = document.createElement('p');
        correctAnswerElement.innerHTML = `<b>सही उत्तर:</b> ${q.answer || 'उपलब्ध नहीं'}`;
        correctAnswerElement.style.color = 'green';

        const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
        if (selectedOption && q && q.answer && selectedOption.value !== q.answer) {
             const parentLabel = selectedOption.parentElement;
             if (parentLabel) parentLabel.style.color = 'red';
        } else if (selectedOption && q && q.answer && selectedOption.value === q.answer) {
            const parentLabel = selectedOption.parentElement;
            if (parentLabel) parentLabel.style.color = 'green';
        }

        questionCard.appendChild(correctAnswerElement);
        document.querySelectorAll(`input[name="question${index}"]`).forEach(input => {
            input.disabled = true;
        });
    });
});

// पेज लोड होने पर प्रश्न लोड करें
window.onload = () => {
    window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const unitId = urlParams.get('unit');
    console.log("WINDOW ONLOAD - CALLING loadQuestions with unitId:", unitId); // <-- यह लाइन जोड़ें
    loadQuestions(unitId);
};
    loadQuestions(unitId);
};
