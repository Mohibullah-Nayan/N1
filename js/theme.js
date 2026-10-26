/* ==========================================================================
   SCENT LUXURY PERFUMES - THEME CONTROLLER MODULE (js/theme.js)
   --------------------------------------------------------------------------
   - Dark mode, Light mode and System Automatic mode
   - Instant FOUC-prevention initialization
   - Real-time OS color-scheme change listener
   - Theme toggle button handler with moon/sun icon sync
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



// Window Global Exports
window.applyTheme = applyTheme;
window.initThemeModule = initThemeModule;
