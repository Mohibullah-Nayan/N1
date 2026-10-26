/* ==========================================================================
   SCENT LUXURY PERFUMES - INSTANT SEARCH ENGINE (js/search.js)
   --------------------------------------------------------------------------
   - Live Instant Search Autocomplete Dropdown
   - Search query filter across titles, brands and categories
   - Automatic banner exclusion (banners never show in search)
   - Keyboard navigation (Enter to view all, Escape to close)
   ========================================================================== */

// ==========================================================================
// ৪. অ্যাডভান্সড লাইভ ইনস্ট্যান্ট সার্চ ইঞ্জিন (Live Instant Search & Autocomplete)
// ==========================================================================
// এই ফাংশনটি ব্যানার ও হিরো স্লাইডার ব্যতীত সকল বিক্রয়যোগ্য পারফিউম প্রোডাক্টের তালিকা রিটার্ন করে
function getAllAvailableProducts() {
    const isBanner = window.isBannerItem || function(p) {
        if (!p) return false;
        if (p.isBanner === true || p.isHeroBanner === true || p.type === 'banner') return true;
        const sec = (p.homeSection || '').trim().toLowerCase();
        if (sec === 'slider-1' || sec === 'slider-2' || sec.startsWith('slider-') || sec === 'side-banner') return true;
        const cat = (p.category || p.productCategory || '').trim().toLowerCase();
        return cat === 'banner' || cat === 'hero-banner';
    };

    let prods = [];
    if (window.allProducts && Array.isArray(window.allProducts) && window.allProducts.length > 0) {
        prods = window.allProducts;
    } else if (typeof allProducts !== 'undefined' && Array.isArray(allProducts) && allProducts.length > 0) {
        prods = allProducts;
    } else if (typeof productsData !== 'undefined' && productsData) {
        prods = Object.values(productsData);
    }
    return prods.filter(p => !isBanner(p));
}

// এই ফাংশনটি সার্চ কুয়েরির ভিত্তিতে পাওয়া প্রোডাক্টগুলোর ড্রপডাউন সাজেশন তালিকা রেন্ডার করে
function renderSearchDropdownContent(query, matched, containerEl) {
    if (!containerEl) return;

    if (matched.length === 0) {
        containerEl.innerHTML = `
            <div class="p-6 text-center text-stone-400">
                <i class="fa-solid fa-magnifying-glass text-2xl text-stone-300 dark:text-stone-600 mb-2"></i>
                <p class="text-xs font-bold text-stone-700 dark:text-stone-200">No perfumes found for "${escapeSearchHtml(query)}"</p>
                <p class="text-[11px] text-stone-400 mt-1">Press <kbd class="px-1.5 py-0.5 bg-stone-100 dark:bg-slate-800 rounded text-stone-600 dark:text-stone-300 font-mono text-[10px] border border-stone-200 dark:border-slate-700">Enter</kbd> to explore all products</p>
            </div>
        `;
        containerEl.classList.remove('hidden');
        return;
    }

    const itemsHtml = matched.map(p => {
        let rawImg = (p.images && p.images[0]) || p.image || './images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg';
        let cleanImg = (typeof rawImg === 'object') ? (rawImg.src || rawImg.url || '') : rawImg;
        let pId = p.id || '';
        let title = p.title || p.name || 'Exclusive Perfume';
        let category = p.category || 'Luxury';
        let brand = p.brand || 'SCENT';
        let price = p.price || '';
        let oldPrice = p.oldPrice || '';

        return `
            <a href="product-details.html?id=${encodeURIComponent(pId)}" class="flex items-center gap-3 p-2.5 sm:p-3 hover:bg-amber-50/70 dark:hover:bg-slate-800/80 transition-all group">
                <div class="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-slate-800 shrink-0 border border-stone-200/80 dark:border-slate-700/80 p-0.5 flex items-center justify-center">
                    <img src="${cleanImg}" class="w-full h-full object-cover rounded group-hover:scale-105 transition-transform" alt="${escapeSearchHtml(title)}" onerror="this.onerror=null; this.src='./images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg';">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">${escapeSearchHtml(category)}</span>
                        <span class="text-[10px] text-stone-400 font-medium truncate">${escapeSearchHtml(brand)}</span>
                    </div>
                    <h5 class="text-xs font-bold text-stone-800 dark:text-stone-100 truncate mt-0.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">${escapeSearchHtml(title)}</h5>
                </div>
                <div class="text-right shrink-0">
                    <span class="text-xs font-black text-[#F26522]">৳ ${price}</span>
                    ${oldPrice && Number(oldPrice) > Number(price) ? `<span class="block text-[10px] text-stone-400 line-through">৳ ${oldPrice}</span>` : ''}
                </div>
            </a>
        `;
    }).join('');

    containerEl.innerHTML = `
        <div class="px-3 py-2 bg-stone-50 dark:bg-slate-800/60 border-b border-stone-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <span>Suggested Perfumes (${matched.length})</span>
            <span class="text-amber-600 hover:text-amber-700 cursor-pointer text-[10px] lowercase flex items-center gap-1 font-semibold" onclick="closeAllSearchDropdowns()">
                close <i class="fa-solid fa-xmark"></i>
            </span>
        </div>
        <div class="divide-y divide-stone-100 dark:divide-slate-800/80">
            ${itemsHtml}
        </div>
        <a href="products.html?search=${encodeURIComponent(query)}" class="block py-2.5 px-4 bg-stone-50 dark:bg-slate-800/80 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-center font-bold text-xs text-amber-700 dark:text-amber-400 border-t border-stone-200/70 dark:border-slate-800 transition-colors flex items-center justify-center gap-2">
            <span>View all results for "${escapeSearchHtml(query)}"</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </a>
    `;
    containerEl.classList.remove('hidden');
}

// এই ফাংশনটি সার্চ ইনপুটের বিশেষ ক্যারেক্টারগুলোকে নিরাপদ HTML এনটিটিতে রূপান্তর করে XSS আক্রমণ প্রতিরোধ করে
function escapeSearchHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// এই ফাংশনটি ডেস্কটপ ও মোবাইলের সকল ওপেন সার্চ রেজাল্ট ড্রপডাউন বন্ধ ও হাইড করে
function closeAllSearchDropdowns() {
    const dDesk = document.getElementById('desktop-search-dropdown');
    const dMob = document.getElementById('mobile-search-dropdown');
    if (dDesk) dDesk.classList.add('hidden');
    if (dMob) dMob.classList.add('hidden');
}

// এই ফাংশনটি লাইভ সার্চ ইনপুট ফিল্ড ও ড্রপডাউনের সমস্ত ইভেন্ট হ্যান্ডলার ইনিশিয়ালাইজ করে
function initLiveSearchModule() {
    const desktopInput = document.getElementById('productSearchInput');
    const mobileInput = document.getElementById('mobileSearchInput');
    const desktopDropdown = document.getElementById('desktop-search-dropdown');
    const mobileDropdown = document.getElementById('mobile-search-dropdown');
    const clearBtnDesk = document.getElementById('clearSearchBtnDesktop');
    const clearBtnMob = document.getElementById('clearSearchBtnMobile');

    // এই ফাংশনটি সার্চ ইনপুটে টাইপ করার সাথে সাথে রিয়েল-টাইমে প্রোডাক্ট ফিল্টার করে সাজেস্টেড ফলাফল প্রদর্শন করে
    function handleInputLiveSearch(inputEl, dropdownEl, clearBtn) {
        if (!inputEl || !dropdownEl) return;

        const val = inputEl.value.trim();

        if (clearBtn) {
            if (val.length > 0) clearBtn.classList.remove('hidden');
            else clearBtn.classList.add('hidden');
        }

        if (val.length < 1) {
            dropdownEl.classList.add('hidden');
            dropdownEl.innerHTML = '';
            return;
        }

        const queryLower = val.toLowerCase();
        const products = getAllAvailableProducts();

        const matched = products.filter(p => {
            const title = String(p.title || p.name || '').toLowerCase();
            const brand = String(p.brand || '').toLowerCase();
            const cat = String(p.category || '').toLowerCase();
            const desc = String(p.desc || p.description || '').toLowerCase();
            return title.includes(queryLower) || brand.includes(queryLower) || cat.includes(queryLower) || desc.includes(queryLower);
        }).slice(0, 5); // সেরা ৫টি রেজাল্ট প্রদর্শন

        renderSearchDropdownContent(val, matched, dropdownEl);
    }

    // এই ফাংশনটি সার্চ ফিল্ডে ইনপুট, ফোকাস, ক্লিয়ার বাটন ও কীবোর্ড এন্টার ইভেন্ট যুক্ত করে
    function setupSearchField(inputEl, dropdownEl, clearBtn) {
        if (!inputEl) return;

        inputEl.addEventListener('input', () => {
            handleInputLiveSearch(inputEl, dropdownEl, clearBtn);
        });

        inputEl.addEventListener('focus', () => {
            if (inputEl.value.trim().length >= 1) {
                handleInputLiveSearch(inputEl, dropdownEl, clearBtn);
            }
        });

        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const q = inputEl.value.trim();
                if (q !== '') {
                    window.location.href = `products.html?search=${encodeURIComponent(q)}`;
                }
            } else if (e.key === 'Escape') {
                closeAllSearchDropdowns();
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                inputEl.value = '';
                clearBtn.classList.add('hidden');
                if (dropdownEl) dropdownEl.classList.add('hidden');
                inputEl.focus();
            });
        }
    }

    setupSearchField(desktopInput, desktopDropdown, clearBtnDesk);
    setupSearchField(mobileInput, mobileDropdown, clearBtnMob);

    // বাইরে কোথাও ক্লিক করলে ড্রপডাউন বন্ধ হওয়া
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-search-wrapper') && !e.target.closest('#mobileSearchInput') && !e.target.closest('#mobile-search-dropdown')) {
            closeAllSearchDropdowns();
        }
    });
}



// Window Global Exports
window.getAllAvailableProducts = getAllAvailableProducts;
window.renderSearchDropdownContent = renderSearchDropdownContent;
window.escapeSearchHtml = escapeSearchHtml;
window.closeAllSearchDropdowns = closeAllSearchDropdowns;
window.initLiveSearchModule = initLiveSearchModule;
