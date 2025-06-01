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
const submitButtonOriginal = document.getElementById('submit-test-btn'); // यह HTML से हटाया जा सकता है या छिपाया जा सकता है
const submitButtonSidebar = document.getElementById('submit-test-btn-sidebar');
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');

const backButton = document.getElementById('back-btn');
const nextButton = document.getElementById('next-btn');
const clearOptionButton = document.getElementById('clear-option-btn');
const navigationButtonsContainer = document.getElementById('navigation-buttons');

const questionNavigationTable = document.getElementById('question-navigation-table');
const quizContent = document.getElementById('quiz-content'); // फ़ॉन्ट आकार बदलने के लिए
const decreaseFontButton = document.getElementById('decrease-font');
const increaseFontButton = document.getElementById('increase-font');
const currentFontSizeSpan = document.getElementById('current-font-size');
const shuffleQuestionsButton = document.getElementById('shuffle-questions-btn');
const shuffleOptionsButton = document.getElementById('shuffle-options-btn');

const liveFeedbackContainer = document.getElementById('question-feedback-live');
const liveCorrectAnswersSpan = document.getElementById('live-correct-answers');
const liveIncorrectAnswersSpan = document.getElementById('live-incorrect-answers');


let currentQuestions = [];
let userAnswers = []; // उपयोगकर्ताओं के उत्तरों को संग्रहीत करने के लिए
let currentQuestionIndex = 0;
let questionsShuffled = false;
let optionsShuffled = false;
let baseFontSize = 16; // पिक्सल में

// URL से यूनिट आईडी प्राप्त करें
const urlParams = new URLSearchParams(window.location.search);
const unitId = urlParams.get('unit');

async function loadQuestions(unitId) {
    if (!unitId) {
        quizContainer.innerHTML = "<p>कोई यूनिट चयनित नहीं है। कृपया होम पेज पर वापस जाएं और एक यूनिट चुनें।</p>";
        return;
    }

    try {
        const unitRef = rtdb.ref(`tests/${unitId}`);
        const snapshot = await unitRef.get();

        if (!snapshot.exists()) {
            quizContainer.innerHTML = "<p>यह टेस्ट यूनिट नहीं मिली।</p>";
            return;
        }

        const testData = snapshot.val();
        testTitleElement.textContent = testData.title || `टेस्ट: ${unitId}`;
        currentQuestions = testData.questions;

        if (!currentQuestions || !Array.isArray(currentQuestions) || currentQuestions.length === 0) {
            quizContainer.innerHTML = "<p>इस यूनिट में कोई प्रश्न उपलब्ध नहीं है या सही फॉर्मेट में नहीं हैं।</p>";
            return;
        }

        // उपयोगकर्ता उत्तरों को इनिशियलाइज़ करें
        userAnswers = new Array(currentQuestions.length).fill(null);
        currentQuestionIndex = 0; // पहले प्रश्न से शुरू करें

        if (questionsShuffled) {
            shuffleArray(currentQuestions);
        }
        if (optionsShuffled) {
            currentQuestions.forEach(q => shuffleArray(q.options));
        }

        renderAllQuestions(); // सभी प्रश्न कार्ड बनाएं (शुरू में छिपे हुए)
        displayQuestion(currentQuestionIndex);
        buildQuestionNavigation();
        updateNavigationButtons();
        // submitButtonOriginal.style.display = 'none'; // मूल बटन छिपाएं
        submitButtonSidebar.style.display = 'block';
        navigationButtonsContainer.style.display = 'block';
        liveFeedbackContainer.style.display = 'block'; // लाइव फीडबैक दिखाएं
        updateLiveFeedback();


    } catch (error) {
        console.error("प्रश्न लोड करने में त्रुटि:", error);
        quizContainer.innerHTML = "<p>प्रश्न लोड करने में विफल।</p>";
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderAllQuestions() {
    let questionsHtml = '';
    currentQuestions.forEach((q, index) => {
        if (q && typeof q.question === 'string' && Array.isArray(q.options)) {
            questionsHtml += `
                <div class="question-card" id="question-${index}">
                    <p><b>प्रश्न ${index + 1}:</b> ${q.question}</p>
                    <div class="options">
            `;
            q.options.forEach((option, i) => {
                // मान लें कि option एक स्ट्रिंग है
                const optionValue = typeof option === 'object' && option !== null ? option.text : option; // यदि विकल्प ऑब्जेक्ट हैं
                const optionDisplay = optionValue;

                questionsHtml += `
                        <label>
                            <input type="radio" name="question${index}" value="${optionValue}">
                            <span>${optionDisplay}</span>
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

    // हर प्रश्न के रेडियो बटन में इवेंट लिस्नर जोड़ें ताकि उपयोगकर्ता का उत्तर संग्रहीत किया जा सके
    currentQuestions.forEach((_, index) => {
        const radioButtons = document.querySelectorAll(`input[name="question${index}"]`);
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (event) => {
                userAnswers[index] = event.target.value;
                updateQuestionNavigationItemStatus(index);
                // सही/गलत का लाइव अपडेट (वैकल्पिक, यदि आप हर चयन पर दिखाना चाहते हैं)
                // updateLiveFeedbackForQuestion(index); // यह फ़ंक्शन बनाना होगा
                updateLiveFeedback(); // या केवल कुल संख्या अपडेट करें
            });
        });
    });
}

function displayQuestion(index) {
    document.querySelectorAll('.question-card').forEach(card => {
        card.classList.remove('active');
    });
    const currentQuestionCard = document.getElementById(`question-${index}`);
    if (currentQuestionCard) {
        currentQuestionCard.classList.add('active');
    }
    currentQuestionIndex = index;
    updateNavigationButtons();
    highlightCurrentQuestionNav();

    // यदि प्रश्न का उत्तर पहले ही दिया जा चुका है, तो उसे लोड करें
    if (userAnswers[index] !== null) {
        const selectedRadioButton = document.querySelector(`input[name="question${index}"][value="${userAnswers[index]}"]`);
        if (selectedRadioButton) {
            selectedRadioButton.checked = true;
        }
    }
}

function updateNavigationButtons() {
    backButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    nextButton.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-block' : 'none';
    clearOptionButton.style.display = 'inline-block'; // हमेशा दिखाएं जब प्रश्न सक्रिय हो
}

function buildQuestionNavigation() {
    let navHtml = '';
    currentQuestions.forEach((_, index) => {
        navHtml += `<a href="#" data-qindex="${index}" id="qnav-${index}">${index + 1}</a>`;
    });
    questionNavigationTable.innerHTML = navHtml;

    document.querySelectorAll('#question-navigation-table a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const qIndex = parseInt(e.target.dataset.qindex);
            displayQuestion(qIndex);
        });
    });
    highlightCurrentQuestionNav();
}

function updateQuestionNavigationItemStatus(index) {
    const navLink = document.getElementById(`qnav-${index}`);
    if (navLink && userAnswers[index] !== null) {
        navLink.classList.add('answered');
    } else if (navLink) {
        navLink.classList.remove('answered');
    }
}


function highlightCurrentQuestionNav() {
    document.querySelectorAll('#question-navigation-table a').forEach(link => {
        link.classList.remove('current-q-nav');
    });
    const currentNavLink = document.getElementById(`qnav-${currentQuestionIndex}`);
    if (currentNavLink) {
        currentNavLink.classList.add('current-q-nav');
    }
}

function calculateScore() {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    currentQuestions.forEach((q, index) => {
        if (userAnswers[index] !== null && q && typeof q.answer === 'string') {
            if (userAnswers[index] === q.answer) {
                score++;
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
    });
     // लाइव फीडबैक स्पैन भी अपडेट कर सकते हैं यदि आवश्यक हो, हालांकि यह सबमिट के समय है
    // liveCorrectAnswersSpan.textContent = correctCount;
    // liveIncorrectAnswersSpan.textContent = incorrectCount;
    return score;
}

function updateLiveFeedback() {
    let tempCorrect = 0;
    let tempIncorrect = 0;
    userAnswers.forEach((answer, index) => {
        if (answer !== null) { // केवल प्रयास किए गए प्रश्न
            if (currentQuestions[index] && answer === currentQuestions[index].answer) {
                tempCorrect++;
            } else if (currentQuestions[index]) { // यदि प्रश्न मौजूद है और उत्तर गलत है
                tempIncorrect++;
            }
        }
    });
    liveCorrectAnswersSpan.textContent = tempCorrect;
    liveIncorrectAnswersSpan.textContent = tempIncorrect;
}


nextButton.addEventListener('click', () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        displayQuestion(currentQuestionIndex + 1);
    }
});

backButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        displayQuestion(currentQuestionIndex - 1);
    }
});

clearOptionButton.addEventListener('click', () => {
    const radioButtons = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`);
    radioButtons.forEach(radio => radio.checked = false);
    userAnswers[currentQuestionIndex] = null;
    updateQuestionNavigationItemStatus(currentQuestionIndex);
    // यदि लाइव रंग संकेत का उपयोग कर रहे हैं, तो उसे भी साफ़ करें
    const currentLabels = document.querySelectorAll(`#question-${currentQuestionIndex} .options label`);
    currentLabels.forEach(label => {
        label.classList.remove('user-answer-correct', 'user-answer-incorrect');
    });
    updateLiveFeedback(); // काउंटर अपडेट करें
});

submitButtonSidebar.addEventListener('click', () => {
    const totalScore = calculateScore();
    scoreElement.textContent = `${totalScore} / ${currentQuestions.length}`;
    resultContainer.style.display = 'block';
    submitButtonSidebar.style.display = 'none'; // साइडबार वाला बटन छिपाएं
    navigationButtonsContainer.style.display = 'none'; // नेविगेशन बटन छिपाएं
    liveFeedbackContainer.style.display = 'none'; // लाइव फीडबैक छिपाएं

    // साइडबार के नियंत्रणों को अक्षम करें
    decreaseFontButton.disabled = true;
    increaseFontButton.disabled = true;
    shuffleQuestionsButton.disabled = true;
    shuffleOptionsButton.disabled = true;
    document.querySelectorAll('#question-navigation-table a').forEach(link => link.style.pointerEvents = 'none');


    currentQuestions.forEach((q, index) => {
        const questionCard = document.getElementById(`question-${index}`);
        if (!questionCard) return;

        // प्रश्न कार्ड को फिर से सक्रिय करें ताकि वह दिखे यदि वह छिपा हुआ था
        // (हालांकि, आदर्श रूप से, सबमिट पर सभी प्रश्न एक साथ स्क्रॉल करने योग्य सूची में दिखाए जा सकते हैं)
        // या, उपयोगकर्ता को प्रत्येक प्रश्न पर नेविगेट करने दें और फीडबैक देखें
        if(!questionCard.classList.contains('active')) {
            // यदि आप चाहते हैं कि सभी प्रश्न एक साथ दिखें, तो नीचे दी गई लाइन को हटा दें
            // और display: block को .question-card पर CSS के माध्यम से सेट करें
             // questionCard.classList.add('active'); // या सभी को एक साथ दिखाएं
        }


        const correctAnswerElement = document.createElement('p');
        correctAnswerElement.innerHTML = `<b>सही उत्तर:</b> ${q.answer || 'उपलब्ध नहीं'}`;
        correctAnswerElement.classList.add('correct-answer-text');

        const optionsContainer = questionCard.querySelector('.options');
        if (optionsContainer) { // सुनिश्चित करें कि यह मौजूद है
            const existingFeedback = optionsContainer.nextElementSibling;
            // यदि पहले से ही 'correct-answer-text' वाला p है, तो उसे न जोड़ें
            if (!existingFeedback || !existingFeedback.classList.contains('correct-answer-text')) {
                optionsContainer.insertAdjacentElement('afterend', correctAnswerElement);
            }
        }


        const selectedOptionValue = userAnswers[index];
        const radioInputs = questionCard.querySelectorAll(`input[name="question${index}"]`);

        radioInputs.forEach(input => {
            input.disabled = true;
            const parentLabel = input.parentElement;
            if (parentLabel) {
                parentLabel.classList.remove('user-answer-correct', 'user-answer-incorrect'); // पुरानी क्लासेस हटाएं
                if (selectedOptionValue === input.value) { // यह उपयोगकर्ता का चुना हुआ विकल्प है
                    if (q.answer && selectedOptionValue === q.answer) {
                        parentLabel.classList.add('user-answer-correct');
                    } else if (q.answer) {
                        parentLabel.classList.add('user-answer-incorrect');
                    }
                }
                // सही उत्तर को भी हाइलाइट करें यदि वह चुना नहीं गया था
                else if (input.value === q.answer) {
                     // parentLabel.classList.add('force-correct-highlight'); // एक नई क्लास बना सकते हैं
                     // या सही उत्तर वाले लेबल को विशेष रूप से स्टाइल करें
                }
            }
        });
    });
    // परिणाम दिखाने के बाद पहले प्रश्न पर स्क्रॉल करें (वैकल्पिक)
    // displayQuestion(0); // या परिणाम कंटेनर पर स्क्रॉल करें
    resultContainer.scrollIntoView({ behavior: 'smooth' });
});


// फ़ॉन्ट आकार नियंत्रण
increaseFontButton.addEventListener('click', () => {
    if (baseFontSize < 24) { // अधिकतम सीमा
        baseFontSize += 2;
        quizContent.style.fontSize = `${baseFontSize}px`;
        currentFontSizeSpan.textContent = `${baseFontSize}px`;
    }
});

decreaseFontButton.addEventListener('click', () => {
    if (baseFontSize > 12) { // न्यूनतम सीमा
        baseFontSize -= 2;
        quizContent.style.fontSize = `${baseFontSize}px`;
        currentFontSizeSpan.textContent = `${baseFontSize}px`;
    }
});

// शफल प्रश्न
shuffleQuestionsButton.addEventListener('click', () => {
    if (confirm("क्या आप प्रश्नों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) {
        questionsShuffled = true;
        optionsShuffled = false; // या इसे उपयोगकर्ता की पसंद पर छोड़ दें
        resetQuizStateAndReload();
    }
});

// शफल विकल्प
shuffleOptionsButton.addEventListener('click', () => {
    if (confirm("क्या आप विकल्पों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) {
        optionsShuffled = true;
        // questionsShuffled = false; // या इसे उपयोगकर्ता की पसंद पर छोड़ दें
        resetQuizStateAndReload();
    }
});

function resetQuizStateAndReload() {
    currentQuestionIndex = 0;
    userAnswers = [];
    quizContainer.innerHTML = '<p>प्रश्न पुनः लोड हो रहे हैं...</p>';
    resultContainer.style.display = 'none';
    liveCorrectAnswersSpan.textContent = '0';
    liveIncorrectAnswersSpan.textContent = '0';
    // सबमिट बटन और अन्य नियंत्रणों को रीसेट करें
    submitButtonSidebar.style.display = 'block';
    navigationButtonsContainer.style.display = 'block';
    liveFeedbackContainer.style.display = 'block';
    decreaseFontButton.disabled = false;
    increaseFontButton.disabled = false;
    shuffleQuestionsButton.disabled = false;
    shuffleOptionsButton.disabled = false;

    loadQuestions(unitId);
}


// पेज लोड होने पर प्रश्न लोड करें
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const unitId = urlParams.get('unit');
    console.log("WINDOW ONLOAD - CALLING loadQuestions with unitId:", unitId);
    loadQuestions(unitId);
    currentFontSizeSpan.textContent = `${baseFontSize}px`; // प्रारंभिक फ़ॉन्ट आकार दिखाएं
};
