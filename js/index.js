import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

      import {
        getFirestore,
        collection,
        getDocs,
      } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

      const firebaseConfig = {
        apiKey: "AIzaSyD6TSzBthiUw_HkKfBc3hkQnw_mQEs8FZU",

        authDomain: "nayan-bc068.firebaseapp.com",

        projectId: "nayan-bc068",

        storageBucket: "nayan-bc068.firebasestorage.app",

        messagingSenderId: "782323259018",

        appId: "1:782323259018:web:a428fe0d96897711223f73",

        measurementId: "G-8PJVBLSPZV",
      };

      const app = initializeApp(firebaseConfig);

      const db = getFirestore(app);

      // এই ফাংশনটি ফায়ারস্টোর থেকে লাইভ ডাটা এনে ব্যানার (slider-1, slider-2, side-banner) ও হোমপেজের প্রোডাক্টগুলো রেন্ডার করে
      async function fetchLiveWebsiteData() {
        try {
          let firebaseProducts = [];

          const querySnapshot = await getDocs(collection(db, "products"));

          querySnapshot.forEach((doc) => {
            firebaseProducts.push({
              id: doc.id,

              ...doc.data(),
            });
          });

          const slider1Product = firebaseProducts
            .slice()
            .reverse()
            .find((p) => p.homeSection && p.homeSection.trim() === "slider-1");

          const slider2Product = firebaseProducts
            .slice()
            .reverse()
            .find((p) => p.homeSection && p.homeSection.trim() === "slider-2");

          const sideBannerProduct = firebaseProducts
            .slice()
            .reverse()
            .find(
              (p) => p.homeSection && p.homeSection.trim() === "side-banner",
            );

          /* =================================================
                   SLIDER 1 (Pure Banner Only - No Product Link)
                ================================================== */

          if (slider1Product) {
            const imgEl = document.getElementById("hero-img-1");
            const titleEl = document.getElementById("hero-title-1");
            const slideEl = document.getElementById("slide-1");

            const imageUrl =
              slider1Product.image || slider1Product.images?.[0] || "";

            if (imgEl && imageUrl) {
              imgEl.src = imageUrl;
              imgEl.style.cursor = "default";
            }

            if (titleEl && slider1Product.title) {
              titleEl.innerHTML = slider1Product.title.replace(/\s+/g, "<br>");
            }

            if (slideEl) {
              slideEl.style.cursor = "default";
              slideEl.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
              };
            }
          }

          /* =================================================
                   SLIDER 2 (Pure Banner Only - No Product Link)
                ================================================== */

          if (slider2Product) {
            const imgEl = document.getElementById("hero-img-2");
            const titleEl = document.getElementById("hero-title-2");
            const slideEl = document.getElementById("slide-2");

            const imageUrl =
              slider2Product.image || slider2Product.images?.[0] || "";

            if (imgEl && imageUrl) {
              imgEl.src = imageUrl;
              imgEl.style.cursor = "default";
            }

            if (titleEl && slider2Product.title) {
              titleEl.innerHTML = slider2Product.title.replace(/\s+/g, "<br>");
            }

            if (slideEl) {
              slideEl.style.cursor = "default";
              slideEl.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
              };
            }
          }

          /* =================================================
                   SIDE BANNER
                ================================================== */

          if (sideBannerProduct) {
            const imgEl = document.getElementById("side-banner-img");
            const titleEl = document.getElementById("side-banner-title");
            const cardEl = document.getElementById("side-banner-card");

            const imageUrl =
              sideBannerProduct.image || sideBannerProduct.images?.[0] || "";

            if (imgEl && imageUrl) {
              imgEl.src = imageUrl;
            }

            if (titleEl && sideBannerProduct.title) {
              titleEl.innerText = sideBannerProduct.title;
            }

            if (cardEl) {
              cardEl.onclick = function () {
                window.location.href = "products.html";
              };
            }
          }

          /* =================================================
                   PRODUCT DATA (Pure Products Only - Banners Excluded)
                ================================================== */

          const isBanner = (p) => {
            if (!p) return false;
            if (p.isBanner === true || p.isHeroBanner === true || p.type === 'banner') return true;
            const sec = (p.homeSection || '').trim().toLowerCase();
            if (sec === 'slider-1' || sec === 'slider-2' || sec.startsWith('slider-') || sec === 'side-banner') return true;
            const cat = (p.category || p.productCategory || '').trim().toLowerCase();
            return cat === 'banner' || cat === 'hero-banner';
          };

          const pureProducts = firebaseProducts.filter(p => !isBanner(p));

          let finalProducts =
            pureProducts.length > 0
              ? pureProducts
              : typeof productsData !== "undefined"
                ? Object.values(productsData).filter(p => !isBanner(p))
                : [];

          if (typeof window.initializeProducts === "function") {
            window.initializeProducts(finalProducts, db);
          }
        } catch (error) {
          console.error("Live data fetch error: ", error);

          if (typeof window.initializeProducts === "function") {
            let fallbackProducts =
              typeof productsData !== "undefined"
                ? Object.values(productsData)
                : [];

            window.initializeProducts(fallbackProducts, db);
          }
        }
      }

      fetchLiveWebsiteData();