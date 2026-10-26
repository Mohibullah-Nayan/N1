/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN COUPONS MODULE (js/admin-coupons.js)
   --------------------------------------------------------------------------
   - Product Selection Checkbox Generator for Targeted Discounts
   - Discount Coupon Creation with Expiry & Min Spend Limit
   - Active Coupons List Loader & Coupon Delete Handler
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
    }

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
                
                checkboxesHTML += `
                    <label class="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg">
                        <input type="checkbox" name="coupon-product" value="${productId}" class="rounded border-slate-300 text-[#F26522] focus:ring-[#F26522]">
                        <span>${product.title || 'Unnamed Product'}</span>
                    </label>
                `;
            });
            container.innerHTML = checkboxesHTML;
        } catch (error) {
            console.error("Error loading products for coupon: ", error);
        }
    }

    // এই ফাংশনটি নতুন ডিসকাউন্ট কুপন তৈরি করে লোকালস্টোরেজে সেভ করে
    window.createCoupon = function(e) {
        e.preventDefault();
        let code = document.getElementById('coupon-code').value.trim().toUpperCase();
        let type = document.getElementById('coupon-type').value;
        let value = parseFloat(document.getElementById('coupon-value').value);
        let scope = document.getElementById('coupon-scope').value;

        let selectedProducts = [];
        if (scope === 'specific') {
            document.querySelectorAll('input[name="coupon-product"]:checked').forEach((checkbox) => {
                selectedProducts.push(checkbox.value);
            });
        }

        if (!code || isNaN(value)) {
            alert('Please enter a valid coupon code and discount amount.');
            return;
        }

        let coupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
        
        if (coupons.some(c => c.code === code)) {
            alert('This coupon code has already been created!');
            return;
        }

        coupons.push({ 
            code, 
            type, 
            value, 
            scope,
            selectedProducts, 
            usedCount: 0,
            usedByCustomers: []
        });
        localStorage.setItem('adminCoupons', JSON.stringify(coupons));
        
        alert(`Coupon "${code}" created successfully! 🎟️`);
        e.target.reset();
        toggleProductSelectionBox();
        loadProductsForCoupon();
        loadCouponsList();
    }

    // এই ফাংশনটি সক্রিয় কুপনগুলোর তালিকা এবং মেয়াদ ড্যাশবোর্ডে প্রদর্শন করে
    window.loadCouponsList = function() {
        let coupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
        let tbody = document.getElementById('coupons-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (coupons.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400 font-medium">No coupons created yet.</td></tr>`;
            return;
        }

        coupons.forEach((coupon, index) => {
            let discountText = coupon.type === 'percent' ? `${coupon.value}% discount` : `৳${coupon.value} discount`;

            let productListHtml = '';
            if (coupon.scope === 'all' || !coupon.scope) {
                productListHtml = `<span class="text-blue-600 font-semibold text-xs">Applicable to all products</span>`;
            } else if (coupon.selectedProducts && coupon.selectedProducts.length > 0) {
                let names = coupon.selectedProducts.map(pId => globalProductsMap[pId] || pId);
                productListHtml = `<div class="text-[11px] text-slate-700 space-y-0.5">`;
                names.forEach(n => {
                    productListHtml += `<div>• ${n}</div>`;
                });
                productListHtml += `</div>`;
            } else {
                productListHtml = `<span class="text-slate-400 text-xs">No specific products selected</span>`;
            }

            let customersHtml = '';
            let usageCount = (coupon.usedByCustomers && coupon.usedByCustomers.length > 0) ? coupon.usedByCustomers.length : (coupon.usedCount || 0);
            
            if (coupon.usedByCustomers && coupon.usedByCustomers.length > 0) {
                customersHtml = `<div class="text-[11px] text-emerald-700 font-semibold mb-1">Total Used: <b>${usageCount} people</b></div>`;
                customersHtml += `<div class="max-h-24 overflow-y-auto space-y-1 text-[10px] text-slate-600 border-t border-slate-100 pt-1">`;
                coupon.usedByCustomers.forEach(cust => {
                    customersHtml += `<div>👤 <b>${cust.name || 'Unknown'}</b> (${cust.phone || 'N/A'}) - <span class="text-blue-600">${cust.orderId || ''}</span></div>`;
                });
                customersHtml += `</div>`;
            } else {
                customersHtml = `<span class="text-slate-400 italic text-xs">No one has used this coupon yet</span>`;
            }

            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition align-top">
                    <td class="p-3.5">
                        <span class="font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">${coupon.code}</span>
                        <div class="text-xs text-[#F26522] font-bold mt-1">${discountText}</div>
                    </td>
                    <td class="p-3.5 max-w-xs">${productListHtml}</td>
                    <td class="p-3.5 max-w-xs">${customersHtml}</td>
                    <td class="p-3.5 text-right">
                        <button onclick="deleteCoupon(${index})" class="bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // এই ফাংশনটি তালিকা থেকে নির্দিষ্ট কুপন কোড ডিলিট করে
    window.deleteCoupon = function(index) {
        let coupons = JSON.parse(localStorage.getItem('adminCoupons')) || [];
        if (confirm('Are you sure you want to delete this coupon?')) {
            coupons.splice(index, 1);
            localStorage.setItem('adminCoupons', JSON.stringify(coupons));
            loadCouponsList();
        }
    }


// Window Global Exports
window.toggleProductSelectionBox = toggleProductSelectionBox;
window.loadProductsForCoupon = loadProductsForCoupon;
window.createCoupon = createCoupon;
window.loadCouponsList = loadCouponsList;
window.deleteCoupon = deleteCoupon;
