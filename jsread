// आपकी Firebase कॉन्फ़िगरेशन यहाँ डालें
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

const testUnitsContainer = document.getElementById('test-units-container');

async function loadTestUnits() {
    try {
        // 'tests' नोड का रेफरेंस लें
        const testsRef = rtdb.ref('tests');
        const snapshot = await testsRef.get(); // डेटा एक बार पढ़ें

        if (!snapshot.exists()) {
            testUnitsContainer.innerHTML = '<p>कोई टेस्ट यूनिट उपलब्ध नहीं है।</p>';
            return;
        }

        const testsData = snapshot.val(); // डेटा को ऑब्जेक्ट के रूप में पाएं
        let unitsHtml = '';

        // testsData एक ऑब्जेक्ट होगा, जिसमें unitId कीज़ होंगी (जैसे unit1, unit2)
        for (const unitId in testsData) {
            if (testsData.hasOwnProperty(unitId)) {
                const unitData = testsData[unitId]; // यह unit1, unit2 आदि का डेटा होगा
                unitsHtml += `
                    <div class="unit-card">
                        <h3>${unitData.title || `यूनिट ${unitId}`}</h3>
                        <a href="test.html?unit=${unitId}">टेस्ट शुरू करें</a>
                    </div>
                `;
            }
        }

        if (unitsHtml === '') {
             testUnitsContainer.innerHTML = '<p>कोई टेस्ट यूनिट सही फॉर्मेट में उपलब्ध नहीं है।</p>';
        } else {
            testUnitsContainer.innerHTML = unitsHtml;
        }

    } catch (error) {
        console.error("टेस्ट यूनिट्स लोड करने में त्रुटि:", error);
        testUnitsContainer.innerHTML = '<p>टेस्ट लोड करने में विफल। कृपया बाद में प्रयास करें।</p>';
    }
}

// पेज लोड होने पर टेस्ट यूनिट्स लोड करें
window.onload = loadTestUnits;
