
const themeToggleBtn = document.getElementById('themeToggleBtn');
const htmlElement = document.documentElement;

function applyTheme(theme) {
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.setAttribute('data-theme', 'dark');
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem('theme', theme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
} else {
    applyTheme('light');
}



const translations = {
    en: {
        home: 'Home',
        allProducts: 'All Products',
        about: 'About',
        contact: 'Contact Us',
        trackOrder: 'Track Order',
        track: 'Track',
        signIn: 'Sign In',
        wishlist: 'Wishlist',
        cart: 'Cart'
    },
    bn: {
        home: 'হোম',
        allProducts: 'সকল পণ্য',
        about: 'আমাদের সম্পর্কে',
        contact: 'যোগাযোগ করুন',
        trackOrder: 'অর্ডার ট্র্যাক করুন',
        track: 'ট্র্যাক',
        signIn: 'সাইন ইন',
        wishlist: 'উইশলিস্ট',
        cart: 'কার্ট'
    }
};

function changeLanguage(language) {
    const selectedLanguage = translations[language] ? language : 'en';


    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[selectedLanguage][key]) {
            element.textContent = translations[selectedLanguage][key];
        }
    });


    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key === 'search' || key === 'mobileSearch') {
            element.placeholder = selectedLanguage === 'bn' ? 'এক্সক্লুসিভ পারফিউম খুঁজুন...' : 'Search exclusive perfumes, ouds...';
        }
    });

    document.documentElement.lang = selectedLanguage === 'bn' ? 'bn' : 'en';
    localStorage.setItem('scent-language', selectedLanguage);
}

const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
    languageSelect.addEventListener('change', function () {
        changeLanguage(this.value);
    });

    const savedLanguage = localStorage.getItem('scent-language') || 'en';
    languageSelect.value = savedLanguage;
    changeLanguage(savedLanguage);
}


/* =========================================================
   3. NAVBAR SEARCH & INTERACTION HELPERS
========================================================= */
const productSearchInput = document.getElementById('productSearchInput');
const mobileSearchInput = document.getElementById('mobileSearchInput');

function handleSearchRedirect(e) {
    if (e.key === 'Enter' && this.value.trim() !== '') {
        const query = encodeURIComponent(this.value.trim());
        window.location.href = `products.html?search=${query}`;
    }
}

if (productSearchInput) {
    productSearchInput.addEventListener('keypress', handleSearchRedirect);
}
if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keypress', handleSearchRedirect);
}

