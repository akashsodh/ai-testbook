// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें
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

const testUnitsContainer = document.getElementById('test-units-container');
const myLibraryHeading = document.getElementById('my-library-heading');
const myLibraryContainer = document.getElementById('my-library-container');
const purchasedTestsContainer = document.getElementById('purchased-tests-container');
const referralCodeInput = document.getElementById('referral-code-input');
const applyReferralBtn = document.getElementById('apply-referral-btn');
const referralMessage = document.getElementById('referral-message');

// Auth Modal Elements
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

// Header Auth Elements
const authButton = document.getElementById('auth-button');
const userDisplay = document.getElementById('user-display');
const userProfilePic = document.getElementById('user-profile-pic');

// Login Prompt Elements
const loginPrompt = document.getElementById('login-prompt');
const promptLoginLink = document.getElementById('prompt-login-link');
const promptSignupLink = document.getElementById('prompt-signup-link');

// Profile Modal Elements
const profileModal = document.getElementById('profile-modal');
const profilePicModal = document.getElementById('profile-pic-modal');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileUid = document.getElementById('profile-uid');
const profileProvider = document.getElementById('profile-provider');
const profileLogoutBtn = document.getElementById('profile-logout-btn');


let currentUser = null; // वर्तमान में लॉग-इन उपयोगकर्ता
let submittedTests = {}; // To store submitted test IDs and their status/results

// --- Authentication Logic ---
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
        myLibraryHeading.style.display = 'block';
        myLibraryContainer.style.display = 'block';
        loginPrompt.style.display = 'none';
        
        // Load submitted tests first, then purchased tests
        loadSubmittedTests(user.uid).then(() => {
            loadPurchasedTests(user.uid);
        });

        authModal.style.display = 'none';
        profileModal.style.display = 'none';
    } else {
        userDisplay.textContent = 'Guest';
        userProfilePic.style.display = 'none';
        userProfilePic.src = 'https://via.placeholder.com/40/CCCCCC/FFFFFF?text=P';
        authButton.textContent = 'Login';
        authButton.classList.remove('logout');
        myLibraryHeading.style.display = 'none';
        myLibraryContainer.style.display = 'none';
        purchasedTestsContainer.innerHTML = '';
        referralMessage.textContent = '';
        referralCodeInput.value = '';
        profileModal.style.display = 'none';
        submittedTests = {}; // Clear submitted tests for guest user

        if (!localStorage.getItem('visitedBefore')) {
            loginPrompt.style.display = 'block';
        }
    }
    loadTestUnits(); // Always load available public tests
});

// ... (Existing code for Auth Modal, Profile Modal, Login Prompt Event Listeners) ...

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
            authModal.style.display = 'none';
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
            authModal.style.display = 'none';
        } catch (error) {
            console.error("Google Sign-in Error:", error);
            alert(`Google Sign-in Error: ${error.message}`);
        }
    });
}

// ... (Existing code for Profile Modal Logout Button, Login Prompt Links) ...


// --- Load Available Test Units ---
async function loadTestUnits() {
    try {
        const testsRef = rtdb.ref('tests');
        const snapshot = await testsRef.get();

        if (!snapshot.exists()) {
            testUnitsContainer.innerHTML = '<p>कोई टेस्ट यूनिट उपलब्ध नहीं है।</p>';
            return;
        }

        const testsData = snapshot.val();
        let unitsHtml = '';

        for (const unitId in testsData) {
            if (testsData.hasOwnProperty(unitId)) {
                const unitData = testsData[unitId];
                unitsHtml += `
                    <div class="unit-card">
                        <h3>${unitData.title || `यूनिट ${unitId}`}</h3>
                        <p>${unitData.description || 'कोई विवरण नहीं।'}</p>
                        <button class="view-test-details-btn" data-unit-id="${unitId}">Details</button>
                        <button class="buy-test-btn" data-unit-id="${unitId}" data-unit-title="${unitData.title || `यूनिट ${unitId}`}">Buy Test</button>
                    </div>
                `;
            }
        }

        if (unitsHtml === '') {
             testUnitsContainer.innerHTML = '<p>कोई टेस्ट यूनिट सही फॉर्मेट में उपलब्ध नहीं है।</p>';
        } else {
            testUnitsContainer.innerHTML = unitsHtml;
        }

        // Add event listeners for "Buy Test" buttons
        document.querySelectorAll('.buy-test-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const unitId = e.target.dataset.unitId;
                const unitTitle = e.target.dataset.unitTitle;
                handleBuyTest(unitId, unitTitle);
            });
        });
        // Add event listeners for "Details" buttons (for future expansion)
        document.querySelectorAll('.view-test-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const unitId = e.target.dataset.unitId;
                alert(`Details for Test Unit: ${unitId} (Feature coming soon!)`);
            });
        });

    } catch (error) {
        console.error("टेस्ट यूनिट्स लोड करने में त्रुटि:", error);
        testUnitsContainer.innerHTML = '<p>टेस्ट लोड करने में विफल। कृपया बाद में प्रयास करें।</p>';
    }
}

// --- Referral Code System ---
if (applyReferralBtn) {
    applyReferralBtn.addEventListener('click', async () => {
        if (!currentUser) {
            referralMessage.textContent = 'कृपया रेफरल कोड का उपयोग करने के लिए लॉग इन करें।';
            referralMessage.style.color = 'orange';
            return;
        }

        const referralCode = referralCodeInput.value.trim().toUpperCase();
        if (!referralCode) {
            referralMessage.textContent = 'कृपया एक रेफरल कोड दर्ज करें।';
            referralMessage.style.color = 'red';
            return;
        }

        try {
            const codeRef = rtdb.ref(`referralCodes/${referralCode}`);
            const snapshot = await codeRef.get();

            if (snapshot.exists()) {
                const codeData = snapshot.val();
                const testIdToUnlock = codeData.unlocksTest;

                if (testIdToUnlock) {
                    const userPurchasedTestsRef = rtdb.ref(`users/${currentUser.uid}/purchasedTests/${testIdToUnlock}`);
                    const userSnapshot = await userPurchasedTestsRef.get();

                    if (userSnapshot.exists()) {
                        referralMessage.textContent = 'आपके पास पहले से ही यह टेस्ट सीरीज है।';
                        referralMessage.style.color = 'orange';
                    } else {
                        const testTitleRef = rtdb.ref(`tests/${testIdToUnlock}/title`);
                        const testTitleSnapshot = await testTitleRef.get();
                        const testTitle = testTitleSnapshot.exists() ? testTitleSnapshot.val() : `Test ${testIdToUnlock}`;

                        await userPurchasedTestsRef.set({
                            title: testTitle,
                            purchasedDate: new Date().toISOString()
                        });
                        referralMessage.textContent = `रेferral कोड "${referralCode}" सफलतापूर्वक लागू किया गया! टेस्ट सीरीज "${testTitle}" आपकी लाइब्रेरी में जोड़ दी गई है।`;
                        referralMessage.style.color = 'green';
                        loadPurchasedTests(currentUser.uid); // Refresh library
                        referralCodeInput.value = '';
                    }
                } else {
                    referralMessage.textContent = 'यह रेफरल कोड किसी भी टेस्ट से जुड़ा नहीं है।';
                    referralMessage.style.color = 'red';
                }
            } else {
                referralMessage.textContent = 'अमान्य रेफरल कोड।';
                referralMessage.style.color = 'red';
            }
        } catch (error) {
            console.error("रेferral कोड लागू करने में त्रुटि:", error);
            referralMessage.textContent = `रेferral कोड लागू करने में त्रुटि: ${error.message}`;
            referralMessage.style.color = 'red';
        }
    });
}

// --- User Library Display & Reattempt Logic ---

async function loadSubmittedTests(uid) {
    try {
        const submittedTestsRef = rtdb.ref(`users/${uid}/submittedTests`);
        const snapshot = await submittedTestsRef.get();
        if (snapshot.exists()) {
            submittedTests = snapshot.val();
            console.log("Submitted tests loaded:", submittedTests);
        } else {
            submittedTests = {};
        }
    } catch (error) {
        console.error("Error loading submitted tests:", error);
        submittedTests = {};
    }
}

async function loadPurchasedTests(uid) {
    try {
        const purchasedTestsRef = rtdb.ref(`users/${uid}/purchasedTests`);
        const snapshot = await purchasedTestsRef.get();

        if (!snapshot.exists() || Object.keys(snapshot.val()).length === 0) {
            purchasedTestsContainer.innerHTML = '<p>आपके पास अभी तक कोई खरीदी गई टेस्ट सीरीज नहीं है।</p>';
            return;
        }

        const purchasedData = snapshot.val();
        let purchasedHtml = '';

        for (const testId in purchasedData) {
            if (purchasedData.hasOwnProperty(testId)) {
                const testDetails = purchasedData[testId];
                const isSubmitted = submittedTests[testId] ? true : false;
                
                purchasedHtml += `
                    <div class="unit-card purchased-card">
                        <h3>${testDetails.title || `Test ${testId}`}</h3>
                        <p>Purchased: ${new Date(testDetails.purchasedDate).toLocaleDateString()}</p>
                `;
                
                if (isSubmitted) {
                    // Test has been submitted
                    purchasedHtml += `
                        <p style="color: green; font-weight: bold;">आपने यह टेस्ट सबमिट कर दिया है।</p>
                        <button class="view-results-btn" data-unit-id="${testId}" data-unit-title="${testDetails.title || `Test ${testId}`}">View Results</button>
                        <button class="reattempt-test-btn" data-unit-id="${testId}" data-unit-title="${testDetails.title || `Test ${testId}`}">Reattempt Test</button>
                    `;
                } else {
                    // Test not yet submitted
                    purchasedHtml += `
                        <a href="test.html?unit=${testId}" class="start-test-btn">Start Test</a>
                    `;
                }
                purchasedHtml += `</div>`;
            }
        }
        purchasedTestsContainer.innerHTML = purchasedHtml;

        // Add event listeners for new buttons
        document.querySelectorAll('.view-results-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const unitId = e.target.dataset.unitId;
                // Redirect to test.html with unitId and a flag to view results
                window.location.href = `test.html?unit=${unitId}&viewResults=true`;
            });
        });

        document.querySelectorAll('.reattempt-test-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const unitId = e.target.dataset.unitId;
                if (confirm(`क्या आप "${e.target.dataset.unitTitle}" टेस्ट फिर से देना चाहते हैं? आपकी पिछली प्रगति इस टेस्ट के लिए रीसेट हो जाएगी।`)) {
                    await clearTestProgress(currentUser.uid, unitId);
                    window.location.href = `test.html?unit=${unitId}`; // Redirect to start fresh
                }
            });
        });

    } catch (error) {
        console.error("खरीदी गई टेस्ट्स लोड करने में त्रुटि:", error);
        purchasedTestsContainer.innerHTML = '<p>आपकी खरीदी गई टेस्ट्स लोड करने में विफल।</p>';
    }
}

// Function to clear user's progress for a specific test
async function clearTestProgress(uid, unitId) {
    try {
        // Clear from Firebase
        const userTestProgressRef = rtdb.ref(`users/${uid}/tests/${unitId}`);
        await userTestProgressRef.remove(); // Remove entire test progress for this unit

        // Clear from submittedTests local cache
        if (submittedTests[unitId]) {
            const userSubmittedTestRef = rtdb.ref(`users/${uid}/submittedTests/${unitId}`);
            await userSubmittedTestRef.remove();
            delete submittedTests[unitId]; // Remove from local cache
        }
        
        // Clear from localStorage
        localStorage.removeItem(`testProgress_${unitId}`);

        console.log(`Test progress cleared for unit ${unitId} for user ${uid}`);
        alert('टेस्ट प्रगति सफलतापूर्वक रीसेट कर दी गई है। अब आप टेस्ट फिर से दे सकते हैं।');
    } catch (error) {
        console.error(`Error clearing test progress for unit ${unitId}:`, error);
        alert('टेस्ट प्रगति रीसेट करने में विफल। कृपया फिर से प्रयास करें।');
    }
}


// Dummy function for Buy Test (since we are using referral codes)
function handleBuyTest(unitId, unitTitle) {
    if (!currentUser) {
        alert('कृपया टेस्ट खरीदने के लिए लॉग इन करें।');
        authModal.style.display = 'block';
        authModalTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        toggleLoginLink.style.display = 'none';
        toggleSignupLink.style.display = 'inline';
        googleSignInBtn.style.display = 'block';
        authForm.reset();
        return;
    }
    alert(`इस टेस्ट को खरीदने के लिए रेफरल कोड का उपयोग करें। "My Library" सेक्शन में रेफरल कोड दर्ज करें।`);
    myLibraryHeading.scrollIntoView({ behavior: 'smooth' });
    referralCodeInput.focus();
}


// पेज लोड होने पर सार्वजनिक टेस्ट इकाइयाँ लोड करें
window.onload = () => {
    // ट्रैक करें कि उपयोगकर्ता ने पहले विज़िट किया है या नहीं
    if (!localStorage.getItem('visitedBefore')) {
        localStorage.setItem('visitedBefore', 'true');
    }
    // Authentication listener loadTestUnits को ट्रिगर करेगा
};
