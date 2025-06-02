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
const testTitleElement = document.getElementById('test-title');
const submitButtonOriginal = document.getElementById('submit-test-btn'); // [Source: 5] // यह HTML से हटाया जा सकता है या छिपाया जा सकता है
const submitButtonSidebar = document.getElementById('submit-test-btn-sidebar');
const resultContainer = document.getElementById('result-container'); // [Source: 6]
const scoreElement = document.getElementById('score');

const backButton = document.getElementById('back-btn');
const nextButton = document.getElementById('next-btn');
const clearOptionButton = document.getElementById('clear-option-btn');
const navigationButtonsContainer = document.getElementById('navigation-buttons'); // [Source: 7]

const questionNavigationTable = document.getElementById('question-navigation-table');
const quizContent = document.getElementById('quiz-content'); // [Source: 8]
const decreaseFontButton = document.getElementById('decrease-font'); // [Source: 8]
const increaseFontButton = document.getElementById('increase-font'); // [Source: 8]
const currentFontSizeSpan = document.getElementById('current-font-size');
const shuffleQuestionsButton = document.getElementById('shuffle-questions-btn'); // [Source: 9]
const shuffleOptionsButton = document.getElementById('shuffle-options-btn');

const liveFeedbackContainer = document.getElementById('question-feedback-live');
const liveCorrectAnswersSpan = document.getElementById('live-correct-answers');
const liveIncorrectAnswersSpan = document.getElementById('live-incorrect-answers');

// --- नए एलिमेंट्स ---
const sidebar = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebar-toggle-btn');
// --- ---

let currentQuestions = []; // [Source: 10]
let userAnswers = []; // उपयोगकर्ताओं के उत्तरों को संग्रहीत करने के लिए
let currentQuestionIndex = 0; // [Source: 10]
let questionsShuffled = false; // [Source: 11]
let optionsShuffled = false; // [Source: 11]
let baseFontSize = 16; // [Source: 12] // पिक्सल में

// URL से यूनिट आईडी प्राप्त करें
const urlParams = new URLSearchParams(window.location.search);
const unitId = urlParams.get('unit'); // [Source: 12]

async function loadQuestions(unitId) { // [Source: 13]
    if (!unitId) {
        quizContainer.innerHTML = "<p>कोई यूनिट चयनित नहीं है। कृपया होम पेज पर वापस जाएं और एक यूनिट चुनें।</p>";
        return; // [Source: 14]
    }

    try {
        const unitRef = rtdb.ref(`tests/${unitId}`); // [Source: 14]
        const snapshot = await unitRef.get(); // [Source: 15]

        if (!snapshot.exists()) {
            quizContainer.innerHTML = "<p>यह टेस्ट यूनिट नहीं मिली।</p>";
            return; // [Source: 16]
        }

        const testData = snapshot.val(); // [Source: 16]
        testTitleElement.textContent = testData.title || `टेस्ट: ${unitId}`; // [Source: 16]
        currentQuestions = testData.questions; // [Source: 17]

        if (!currentQuestions || !Array.isArray(currentQuestions) || currentQuestions.length === 0) {
            quizContainer.innerHTML = "<p>इस यूनिट में कोई प्रश्न उपलब्ध नहीं है या सही फॉर्मेट में नहीं हैं।</p>";
            return; // [Source: 18]
        }

        userAnswers = new Array(currentQuestions.length).fill(null); // [Source: 18]
        currentQuestionIndex = 0; // [Source: 19] // पहले प्रश्न से शुरू करें

        if (questionsShuffled) { // [Source: 19]
            shuffleArray(currentQuestions);
        } // [Source: 20]
        if (optionsShuffled) { // [Source: 20]
            currentQuestions.forEach(q => shuffleArray(q.options));
        } // [Source: 21]

        renderAllQuestions(); // [Source: 21] // सभी प्रश्न कार्ड बनाएं (शुरू में छिपे हुए)
        displayQuestion(currentQuestionIndex); // [Source: 21]
        buildQuestionNavigation(); // [Source: 22]
        updateNavigationButtons(); // [Source: 22]
        if(submitButtonSidebar) submitButtonSidebar.style.display = 'block'; // [Source: 22]
        if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block'; // [Source: 23]
        if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block'; // [Source: 23] // लाइव फीडबैक दिखाएं
        updateLiveFeedback(); // [Source: 23]

    } catch (error) { // [Source: 24]
        console.error("प्रश्न लोड करने में त्रुटि:", error); // [Source: 24]
        quizContainer.innerHTML = "<p>प्रश्न लोड करने में विफल।</p>"; // [Source: 25]
    }
}

function shuffleArray(array) { // [Source: 25]
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // [Source: 25]
        [array[i], array[j]] = [array[j], array[i]]; // [Source: 26]
    }
}

function renderAllQuestions() { // [Source: 26]
    let questionsHtml = ''; // [Source: 26]
    currentQuestions.forEach((q, index) => { // [Source: 27]
        if (q && typeof q.question === 'string' && Array.isArray(q.options)) { // [Source: 27]
            questionsHtml += `
                <div class="question-card" id="question-${index}">
                    <p><b>प्रश्न ${index + 1}:</b> ${q.question}</p>
                    <div class="options">
            `; // [Source: 28]
            q.options.forEach((option, i) => { // [Source: 28]
                const optionValue = typeof option === 'object' && option !== null ? option.text : option; // [Source: 28]
                const optionDisplay = optionValue; // [Source: 29]

                questionsHtml += `
                        <label>
                            <input type="radio" name="question${index}" value="${optionValue}">
                            <span>${optionDisplay}</span>
                        </label>
                `; // [Source: 30]
            });
            questionsHtml += `
                    </div>
                    <div class="correct-answer-display" id="correct-answer-${index}" style="display:none;"></div>
                </div>
            `; // [Source: 31]
        } else { // [Source: 32]
            console.warn(`प्रश्न ${index + 1} का फॉर्मेट सही नहीं है:`, q); // [Source: 32]
        } // [Source: 33]
    });
    quizContainer.innerHTML = questionsHtml; // [Source: 33]

    currentQuestions.forEach((_, questionIndex) => { // [Source: 33]
        const radioButtons = document.querySelectorAll(`input[name="question${questionIndex}"]`); // [Source: 33]
        radioButtons.forEach(radio => { // [Source: 33]
            radio.addEventListener('change', (event) => { // [Source: 33]
                handleOptionSelection(questionIndex, event.target);
            });
        });
    }); // [Source: 35]
}

function handleOptionSelection(questionIndex, selectedRadio) {
    if (selectedRadio.disabled) return;

    userAnswers[questionIndex] = selectedRadio.value; // [Source: 35]
    updateQuestionNavigationItemStatus(questionIndex); // [Source: 34]
    updateLiveFeedback(); // [Source: 34]

    const questionData = currentQuestions[questionIndex]; // [Source: 35]
    const optionsContainer = selectedRadio.closest('.options'); // [Source: 35]
    const allLabelsInQuestion = optionsContainer.querySelectorAll('label'); // [Source: 35]
    const selectedLabel = selectedRadio.parentElement; // [Source: 35]

    const allRadioButtonsInQuestion = optionsContainer.querySelectorAll(`input[name="question${questionIndex}"]`); // [Source: 35]
    allRadioButtonsInQuestion.forEach(rb => rb.disabled = true); // [Source: 35]

    allLabelsInQuestion.forEach(label => { // [Source: 35]
        label.classList.remove('user-answer-correct', 'user-answer-incorrect'); // [Source: 35]
    });

    if (questionData && typeof questionData.answer === 'string') { // [Source: 35]
        if (selectedRadio.value === questionData.answer) { // [Source: 35]
            selectedLabel.classList.add('user-answer-correct'); // [Source: 35]
        } else { // [Source: 35]
            selectedLabel.classList.add('user-answer-incorrect'); // [Source: 35]
        }
    }

    const correctAnswerDisplay = document.getElementById(`correct-answer-${questionIndex}`); // [Source: 35]
    if (correctAnswerDisplay && questionData && questionData.answer) { // [Source: 35]
        correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`; // [Source: 35]
        correctAnswerDisplay.style.display = 'block'; // [Source: 35]
    }
    if(clearOptionButton) clearOptionButton.disabled = true; // क्लियर बटन को अक्षम करें
}


function displayQuestion(index) { // [Source: 35]
    document.querySelectorAll('.question-card').forEach(card => { // [Source: 35]
        card.classList.remove('active'); // [Source: 35]
    });
    const currentQuestionCard = document.getElementById(`question-${index}`); // [Source: 36]
    if (currentQuestionCard) { // [Source: 36]
        currentQuestionCard.classList.add('active'); // [Source: 36]
    } // [Source: 37]
    currentQuestionIndex = index; // [Source: 37]
    updateNavigationButtons(); // [Source: 37]
    highlightCurrentQuestionNav(); // [Source: 37]

    if (userAnswers[index] !== null) { // [Source: 37]
        const selectedRadioButton = document.querySelector(`input[name="question${index}"][value="${userAnswers[index]}"]`); // [Source: 37]
        if (selectedRadioButton) { // [Source: 38]
            selectedRadioButton.checked = true; // [Source: 38]
            // अगर उत्तर पहले से दिया गया है तो उसे फिर से लॉक और स्टाइल करें
             // handleOptionSelection(index, selectedRadioButton); // यह एक अनंत लूप बना सकता है यदि disable न हो।
             // सुनिश्चित करें कि पहले से दिए गए उत्तरों के लिए UI सही से अपडेट हो।
            const allRadioButtonsInQuestion = document.querySelectorAll(`input[name="question${index}"]`);
            allRadioButtonsInQuestion.forEach(rb => rb.disabled = true);

            const questionData = currentQuestions[index];
            const selectedLabel = selectedRadioButton.parentElement;
            if (selectedLabel && questionData && questionData.answer) {
                if (selectedRadioButton.value === questionData.answer) {
                    selectedLabel.classList.add('user-answer-correct');
                } else {
                    selectedLabel.classList.add('user-answer-incorrect');
                }
                const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`);
                if (correctAnswerDisplay) {
                    correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`;
                    correctAnswerDisplay.style.display = 'block';
                }
            }
        } // [Source: 39]
    } else {
        // यदि कोई उत्तर नहीं दिया गया है, तो रेडियो बटन सक्षम होने चाहिए
        const allRadioButtonsInQuestion = document.querySelectorAll(`input[name="question${index}"]`);
        allRadioButtonsInQuestion.forEach(rb => rb.disabled = false);
        if(clearOptionButton) clearOptionButton.disabled = false; // क्लियर बटन को सक्षम करें
        const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`);
        if(correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
    }
}

function updateNavigationButtons() { // [Source: 39]
    if(backButton) backButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none'; // [Source: 39]
    if(nextButton) nextButton.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-block' : 'none'; // [Source: 40]
    if(clearOptionButton) { // [Source: 40]
        // क्लियर बटन केवल तभी दिखाएं/सक्षम करें यदि वर्तमान प्रश्न का उत्तर नहीं दिया गया है
        if (userAnswers[currentQuestionIndex] !== null) {
            clearOptionButton.style.display = 'inline-block'; // दिखाएँ
            clearOptionButton.disabled = true; // पर अक्षम
        } else {
            clearOptionButton.style.display = 'inline-block'; // दिखाएँ
            clearOptionButton.disabled = false; // और सक्षम
        }
    }
} // [Source: 41]

function buildQuestionNavigation() { // [Source: 41]
    let navHtml = ''; // [Source: 41]
    currentQuestions.forEach((_, index) => { // [Source: 42]
        navHtml += `<a href="#" data-qindex="${index}" id="qnav-${index}">${index + 1}</a>`; // [Source: 42]
    });
    if(questionNavigationTable) questionNavigationTable.innerHTML = navHtml; // [Source: 43]

    document.querySelectorAll('#question-navigation-table a').forEach(link => { // [Source: 43]
        link.addEventListener('click', (e) => { // [Source: 43]
            e.preventDefault(); // [Source: 43]
            const qIndex = parseInt(e.target.dataset.qindex); // [Source: 43]
            displayQuestion(qIndex); // [Source: 43]
        });
    });
    highlightCurrentQuestionNav(); // [Source: 44]
}

function updateQuestionNavigationItemStatus(index) { // [Source: 44]
    const navLink = document.getElementById(`qnav-${index}`); // [Source: 44]
    if (navLink && userAnswers[index] !== null) { // [Source: 45]
        navLink.classList.add('answered'); // [Source: 45]
    } else if (navLink) { // [Source: 46]
        navLink.classList.remove('answered'); // [Source: 46]
    } // [Source: 47]
}


function highlightCurrentQuestionNav() { // [Source: 47]
    document.querySelectorAll('#question-navigation-table a').forEach(link => { // [Source: 47]
        link.classList.remove('current-q-nav'); // [Source: 47]
    });
    const currentNavLink = document.getElementById(`qnav-${currentQuestionIndex}`); // [Source: 48]
    if (currentNavLink) { // [Source: 48]
        currentNavLink.classList.add('current-q-nav'); // [Source: 48]
    } // [Source: 49]
}

function calculateScore() { // [Source: 49]
    let score = 0; // [Source: 49]
    let correctCount = 0; // [Source: 49]
    let incorrectCount = 0; // [Source: 49]
    currentQuestions.forEach((q, index) => { // [Source: 50]
        if (userAnswers[index] !== null && q && typeof q.answer === 'string') { // [Source: 50]
            if (userAnswers[index] === q.answer) { // [Source: 50]
                score++; // [Source: 50]
                correctCount++; // [Source: 50]
            } else { // [Source: 50]
                incorrectCount++; // [Source: 51]
            }
        }
    });
    // [Source: 52] // लाइव फीडबैक स्पैन भी अपडेट कर सकते हैं यदि आवश्यक हो, हालांकि यह सबमिट के समय है
    // liveCorrectAnswersSpan.textContent = correctCount;
    // liveIncorrectAnswersSpan.textContent = incorrectCount; // [Source: 53]
    return score; // [Source: 53]
}

function updateLiveFeedback() { // [Source: 53]
    let tempCorrect = 0; // [Source: 53]
    let tempIncorrect = 0; // [Source: 53]
    userAnswers.forEach((answer, index) => { // [Source: 54]
        if (answer !== null) { // [Source: 54]
            if (currentQuestions[index] && answer === currentQuestions[index].answer) { // [Source: 54]
                tempCorrect++; // [Source: 54]
            } else if (currentQuestions[index]) { // [Source: 54]
                tempIncorrect++; // [Source: 54]
            } // [Source: 55]
        }
    });
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = tempCorrect; // [Source: 56]
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = tempIncorrect; // [Source: 56]
}


if(nextButton) nextButton.addEventListener('click', () => { // [Source: 56]
    if (currentQuestionIndex < currentQuestions.length - 1) { // [Source: 56]
        displayQuestion(currentQuestionIndex + 1); // [Source: 56]
    }
});
if(backButton) backButton.addEventListener('click', () => { // [Source: 57]
    if (currentQuestionIndex > 0) { // [Source: 57]
        displayQuestion(currentQuestionIndex - 1); // [Source: 57]
    }
});

if(clearOptionButton) clearOptionButton.addEventListener('click', () => { // [Source: 58]
    // यह सुनिश्चित करें कि clearOptionButton का लॉजिक handleOptionSelection और displayQuestion के साथ सिंक में हो
    // यदि उत्तर लॉक है, तो क्लियर नहीं होना चाहिए।
    if (userAnswers[currentQuestionIndex] === null) { // केवल तभी साफ़ करें यदि कोई उत्तर चयनित नहीं (या पहले से साफ़ है)
        const radioButtons = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`); // [Source: 58]
        radioButtons.forEach(radio => radio.checked = false); // [Source: 58]
        // userAnswers[currentQuestionIndex] = null; // यह पहले से null होना चाहिए
        updateQuestionNavigationItemStatus(currentQuestionIndex); // [Source: 58]
        const currentLabels = document.querySelectorAll(`#question-${currentQuestionIndex} .options label`); // [Source: 58]
        currentLabels.forEach(label => { // [Source: 58]
            label.classList.remove('user-answer-correct', 'user-answer-incorrect'); // [Source: 58]
        });
        const correctAnswerDisplay = document.getElementById(`correct-answer-${currentQuestionIndex}`); // [Source: 58]
        if(correctAnswerDisplay) { // [Source: 58]
            correctAnswerDisplay.style.display = 'none'; // [Source: 58]
            correctAnswerDisplay.innerHTML = ''; // [Source: 58]
        }
        updateLiveFeedback(); // [Source: 58]
    } else {
        alert("उत्तर पहले ही दिया जा चुका है और लॉक है।");
    }
});

if(submitButtonSidebar) submitButtonSidebar.addEventListener('click', () => { // [Source: 59]
    const totalScore = calculateScore(); // [Source: 59]
    if(scoreElement) scoreElement.textContent = `${totalScore} / ${currentQuestions.length}`; // [Source: 59]
    if(resultContainer) resultContainer.style.display = 'block'; // [Source: 59]
    if(submitButtonSidebar) submitButtonSidebar.style.display = 'none'; // [Source: 59]
    if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'none'; // [Source: 59]
    if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'none'; // [Source: 59]

    if(decreaseFontButton) decreaseFontButton.disabled = true; // [Source: 59]
    if(increaseFontButton) increaseFontButton.disabled = true; // [Source: 59]
    if(shuffleQuestionsButton) shuffleQuestionsButton.disabled = true; // [Source: 59]
    if(shuffleOptionsButton) shuffleOptionsButton.disabled = true; // [Source: 59]
    document.querySelectorAll('#question-navigation-table a').forEach(link => link.style.pointerEvents = 'none'); // [Source: 59]

    currentQuestions.forEach((q, index) => { // [Source: 60]
        const questionCard = document.getElementById(`question-${index}`); // [Source: 60]
        if (!questionCard) return; // [Source: 60]

        if(!questionCard.classList.contains('active')) { // [Source: 61]
             // questionCard.classList.add('active'); // [Source: 61]
        } // [Source: 62]


        const correctAnswerElement = document.createElement('p'); // [Source: 62]
        correctAnswerElement.innerHTML = `<b>सही उत्तर:</b> ${q.answer || 'उपलब्ध नहीं'}`; // [Source: 63]
        correctAnswerElement.classList.add('correct-answer-text'); // [Source: 63]

        const optionsContainer = questionCard.querySelector('.options'); // [Source: 63]
        if (optionsContainer) { // [Source: 64]
            // सही उत्तर पहले से ही handleOptionSelection द्वारा दिखाया जा रहा होगा,
            // इसलिए दोबारा जोड़ने की आवश्यकता नहीं है, बस यह सुनिश्चित करें कि यह दृश्यमान है।
            const caDisplay = questionCard.querySelector(`#correct-answer-${index}`);
            if(caDisplay && q.answer){
                caDisplay.innerHTML = `<b>सही उत्तर:</b> ${q.answer}`;
                caDisplay.style.display = 'block';
            } else if (caDisplay) { // यदि उत्तर नहीं है
                 caDisplay.innerHTML = `<b>सही उत्तर:</b> उपलब्ध नहीं`;
                 caDisplay.style.display = 'block';
            }
        } // [Source: 66] (else if condition missing in original)


        const selectedOptionValue = userAnswers[index]; // [Source: 66]
        const radioInputs = questionCard.querySelectorAll(`input[name="question${index}"]`); // [Source: 67]

        radioInputs.forEach(input => { // [Source: 67]
            input.disabled = true; // [Source: 67]
            const parentLabel = input.parentElement; // [Source: 67]
            if (parentLabel) { // [Source: 67]
                // रंग पहले से ही handleOptionSelection द्वारा सेट किए गए होने चाहिए
                // parentLabel.classList.remove('user-answer-correct', 'user-answer-incorrect');
                // if (selectedOptionValue === input.value) {
                //     if (q.answer && selectedOptionValue === q.answer) { // [Source: 68]
                //         parentLabel.classList.add('user-answer-correct');
                //     } else if (q.answer) {
                //         parentLabel.classList.add('user-answer-incorrect');
                //     } // [Source: 69]
                // }
                // else if (input.value === q.answer) { // [Source: 69]
                // } // [Source: 70]
            }
        });
    }); // [Source: 71]
    if(resultContainer) resultContainer.scrollIntoView({ behavior: 'smooth' }); // [Source: 72]
});

// [Source: 73] // फ़ॉन्ट आकार नियंत्रण
if(increaseFontButton) increaseFontButton.addEventListener('click', () => { // [Source: 73]
    if (baseFontSize < 24) { // [Source: 73]
        baseFontSize += 2; // [Source: 73]
        if(quizContent) quizContent.style.fontSize = `${baseFontSize}px`; // [Source: 73]
        if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`; // [Source: 73]
    }
});
if(decreaseFontButton) decreaseFontButton.addEventListener('click', () => { // [Source: 74]
    if (baseFontSize > 12) { // [Source: 74]
        baseFontSize -= 2; // [Source: 74]
        if(quizContent) quizContent.style.fontSize = `${baseFontSize}px`; // [Source: 74]
        if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`; // [Source: 74]
    }
});

// [Source: 75] // शफल प्रश्न
if(shuffleQuestionsButton) shuffleQuestionsButton.addEventListener('click', () => { // [Source: 75]
    if (confirm("क्या आप प्रश्नों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) { // [Source: 75]
        questionsShuffled = true; // [Source: 75]
        optionsShuffled = false; // [Source: 75]
        resetQuizStateAndReload(); // [Source: 75]
    }
});

// [Source: 76] // शफल विकल्प
if(shuffleOptionsButton) shuffleOptionsButton.addEventListener('click', () => { // [Source: 76]
    if (confirm("क्या आप विकल्पों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) { // [Source: 76]
        optionsShuffled = true; // [Source: 76]
        resetQuizStateAndReload(); // [Source: 76]
    }
});

function resetQuizStateAndReload() { // [Source: 77]
    currentQuestionIndex = 0; // [Source: 77]
    userAnswers = []; // [Source: 77]
    if(quizContainer) quizContainer.innerHTML = '<p>प्रश्न पुनः लोड हो रहे हैं...</p>'; // [Source: 77]
    if(resultContainer) resultContainer.style.display = 'none'; // [Source: 78]
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = '0'; // [Source: 78]
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = '0'; // [Source: 78]
    if(submitButtonSidebar) submitButtonSidebar.style.display = 'block'; // [Source: 78]
    if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block'; // [Source: 79]
    if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block'; // [Source: 79]
    if(decreaseFontButton) decreaseFontButton.disabled = false; // [Source: 79]
    if(increaseFontButton) increaseFontButton.disabled = false; // [Source: 79]
    if(shuffleQuestionsButton) shuffleQuestionsButton.disabled = false; // [Source: 79]
    if(shuffleOptionsButton) shuffleOptionsButton.disabled = false; // [Source: 79]

    loadQuestions(unitId); // [Source: 79]
} // [Source: 80]


// --- साइडबार टॉगल लॉजिक ---
if (sidebarToggleButton && sidebar) {
    sidebarToggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        // यदि आप मुख्य सामग्री को भी समायोजित करना चाहते हैं:
        // document.getElementById('quiz-content').classList.toggle('content-shifted');
    });
}
// --- ---


// पेज लोड होने पर प्रश्न लोड करें
window.onload = () => { // [Source: 80]
    const urlParams = new URLSearchParams(window.location.search); // [Source: 80]
    const unitId = urlParams.get('unit'); // [Source: 81]
    console.log("WINDOW ONLOAD - CALLING loadQuestions with unitId:", unitId); // [Source: 81]
    loadQuestions(unitId); // [Source: 81]
    if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`; // [Source: 81]

    // साइडबार की प्रारंभिक स्थिति (CSS में .sidebar-hidden द्वारा नियंत्रित किया जा सकता है)
    // या यदि आप चाहते हैं कि यह JS द्वारा नियंत्रित हो:
    // if (sidebar && !sidebar.classList.contains('sidebar-hidden')) {
    //     sidebar.classList.add('sidebar-hidden'); // शुरू में छिपा हुआ
    // }
};
