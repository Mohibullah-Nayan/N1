/* ==========================================================================
   SCENT LUXURY PERFUMES & ATTAR - MASTER APPLICATION ORCHESTRATOR (js/script.js)
   --------------------------------------------------------------------------
   MODULAR SYSTEM ARCHITECTURE:
   - js/slider.js   -> Hero Banner Slider & Auto-Interval Timer
   - js/reviews.js  -> Customer Reviews & Ratings Firestore Sync
   - js/cart.js     -> Shopping Cart, Checkout & WhatsApp Ordering
   - js/products.js -> Products Catalogue, Filters & Details View
   ========================================================================== */

// এই ফাংশনটি পেজ এবং ডিওএম সম্পূর্ণ লোড হওয়ার পর মূল মডিউলগুলো সচল ও প্রস্তুত করে
function initApplicationModules() {
    // ১. কার্ট কাউন্ট ব্যাজ রিফ্রেশ
    if (typeof updateCartBadgeCount === 'function') {
        updateCartBadgeCount();
    }

    // ২. কার্ট পেজ থাকলে আইটেম রেন্ডার
    if (typeof renderCartPageItems === 'function') {
        renderCartPageItems();
    }

    // ৩. প্রোডাক্ট পেজে রিভিউ ও রেটিং রেন্ডার
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('id');
    if (prodId && typeof renderProductReviews === 'function') {
        renderProductReviews(prodId);
    }
}

// এই ফাংশনটি প্রোডাক্ট কার্ডে দ্রুত প্রিভিউ ও ইন্টারঅ্যাকশন হ্যান্ডল করে
function setupQuickInteractions() {
    // কোয়ান্টিটি ইনপুট ফিল্ড থাকলে তার পরিবর্তন ট্র্যাক করা
    const qtyInput = document.getElementById('quantity-input');
    if (qtyInput) {
        qtyInput.addEventListener('change', function() {
            if (typeof updateProductPrice === 'function') {
                updateProductPrice(parseInt(this.value) || 1);
            }
        });
    }
}

// পেজ লোড ইভেন্ট লিসেনার
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApplicationModules();
        setupQuickInteractions();
    });
} else {
    initApplicationModules();
    setupQuickInteractions();
}

// উইন্ডো গ্লোবাল এক্সপোর্ট
window.initApplicationModules = initApplicationModules;
window.setupQuickInteractions = setupQuickInteractions;
