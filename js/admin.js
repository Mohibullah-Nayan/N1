/* ==========================================================================
   SCENT LUXURY PERFUMES & ATTAR - ADMIN DASHBOARD ORCHESTRATOR (js/admin.js)
   --------------------------------------------------------------------------
   MODULAR SYSTEM ARCHITECTURE:
   - js/admin-products.js  -> Inventory CRUD, Edit Modal, Cloudinary Upload
   - js/admin-coupons.js   -> Targeted Discount Coupons Management
   - js/admin-charts.js    -> Real-time Sales & Status Charts Analytics
   - js/admin-dashboard.js -> Orders Real-time Engine, Date Filters, Customer Search
   - js/admin-messages.js  -> Customer Contact Messages Inbox
   ========================================================================== */

    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
    import { getFirestore, collection, addDoc, setDoc, getDocs, getDoc, query, deleteDoc, doc, serverTimestamp, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
    
    // ==========================================================================
    // ১. সাইডবার ন্যাভিগেশন ও একটিভ স্টাইলিং (Sidebar Navigation Styling)
    // ==========================================================================
    // Active navigation styling
    document.querySelectorAll('.admin-menu').forEach(menu => {
        menu.addEventListener('click', function () {
            document.querySelectorAll('.admin-menu').forEach(item => {
                item.classList.remove(
                    'bg-gradient-to-r',
                    'from-blue-600',
                    'to-indigo-600',
                    'text-white',
                    'font-semibold',
                    'shadow-lg',
                    'shadow-blue-600/30'
                );

                item.classList.add(
                    'text-slate-300',
                    'font-medium'
                );
            });

            this.classList.remove(
                'text-slate-300',
                'font-medium'
            );

            this.classList.add(
                'bg-gradient-to-r',
                'from-blue-600',
                'to-indigo-600',
                'text-white',
                'font-semibold',
                'shadow-lg',
                'shadow-blue-600/30'
            );
        });
    });

    // ==========================================================================
    // ২. ফায়ারবেস, ক্লাউডিনারি ইনিশিয়ালাইজেশন ও অথ গার্ড (Firebase & Auth Guard)
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

    export const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    export const db = getFirestore(app);

    // গ্লোবালি ফায়ারস্টোর মেথড ও ডিবি রেফারেন্স অ্যাসাইন করা (অ্যাডমিন এক্সটেনশনের জন্য)
    window.db = db;
    window.firestoreUpdateDoc = updateDoc;
    window.firestoreDoc = doc;
    window.firestoreServerTimestamp = serverTimestamp;

    // ক্লাউডিনারি ক্রেডেনশিয়ালস এক্সপোর্ট
    export const CLOUD_NAME = "mfq08wvp";      
    export const UPLOAD_PRESET = "nayan_preset"; 
    window.CLOUD_NAME = CLOUD_NAME;
    window.UPLOAD_PRESET = UPLOAD_PRESET; 

    let globalProductsMap = {};

    let adminAuthInitialized = false;

    // যদি কোনো কারণে ফায়ারবেস অথেন্টিকেশন রেসপন্স দিতে অস্বাভাবিক সময় নেয়, তবে সর্বোচ্চ ৮ সেকেন্ড পর ইউজারকে বিকল্প অ্যাকশন বা রিডাইরেক্ট দেওয়া
    const authTimeoutTimer = setTimeout(() => {
        if (!adminAuthInitialized) {
            const guardEl = document.getElementById('admin-auth-guard');
            if (guardEl) {
                guardEl.innerHTML = `
                    <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm text-center shadow-2xl">
                        <i class="fa-solid fa-triangle-exclamation text-amber-500 text-3xl mb-3"></i>
                        <h3 class="text-base font-bold text-white mb-1.5">Authorization Timeout</h3>
                        <p class="text-xs text-slate-400 mb-4">Credentials verification is taking longer than expected. Please login again or retry.</p>
                        <div class="flex gap-2 justify-center">
                            <a href="admin-login.html" class="px-4 py-2 bg-[#F26522] hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition">Login Again</a>
                            <button onclick="window.location.reload()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer">Retry</button>
                        </div>
                    </div>
                `;
            }
        }
    }, 8000);

    onAuthStateChanged(auth, async (user) => {
        clearTimeout(authTimeoutTimer);
        if (!user) {
            window.location.href = 'admin-login.html';
            return;
        }

        // একবার অথেন্টিকেশন হয়ে গেলে পরবর্তী কোনো ইভেন্টে পুনরায় গার্ড বা রিলোড চলবে না
        if (adminAuthInitialized) {
            return;
        }
        adminAuthInitialized = true;

        const guardEl = document.getElementById('admin-auth-guard');

        try {
            // Verify if user record exists and role is strictly 'admin'
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (!userSnap.exists() || userSnap.data()?.role !== 'admin') {
                alert("Unauthorized access! Only authorized admins can access this page.");
                await signOut(auth);
                window.location.href = 'admin-login.html';
                return;
            }

            // Successfully authenticated as Admin - গার্ডটি স্থায়ীভাবে ডম থেকে সরিয়ে দেওয়া হলো
            if (guardEl) {
                guardEl.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => {
                    try { guardEl.remove(); } catch(e) { guardEl.style.display = 'none'; }
                }, 300);
            }

            if (typeof window.loadProductsMap === 'function') await window.loadProductsMap();
            if (typeof window.loadAdminProductsTable === 'function') await window.loadAdminProductsTable(); 
            if (typeof window.loadAdminDashboardData === 'function') window.loadAdminDashboardData();
            if (typeof window.loadCouponsList === 'function') window.loadCouponsList();
            if (typeof window.loadProductsForCoupon === 'function') window.loadProductsForCoupon(); 
        } catch (error) {
            console.error("Admin authorization check failed:", error);
            alert("Admin verification error: " + error.message);
            window.location.href = 'admin-login.html';
        }
    });

    // ==========================================================================
    // ৩. অ্যাডমিন ইউটিলিটিজ - সাইডবার টগল, লগআউট ও ডাটাবেজ রিসেট (Admin Utilities)
    // ==========================================================================
    // এই ফাংশনটি অ্যাডমিন ড্যাশবোর্ডের সাইডবার মেনু ওপেন বা কলাপ্স করে
    window.toggleAdminSidebar = function() {
        const sb = document.getElementById('admin-sidebar');
        if (sb) {
            sb.classList.toggle('hidden');
            sb.classList.toggle('fixed');
            sb.classList.toggle('inset-y-0');
            sb.classList.toggle('left-0');
            sb.classList.toggle('z-50');
        }
    };

    // এই ফাংশনটি অ্যাডমিন একাউন্ট থেকে ফায়ারবেস সাইনআউট করে লগইন পেজে রিডাইরেক্ট করে
    window.handleLogout = async function() {
        try {
            await signOut(auth);
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error("Logout error: ", error);
        }
    };

    // ==========================================================================

// ==========================================================================
// মডুলার সিস্টেম লোডার (Modular Sub-modules Import)
// ==========================================================================
import './admin-products.js';
import './admin-coupons.js';
import './admin-charts.js';
import './admin-dashboard.js';
import './admin-messages.js';

    // ==========================================================================
    // ১২. পেজ লোড মাস্টার ইনিশিয়ালাইজেশন (Page Load Initializer)
    // ==========================================================================
    window.addEventListener('load', () => {
        loadAdminMessages();
    });

// Window Global Exports
window.toggleAdminSidebar = toggleAdminSidebar;
window.handleLogout = handleLogout;
