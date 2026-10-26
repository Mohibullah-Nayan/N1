/* ==========================================================================
         ADMIN ORDERS - REALTIME FIRESTORE DATA SYNC
         --------------------------------------------------------------------------
         ১. ফায়ারবেস কনফিগারেশন ও ইনস্ট্যান্স (Firebase Config & Init)
         ২. গ্লোবাল স্টেট ও ক্যাশ (Global Cache State)
         ৩. রিয়েল-টাইম অর্ডার ও ইউজার ডেটা ফেচিং (Orders & Users Sync Engine)
         ========================================================================== */
      import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
      import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
      import {
        getFirestore,
        collection,
        onSnapshot,
        getDocs,
        getDoc,
        doc,
        updateDoc,
        serverTimestamp,
      } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

      // ফায়ারবেস সঠিক কনফিগারেশন
      const firebaseConfig = {
        apiKey: "AIzaSyD6TSzBthiUw_HkKfBc3hkQnw_mQEs8FZU",
        authDomain: "nayan-bc068.firebaseapp.com",
        projectId: "nayan-bc068",
        storageBucket: "nayan-bc068.firebasestorage.app",
        messagingSenderId: "782323259018",
        appId: "1:782323259018:web:a428fe0d96897711223f73",
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);

      // গ্লোবালি ফায়ারস্টোর মেথড ও ডিবি রেফারেন্স অ্যাসাইন করা (অ্যাডমিন এক্সটেনশনের জন্য)
      window.db = db;
      window.firestoreUpdateDoc = updateDoc;
      window.firestoreDoc = doc;
      window.firestoreServerTimestamp = serverTimestamp;

      // অ্যাডমিন লগআউট হ্যান্ডলার
      // এই ফাংশনটি অ্যাডমিনকে ফায়ারবেস অথ থেকে সাইন আউট করে লগইন পেজে রিডাইরেক্ট করে
      window.handleAdminLogout = async function () {
        try {
          await signOut(auth);
          window.location.href = "admin-login.html";
        } catch (err) {
          console.error("Admin logout error:", err);
        }
      };

      // অর্ডার স্ট্যাটাস রিয়েলটাইমে আপডেট করার ফাংশন
      // এই ফাংশনটি ফায়ারস্টোরে নির্দিষ্ট অর্ডারের ডেলিভারি স্ট্যাটাস রিয়েল-টাইমে আপডেট করে
      window.updateOrderStatus = async function (firebaseId, newStatus, selectElement) {
        if (!firebaseId) {
          alert("Order ID missing for status update.");
          return;
        }
        try {
          if (selectElement) {
            selectElement.disabled = true;
            selectElement.style.opacity = '0.6';
          }
          await updateDoc(doc(db, "orders", firebaseId), {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Error updating order status:", err);
          alert("Failed to update status: " + err.message);
          if (selectElement) {
            selectElement.disabled = false;
            selectElement.style.opacity = '1';
          }
        }
      };

      let adminOrdersAuthInitialized = false;

      // কঠোর অ্যাডমিন রোল অথেন্টিকেশন গার্ড
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          window.location.href = "admin-login.html";
          return;
        }

        // একবার অথেন্টিকেশন হয়ে গেলে পরবর্তী কোনো ইভেন্টে পুনরায় গার্ড বা রিলোড চলবে না
        if (adminOrdersAuthInitialized) {
          return;
        }
        adminOrdersAuthInitialized = true;

        const guardEl = document.getElementById("admin-auth-guard");

        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (!userSnap.exists() || userSnap.data()?.role !== "admin") {
            alert("Unauthorized access! Only authorized admins can access this page.");
            await signOut(auth);
            window.location.href = "admin-login.html";
            return;
          }

          // Verified Admin Access Granted - গার্ডটি স্থায়ীভাবে ডম থেকে সরিয়ে দেওয়া হলো
          if (guardEl) {
            guardEl.classList.add("opacity-0", "pointer-events-none");
            setTimeout(() => {
              try { guardEl.remove(); } catch(e) { guardEl.style.display = "none"; }
            }, 300);
          }

          fetchAllData();
        } catch (err) {
          console.error("Admin verification error:", err);
          window.location.href = "admin-login.html";
        }
      });

      // গ্লোবাল স্টেট
      window.cachedRawOrders = [];
      window.cachedAllReviews = {};
      window.currentStatusFilter = "all";

      // রিয়েল-টাইম অর্ডার এবং ইউজার ডেটা একসাথে সিঙ্ক করার ফাংশন
      // এই ফাংশনটি ফায়ারস্টোর থেকে সকল ইউজার ও অর্ডার রিয়েল-টাইমে এনে ড্যাশবোর্ডের কেপিআই কাউন্টার ও লিস্ট রিফ্রেশ করে
      async function fetchAllData() {
        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          let usersCache = new Map();
          usersSnapshot.forEach((uDoc) => {
            usersCache.set(uDoc.id, uDoc.data());
          });

          // অর্ডার কালেকশনে রিয়েল-টাইম লিসেনার চালু করা
          onSnapshot(
            collection(db, "orders"),
            (snapshot) => {
              let orders = [];
              snapshot.forEach((doc) => {
                let data = doc.data();
                data.firebaseId = doc.id;

                let orderUserId = data.userId;
                if (orderUserId && usersCache.has(orderUserId)) {
                  let uData = usersCache.get(orderUserId);
                  if (uData) {
                    if (!data.name && !data.fullName)
                      data.name = uData.fullName || uData.name;
                    if (!data.phone) data.phone = uData.phone;
                    if (!data.address && !data.shippingAddress)
                      data.address = uData.shippingAddress || uData.address;
                    if (!data.email) data.email = uData.email;
                  }
                }

                orders.push(data);
              });

              // লোকালস্টোরেজ থেকে রিভিউ ডাটা নিয়ে আসা
              let allReviews =
                JSON.parse(localStorage.getItem("product_reviews")) || {};

              window.cachedRawOrders = orders;
              window.cachedAllReviews = allReviews;

              // কেপিআই মেট্রিক্স আপডেট করা
              updateExecutiveCounters(orders);

              // রেন্ডারিং ফাংশন কল করা
              applyFiltersAndRender();
            },
            (error) => {
              console.error(
                "Error loading real-time orders from Firebase:",
                error,
              );
            },
          );
        } catch (err) {
          console.error("Error pre-fetching users:", err);
        }
      }

      fetchAllData();