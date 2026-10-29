/* ==========================================================================
   SCENT LUXURY PERFUMES - SHOPPING CART MODULE (js/cart.js)
   --------------------------------------------------------------------------
   - Cart storage key management (user-specific or guest)
   - Add to Cart directly from cards or details
   - Dynamic Cart Badge counter update
   - Cart page items rendering, quantity increments & removals
   - Protected actions (login requirement for cart/checkout)
   ========================================================================== */

// ==========================================================================

// ==========================================================================

// ইউজারভিত্তিক কার্ট কি (Key) পাওয়ার ফাংশন যাতে একেক ইউজারের কার্ট আলাদা থাকে
// এই ফাংশনটি বর্তমান লগইন করা ইউজার বা গেস্টের জন্য নির্দিষ্ট কার্ট স্টোরেজ কি (Key) রিটার্ন করে
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
// এই ফাংশনটি প্রোডাক্ট এবং পরিমাণ কার্টে যুক্ত করে লোকালস্টোরেজে সংরক্ষণ করে এবং ফায়ারবেসে সিঙ্ক করে
function saveProductToCart(productObj, quantity) {
    if (!productObj) return false;

    // লাইভ বা অবজেক্ট স্টক পরীক্ষা করা
    let availableStock = null;
    let targetStockVal = productObj.stock;
    if (targetStockVal === undefined && typeof allProducts !== 'undefined' && Array.isArray(allProducts)) {
        const match = allProducts.find(p => String(p.id) === String(productObj.id) || p.title === productObj.title);
        if (match && match.stock !== undefined) targetStockVal = match.stock;
    }

    if (targetStockVal !== undefined && targetStockVal !== null && String(targetStockVal).trim() !== '') {
        availableStock = parseInt(targetStockVal);
    }

    // স্টক ০ বা তার কম হলে কোনো অবস্থাতেই কার্টে ঢুকবে না
    if (availableStock !== null && availableStock <= 0) {
        showPopupNotification(`Sorry, "${productObj.title || 'Product'}" is completely out of stock! ❌`);
        return false;
    }

    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    let existingIndex = cart.findIndex(item => item.id == productObj.id);
    let toAdd = parseInt(quantity) || 1;

    if (existingIndex > -1) {
        let currentInCart = parseInt(cart[existingIndex].quantity) || 0;
        if (availableStock !== null && (currentInCart + toAdd) > availableStock) {
            let allowedMore = Math.max(0, availableStock - currentInCart);
            if (allowedMore <= 0) {
                showPopupNotification(`You already have the maximum available stock (${availableStock} pcs) of "${productObj.title}" in your cart! ⚠️`);
                return false;
            } else {
                cart[existingIndex].quantity = availableStock;
                showPopupNotification(`Only ${availableStock} items in stock! Cart quantity set to maximum (${availableStock}). ⚠️`);
            }
        } else {
            cart[existingIndex].quantity += toAdd;
        }
    } else {
        if (availableStock !== null && toAdd > availableStock) {
            toAdd = availableStock;
            showPopupNotification(`Only ${availableStock} available in stock! Added ${availableStock} to cart. ⚠️`);
        }
        cart.push({
            id: productObj.id,
            title: productObj.title,
            price: productObj.price,
            stock: availableStock,
            image: productObj.images && productObj.images[0] ? productObj.images[0] : (productObj.image || ''),
            quantity: toAdd
        });
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    syncCartToFirebaseDatabase(cart);
    return true;
}

// এই ফাংশনটি ইউজার লগইন যাচাই করে কার্টে প্রোডাক্ট যুক্ত করা বা সরাসরি চেকআউট প্রক্রিয়া সম্পন্ন করে
function handleProtectedAction(actionType) {
    const user = checkUserLoggedIn();

    if (!user) {
        showPopupNotification("Please sign in to perform this action!");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return false;
    }

    const prod = typeof currentProduct !== 'undefined' && currentProduct ? currentProduct : null;
    if (prod) {
        const isStockOut = (typeof isOutOfStock === 'function') ? isOutOfStock(prod) : ((prod.stock !== undefined && prod.stock !== null && String(prod.stock).trim() !== '' && Number(prod.stock) <= 0) || prod.isOutOfStock === true);
        if (isStockOut) {
            showPopupNotification(`Sorry, "${prod.title || 'This perfume'}" is currently out of stock! ❌`);
            return false;
        }
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
// এই ফাংশনটি প্রোডাক্ট গ্রিড কার্ড থেকে সরাসরি ১টি আইটেম কার্টে যুক্ত করে এবং টোস্ট নোটিফিকেশন দেখায়
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
        const isStockOut = (typeof isOutOfStock === 'function') ? isOutOfStock(prod) : ((prod.stock !== undefined && prod.stock !== null && String(prod.stock).trim() !== '' && Number(prod.stock) <= 0) || prod.isOutOfStock === true);
        if (isStockOut) {
            showPopupNotification(`Sorry, "${prod.title}" is currently out of stock! ❌`);
            return;
        }
        saveProductToCart(prod, 1);
        showPopupNotification(`"${prod.title}" added to cart! 🛒`);
        updateCartBadgeCount();
    }
}

// কার্ট পেজ থেকে প্রোডাক্ট ডিলিট করার ফাংশন
// এই ফাংশনটি কার্ট থেকে নির্দিষ্ট প্রোডাক্ট আইডি রিমুভ করে এবং নতুন হিসাব প্রদর্শন করে
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
// এই ফাংশনটি কার্ট পেজের আইটেম তালিকা, মূল্য, সাবটোটাল এবং গ্র্যান্ড টোটাল কার্ড আকারে রেন্ডার করে
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

    let hasOutOfStockItems = false;

    cart.forEach(item => {
        let cleanPrice = parseInt(String(item.price).replace(/[^\d]/g, '')) || 0;
        let itemTotal = cleanPrice * item.quantity;
        totalPrice += itemTotal;

        // লাইভ স্টক স্টেট চেক
        const liveMatch = (typeof allProducts !== 'undefined' && Array.isArray(allProducts))
            ? allProducts.find(p => String(p.id) === String(item.id) || p.title === item.title)
            : null;
        let liveStock = null;
        if (liveMatch && liveMatch.stock !== undefined && liveMatch.stock !== null && String(liveMatch.stock).trim() !== '') {
            liveStock = parseInt(liveMatch.stock);
        } else if (item.stock !== undefined && item.stock !== null && String(item.stock).trim() !== '') {
            liveStock = parseInt(item.stock);
        }

        const isSoldOut = (liveStock !== null && liveStock <= 0) || (liveMatch && liveMatch.isOutOfStock === true);
        if (isSoldOut) hasOutOfStockItems = true;

        const cardDiv = document.createElement('div');
        cardDiv.className = `bg-white border ${isSoldOut ? 'border-rose-300 ring-1 ring-rose-200' : 'border-neutral-200/80'} rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:shadow-md transition-all cursor-pointer`;
        cardDiv.setAttribute('onclick', `window.location.href='product-details.html?id=${item.id}'`);

        cardDiv.innerHTML = `
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <img src="${item.image}" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-neutral-200 shrink-0" alt="${escapeHTML(item.title)}">
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-neutral-900 text-sm sm:text-base">${escapeHTML(item.title)}</h4>
                        ${isSoldOut ? '<span class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-circle-xmark text-rose-500"></i> Stock Out</span>' : ''}
                    </div>
                    <p class="text-xs text-neutral-500">Price: <span class="font-medium text-neutral-700">${escapeHTML(item.price)}</span></p>
                    <p class="text-xs text-neutral-500">Quantity: <span class="font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">${item.quantity} quantity</span></p>
                    ${isSoldOut ? '<p class="text-[11px] text-rose-600 font-bold mt-1">⚠️ এই প্রোডাক্টের স্টক শেষ হয়ে গেছে। অর্ডার করতে এটি রিমুভ করুন।</p>' : ''}
                </div>
            </div>
            
            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
                <div class="text-left sm:text-right">
                    <span class="text-[10px] uppercase tracking-wider text-neutral-400 block">Total</span>
                    <span class="font-bold text-[#F26522] text-sm sm:text-base">৳${itemTotal.toLocaleString('en-IN')}</span>
                </div>
                <button onclick="event.stopPropagation(); removeFromCart('${item.id}')" class="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-xs" title="Delete">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        cartContainer.appendChild(cardDiv);
    });

    if (hasOutOfStockItems) {
        const warnBanner = document.createElement('div');
        warnBanner.className = "bg-rose-50 border border-rose-300 rounded-xl p-3.5 mb-3 text-xs font-bold text-rose-700 flex items-center gap-2.5 shadow-2xs";
        warnBanner.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-500 text-sm"></i> <span>আপনার কার্টের কিছু প্রোডাক্টের স্টক শেষ হয়ে গেছে। চেকআউটে যাওয়ার আগে স্টক শেষ হওয়া প্রোডাক্টটি ডিলিট করুন।</span>';
        cartContainer.prepend(warnBanner);
    }

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
// এই ফাংশনটি কার্টের মোট আইটেম সংখ্যা গণনা করে ন্যাভবারের কার্ট ব্যাজ কাউন্টারে প্রদর্শন করে
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

// এই ফাংশনটি প্রোডাক্ট ডিটেইলস পেজ থেকে নির্বাচিত পরিমাণের প্রোডাক্ট কার্টে যুক্ত করে
function addToCart() {
    handleProtectedAction('cart');
}

// এই ফাংশনটি সরাসরি প্রোডাক্টটি কার্টে যোগ করে অর্ডার প্রসেসিংয়ের জন্য কার্ট পেজে নিয়ে যায়
function buyNow() {
    handleProtectedAction('buynow');
}

// এই ফাংশনটি প্রোডাক্টের নাম ও পরিমাণসহ সরাসরি হোয়াটসঅ্যাপে অর্ডারের মেসেজ তৈরি করে ওপেন করে
function orderWhatsApp() {
    const input = document.getElementById('quantity-input');
    const qty = input ? input.value : 1;
    const prodTitle = typeof currentProduct !== 'undefined' && currentProduct ? currentProduct.title : 'Product';
    const message = encodeURIComponent(`Hello, I want to order ${qty}x of ${prodTitle}`);
    window.open(`https://wa.me/8801234567890?text=${message}`, '_blank');
}

// এই ফাংশনটি কাস্টমারকে সরাসরি ফোন কলের মাধ্যমে অর্ডার করার লিংক চালু করে
function callForOrder() {
    window.location.href = "tel:+8801234567890";
}

// লোকাল কার্টের ডেটা ফায়ারবেসের 'carts' কালেকশনে ব্যাকগ্রাউন্ডে সেভ করা
// এই ফাংশনটি ইউজারের কার্ট ডেটা ফায়ারস্টোর ডাটাবেসের 'carts' কালেকশনে ব্যাকগ্রাউন্ডে সেভ করে
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
// এই ফাংশনটি অর্ডারের তথ্য ফায়ারস্টোর ডাটাবেসের 'orders' কালেকশনে ব্যাকগ্রাউন্ডে সংরক্ষণ করে
function syncOrderToFirebaseDatabase() {
    const dbInst = getFirestoreInstance();
    const user = checkUserLoggedIn();
    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (!dbInst || cart.length === 0) return;

    dbInst.collection('orders').add({
        userId: user && user.uid ? user.uid : 'guest',
        userEmail: user && user.email ? user.email : 'guest@scent.com',
        items: cart,
        orderDate: new Date().toISOString(),
        status: 'Pending'
    }).catch(err => {
        console.log("Order sync note:", err);
    });
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

// ==========================================================================
// ৯. সার্চ ও গ্লোবাল ন্যাভিগেশন (Search & Global Navigation)
// ==========================================================================
// এই ফাংশনটি ন্যাভবারের সার্চ ইনপুটের লেখা নিয়ে প্রোডাক্টস পেজে ফিল্টার করার জন্য রিডাইরেক্ট করে
function performSearch() {
    const searchInput = document.querySelector('.nav-search-input');
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if (query !== "") {
        // প্রোডাক্ট বা ব্র্যান্ডের নাম সহ products.html পেজে রিডাইরেক্ট করবে
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

// ==========================================================================


// Window Global Exports
window.getCartStorageKey = getCartStorageKey;
window.getActiveCartKey = getActiveCartKey;
window.handleProtectedAction = handleProtectedAction;
window.addProductToCartDirect = addProductToCartDirect;
window.renderCartPageItems = renderCartPageItems;
window.updateCartBadgeCount = updateCartBadgeCount;

// চেকআউটে যাওয়ার আগে স্টক ভ্যালিডেশন
function proceedToCheckout() {
    let cartKey = getCartStorageKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    if (cart.length === 0) {
        showPopupNotification("Your cart is empty! Please add products first.");
        return;
    }

    let hasOut = false;
    let outTitle = "";
    cart.forEach(item => {
        const liveMatch = (typeof allProducts !== 'undefined' && Array.isArray(allProducts))
            ? allProducts.find(p => String(p.id) === String(item.id) || p.title === item.title)
            : null;
        let liveStock = null;
        if (liveMatch && liveMatch.stock !== undefined && liveMatch.stock !== null && String(liveMatch.stock).trim() !== '') {
            liveStock = parseInt(liveMatch.stock);
        } else if (item.stock !== undefined && item.stock !== null && String(item.stock).trim() !== '') {
            liveStock = parseInt(item.stock);
        }
        if ((liveStock !== null && liveStock <= 0) || (liveMatch && liveMatch.isOutOfStock === true)) {
            hasOut = true;
            outTitle = item.title || "Product";
        }
    });

    if (hasOut) {
        alert(`দুঃখিত! আপনার কার্টে থাকা "${outTitle}" প্রোডাক্টটির স্টক শেষ হয়ে গেছে। অনুগ্রহ করে কার্ট থেকে আইটেমটি বাদ দিয়ে চেকআউটে যান।`);
        return;
    }

    window.location.href = "checkout.html";
}
window.proceedToCheckout = proceedToCheckout;
