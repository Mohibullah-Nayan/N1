/* ==========================================================================
   SCENT LUXURY PERFUMES - HERO BANNER SLIDER MODULE (js/slider.js)
   --------------------------------------------------------------------------
   - Auto-slide 5-second interval timer
   - Next/Previous slide navigation
   - Firebase Firestore dynamic banner loader (slider-1 & slider-2)
   - Click protection: pure visual banner (no product redirect)
   ========================================================================== */

// ================= HERO BANNER SLIDER & MANUAL CHANGE SYSTEM =================
let bannerImages = [];
let currentImageIndex = 0;
let sliderInterval = null;

// এই ফাংশনটি নির্দিষ্ট ইনডেক্সের স্লাইডার ইমেজ স্মুথ অপাসিটি ট্রানজিশনের মাধ্যমে ব্যানারে প্রদর্শন করে
function showSlideImage(index) {
    const slideImage = document.querySelector('#slide-1 img');
    if (slideImage && bannerImages.length > 0) {
        if (index >= bannerImages.length) currentImageIndex = 0;
        if (index < 0) currentImageIndex = bannerImages.length - 1;

        slideImage.style.opacity = '0';
        setTimeout(() => {
            slideImage.src = bannerImages[currentImageIndex];
            slideImage.style.opacity = '1';
        }, 300);
    }
}

// এই ফাংশনটি স্লাইডারকে পরবর্তী ব্যানার ছবিতে নিয়ে যায়
function nextSlide() {
    if (bannerImages.length === 0) return;
    currentImageIndex = (currentImageIndex + 1) % bannerImages.length;
    showSlideImage(currentImageIndex);
}

// এই ফাংশনটি স্লাইডারকে পূর্ববর্তী ব্যানার ছবিতে নিয়ে যায়
function prevSlide() {
    if (bannerImages.length === 0) return;
    currentImageIndex = (currentImageIndex - 1 + bannerImages.length) % bannerImages.length;
    showSlideImage(currentImageIndex);
}

// অটো স্লাইড চালু করার ফাংশন
// এই ফাংশনটি প্রতি ৫ সেকেন্ড পরপর স্বয়ংক্রিয়ভাবে ব্যানার পরিবর্তন করার টাইমার শুরু করে
function startSliderTimer() {
    if (sliderInterval) clearInterval(sliderInterval);
    if (bannerImages.length > 1) {
        sliderInterval = setInterval(nextSlide, 5000);
    }
}

// ফায়ারবেস বা ডেটাবেজ থেকে হিরো স্লাইড লোড করে অ্যারেতে সেট করার ফাংশন
// এই ফাংশনটি প্রোডাক্ট তালিকা থেকে ব্যানার ও স্লাইডার প্রোডাক্টগুলো আলাদা করে হিরো স্লাইডার ইনিশিয়ালাইজ করে
function initHeroSliders(productsArray) {
    if (!productsArray || !Array.isArray(productsArray)) return;

    const sliderProducts = productsArray.filter(p => isBannerItem(p) || (p.homeSection && (p.homeSection === 'slider-1' || p.homeSection === 'slider-2' || p.homeSection.startsWith('slider-'))));

    if (sliderProducts.length > 0) {
        bannerImages = sliderProducts.map(p => p.image || (p.images && p.images[0]) || '').filter(url => url !== '');

        if (bannerImages.length > 0) {
            showSlideImage(0);
            startSliderTimer();
        }
    }
}

let bannerInterval = null;

// এই ফাংশনটি ফায়ারস্টোর থেকে রিয়েল-টাইমে ডাইনামিক ব্যানার ও স্লাইডার ডাটা লোড করে হোমপেজে প্রদর্শন করে
async function loadDynamicBanners(db) {
    try {
        const { collection, onSnapshot, query } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        // ক্যাশ সমস্যা এড়াতে সরাসরি সার্ভার থেকে লাইভ ডেটা নেওয়ার জন্য কোয়েরি তৈরি
        const q = query(collection(db, "products"));

        onSnapshot(q, { includeMetadataChanges: true }, (querySnapshot) => {
            let firebaseSlideImages = [];
            window.firebaseSlideProductIds = [];

            let allDocs = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                allDocs.push({
                    id: doc.id,
                    createdAt: data.createdAt || data.timestamp || data.date || 0, // সর্টিংয়ের জন্য টাইমস্ট্যাম্প বা ব্যাকআপ
                    ...data
                });
            });

            // ডক্যুমেন্টগুলোকে ক্রিয়েশন টাইম বা অর্ডারের ভিত্তিতে সঠিকভাবে সাজানো (যাতে নতুনগুলো সবসময় শেষে থাকে)
            allDocs.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return a.createdAt > b.createdAt ? 1 : -1;
                }
                return 0;
            });

            // ================= [ হিরো স্লাইডার ১ (slider-1) ব্যানার লজিক ] =================
            // শুধুমাত্র প্রকৃত ব্যানার আইটেম নেওয়া হবে - কোনো সাধারণ প্রোডাক্ট যেন ব্যানারে না আসে
            let slider1Products = allDocs.filter(p => {
                const section = p.homeSection ? p.homeSection.trim() : "";
                const imgUrl = p.images && p.images[0] ? p.images[0] : p.image;
                return imgUrl && (section === "slider-1" || p.isBanner === true);
            });

            // সর্টেড লিস্ট থেকে লেটেস্ট ব্যানারগুলো নেওয়া হলো (সাধারণ প্রোডাক্ট কখনোই ব্যানারে আসবে না)
            let finalHeroProducts = slider1Products.length > 0 ? slider1Products.slice(-3) : [];

            finalHeroProducts.forEach(product => {
                const imgUrl = product.images && product.images[0] ? product.images[0] : product.image;
                firebaseSlideImages.push(imgUrl);
                window.firebaseSlideProductIds.push(product.id);
            });

            // স্লাইডার ইনিশিয়োলাইজ ও রানিং লজিক (স্লাইডার অ্যারে রিয়েল-টাইমে আপডেট নিশ্চিতকরণ)
            if (firebaseSlideImages.length > 0) {
                const isArrayChanged = JSON.stringify(bannerImages) !== JSON.stringify(firebaseSlideImages);

                bannerImages = [...firebaseSlideImages];

                if (isArrayChanged) {
                    currentImageIndex = 0; // নতুন প্রোডাক্ট আসলে একদম প্রথম স্লাইড থেকে রিসেট হবে
                }

                showSlideImage(currentImageIndex);

                const slideContainer = document.querySelector('#slide-1');
                if (slideContainer) {
                    // ব্যানার হওয়ায় এতে কোনো ক্লিক বা ডিটেইলস পেজে যাওয়ার লিংক কাজ করবে না
                    slideContainer.style.cursor = 'default';
                    slideContainer.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
            }

            // হিরো সেকশনের প্রথম ডিসপ্লে ইমেজ ও টাইটেল আপডেট
            if (finalHeroProducts.length > 0) {
                const firstProd = finalHeroProducts[currentImageIndex] || finalHeroProducts[0];
                const imgUrl = firstProd.images && firstProd.images[0] ? firstProd.images[0] : firstProd.image;
                const img = document.getElementById("hero-img-1");
                const title = document.getElementById("hero-title-1");

                if (img) {
                    img.src = imgUrl + "?t=" + new Date().getTime();
                    img.style.cursor = "default";
                    img.className = "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500";

                    // ইমেজে ক্লিক করলে প্রোডাক্ট ডিটেইলসে যাবে না
                    img.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    };
                }
                if (title && firstProd.title) title.innerHTML = firstProd.title;
            }

            // পেজ লোড হওয়ার পর ব্যানার এবং টাইটেলগুলো দৃশ্যমান করার ক্লাস যুক্ত করা
            document.querySelectorAll('#hero-img-1, #hero-img-2, #side-banner-img, #hero-title-1, #hero-title-2, #side-banner-title').forEach(el => {
                el.classList.add('banner-loaded');
            });

            // ================= [ ৩ সেকেন্ড পরপর অটো স্লাইড পরিবর্তনের টাইমার ] =================
            if (!bannerInterval && bannerImages.length > 1) {
                bannerInterval = setInterval(() => {
                    currentImageIndex = (currentImageIndex + 1) % bannerImages.length;

                    // স্লাইড ইমেজ আপডেট
                    showSlideImage(currentImageIndex);

                    // হিরো ইমেজ ও টাইটেল আপডেট
                    const currentProd = finalHeroProducts[currentImageIndex] || finalHeroProducts[0];
                    if (currentProd) {
                        const imgUrl = currentProd.images && currentProd.images[0] ? currentProd.images[0] : currentProd.image;
                        const img = document.getElementById("hero-img-1");
                        const title = document.getElementById("hero-title-1");

                        if (img && imgUrl) {
                            img.src = imgUrl + "?t=" + new Date().getTime();
                        }
                        if (title && currentProd.title) {
                            title.innerHTML = currentProd.title;
                        }
                    }
                }, 3500); // ৩০০০ মিলিভসেকেন্ড = ৩ সেকেন্ড
            }
        });

    } catch (error) {
        console.error("Dynamic Banner load error: ", error);
    }
}


// Window Global Exports for Inline Handlers (e.g. onclick="prevSlide()")
window.showSlideImage = showSlideImage;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.startSliderTimer = startSliderTimer;
window.initHeroSliders = initHeroSliders;
window.loadDynamicBanners = loadDynamicBanners;
