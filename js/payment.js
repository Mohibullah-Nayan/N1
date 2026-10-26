let selectedGatewayName = "bkash";

      // পেজ লোড হলে লোকালস্টোরেজ থেকে টোটাল অ্যামাউন্ট শো করা
      // এই ফাংশনটি পেজ লোড হলে পেন্ডিং অর্ডারের তথ্য লোকালস্টোরেজ থেকে পড়ে সর্বমোট টাকার পরিমাণ প্রদর্শন করে
      window.onload = function () {
        let pendingOrder = JSON.parse(localStorage.getItem("pendingOrder"));
        if (!pendingOrder) {
          alert("No order found!");
          window.location.href = "cart.html";
          return;
        }

        // ডিসকাউন্ট সহ ফাইনাল গ্র্যান্ড টোটাল দেখানো
        if (pendingOrder.totalAmount) {
          document.getElementById("gateway-total").innerText = pendingOrder.totalAmount;
        } else {
          let subtotal = (pendingOrder.items || []).reduce((sum, item) => {
            let cleanPrice =
              parseInt(String(item.price).replace(/[^\d]/g, "")) || 0;
            return sum + cleanPrice * item.quantity;
          }, 0);
          let grandTotal = subtotal + 60;
          document.getElementById("gateway-total").innerText =
            "৳" + grandTotal.toLocaleString("en-IN");
        }
      };

      // এই ফাংশনটি পেমেন্ট মেথড (যেমন: bKash বা Nagad) নির্বাচন করে এবং সংশ্লিষ্ট গেটওয়ে বাটনের ডিজাইন আপডেট করে
      function selectGateway(gateway) {
        selectedGatewayName = gateway;
        let bkashBtn = document.getElementById("btn-bkash");
        let nagadBtn = document.getElementById("btn-nagad");
        let label = document.getElementById("account-label");

        if (gateway === "bkash") {
          bkashBtn.className =
            "pay-method-btn border-2 border-[#F26522] bg-orange-50/50 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all";
          nagadBtn.className =
            "pay-method-btn border-2 border-neutral-200 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all";
          label.innerText = "bKash Account Number";
        } else {
          nagadBtn.className =
            "pay-method-btn border-2 border-[#F26522] bg-orange-50/50 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all";
          bkashBtn.className =
            "pay-method-btn border-2 border-neutral-200 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all";
          label.innerText = "Nagad Account Number";
        }
      }

      // এই ফাংশনটি মোবাইল ব্যাংকিং একাউন্ট ও পিন যাচাই করে পেমেন্ট সম্পন্ন করে এবং ফায়ারস্টোরে অর্ডারের পেমেন্ট স্ট্যাটাস আপডেট করে
      async function processOnlinePayment() {
        let phone = document.getElementById("gateway-phone").value.trim();
        let pin = document.getElementById("gateway-pin").value.trim();

        if (!phone || !pin) {
          alert("Please enter your account number and PIN.");
          return;
        }

        if (pin.length < 4) {
          alert("Please enter a valid PIN.");
          return;
        }

        let pendingOrder = JSON.parse(localStorage.getItem("pendingOrder"));
        if (!pendingOrder) {
          alert("Session expired or order not found!");
          window.location.href = "index.html";
          return;
        }

        const gatewayTag = selectedGatewayName.toUpperCase();
        pendingOrder.paymentStatus = "Paid (" + gatewayTag + ")";
        pendingOrder.paymentMethod = "online (" + gatewayTag + ")";

        // Firebase Firestore-এ পেমেন্ট স্ট্যাটাস আপডেট করা
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          try {
            const db = firebase.firestore();
            const snap = await db.collection("orders").where("orderId", "==", pendingOrder.orderId).get();
            if (!snap.empty) {
              snap.forEach(async (doc) => {
                await doc.ref.update({
                  paymentStatus: "Paid (" + gatewayTag + ")",
                  paymentMethod: "online (" + gatewayTag + ")",
                  paidAt: firebase.firestore.FieldValue.serverTimestamp()
                });
              });
            }
          } catch (e) {
            console.warn("Could not sync online payment status to Firebase:", e);
          }
        }

        // লোকালস্টোরেজ ব্যাকআপ আপডেট ও ক্লিনআপ
        let allOrders = JSON.parse(localStorage.getItem("orders")) || [];
        allOrders.push(pendingOrder);
        localStorage.setItem("orders", JSON.stringify(allOrders));

        localStorage.removeItem("pendingOrder");
        for (let i = 0; i < localStorage.length; i++) {
          let k = localStorage.key(i);
          if (k && k.startsWith("nayan_cart_")) {
            localStorage.removeItem(k);
          }
        }

        alert(`Payment successful via ${gatewayTag}! Order ID: ${pendingOrder.orderId}`);
        window.location.href = `track-order.html?id=${encodeURIComponent(pendingOrder.orderId)}`;
      }