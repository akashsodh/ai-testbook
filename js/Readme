// [Source: 1] console.log("TEST.JS SCRIPT LOADED AND RUNNING!");
// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें (main.js के समान)
const firebaseConfig = {
    apiKey: "AIzaSyA5MtfhOJkaZQlRTkzSKZuPtq4dmrsg9sc",
    authDomain: "aitestbook.firebaseapp.com",
    projectId: "aitestbook", // Realtime Database के लिए projectId ज़रूरी नहीं, पर SDK के लिए है
    databaseURL: "https://aitestbook-default-rtdb.asia-southeast1.firebasedatabase.app/", // <<--- यह Realtime Database के लिए महत्वपूर्ण है!
    storageBucket: "aitestbook.firebasestorage.app", // [Source: 2]
    messagingSenderId: "881340974074",
    appId: "1:881340974074:web:7e355216ae6521e77fda43"
};

// [Source: 3] // Firebase को इनिशियलाइज़ करें
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} // [Source: 4]
// Realtime Database सर्विस को एक्सेस करें
const rtdb = firebase.database();

const quizContainer = document.getElementById('quiz-container');
const testTitleElement = document.getElementById('test-title'); // [Source: 5]
const submitButtonOriginal = document.getElementById('submit-test-btn'); // [Source: 5] // यह HTML से हटाया जा सकता है या छिपाया जा सकता है
const submitButtonSidebar = document.getElementById('submit-test-btn-sidebar');
const resultContainer = document.getElementById('result-container'); // [Source: 6]
const scoreElement = document.getElementById('score');  // [Source: 6]

const backButton = document.getElementById('back-btn'); // [Source: 6]
const nextButton = document.getElementById('next-btn'); // [Source: 6]
const clearOptionButton = document.getElementById('clear-option-btn'); // [Source: 7]
const navigationButtonsContainer = document.getElementById('navigation-buttons'); // [Source: 7]

const questionNavigationTable = document.getElementById('question-navigation-table'); // [Source: 7]
const quizContent = document.getElementById('quiz-content'); // [Source: 7]
const decreaseFontButton = document.getElementById('decrease-font'); // [Source: 8]
const increaseFontButton = document.getElementById('increase-font'); // [Source: 8]
const currentFontSizeSpan = document.getElementById('current-font-size'); // [Source: 8]
const shuffleQuestionsButton = document.getElementById('shuffle-questions-btn'); // [Source: 9]
const shuffleOptionsButton = document.getElementById('shuffle-options-btn'); // [Source: 9]

const liveFeedbackContainer = document.getElementById('question-feedback-live'); // [Source: 9]
const liveCorrectAnswersSpan = document.getElementById('live-correct-answers'); // [Source: 9]
const liveIncorrectAnswersSpan = document.getElementById('live-incorrect-answers'); // [Source: 10]

// --- नए एलिमेंट्स ---
const sidebar = document.getElementById('sidebar'); // [Source: 10]
const sidebarToggleButton = document.getElementById('sidebar-toggle-btn'); // [Source: 10]
// --- --- // [Source: 11]

let currentQuestions = []; // [Source: 11]
let userAnswers = []; // [Source: 11]
let currentQuestionIndex = 0; // [Source: 12]
let questionsShuffled = false; // [Source: 12]
let optionsShuffled = false; // [Source: 13]
let baseFontSize = 16; // [Source: 13]
// [Source: 14] // पिक्सल में

// URL से यूनिट आईडी प्राप्त करें
const urlParams = new URLSearchParams(window.location.search); // [Source: 14]
let unitId = urlParams.get('unit'); // इसे let में बदलें ताकि window.onload में सेट हो सके // [Source: 14]

// --- localStorage Keys (इन्हें unitId मिलने के बाद परिभाषित करें) ---
let LS_USER_ANSWERS;
let LS_CURRENT_INDEX;
let LS_QUESTIONS_SHUFFLED;
let LS_OPTIONS_SHUFFLED;
let LS_BASE_FONT_SIZE;

function defineLocalStorageKeys() {
    if (unitId) {
        LS_USER_ANSWERS = `quizUserAnswers_${unitId}`;
        LS_CURRENT_INDEX = `quizCurrentIndex_${unitId}`;
        LS_QUESTIONS_SHUFFLED = `quizQuestionsShuffled_${unitId}`;
        LS_OPTIONS_SHUFFLED = `quizOptionsShuffled_${unitId}`;
        LS_BASE_FONT_SIZE = `quizBaseFontSize_${unitId}`;
    }
}
// --- ---


async function loadQuestions(currentUnitId) { // [Source: 15]
    if (!currentUnitId) { // [Source: 15]
        if(quizContainer) quizContainer.innerHTML = "<p>कोई यूनिट चयनित नहीं है। कृपया होम पेज पर वापस जाएं और एक यूनिट चुनें।</p>"; // [Source: 15]
        return; // [Source: 16]
    }
    unitId = currentUnitId; // वैश्विक unitId को सेट करें
    defineLocalStorageKeys(); // अब localStorage keys को परिभाषित करें

    loadStateFromLocalStorage(); // सबसे पहले localStorage से स्थिति लोड करें

    try { // [Source: 16]
        const unitRef = rtdb.ref(`tests/${unitId}`); // [Source: 16]
        const snapshot = await unitRef.get(); // [Source: 17]

        if (!snapshot.exists()) { // [Source: 18]
            if(quizContainer) quizContainer.innerHTML = "<p>यह टेस्ट यूनिट नहीं मिली।</p>"; // [Source: 18]
            return; // [Source: 19]
        }

        const testData = snapshot.val(); // [Source: 19]
        if(testTitleElement) testTitleElement.textContent = testData.title || `टेस्ट: ${unitId}`; // [Source: 20]
        currentQuestions = testData.questions || []; // [Source: 21]

        if (!Array.isArray(currentQuestions) || currentQuestions.length === 0) { // [Source: 22]
            if(quizContainer) quizContainer.innerHTML = "<p>इस यूनिट में कोई प्रश्न उपलब्ध नहीं है या सही फॉर्मेट में नहीं हैं।</p>"; // [Source: 22]
            return; // [Source: 23]
        }

        // यदि localStorage से userAnswers लोड नहीं हुए या लंबाई मेल नहीं खाती
        if (!userAnswers || userAnswers.length !== currentQuestions.length) { // [Source: 23]
            userAnswers = new Array(currentQuestions.length).fill(null); // [Source: 23]
            // currentQuestionIndex को LS से लोड किया जा चुका है, उसे रीसेट न करें जब तक आवश्यक न हो
        }
         // सुनिश्चित करें कि currentQuestionIndex प्रश्नों की सीमा के भीतर है
        if (currentQuestionIndex >= currentQuestions.length || currentQuestionIndex < 0) {
            currentQuestionIndex = 0;
        }


        if (questionsShuffled) { // [Source: 25]
            shuffleArray(currentQuestions); // [Source: 25]
        } // [Source: 26]
        if (optionsShuffled) { // [Source: 26]
            currentQuestions.forEach(q => { if(q && q.options) shuffleArray(q.options); }); // [Source: 26]
        } // [Source: 27]

        renderAllQuestions(); // [Source: 27]
        displayQuestion(currentQuestionIndex); // [Source: 28]
        buildQuestionNavigation(); // [Source: 29]
        updateNavigationButtons(); // [Source: 30]

        if(submitButtonSidebar) submitButtonSidebar.style.display = 'block'; // [Source: 31]
        if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block'; // [Source: 32]
        if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block'; // [Source: 33]
        updateLiveFeedback(); // [Source: 34]

    } catch (error) { // [Source: 35]
        console.error("प्रश्न लोड करने में त्रुटि:", error); // [Source: 35]
        if(quizContainer) quizContainer.innerHTML = "<p>प्रश्न लोड करने में विफल।</p>"; // [Source: 36]
    } // [Source: 37]
}

function shuffleArray(array) { // [Source: 37]
    if (!array) return; // [Source: 37]
    for (let i = array.length - 1; i > 0; i--) { // [Source: 37]
        const j = Math.floor(Math.random() * (i + 1)); // [Source: 37]
        [array[i], array[j]] = [array[j], array[i]]; // [Source: 38]
    } // [Source: 39]
}

function renderAllQuestions() { // [Source: 39]
    let questionsHtml = ''; // [Source: 39]
    currentQuestions.forEach((q, index) => { // [Source: 40]
        if (q && typeof q.question === 'string' && Array.isArray(q.options)) { // [Source: 40]
            questionsHtml += `
                <div class="question-card" id="question-${index}">
                    <p><b>प्रश्न ${index + 1}:</b> ${q.question}</p>
                    <div class="options">
            `; // [Source: 41]
            q.options.forEach((optionText) => { // option को optionText में बदलें // [Source: 41]
                // मान लें कि optionText एक स्ट्रिंग है
                const optionValue = optionText; // यदि विकल्प ऑब्जेक्ट हैं तो इसे हैंडल करना होगा
                const optionDisplay = optionValue;

                questionsHtml += `
                        <label>
                            <input type="radio" name="question${index}" value="${optionValue}">
                            <span>${optionDisplay}</span>
                        </label>
                `; // [Source: 43]
            });
            questionsHtml += `
                    </div>
                    <div class="correct-answer-display" id="correct-answer-${index}" style="display:none;"></div>
                </div>
            `; // [Source: 44]
        } else { // [Source: 45]
            console.warn(`प्रश्न ${index + 1} का फॉर्मेट सही नहीं है:`, q); // [Source: 45]
        } // [Source: 46]
    });
    if(quizContainer) quizContainer.innerHTML = questionsHtml; // [Source: 47]

    currentQuestions.forEach((_, questionIndex) => { // [Source: 47]
        const radioButtons = document.querySelectorAll(`input[name="question${questionIndex}"]`); // [Source: 47]
        radioButtons.forEach(radio => { // [Source: 47]
            radio.addEventListener('change', (event) => { // [Source: 47]
                handleOptionSelection(questionIndex, event.target); // [Source: 47]
            });
        });
    }); // [Source: 48]
}

function handleOptionSelection(questionIndex, selectedRadio) { // [Source: 48]
    if (!selectedRadio || selectedRadio.disabled) return; // [Source: 48]

    userAnswers[questionIndex] = selectedRadio.value; // [Source: 48]
    updateQuestionNavigationItemStatus(questionIndex); // [Source: 49]
    updateLiveFeedback(); // [Source: 49]

    const questionData = currentQuestions[questionIndex]; // [Source: 50]
    const optionsContainer = selectedRadio.closest('.options'); // [Source: 50]
    if (!optionsContainer) return; // [Source: 50]
    const allLabelsInQuestion = optionsContainer.querySelectorAll('label'); // [Source: 51]
    const selectedLabel = selectedRadio.parentElement; // [Source: 51]

    const allRadioButtonsInQuestion = optionsContainer.querySelectorAll(`input[name="question${questionIndex}"]`); // [Source: 52]
    allRadioButtonsInQuestion.forEach(rb => rb.disabled = true); // [Source: 53]

    allLabelsInQuestion.forEach(label => { // [Source: 54]
        label.classList.remove('user-answer-correct', 'user-answer-incorrect'); // [Source: 54]
    });
    if (questionData && typeof questionData.answer === 'string') { // [Source: 55]
        if (selectedRadio.value === questionData.answer) { // [Source: 55]
            if(selectedLabel) selectedLabel.classList.add('user-answer-correct'); // [Source: 55]
        } else { // [Source: 56]
            if(selectedLabel) selectedLabel.classList.add('user-answer-incorrect'); // [Source: 56]
        } // [Source: 57]
    }

    const correctAnswerDisplay = document.getElementById(`correct-answer-${questionIndex}`); // [Source: 57]
    if (correctAnswerDisplay && questionData && questionData.answer) { // [Source: 58]
        correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`; // [Source: 58]
        correctAnswerDisplay.style.display = 'block'; // [Source: 59]
    } // [Source: 60]
    if(clearOptionButton) clearOptionButton.disabled = true; // [Source: 60]
    saveStateToLocalStorage(); // [Source: 61]
}


function displayQuestion(index) { // [Source: 61]
    if (index < 0 || index >= currentQuestions.length) {
        console.warn("अमान्य प्रश्न इंडेक्स:", index);
        return;
    }
    document.querySelectorAll('.question-card').forEach(card => { // [Source: 61]
        card.classList.remove('active'); // [Source: 61]
    });
    const currentQuestionCard = document.getElementById(`question-${index}`); // [Source: 62]
    if (currentQuestionCard) { // [Source: 62]
        currentQuestionCard.classList.add('active'); // [Source: 62]
    } // [Source: 63]
    currentQuestionIndex = index; // [Source: 63]
    updateNavigationButtons(); // [Source: 64]
    highlightCurrentQuestionNav(); // [Source: 64]

    const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`); // [Source: 73]
    const allRadioButtonsInQuestion = document.querySelectorAll(`input[name="question${index}"]`); // [Source: 69]

    if (userAnswers[index] !== null) { // [Source: 65]
        const selectedRadioButton = document.querySelector(`input[name="question${index}"][value="${CSS.escape(userAnswers[index])}"]`); // CSS.escape का उपयोग करें
        if (selectedRadioButton) { // [Source: 66]
            selectedRadioButton.checked = true; // [Source: 66]

            allRadioButtonsInQuestion.forEach(rb => rb.disabled = true); // [Source: 70]
            if(clearOptionButton) clearOptionButton.disabled = true; // [Source: 80]

            const questionData = currentQuestions[index]; // [Source: 70]
            const selectedLabel = selectedRadioButton.parentElement; // [Source: 70]
            if (selectedLabel && questionData && questionData.answer) { // [Source: 71]
                selectedLabel.classList.remove('user-answer-correct', 'user-answer-incorrect'); // पहले साफ करें
                if (selectedRadioButton.value === questionData.answer) { // [Source: 71]
                    selectedLabel.classList.add('user-answer-correct'); // [Source: 71]
                } else { // [Source: 72]
                    selectedLabel.classList.add('user-answer-incorrect'); // [Source: 72]
                }
            }
            if (correctAnswerDisplay && questionData && questionData.answer) { // [Source: 73]
                correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`; // [Source: 74]
                correctAnswerDisplay.style.display = 'block'; // [Source: 75]
            }
        }
    } else { // [Source: 75]
        allRadioButtonsInQuestion.forEach(rb => { // [Source: 75]
            rb.disabled = false; // [Source: 76]
            rb.checked = false; // सुनिश्चित करें कि कोई भी चुना नहीं है
            if(rb.parentElement) rb.parentElement.classList.remove('user-answer-correct', 'user-answer-incorrect');
        });
        if(clearOptionButton) clearOptionButton.disabled = false; // [Source: 76]
        if(correctAnswerDisplay) correctAnswerDisplay.style.display = 'none'; // [Source: 76]
    }
    saveStateToLocalStorage(); // [Source: 77]
}

function updateNavigationButtons() { // [Source: 77]
    if(backButton) backButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none'; // [Source: 77]
    if(nextButton) nextButton.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-block' : 'none'; // [Source: 78]

    if(clearOptionButton) { // [Source: 79]
        if (userAnswers[currentQuestionIndex] !== null) { // [Source: 79]
            clearOptionButton.style.display = 'inline-block'; // [Source: 79]
            clearOptionButton.disabled = true; // [Source: 80]
        } else { // [Source: 81]
            clearOptionButton.style.display = 'inline-block'; // [Source: 81]
            clearOptionButton.disabled = false; // [Source: 82]
        } // [Source: 83]
    }
} // [Source: 83]

function buildQuestionNavigation() { // [Source: 83]
    let navHtml = ''; // [Source: 83]
    currentQuestions.forEach((_, index) => { // [Source: 84]
        navHtml += `<a href="#" data-qindex="${index}" id="qnav-${index}">${index + 1}</a>`; // [Source: 84]
    });
    if(questionNavigationTable) questionNavigationTable.innerHTML = navHtml; // [Source: 85]

    document.querySelectorAll('#question-navigation-table a').forEach(link => { // [Source: 85]
        link.addEventListener('click', (e) => { // [Source: 85]
            e.preventDefault(); // [Source: 85]
            const qIndex = parseInt(e.target.dataset.qindex); // [Source: 85]
            if (!isNaN(qIndex)) { // [Source: 85]
                displayQuestion(qIndex); // [Source: 85]
            }
        });
    });
    highlightCurrentQuestionNav(); // [Source: 86]
}

function updateQuestionNavigationItemStatus(index) { // [Source: 86]
    const navLink = document.getElementById(`qnav-${index}`); // [Source: 86]
    if (navLink && userAnswers[index] !== null) { // [Source: 87]
        navLink.classList.add('answered'); // [Source: 87]
    } else if (navLink) { // [Source: 88]
        navLink.classList.remove('answered'); // [Source: 88]
    } // [Source: 89]
}


function highlightCurrentQuestionNav() { // [Source: 89]
    document.querySelectorAll('#question-navigation-table a').forEach(link => { // [Source: 89]
        link.classList.remove('current-q-nav'); // [Source: 89]
    });
    const currentNavLink = document.getElementById(`qnav-${currentQuestionIndex}`); // [Source: 90]
    if (currentNavLink) { // [Source: 90]
        currentNavLink.classList.add('current-q-nav'); // [Source: 90]
    } // [Source: 91]
}

function calculateScore() { // [Source: 91]
    let score = 0; // [Source: 91]
    let correctCount = 0; // [Source: 92]
    let incorrectCount = 0; // [Source: 92]
    currentQuestions.forEach((q, index) => { // [Source: 93]
        if (userAnswers[index] !== null && q && typeof q.answer === 'string') { // [Source: 93]
            if (userAnswers[index] === q.answer) { // [Source: 93]
                score++; // [Source: 93]
                correctCount++; // [Source: 93]
            } else { // [Source: 94]
                incorrectCount++; // [Source: 94]
            }
        }
    });
    // [Source: 95]
    return score; // [Source: 96]
} // [Source: 97]

function updateLiveFeedback() { // [Source: 97]
    let tempCorrect = 0; // [Source: 97]
    let tempIncorrect = 0; // [Source: 98]
    userAnswers.forEach((answer, index) => { // [Source: 99]
        if (answer !== null && currentQuestions[index]) { // [Source: 99]
            if (answer === currentQuestions[index].answer) { // [Source: 99]
                tempCorrect++; // [Source: 99]
            } else { // [Source: 99]
                tempIncorrect++; // [Source: 100]
            } // [Source: 100]
        }
    });
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = tempCorrect; // [Source: 101]
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = tempIncorrect; // [Source: 101]
} // [Source: 102]


if(nextButton) nextButton.addEventListener('click', () => { // [Source: 102]
    if (currentQuestionIndex < currentQuestions.length - 1) { // [Source: 102]
        displayQuestion(currentQuestionIndex + 1); // [Source: 102]
    }
});
if(backButton) backButton.addEventListener('click', () => { // [Source: 103]
    if (currentQuestionIndex > 0) { // [Source: 103]
        displayQuestion(currentQuestionIndex - 1); // [Source: 103]
    }
});

if(clearOptionButton) clearOptionButton.addEventListener('click', () => { // [Source: 104]
    if (userAnswers[currentQuestionIndex] === null) { // [Source: 104]
        const radioButtons = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`); // [Source: 104]
        radioButtons.forEach(radio => radio.checked = false); // [Source: 104]
        // userAnswers[currentQuestionIndex] is already null // [Source: 105]
        updateQuestionNavigationItemStatus(currentQuestionIndex); // [Source: 105]
        const currentLabels = document.querySelectorAll(`#question-${currentQuestionIndex} .options label`); // [Source: 105]
        currentLabels.forEach(label => { // [Source: 105]
            label.classList.remove('user-answer-correct', 'user-answer-incorrect'); // [Source: 105]
        }); // [Source: 106]
        const correctAnswerDisplay = document.getElementById(`correct-answer-${currentQuestionIndex}`); // [Source: 106]
        if(correctAnswerDisplay) { // [Source: 107]
            correctAnswerDisplay.style.display = 'none'; // [Source: 107]
            correctAnswerDisplay.innerHTML = ''; // [Source: 108]
        } // [Source: 109]
        updateLiveFeedback(); // [
