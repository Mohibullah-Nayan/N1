/* ==========================================================================
         SCENT LUXURY PERFUMES & ATTAR - CHECKOUT ENGINE SCRIPT
         --------------------------------------------------------------------------
         ১. পেমেন্ট মেথড সিলেকশন কন্ট্রোলার (Payment Method Selector)
         ২. কার্ট ডেটা ও চেকআউট আইটেমস সামারি (Cart Data & Summary Loader)
         ৩. কুপন ডিসকাউন্ট ইঞ্জিন (Coupon Discount Engine)
         ৪. অর্ডার টোটাল ও ডেলিভারি চার্জ ক্যালকুলেশন (Order Totals Calculation)
         ৫. অর্ডার সাবমিশন ও ক্লাউড সিঙ্ক (Order Submission & EmailJS / Firestore)
         ৬. পেজ লোড মাস্টার ইনিশিয়ালাইজেশন (Page Load Initializer)
         ========================================================================== */

      let appliedDiscount = 0;
      let appliedCouponCode = "";

      // ==========================================================================
      // ১. পেমেন্ট মেথড সিলেকশন কন্ট্রোলার (Payment Method Selector)
      // ==========================================================================
      // পেমেন্ট মেথড কার্ড হাইলাইট ফাংশন
      // এই ফাংশনটি সিলেক্ট করা পেমেন্ট মেথড (Cash on Delivery বা Online) অনুযায়ী UI রেডিও বাটন ও কার্ড স্টাইল আপডেট করে
      function updatePaymentSelection(method) {
        const codCard = document.getElementById("payment-card-cod");
        const onlineCard = document.getElementById("payment-card-online");
        const codRadio = document.querySelector(
          'input[name="payment-method"][value="cod"]',
        );
        const onlineRadio = document.querySelector(
          'input[name="payment-method"][value="online"]',
        );

        if (method === "cod") {
          if (codRadio) codRadio.checked = true;
          if (codCard) {
            codCard.className =
              "relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-[#F26522] bg-orange-50/30 dark:bg-orange-950/20 cursor-pointer transition-all shadow-xs group";
          }
          if (onlineCard) {
            onlineCard.className =
              "relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-stone-200 dark:border-slate-700 hover:border-[#F26522]/50 bg-white dark:bg-slate-800/40 cursor-pointer transition-all shadow-xs group";
          }
        } else {
          if (onlineRadio) onlineRadio.checked = true;
          if (onlineCard) {
            onlineCard.className =
              "relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-[#F26522] bg-orange-50/30 dark:bg-orange-950/20 cursor-pointer transition-all shadow-xs group";
          }
          if (codCard) {
            codCard.className =
              "relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 border-stone-200 dark:border-slate-700 hover:border-[#F26522]/50 bg-white dark:bg-slate-800/40 cursor-pointer transition-all shadow-xs group";
          }
        }
      }

      // ==========================================================================
      // ২. কার্ট ডেটা ও চেকআউট আইটেমস সামারি (Cart Data & Summary Loader)
      // ==========================================================================
      // এই ফাংশনটি লগইন থাকা ইউজার বা গেস্ট অনুযায়ী সঠিক কার্ট স্টোরেজ কি (Key) রিটার্ন করে
      function getActiveCartKey() {
        let activeKey = "nayan_cart_guest";

        let user = null;
        if (
          typeof firebase !== "undefined" &&
          firebase.auth &&
          firebase.auth().currentUser
        ) {
          user = firebase.auth().currentUser;
        } else {
          let localUser = localStorage.getItem("user");
          if (localUser) {
            try {
              user = JSON.parse(localUser);
            } catch (e) {}
          }
        }

        if (user && user.uid) {
          activeKey = "nayan_cart_" + user.uid;
        } else if (user && user.email) {
          activeKey = "nayan_cart_" + user.email;
        }

        let cart = JSON.parse(localStorage.getItem(activeKey)) || [];
        if (cart.length === 0) {
          for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith("nayan_cart_")) {
              let tempCart = JSON.parse(localStorage.getItem(key)) || [];
              if (tempCart.length > 0) {
                activeKey = key;
                break;
              }
            }
          }
        }
        return activeKey;
      }

      // এই ফাংশনটি কার্টের আইটেমগুলো লোড করে চেকআউট সামারি লিস্ট, সাবটোটাল এবং গ্র্যান্ড টোটাল প্রদর্শন করে
      function loadCheckoutSummary() {
        let cartKey = getActiveCartKey();
        let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const itemsContainer = document.getElementById("checkout-items-list");
        const subtotalEl = document.getElementById("checkout-subtotal");
        const grandTotalEl = document.getElementById("checkout-grand-total");
        const countBadge = document.getElementById("checkout-items-count");

        if (!itemsContainer) return;

        itemsContainer.innerHTML = "";
        let subtotal = 0;
        let totalQtyCount = 0;

        if (cart.length === 0) {
          itemsContainer.innerHTML = `
            <div class="text-center py-8 px-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-dashed border-stone-200 dark:border-slate-700">
              <i class="fa-solid fa-basket-shopping text-3xl text-stone-300 dark:text-stone-600 mb-2"></i>
              <p class="text-stone-500 dark:text-stone-400 text-xs font-semibold">Your cart is empty</p>
              <a href="products.html" class="inline-block mt-2.5 text-xs font-bold text-[#F26522] hover:underline">Continue shopping →</a>
            </div>
          `;
          if (subtotalEl) subtotalEl.innerText = "৳0";
          if (grandTotalEl) grandTotalEl.innerText = "৳60";
          if (countBadge) countBadge.innerText = "0 items";
          return;
        }

        cart.forEach((item) => {
          let cleanPrice =
            parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
          let qty = parseInt(item.quantity) || 1;
          let itemTotal = cleanPrice * qty;
          subtotal += itemTotal;
          totalQtyCount += qty;

          let itemImage =
            item.image ||
            (item.images && item.images[0]) ||
            "./images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg";

          itemsContainer.innerHTML += `
            <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800/50 border border-stone-200/70 dark:border-slate-700/60 hover:border-amber-500/40 transition-all">
                <div class="relative w-14 h-14 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-700 shrink-0 flex items-center justify-center p-1">
                    <img src="${itemImage}" class="w-full h-full object-contain" alt="${item.title || "Product"}" onerror="this.onerror=null; this.src='./images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg';">
                    <span class="absolute -top-1 -right-1 bg-stone-900 text-amber-400 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-amber-500/40 shadow-xs">${qty}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-stone-900 dark:text-white text-xs sm:text-sm line-clamp-1">${item.title || "Product"}</h4>
                    <p class="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">৳${cleanPrice.toLocaleString("en-IN")} × ${qty}</p>
                </div>
                <span class="font-black text-sm text-[#F26522] whitespace-nowrap">৳${itemTotal.toLocaleString("en-IN")}</span>
            </div>
          `;
        });

        if (countBadge) {
          countBadge.innerText = `${totalQtyCount} ${totalQtyCount === 1 ? "item" : "items"}`;
        }

        calculateFinalTotals(subtotal);
      }

      // ==========================================================================
      // ৩. কুপন ডিসকাউন্ট ইঞ্জিন (Coupon Discount Engine)
      // ==========================================================================
      // এই ফাংশনটি কুপন কোড যাচাই করে ডিসকাউন্ট হিসাব করে এবং ফাইনাল বিলে প্রয়োগ করে
      function applyCoupon() {
        let codeInput = document
          .getElementById("coupon-input")
          .value.trim()
          .toUpperCase();
        let msgEl = document.getElementById("coupon-message");

        if (!codeInput) {
          msgEl.innerText = "Please enter a coupon code.";
          msgEl.className = "text-[11px] mt-1.5 text-rose-500 font-semibold";
          return;
        }

        let adminCoupons =
          JSON.parse(localStorage.getItem("adminCoupons")) || [];
        let foundCoupon = adminCoupons.find((c) => c.code === codeInput);

        if (!foundCoupon) {
          msgEl.innerText = "Invalid or expired coupon code!";
          msgEl.className = "text-[11px] mt-1.5 text-rose-500 font-semibold";
          appliedDiscount = 0;
          appliedCouponCode = "";
          loadCheckoutSummary();
          document.getElementById("discount-row").classList.add("hidden");
          return;
        }

        let cartKey = getActiveCartKey();
        let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        let subtotal = 0;
        cart.forEach((item) => {
          let cleanPrice =
            parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
          subtotal += cleanPrice * item.quantity;
        });

        if (foundCoupon.type === "percent") {
          appliedDiscount = Math.round((subtotal * foundCoupon.value) / 100);
        } else {
          appliedDiscount = foundCoupon.value;
        }

        if (appliedDiscount > subtotal) {
          appliedDiscount = subtotal;
        }

        appliedCouponCode = foundCoupon.code;
        msgEl.innerText = `Success! Coupon "${foundCoupon.code}" applied.`;
        msgEl.className =
          "text-[11px] mt-1.5 text-emerald-600 dark:text-emerald-400 font-bold";

        document.getElementById("discount-row").classList.remove("hidden");
        document.getElementById("checkout-discount").innerText =
          "-৳" + appliedDiscount.toLocaleString("en-IN");

        calculateFinalTotals(subtotal);
      }

      // ==========================================================================
      // ৪. অর্ডার টোটাল ও ডেলিভারি চার্জ ক্যালকুলেশন (Order Totals Calculation)
      // ==========================================================================
      // এই ফাংশনটি ডিসকাউন্ট ও ডেলিভারি চার্জ যোগ করে সর্বমোট মূল্য হিসাব করে
      function calculateFinalTotals(subtotal) {
        const subtotalEl = document.getElementById("checkout-subtotal");
        const grandTotalEl = document.getElementById("checkout-grand-total");

        let deliveryCharge = 60;
        let grandTotal = subtotal - appliedDiscount + deliveryCharge;
        if (grandTotal < deliveryCharge) grandTotal = deliveryCharge;

        if (subtotalEl)
          subtotalEl.innerText = "৳" + subtotal.toLocaleString("en-IN");
        if (grandTotalEl)
          grandTotalEl.innerText = "৳" + grandTotal.toLocaleString("en-IN");
      }

      // ==========================================================================
      // ৫. অর্ডার সাবমিশন ও ক্লাউড সিঙ্ক (Order Submission & EmailJS / Firestore)
      // ==========================================================================
      // এই ফাংশনটি চেকআউট ফর্ম সাবমিট হ্যান্ডেল করে, তথ্য ভ্যালিডেট করে এবং EmailJS এর মাধ্যমে নিশ্চিতকরণ ইমেইল পাঠায়
      function handleOrderSubmit(event) {
        event.preventDefault();

        let name = document.getElementById("customer-name").value.trim();
        let phone = document.getElementById("customer-phone").value.trim();
        let email = document.getElementById("customer-email").value.trim();
        let address = document.getElementById("customer-address").value.trim();
        let paymentMethod = document.querySelector(
          'input[name="payment-method"]:checked',
        ).value;

        // ভ্যালিডেশন ১: নাম পরীক্ষা
        if (!name || name.length < 2) {
          alert("Please enter your full name.");
          document.getElementById("customer-name").focus();
          return;
        }

        // ভ্যালিডেশন ২: বাংলাদেশী মোবাইল নম্বর ভ্যালিডেশন
        const cleanPhone = phone.replace(/[\s\-\+]/g, "");
        if (!/^(?:8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
          alert("Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).");
          document.getElementById("customer-phone").focus();
          return;
        }

        // ভ্যালিডেশন ৩: ঠিকানা পরীক্ষা
        if (!address || address.length < 5) {
          alert("Please enter your detailed delivery address.");
          document.getElementById("customer-address").focus();
          return;
        }

        let cartKey = getActiveCartKey();
        let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        if (cart.length === 0) {
          alert("Your cart is empty! Please add products first.");
          return;
        }

        let subtotal = 0;
        cart.forEach((item) => {
          let cleanPrice =
            parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
          subtotal += cleanPrice * item.quantity;
        });
        let grandTotal = subtotal - appliedDiscount + 60;

        let orderId = "#" + Math.floor(10000 + Math.random() * 90000);

        let activeUser =
          (typeof firebase !== "undefined" &&
            firebase.auth &&
            firebase.auth().currentUser) ||
          null;
        let userId = activeUser ? activeUser.uid : null;

        let orderData = {
          orderId: orderId,
          userId: userId,
          customerEmail: email,
          name: name,
          phone: phone,
          email: email,
          address: address,
          paymentMethod: paymentMethod,
          items: cart,
          couponUsed: appliedCouponCode ? appliedCouponCode : "None",
          discountAmount: "৳" + appliedDiscount.toLocaleString("en-IN"),
          totalAmount: "৳" + grandTotal.toLocaleString("en-IN"),
          status: "Processing",
          date: new Date().toLocaleDateString(),
        };

        let submitBtn = document.getElementById("order-btn");
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin text-sm"></i> <span>Confirming Order...</span>';
        submitBtn.disabled = true;

        let itemsListText = cart
          .map((item) => `${item.title} (${item.quantity} pcs) - ${item.price}`)
          .join(", ");

        let templateParams = {
          to_name: name,
          to_email: email,
          order_id: orderId,
          order_details: itemsListText,
          total_amount: "৳" + grandTotal.toLocaleString("en-IN"),
          shipping_address: address,
          phone_number: phone,
        };

        // EmailJS দিয়ে ইমেইল পাঠানো
        emailjs
          .send("service_inuvwec", "template_nbd15cc", templateParams)
          .then(
            function (response) {
              console.log(
                "Email sent SUCCESS!",
                response.status,
                response.text,
              );
              executeFinalStep(paymentMethod, orderData, cartKey, orderId);
            },
            function (error) {
              console.log("Email FAILED...", error);
              // ইমেইল ফেইল করলেও যাতে অর্ডার প্রসেস না থেমে যায়
              executeFinalStep(paymentMethod, orderData, cartKey, orderId);
            },
          );
      }

      // এই ফাংশনটি ফায়ারস্টোরে অর্ডার সংরক্ষণ করে, লোকাল কার্ট ক্লিয়ার করে এবং পেমেন্ট বা ট্র্যাকিং পেজে রিডাইরেক্ট করে
      async function executeFinalStep(
        paymentMethod,
        orderData,
        cartKey,
        orderId,
      ) {
        try {
          // হ্যাশ আইডির পরিবর্তে সহজে চেনার মতো ক্লিয়ার অর্ডার আইডি (যেমন: ORD-60416) দিয়ে ফায়ারস্টোরে সেভ
          const readableOrderDocId =
            "ORD-" + String(orderId).replace(/[^0-9]/g, "");

          await firebase
            .firestore()
            .collection("orders")
            .doc(readableOrderDocId)
            .set({
              ...orderData,
              firebaseId: readableOrderDocId,
              orderId: orderId,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

          // অর্ডার করা প্রোডাক্টগুলোর স্টক ফায়ারস্টোরে স্বয়ংক্রিয়ভাবে আপডেট / কমানো
          try {
            const items = orderData.items || [];
            for (const item of items) {
              const qtyToDeduct = parseInt(item.quantity) || 1;
              if (item.id) {
                const prodRef = firebase.firestore().collection("products").doc(item.id);
                const prodSnap = await prodRef.get();
                if (prodSnap.exists && prodSnap.data().stock !== undefined && prodSnap.data().stock !== null) {
                  const currentStock = parseInt(prodSnap.data().stock) || 0;
                  await prodRef.update({
                    stock: Math.max(0, currentStock - qtyToDeduct)
                  });
                }
              } else if (item.title) {
                const snap = await firebase.firestore().collection("products").where("title", "==", item.title).get();
                snap.forEach(async (docSnap) => {
                  if (docSnap.exists && docSnap.data().stock !== undefined && docSnap.data().stock !== null) {
                    const currentStock = parseInt(docSnap.data().stock) || 0;
                    await docSnap.ref.update({
                      stock: Math.max(0, currentStock - qtyToDeduct)
                    });
                  }
                });
              }
            }
          } catch (stockErr) {
            console.warn("Stock auto-decrement notice:", stockErr);
          }

          localStorage.removeItem(cartKey);
          try {
            localStorage.removeItem("nayan_cart_guest");
          } catch (e) {}

          if (paymentMethod === "online") {
            localStorage.setItem("pendingOrder", JSON.stringify(orderData));
            window.location.href = "payment.html";
          } else {
            alert(
              `Congratulations! Your order has been successfully placed. Order ID: ${orderId}`,
            );
            window.location.href = `track-order.html?id=${encodeURIComponent(orderId)}`;
          }
        } catch (error) {
          console.error("Error saving order to Firebase: ", error);
          alert(
            "Order processed, but failed to save in database. Please check console.",
          );

          // ব্যাকআপ হিসেবে লোকালস্টোরেজে সংরক্ষণ
          let allOrders = JSON.parse(localStorage.getItem("orders")) || [];
          allOrders.push(orderData);
          localStorage.setItem("orders", JSON.stringify(allOrders));
          localStorage.removeItem(cartKey);
          try {
            localStorage.removeItem("nayan_cart_guest");
          } catch (e) {}
          window.location.href = `track-order.html?id=${encodeURIComponent(orderId)}`;
        }
      }

      // ==========================================================================
      // ৬. পেজ লোড ও রিয়েলটাইম ইউজার অটো-ফিল ইনিশিয়ালাইজার
      // ==========================================================================
      window.addEventListener("load", () => {
        loadCheckoutSummary();
        if (typeof setupAuthHeaderListener === "function") {
          setupAuthHeaderListener();
        }
      });

      // ফায়ারবেস অথ স্টেট পরিবর্তন হলে কার্ট রি-সিঙ্ক ও প্রোফাইল ডাটা স্বয়ংক্রিয়ভাবে ফর্মে লোড হওয়া
      if (typeof firebase !== "undefined" && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
          loadCheckoutSummary();
          if (user) {
            try {
              const uDoc = await firebase
                .firestore()
                .collection("users")
                .doc(user.uid)
                .get();
              if (uDoc.exists) {
                const uData = uDoc.data();
                const nameEl = document.getElementById("customer-name");
                const emailEl = document.getElementById("customer-email");
                const phoneEl = document.getElementById("customer-phone");
                const addrEl = document.getElementById("customer-address");

                if (nameEl && !nameEl.value && uData.fullName)
                  nameEl.value = uData.fullName;
                if (emailEl && !emailEl.value && uData.email)
                  emailEl.value = uData.email;
                if (phoneEl && !phoneEl.value && uData.phone)
                  phoneEl.value = uData.phone;
                if (addrEl && !addrEl.value && uData.shippingAddress)
                  addrEl.value = uData.shippingAddress;
              } else {
                const nameEl = document.getElementById("customer-name");
                const emailEl = document.getElementById("customer-email");
                if (nameEl && !nameEl.value && user.displayName)
                  nameEl.value = user.displayName;
                if (emailEl && !emailEl.value && user.email)
                  emailEl.value = user.email;
              }
            } catch (err) {
              console.warn("Could not auto-fill customer details:", err);
            }
          }
        });
      }