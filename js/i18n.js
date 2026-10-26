/* ==========================================================================
   SCENT LUXURY PERFUMES - MULTILINGUAL i18n MODULE (js/i18n.js)
   --------------------------------------------------------------------------
   - English & Bengali dual language translation dictionary
   - Real-time DOM text & input placeholder updater
   - Document lang attribute and LocalStorage persistence
   - Desktop and Mobile dropdown selector synchronizer
   ========================================================================== */

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



// Window Global Exports
window.translations = translations;
window.changeLanguage = changeLanguage;
window.initLanguageModule = initLanguageModule;
