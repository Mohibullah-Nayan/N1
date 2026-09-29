// ================= সম্পূর্ণ প্রোডাক্ট ডেটাবেজ এবং স্টেট ম্যানেজমেন্ট =================
const urlParams = new URLSearchParams(window.location.search);
const rawProductId = urlParams.get('id') || "1";

// ক্যাটাগরি বা cat যেটা দিয়েই আসুক তা যেন ঠিকঠাক কাজ করে এবং পার্সিং ঠিক থাকে
const categoryKey = urlParams.get('category') || urlParams.get('cat');

// ১০০% নিশ্চিত করার জন্য গ্লোবাল অ্যারে তৈরি করা হলো (ফায়ারবেস বা স্ট্যাটিক ডেটা থেকে)
let allProducts = typeof productsData !== 'undefined' ? Object.values(productsData) : [];

// আইডি স্ট্রিং বা নাম্বার যাই হোক না কেন সঠিকভাবে খুঁজে বের করার লজিক
let currentProduct = null;
if (typeof productsData !== 'undefined') {
    currentProduct = productsData[rawProductId] || Object.values(productsData).find(p => String(p.id) === String(rawProductId));
}
const productId = currentProduct ? currentProduct.id : rawProductId;

// Product Details Page Binding Function
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
}

// রিলেটেড প্রোডাক্ট রেন্ডার করার ফাংশন
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
    let related = productsArray.filter(p => String(p.id) !== String(currentId) && p.category === currentCategory);

    // পর্যাপ্ত না থাকলে অন্য ক্যাটেগরি থেকে নেওয়া
    if (related.length < 4) {
        const others = productsArray.filter(p => String(p.id) !== String(currentId) && p.category !== currentCategory);
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

// Category Listing Page Filtering and Rendering Logic
const gridContainer = document.getElementById('product-grid');
const titleElement = document.getElementById('category-title');
const noProductMsg = document.getElementById('no-product-msg');
const loadMoreBtn = document.getElementById('load-more-btn');

let itemsToShow = 8; // শুরুতে ৮টি প্রোডাক্ট দেখাবে

// বর্তমান পেজের ফাইলের নাম থেকে ক্যাটাগরি স্বয়ংক্রিয়ভাবে বের করার লজিক 
const currentPage = window.location.pathname.split("/").pop().replace(".html", "").toLowerCase();
let resolvedCategory = categoryKey ? decodeURIComponent(categoryKey).trim() : null;

if (!resolvedCategory) {
    if (currentPage === "oud" || currentPage === "premium-oud") {
        resolvedCategory = "premium-oud";
    } else if (currentPage.includes("parfum")) {
        resolvedCategory = "eau-de-parfum";
    } else if (currentPage === "attar" || currentPage === "premium-attar") {
        resolvedCategory = "premium-attar";
    } else if (currentPage === "signature-attar" || currentPage === "signature-attar & oils") {
        resolvedCategory = "signature-attar";
    } else if (currentPage === "gift-sets") {
        resolvedCategory = "gift-sets";
    } else if (currentPage === "mens-luxury") {
        resolvedCategory = "mens-luxury";
    }
}

function renderProducts(filterCategory) {
    if (!gridContainer) return;

    gridContainer.innerHTML = "";
    let matchedProducts = allProducts;

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

            if (cleanFilter.includes("parfum")) {
                titleElement.innerText = "MEN";
            } else if (cleanFilter.includes("oud")) {
                titleElement.innerText = "WOMEN";
            } else if (cleanFilter.includes("attar")) {
                titleElement.innerText = "KIDS";
            } else if (cleanFilter.includes("giftsets") || cleanFilter.includes("gift-sets")) {
                titleElement.innerText = "UNISEX";
            } else if (cleanFilter.includes("mensluxury") || cleanFilter.includes("mens-luxury")) {
                titleElement.innerText = "GIFT SETS";
            } else {
                titleElement.innerText = filterCategory.replace(/[-_]/g, ' ').toUpperCase();
            }
        }

        const cleanFilter = filterCategory.trim().toLowerCase().replace(/[\s\-_]+/g, '');
        matchedProducts = matchedProducts.filter(p => {
            if (!p.category) return false;
            const pCat = p.category.trim().toLowerCase().replace(/[\s\-_]+/g, '');
            return pCat === cleanFilter || pCat.includes(cleanFilter) || cleanFilter.includes(pCat);
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

// ================= রিয়েল-টাইম রিভিউ এবং রেটিং সিস্টেম লজিক =================

function getProductReviews(prodId) {
    let allReviews = JSON.parse(localStorage.getItem('nayan_product_reviews')) || {};
    // আইডি স্ট্রিং বা নাম্বার যাই হোক না কেন তা খুঁজে বের করার জন্য ফ্লেক্সিবল চেক
    let targetKey = Object.keys(allReviews).find(k => String(k) === String(prodId));
    return targetKey ? allReviews[targetKey] : (allReviews[prodId] || []);
}

function saveProductReview(prodId, reviewObj) {
    let allReviews = JSON.parse(localStorage.getItem('nayan_product_reviews')) || {};
    let targetKey = Object.keys(allReviews).find(k => String(k) === String(prodId)) || prodId;

    if (!allReviews[targetKey]) {
        allReviews[targetKey] = [];
    }
    allReviews[targetKey].unshift(reviewObj);
    localStorage.setItem('nayan_product_reviews', JSON.stringify(allReviews));
}

// অ্যাডমিন চেক করার ফাংশন (আপনার নির্দিষ্ট অ্যাডমিন ইমেল সেট করা হয়েছে)
function checkIsAdmin() {
    const user = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    const adminEmail = "mohibullahnayan.cse@gmail.com";

    // লোকালস্টোরেজ থেকে অ্যাডমিন লগইন স্ট্যাটাস বা ইমেল চেক করা
    const isLocalStorageAdmin = localStorage.getItem('isAdminLoggedIn') === 'true' ||
        localStorage.getItem('adminEmail') === adminEmail ||
        localStorage.getItem('adminLoged') === 'true';

    if (user && user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
        return true;
    }

    return isLocalStorageAdmin || (user && user.isAdmin === true);
}

// রিভিউ ডিলিট করার ফাংশন (কাস্টমার শুধু নিজেরটা এবং অ্যাডমিন সবারটা ডিলিট করতে পারবে)
function deleteProductReview(prodId, reviewIndex) {
    let allReviews = JSON.parse(localStorage.getItem('nayan_product_reviews')) || {};
    let targetKey = Object.keys(allReviews).find(k => String(k) === String(prodId));

    if (!targetKey || !allReviews[targetKey][reviewIndex]) {
        return;
    }

    const reviewToDelete = allReviews[targetKey][reviewIndex];
    const currentUser = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    const isAdmin = checkIsAdmin();

    // শক্তিশালী ও ফ্লেক্সিবল পারমিশন চেক (নাম ও ইমেলের ছোট-বড় হাতের অক্ষরের অমিল দূর করতেtoLowerCase() ব্যবহার করা হয়েছে)
    let isOwner = false;
    if (currentUser) {
        const currentEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : "";
        const currentEmailPrefix = currentUser.email ? currentUser.email.split('@')[0].toLowerCase().trim() : "";
        const currentDisplayName = currentUser.displayName ? currentUser.displayName.toLowerCase().trim() : "";
        const currentUserNameField = currentUser.name ? currentUser.name.toLowerCase().trim() : "";
        const currentUid = currentUser.uid ? String(currentUser.uid).trim() : "";

        const revName = reviewToDelete.name ? reviewToDelete.name.toLowerCase().trim() : "";
        const revEmail = reviewToDelete.userEmail ? reviewToDelete.userEmail.toLowerCase().trim() : "";
        const revUid = reviewToDelete.userId ? String(reviewToDelete.userId).trim() : "";

        isOwner = (revEmail && revEmail === currentEmail) ||
            (revUid && revUid === currentUid) ||
            (revName === currentDisplayName) ||
            (revName === currentEmailPrefix) ||
            (revName === currentUserNameField);
    }

    if (!isAdmin && !isOwner) {
        if (typeof showPopupNotification === 'function') {
            showPopupNotification("Sorry, you can only delete your own reviews!");
        } else {
            alert("Sorry, you can only delete your own reviews!");
        }
        return;
    }

    // রিভিউ ডিলিট সম্পন্ন করা
    allReviews[targetKey].splice(reviewIndex, 1);
    localStorage.setItem('nayan_product_reviews', JSON.stringify(allReviews));

    if (typeof showPopupNotification === 'function') {
        showPopupNotification("Review deleted successfully! 🗑️");
    }

    // ইনস্ট্যান্ট পেজ বা গ্রাফ আপডেট করা
    renderProductReviews(targetKey);
}

let selectedReviewRating = 5;
function setReviewRating(rating) {
    selectedReviewRating = rating;
    const stars = document.querySelectorAll('#star-rating-selector i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('fa-regular');
            star.classList.add('fa-solid');
        } else {
            star.classList.remove('fa-solid');
            star.classList.add('fa-regular');
        }
    });
}

function submitProductReview(prodId, event) {
    // পেজ রিলোড হওয়া আটকাতে ফিক্সড প্রিভেন্ট ডিফল্ট
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // যদি প্রডাক্ট আইডি প্যারামিটার থেকে না পাওয়া যায়, তবে URL থেকে বা গ্লোবাল আইডি থেকে নেওয়া হবে
    const targetProdId = prodId || (typeof productId !== 'undefined' ? productId : null) || (typeof currentProduct !== 'undefined' && currentProduct?.id ? currentProduct.id : null) || new URLSearchParams(window.location.search).get('id') || "1";

    const user = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    if (!user) {
        if (typeof showPopupNotification === 'function') {
            showPopupNotification("Please sign in to submit a review!");
        } else {
            alert("Please sign in to submit a review!");
        }
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return false;
    }

    const commentInput = document.getElementById('review-comment-input');
    const comment = commentInput ? commentInput.value.trim() : '';

    if (!comment) {
        if (typeof showPopupNotification === 'function') {
            showPopupNotification("Please write your feedback or review!");
        } else {
            alert("Please write your feedback or review!");
        }
        return false;
    }

    let userName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : "Valued Customer");

    const newReview = {
        name: userName,
        userEmail: user.email || "", // ইউজার চেনার জন্য ইমেল সেভ রাখা হলো
        userId: user.uid || "",     // ইউজার আইডি থাকলে তা সেভ রাখা হলো
        role: "Verified Buyer",
        rating: selectedReviewRating,
        comment: comment,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    saveProductReview(targetProdId, newReview);

    if (commentInput) commentInput.value = "";
    setReviewRating(5);

    if (typeof showPopupNotification === 'function') {
        showPopupNotification("Your review has been submitted successfully! 🎉");
    }

    renderProductReviews(targetProdId);
    return false; // যাতে কোনোভাবেই পেজ রিলোড না হয়
}

// পেজ লোড হওয়ার সাথে সাথে বর্তমান প্রডাক্টের আইডি নিয়ে রেটিং সামারি আপডেট করবে
document.addEventListener("DOMContentLoaded", () => {
    const activeProdId = (typeof productId !== 'undefined' ? productId : null) || (typeof currentProduct !== 'undefined' && currentProduct?.id ? currentProduct.id : null) || new URLSearchParams(window.location.search).get('id') || "1";
    renderProductReviews(activeProdId);
});

// ================= রেটিং সামারি এবং রেন্ডারিং লজিক (একীভূত ও সম্পূর্ণ) =================
function renderProductReviews(prodId) {
    const targetProdId = prodId || (typeof productId !== 'undefined' ? productId : null) || (typeof currentProduct !== 'undefined' && currentProduct?.id ? currentProduct.id : null) || new URLSearchParams(window.location.search).get('id') || "1";
    const reviews = getProductReviews(targetProdId);
    const container = document.getElementById('customer-reviews-container');

    // আপনার এইচটিএমএল আইডির সাথে মিল রেখে সকল এলিমেন্ট সিলেক্ট করা হলো
    const avgRatingElem = document.getElementById('avg-rating');
    const avgStarsContainer = document.getElementById('rating-stars-container');
    const totalReviewsElem = document.getElementById('total-reviews-count');
    const tabReviewCount = document.getElementById('tab-review-count');
    const recTextElem = document.getElementById('recommendation-text');
    const reviewCountDisplays = document.querySelectorAll('.review-count-display');

    // ট্যাবের হেডারে থাকা রিভিউ কাউন্ট আপডেট
    if (tabReviewCount) {
        tabReviewCount.innerText = `(${reviews.length})`;
    }

    reviewCountDisplays.forEach(el => {
        el.innerText = `(${reviews.length} Reviews)`;
    });

    if (totalReviewsElem) {
        totalReviewsElem.innerText = `(${reviews.length} Reviews)`;
    }

    if (reviews.length === 0) {
        if (avgRatingElem) avgRatingElem.innerText = "0.0";
        if (avgStarsContainer) {
            avgStarsContainer.innerHTML = '<i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i>';
        }
        if (recTextElem) {
            recTextElem.innerText = `0.00% Recommended (0 of 0)`;
        }
        for (let i = 1; i <= 5; i++) {
            const bar = document.getElementById(`bar-star-${i}`) || document.getElementById(`rating-bar-${i}`);
            const percent = document.getElementById(`percent-star-${i}`) || document.getElementById(`rating-percent-${i}`);
            if (bar) bar.style.width = '0%';
            if (percent) percent.innerText = '0%';
        }
        if (container) {
            container.innerHTML = '<p class="text-xs text-neutral-400 text-center py-4">No reviews yet. Be the first to review!</p>';
        }
        return;
    }

    let totalScore = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach(rev => {
        let r = parseInt(rev.rating) || 5;
        totalScore += r;
        if (ratingCounts[r] !== undefined) {
            ratingCounts[r]++;
        }
    });

    let avgRating = (totalScore / reviews.length).toFixed(1);
    if (avgRatingElem) avgRatingElem.innerText = avgRating;

    // গড় রেটিং অনুযায়ী উপরের স্টার আইকন কালার আপডেট
    if (avgStarsContainer) {
        let starsHtml = '';
        let fullStars = Math.floor(parseFloat(avgRating));
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHtml += '<i class="fa-solid fa-star"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star"></i>';
            }
        }
        avgStarsContainer.innerHTML = starsHtml;
    }

    // রেকমেন্ডেশন পার্সেন্টেজ হিসাব (ধরে নেওয়া হলো ৪ বা ৫ স্টার হলে রিকমেন্ডেড)
    const recommendedCount = ratingCounts[4] + ratingCounts[5];
    const recPercent = ((recommendedCount / reviews.length) * 100).toFixed(2);
    if (recTextElem) {
        recTextElem.innerText = `${recPercent}% Recommended (${recommendedCount} of ${reviews.length})`;
    }

    // ৫ থেকে ১ স্টার বার এবং পার্সেন্টেজ আপডেট (উভয় আইডি ফরম্যাট সাপোর্ট করবে)
    for (let i = 1; i <= 5; i++) {
        let count = ratingCounts[i];
        let percentage = Math.round((count / reviews.length) * 100);

        const bar = document.getElementById(`bar-star-${i}`) || document.getElementById(`rating-bar-${i}`);
        const percent = document.getElementById(`percent-star-${i}`) || document.getElementById(`rating-percent-${i}`);

        if (bar) bar.style.width = percentage + '%';
        if (percent) percent.innerText = percentage + '%';
    }

    // লগইন করা ইউজার এবং অ্যাডমিন স্ট্যাটাস চেক করা
    const currentUser = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    const isAdmin = checkIsAdmin();

    // কাস্টমার রিভিউ কার্ড রেন্ডার করা
    if (container) {
        container.innerHTML = "";
        reviews.forEach((rev, index) => {
            let starHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rev.rating) {
                    starHtml += '<i class="fa-solid fa-star"></i>';
                } else {
                    starHtml += '<i class="fa-regular fa-star"></i>';
                }
            }

            // শক্তিশালী ও ফ্লেক্সিবল ওনারশিপ ম্যাচিং লজিক
            let isOwner = false;
            if (currentUser) {
                const currentEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : "";
                const currentEmailPrefix = currentUser.email ? currentUser.email.split('@')[0].toLowerCase().trim() : "";
                const currentDisplayName = currentUser.displayName ? currentUser.displayName.toLowerCase().trim() : "";
                const currentUserNameField = currentUser.name ? currentUser.name.toLowerCase().trim() : "";
                const currentUid = currentUser.uid ? String(currentUser.uid).trim() : "";

                const revName = rev.name ? rev.name.toLowerCase().trim() : "";
                const revEmail = rev.userEmail ? rev.userEmail.toLowerCase().trim() : "";
                const revUid = rev.userId ? String(rev.userId).trim() : "";

                isOwner = (revEmail && revEmail === currentEmail) ||
                    (revUid && revUid === currentUid) ||
                    (revName === currentDisplayName) ||
                    (revName === currentEmailPrefix) ||
                    (revName === currentUserNameField);
            }

            let deleteButtonHtml = "";
            if (isAdmin || isOwner) {
                deleteButtonHtml = `
                    <button onclick="deleteProductReview('${targetProdId}', ${index})" class="absolute top-3 right-3 text-red-500 hover:text-red-700 text-[11px] font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer border border-red-200 shadow-sm z-10" title="Delete Review">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                `;
            }

            const reviewCard = document.createElement('div');
            reviewCard.className = "bg-neutral-50 border border-neutral-200 p-4 rounded-lg space-y-2 relative min-h-[85px]";
            reviewCard.innerHTML = `
                <div class="flex items-center justify-between pr-20">
                    <h5 class="text-xs font-bold text-neutral-800">${rev.name} <span class="text-[10px] font-normal text-neutral-400 ml-1">(${rev.date})</span></h5>
                    <div class="text-amber-400 text-xs flex gap-0.5">${starHtml}</div>
                </div>
                <p class="text-xs text-neutral-600 leading-relaxed pr-16">${rev.comment}</p>
                <span class="inline-block text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded">${rev.role}</span>
                ${deleteButtonHtml}
            `;
            container.appendChild(reviewCard);
        });
    }
}
// পেজ লোড হওয়ার সাথে সাথে যেন প্রোডাক্টগুলো রেন্ডার হয়, সেজন্য ফাংশনটি কল করা হলো
renderProducts(resolvedCategory);

// ================= হোমপেজের নির্দিষ্ট সেকশন ডাইনামিক লোড করার ফাংশন =================
function renderHomeSectionProducts(sectionName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    // ব্যানার আইটেমগুলোকে মূল প্রোডাক্ট সেকশন থেকে ফিল্টার করে বাদ দেওয়া হয়েছে
    const matched = allProducts.filter(p => {
        const pSection = p.homeSection ? p.homeSection.trim().toLowerCase() : "";
        const targetSection = sectionName.trim().toLowerCase();

        // যদি আইটেমটি 'slider-1' বা ব্যানার হয় এবং বর্তমান সেকশনটি স্লাইডার না হয়, তবে বাদ যাবে
        if (pSection === "slider-1" && targetSection !== "slider-1") {
            return false;
        }

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
let bannerInterval = null;

async function loadDynamicBanners(db) {
    try {
        const { collection, onSnapshot, query } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        // ক্যাশ সমস্যা এড়াতে সরাসরি সার্ভার থেকে লাইভ ডেটা নেওয়ার জন্য কোয়েরি তৈরি
        const q = query(collection(db, "products"));

        onSnapshot(q, { includeMetadataChanges: true }, (querySnapshot) => {
            let firebaseSlideImages = [];
            window.firebaseSlideProductIds = [];

            let allDocs = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allDocs.push({
                    id: doc.id,
                    createdAt: data.createdAt || data.timestamp || data.date || 0, // সর্টিংয়ের জন্য টাইমস্ট্যাম্প বা ব্যাকআপ
                    ...data
                });
            });

            // ডক্যুমেন্টগুলোকে ক্রিয়েশন টাইম বা অর্ডারের ভিত্তিতে সঠিকভাবে সাজানো (যাতে নতুনগুলো সবসময় শেষে থাকে)
            allDocs.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return a.createdAt > b.createdAt ? 1 : -1;
                }
                return 0;
            });

            // ================= [ হিরো স্লাইডার ১ (slider-1) লজিক ] =================
            let slider1Products = allDocs.filter(p => {
                const section = p.homeSection ? p.homeSection.trim() : "";
                const imgUrl = p.images && p.images[0] ? p.images[0] : p.image;
                return imgUrl && section === "slider-1";
            });

            // সর্টেড লিস্ট থেকে একদম লেটেস্ট ৩টি প্রোডাক্ট নিশ্চিত করা
            let finalHeroProducts = slider1Products.length > 0 ? slider1Products.slice(-3) : allDocs.filter(p => p.images && p.images[0] || p.image).slice(-3);

            finalHeroProducts.forEach(product => {
                const imgUrl = product.images && product.images[0] ? product.images[0] : product.image;
                firebaseSlideImages.push(imgUrl);
                window.firebaseSlideProductIds.push(product.id);
            });

            // স্লাইডার ইনিশিয়োলাইজ ও রানিং লজিক (স্লাইডার অ্যারে রিয়েল-টাইমে আপডেট নিশ্চিতকরণ)
            if (firebaseSlideImages.length > 0) {
                const isArrayChanged = JSON.stringify(bannerImages) !== JSON.stringify(firebaseSlideImages);

                bannerImages = [...firebaseSlideImages];

                if (isArrayChanged) {
                    currentImageIndex = 0; // নতুন প্রোডাক্ট আসলে একদম প্রথম স্লাইড থেকে রিসেট হবে
                }

                showSlideImage(currentImageIndex);

                const slideContainer = document.querySelector('#slide-1');
                if (slideContainer) {
                    // ব্যানার হওয়ায় এতে কোনো ক্লিক বা ডিটেইলস পেজে যাওয়ার লিংক কাজ করবে না
                    slideContainer.style.cursor = 'default';
                    slideContainer.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
            }

            // হিরো সেকশনের প্রথম ডিসপ্লে ইমেজ ও টাইটেল আপডেট
            if (finalHeroProducts.length > 0) {
                const firstProd = finalHeroProducts[currentImageIndex] || finalHeroProducts[0];
                const imgUrl = firstProd.images && firstProd.images[0] ? firstProd.images[0] : firstProd.image;
                const img = document.getElementById("hero-img-1");
                const title = document.getElementById("hero-title-1");

                if (img) {
                    img.src = imgUrl + "?t=" + new Date().getTime();
                    img.style.cursor = "default";
                    img.className = "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500";

                    // ইমেজে ক্লিক করলে প্রোডাক্ট ডিটেইলসে যাবে না
                    img.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
                if (title && firstProd.title) title.innerHTML = firstProd.title;
            }

            // পেজ লোড হওয়ার পর ব্যানার এবং টাইটেলগুলো দৃশ্যমান করার ক্লাস যুক্ত করা
            document.querySelectorAll('#hero-img-1, #hero-img-2, #side-banner-img, #hero-title-1, #hero-title-2, #side-banner-title').forEach(el => {
                el.classList.add('banner-loaded');
            });

            // ================= [ ৩ সেকেন্ড পরপর অটো স্লাইড পরিবর্তনের টাইমার ] =================
            if (!bannerInterval && bannerImages.length > 1) {
                bannerInterval = setInterval(() => {
                    currentImageIndex = (currentImageIndex + 1) % bannerImages.length;

                    // স্লাইড ইমেজ আপডেট
                    showSlideImage(currentImageIndex);

                    // হিরো ইমেজ ও টাইটেল আপডেট
                    const currentProd = finalHeroProducts[currentImageIndex] || finalHeroProducts[0];
                    if (currentProd) {
                        const imgUrl = currentProd.images && currentProd.images[0] ? currentProd.images[0] : currentProd.image;
                        const img = document.getElementById("hero-img-1");
                        const title = document.getElementById("hero-title-1");

                        if (img && imgUrl) {
                            img.src = imgUrl + "?t=" + new Date().getTime();
                        }
                        if (title && currentProd.title) {
                            title.innerHTML = currentProd.title;
                        }
                    }
                }, 3000); // ৩০০০ মিলিভসেকেন্ড = ৩ সেকেন্ড
            }
        });

    } catch (error) {
        console.error("Dynamic Banner load error: ", error);
    }
}
window.initializeProducts = function (fbProducts, dbInstance) {
    if (fbProducts && fbProducts.length > 0) {
        // ফায়ারবেসের ডাটার সাথে নরমালাইজড ক্যাটাগরি ফিল্ড নিশ্চিত করা
        allProducts = fbProducts.map(p => ({
            ...p,
            category: p.category || p.productCategory || p.cat || "general"
        }));
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

if (gridContainer) {
    renderProducts(resolvedCategory);
}

document.addEventListener("DOMContentLoaded", () => {
    renderHomeSectionProducts("Premium Combos", "premium-combos-grid");
    renderHomeSectionProducts("Signature Attar & Oils", "signature-attar-grid");
    if (typeof renderCartPageItems === 'function') renderCartPageItems();
    if (typeof updateCartBadgeCount === 'function') updateCartBadgeCount();

    // ==========================================
    // হোম পেজ এবং অন্যান্য পেজের সার্চ অপশন সচল করার কোড
    // ==========================================
    const searchInput = document.querySelector('.nav-search-input');
    const searchBtn = document.querySelector('.nav-search-btn');

    function performSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim();
        if (query !== "") {
            // ব্যবহারকারীকে products.html পেজে সার্চ কুয়েরি সহ রিডাইরেক্ট করবে
            window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});
function loadMoreProducts() {
    let matchedProducts = resolvedCategory ? allProducts.filter(p => {
        if (!p.category) return false;
        const cleanFilter = resolvedCategory.trim().toLowerCase().replace(/[\s_]+/g, '-');
        const pCat = p.category.trim().toLowerCase().replace(/[\s_]+/g, '-');
        return pCat === cleanFilter || pCat.includes(cleanFilter) || cleanFilter.includes(pCat);
    }) : allProducts;

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
function updateProductPrice(qty) {
    if (!currentProduct) return;

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

function increaseQty() {
    const input = document.getElementById('quantity-input');
    if (input) {
        let val = parseInt(input.value) || 1;
        let newQty = val + 1;
        input.value = newQty;
        updateProductPrice(newQty);
    }
}

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
/// ================= ফায়ারবেস অথেন্টিকেশন চেক এবং প্রটেক্টেড অ্যাকশন লজিক =================
function checkUserLoggedIn() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        return firebase.auth().currentUser;
    }
    return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
}

// ইউজারভিত্তিক কার্ট কি (Key) পাওয়ার ফাংশন যাতে একেক ইউজারের কার্ট আলাদা থাকে
function getCartStorageKey() {
    const user = checkUserLoggedIn();
    if (user && user.uid) {
        return 'nayan_cart_' + user.uid;
    } else if (user && user.email) {
        return 'nayan_cart_' + user.email;
    }
    return 'nayan_cart_guest';
}

// কার্টে প্রোডাক্ট সেভ করার সেন্ট্রালাইজড ফাংশন
function saveProductToCart(productObj, quantity) {
    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    let existingIndex = cart.findIndex(item => item.id == productObj.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += parseInt(quantity);
    } else {
        cart.push({
            id: productObj.id,
            title: productObj.title,
            price: productObj.price,
            image: productObj.images && productObj.images[0] ? productObj.images[0] : (productObj.image || ''),
            quantity: parseInt(quantity)
        });
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));

    // ব্যাকগ্রাউন্ডে ফায়ারবেস ডেটাবেসে সিঙ্ক করার জন্য অতিরিক্ত কল
    syncCartToFirebaseDatabase(cart);
}

function handleProtectedAction(actionType) {
    const user = checkUserLoggedIn();

    if (!user) {
        showPopupNotification("Please sign in to perform this action!");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return false;
    }

    const input = document.getElementById('quantity-input');
    const qty = input ? parseInt(input.value) || 1 : 1;
    const prodName = typeof currentProduct !== 'undefined' && currentProduct ? currentProduct.title : 'Product';

    if (actionType === 'cart') {
        if (typeof currentProduct !== 'undefined' && currentProduct) {
            saveProductToCart(currentProduct, qty);
        }
        showPopupNotification(`"${prodName}" (${qty} pieces) added to cart! 🛒`);
        updateCartBadgeCount();
    } else if (actionType === 'buynow') {
        if (typeof currentProduct !== 'undefined' && currentProduct) {
            saveProductToCart(currentProduct, qty);
        }
        // ফায়ারবেসে অর্ডার প্লেস করার ব্যাকগ্রাউন্ড ট্রিগার
        syncOrderToFirebaseDatabase();

        showPopupNotification(`"${prodName}" (${qty} pieces) is being checked out!`);
        setTimeout(() => {
            window.location.href = "cart.html";
        }, 1000);
    }
    return true;
}

// ডিরেক্ট গ্রিড থেকে কার্টে অ্যাড করার ফাংশন
function addProductToCartDirect(prodId) {
    const user = checkUserLoggedIn();
    if (!user) {
        showPopupNotification("Please sign in to perform this action!");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    const prod = typeof allProducts !== 'undefined' ? allProducts.find(p => p.id == prodId) : null;
    if (prod) {
        saveProductToCart(prod, 1);
        showPopupNotification(`"${prod.title}" added to cart! 🛒`);
        updateCartBadgeCount();
    }
}

// কার্ট পেজ থেকে প্রোডাক্ট ডিলিট করার ফাংশন
function removeFromCart(prodId) {
    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    cart = cart.filter(item => item.id != prodId);
    localStorage.setItem(cartKey, JSON.stringify(cart));

    // ব্যাকগ্রাউন্ডে ফায়ারবেস কার্ট আপডেট করা
    syncCartToFirebaseDatabase(cart);

    if (typeof renderCartPageItems === 'function') {
        renderCartPageItems();
    }
    updateCartBadgeCount();
    showPopupNotification("Product removed from cart!");
}

// কার্ট পেজে আইটেমগুলো প্রিমিয়াম কার্ড আকারে রেন্ডার করার ফাংশন
function renderCartPageItems() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total-price');
    const cartGrandTotalEl = document.getElementById('cart-grand-total');
    if (!cartContainer) return;

    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-xs w-full">
                <i class="fa-solid fa-basket-shopping text-4xl text-neutral-300 mb-3"></i>
                <p class="text-neutral-500 text-sm font-medium">Your cart is empty!</p>
                <a href="products.html" class="inline-block mt-4 px-5 py-2 bg-[#F26522] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors">Continue Shopping</a>
            </div>
        `;
        if (cartTotalEl) cartTotalEl.innerText = "৳0";
        if (cartGrandTotalEl) cartGrandTotalEl.innerText = "৳0";
        return;
    }

    let totalPrice = 0;

    cart.forEach(item => {
        let cleanPrice = parseInt(String(item.price).replace(/[^\d]/g, '')) || 0;
        let itemTotal = cleanPrice * item.quantity;
        totalPrice += itemTotal;

        const cardDiv = document.createElement('div');
        cardDiv.className = "bg-white border border-neutral-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:shadow-md hover:border-[#F26522]/50 transition-all cursor-pointer";
        cardDiv.setAttribute('onclick', `window.location.href='product-details.html?id=${item.id}'`);

        cardDiv.innerHTML = `
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <img src="${item.image}" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-neutral-200 shrink-0" alt="${item.title}">
                <div class="space-y-1">
                    <h4 class="font-semibold text-neutral-900 text-sm sm:text-base">${item.title}</h4>
                    <p class="text-xs text-neutral-500">মূল্য: <span class="font-medium text-neutral-700">${item.price}</span></p>
                    <p class="text-xs text-neutral-500">পরিমাণ: <span class="font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">${item.quantity} পিস</span></p>
                </div>
            </div>
            
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                <div class="text-left sm:text-right">
                    <span class="text-[10px] uppercase tracking-wider text-neutral-400 block">মোট দাম</span>
                    <span class="font-bold text-[#F26522] text-sm sm:text-base">৳${itemTotal.toLocaleString('en-IN')}</span>
                </div>
                <button onclick="event.stopPropagation(); removeFromCart('${item.id}')" class="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-xs" title="ডিলিট করুন">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        cartContainer.appendChild(cardDiv);
    });

    let deliveryCharge = 60;
    let grandTotal = totalPrice + deliveryCharge;

    if (cartTotalEl) {
        cartTotalEl.innerText = '৳' + totalPrice.toLocaleString('en-IN');
    }

    if (cartGrandTotalEl) {
        cartGrandTotalEl.innerText = '৳' + grandTotal.toLocaleString('en-IN');
    }
}

// ন্যাভবারের কার্ট ব্যাজ কাউন্ট আপডেট করার ফাংশন
function updateCartBadgeCount() {
    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    let totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
        badge.innerText = totalCount;
        if (totalCount > 0) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    });
}

function addToCart() {
    handleProtectedAction('cart');
}

function buyNow() {
    handleProtectedAction('buynow');
}

function orderWhatsApp() {
    const input = document.getElementById('quantity-input');
    const qty = input ? input.value : 1;
    const prodTitle = typeof currentProduct !== 'undefined' && currentProduct ? currentProduct.title : 'Product';
    const message = encodeURIComponent(`Hello, I want to order ${qty}x of ${prodTitle}`);
    window.open(`https://wa.me/8801234567890?text=${message}`, '_blank');
}

function callForOrder() {
    window.location.href = "tel:+8801234567890";
}

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

// পেজ লোড বা অথ স্টেট চেঞ্জ হলে কার্ট কাউন্ট রিফ্রেশ করা
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        updateCartBadgeCount();
        if (typeof renderCartPageItems === 'function') {
            renderCartPageItems();
        }
    });
}

// ================= অতিরিক্ত ফায়ারবেস ব্যাকগ্রাউন্ড সিঙ্ক মডিউল =================
function getFirestoreInstance() {
    if (typeof db !== 'undefined') return db;
    if (typeof firebase !== 'undefined' && firebase.firestore) return firebase.firestore();
    return null;
}

// লোকাল কার্টের ডেটা ফায়ারবেসের 'carts' কালেকশনে ব্যাকগ্রাউন্ডে সেভ করা
function syncCartToFirebaseDatabase(cartItems) {
    const dbInst = getFirestoreInstance();
    const user = checkUserLoggedIn();
    if (!dbInst) return;

    let docId = 'guest_cart';
    if (user && user.uid) docId = user.uid;
    else if (user && user.email) docId = user.email.replace(/[@.]/g, '_');

    dbInst.collection('carts').doc(docId).set({
        items: cartItems,
        updatedAt: new Date().toISOString()
    }, { merge: true }).catch(err => {
        console.log("Firebase background sync note:", err);
    });
}

// বাই নাও বা অর্ডারের সময় ফায়ারবেসের 'orders' কালেকশনে ডেটা পাঠানো
function syncOrderToFirebaseDatabase() {
    const dbInst = getFirestoreInstance();
    const user = checkUserLoggedIn();
    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (!dbInst || cart.length === 0) return;

    dbInst.collection('orders').add({
        userId: user && user.uid ? user.uid : 'guest',
        userEmail: user && user.email ? user.email : 'guest@nayan.com',
        items: cart,
        orderDate: new Date().toISOString(),
        status: 'Pending'
    }).catch(err => {
        console.log("Order sync note:", err);
    });
}

// ================= HERO BANNER SLIDER & MANUAL CHANGE SYSTEM =================
let bannerImages = [];
let currentImageIndex = 0;
let sliderInterval = null;

function showSlideImage(index) {
    const slideImage = document.querySelector('#slide-1 img');
    if (slideImage && bannerImages.length > 0) {
        if (index >= bannerImages.length) currentImageIndex = 0;
        if (index < 0) currentImageIndex = bannerImages.length - 1;

        slideImage.style.opacity = '0';
        setTimeout(() => {
            slideImage.src = bannerImages[currentImageIndex];
            slideImage.style.opacity = '1';
        }, 300);
    }
}

function nextSlide() {
    if (bannerImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % bannerImages.length;
    showSlideImage(currentImageIndex);
}

function prevSlide() {
    if (bannerImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + bannerImages.length) % bannerImages.length;
    showSlideImage(currentImageIndex);
}

// অটো স্লাইড চালু করার ফাংশন
function startSliderTimer() {
    if (sliderInterval) clearInterval(sliderInterval);
    if (bannerImages.length > 1) {
        sliderInterval = setInterval(nextSlide, 5000);
    }
}

// ফায়ারবেস বা ডেটাবেজ থেকে হিরো স্লাইড লোড করে অ্যারেতে সেট করার ফাংশন
function initHeroSliders(productsArray) {
    if (!productsArray || !Array.isArray(productsArray)) return;

    const sliderProducts = productsArray.filter(p => p.homeSection && (p.homeSection === 'slider-1' || p.homeSection === 'slider-2' || p.homeSection.startsWith('slider-')));

    if (sliderProducts.length > 0) {
        bannerImages = sliderProducts.map(p => p.image || (p.images && p.images[0]) || '').filter(url => url !== '');

        if (bannerImages.length > 0) {
            showSlideImage(0);
            startSliderTimer();
        }
    }
}

// ================= DOCUMENT LOAD EVENTS =================
document.addEventListener('DOMContentLoaded', () => {
    const slideImage = document.querySelector('#slide-1 img');
    if (slideImage) {
        slideImage.style.transition = 'opacity 0.5s ease-in-out';
    }

    const cartButtons = document.querySelectorAll('.add-to-cart-btn');
    cartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleProtectedAction('cart');
        });
    });

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

    // ==========================================
    // হোম পেজ এবং অন্যান্য পেজের গ্লোবাল সার্চ অপশন সচল করার কোড
    // ==========================================
    const searchInput = document.querySelector('.nav-search-input');
    const searchBtn = document.querySelector('.nav-search-btn');

    function performSearch() {
        if (!searchInput) return;
        const query = searchInput.value.trim();
        if (query !== "") {
            // প্রোডাক্ট বা ব্র্যান্ডের নাম সহ products.html পেজে রিডাইরেক্ট করবে
            window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

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
        <span>${message}</span>
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

// ==========================================
// পাসওয়ার্ড দিয়ে ডাটাবেস এবং ক্যাশ ক্লিয়ার করার ফাংশন
// ==========================================
function promptClearDatabase() {
    const adminPassword = "12345"; // আপনার পছন্দের পাসওয়ার্ড এখানে সেট করা আছে
    const enteredPass = prompt("Enter admin password to clear database & cache:");

    if (enteredPass === null) return; // ক্যানসেল করলে বন্ধ হয়ে যাবে

    if (enteredPass === adminPassword) {
        if (confirm("Are you sure? This will permanently delete all Firebase cloud data and local cache!")) {

            // ১. ব্রাউজার লোকালস্টোরেজ থেকে কার্ট ও অর্ডার ক্যাশ মুছে ফেলা
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                if (key && (key.includes('cart') || key.includes('order') || key.includes('nayan_'))) {
                    localStorage.removeItem(key);
                }
            }

            // ২. ফায়ারবেস ক্লাউড ডাটাবেজ থেকে ডেটা পার্মানেন্টলি ডিলিট করার কোড
            if (typeof db !== 'undefined') {
                // আপনার প্রজেক্টে যে কালেকশনগুলোতে অর্ডার বা কার্ট ডেটা সেভ হয় সেগুলোর নাম এখানে দেওয়া হলো
                const collectionsToClean = ['orders', 'carts', 'admin_orders'];

                let deletePromises = collectionsToClean.map(colName => {
                    return db.collection(colName).get().then(snapshot => {
                        let batch = db.batch();
                        snapshot.docs.forEach(doc => {
                            batch.delete(doc.ref);
                        });
                        return batch.commit();
                    }).catch(err => {
                        console.log(`Collection ${colName} might not exist or already empty.`);
                    });
                });

                Promise.all(deletePromises).then(() => {
                    alert("Firebase Database and local cache cleared successfully!");
                    window.location.reload();
                }).catch(error => {
                    console.error("Error clearing Firebase data: ", error);
                    alert("Cache cleared, but check console for Firebase deletion.");
                    window.location.reload();
                });
            } else {
                alert("Database and cache cleared successfully!");
                window.location.reload();
            }
        }
    } else {
        alert("Incorrect password! Action denied.");
    }
}

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
window.promptClearDatabase = promptClearDatabase;