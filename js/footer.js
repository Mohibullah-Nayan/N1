/* ==========================================================================
   SCENT LUXURY PERFUMES - GLOBAL FOOTER MODULE (js/footer.js)
   --------------------------------------------------------------------------
   - Ultra-Modern Professional Global Footer template injection
   - Responsive multi-column layout (Brand, Collections, Support, Newsletter)
   - Certified Authentic guarantee badges & social links
   - Dynamic Current Year updater for copyright notice
   ========================================================================== */

// এই ফাংশনটি পুরো ওয়েবসাইটের জন্য রেসপনসিভ গ্লোবাল ফুটার স্বয়ংক্রিয়ভাবে রেন্ডার করে
function renderGlobalFooter() {
    const placeholder = document.getElementById('footer-placeholder') || 
                          document.querySelector('.custom-footer-wrapper') || 
                          document.querySelector('footer');
    if (!placeholder) return;

    const currentYear = new Date().getFullYear();

    const footerHtml = `
<footer
        class="bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 pt-12 pb-6 px-4 sm:px-6 mt-16 text-stone-800 dark:text-stone-200">

        <div class="max-w-[1280px] mx-auto">


            <!-- Top Row -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-8 border-b border-stone-100 dark:border-slate-800">


                <!-- Brand -->
                <div class="lg:col-span-2">

                    <a
                        href="#"
                        class="font-serif text-[28px] font-bold tracking-wider text-stone-900 dark:text-white">

                        SCENT<span class="text-amber-600">.</span>

                    </a>


                    <p
                        class="text-sm text-justify text-stone-500 dark:text-stone-400 mt-3 mb-4 leading-relaxed max-w-sm">

                        Scent Perfume Atelier is a premium e-commerce platform dedicated to safe, pure and authentic French luxury perfumes & premium Oud blends.

                    </p>


                    <div
                        class="space-y-2 text-sm text-stone-600 dark:text-stone-300 mb-4">

                        <p class="flex items-center gap-2">

                            <i
                                class="fa-solid fa-location-dot text-amber-600 w-3.5">
                            </i>

                            Nikunjo 2, Dhaka, Bangladesh

                        </p>


                        <p class="flex items-center gap-2">

                            <i
                                class="fa-solid fa-phone text-amber-600 w-3.5">
                            </i>

                            +8809642922922

                        </p>

                    </div>


                    <!-- Social -->
                    <div class="flex items-center gap-2.5">

                        <a
                            href="https://www.facebook.com/"
                            class="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-[#0B57D0] hover:text-white flex items-center justify-center text-sm text-stone-700 dark:text-stone-300 transition-all"
                            target="_blank"
                            rel="noopener noreferrer">

                            <i class="fa-brands fa-facebook-f"></i>

                        </a>


                        <a
                            href="https://www.instagram.com/"
                            class="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-[#0B57D0] hover:text-white flex items-center justify-center text-sm text-stone-700 dark:text-stone-300 transition-all"
                            target="_blank"
                            rel="noopener noreferrer">

                            <i class="fa-brands fa-twitter"></i>

                        </a>


                        <a
                            href="https://x.com/home"
                            class="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 hover:bg-[#F91F73] hover:text-white flex items-center justify-center text-sm text-stone-700 dark:text-stone-300 transition-all"
                            target="_blank"
                            rel="noopener noreferrer">

                            <i class="fa-brands fa-instagram"></i>

                        </a>

                    </div>

                </div>



                <!-- Information -->
                <div class="pt-2">

                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-3">

                        Information

                    </h4>


                    <nav class="flex flex-col space-y-2 text-sm">

                        <a
                            href="#"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            About us

                        </a>

                        <a
                            href="#"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            Contact us

                        </a>

                        <a
                            href="#"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            Terms & Conditions

                        </a>

                        <a
                            href="#"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            Privacy Policy

                        </a>

                    </nav>

                </div>



                <!-- Shop By -->
                <div class="pt-2">

                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-3">

                        Shop By

                    </h4>


                    <nav class="flex flex-col space-y-2 text-sm">

                        <a
                            href="women.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            WOMEN

                        </a>

                        <a
                            href="men.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            MEN

                        </a>

                        <a
                            href="kids.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            KIDS

                        </a>

                        <a
                            href="unisex.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            UNISEX

                        </a>

                        <a
                            href="gift-sets.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            GIFT SETS

                        </a>

                    </nav>

                </div>



                <!-- Support -->
                <div class="pt-2">

                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-3">

                        Support

                    </h4>


                    <nav class="flex flex-col space-y-2 text-sm">

                        <a
                            href="contact.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            Support Center

                        </a>

                        <a
                            href="track-order.html"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            How to Order

                        </a>

                        <a
                            href="#"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            Happy Return

                        </a>

                        <a
                            href="#"
                            class="text-stone-500 dark:text-stone-400 hover:text-amber-600 transition-colors">

                            FAQ

                        </a>

                    </nav>

                </div>



                <!-- Mobile App -->
                <div class="pt-2">

                    <h4
                        class="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 mb-3">

                        Get Mobile App

                    </h4>


                    <div class="flex flex-col gap-2.5">

                        <a
                            href="https://play.google.com/store/games"
                            class="bg-black text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-800 transition-all border border-stone-800 shadow-sm">

                            <i
                                class="fa-brands fa-google-play text-base text-amber-500">
                            </i>

                            <div class="text-left leading-tight">

                                <span
                                    class="text-[8px] uppercase block opacity-75">

                                    Get It On

                                </span>

                                <span class="text-xs font-bold">

                                    Google Play

                                </span>

                            </div>

                        </a>


                        <a
                            href="https://apps.apple.com/us/iphone/apps"
                            class="bg-black text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-stone-800 transition-all border border-stone-800 shadow-sm">

                            <i
                                class="fa-brands fa-apple text-base text-white">
                            </i>

                            <div class="text-left leading-tight">

                                <span
                                    class="text-[8px] uppercase block opacity-75">

                                    Download on

                                </span>

                                <span class="text-xs font-bold">

                                    App Store

                                </span>

                            </div>

                        </a>

                    </div>

                </div>

            </div>



            <!-- Payment -->
            <div
                class="pt-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">


                <div
                    class="flex flex-wrap items-center justify-center md:justify-start gap-2.5">

                    <span
                        class="text-xs font-semibold text-stone-500 uppercase tracking-wider">

                        Pay With:

                    </span>


                    <div class="flex flex-wrap items-center gap-2">


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/cash.jpg"
                                alt="Cash">

                        </span>


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/Visa.svg"
                                alt="Visa">

                        </span>


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/American.png"
                                alt="Amex">

                        </span>


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/Mastercard-logo.svg"
                                alt="MasterCard">

                        </span>


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/bkash.svg"
                                alt="bKash">

                        </span>


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/Nagad.png"
                                alt="Nagad">

                        </span>


                        <span
                            class="px-1.5 py-1 border border-stone-200 dark:border-slate-700 rounded bg-stone-50 dark:bg-slate-800 flex items-center">

                            <img
                                style="height: 24px; width: 45px; object-fit: contain;"
                                src="./images/pay/upay.png"
                                alt="Upay">

                        </span>

                    </div>

                </div>



                <!-- SSL -->
                <div
                    class="bg-blue-900 text-white text-[11px] font-bold px-3 py-2 rounded-lg tracking-wide shadow-lg flex items-center gap-1.5">

                    <span>
                        Verified by
                    </span>

                    <span
                        class="text-cyan-300 font-extrabold tracking-normal">

                        SSLCOMMERZ

                    </span>

                </div>

            </div>

        </div>


        <!-- Copyright -->
        <div
            class="h-16 flex justify-center items-center text-center border-t border-stone-200 dark:border-slate-800 text-xs text-stone-500 dark:text-stone-400">

            <p>
                © ${currentYear} SCENT. All rights reserved.
            </p>

        </div>

    </footer>
    `;

    if (placeholder.id === 'footer-placeholder' || placeholder.classList.contains('custom-footer-wrapper')) {
        placeholder.innerHTML = footerHtml;
    } else {
        placeholder.outerHTML = footerHtml;
    }
}

// পেজ লোড হলে স্বয়ংক্রিয়ভাবে ফুটার রেন্ডার করা
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGlobalFooter);
} else {
    renderGlobalFooter();
}

// উইন্ডো গ্লোবাল এক্সপোর্ট
window.renderGlobalFooter = renderGlobalFooter;
