/* ==========================================================================
   SCENT LUXURY PERFUMES - PRODUCTS & CATALOGUE MODULE (js/products.js)
   --------------------------------------------------------------------------
   - Product Grid Rendering & Pagination
   - Dynamic Category Filtering & Sorting
   - Product Details Page Data Binding & Image Gallery
   - Related Products Recommendation
   ========================================================================== */

/* ==========================================================================
   SCENT LUXURY PERFUMES & ATTAR - MASTER JAVASCRIPT
   --------------------------------------------------------------------------
   ORGANIZED ARCHITECTURE & SEQUENTIAL MODULES:
   ১. গ্লোবাল স্টেট ও ইউটিলিটি ভেরিয়েবল (Global State & Route Setup)
   ২. ফায়ারবেস কানেকশন ও ইনস্ট্যান্স হেল্পার (Firebase Initialization)
   ৩. কোর হেল্পার ও অথেন্টিকেশন ইউটিলিটিজ (Core Utilities & Auth Helpers)
   ৪. প্রোডাক্ট ডিটেইলস পেজ মডিউল (Product Details Page Module)
   ৫. প্রোডাক্ট রিভিউ এবং রেটিং সিস্টেম (Reviews & Rating Module)
   ৬. ক্যাটাগরি ও প্রোডাক্ট লিস্ট ফিল্টারিং ও রেন্ডারিং (Category & Listing)
   ৭. হোমপেজ ডায়নামিক সেকশন ও হিরো ব্যানার স্লাইডার (Hero Sliders & Banners)
   ৮. কার্ট, উইশলিস্ট ও অর্ডার সিস্টেম (Cart, Checkout & Order Module)
   ৯. সার্চ ও গ্লোবাল ন্যাভিগেশন (Search & Global Navigation)
   ১০. গ্লোবাল প্রোডাক্ট বুটস্ট্র্যাপ (Products Initialization)
   ১১. পেজ লোড মাস্টার ইভেন্ট লিসেনার (Master DOMContentLoaded Handler)
   ১২. গ্লোবাল উইন্ডো এক্সপোর্ট (Window Exports for Inline HTML Events)
   ========================================================================== */

// ==========================================================================
// ১. গ্লোবাল স্টেট ও ইউটিলিটি ভেরিয়েবল (Global State & Route Setup)
// ==========================================================================
// ================= সম্পূর্ণ প্রোডাক্ট ডেটাবেজ এবং স্টেট ম্যানেজমেন্ট =================
const urlParams = new URLSearchParams(window.location.search);
const rawProductId = urlParams.get('id') || "1";

// ক্যাটাগরি বা cat যেটা দিয়েই আসুক তা যেন ঠিকঠাক কাজ করে এবং পার্সিং ঠিক থাকে
const categoryKey = urlParams.get('category') || urlParams.get('cat');

// ব্যানার আইটেম কি না তা শতভাগ নিশ্চিত করার ইউনিভার্সাল হেল্পার ফাংশন
// এই ফাংশনটি কোনো আইটেম ব্যানার বা স্লাইডার কিনা তা ক্যাটাগরি ও সেকশন দিয়ে নির্ধারণ করে
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

// স্টক শেষ (Out of Stock) কি না তা শতভাগ নিশ্চিত করার সার্বজনীন হেল্পার ফাংশন
// কোনো প্রোডাক্টের স্টক ০ বা শূন্যের নিচে থাকলে অথবা আউট অফ স্টক স্ট্যাটাস থাকলে সেটি ট্রু রিটার্ন করবে
function isOutOfStock(product) {
    if (!product) return false;
    if (isBannerItem(product)) return false;
    if (product.isOutOfStock === true || product.status === 'out-of-stock') return true;
    if (product.stock !== undefined && product.stock !== null && String(product.stock).trim() !== '') {
        const num = Number(product.stock);
        if (!isNaN(num) && num <= 0) {
            return true;
        }
    }
    return false;
}
window.isOutOfStock = isOutOfStock;

// ১০০% নিশ্চিত করার জন্য গ্লোবাল অ্যারে তৈরি করা হলো (ফায়ারবেস বা স্ট্যাটিক ডেটা থেকে) - ব্যানার সম্পূর্ণ বাদ দেওয়া হলো
let allProducts = typeof productsData !== 'undefined' ? Object.values(productsData).filter(p => !isBannerItem(p)) : [];

// আইডি স্ট্রিং বা নাম্বার যাই হোক না কেন সঠিকভাবে খুঁজে বের করার লজিক
let currentProduct = null;
if (typeof productsData !== 'undefined') {
    currentProduct = productsData[rawProductId] || Object.values(productsData).find(p => String(p.id) === String(rawProductId));
}
const productId = currentProduct ? currentProduct.id : rawProductId;

// ==========================================================================
// ২. ফায়ারবেস কানেকশন ও ইনস্ট্যান্স হেল্পার (Firebase Initialization)
// ==========================================================================
// ================= ফায়ারবেস ইনিশিয়ালাইজেশন ও কানেকশন চেক =================
// যদি আপনার প্রজেক্টের অন্য কোনো ফাইলে `db` বা `firebase` অলরেডি সেটআপ করা থাকে, 
// তবুও নিচের কোডটি নিশ্চিত করবে যেন `db` ভেরিয়েবলটি সঠিকভাবে কাজ করে।
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

// ================= অতিরিক্ত ফায়ারবেস ব্যাকগ্রাউন্ড সিঙ্ক মডিউল =================
// এই ফাংশনটি ইনিশিয়ালাইজ করা ফায়ারস্টোর ডাটাবেসের ইনস্ট্যান্স রিটার্ন করে
function getFirestoreInstance() {
    if (typeof db !== 'undefined') return db;
    if (typeof firebase !== 'undefined' && firebase.firestore) return firebase.firestore();
    return null;
}

// ==========================================================================
// ৩. কোর হেল্পার ও অথেন্টিকেশন ইউটিলিটিজ (Core Utilities & Auth Helpers)
// ==========================================================================
// সিকিউরিটি হেল্পার: XSS Injection প্রতিরোধক স্যানিটাইজার
// এই ফাংশনটি স্ট্রিংয়ের বিশেষ ক্যারেক্টারকে সুরক্ষিত HTML এনটিটিতে রূপান্তর করে XSS প্রতিরোধ করে
function escapeHTML(str) {
    if (!str || typeof str !== 'string') return str || '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// সিকিউরিটি হেল্পার: বাংলাদেশী ভ্যালিড ফোন নম্বর ভ্যালিডেটর
// এই ফাংশনটি বাংলাদেশী ১১ ডিজিটের মোবাইল নম্বর ফরম্যাট সঠিকভাবে ভ্যালিডেট করে
function isValidBDPhone(phone) {
    if (!phone) return false;
    const cleanPhone = String(phone).replace(/[\s\-\+]/g, '');
    return /^(?:8801|01)[3-9]\d{8}$/.test(cleanPhone);
}

// এই ফাংশনটি স্ক্রিনের নিচে অ্যানিমেটেড টোস্ট নোটিফিকেশন মেসেজ পপআপ প্রদর্শন করে
function showPopupNotification(message) {
    const existingToast = document.getElementById('custom-toast-alert');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'custom-toast-alert';
    toast.className = 'fixed bottom-5 right-5 bg-neutral-900/90 text-white text-xs px-4 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 border-l-4 border-[#F26522] transition-all duration-300 transform translate-y-5 opacity-0';
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check text-[#F26522] text-sm"></i>
        <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-5', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-5', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/// ================= ফায়ারবেস অথেন্টিকেশন চেক এবং প্রটেক্টেড অ্যাকশন লজিক =================
// এই ফাংশনটি ফায়ারবেস অথ বা লোকালস্টোরেজ থেকে বর্তমান লগইন করা ইউজার চেক করে রিটার্ন করে
function checkUserLoggedIn() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        return firebase.auth().currentUser;
    }
    return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
}

// ==========================================================================

// ==========================================================================

// এই ফাংশনটি নির্বাচিত পরিমাণের ওপর ভিত্তি করে প্রোডাক্টের একক ও সর্বমোট মূল্য আপডেট করে
function updateProductPrice(qty) {
    if (!currentProduct) return;

    // এই ফাংশনটি বাংলা সংখ্যা বা ফরম্যাটেড স্ট্রিংকে সাধারণ ইংরেজি নাম্বারে রূপান্তর করে
    function convertToEnglishNumber(str) {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str.replace(/[০-৯]/g, match => englishDigits[bengaliDigits.indexOf(match)]);
    }

    let rawPrice = 0;
    let rawOldPrice = 0;

    if (currentProduct.price) {
        let cleanedPriceStr = convertToEnglishNumber(String(currentProduct.price).replace(/[^\d০-৯]/g, ''));
        rawPrice = parseInt(cleanedPriceStr) || 0;
    }

    if (currentProduct.oldPrice) {
        let cleanedOldPriceStr = convertToEnglishNumber(String(currentProduct.oldPrice).replace(/[^\d০-৯]/g, ''));
        rawOldPrice = parseInt(cleanedOldPriceStr) || 0;
    }

    const calculatedPrice = rawPrice * qty;
    const calculatedOldPrice = rawOldPrice * qty;

    const priceEl = document.getElementById('product-price');
    const oldPriceEl = document.getElementById('product-old-price');

    if (priceEl) {
        priceEl.innerText = '৳' + calculatedPrice.toLocaleString('en-IN');
    }
    if (oldPriceEl && rawOldPrice > 0) {
        oldPriceEl.innerText = '৳' + calculatedOldPrice.toLocaleString('en-IN');
    }

    // ডিসকাউন্ট ব্যাজ ডাইনামিকলি আপডেট করার অংশ
    const imageSaveBadge = document.getElementById('image-save-badge');
    const priceSaveBadge = document.getElementById('price-save-badge');

    if (rawOldPrice > rawPrice && rawOldPrice > 0) {
        const discountAmount = rawOldPrice - rawPrice;
        const discountPercent = Math.round((discountAmount / rawOldPrice) * 100);

        if (imageSaveBadge) {
            imageSaveBadge.innerText = `Save ${discountPercent}%`;
            imageSaveBadge.style.display = 'block';
        }
        if (priceSaveBadge) {
            priceSaveBadge.innerText = `Save ${discountPercent}%`;
            priceSaveBadge.style.display = 'inline-block';
        }
    } else {
        if (imageSaveBadge) imageSaveBadge.style.display = 'none';
        if (priceSaveBadge) priceSaveBadge.style.display = 'none';
    }
}

// এই ফাংশনটি প্রোডাক্টের ক্রয়ের পরিমাণ ১ বৃদ্ধি করে এবং মোট দাম রিক্যালকুলেট করে
function increaseQty() {
    const input = document.getElementById('quantity-input');
    if (input) {
        let val = parseInt(input.value) || 1;
        let newQty = val + 1;
        input.value = newQty;
        updateProductPrice(newQty);
    }
}

// এই ফাংশনটি প্রোডাক্টের ক্রয়ের পরিমাণ ১ কমায় (নূন্যতম ১) এবং দাম রিক্যালকুলেট করে
function decreaseQty() {
    const input = document.getElementById('quantity-input');
    if (input) {
        let val = parseInt(input.value) || 1;
        if (val > 1) {
            let newQty = val - 1;
            input.value = newQty;
            updateProductPrice(newQty);
        }
    }
}

// এই ফাংশনটি থাম্বনেইলে ক্লিক করা হলে প্রোডাক্ট ডিটেইলসের মূল ছবি পরিবর্তন করে
function changeMainImage(element, imgId) {
    const imgElement = document.getElementById(imgId);
    const mainImg = document.getElementById('main-product-img');
    if (imgElement && mainImg) {
        mainImg.src = imgElement.src;
    }

    const boxes = document.querySelectorAll('.thumbnail-box');
    boxes.forEach(box => {
        box.classList.remove('border-2', 'border-[#F26522]');
        box.classList.add('border', 'border-neutral-200');
    });

    if (element) {
        element.classList.remove('border', 'border-neutral-200');
        element.classList.add('border-2', 'border-[#F26522]');
    }
}

// Product Details Page Binding Function
// এই ফাংশনটি প্রোডাক্ট ডিটেইলস পেজের নাম, ব্র্যান্ড, ছবি, বিবরণ ও মূল্যের ডেটা বাইন্ড করে
function bindProductDetails(prod) {
    if (!prod) return;

    const titleEl = document.getElementById('product-title');
    const breadcrumbEl = document.getElementById('breadcrumb-title');
    const brandEl = document.getElementById('product-brand');
    const mainImgEl = document.getElementById('main-product-img');
    const thumb1El = document.getElementById('thumb-1-img');
    const thumb2El = document.getElementById('thumb-2-img');
    const thumb3El = document.getElementById('thumb-3-img');
    const descEl = document.getElementById('product-description');

    if (titleEl) titleEl.innerText = prod.title || prod.name || '';
    if (breadcrumbEl) breadcrumbEl.innerText = prod.title || prod.name || '';
    if (brandEl) brandEl.innerText = prod.brand || '';

    // হেল্পার ফাংশন: ইমেজ স্ট্রিং নাকি অবজেক্ট তা চেক করে সঠিক ইউআরএল বের করবে (যাতে [object Object] না আসে)
    const getCleanImgUrl = (img) => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.secure_url || img.path || '';
    };

    // মেইন ইমেজ এবং থাম্বনেইলগুলোর জন্য নিরাপদ এবং ডাইনামিক লজিক
    const rawMainImage = prod.image || (prod.images && prod.images[0]) || '';
    const mainImage = getCleanImgUrl(rawMainImage);

    // যদি প্রডাক্টে একাধিক ছবির অ্যারে (images) থাকে, সেগুলো ব্যবহার করবে; না থাকলে মেইন ছবি দিয়ে ফিল করবে
    let variantImages = [];
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
        variantImages = prod.images.map(img => getCleanImgUrl(img));
    } else {
        variantImages = [mainImage, mainImage, mainImage];
    }

    if (mainImgEl) mainImgEl.src = variantImages[0] || mainImage;
    if (thumb1El) thumb1El.src = variantImages[0] || mainImage;
    // দ্বিতীয় এবং তৃতীয় থাম্বনেইলে অ্যারের ২য় ও ৩য় ছবি বসবে, না থাকলে প্রথম ছবি বা ফাঁকা থাকবে
    if (thumb2El) thumb2El.src = variantImages[1] || variantImages[0] || mainImage;
    if (thumb3El) thumb3El.src = variantImages[2] || variantImages[0] || mainImage;

    if (descEl) descEl.innerText = prod.desc || prod.description || '';

    // দাম এবং ডিসকাউন্ট ব্যাজ ডাইনামিকলি আপডেট করার জন্য প্রাইস ফাংশন কল করা হলো
    if (typeof updateProductPrice === 'function') {
        updateProductPrice(parseInt(document.getElementById('quantity-input')?.value) || 1);
    }

    // রিলেটেড প্রোডাক্ট সেকশন সচল করার জন্য ফাংশন কল
    loadRelatedProducts(prod.id, prod.category, allProducts);

    // প্রোডাক্ট ডিটেইলস পেজে রিভিউ রেন্ডার করার ফাংশন কল
    renderProductReviews(prod.id);

    // স্টক স্ট্যাটাস হ্যান্ডলিং ও ব্যাজ/বাটন স্টেট আপডেট
    const stockBadgeEl = document.getElementById('product-stock-badge');
    const addToCartBtn = document.getElementById('detail-add-to-cart-btn') || document.querySelector('button[onclick*="addToCart"]');
    const buyNowBtn = document.getElementById('detail-buy-now-btn') || document.querySelector('button[onclick*="buyNow"]');
    const qtyWrapper = document.getElementById('product-quantity-wrapper');

    if (isOutOfStock(prod)) {
        if (stockBadgeEl) {
            stockBadgeEl.innerHTML = `<span class="bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs"><i class="fa-solid fa-circle-xmark text-rose-500"></i> Out of Stock</span>`;
            stockBadgeEl.style.display = 'inline-block';
        }
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.classList.remove('bg-[#F26522]', 'hover:bg-[#d8551b]', 'cursor-pointer');
            addToCartBtn.classList.add('bg-neutral-300', 'dark:bg-neutral-700', 'text-neutral-500', 'dark:text-neutral-400', 'cursor-not-allowed', 'opacity-70');
            addToCartBtn.innerHTML = `<i class="fa-solid fa-ban"></i> OUT OF STOCK`;
        }
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.classList.remove('bg-neutral-900', 'dark:bg-neutral-800', 'hover:bg-neutral-800', 'cursor-pointer');
            buyNowBtn.classList.add('bg-neutral-200', 'dark:bg-neutral-700', 'text-neutral-400', 'cursor-not-allowed', 'opacity-70');
            buyNowBtn.innerHTML = `<i class="fa-solid fa-ban"></i> UNAVAILABLE`;
        }
        if (qtyWrapper) {
            qtyWrapper.classList.add('opacity-50', 'pointer-events-none');
        }
    } else {
        if (stockBadgeEl) {
            if (prod.stock !== undefined && prod.stock !== null && String(prod.stock).trim() !== '' && Number(prod.stock) <= 10) {
                stockBadgeEl.innerHTML = `<span class="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs animate-pulse"><i class="fa-solid fa-triangle-exclamation text-amber-600"></i> Low Stock: Only ${prod.stock} left!</span>`;
                stockBadgeEl.style.display = 'inline-block';
            } else {
                stockBadgeEl.style.display = 'none';
            }
        }
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.classList.add('bg-[#F26522]', 'hover:bg-[#d8551b]', 'cursor-pointer');
            addToCartBtn.classList.remove('bg-neutral-300', 'dark:bg-neutral-700', 'text-neutral-500', 'dark:text-neutral-400', 'cursor-not-allowed', 'opacity-70');
            addToCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> ADD TO CART`;
        }
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            buyNowBtn.classList.add('bg-neutral-900', 'dark:bg-neutral-800', 'hover:bg-neutral-800', 'cursor-pointer');
            buyNowBtn.classList.remove('bg-neutral-200', 'dark:bg-neutral-700', 'text-neutral-400', 'cursor-not-allowed', 'opacity-70');
            buyNowBtn.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> BUY NOW`;
        }
        if (qtyWrapper) {
            qtyWrapper.classList.remove('opacity-50', 'pointer-events-none');
        }
    }
}

// রিলেটেড প্রোডাক্ট রেন্ডার করার ফাংশন
// এই ফাংশনটি একই ক্যাটাগরির অন্যান্য সম্পর্কিত পারফিউম প্রোডাক্ট কার্ড আকারে লোড করে
function loadRelatedProducts(currentId, currentCategory, productsArray) {
    const gridContainer = document.getElementById('related-products-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = "";

    // হেল্পার ফাংশন রিলেটেড প্রোডাক্টের ইমেজের জন্যও ব্যবহার করা হলো
    const getCleanImgUrl = (img) => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        return img.url || img.secure_url || img.path || '';
    };

    // বর্তমান প্রডাক্ট বাদে একই ক্যাটেগরির প্রডাক্ট ফিল্টার করা
    let related = productsArray.filter(p => String(p.id) !== String(currentId) && !isBannerItem(p) && !isOutOfStock(p) && p.category === currentCategory);

    // পর্যাপ্ত না থাকলে অন্য ক্যাটেগরি থেকে নেওয়া
    if (related.length < 4) {
        const others = productsArray.filter(p => String(p.id) !== String(currentId) && !isBannerItem(p) && !isOutOfStock(p) && p.category !== currentCategory);
        related = [...related, ...others];
    }

    const topFourProducts = related.slice(0, 4);

    if (topFourProducts.length === 0) {
        gridContainer.innerHTML = '<p class="text-xs text-neutral-400 col-span-full">No related products found.</p>';
        return;
    }

    topFourProducts.forEach(product => {
        let rawProdImg = (product.images && product.images[0]) ? product.images[0] : (product.image || '');
        const prodImg = getCleanImgUrl(rawProdImg);

        const card = document.createElement('div');
        card.className = "cursor-pointer bg-white border border-neutral-200 rounded overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative product-card";
        card.setAttribute('onclick', `window.location.href='product-details.html?id=${product.id}'`);

        card.innerHTML = `
            <div class="product-hover-popup absolute top-2 right-2 bg-neutral-900/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-20 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 backdrop-blur-sm">
                <i class="fa-solid fa-eye text-[#F26522]"></i> Quick View
            </div>
            <div class="relative w-full h-48 overflow-hidden bg-neutral-100 flex items-center justify-center">
                <img src="${prodImg}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${product.title || product.name || ''}">
            </div>
            <div class="p-3 flex flex-col flex-grow">
                <span class="text-[13px] font-bold text-neutral-400 uppercase tracking-widest min-h-[14px]">${product.brand ? product.brand : '&nbsp;'}</span>
                <h4 class="text-lg font-semibold text-neutral-800 line-clamp-2 mt-1 min-h-[32px]">${product.title || product.name || ''}</h4>
                <div class="mt-2 flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                    <div class="flex flex-col">
                    <span class="text-lg font-bold text-[#F26522]">৳ ${product.price || ''}</span>
                   ${Number(product.oldPrice) > Number(product.price) ? `<span class="text-[17px] font-bold text-neutral-400 line-through">৳ ${product.oldPrice}</span>` : ''}
                   </div>
                    <button onclick="event.stopPropagation(); addProductToCartDirect('${product.id}');" class="bg-white border border-[#F26522] text-[#F26522] hover:bg-[#F26522] hover:text-white text-[15px] max-sm:text-[11px] px-3 max-sm:px-2 py-1 rounded transition-colors flex items-center gap-1 shadow-sm">
                        <i class="fa-solid fa-cart-shopping"></i> Add To Cart
                    </button>
                </div>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// ইনিশিয়াল বাইন্ডিং
if (currentProduct) {
    bindProductDetails(currentProduct);
}

// ==========================================================================

// ==========================================================================

// Category Listing Page Filtering and Rendering Logic
const gridContainer = document.getElementById('product-grid');
const titleElement = document.getElementById('category-title');
const noProductMsg = document.getElementById('no-product-msg');
const loadMoreBtn = document.getElementById('load-more-btn');

let itemsToShow = 8; // শুরুতে ৮টি প্রোডাক্ট দেখাবে

// বর্তমান পেজের ফাইলের নাম থেকে ক্যাটাগরি স্বয়ংক্রিয়ভাবে বের করার লজিক 
const currentPage = window.location.pathname.split("/").pop().replace(".html", "").toLowerCase();
let resolvedCategory = categoryKey ? decodeURIComponent(categoryKey).trim() : null;

// ক্যাটাগরি ম্যাপিং ও সিনোনিম সাপোর্ট (নতুন ফাইলনেম এবং পুরাতন ডেটাবেজ ক্যাটাগরির মধ্যে নির্ভুল মিল)
const categoryAliasesMap = {
    'women': ['women', 'woman', 'oud', 'premium-oud'],
    'woman': ['women', 'woman', 'oud', 'premium-oud'],
    'men': ['men', 'man', 'parfum', 'eau-de-parfum'],
    'man': ['men', 'man', 'parfum', 'eau-de-parfum'],
    'kids': ['kids', 'kid', 'attar', 'premium-attar'],
    'kid': ['kids', 'kid', 'attar', 'premium-attar'],
    'unisex': ['unisex'],
    'gift-sets': ['gift-sets', 'giftsets', 'giftset', 'mens-luxury', 'gift'],
    'giftsets': ['gift-sets', 'giftsets', 'giftset', 'mens-luxury', 'gift'],
    'giftset': ['gift-sets', 'giftsets', 'giftset', 'mens-luxury', 'gift'],
    'oud': ['women', 'woman', 'oud', 'premium-oud'],
    'parfum': ['men', 'man', 'parfum', 'eau-de-parfum'],
    'attar': ['kids', 'kid', 'attar', 'premium-attar'],
    'mens-luxury': ['gift-sets', 'giftsets', 'giftset', 'mens-luxury', 'gift']
};

function getCategoryAliases(cat) {
    if (!cat) return [];
    const clean = cat.trim().toLowerCase().replace(/[\s\-_]+/g, '');
    for (let [key, list] of Object.entries(categoryAliasesMap)) {
        if (key.replace(/[\s\-_]+/g, '') === clean) {
            return list.map(item => item.replace(/[\s\-_]+/g, ''));
        }
    }
    return [clean];
}

if (!resolvedCategory) {
    if (currentPage === "women" || currentPage === "woman" || currentPage === "oud" || currentPage === "premium-oud") {
        resolvedCategory = "women";
    } else if (currentPage === "men" || currentPage === "man" || currentPage.includes("parfum")) {
        resolvedCategory = "men";
    } else if (currentPage === "kids" || currentPage === "kid" || currentPage === "attar" || currentPage === "premium-attar") {
        resolvedCategory = "kids";
    } else if (currentPage === "unisex") {
        resolvedCategory = "unisex";
    } else if (currentPage === "gift-sets" || currentPage === "giftset" || currentPage === "giftsets" || currentPage === "mens-luxury") {
        resolvedCategory = "gift-sets";
    } else if (currentPage === "signature-attar" || currentPage === "signature-attar & oils") {
        resolvedCategory = "signature-attar";
    }
}

// এই ফাংশনটি ক্যাটাগরি ও ফিল্টার অনুযায়ী সমস্ত প্রোডাক্ট গ্রিডে পেজিনেশন সহ রেন্ডার করে
function renderProducts(filterCategory) {
    if (!gridContainer) return;

    gridContainer.innerHTML = "";
    // হিরো ব্যানার কোনো অবস্থাতেই প্রোডাক্ট গ্রিডে দেখানো হবে না
    let matchedProducts = allProducts.filter(p => !isBannerItem(p) && !isOutOfStock(p));

    // ==========================================
    // ১. প্রথমে চেক করা হচ্ছে ইউআরএলে কোনো সার্চ কুয়েরি আছে কি না
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery) {
        const cleanQuery = searchQuery.toLowerCase().trim();
        if (titleElement) {
            titleElement.innerText = `Search Results for: "${searchQuery}"`;
        }

        // প্রোডাক্টের নাম (title) বা ব্র্যান্ড (brand) বা ক্যাটাগরি দিয়ে ফিল্টার করা
        matchedProducts = matchedProducts.filter(p => {
            const titleMatch = p.title && p.title.toLowerCase().includes(cleanQuery);
            const brandMatch = p.brand && p.brand.toLowerCase().includes(cleanQuery);
            const categoryMatch = p.category && p.category.toLowerCase().includes(cleanQuery);
            return titleMatch || brandMatch || categoryMatch;
        });
    }
    // ২. সার্চ না থাকলে ক্যাটাগরি অনুযায়ী নির্দিষ্ট নাম শো করবে
    else if (filterCategory) {
        if (titleElement) {
            const cleanFilter = filterCategory.trim().toLowerCase().replace(/[\s\-_]+/g, '');

            if (cleanFilter.includes("women") || cleanFilter.includes("woman") || cleanFilter.includes("oud")) {
                titleElement.innerText = "WOMEN";
            } else if (cleanFilter.includes("men") || cleanFilter.includes("man") || cleanFilter.includes("parfum")) {
                titleElement.innerText = "MEN";
            } else if (cleanFilter.includes("kids") || cleanFilter.includes("kid") || cleanFilter.includes("attar")) {
                titleElement.innerText = "KIDS";
            } else if (cleanFilter.includes("unisex")) {
                titleElement.innerText = "UNISEX";
            } else if (cleanFilter.includes("giftsets") || cleanFilter.includes("giftset") || cleanFilter.includes("gift") || cleanFilter.includes("mensluxury")) {
                titleElement.innerText = "GIFT SETS";
            } else {
                titleElement.innerText = filterCategory.replace(/[-_]/g, ' ').toUpperCase();
            }
        }

        const aliases = getCategoryAliases(filterCategory);
        matchedProducts = matchedProducts.filter(p => {
            if (!p.category) return false;
            const pCat = p.category.trim().toLowerCase().replace(/[\s\-_]+/g, '');
            return aliases.some(al => pCat === al || pCat.includes(al) || al.includes(pCat));
        });
    } else {
        if (titleElement) {
            titleElement.innerText = "All Products";
        }
    }

    if (matchedProducts.length > 0) {
        if (noProductMsg) noProductMsg.classList.add('hidden');

        const currentProducts = matchedProducts.slice(0, itemsToShow);

        currentProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = "cursor-pointer bg-white border border-neutral-200 rounded overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative product-card";
            productCard.setAttribute('onclick', `window.location.href='product-details.html?id=${product.id}'`);

            const prodImg = product.images && product.images[0] ? product.images[0] : (product.image || '');

            productCard.innerHTML = ` 
                <div class="product-hover-popup absolute top-2 right-2 bg-neutral-900/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-20 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 backdrop-blur-sm"> 
                    <i class="fa-solid fa-eye text-[#F26522]"></i> Quick View 
                </div> 
                <div class="relative w-full h-48 overflow-hidden bg-neutral-100 flex items-center justify-center"> 
                    <img src="${prodImg}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${product.title || ''}"> 
                </div> 
                <div class="p-3 flex flex-col flex-grow"> 
                    <span class="text-[13px] font-bold text-neutral-400 uppercase tracking-widest min-h-[14px]">${product.brand ? product.brand : '&nbsp;'}</span> 
                    <h4 class="text-lg font-semibold text-neutral-800 line-clamp-2 mt-1 min-h-[32px]">${product.title || ''}</h4> 
                    
                    <div class="mt-2 flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 max-sm:flex-col max-sm:items-start max-sm:gap-2"> 
                    
                    <div class="flex flex-col"> 
                    <span class="text-lg font-bold text-[#F26522]">৳ ${product.price || ''}</span> 
                   
                   ${Number(product.oldPrice) > Number(product.price) ? `<span class="text-[17px] font-bold text-neutral-400 line-through">৳ ${product.oldPrice}</span>` : ''} 
                   
                   </div> 
                   
                        <button onclick="event.stopPropagation(); addProductToCartDirect('${product.id}');" class="bg-white border border-[#F26522] text-[#F26522] hover:bg-[#F26522] hover:text-white text-[15px] max-sm:text-[11px] px-3 max-sm:px-2 py-1 rounded transition-colors flex items-center gap-1 shadow-sm"> 
                            <i class="fa-solid fa-cart-shopping"></i> Add To Cart 
                        </button> 
                        
                    </div> 
                </div> 
            `;
            gridContainer.appendChild(productCard);
        });

        if (loadMoreBtn) {
            if (itemsToShow < matchedProducts.length) {
                loadMoreBtn.style.display = 'inline-block';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }

    } else {
        if (noProductMsg) noProductMsg.classList.remove('hidden');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }
}

// এই ফাংশনটি 'Load More' বাটনে ক্লিক করলে পরবর্তী ধাপের প্রোডাক্টগুলো গ্রিডে যুক্ত করে
function loadMoreProducts() {
    let matchedProducts = resolvedCategory ? allProducts.filter(p => {
        if (!p.category || isBannerItem(p) || isOutOfStock(p)) return false;
        const aliases = getCategoryAliases(resolvedCategory);
        const pCat = p.category.trim().toLowerCase().replace(/[\s\-_]+/g, '');
        return aliases.some(al => pCat === al || pCat.includes(al) || al.includes(pCat));
    }) : allProducts.filter(p => !isBannerItem(p) && !isOutOfStock(p));

    if (itemsToShow < matchedProducts.length) {
        itemsToShow += 4;
        renderProducts(resolvedCategory);
        if (typeof showPopupNotification === 'function') showPopupNotification("More new products loaded! 🚀");
    } else {
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
        if (typeof showPopupNotification === 'function') showPopupNotification("All products displayed!");
    }
}

// ক্যাটাগরি পেজের জন্য রেন্ডারিং ফাংশন অটোমেটিক কল করা
if (gridContainer) {
    renderProducts(resolvedCategory);
}

// "Load More" বাটনের ক্লিক হ্যান্ডলার
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        itemsToShow += 4;
        renderProducts(resolvedCategory);
    });
}

// ==========================================================================

// ==========================================================================

// ================= হোমপেজের নির্দিষ্ট সেকশন ডাইনামিক লোড করার ফাংশন =================
// এই ফাংশনটি হোমপেজের নির্দিষ্ট সেকশনে (যেমন: Best Sellers, New Arrivals) প্রোডাক্ট রেন্ডার করে
function renderHomeSectionProducts(sectionName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    // ব্যানার আইটেমগুলোকে মূল প্রোডাক্ট সেকশন থেকে সম্পূর্ণরূপে ফিল্টার করে বাদ দেওয়া হয়েছে
    const matched = allProducts.filter(p => {
        if (isBannerItem(p) || isOutOfStock(p)) return false;
        const pSection = p.homeSection ? p.homeSection.trim().toLowerCase() : "";
        const targetSection = sectionName.trim().toLowerCase();
        return pSection === targetSection;
    });

    if (matched.length === 0) {
        container.innerHTML = "<p class='text-xs text-neutral-400 col-span-full py-4 text-center'>No products found in this section.</p>";
        return;
    }

    matched.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = "cursor-pointer bg-white border border-neutral-200 rounded overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative product-card";
        productCard.setAttribute('onclick', `window.location.href='product-details.html?id=${product.id}'`);

        const prodImg = product.images && product.images[0] ? product.images[0] : (product.image || '');

        productCard.innerHTML = `
            <div class="product-hover-popup absolute top-2 right-2 bg-neutral-900/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-20 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5 backdrop-blur-sm">
                <i class="fa-solid fa-eye text-[#F26522]"></i> Quick View
            </div>
            <div class="relative w-full h-48 overflow-hidden bg-neutral-100 flex items-center justify-center">
                <img src="${prodImg}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${product.title || ''}">
            </div>
            <div class="p-3 flex flex-col flex-grow">
                <span class="text-[13px] font-bold text-neutral-400 uppercase tracking-widest min-h-[14px]">${product.brand ? product.brand : '&nbsp;'}</span>
                <h4 class="text-lg font-semibold text-neutral-800 line-clamp-2 mt-1 min-h-[32px]">${product.title || ''}</h4>
                 <div class="mt-2 flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 max-sm:flex-col max-sm:items-start max-sm:gap-2"> 
                    <div class="flex flex-col">
                    <span class="text-lg font-bold text-[#F26522]">৳ ${product.price || ''}</span>
                   ${Number(product.oldPrice) > Number(product.price) ? `<span class="text-[17px] font-bold text-neutral-400 line-through">৳ ${product.oldPrice}</span>` : ''}
                   </div>
                    <button onclick="event.stopPropagation(); addProductToCartDirect('${product.id}');" class="bg-white border border-[#F26522] text-[#F26522] hover:bg-[#F26522] hover:text-white text-[15px] max-sm:text-[11px] px-3 max-sm:px-2 py-1 rounded transition-colors flex items-center gap-1 shadow-sm">
                        <i class="fa-solid fa-cart-shopping"></i> Add To Cart
                    </button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// অটো স্লাইড পরিবর্তনের জন্য গ্লোবাল ভেরিয়েবল

// ==========================================================================

// এই ফাংশনটি ফায়ারবেস থেকে পাওয়া সম্পূর্ণ প্রোডাক্ট ডাটাবেস দিয়ে পুরো ওয়েবসাইটের প্রোডাক্ট মডিউল ইনিশিয়ালাইজ করে
window.initializeProducts = function (fbProducts, dbInstance) {
    if (fbProducts && fbProducts.length > 0) {
        // হিরো ব্যানারগুলোকে আলাদা গ্লোবাল রেফারেন্সে রাখা হলো
        window.allBanners = fbProducts.filter(isBannerItem);

        // ফায়ারবেসের ডাটা থেকে হিরো ব্যানারগুলো সম্পূর্ণরূপে বাদ দিয়ে কেবল আসল বিক্রয়যোগ্য প্রোডাক্ট রাখা হলো
        allProducts = fbProducts
            .filter(p => !isBannerItem(p))
            .map(p => ({
                ...p,
                category: p.category || p.productCategory || p.cat || "general"
            }));
        window.allProducts = allProducts;
    }

    if (gridContainer) {
        renderProducts(resolvedCategory);
    }

    renderHomeSectionProducts("Premium Combos", "premium-combos-grid");
    renderHomeSectionProducts("Signature Attar & Oils", "signature-attar-grid");

    if (typeof productId !== 'undefined' && (!currentProduct || currentProduct === null)) {
        const found = allProducts.find(p => p.id == productId);
        if (found) {
            currentProduct = found;
            bindProductDetails(currentProduct);
        }
    }

    if (dbInstance) {
        loadDynamicBanners(dbInstance);
    }
};

// ==========================================================================
// ১১. পেজ লোড মাস্টার ইভেন্ট লিসেনার (Master DOMContentLoaded Event Dispatcher)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ক. প্রোডাক্ট ডিটেইলস পেজে রিভিউ লোড করা
    const activeProdId = (typeof productId !== 'undefined' ? productId : null) || (typeof currentProduct !== 'undefined' && currentProduct?.id ? currentProduct.id : null) || new URLSearchParams(window.location.search).get('id') || "1";
    if (typeof renderProductReviews === 'function') {
        renderProductReviews(activeProdId);
    }

    // খ. হোমপেজের নির্দিষ্ট গ্রিড সেকশন লোড করা
    if (typeof renderHomeSectionProducts === 'function') {
        renderHomeSectionProducts("Premium Combos", "premium-combos-grid");
        renderHomeSectionProducts("Signature Attar & Oils", "signature-attar-grid");
    }

    // গ. কার্ট পেজ আইটেম এবং ব্যাজ কাউন্ট রিফ্রেশ করা
    if (typeof renderCartPageItems === 'function') renderCartPageItems();
    if (typeof updateCartBadgeCount === 'function') updateCartBadgeCount();

    // ঘ. হিরো স্লাইডার অপাসিটি ট্রানজিশন সেটআপ
    const slideImage = document.querySelector('#slide-1 img');
    if (slideImage) {
        slideImage.style.transition = 'opacity 0.5s ease-in-out';
    }

    // ঙ. অ্যাড টু কার্ট বাটনগুলোর ক্লিক ইভেন্ট হ্যান্ডলিং
    const cartButtons = document.querySelectorAll('.add-to-cart-btn');
    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleProtectedAction('cart');
        });
    });

    // চ. প্রোডাক্ট কার্ড হোভার কুইক ভিউ পপআপ হ্যান্ডলার
    const gridContainer = document.getElementById('grid-container') || document.querySelector('.grid-container');
    if (gridContainer) {
        gridContainer.addEventListener('mouseenter', (e) => {
            const card = e.target.closest('.product-card');
            if (card) {
                const hoverPopup = card.querySelector('.product-hover-popup');
                if (hoverPopup) {
                    hoverPopup.classList.remove('opacity-0', 'invisible', 'translate-y-2');
                    hoverPopup.classList.add('opacity-100', 'visible', 'translate-y-0');
                }
            }
        }, true);
        gridContainer.addEventListener('mouseleave', (e) => {
            const card = e.target.closest('.product-card');
            if (card) {
                const hoverPopup = card.querySelector('.product-hover-popup');
                if (hoverPopup) {
                    hoverPopup.classList.remove('opacity-100', 'visible', 'translate-y-0');
                    hoverPopup.classList.add('opacity-0', 'invisible', 'translate-y-2');
                }
            }
        }, true);
    }

    // ছ. কোয়ান্টিটি ইনপুট পরিবর্তনের সাথে প্রাইস আপডেট
    const qtyInput = document.getElementById('quantity-input');
    if (qtyInput) {
        qtyInput.addEventListener('input', () => {
            let val = parseInt(qtyInput.value) || 1;
            if (val < 1) val = 1;
            if (typeof updateProductPrice === 'function') {
                updateProductPrice(val);
            }
        });
    }

    // জ. গ্লোবাল সার্চ ইনপুট ও বাটন ইভেন্ট লিসেনার
    const searchInput = document.querySelector('.nav-search-input');
    const searchBtn = document.querySelector('.nav-search-btn');

    if (searchBtn && typeof performSearch === 'function') {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput && typeof performSearch === 'function') {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// ==========================================================================

// ==========================================================================

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.loadMoreProducts = loadMoreProducts;
window.showPopupNotification = showPopupNotification;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.orderWhatsApp = orderWhatsApp;
window.callForOrder = callForOrder;
window.changeMainImage = changeMainImage;
window.addProductToCartDirect = addProductToCartDirect;
window.removeFromCart = removeFromCart;
window.renderCartPageItems = renderCartPageItems;
window.updateCartBadgeCount = updateCartBadgeCount;
window.initHeroSliders = initHeroSliders;


// Window Global Exports
window.renderProducts = renderProducts;
window.loadMoreProducts = loadMoreProducts;
window.bindProductDetails = bindProductDetails;
window.loadRelatedProducts = loadRelatedProducts;
window.changeMainImage = changeMainImage;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.updateProductPrice = updateProductPrice;
