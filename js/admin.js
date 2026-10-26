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

    const CLOUD_NAME = "mfq08wvp";      
    const UPLOAD_PRESET = "nayan_preset"; 

    let globalProductsMap = {};

    let adminAuthInitialized = false;

    onAuthStateChanged(auth, async (user) => {
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

            await loadProductsMap();
            await loadAdminProductsTable(); 
            loadAdminDashboardData();
            loadCouponsList();
            loadProductsForCoupon(); 
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
