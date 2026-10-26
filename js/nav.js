/* ==========================================================================
   SCENT LUXURY PERFUMES & ATTAR - UNIFIED NAVBAR & UI ENGINE (nav.js)
   --------------------------------------------------------------------------
   ORGANIZED ARCHITECTURE & SEQUENTIAL MODULES:
   ০. তাত্ক্ষণিক থিম ও ভাষা প্রয়োগ (Instant FOUC-Free Theme & Lang Execution)
   ১. গ্লোবাল ইউনিফাইড ন্যাভবার রেন্ডারার (Global Unified Navbar Renderer)
   ২. থিম টগল কন্ট্রোলার - ডার্ক, লাইট ও সিস্টেম অটোমেটিক মোড (Theme Engine)
   ৩. বহুভাষিক অনুবাদ সিস্টেম - ইংরেজি ও বাংলা (i18n Translation Engine)
   ৪. অ্যাডভান্সড লাইভ ইনস্ট্যান্ট সার্চ ইঞ্জিন (Live Instant Search & Autocomplete)
   ৫. কার্ট ব্যাজ ও ইউজার স্টেট সিঙ্ক (Cart Count & Auth State Initializer)
   ৬. মোবাইল ড্রয়ার এবং মোবাইল সার্চ ইনিশিয়ালাইজার (Mobile Drawer & UX)
   ৭. অটো-ইনিশিয়ালাইজেশন (Self-bootstrapping on DOM Load)
   ========================================================================== */

// ==========================================================================
// ০. তাত্ক্ষণিক থিম ও ভাষা প্রয়োগ (Instant FOUC-Free Initialization)
// স্ক্রিপ্ট পড়ার সাথে সাথে এক্সিকিউট হয় যেন পেইজে কোনো সাদা ফ্লিকার না ঘটে
// ==========================================================================
// এই সেলফ-ইনভোকিং ফাংশনটি পেজ লোডের মুহূর্তে ফ্লিকারিং প্রতিরোধ করে তৎক্ষণাৎ সংরক্ষিত থিম ও ভাষা প্রয়োগ করে
(function initInstantThemeAndLang() {
    try {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
        
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }

        const savedLang = localStorage.getItem('scent-language') || 'en';
        document.documentElement.lang = savedLang === 'bn' ? 'bn' : 'en';
    } catch(e) {}
})();

// ==========================================================================
// ১. গ্লোবাল ইউনিফাইড ন্যাভবার রেন্ডারার (Global Unified Navbar Renderer)
// ==========================================================================
// এই ফাংশনটি সমস্ত ওয়েব পেজে রেসপনসিভ গ্লোবাল ন্যাভবার এবং মোবাইল ড্রয়ার ইনজেক্ট করে
function renderGlobalNavbar() {
    const placeholder = document.getElementById('navbar-placeholder') || document.querySelector('.custom-navbar-wrapper');
    if (!placeholder) return;

    // বর্তমান পেজের নাম শনাক্ত করা যাতে অ্যাক্টিভ লিংক হাইলাইট করা যায়
    const currentPath = window.location.pathname.split("/").pop().toLowerCase() || 'index.html';

    const isHome = currentPath === '' || currentPath === 'index.html';
    const isProducts = ['products.html', 'product-details.html', 'oud.html', 'attar.html', 'parfum.html', 'gift-sets.html', 'mens-luxury.html'].includes(currentPath);
    const isAbout = currentPath === 'about.html';
    const isContact = currentPath === 'contact.html';

    const activeColor = "text-amber-600 dark:text-amber-500 font-bold";
    const normalColor = "text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400";

    const navbarHtml = `
      <!-- ==================== ULTRA-MODERN PROFESSIONAL NAVBAR ==================== -->
      <div
        class="custom-navbar-wrapper w-full sticky top-0 z-50 glass-header border-b border-stone-200/60 dark:border-slate-800 shadow-sm transition-all"
      >
        <header
          class="top-header max-w-7xl mx-auto w-full flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3"
        >
          <!-- 1. Brand Logo with Photo/Image -->
          <a
            href="index.html"
            class="nav-logo shrink-0 flex items-center gap-2.5 group"
          >
            <div
              class="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform flex items-center justify-center bg-white dark:bg-slate-900"
            >
              <img
                src="./images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg"
                class="w-full h-full object-cover"
                alt="SCENT Logo"
              />
            </div>

            <span
              class="font-serif text-2xl md:text-[28px] font-bold tracking-wider bg-gradient-to-r from-stone-900 via-amber-800 to-amber-600 dark:from-white dark:via-amber-400 dark:to-amber-200 bg-clip-text text-transparent"
            >
              SCENT<span class="text-amber-600">.</span>
            </span>
          </a>

          <!-- 2. Sleek Realtime Search Bar -->
          <div
            class="nav-search-wrapper hidden md:flex flex-1 max-w-md relative mx-4"
          >
            <div class="relative w-full">
              <input
                type="text"
                id="productSearchInput"
                data-i18n-placeholder="search"
                placeholder="Search exclusive perfumes, ouds..."
                autocomplete="off"
                class="nav-search-input w-full bg-stone-100/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700/80 rounded-full py-2 pl-11 pr-10 text-xs sm:text-sm focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition shadow-inner"
              />

              <i
                class="fa-solid fa-magnifying-glass absolute left-4 top-3 text-stone-400 text-xs"
              ></i>
              <button type="button" id="clearSearchBtnDesktop" class="hidden absolute right-3 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs p-1" title="Clear search">
                <i class="fa-solid fa-circle-xmark"></i>
              </button>
            </div>

            <!-- Search Results Dropdown -->
            <div
              id="desktop-search-dropdown"
              class="hidden absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-stone-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs transition-all max-h-96 overflow-y-auto"
            ></div>
          </div>

          <!-- 3. Header Utilities & Actions -->
          <div
            class="header-utls flex items-center gap-2 sm:gap-3 text-sm font-medium"
          >
            <!-- Theme Toggle -->
            <button
              id="themeToggleBtn"
              class="w-9 h-9 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition shadow-2xs cursor-pointer"
              title="Toggle Theme"
            >
              <i class="fa-solid fa-moon dark:hidden text-xs"></i>
              <i
                class="fa-solid fa-sun hidden dark:inline text-xs text-amber-400"
              ></i>
            </button>

            <!-- Language Selector -->
            <div
              class="hidden sm:flex items-center gap-1 border border-stone-200 dark:border-slate-700 rounded-full px-2.5 py-1.5 bg-stone-100 dark:bg-slate-800 text-xs"
            >
              <i class="fa-solid fa-globe text-amber-600 text-[10px]"></i>

              <select
                id="languageSelect"
                class="bg-transparent outline-none cursor-pointer font-semibold text-stone-700 dark:text-stone-300"
              >
                <option value="en" class="dark:bg-slate-800">EN</option>
                <option value="bn" class="dark:bg-slate-800">বাংলা</option>
              </select>
            </div>

            <!-- Track Order Link -->
            <a
              href="track-order.html"
              class="utl-item hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition text-xs font-semibold"
            >
              <i class="fa-regular fa-circle-question text-amber-600"></i>
              <span data-i18n="track">Track</span>
            </a>

            <!-- User Account / Sign In -->
            <a
              href="login.html"
              id="user-auth-link"
              class="utl-item flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition text-xs font-semibold"
            >
              <i class="fa-regular fa-user text-amber-600"></i>
              <span class="hidden sm:inline" data-i18n="signIn">Sign In</span>
            </a>

            <!-- Wishlist -->
            <a
              href="wishlist.html"
              class="utl-item hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 transition text-stone-700 dark:text-stone-300 relative"
              title="Wishlist"
            >
              <i class="fa-regular fa-heart text-xs"></i>
            </a>

            <!-- Shopping Cart with Badge -->
            <a
              href="cart.html"
              class="utl-item relative flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-3.5 py-2 rounded-full transition shadow-md font-semibold text-xs"
            >
              <i class="fa-solid fa-bag-shopping"></i>

              <span class="hidden sm:inline" data-i18n="cart">Cart</span>

              <span
                class="cart-count-badge bg-stone-900 text-amber-400 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow hidden"
              >
                0
              </span>
            </a>

            <!-- Mobile Menu Toggle Button (Hamburger) -->
            <button
              id="mobileMenuToggleBtn"
              type="button"
              class="md:hidden w-9 h-9 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300 flex items-center justify-center transition shadow-2xs cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <i class="fa-solid fa-bars text-sm"></i>
            </button>
          </div>
        </header>

        <!-- Mobile Search Bar -->
        <div class="md:hidden px-4 pb-2.5 relative">
          <div class="relative w-full">
            <input
              type="text"
              id="mobileSearchInput"
              data-i18n-placeholder="mobileSearch"
              placeholder="Search exclusive perfumes..."
              autocomplete="off"
              class="w-full bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-10 text-xs focus:outline-none focus:border-amber-600 text-stone-900 dark:text-white"
            />

            <i
              class="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-stone-400 text-xs"
            ></i>
            <button type="button" id="clearSearchBtnMobile" class="hidden absolute right-3 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs p-1" title="Clear search">
              <i class="fa-solid fa-circle-xmark"></i>
            </button>
          </div>
          <div
            id="mobile-search-dropdown"
            class="hidden absolute top-full left-4 right-4 mt-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-stone-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs transition-all max-h-80 overflow-y-auto"
          ></div>
        </div>

        <!-- Navigation Links Ribbon -->
        <nav
          class="menu-ribbon w-full border-t border-stone-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-2"
        >
          <ul
            class="menu-container flex items-center justify-center gap-6 sm:gap-12 px-4 w-full overflow-x-auto text-xs sm:text-sm font-semibold tracking-wider uppercase"
          >
            <li class="shrink-0">
              <a
                href="index.html"
                class="menu-link transition flex items-center gap-1.5 ${isHome ? activeColor : normalColor}"
              >
                <i class="fa-solid fa-house text-[11px]"></i>
                <span data-i18n="home">Home</span>
              </a>
            </li>

            <li class="shrink-0">
              <a
                href="products.html"
                class="menu-link transition ${isProducts ? activeColor : normalColor}"
                data-i18n="allProducts"
              >
                All Products
              </a>
            </li>

            <li class="shrink-0">
              <a
                href="about.html"
                class="menu-link transition ${isAbout ? activeColor : normalColor}"
                data-i18n="about"
              >
                About Atelier
              </a>
            </li>

            <li class="shrink-0">
              <a
                href="contact.html"
                class="menu-link transition whitespace-nowrap ${isContact ? activeColor : normalColor}"
                data-i18n="contact"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <!-- ==================== MOBILE OFF-CANVAS SLIDE DRAWER ==================== -->
      <div
        id="mobile-drawer-backdrop"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] hidden transition-opacity duration-300 opacity-0"
      ></div>

      <aside
        id="mobile-drawer"
        class="fixed top-0 left-0 bottom-0 w-[290px] sm:w-[320px] max-w-[85vw] bg-white dark:bg-[#0B0F19] text-stone-900 dark:text-stone-100 z-[9999] shadow-2xl flex flex-col transform -translate-x-full transition-transform duration-300 ease-in-out border-r border-stone-200/80 dark:border-slate-800"
      >
        <!-- Drawer Header -->
        <div class="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50/50 dark:bg-slate-900/50">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg overflow-hidden shadow-sm flex items-center justify-center bg-white dark:bg-slate-900">
              <img src="./images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg" class="w-full h-full object-cover" alt="SCENT" />
            </div>
            <span class="font-serif text-xl font-bold tracking-wider text-stone-900 dark:text-white">
              SCENT<span class="text-amber-600">.</span>
            </span>
          </div>
          <button
            id="mobileDrawerCloseBtn"
            type="button"
            class="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close Mobile Menu"
          >
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <!-- Drawer Content (Scrollable) -->
        <div class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <!-- Primary Navigation -->
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 px-3 mb-2" data-i18n="mainMenu">Main Menu</p>
            <ul class="space-y-1 text-sm font-semibold">
              <li>
                <a href="index.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isHome ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/60'}">
                  <i class="fa-solid fa-house w-5 text-center text-amber-600"></i>
                  <span data-i18n="home">Home</span>
                </a>
              </li>
              <li>
                <a href="products.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isProducts ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/60'}">
                  <i class="fa-solid fa-boxes-stacked w-5 text-center text-amber-600"></i>
                  <span data-i18n="allProducts">All Products</span>
                </a>
              </li>
              <li>
                <a href="about.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isAbout ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/60'}">
                  <i class="fa-solid fa-feather-pointed w-5 text-center text-amber-600"></i>
                  <span data-i18n="about">About Atelier</span>
                </a>
              </li>
              <li>
                <a href="contact.html" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isContact ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/60'}">
                  <i class="fa-solid fa-headset w-5 text-center text-amber-600"></i>
                  <span data-i18n="contact">Contact Us</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Shop By Categories (Exactly matching index.html) -->
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 px-3 mb-2" data-i18n="shopByCategories">SHOP BY CATEGORIES</p>
            <ul class="space-y-1 text-xs font-semibold">
              <li>
                <a href="parfum.html" class="flex items-center justify-between px-3 py-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition ${currentPath === 'parfum.html' ? 'bg-amber-500/10 text-amber-600 font-bold' : ''}">
                  <span class="flex items-center gap-2.5"><i class="fa-solid fa-person text-amber-600 text-sm"></i> <span data-i18n="catMen">MEN</span></span>
                  <span class="text-[10px] bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Explore</span>
                </a>
              </li>
              <li>
                <a href="oud.html" class="flex items-center justify-between px-3 py-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition ${currentPath === 'oud.html' ? 'bg-amber-500/10 text-amber-600 font-bold' : ''}">
                  <span class="flex items-center gap-2.5"><i class="fa-solid fa-person-dress text-amber-600 text-sm"></i> <span data-i18n="catWomen">WOMEN</span></span>
                  <span class="text-[10px] bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Explore</span>
                </a>
              </li>
              <li>
                <a href="attar.html" class="flex items-center justify-between px-3 py-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition ${currentPath === 'attar.html' ? 'bg-amber-500/10 text-amber-600 font-bold' : ''}">
                  <span class="flex items-center gap-2.5"><i class="fa-solid fa-child text-amber-600 text-sm"></i> <span data-i18n="catKids">KIDS</span></span>
                  <span class="text-[10px] bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Explore</span>
                </a>
              </li>
              <li>
                <a href="gift-sets.html" class="flex items-center justify-between px-3 py-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition ${currentPath === 'gift-sets.html' ? 'bg-amber-500/10 text-amber-600 font-bold' : ''}">
                  <span class="flex items-center gap-2.5"><i class="fa-solid fa-venus-mars text-amber-600 text-sm"></i> <span data-i18n="catUnisex">UNISEX</span></span>
                  <span class="text-[10px] bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Explore</span>
                </a>
              </li>
              <li>
                <a href="mens-luxury.html" class="flex items-center justify-between px-3 py-2 rounded-xl text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition ${currentPath === 'mens-luxury.html' ? 'bg-amber-500/10 text-amber-600 font-bold' : ''}">
                  <span class="flex items-center gap-2.5"><i class="fa-solid fa-gift text-amber-600 text-sm"></i> <span data-i18n="catGiftSets">GIFT SETS</span></span>
                  <span class="text-[10px] bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Explore</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- User Quick Links -->
          <div class="pt-2 border-t border-stone-200 dark:border-slate-800">
            <p class="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 px-3 mb-2" data-i18n="accountSupport">Account & Quick Access</p>
            <ul class="space-y-1 text-xs font-semibold">
              <li>
                <a href="track-order.html" class="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition">
                  <i class="fa-solid fa-truck-fast text-amber-600 w-4 text-center"></i>
                  <span data-i18n="trackYourOrder">Track Your Order</span>
                </a>
              </li>
              <li>
                <a href="wishlist.html" class="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition">
                  <i class="fa-regular fa-heart text-amber-600 w-4 text-center"></i>
                  <span data-i18n="myWishlist">My Wishlist</span>
                </a>
              </li>
              <li>
                <a href="login.html" class="flex items-center gap-3 px-3 py-2 rounded-xl text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition">
                  <i class="fa-regular fa-user text-amber-600 w-4 text-center"></i>
                  <span data-i18n="accountProfile">Account & Profile</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Drawer Footer: Language & Theme Toggle -->
        <div class="p-3.5 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-globe text-amber-600"></i>
            <span class="font-bold text-stone-700 dark:text-stone-300">Lang:</span>
            <select id="mobileDrawerLangSelect" class="bg-stone-200/80 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer">
              <option value="en">EN</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>

          <!-- Drawer Theme Toggle Button -->
          <button
            id="mobileDrawerThemeToggleBtn"
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-stone-300 font-semibold transition cursor-pointer hover:bg-stone-300 dark:hover:bg-slate-700"
            title="Toggle Theme"
          >
            <i class="fa-solid fa-moon dark:hidden text-xs text-stone-600"></i>
            <i class="fa-solid fa-sun hidden dark:inline text-xs text-amber-400"></i>
            <span class="text-[11px] dark:hidden">Dark</span>
            <span class="text-[11px] hidden dark:inline">Light</span>
          </button>
        </div>
      </aside>
    `;

    // প্লেসহোল্ডারে ন্যাভবার ইনজেক্ট করা
    if (placeholder.id === 'navbar-placeholder') {
        placeholder.innerHTML = navbarHtml;
    } else {
        placeholder.outerHTML = navbarHtml;
    }

    // ন্যাভবার তৈরির পর সংশ্লিষ্ট মডিউলগুলো সচল করা
    initThemeModule();
    initLanguageModule();
    initLiveSearchModule();
    initNavbarCartBadge();
    initMobileDrawer();

    // ফায়ারবেস অথ হেডার লিসেনার থাকলে তা কল করা (db.js থেকে)
    if (typeof setupAuthHeaderListener === 'function') {
        setupAuthHeaderListener();
    }
}

// ==========================================================================
// ২. থিম কন্ট্রোলার - ডার্ক, লাইট ও সিস্টেম অটোমেটিক মোড (Theme Engine)
// ==========================================================================
// এই ফাংশনটি ডকুমেন্টে ডার্ক বা লাইট মোডের ক্লাস এবং এট্রিবিউট প্রয়োগ করে এবং লোকালস্টোরেজে সংরক্ষণ করে
function applyTheme(theme, persist = true) {
    const htmlElement = document.documentElement;
    const isDark = theme === 'dark';

    if (isDark) {
        htmlElement.classList.add('dark');
        htmlElement.setAttribute('data-theme', 'dark');
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.setAttribute('data-theme', 'light');
    }

    if (persist) {
        localStorage.setItem('theme', theme);
    }
}

// এই ফাংশনটি থিম টগল বাটন ও অপারেটিং সিস্টেমের ডার্ক মোড প্রেফারেন্স পরিবর্তনের লাইভ লিসেনার সেটআপ করে
function initThemeModule() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const drawerThemeToggleBtn = document.getElementById('mobileDrawerThemeToggleBtn');
    const htmlElement = document.documentElement;

    // এই ফাংশনটি থিম বাটনে ক্লিক করা হলে বর্তমান থিম পরিবর্তন (লাইট থেকে ডার্ক বা ডার্ক থেকে লাইট) করে
    function handleToggle() {
        const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme, true);
    }

    if (themeToggleBtn) {
        themeToggleBtn.onclick = handleToggle;
    }
    if (drawerThemeToggleBtn) {
        drawerThemeToggleBtn.onclick = handleToggle;
    }

    // প্রাথমিক লোডে থিম নির্ধারণ:
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        applyTheme(savedTheme, false);
    } else {
        // যদি ব্যবহারকারী নিজে সেট না করে থাকে, তবে সিস্টেমের মোড অনুযায়ী স্বয়ংক্রিয়ভাবে চলবে
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(systemPrefersDark ? 'dark' : 'light', false);
    }

    // সিস্টেম/ডিভাইসের থিম পরিবর্তন (Light <-> Dark) লাইভ ট্র্যাক করা
    if (window.matchMedia) {
        const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleOSThemeChange = (e) => {
            const currentSaved = localStorage.getItem('theme');
            // যদি ম্যানুয়াল চয়েস না থাকে, তবে ডিভাইস মোড অনুযায়ী সাথে সাথে পরিবর্তন হবে
            if (!currentSaved) {
                applyTheme(e.matches ? 'dark' : 'light', false);
            }
        };

        if (colorSchemeQuery.addEventListener) {
            colorSchemeQuery.addEventListener('change', handleOSThemeChange);
        } else if (colorSchemeQuery.addListener) {
            colorSchemeQuery.addListener(handleOSThemeChange);
        }
    }
}

// ==========================================================================
// ৩. বহুভাষিক অনুবাদ সিস্টেম - ইংরেজি ও বাংলা (i18n Translation Engine)
// ==========================================================================
const translations = {
    en: {
        home: 'Home',
        allProducts: 'All Products',
        about: 'About Atelier',
        contact: 'Contact Us',
        trackOrder: 'Track Order',
        track: 'Track',
        signIn: 'Sign In',
        account: 'Account',
        wishlist: 'Wishlist',
        cart: 'Cart',
        search: 'Search',
        shop: 'Shop',
        searchPlaceholder: 'Search exclusive perfumes, ouds...',
        mainMenu: 'Main Menu',
        shopByCategories: 'SHOP BY CATEGORIES',
        catMen: 'MEN',
        catWomen: 'WOMEN',
        catKids: 'KIDS',
        catUnisex: 'UNISEX',
        catGiftSets: 'GIFT SETS',
        accountSupport: 'Account & Quick Access',
        trackYourOrder: 'Track Your Order',
        myWishlist: 'My Wishlist',
        accountProfile: 'Account & Profile',
        orderWhatsApp: 'Order via WhatsApp',
        buyNow: 'Buy Now',
        addToCart: 'Add to Cart',
        viewDetails: 'View Details',
        outOfStock: 'Out of Stock'
    },
    bn: {
        home: 'হোম',
        allProducts: 'সকল পণ্য',
        about: 'আমাদের সম্পর্কে',
        contact: 'যোগাযোগ করুন',
        trackOrder: 'অর্ডার ট্র্যাক করুন',
        track: 'ট্র্যাক',
        signIn: 'সাইন ইন',
        account: 'অ্যাকাউন্ট',
        wishlist: 'উইশলিস্ট',
        cart: 'কার্ট',
        search: 'অনুসন্ধান',
        shop: 'শপ',
        searchPlaceholder: 'এক্সক্লুসিভ পারফিউম খুঁজুন...',
        mainMenu: 'মূল মেনু',
        shopByCategories: 'SHOP BY CATEGORIES',
        catMen: 'MEN',
        catWomen: 'WOMEN',
        catKids: 'KIDS',
        catUnisex: 'UNISEX',
        catGiftSets: 'GIFT SETS',
        accountSupport: 'অ্যাকাউন্ট ও সহায়তা',
        trackYourOrder: 'অর্ডার ট্র্যাক করুন',
        myWishlist: 'আমার উইশলিস্ট',
        accountProfile: 'অ্যাকাউন্ট ও প্রোফাইল',
        orderWhatsApp: 'হোয়াটসঅ্যাপে অর্ডার',
        buyNow: 'এখনই কিনুন',
        addToCart: 'কার্টে যোগ করুন',
        viewDetails: 'বিস্তারিত দেখুন',
        outOfStock: 'স্টক শেষ'
    }
};

// এই ফাংশনটি নির্বাচিত ভাষা অনুযায়ী ওয়েবসাইটের সমস্ত টেক্সট, ইনপুট প্লেসহোল্ডার এবং ড্রপডাউন অনুবাদ করে
function changeLanguage(language) {
    const selectedLanguage = translations[language] ? language : 'en';

    // 1. [data-i18n] টেক্সট আপডেট
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[selectedLanguage] && translations[selectedLanguage][key]) {
            element.textContent = translations[selectedLanguage][key];
        }
    });

    // 2. [data-i18n-placeholder] ইনপুট প্লেসহোল্ডার আপডেট
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key === 'search' || key === 'mobileSearch') {
            element.placeholder = translations[selectedLanguage].searchPlaceholder;
        }
    });

    // 3. ডক lang এট্রিবিউট এবং লোকালস্টোরেজে সংরক্ষণ
    document.documentElement.lang = selectedLanguage === 'bn' ? 'bn' : 'en';
    localStorage.setItem('scent-language', selectedLanguage);

    // 4. ডেস্কটপ ও মোবাইল ড্রয়ার সিলেক্টর দুটি সিঙ্ক রাখা
    const desktopSelect = document.getElementById('languageSelect');
    const drawerSelect = document.getElementById('mobileDrawerLangSelect');
    if (desktopSelect && desktopSelect.value !== selectedLanguage) {
        desktopSelect.value = selectedLanguage;
    }
    if (drawerSelect && drawerSelect.value !== selectedLanguage) {
        drawerSelect.value = selectedLanguage;
    }
}

// এই ফাংশনটি ভাষা পরিবর্তনের সিলেক্ট ড্রপডাউনের জন্য ইভেন্ট হ্যান্ডলার ইনিশিয়ালাইজ করে এবং সংরক্ষিত ভাষা লোড করে
function initLanguageModule() {
    const languageSelect = document.getElementById('languageSelect');
    const drawerLangSelect = document.getElementById('mobileDrawerLangSelect');

    const handleSelectChange = function () {
        changeLanguage(this.value);
    };

    if (languageSelect) {
        languageSelect.onchange = handleSelectChange;
    }
    if (drawerLangSelect) {
        drawerLangSelect.onchange = handleSelectChange;
    }

    const savedLanguage = localStorage.getItem('scent-language') || 'en';
    changeLanguage(savedLanguage);
}

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

// ==========================================================================
// ৫. কার্ট ব্যাজ ও ইউজার স্টেট সিঙ্ক (Cart Count & Auth State Initializer)
// ==========================================================================
// এই ফাংশনটি লোকালস্টোরেজ থেকে কার্ট আইটেমের সংখ্যা হিসাব করে ন্যাভবারের ব্যাজ কাউন্টারে প্রদর্শন করে
function initNavbarCartBadge() {
    let cartKey = 'nayan_cart_guest';
    try {
        const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
        if (user && user.uid) cartKey = 'nayan_cart_' + user.uid;
        else if (user && user.email) cartKey = 'nayan_cart_' + user.email;
    } catch(e) {}

    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem(cartKey)) || JSON.parse(localStorage.getItem('nayan_cart_guest')) || [];
    } catch(e) {}

    let totalCount = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0);

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

// ==========================================================================
// ৬. মোবাইল ড্রয়ার এবং মোবাইল সার্চ ইনিশিয়ালাইজার (Mobile Drawer & UX)
// ==========================================================================
// এই ফাংশনটি মোবাইল ডিভাইসের জন্য সাইডবার মেনু ড্রয়ার ওপেন ও ক্লোজ করার হ্যান্ডলার যুক্ত করে
function initMobileDrawer() {
    const toggleBtn = document.getElementById('mobileMenuToggleBtn');
    const closeBtn = document.getElementById('mobileDrawerCloseBtn');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const drawer = document.getElementById('mobile-drawer');

    function openDrawer() {
        if (!drawer || !backdrop) return;
        backdrop.classList.remove('hidden');
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            drawer.classList.remove('-translate-x-full');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (!drawer || !backdrop) return;
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('opacity-0');
        setTimeout(() => {
            backdrop.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    if (toggleBtn) toggleBtn.onclick = openDrawer;
    if (closeBtn) closeBtn.onclick = closeDrawer;
    if (backdrop) backdrop.onclick = closeDrawer;

    // ESC বাটন চাপলে ড্রয়ার বন্ধ হওয়া
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    // ড্রয়ারের ভাষা সুইচিং মেইন ন্যাভবারের সাথে সিঙ্ক
    const drawerLangSelect = document.getElementById('mobileDrawerLangSelect');
    const mainLangSelect = document.getElementById('languageSelect');
    if (drawerLangSelect && mainLangSelect) {
        drawerLangSelect.value = mainLangSelect.value;
        drawerLangSelect.onchange = function() {
            mainLangSelect.value = this.value;
            changeLanguage(this.value);
        };
    }

    // ড্রয়ারের ভেতরের যেকোনো লিঙ্কে ক্লিক করলে ড্রয়ার বন্ধ হওয়া
    drawer?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });
}

// এই ফাংশনটি মোবাইল স্ক্রিনে সার্চ ফিল্ডে স্মুথ স্ক্রোল করে কার্সর ফোকাস করে
window.focusMobileSearch = function() {
    const mobileInput = document.getElementById('mobileSearchInput');
    if (mobileInput) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            mobileInput.focus();
            mobileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
    } else {
        window.location.href = 'products.html';
    }
};

// গ্লোবালি এক্সপোর্ট
window.renderGlobalNavbar = renderGlobalNavbar;
window.closeAllSearchDropdowns = closeAllSearchDropdowns;
window.initMobileDrawer = initMobileDrawer;
window.applyTheme = applyTheme;
window.changeLanguage = changeLanguage;

// ==========================================================================
// ৭. অটো-ইনিশিয়ালাইজেশন (Self-bootstrapping on DOM Load)
// ==========================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGlobalNavbar);
} else {
    renderGlobalNavbar();
}
