// ================= ফায়ারবেস ইনিশিয়ালাইজেশন ও ডেটা লজিক =================
const firebaseConfig = {
    apiKey: "AIzaSyD6TSzBthiUw_HkKfBc3hkQnw_mQEs8FZU",
    authDomain: "nayan-bc068.firebaseapp.com",
    projectId: "nayan-bc068",
    storageBucket: "nayan-bc068.firebasestorage.app",
    messagingSenderId: "782323259018",
    appId: "1:782323259018:web:a428fe0d96897711223f73",
    measurementId: "G-8PJVBLSPZV"
};

// ফায়ারবেস অ্যাপ ইনিশিয়াল আছে কিনা চেক করে নেওয়া
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ফায়ারবেস রিয়েল-টাইম লিসেনার ও ডেটা ফেচিং
function setupFirebaseListener() {
    console.log("Firebase listener function called!"); 
    
    if (typeof firebase !== 'undefined') {
        try {
            const dbInstance = firebase.firestore();
            
            dbInstance.collection('products').onSnapshot((snapshot) => {
                let fbProducts = [];
                snapshot.forEach((doc) => {
                    fbProducts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                console.log("Firebase products :", fbProducts); 
                
                // script.js ফাইলের initializeProducts ফাংশনে ডেটা এবং dbInstance পাঠানো হলো
                if (typeof initializeProducts === 'function') {
                    initializeProducts(fbProducts, dbInstance);
                }
                
            }, (error) => {
                console.error("Firestore snapshot error: ", error);
                if (typeof initializeProducts === 'function') initializeProducts([], dbInstance);
            });
        } catch (err) {
            console.error("Error setting up Firestore listener: ", err);
            if (typeof initializeProducts === 'function') initializeProducts([]);
        }
    } else {
        console.warn("Firebase SDK is undefined! Check your script CDN links in HTML.");
        if (typeof initializeProducts === 'function') initializeProducts([]);
    }
}

// ================= ইউজার লগইন চেক ও হেডারে নাম দেখানোর এবং ড্রপডাউন লজিক =================
function setupAuthHeaderListener() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged(async (user) => {
            const authLinks = document.querySelectorAll('#user-auth-link');

            if (authLinks.length === 0) return;

            authLinks.forEach(async (authLink) => {
                // প্যারেন্ট এলিমেন্টটিকে relative করা যাতে ড্রপডাউন পজিশন ঠিক থাকে
                const parentWrapper = authLink.parentElement;
                if (parentWrapper) {
                    parentWrapper.style.position = 'relative';
                }

                // পুরোনো ড্রপডাউন থাকলে তা রিমूव করে দেওয়া
                const existingDropdown = parentWrapper.querySelector('#user-dropdown-menu');
                if (existingDropdown) {
                    existingDropdown.remove();
                }

                if (user) {
                    try {
                        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();

                        let fullName = "User";
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            fullName = userData.fullName || "User";
                        } else {
                            fullName = user.email.split('@')[0];
                        }

                        // লগইন থাকা অবস্থায় নাম এবং ড্রপডাউন সেটআপ
                        authLink.innerHTML = `<i class="fa-regular fa-user"></i> ${fullName} <i class="fa-solid fa-chevron-down text-[9px] ml-1"></i>`;
                        authLink.href = "javascript:void(0);"; // ডিফল্ট লিংকে যাওয়া বন্ধ রাখা

                        // ড্রপডাউন মেনু তৈরি
                        const dropdownMenu = document.createElement('div');
                        dropdownMenu.id = 'user-dropdown-menu';
                        dropdownMenu.className = 'absolute right-0 mt-40 w-48 bg-white border border-neutral-200 rounded-md shadow-lg py-1 hidden z-50 text-xs';
                        dropdownMenu.innerHTML = `
                            <a href="profile.html" class="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"><i class="fa-regular fa-id-card mr-2 text-[#F26522]"></i> ড্যাশবোর্ড / প্রোফাইল</a>
                            <a href="track-order.html" class="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"><i class="fa-solid fa-box-archive mr-2 text-[#F26522]"></i> আমার অর্ডারসমূহ</a>
                            <a href="wishlist.html" class="block px-4 py-2 text-neutral-700 hover:bg-neutral-100"><i class="fa-regular fa-heart mr-2 text-[#F26522]"></i> উইশলিস্ট</a>
                            <div class="border-t border-neutral-100 my-1"></div>
                            <a href="javascript:void(0);" class="logout-btn-trigger block px-4 py-2 text-red-600 hover:bg-red-50"><i class="fa-solid fa-right-from-bracket mr-2"></i> লগআউট</a>
                        `;

                        parentWrapper.appendChild(dropdownMenu);

                        // ক্লিক করলে ড্রপডাউন টগল হওয়া
                        authLink.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dropdownMenu.classList.toggle('hidden');
                        };

                        // লগআউট বাটনের কার্যকারিতা (সকল ক্লাসের জন্য)
                        const logoutBtn = dropdownMenu.querySelector('.logout-btn-trigger');
                        if (logoutBtn) {
                            logoutBtn.onclick = async () => {
                                try {
                                    await firebase.auth().signOut();
                                    window.location.reload();
                                } catch (err) {
                                    console.error("Error signing out:", err);
                                }
                            };
                        }

                        // বাইরে কোথাও ক্লিক করলে ড্রপডাউন বন্ধ হয়ে যাবে
                        document.addEventListener('click', (e) => {
                            if (!parentWrapper.contains(e.target)) {
                                dropdownMenu.classList.add('hidden');
                            }
                        });

                    } catch (error) {
                        console.error("Error loading user data:", error);
                    }
                } else {
                    // লগইন না থাকলে সাধারণ Sign In বাটন দেখাবে
                    authLink.innerHTML = `<i class="fa-regular fa-user"></i> Sign In`;
                    authLink.href = "login.html";
                    authLink.onclick = null;
                }
            });
        });
    }
}

// পেজ এবং সমস্ত সিডিএন সম্পূর্ণ লোড হওয়ার পর ফায়ারবেস ডেটা ও হেডার সিঙ্ক শুরু হবে
window.addEventListener('load', () => {
    setupFirebaseListener();
    setupAuthHeaderListener(); // হেডার আপডেট করার ফাংশনটি এখানে চালু করা হলো
});