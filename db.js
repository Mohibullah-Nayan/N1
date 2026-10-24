/* ==========================================================================
   SCENT LUXURY PERFUMES & ATTAR - DATABASE & AUTH MANAGEMENT (db.js)
   --------------------------------------------------------------------------
   ORGANIZED ARCHITECTURE & SEQUENTIAL MODULES:
   ১. ফায়ারবেস কনফিগারেশন ও ইনিশিয়ালাইজেশন (Firebase Config & Init)
   ২. ফায়ারবেস রিয়েল-টাইম প্রোডাক্ট লিসেনার (Real-time Products Listener)
   ৩. ইউজার অথেন্টিকেশন ও হেডার ড্রপডাউন লজিক (User Auth & Header Dropdown)
   ৪. উইন্ডো লোড ইভেন্ট হ্যান্ডলার (Window Load Event Dispatcher)
   ========================================================================== */

// ==========================================================================
// ১. ফায়ারবেস কনফিগারেশন ও ইনিশিয়ালাইজেশন (Firebase Config & Init)
// ==========================================================================
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

// ==========================================================================
// ২. ফায়ারবেস রিয়েল-টাইম প্রোডাক্ট লিসেনার (Real-time Products Listener)
// ==========================================================================
// ব্যানার আইটেম কি না তা নিশ্চিত করার ইউনিভার্সাল হেল্পার ফাংশন
function isBannerItem(item) {
    if (!item) return false;
    if (item.isBanner === true || item.isHeroBanner === true || item.type === 'banner') return true;
    const sec = (item.homeSection || '').trim().toLowerCase();
    if (sec === 'slider-1' || sec === 'slider-2' || sec.startsWith('slider-') || sec === 'side-banner') return true;
    const cat = (item.category || item.productCategory || '').trim().toLowerCase();
    if (cat === 'banner' || cat === 'hero-banner') return true;
    return false;
}
window.isBannerItem = isBannerItem;

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
                window.allRawProducts = fbProducts;
                window.allBanners = fbProducts.filter(isBannerItem);
                // হিরো ব্যানার বা ব্যানার আইটেমগুলো বাদ দিয়ে কেবল প্রকৃত প্রোডাক্ট রাখা হলো
                window.allProducts = fbProducts.filter(p => !isBannerItem(p));

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

// ==========================================================================
// ৩. ইউজার অথেন্টিকেশন ও হেডার ড্রপডাউন লজিক (User Auth & Header Dropdown)
// ==========================================================================
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

                // পুরোনো ড্রপডাউন থাকলে তা রিমুভ করে দেওয়া
                const existingDropdown = parentWrapper.querySelector('#user-dropdown-menu');
                if (existingDropdown) {
                    existingDropdown.remove();
                }

                if (user) {
                    try {
                        localStorage.setItem('user', JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName || ''
                        }));
                    } catch(e) {}

                    try {
                        const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();

                        let fullName = "User";
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            fullName = userData.fullName || "User";
                        } else {
                            fullName = user.email ? user.email.split('@')[0] : "User";
                        }

                        // লগইন থাকা অবস্থায় নাম এবং ড্রপডাউন সেটআপ
                        authLink.innerHTML = `<i class="fa-regular fa-user"></i> ${fullName} <i class="fa-solid fa-chevron-down text-[9px] ml-1"></i>`;
                        authLink.href = "javascript:void(0);"; // ডিফল্ট লিংকে যাওয়া বন্ধ রাখা

                        // ড্রপডাউন মেনু তৈরি
                        const dropdownMenu = document.createElement('div');
                        dropdownMenu.id = 'user-dropdown-menu';
                        dropdownMenu.className = 'absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl shadow-xl py-1 hidden z-50 text-xs';
                        dropdownMenu.innerHTML = `
                            <a href="profile.html" class="block px-4 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition"><i class="fa-regular fa-id-card mr-2 text-[#F26522]"></i> Profile</a>
                            <a href="track-order.html" class="block px-4 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition"><i class="fa-solid fa-box-archive mr-2 text-[#F26522]"></i> My Orders</a>
                            <a href="wishlist.html" class="block px-4 py-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition"><i class="fa-regular fa-heart mr-2 text-[#F26522]"></i> Wishlist</a>
                            <div class="border-t border-neutral-100 dark:border-slate-800 my-1"></div>
                            <a href="javascript:void(0);" class="logout-btn-trigger block px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"><i class="fa-solid fa-right-from-bracket mr-2"></i> Logout</a>
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
                                    try { localStorage.removeItem('user'); } catch(e) {}
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
                    try { localStorage.removeItem('user'); } catch(e) {}
                    // লগইন না থাকলে সাধারণ Sign In বাটন দেখাবে
                    authLink.innerHTML = `<i class="fa-regular fa-user"></i> Sign In`;
                    authLink.href = "login.html";
                    authLink.onclick = null;
                }
            });
        });
    }
}

// ==========================================================================
// ৪. উইন্ডো লোড ইভেন্ট হ্যান্ডলার (Window Load Event Dispatcher)
// ==========================================================================
// পেজ এবং সমস্ত সিডিএন সম্পূর্ণ লোড হওয়ার পর ফায়ারবেস ডেটা ও হেডার সিঙ্ক শুরু হবে
window.addEventListener('load', () => {
    setupFirebaseListener();
    setupAuthHeaderListener(); // হেডার আপডেট করার ফাংশনটি এখানে চালু করা হলো
});
