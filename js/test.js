// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें (main.js के समान)
const firebaseConfig = {
    apiKey: "AIzaSyA5MtfhOJkaZQlRTkzSKZuPtq4dmrsg9sc",
    authDomain: "aitestbook.firebaseapp.com",
    projectId: "aitestbook",
    databaseURL: "https://aitestbook-default-rtdb.asia-southeast1.firebasedatabase.app/",
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
const auth = firebase.auth(); // Firebase Authentication सर्विस को एक्सेस करें
const googleProvider = new firebase.auth.GoogleAuthProvider(); // Google Auth Provider

const quizContainer = document.getElementById('quiz-container');
const testTitleElement = document.getElementById('test-title');
const submitButtonSidebar = document.getElementById('submit-test-btn-sidebar');
const resultContainer = document.getElementById('result-container');
const scoreElement = document.getElementById('score');

const backButton = document.getElementById('back-btn');
const nextButton = document.getElementById('next-btn');
const clearOptionButton = document.getElementById('clear-option-btn');
const navigationButtonsContainer = document.getElementById('navigation-buttons');

const questionNavigationTable = document.getElementById('question-navigation-table');
const quizContent = document.getElementById('quiz-content');
const decreaseFontButton = document.getElementById('decrease-font');
const increaseFontButton = document.getElementById('increase-font');
const currentFontSizeSpan = document.getElementById('current-font-size');
const shuffleQuestionsButton = document.getElementById('shuffle-questions-btn');
const shuffleOptionsButton = document.getElementById('shuffle-options-btn');

const liveFeedbackContainer = document.getElementById('question-feedback-live');
const liveCorrectAnswersSpan = document.getElementById('live-correct-answers');
const liveIncorrectAnswersSpan = document.getElementById('live-incorrect-answers');

// --- नए एलिमेंट्स ---
const sidebar = document.getElementById('sidebar');
const sidebarToggleButton = document.getElementById('sidebar-toggle-btn');
const body = document.body; // Get the body element for sidebar class toggling

// Auth Modal Elements (copied from index.html)
const authModal = document.getElementById('auth-modal');
const authModalTitle = document.getElementById('auth-modal-title');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const googleSignInBtn = document.getElementById('google-signin-btn');
const closeButtons = document.querySelectorAll('.modal .close-button');
const toggleSignupLink = document.getElementById('toggle-signup');
const toggleLoginLink = document.getElementById('toggle-login');

// Header Auth Elements (copied from index.html)
const authButton = document.getElementById('auth-button');
const userDisplay = document.getElementById('user-display');
const userProfilePic = document.getElementById('user-profile-pic');

// Profile Modal Elements (copied from index.html)
const profileModal = document.getElementById('profile-modal');
const profilePicModal = document.getElementById('profile-pic-modal');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileProvider = document.getElementById('profile-provider');
const profileLogoutBtn = document.getElementById('profile-logout-btn');
// --- ---

let currentQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let questionsShuffled = false;
let optionsShuffled = false;
let baseFontSize = 16; // पिक्सल में
let currentUser = null; // वर्तमान में लॉग-इन उपयोगकर्ता

// URL से यूनिट आईडी प्राप्त करें
const urlParams = new URLSearchParams(window.location.search);
const unitId = urlParams.get('unit');
const viewResultsMode = urlParams.get('viewResults') === 'true'; // New flag for viewing results

// ====================================================================================
// Functions for loading/saving user data (Moved to global scope for accessibility)
// ====================================================================================

async function loadUserDataFromFirebase(uid, unitId) {
    try {
        const userTestRef = rtdb.ref(`users/${uid}/tests/${unitId}`);
        const snapshot = await userTestRef.get();
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.userAnswers) {
                userAnswers = userData.userAnswers;
            }
            if (userData.currentQuestionIndex !== undefined) {
                currentQuestionIndex = userData.currentQuestionIndex;
            }
            if (userData.questionsShuffled !== undefined) {
                questionsShuffled = userData.questionsShuffled;
            }
            if (userData.optionsShuffled !== undefined) {
                optionsShuffled = userData.optionsShuffled;
            }
            if (userData.baseFontSize !== undefined) {
                baseFontSize = userData.baseFontSize;
                updateFontSize(); // Update font size immediately after loading
            }
            console.log("Firebase से डेटा लोड किया गया:", userData);
        } else {
            console.log("Firebase में कोई डेटा नहीं मिला, localStorage से लोड कर रहा हूँ।");
            loadUserDataFromLocalStorage(unitId); // Fallback to localStorage
        }
    } catch (error) {
        console.error("Firebase से उपयोगकर्ता डेटा लोड करने में त्रुटि:", error);
        loadUserDataFromLocalStorage(unitId); // On error, try localStorage
    }
    // Only load questions AFTER data is loaded or fallback is attempted
    loadQuestions(unitId);
}

function loadUserDataFromLocalStorage(unitId) {
    const localData = JSON.parse(localStorage.getItem(`testProgress_${unitId}`) || '{}');
    if (localData.userAnswers) {
        userAnswers = localData.userAnswers;
    } else {
        userAnswers = []; 
    }
    if (localData.currentQuestionIndex !== undefined) {
        currentQuestionIndex = localData.currentQuestionIndex;
    } else {
        currentQuestionIndex = 0;
    }
    if (localData.questionsShuffled !== undefined) {
        questionsShuffled = localData.questionsShuffled;
    } else {
        questionsShuffled = false;
    }
    if (localData.optionsShuffled !== undefined) {
        optionsShuffled = localData.optionsShuffled;
    } else {
        optionsShuffled = false;
    }
    if (localData.baseFontSize !== undefined) {
        baseFontSize = localData.baseFontSize;
    } else {
        baseFontSize = 16;
    }
    updateFontSize(); // Update font size immediately after loading
    console.log("localStorage से डेटा लोड किया गया:", localData);
    // Only load questions AFTER data is loaded
    loadQuestions(unitId);
}

function saveUserData() {
    const dataToSave = {
        userAnswers: userAnswers,
        currentQuestionIndex: currentQuestionIndex,
        questionsShuffled: questionsShuffled,
        optionsShuffled: optionsShuffled,
        baseFontSize: baseFontSize
    };

    localStorage.setItem(`testProgress_${unitId}`, JSON.stringify(dataToSave));

    if (currentUser) {
        const userTestRef = rtdb.ref(`users/${currentUser.uid}/tests/${unitId}`);
        userTestRef.set(dataToSave)
            .then(() => console.log("Firebase में डेटा सफलतापूर्वक सहेजा गया।"))
            .catch(error => console.error("Firebase में डेटा सहेजने में त्रुटि:", error));
    }
}

// ====================================================================================
// Authentication Logic
// ====================================================================================
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        userDisplay.textContent = ''; // ईमेल डिस्प्ले हटा दिया गया है
        if (user.photoURL) {
            userProfilePic.src = user.photoURL;
        } else {
            const firstLetter = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
            userProfilePic.src = `https://via.placeholder.com/40/CCCCCC/FFFFFF?text=${firstLetter}`;
        }
        userProfilePic.style.display = 'block';
        authButton.textContent = 'Logout';
        authButton.classList.add('logout');
        // Call loadUserDataFromFirebase after currentUser is set
        loadUserDataFromFirebase(user.uid, unitId);
        authModal.style.display = 'none'; // Make sure modal is hidden on login
        profileModal.style.display = 'none'; // Ensure profile modal is hidden
    } else {
        userDisplay.textContent = 'Guest';
        userProfilePic.style.display = 'none';
        userProfilePic.src = 'https://via.placeholder.com/40/CCCCCC/FFFFFF?text=P';
        authButton.textContent = 'Login';
        authButton.classList.remove('logout');
        // Call loadUserDataFromLocalStorage after currentUser is set
        loadUserDataFromLocalStorage(unitId);
        profileModal.style.display = 'none'; // Ensure profile modal is hidden
    }
});

// Open Auth Modal
if (authButton) {
    authButton.addEventListener('click', () => {
        if (currentUser) {
            // Logout
            auth.signOut()
                .then(() => alert('आप लॉग आउट हो गए हैं।'))
                .catch(error => console.error('लॉग आउट त्रुटि:', error.message));
        } else {
            // Login/Signup Modal दिखाएं
            authModal.style.display = 'block';
            authModalTitle.textContent = 'Login';
            authSubmitBtn.textContent = 'Login';
            toggleLoginLink.style.display = 'none';
            toggleSignupLink.style.display = 'inline';
            googleSignInBtn.style.display = 'block'; // Show Google button for login
            authForm.reset(); // फॉर्म को साफ़ करें
        }
    });
}

// Open Profile Modal on picture click
if (userProfilePic) {
    userProfilePic.addEventListener('click', () => {
        if (currentUser) {
            profileModal.style.display = 'block';
            // Set profile pic in modal
            if (currentUser.photoURL) {
                profilePicModal.src = currentUser.photoURL;
            } else {
                const firstLetter = (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase();
                profilePicModal.src = `https://via.placeholder.com/80/CCCCCC/FFFFFF?text=${firstLetter}`;
            }
            profileName.textContent = currentUser.displayName || 'N/A';
            profileEmail.textContent = currentUser.email || 'N/A';
            profileUid.textContent = currentUser.uid;
            profileProvider.textContent = currentUser.providerData[0] ? currentUser.providerData[0].providerId.replace('firebase.', '').replace('.com', '') : 'N/A';
        }
    });
}

// Handle multiple close buttons for modals
if (closeButtons) {
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modal;
            document.getElementById(modalId).style.display = 'none';
        });
    });
}

// Click outside modal to close (updated for both modals)
window.addEventListener('click', (event) => {
    if (event.target == authModal) {
        authModal.style.display = 'none';
    }
    if (event.target == profileModal) {
        profileModal.style.display = 'none';
    }
});

// Toggle between Login and Sign Up
if (toggleSignupLink) {
    toggleSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        authModalTitle.textContent = 'Sign Up';
        authSubmitBtn.textContent = 'Sign Up';
        toggleSignupLink.style.display = 'none';
        toggleLoginLink.style.display = 'inline';
        googleSignInBtn.style.display = 'none'; // Hide Google button during email signup
        authForm.reset();
    });
}

if (toggleLoginLink) {
    toggleLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        authModalTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        toggleLoginLink.style.display = 'none';
        toggleSignupLink.style.display = 'inline';
        googleSignInBtn.style.display = 'block'; // Show Google button during email login
        authForm.reset();
    });
}

// Handle Login/Sign Up Form Submission (Email/Password)
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const isLogin = authSubmitBtn.textContent === 'Login';

        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
                alert('सफलतापूर्वक लॉग इन किया गया!');
            } else {
                await auth.createUserWithEmailAndPassword(email, password);
                alert('खाता सफलतापूर्वक बनाया गया और लॉग इन किया गया!');
            }
            authModal.style.display = 'none'; // Close modal on success
        } catch (error) {
            alert(`Authentication Error: ${error.message}`);
        }
    });
}

// Handle Google Sign-in
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        try {
            await auth.signInWithPopup(googleProvider);
            alert('Google से सफलतापूर्वक लॉग इन किया गया!');
            authModal.style.display = 'none'; // Close modal on success
        } catch (error) {
            console.error("Google Sign-in Error:", error);
            alert(`Google Sign-in Error: ${error.message}`);
        }
    });
}

// Handle Profile Modal Logout Button
if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => alert('आप लॉग आउट हो गए हैं।'))
            .catch(error => console.error('लॉग आउट त्रुटि:', error.message));
        profileModal.style.display = 'none'; // Close profile modal
    });
}


// ====================================================================================
// Quiz/Test Specific Logic (Existing and corrected)
// ====================================================================================

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

        // IMPORTANT: Initialize or resize userAnswers ONLY if necessary,
        // after currentQuestions are loaded.
        // This ensures that if no previous answers were loaded (e.g., first time or new test),
        // the userAnswers array matches the current number of questions.
        if (userAnswers.length !== currentQuestions.length) {
            userAnswers = new Array(currentQuestions.length).fill(null);
        }
        
        // If data was loaded from Firebase/LocalStorage, questionsShuffled/optionsShuffled
        // would have been set. Apply shuffling if those flags are true.
        if (questionsShuffled) {
            shuffleArray(currentQuestions);
        }
        if (optionsShuffled) {
            currentQuestions.forEach(q => shuffleArray(q.options));
        }

        renderAllQuestions();
        displayQuestion(currentQuestionIndex);
        buildQuestionNavigation();
        updateNavigationButtons();
        
        // Check if in "view results" mode
        if (viewResultsMode) {
            submitButtonSidebar.style.display = 'none'; // Hide submit button
            navigationButtonsContainer.style.display = 'none'; // Hide nav buttons
            liveFeedbackContainer.style.display = 'none'; // Hide live feedback
            displayFinalResults(); // Display results immediately
            disableAllTestControls(); // Disable all controls
            quizContainer.querySelectorAll('.question-card').forEach(card => card.classList.add('active')); // Show all questions for review
            // Adjust currentQuestionIndex and displayQuestion to scroll through all if necessary.
            // For now, we'll just show all at once after submission.
            // You might want to implement a custom navigation for review mode.
        } else {
            // Normal test taking mode
            if(submitButtonSidebar) submitButtonSidebar.style.display = 'block';
            if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block';
            if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block';
        }
        
        updateLiveFeedback();
        updateFontSize();

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
                const optionValue = typeof option === 'object' && option !== null ? option.text : option;
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
                    <div class="correct-answer-display" id="correct-answer-${index}" style="display:none;"></div>
                </div>
            `;
        } else {
            console.warn(`प्रश्न ${index + 1} का फॉर्मेट सही नहीं है:`, q);
        }
    });
    quizContainer.innerHTML = questionsHtml;

    currentQuestions.forEach((_, questionIndex) => {
        const radioButtons = document.querySelectorAll(`input[name="question${questionIndex}"]`);
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (event) => {
                handleOptionSelection(questionIndex, event.target);
            });
        });
    });
}

function handleOptionSelection(questionIndex, selectedRadio) {
    // Only proceed if the radio button is not disabled
    if (selectedRadio.disabled) return;

    userAnswers[questionIndex] = selectedRadio.value;
    updateQuestionNavigationItemStatus(questionIndex);
    updateLiveFeedback();
    saveUserData(); // Save user data after selection

    const questionData = currentQuestions[questionIndex];
    const optionsContainer = selectedRadio.closest('.options');
    const allLabelsInQuestion = optionsContainer.querySelectorAll('label');
    const selectedLabel = selectedRadio.parentElement;

    const allRadioButtonsInQuestion = optionsContainer.querySelectorAll(`input[name="question${questionIndex}"]`);
    allRadioButtonsInQuestion.forEach(rb => rb.disabled = true); // Disable all radio buttons after selection

    allLabelsInQuestion.forEach(label => {
        label.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer'); // Remove old classes
    });

    if (questionData && typeof questionData.answer === 'string') {
        if (selectedRadio.value === questionData.answer) {
            selectedLabel.classList.add('user-answer-correct');
        } else {
            selectedLabel.classList.add('user-answer-incorrect');
            // If incorrect, highlight the actual correct option
            const correctOptionLabel = document.querySelector(`input[name="question${questionIndex}"][value="${questionData.answer}"]`);
            if (correctOptionLabel) {
                correctOptionLabel.parentElement.classList.add('highlight-correct-answer');
            }
        }
    }

    const correctAnswerDisplay = document.getElementById(`correct-answer-${questionIndex}`);
    if (correctAnswerDisplay && questionData && questionData.answer) {
        correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`;
        correctAnswerDisplay.style.display = 'block';
    }
    if(clearOptionButton) clearOptionButton.disabled = true; // Disable clear button after an answer is given
}


function displayQuestion(index) {
    // Ensure index is within bounds
    if (index < 0 || index >= currentQuestions.length) {
        console.warn("अमान्य प्रश्न इंडेक्स:", index);
        return;
    }

    document.querySelectorAll('.question-card').forEach(card => {
        card.classList.remove('active');
    });
    const currentQuestionCard = document.getElementById(`question-${index}`);
    if (currentQuestionCard) {
        currentQuestionCard.classList.add('active');
    }
    currentQuestionIndex = index;
    saveUserData(); // Save current question index

    updateNavigationButtons();
    highlightCurrentQuestionNav();

    const radioButtons = document.querySelectorAll(`input[name="question${index}"]`);
    const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`);
    const questionData = currentQuestions[index];

    // Remove all feedback classes from all option labels for this question
    document.querySelectorAll(`#question-${index} .options label`).forEach(label => {
        label.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer');
    });

    if (userAnswers[index] !== null) {
        const selectedRadioButton = document.querySelector(`input[name="question${index}"][value="${userAnswers[index]}"]`);
        if (selectedRadioButton) {
            selectedRadioButton.checked = true;
            
            // Lock and style if answer was previously given
            radioButtons.forEach(rb => rb.disabled = true);

            const selectedLabel = selectedRadioButton.parentElement;
            if (selectedLabel && questionData && questionData.answer) {
                if (selectedRadioButton.value === questionData.answer) {
                    selectedLabel.classList.add('user-answer-correct');
                } else {
                    selectedLabel.classList.add('user-answer-incorrect');
                    // If incorrect, highlight the actual correct option
                    const correctOptionLabel = document.querySelector(`input[name="question${index}"][value="${questionData.answer}"]`);
                    if (correctOptionLabel) {
                        correctOptionLabel.parentElement.classList.add('highlight-correct-answer');
                    }
                }
            }
        }
        if(correctAnswerDisplay && questionData && questionData.answer) {
            correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${questionData.answer}`;
            correctAnswerDisplay.style.display = 'block';
        }
        if(clearOptionButton) clearOptionButton.disabled = true; // Clear button disabled if answer given
    } else {
        // If no answer given, radio buttons should be enabled
        radioButtons.forEach(rb => rb.disabled = false);
        if(clearOptionButton) clearOptionButton.disabled = false; // Clear button enabled
        if(correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
        if(correctAnswerDisplay) correctAnswerDisplay.innerHTML = '';
    }
}

function updateNavigationButtons() {
    if(backButton) backButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    if(nextButton) nextButton.style.display = currentQuestionIndex < currentQuestions.length - 1 ? 'inline-block' : 'none';
    if(clearOptionButton) {
        // Clear button only shows/enables if no answer is given for current question
        if (userAnswers[currentQuestionIndex] !== null) {
            clearOptionButton.style.display = 'inline-block'; // Show
            clearOptionButton.disabled = true; // but disabled
        } else {
            clearOptionButton.style.display = 'inline-block'; // Show
            clearOptionButton.disabled = false; // and enabled
        }
    }
}

function buildQuestionNavigation() {
    let navHtml = '';
    currentQuestions.forEach((_, index) => {
        // Add answered class based on user answers
        const answeredClass = userAnswers[index] !== null ? 'answered' : '';
        navHtml += `<a href="#" data-qindex="${index}" id="qnav-${index}" class="${answeredClass}">${index + 1}</a>`;
    });
    if(questionNavigationTable) questionNavigationTable.innerHTML = navHtml;

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
    return {score, correctCount, incorrectCount}; // Return counts as well
}

function updateLiveFeedback() {
    const {correctCount, incorrectCount} = calculateScore();
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = correctCount;
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = incorrectCount;
}

// Function to display final results when test is submitted or viewed
function displayFinalResults() {
    const {score, correctCount, incorrectCount} = calculateScore();
    if(scoreElement) scoreElement.textContent = `${score} / ${currentQuestions.length}`;
    if(resultContainer) resultContainer.style.display = 'block';
    
    // Ensure all questions are displayed and answers are marked
    document.querySelectorAll('.question-card').forEach(card => card.classList.add('active'));
    currentQuestions.forEach((q, index) => {
        const questionCard = document.getElementById(`question-${index}`);
        const radioInputs = questionCard.querySelectorAll(`input[name="question${index}"]`);
        const correctAnswerDisplay = document.getElementById(`correct-answer-${index}`);

        radioInputs.forEach(input => {
            input.disabled = true; // Disable all options
            const parentLabel = input.parentElement;
            parentLabel.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer');

            if (userAnswers[index] === input.value) { // User's selected answer
                if (input.value === q.answer) {
                    parentLabel.classList.add('user-answer-correct');
                } else {
                    parentLabel.classList.add('user-answer-incorrect');
                }
            }
            // Always highlight the correct answer if available
            if (input.value === q.answer) {
                parentLabel.classList.add('highlight-correct-answer');
            }
        });

        if(correctAnswerDisplay && q.answer){
            correctAnswerDisplay.innerHTML = `<strong>सही उत्तर:</strong> ${q.answer}`;
            correctAnswerDisplay.style.display = 'block';
        }
    });

    if(resultContainer) resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Function to disable all controls after test submission/viewing results
function disableAllTestControls() {
    if(submitButtonSidebar) submitButtonSidebar.style.display = 'none';
    if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'none';
    if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'none';
    if(decreaseFontButton) decreaseFontButton.disabled = true;
    if(increaseFontButton) increaseFontButton.disabled = true;
    if(shuffleQuestionsButton) shuffleQuestionsButton.disabled = true;
    if(shuffleOptionsButton) shuffleOptionsButton.disabled = true;
    document.querySelectorAll('#question-navigation-table a').forEach(link => link.style.pointerEvents = 'none');
    document.querySelectorAll('.options input[type="radio"]').forEach(radio => radio.disabled = true);
    if(clearOptionButton) clearOptionButton.style.display = 'none';
}


if(nextButton) nextButton.addEventListener('click', () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        displayQuestion(currentQuestionIndex + 1);
    }
});
if(backButton) backButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        displayQuestion(currentQuestionIndex - 1);
    }
});

if(clearOptionButton) clearOptionButton.addEventListener('click', () => {
    // Only clear if no answer is currently selected (or if it's already null)
    if (userAnswers[currentQuestionIndex] === null) { // This check means it won't clear an answered question
        const radioButtons = document.querySelectorAll(`input[name="question${currentQuestionIndex}"]`);
        radioButtons.forEach(radio => radio.checked = false);
        userAnswers[currentQuestionIndex] = null; // Clear the answer
        updateQuestionNavigationItemStatus(currentQuestionIndex);
        
        // Remove all feedback classes from all option labels and re-enable radio buttons
        const currentLabels = document.querySelectorAll(`#question-${currentQuestionIndex} .options label`);
        currentLabels.forEach(label => {
            label.classList.remove('user-answer-correct', 'user-answer-incorrect', 'highlight-correct-answer');
            label.querySelector('input[type="radio"]').disabled = false; // Re-enable radio buttons
        });
        const correctAnswerDisplay = document.getElementById(`correct-answer-${currentQuestionIndex}`);
        if(correctAnswerDisplay) {
            correctAnswerDisplay.style.display = 'none';
            correctAnswerDisplay.innerHTML = '';
        }
        updateLiveFeedback();
        saveUserData(); // Save cleared data
        if(clearOptionButton) clearOptionButton.disabled = false; // Ensure clear button is enabled
    } else {
        alert("उत्तर पहले ही दिया जा चुका है। आप इसे सबमिट करने के बाद ही देख सकते हैं।");
    }
});

if(submitButtonSidebar) submitButtonSidebar.addEventListener('click', async () => {
    // Confirm submission
    if (!confirm("क्या आप टेस्ट सबमिट करना चाहते हैं? एक बार सबमिट करने के बाद, आप अपने उत्तर नहीं बदल पाएंगे।")) {
        return; // User cancelled
    }

    const {score, correctCount, incorrectCount} = calculateScore();

    // Mark test as submitted in Firebase
    if (currentUser) {
        const submittedTestsRef = rtdb.ref(`users/${currentUser.uid}/submittedTests/${unitId}`);
        await submittedTestsRef.set({
            score: score,
            totalQuestions: currentQuestions.length,
            correctAnswers: correctCount,
            incorrectAnswers: incorrectCount,
            submissionDate: new Date().toISOString(),
            userAnswers: userAnswers, // Save user's answers at submission time
            questionsShuffled: questionsShuffled, // Save state for review
            optionsShuffled: optionsShuffled // Save state for review
        })
        .then(() => console.log("Test submitted successfully to Firebase!"))
        .catch(error => console.error("Error submitting test to Firebase:", error));
    }

    // Disable all test controls
    disableAllTestControls();

    // Display final results
    displayFinalResults();
});

// फ़ॉन्ट आकार नियंत्रण
if(increaseFontButton) increaseFontButton.addEventListener('click', () => {
    if (baseFontSize < 24) {
        baseFontSize += 2;
        updateFontSize();
        saveUserData(); // Save font size
    }
});
if(decreaseFontButton) decreaseFontButton.addEventListener('click', () => {
    if (baseFontSize > 12) {
        baseFontSize -= 2;
        updateFontSize();
        saveUserData(); // Save font size
    }
});

// फ़ॉन्ट साइज़ को अपडेट करने के लिए नया फ़ंक्शन
function updateFontSize() {
    if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`;

    // Apply font size to question text and options
    document.querySelectorAll('.question-card p, .options label span').forEach(element => {
        element.style.fontSize = `${baseFontSize}px`;
    });
}


// शफल प्रश्न
if(shuffleQuestionsButton) shuffleQuestionsButton.addEventListener('click', () => {
    if (confirm("क्या आप प्रश्नों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) {
        questionsShuffled = true;
        optionsShuffled = false;
        resetQuizStateAndReload();
    }
});

// शफल विकल्प
if(shuffleOptionsButton) shuffleOptionsButton.addEventListener('click', () => {
    if (confirm("क्या आप विकल्पों को शफल करना चाहते हैं? आपकी वर्तमान प्रगति रीसेट हो जाएगी।")) {
        optionsShuffled = true;
        resetQuizStateAndReload();
    }
});

function resetQuizStateAndReload() {
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(null); // Reset answers
    if(quizContainer) quizContainer.innerHTML = '<p>प्रश्न पुनः लोड हो रहे हैं...</p>';
    if(resultContainer) resultContainer.style.display = 'none';
    if(liveCorrectAnswersSpan) liveCorrectAnswersSpan.textContent = '0';
    if(liveIncorrectAnswersSpan) liveIncorrectAnswersSpan.textContent = '0';
    if(submitButtonSidebar) submitButtonSidebar.style.display = 'block';
    if(navigationButtonsContainer) navigationButtonsContainer.style.display = 'block';
    if(liveFeedbackContainer) liveFeedbackContainer.style.display = 'block';
    if(decreaseFontButton) decreaseFontButton.disabled = false;
    if(increaseFontButton) increaseFontButton.disabled = false;
    if(shuffleQuestionsButton) shuffleQuestionsButton.disabled = false;
    if(shuffleOptionsButton) shuffleOptionsButton.disabled = false;

    saveUserData(); // Save reset state
    
    // UI को साफ़ करें और प्रश्न नेविगेशन को रीसेट करें
    document.querySelectorAll('.question-card').forEach(card => card.remove());
    if(questionNavigationTable) questionNavigationTable.innerHTML = '';

    loadQuestions(unitId); // Reload questions
}


// --- साइडबार टॉगल लॉजिक ---
if (sidebarToggleButton && sidebar && body) { // Ensure body is also available
    sidebarToggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-hidden');
        body.classList.toggle('sidebar-open'); // Toggle class on body
    });
}
// --- ---


// पेज लोड होने पर प्रश्न लोड करें
window.onload = () => {
    // Authentication listener loadUserDataFromFirebase/LocalStorage को ट्रिगर करेगा,
    // जो बदले में loadQuestions को कॉल करेगा।
    // यहां केवल प्रारंभिक फ़ॉन्ट साइज़ सेट करें।
    if(currentFontSizeSpan) currentFontSizeSpan.textContent = `${baseFontSize}px`;

    // Ensure sidebar is hidden on load
    if (sidebar) {
         sidebar.classList.add('sidebar-hidden');
         body.classList.remove('sidebar-open'); // Ensure body class is removed on load
    }

    // Ensure modals are hidden on load for test.html
    if (authModal) authModal.style.display = 'none';
    if (profileModal) profileModal.style.display = 'none';
};
