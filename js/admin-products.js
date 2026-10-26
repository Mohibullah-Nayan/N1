/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN PRODUCTS & INVENTORY MODULE (js/admin-products.js)
   --------------------------------------------------------------------------
   - Product Inventory Table Live Search, Filter & Cached Rendering
   - Product Edit Modal & Firestore Data Updater
   - Product & Banner Delete Controller
   - Cloudinary High-Res Image Upload & Firestore Publisher
   ========================================================================== */

import { db } from './admin.js';
import { collection, addDoc, setDoc, getDocs, getDoc, query, deleteDoc, doc, serverTimestamp, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ৪. অল প্রোডাক্টস ম্যানেজমেন্ট - ফেচ, এডিট ও ডিলিট (Products CRUD Engine)
// ==========================================================================
// এই ফাংশনটি ফায়ারস্টোর থেকে প্রোডাক্ট ফেচ করে একটি আইডি-ভিত্তিক ম্যাপে ক্যাশ করে রাখে
async function loadProductsMap() {
    try {
        const querySnapshot = await getDocs(query(collection(db, "products")));
        globalProductsMap = {};
        querySnapshot.forEach((docSnap) => {
            globalProductsMap[docSnap.id] = docSnap.data().title || 'Unnamed Product';
        });
    } catch (error) {
        console.error("Error loading products map:", error);
    }
}

// এই ফাংশনটি ব্যানার বা হোম সেকশন ড্রপডাউন পরিবর্তন হলে ইনপুট ফর্ম কন্ট্রোল করে
window.handleBannerSectionChange = function () {
    const homeSectionSelect = document.getElementById('p-home-section');
    if (!homeSectionSelect) return;

    const selectedVal = homeSectionSelect.value;
    const isHero = (selectedVal === 'slider-1' || selectedVal.startsWith('slider-') || selectedVal === 'side-banner');

    const fieldsToToggle = [
        { id: 'p-title', isReq: true },
        { id: 'p-brand', isReq: false },
        { id: 'p-category', isReq: false },
        { id: 'p-stock', isReq: false },
        { id: 'p-price', isReq: true },
        { id: 'p-old-price', isReq: false },
        { id: 'p-image-file', isReq: true },
        { id: 'p-desc', isReq: false }
    ];

    fieldsToToggle.forEach(item => {
        const field = document.getElementById(item.id);
        if (field) {
            if (isHero) {
                field.disabled = true;
                field.removeAttribute('required');
                field.value = '';
                field.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
            } else {
                field.disabled = false;
                if (item.isReq) {
                    field.setAttribute('required', 'true');
                }
                field.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-60');
            }
        }
    });
};

// ১. ফায়ারস্টোর থেকে প্রোডাক্ট ফেচ করে All Products Management টেবিলে লাইভ সার্চ ও ক্যাশিং সহ রেন্ডার করা
window.cachedAdminProducts = [];
let adminProductsRealtimeUnsub = null;

// এই ফাংশনটি ফায়ারস্টোর থেকে সকল প্রোডাক্ট রিয়েল-টাইমে ফেচ করে প্রোডাক্ট ম্যানেজমেন্ট টেবিলে প্রদর্শন করে
async function loadAdminProductsTable() {
    let targetContainer = document.getElementById('admin-all-products-table');
    if (!targetContainer) return;

    try {
        if (adminProductsRealtimeUnsub) {
            adminProductsRealtimeUnsub();
        }

        adminProductsRealtimeUnsub = onSnapshot(collection(db, "products"), (querySnapshot) => {
            let products = [];
            querySnapshot.forEach((docSnap) => {
                let p = docSnap.data();
                p.id = docSnap.id;
                products.push(p);
            });

            products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            window.cachedAdminProducts = products;

            // লো-স্টক ইনভেন্টরি শনাক্তকরণ অ্যালার্ট চেক করা
            if (typeof window.checkLowStockAlerts === 'function') {
                window.checkLowStockAlerts(products);
            }

            // প্রোডাক্ট সেলস ও ইনভেন্টরি ব্রেকডাউন সেকশন লাইভ রিফ্রেশ করা
            if (typeof window.renderProductSalesBreakdown === 'function') {
                window.renderProductSalesBreakdown();
            }

            const searchInput = document.getElementById('admin-product-search-input');
            const currentQ = searchInput ? searchInput.value : '';
            filterAdminProductsTable(currentQ);
        });
    } catch (error) {
        console.error("Error setting up realtime products listener:", error);
    }
}

// প্রোডাক্ট নাম বা আইডি দিয়ে রিয়েল-টাইম সার্চ ও ফিল্টারিং
window.filterAdminProductsTable = function (searchQuery) {
    const targetContainer = document.getElementById('admin-all-products-table');
    const countBadge = document.getElementById('product-inventory-count');
    const clearBtn = document.getElementById('clear-product-search-btn');
    if (!targetContainer) return;

    const allProducts = window.cachedAdminProducts || [];
    const q = String(searchQuery || '').trim().toLowerCase();

    if (clearBtn) {
        if (q.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

    let filtered = allProducts;
    if (q) {
        filtered = allProducts.filter(p => {
            const title = String(p.title || '').toLowerCase();
            const id = String(p.id || '').toLowerCase();
            const category = String(p.category || '').toLowerCase();
            const brand = String(p.brand || '').toLowerCase();
            const homeSection = String(p.homeSection || '').toLowerCase();
            const isBannerKeyword = (q === 'banner' || q === 'hero') && (p.isBanner || p.isHeroBanner || homeSection.includes('slider') || homeSection.includes('banner'));
            return title.includes(q) || id.includes(q) || category.includes(q) || brand.includes(q) || homeSection.includes(q) || isBannerKeyword;
        });
    }

    if (countBadge) {
        if (q) {
            countBadge.innerText = `Showing ${filtered.length} of ${allProducts.length} items`;
        } else {
            countBadge.innerText = `Total ${allProducts.length} items`;
        }
    }

    renderAdminProductsRows(filtered, targetContainer, q);
};

// এই ফাংশনটি প্রোডাক্ট সার্চ ফিল্ড ক্লিয়ার করে সম্পূর্ণ টেবিল রিলোড করে
window.clearAdminProductSearch = function () {
    const searchInput = document.getElementById('admin-product-search-input');
    if (searchInput) {
        searchInput.value = '';
        filterAdminProductsTable('');
        searchInput.focus();
    }
};

// এই ফাংশনটি প্রোডাক্ট তালিকা টেবিলের রো (Row) আকারে এবং অ্যাকশন বাটনসহ রেন্ডার করে
function renderAdminProductsRows(products, targetContainer, query = '') {
    if (!targetContainer) return;

    if (products.length === 0) {
        targetContainer.innerHTML = `
                <tr>
                    <td colspan="5" class="p-8 text-center text-slate-400 font-medium">
                        <i class="fa-solid fa-magnifying-glass text-3xl mb-2 block opacity-40"></i>
                        ${query ? `No products matching "<strong class="text-slate-600">${escapeHtml(query)}</strong>"` : 'No products found. Please upload items.'}
                    </td>
                </tr>
            `;
        return;
    }

    let rowsHTML = '';
    products.forEach((product) => {
        let pId = product.id;
        let imgSrc = product.image || (product.images && product.images[0]) || 'https://via.placeholder.com/50';
        const isBanner = (product.isBanner || product.isHeroBanner || (product.homeSection && (product.homeSection.startsWith('slider-') || product.homeSection === 'side-banner')));

        // সেলস বা কত পিস বিক্রি হয়েছে তা হিসাব করা
        let salesMap = window.globalProductSalesCount || {};
        let soldCount = 0;
        let pTitleClean = String(product.title || '').trim().toLowerCase();
        for (let [itemTitle, count] of Object.entries(salesMap)) {
            let itClean = String(itemTitle).trim().toLowerCase();
            if (itClean === pTitleClean || itClean.includes(pTitleClean) || (pTitleClean && pTitleClean.includes(itClean))) {
                soldCount += count;
            }
        }

        // স্টক ব্যাজ জেনারেট করা
        let stockBadge = '';
        let rawStock = (product.stock !== undefined && product.stock !== null && product.stock !== '') ? parseInt(product.stock) : null;
        if (isBanner) {
            stockBadge = '<span class="text-xs text-slate-400 italic">Banner (N/A)</span>';
        } else if (rawStock === null || isNaN(rawStock)) {
            stockBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200" title="Click Edit to set stock">Not set</span>';
        } else if (rawStock > 3) {
            stockBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ${rawStock} pcs available</span>`;
        } else if (rawStock > 0 && rawStock <= 3) {
            stockBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs animate-pulse"><i class="fa-solid fa-triangle-exclamation text-amber-500"></i> Low: Only ${rawStock} pcs!</span>`;
        } else {
            stockBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"><i class="fa-solid fa-circle-xmark text-rose-500"></i> Out of Stock</span>`;
        }

        let salesHtml = isBanner ? '' : `
                <p class="text-[11px] font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                    <i class="fa-solid fa-cart-shopping text-blue-500"></i> Sold: <span class="text-blue-700 font-extrabold">${soldCount} pcs</span>
                </p>
            `;

        rowsHTML += `
                <tr class="hover:bg-slate-50/90 transition-colors border-b border-slate-100 group">
                    <td class="p-3.5">
                        <div class="w-12 h-12 rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs bg-slate-100 flex-shrink-0">
                            <img src="${imgSrc}" alt="Product" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.onerror=null; this.src='https://via.placeholder.com/50';">
                        </div>
                    </td>
                    <td class="p-3.5">
                        <p class="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">${product.title || (isBanner ? 'Hero Banner (' + (product.homeSection || 'Slider') + ')' : 'Unnamed')}</p>
                        <span class="inline-block text-[11px] text-blue-600 font-mono mt-0.5 font-bold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/60 shadow-2xs">ID: ${pId}</span>
                    </td>
                    <td class="p-3.5">
                        ${isBanner ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">🖼️ Banner (${product.homeSection || 'Hero'})</span>` : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">${product.category || 'General'}</span>`}
                    </td>
                    <td class="p-3.5 font-black text-[#F26522] text-sm">${isBanner ? `<span class="text-xs text-slate-400 italic font-medium">Banner (Not for sale)</span>` : `৳${product.price || '0'}`}</td>
                    <td class="p-3.5 text-right whitespace-nowrap">
                        <div class="inline-flex items-center justify-end gap-3">
                            <button type="button" onclick="openEditModal('${pId}', '${escapeHtml(product.title)}', '${escapeHtml(product.category || '')}', '${product.price || ''}', '${escapeHtml(product.description || '')}', ${product.stock !== undefined && product.stock !== null ? product.stock : 'null'})" class="bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-pen text-[10px]"></i> Edit
                            </button>
                            <button type="button" onclick="deleteProductFromCloud('${pId}')" class="bg-rose-500/10 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-trash text-[10px]"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    });
    targetContainer.innerHTML = rowsHTML;
}

// এই ফাংশনটি স্ট্রিংয়ের স্পেশাল ক্যারেক্টারকে সুরক্ষিত HTML এনটিটিতে রূপান্তর করে (XSS প্রতিরোধ)
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}



// ২. এডিট মডাল ওপেন করার ফাংশন
// এই ফাংশনটি নির্দিষ্ট প্রোডাক্টের তথ্য দিয়ে এডিট মডাল পপআপ ওপেন করে
window.openEditModal = function (id, title, category, price, description, stock = null) {
    document.getElementById('edit-p-id').value = id;
    document.getElementById('edit-p-title').value = title;
    document.getElementById('edit-p-category').value = category;
    document.getElementById('edit-p-price').value = price;
    document.getElementById('edit-p-desc').value = description;
    const stockInput = document.getElementById('edit-p-stock');
    if (stockInput) {
        stockInput.value = (stock !== undefined && stock !== null && stock !== 'null' && stock !== '') ? stock : '';
    }

    let modal = document.getElementById('edit-product-modal');
    if (modal) modal.classList.remove('hidden');
}

// ৩. এডিট মডাল বন্ধ করার ফাংশন
// এই ফাংশনটি প্রোডাক্ট এডিট মডাল পপআপ বন্ধ করে
window.closeEditModal = function () {
    let modal = document.getElementById('edit-product-modal');
    if (modal) modal.classList.add('hidden');
}

// ৪. এডিট করা প্রোডাক্ট ফায়ারস্টোরে সেভ করার ফাংশন
// এই ফাংশনটি মডালে এডিট করা প্রোডাক্টের নতুন তথ্য ফায়ারস্টোর ডাটাবেসে সেভ করে
window.saveEditedProduct = async function (event) {
    event.preventDefault();

    let pId = document.getElementById('edit-p-id').value;
    let title = document.getElementById('edit-p-title').value;
    let category = document.getElementById('edit-p-category').value;
    let price = document.getElementById('edit-p-price').value;
    let description = document.getElementById('edit-p-desc').value;
    let stockRaw = document.getElementById('edit-p-stock')?.value;
    let stockVal = stockRaw !== '' && !isNaN(parseInt(stockRaw)) ? parseInt(stockRaw) : 0;

    try {
        await updateDoc(doc(db, "products", pId), {
            title: title,
            category: category,
            price: price,
            description: description,
            stock: stockVal
        });

        alert('Product updated successfully! ✨');
        closeEditModal();
        loadAdminProductsTable();
    } catch (error) {
        console.error("Error updating product: ", error);
        alert('Failed to update product: ' + error.message);
    }
}

// ৫. প্রোডাক্ট বা ব্যানার ডিলিট করার ফাংশন
// এই ফাংশনটি ফায়ারস্টোর থেকে নির্দিষ্ট প্রোডাক্ট স্থায়ীভাবে ডিলিট করে
window.deleteProductFromCloud = async function (pId) {
    const isBanner = String(pId).startsWith('BANNER-');
    const itemType = isBanner ? 'banner' : 'item';
    if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
        try {
            await deleteDoc(doc(db, "products", pId));
            alert(`${isBanner ? 'Banner' : 'Product'} deleted successfully! 🗑️`);
            if (typeof loadProductsMap === 'function') await loadProductsMap();
            await loadAdminProductsTable();
            if (typeof loadProductsForCoupon === 'function') loadProductsForCoupon();
        } catch (error) {
            console.error("Error deleting product/banner:", error);
            alert('Failed to delete: ' + error.message);
        }
    }
}

// ==========================================================================

// ==========================================================================
// ৬. ক্লাউডে প্রোডাক্ট আপলোড (Cloudinary Upload & Firestore Engine)
// ==========================================================================
// এই ফাংশনটি নতুন প্রোডাক্ট ও ব্যানার ছবিসহ ক্লাউডিনারি ও ফায়ারস্টোরে আপলোড করে
window.uploadProductToCloud = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Uploading...';

    const title = document.getElementById('p-title')?.value.trim() || '';
    const brand = document.getElementById('p-brand')?.value.trim() || '';
    const category = document.getElementById('p-category')?.value || '';
    const price = document.getElementById('p-price')?.value.trim() || '';
    const oldPrice = document.getElementById('p-old-price')?.value.trim() || '';
    const desc = document.getElementById('p-desc')?.value.trim() || '';
    const homeSection = document.getElementById('p-home-section')?.value || '';
    const stockRaw = document.getElementById('p-stock')?.value.trim();
    const stockVal = stockRaw !== '' && !isNaN(parseInt(stockRaw)) ? parseInt(stockRaw) : 0;

    const mainImageFile = document.getElementById('p-main-image')?.files[0];
    const galleryFilesInput = document.getElementById('p-image-file');

    try {
        if (!mainImageFile) {
            throw new Error("Please select a main product image.");
        }

        let imageUrls = [];

        // ১. মেইন থাম্বনেইল ইমেজ আপলোড
        const mainFormData = new FormData();
        mainFormData.append('file', mainImageFile);
        mainFormData.append('upload_preset', UPLOAD_PRESET);

        const mainRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: mainFormData
        });

        const mainData = await mainRes.json();
        if (!mainData.secure_url) {
            throw new Error("Main image upload failed: " + (mainData.error?.message || "Unknown error"));
        }

        const mainDownloadURL = mainData.secure_url;
        imageUrls.push(mainDownloadURL);

        // ২. গ্যালারি ইমেজগুলো আপলোড
        if (galleryFilesInput && galleryFilesInput.files && galleryFilesInput.files.length > 0) {
            const filesArray = Array.from(galleryFilesInput.files);

            for (let i = 0; i < filesArray.length; i++) {
                const formData = new FormData();
                formData.append('file', filesArray[i]);
                formData.append('upload_preset', UPLOAD_PRESET);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (data.secure_url) {
                    imageUrls.push(data.secure_url);
                }
            }
        }

        // ব্যানার কি না তা নির্ধারণ করা
        const isBannerMode = (homeSection === 'slider-1' || homeSection === 'slider-2' || homeSection === 'side-banner' || homeSection.startsWith('slider-'));

        // হ্যাশ আইডির পরিবর্তে সহজে চেনার মতো ক্লিয়ার প্রোডাক্ট বা ব্যানার আইডি তৈরি
        const cleanTitleSlug = title
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 25);
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const productDocId = isBannerMode
            ? `BANNER-${homeSection.toUpperCase()}-${randSuffix}`
            : (cleanTitleSlug ? `PRD-${cleanTitleSlug}-${randSuffix}` : `PRD-${Date.now()}`);

        // ফায়ারস্টোরে রিডেবল ডকুমেন্ট আইডিতে ডেটা সেভ করা (ব্যানারের জন্য স্পষ্ট ফ্ল্যাগ সহ)
        await setDoc(doc(db, "products", productDocId), {
            id: productDocId,
            title: title || (isBannerMode ? `Hero Banner (${homeSection})` : 'Product'),
            brand: brand,
            category: isBannerMode ? 'banner' : (category || 'general'),
            price: price || (isBannerMode ? '0' : ''),
            oldPrice: oldPrice,
            stock: isBannerMode ? 0 : stockVal,
            images: imageUrls,
            image: mainDownloadURL,
            desc: desc,
            homeSection: homeSection,
            isBanner: isBannerMode,
            isHeroBanner: isBannerMode,
            type: isBannerMode ? 'banner' : 'product',
            createdAt: Date.now()
        });

        alert(isBannerMode ? 'Hero Banner uploaded successfully! 🚀' : 'Product uploaded successfully! 🚀');
        e.target.reset();
        await loadProductsMap();
        await loadAdminProductsTable();
        if (typeof loadProductsForCoupon === 'function') loadProductsForCoupon();
        if (typeof loadCouponsList === 'function') loadCouponsList();
    } catch (error) {
        console.error("Error: ", error);
        alert('Error uploading product: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up text-sm"></i> Upload Product';
    }
}

// ==========================================================================

// Window Global Exports
window.loadProductsMap = loadProductsMap;
window.handleBannerSectionChange = handleBannerSectionChange;
window.loadAdminProductsTable = loadAdminProductsTable;
window.filterAdminProductsTable = filterAdminProductsTable;
window.clearAdminProductSearch = clearAdminProductSearch;
window.renderAdminProductsRows = renderAdminProductsRows;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditedProduct = saveEditedProduct;
window.deleteProductFromCloud = deleteProductFromCloud;
window.uploadProductToCloud = uploadProductToCloud;
