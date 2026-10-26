/* ==========================================================================
         ADMIN ORDERS - UI FILTERING & ORDER CARD RENDER ENGINE
         --------------------------------------------------------------------------
         ১. স্ট্যাটাস ফিল্টারিং কন্ট্রোলার (Status Filter Controller)
         ২. সার্চ ইনপুট ও ইন্টারঅ্যাকশন হ্যান্ডলার (Search Filter Handler)
         ৩. এক্সিকিউটিভ কেপিআই ও কাউন্টারস ক্যালকুলেটর (Executive KPI Counters)
         ৪. অ্যাডভান্সড ফিল্টার ও রেন্ডারিং ইঞ্জিন (Advanced Filter & Sorter)
         ৫. ফায়ারবেস ডেটা লোডার ও রিয়েল-টাইম রেন্ডারার (Order Card Renderer)
         ========================================================================== */

      // ==========================================================================
      // ১. স্ট্যাটাস ফিল্টারিং কন্ট্রোলার (Status Filter Controller)
      // ==========================================================================
      // স্ট্যাটাস ফিল্টার সেট করা
      // এই ফাংশনটি অর্ডারের স্ট্যাটাস ট্যাব ফিল্টার পরিবর্তন করে এবং ফিল্টার করা অর্ডারের তালিকা রেন্ডার করে
      function setOrderStatusFilter(status) {
        window.currentStatusFilter = status;

        document.querySelectorAll(".status-filter-tab").forEach((btn) => {
          btn.className =
            "status-filter-tab px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer";
        });

        const activeBtn = document.getElementById(
          status === "all"
            ? "tab-all"
            : status === "On The Way"
              ? "tab-OnTheWay"
              : `tab-${status}`,
        );
        if (activeBtn) {
          activeBtn.className =
            "status-filter-tab px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs transition cursor-pointer";
        }

        applyFiltersAndRender();
      }

      // ==========================================================================
      // ২. সার্চ ইনপুট ও ইন্টারঅ্যাকশন হ্যান্ডলার (Search Filter Handler)
      // ==========================================================================
      // এই ফাংশনটি সার্চ ইনপুট পরিবর্তনের সাথে সাথে ফিল্টার ও রেন্ডার ফাংশন কল করে
      function handleSearchFilterChange() {
        applyFiltersAndRender();
      }

      // ==========================================================================
      // ৩. এক্সিকিউটিভ কেপিআই ও কাউন্টারস ক্যালকুলেটর (Executive KPI Counters)
      // ==========================================================================
      // কেপিআই সামারি কাউন্টার আপডেট করা
      // এই ফাংশনটি ড্যাশবোর্ডের মোট অর্ডার, প্রসেসিং, অন দ্য ওয়ে, ডেলিভার্ড ও ক্যান্সেল্ড কাউন্টারগুলো আপডেট করে
      function updateExecutiveCounters(orders) {
        let total = orders.length;
        let processing = 0;
        let ontheway = 0;
        let delivered = 0;
        let cancelled = 0;

        orders.forEach((o) => {
          let st = (o.status || "Processing").toLowerCase();
          if (st.includes("process")) processing++;
          else if (st.includes("way")) ontheway++;
          else if (st.includes("deliver")) delivered++;
          else if (st.includes("cancel")) cancelled++;
          else processing++;
        });

        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.innerText = val;
        };

        setVal("stat-total-orders", total);
        setVal("stat-processing-orders", processing);
        setVal("stat-ontheway-orders", ontheway);
        setVal("stat-delivered-orders", delivered);
        setVal("stat-cancelled-orders", cancelled);
      }

      // ==========================================================================
      // ৪. অ্যাডভান্সড ফিল্টার ও রেন্ডারিং ইঞ্জিন (Advanced Filter & Sorter)
      // ==========================================================================
      // ফিল্টার এবং সর্ট প্রয়োগ করে রেন্ডার
      // এই ফাংশনটি সিলেক্ট করা স্ট্যাটাস, সার্চ ফিল্টার ও সর্টিং প্রয়োগ করে অর্ডার কার্ড রেন্ডার করে
      function applyFiltersAndRender() {
        let orders = window.cachedRawOrders || [];
        let allReviews = window.cachedAllReviews || {};
        let query = (
          document.getElementById("orders-search-input")?.value || ""
        )
          .trim()
          .toLowerCase();
        let sortOption =
          document.getElementById("orders-sort-select")?.value || "newest";

        // ১. স্ট্যাটাস ফিল্টার
        if (window.currentStatusFilter && window.currentStatusFilter !== "all") {
          orders = orders.filter((o) => {
            let st = (o.status || "Processing").toLowerCase();
            return st === window.currentStatusFilter.toLowerCase();
          });
        }

        // ২. সার্চ কুয়েরি ফিল্টার
        if (query) {
          let cleanDigits = query.replace(/\D/g, "");
          orders = orders.filter((o) => {
            let str = JSON.stringify(o).toLowerCase();
            let name = (
              o.name ||
              o.fullName ||
              o.customerName ||
              ""
            ).toLowerCase();
            let email = (o.email || o.userEmail || "").toLowerCase();
            let phone = String(o.phone || o.phoneNumber || "").replace(
              /\D/g,
              "",
            );
            let orderId = String(
              o.orderId || o.firebaseId || "",
            ).toLowerCase();

            let matchName = name.includes(query);
            let matchEmail = email.includes(query);
            let matchId =
              orderId.includes(query) ||
              orderId.includes(query.replace("#", ""));
            let matchPhone =
              cleanDigits.length >= 3 && phone.includes(cleanDigits);

            return (
              matchName ||
              matchEmail ||
              matchId ||
              matchPhone ||
              str.includes(query)
            );
          });
        }

        // ৩. সর্টিং
        orders = orders.slice().sort((a, b) => {
          let priceA =
            parseFloat(String(a.totalAmount || "0").replace(/[^0-9.]/g, "")) ||
            0;
          let priceB =
            parseFloat(String(b.totalAmount || "0").replace(/[^0-9.]/g, "")) ||
            0;

          if (sortOption === "price-high") return priceB - priceA;
          if (sortOption === "price-low") return priceA - priceB;
          if (sortOption === "oldest") return 1;
          return -1; // newest first by default
        });

        loadAdminOrdersFromFirebase(orders, allReviews);
      }

      // ==========================================================================
      // ৫. ফায়ারবেস ডেটা লোডার ও রিয়েল-টাইম রেন্ডারার (Order Card Renderer)
      // ==========================================================================
      // এই ফাংশনটি প্রতিটি অর্ডারের বিস্তারিত তথ্য, কাস্টমার প্রোফাইল এবং প্রোডাক্ট আইটেম কার্ড আকারে ড্যাশবোর্ডে রেন্ডার করে
      function loadAdminOrdersFromFirebase(orders, allReviews) {
        const container = document.getElementById("admin-orders-container");
        if (!container) return;
        container.innerHTML = "";

        if (!orders || orders.length === 0) {
          container.innerHTML = `
            <div class="bg-white border border-slate-200/90 rounded-3xl p-12 text-center shadow-xs max-w-lg mx-auto my-8">
              <div class="w-16 h-16 bg-orange-50 text-[#F26522] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner border border-orange-100">
                <i class="fa-solid fa-box-open"></i>
              </div>
              <h3 class="text-base font-bold text-slate-800">No Matching Orders Found</h3>
              <p class="text-xs text-slate-500 mt-1.5 font-medium">No order records match the selected filter or search terms in the Firebase database.</p>
              <button onclick="document.getElementById('orders-search-input').value=''; setOrderStatusFilter('all');" class="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-[#F26522] transition-colors">
                Clear All Filters
              </button>
            </div>
          `;
          return;
        }

        orders.forEach((order) => {
          let itemsHtml = "";
          let orderItems = order.items || order.products || [];

          orderItems.forEach((item) => {
            let itemId = item.id || item.productId;
            let productReviews = (allReviews && allReviews[itemId]) || [];
            let reviewText =
              productReviews.length > 0
                ? productReviews[productReviews.length - 1].review
                : "No customer review submitted yet";
            let ratingVal =
              productReviews.length > 0
                ? productReviews[productReviews.length - 1].rating
                : 0;

            let starsHtml = "";
            for (let i = 1; i <= 5; i++) {
              starsHtml += `<i class="fa-solid fa-star text-[11px] ${i <= ratingVal ? "text-amber-400" : "text-slate-200"}"></i>`;
            }

            itemsHtml += `
              <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                <div class="flex items-center gap-3.5">
                  <div class="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs bg-slate-50 flex-shrink-0">
                    <img src="${item.image || "https://via.placeholder.com/60"}" class="w-full h-full object-cover hover:scale-105 transition-transform" alt="${item.title || item.name}">
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">${item.title || item.name}</h4>
                    <p class="text-xs text-slate-500 font-medium mt-1">
                      Price: <span class="text-[#F26522] font-black">${item.price}</span> &bull; 
                      Qty: <span class="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md">${item.quantity || item.qty || 1} pcs</span>
                    </p>
                  </div>
                </div>

                <!-- Customer Review Section -->
                <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 w-full lg:w-80 shadow-2xs">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Review:</span>
                  <div class="flex items-center gap-1 mb-1">${starsHtml}</div>
                  <p class="text-xs text-slate-700 italic leading-relaxed font-medium">"${reviewText}"</p>
                </div>
              </div>
            `;
          });

          const orderCard = document.createElement("div");

          let displayOrderId = order.orderId || order.firebaseId;
          let displayDate =
            order.date || order.orderDate || order.createdAt || "N/A";
          let currentStatus = order.status || "Processing";
          let statusLower = currentStatus.toLowerCase();

          // স্ট্যাটাস অনুযায়ী টপ বর্ডার ও কালার
          let borderAccent = "border-t-amber-500";
          let statusPillClasses = "bg-amber-50 text-amber-700 border-amber-200/80";

          if (statusLower.includes("deliver")) {
            borderAccent = "border-t-emerald-500";
            statusPillClasses = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
          } else if (statusLower.includes("way")) {
            borderAccent = "border-t-blue-600";
            statusPillClasses = "bg-blue-50 text-blue-700 border-blue-200/80";
          } else if (statusLower.includes("cancel")) {
            borderAccent = "border-t-rose-500";
            statusPillClasses = "bg-rose-50 text-rose-700 border-rose-200/80";
          }

          orderCard.className = `bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-7 shadow-sm border-t-4 ${borderAccent} space-y-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`;

          let customerName =
            order.name || order.fullName || order.customerName || "Guest Customer";
          let customerInitials = customerName.slice(0, 2).toUpperCase();
          let customerPhone =
            order.phone || order.phoneNumber || order.customerPhone || "N/A";
          let customerEmail =
            order.email || order.userEmail || "Email not specified";
          let shippingAddress =
            order.address ||
            order.shippingAddress ||
            order.deliveryAddress ||
            "Not specified";
          let paymentMethodText =
            order.paymentMethod === "cod" || !order.paymentMethod
              ? "Cash on Delivery (COD)"
              : order.paymentMethod;

          orderCard.innerHTML = `
            <div class="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 gap-3">
              <div class="flex items-center gap-2.5">
                <span class="text-xs font-black text-[#F26522] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-200/80 font-mono shadow-2xs">
                  #${String(displayOrderId).replace(/^#+/, '')}
                </span>
                <span class="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <i class="fa-regular fa-clock text-slate-400"></i> ${displayDate}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-black text-slate-900 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                  Total: ${order.totalAmount || "৳0"}
                </span>
                <select onchange="event.stopPropagation(); updateOrderStatus('${order.firebaseId}', this.value, this)" data-order-id="${order.firebaseId}" class="order-status-select border text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-all ${statusPillClasses} focus:outline-none focus:ring-2 focus:ring-[#F26522]/20">
                  <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''}>⏳ Processing</option>
                  <option value="On The Way" ${currentStatus === 'On The Way' ? 'selected' : ''}>🚚 On The Way</option>
                  <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                  <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                </select>
                <button onclick="event.stopPropagation(); window.printOrderInvoice('${order.orderId || order.firebaseId}')" class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#F26522] text-[#F26522] hover:text-white border border-orange-200/80 transition-all cursor-pointer shadow-2xs" title="Print Luxury Packing Invoice">
                  <i class="fa-solid fa-print"></i>
                  <span>Invoice</span>
                </button>
                <button onclick="event.stopPropagation(); window.updateCourierTracking('${order.firebaseId}')" class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs" title="Assign Courier & Tracking ID">
                  <i class="fa-solid fa-truck-fast text-[#F26522]"></i>
                  <span>Courier</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
              <!-- Customer details -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black flex items-center justify-center text-xs shadow-md shadow-indigo-500/20 flex-shrink-0">
                  ${customerInitials}
                </div>
                <div class="space-y-1">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Profile</p>
                  <p class="font-bold text-slate-900 text-sm">${customerName}</p>
                  <p class="text-slate-600 font-medium">
                    <a href="tel:${customerPhone}" class="hover:text-[#F26522] transition flex items-center gap-1.5">
                      <i class="fa-solid fa-phone text-[#F26522]"></i> ${customerPhone}
                    </a>
                  </p>
                  <p class="text-slate-500 truncate max-w-xs font-medium">
                    <a href="mailto:${customerEmail}" class="hover:text-[#F26522] transition flex items-center gap-1.5">
                      <i class="fa-solid fa-envelope text-[#F26522]"></i> ${customerEmail}
                    </a>
                  </p>
                </div>
              </div>

              <!-- Shipping & Payment -->
              <div class="border-t md:border-t-0 md:border-l border-slate-200/70 pt-3 md:pt-0 md:pl-4 space-y-1.5">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipping & Payment Details</p>
                <p class="text-slate-700 font-medium flex items-start gap-1.5">
                  <i class="fa-solid fa-location-dot text-[#F26522] mt-0.5"></i> 
                  <span><strong>Address:</strong> ${shippingAddress}</span>
                </p>
                <p class="text-slate-700 font-medium flex items-center gap-1.5">
                  <i class="fa-solid fa-wallet text-[#F26522]"></i> 
                  <span><strong>Payment:</strong> <span class="font-bold text-slate-900">${paymentMethodText}</span></span>
                </p>
                ${
                  order.courierTracking
                    ? `<p class="text-slate-700 font-medium flex items-center gap-1.5"><i class="fa-solid fa-truck-fast text-[#F26522]"></i> <span><strong>Courier:</strong> ${order.courierName || 'Courier'} (Trk: ${order.courierTracking})</span></p>`
                    : ""
                }
                ${
                  order.trxId || order.transactionId
                    ? `<p class="text-slate-600 text-[11px] font-mono"><i class="fa-solid fa-receipt text-slate-400"></i> TrxID: ${order.trxId || order.transactionId}</p>`
                    : ""
                }
              </div>
            </div>

            <div>
              <p class="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <i class="fa-solid fa-bag-shopping text-[#F26522]"></i> Ordered Items:
              </p>
              <div class="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                ${itemsHtml}
              </div>
            </div>
          `;

          container.appendChild(orderCard);
        });
      }