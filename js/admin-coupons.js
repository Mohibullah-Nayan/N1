/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN COUPONS MODULE (js/admin-coupons.js)
   --------------------------------------------------------------------------
   - Product Selection Checkbox Generator for Targeted Discounts
   - Discount Coupon Creation with Expiry & Min Spend Limit
   - Active Coupons List Loader & Coupon Delete Handler
   - Real-time Cloud Sync with Firebase Firestore & Offline Fallback
   ========================================================================== */

import { db } from './admin.js';
import { collection, addDoc, setDoc, getDocs, getDoc, query, deleteDoc, doc, serverTimestamp, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    // ৫. কুপন ম্যানেজমেন্ট সিস্টেম (Coupons System Engine)
    // ==========================================================================
    // কুপন সেকশনের জন্য প্রোডাক্ট সিলেকশন বক্স টগল করা
    // এই ফাংশনটি কুপন তৈরির জন্য নির্দিষ্ট প্রোডাক্ট সিলেকশন চেকবক্স প্যানেল টগল করে
    window.toggleProductSelectionBox = function() {
        let scopeSelect = document.getElementById('coupon-scope');
        let containerBox = document.getElementById('product-checkbox-container');
        if (!scopeSelect || !containerBox) return;

        if (scopeSelect.value === 'specific') {
            containerBox.classList.remove('hidden');
        } else {
            containerBox.classList.add('hidden');
        }
    };

    // কুপনের জন্য প্রোডাক্ট লোড করার ফাংশন
    window.loadProductsForCoupon = async function() {
        let container = document.getElementById('coupon-products-container'); 
        if (!container) return;

        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            
            container.innerHTML = '';
            if (querySnapshot.empty) {
                container.innerHTML = `<p class="text-rose-500 text-xs p-2">No products found!</p>`;
                return;
            }

            let checkboxesHTML = '';
            querySnapshot.forEach((docSnap) => {
                let product = docSnap.data();
                let productId = docSnap.id;
                const isBanner = product.isBanner || product.isHeroBanner || (product.homeSection && (product.homeSection.startsWith('slider-') || product.homeSection === 'side-banner'));
                if (!isBanner) {
                    checkboxesHTML += `
                        <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg">
                            <input type="checkbox" name="coupon-product" value="${productId}" class="rounded border-slate-300 text-[#F26522] focus:ring-[#F26522]">
                            <span class="truncate">${product.title || 'Unnamed Product'}</span>
                        </label>
                    `;
                }
            });
            container.innerHTML = checkboxesHTML || `<p class="text-slate-400 text-xs p-2">No items eligible.</p>`;
        } catch (error) {
            console.error("Error loading products for coupon: ", error);
        }
    };

    // পূর্ববর্তী লোকালস্টোরেজের কুপন থাকলে স্বয়ংক্রিয়ভাবে ফায়ারস্টোরে সিঙ্ক করে নেওয়া
    async function syncLocalCouponsToFirestore() {
        try {
            let localCoupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
            if (localCoupons.length > 0) {
                for (let c of localCoupons) {
                    if (c && c.code) {
                        const cRef = doc(db, "coupons", String(c.code).trim().toUpperCase());
                        const cSnap = await getDoc(cRef);
                        if (!cSnap.exists()) {
                            await setDoc(cRef, {
                                id: c.code,
                                code: c.code,
                                type: c.type || 'flat',
                                value: Number(c.value) || 0,
                                scope: c.scope || 'all',
                                selectedProducts: c.selectedProducts || [],
                                usedCount: c.usedCount || 0,
                                usedByCustomers: c.usedByCustomers || [],
                                createdAt: c.createdAt || Date.now()
                            });
                        }
                    }
                }
            }
        } catch(e) {
            console.warn("Auto-sync local coupons notice:", e);
        }
    }

    // এই ফাংশনটি নতুন ডিসকাউন্ট কুপন তৈরি করে ফায়ারস্টোর ও লোকালস্টোরেজে সেভ করে
    window.createCoupon = async function(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Activating...';
        }

        try {
            let code = document.getElementById('coupon-code').value.trim().toUpperCase();
            let type = document.getElementById('coupon-type').value;
            let value = parseFloat(document.getElementById('coupon-value').value);
            let scope = document.getElementById('coupon-scope').value;

            let selectedProducts = [];
            if (scope === 'specific') {
                document.querySelectorAll('input[name="coupon-product"]:checked').forEach((checkbox) => {
                    selectedProducts.push(checkbox.value);
                });
                if (selectedProducts.length === 0) {
                    alert('Please select at least one product for this specific coupon.');
                    return;
                }
            }

            if (!code || isNaN(value) || value <= 0) {
                alert('Please enter a valid coupon code and discount amount.');
                return;
            }

            // ফায়ারস্টোর ক্লাউডে কুপন সেভ করা
            const couponData = { 
                id: code,
                code: code, 
                type: type, 
                value: value, 
                scope: scope,
                selectedProducts: selectedProducts, 
                usedCount: 0,
                usedByCustomers: [],
                createdAt: Date.now()
            };

            await setDoc(doc(db, "coupons", code), couponData);

            // লোকালস্টোরেজেও ব্যাকআপ রাখা
            let coupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
            coupons = coupons.filter(c => c.code !== code && c.id !== code);
            coupons.unshift(couponData);
            localStorage.setItem('adminCoupons', JSON.stringify(coupons));
            
            alert(`Coupon "${code}" created and activated successfully! 🎟️`);
            e.target.reset();
            toggleProductSelectionBox();
            loadProductsForCoupon();
            renderCouponsTable(coupons);
        } catch (error) {
            console.error("Error creating coupon in Firestore:", error);
            alert("Failed to create coupon: " + error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    };

    let couponsRealtimeUnsub = null;

    // এই ফাংশনটি সক্রিয় কুপনগুলোর তালিকা ফায়ারস্টোর থেকে রিয়েল-টাইমে ড্যাশবোর্ডে প্রদর্শন করে
    window.loadCouponsList = function() {
        let tbody = document.getElementById('coupons-table-body');
        if (!tbody) return;

        // প্রথমে লোকাল ক্যাশ যদি থাকে রেন্ডার করে ফেলা
        let localCoupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
        if (localCoupons.length > 0) {
            renderCouponsTable(localCoupons);
        }

        // পূর্ববর্তী লোকাল কুপন ক্লাউডে সিঙ্ক করা
        syncLocalCouponsToFirestore();

        if (couponsRealtimeUnsub) {
            try { couponsRealtimeUnsub(); } catch(e) {}
        }

        try {
            couponsRealtimeUnsub = onSnapshot(collection(db, "coupons"), (snapshot) => {
                let coupons = [];
                snapshot.forEach((docSnap) => {
                    let data = docSnap.data();
                    data.id = docSnap.id;
                    data.code = data.code || docSnap.id;
                    coupons.push(data);
                });

                // নতুন থেকে পুরনো ক্রমানুসারে সাজানো
                coupons.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                localStorage.setItem('adminCoupons', JSON.stringify(coupons));
                window.cachedCoupons = coupons;
                renderCouponsTable(coupons);
            }, (error) => {
                console.warn("Firestore coupons onSnapshot notice, using cached list:", error);
                let fallback = JSON.parse(localStorage.getItem('adminCoupons')) || [];
                renderCouponsTable(fallback);
            });
        } catch (err) {
            console.warn("Firestore coupons init notice:", err);
            let fallback = JSON.parse(localStorage.getItem('adminCoupons')) || [];
            renderCouponsTable(fallback);
        }
    };

    // কুপন টেবিল রেন্ডারিং মেথড
    function renderCouponsTable(coupons) {
        let tbody = document.getElementById('coupons-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!coupons || coupons.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-400 font-medium"><i class="fa-solid fa-ticket text-3xl mb-2 block opacity-40"></i> No coupons created yet.</td></tr>`;
            return;
        }

        coupons.forEach((coupon) => {
            let couponCode = coupon.code || coupon.id;
            let discountText = coupon.type === 'percent' ? `${coupon.value}% discount` : `৳${coupon.value} discount`;

            let productListHtml = '';
            if (coupon.scope === 'all' || !coupon.scope) {
                productListHtml = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80"><i class="fa-solid fa-earth-americas text-[10px]"></i> Applicable to all products</span>`;
            } else if (coupon.selectedProducts && coupon.selectedProducts.length > 0) {
                let pMap = window.globalProductsMap || {};
                let names = coupon.selectedProducts.map(pId => {
                    if (pMap[pId]) return pMap[pId];
                    if (window.cachedAdminProducts) {
                        let matchedP = window.cachedAdminProducts.find(p => p.id === pId);
                        if (matchedP && matchedP.title) return matchedP.title;
                    }
                    return pId;
                });
                productListHtml = `<div class="text-[11px] text-slate-700 space-y-1 max-h-24 overflow-y-auto pr-1">`;
                names.forEach(n => {
                    productListHtml += `<div class="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md truncate">• ${n}</div>`;
                });
                productListHtml += `</div>`;
            } else {
                productListHtml = `<span class="text-slate-400 text-xs italic">No specific products selected</span>`;
            }

            let customersHtml = '';
            let usageCount = (coupon.usedByCustomers && coupon.usedByCustomers.length > 0) ? coupon.usedByCustomers.length : (coupon.usedCount || 0);
            
            if (coupon.usedByCustomers && coupon.usedByCustomers.length > 0) {
                customersHtml = `<div class="text-[11px] text-emerald-700 font-bold mb-1 flex items-center gap-1"><i class="fa-solid fa-users text-emerald-600"></i> Total Used: <b>${usageCount} customer(s)</b></div>`;
                customersHtml += `<div class="max-h-24 overflow-y-auto space-y-1 text-[10px] text-slate-600 border-t border-slate-100 pt-1">`;
                coupon.usedByCustomers.forEach(cust => {
                    customersHtml += `<div>👤 <b>${cust.name || 'Customer'}</b> (${cust.phone || 'N/A'}) - <span class="text-blue-600 font-mono">${cust.orderId || ''}</span></div>`;
                });
                customersHtml += `</div>`;
            } else {
                customersHtml = `<span class="text-slate-400 italic text-xs">No one has used this coupon yet</span>`;
            }

            tbody.innerHTML += `
                <tr class="hover:bg-slate-50/80 transition align-top border-b border-slate-100">
                    <td class="p-3.5">
                        <span class="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">${couponCode}</span>
                        <div class="text-xs text-[#F26522] font-bold mt-1.5 flex items-center gap-1"><i class="fa-solid fa-tag text-[10px]"></i> ${discountText}</div>
                    </td>
                    <td class="p-3.5 max-w-xs">${productListHtml}</td>
                    <td class="p-3.5 max-w-xs">${customersHtml}</td>
                    <td class="p-3.5 text-right whitespace-nowrap">
                        <button type="button" onclick="deleteCoupon('${couponCode}')" class="bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer">
                            <i class="fa-solid fa-trash text-[10px]"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // এই ফাংশনটি ফায়ারস্টোর ও লোকালস্টোরেজ থেকে নির্দিষ্ট কুপন কোড স্থায়ীভাবে ডিলিট করে
    window.deleteCoupon = async function(couponCode) {
        if (!couponCode) return;
        if (confirm(`Are you sure you want to delete coupon "${couponCode}" permanently?`)) {
            try {
                await deleteDoc(doc(db, "coupons", String(couponCode)));

                // লোকালস্টোরেজ থেকেও মুছে ফেলা
                let localCoupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
                localCoupons = localCoupons.filter(c => c.code !== couponCode && c.id !== couponCode);
                localStorage.setItem('adminCoupons', JSON.stringify(localCoupons));

                alert(`✓ Coupon "${couponCode}" deleted successfully! 🗑️`);
                renderCouponsTable(localCoupons);
            } catch (err) {
                console.error("Error deleting coupon from Firestore:", err);
                alert("Failed to delete coupon: " + err.message);
            }
        }
    };

// Window Global Exports
window.toggleProductSelectionBox = toggleProductSelectionBox;
window.loadProductsForCoupon = loadProductsForCoupon;
window.createCoupon = createCoupon;
window.loadCouponsList = loadCouponsList;
window.deleteCoupon = deleteCoupon;
