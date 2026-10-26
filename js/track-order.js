/* ==========================================================================
           SCENT LUXURY PERFUMES & ATTAR - TRACK ORDER LIVE JOURNEY
           --------------------------------------------------------------------------
           ১. গ্লোবাল ভ্যারিয়েবল ও কনফেটি অ্যানিমেশন (Global State & Confetti Effect)
           ২. লাইভ ডেমো সিমুলেশন ইঞ্জিন (Live Demo Simulation Engine)
           ৩. অর্ডার ট্র্যাকিং কার্ড ও লাইভ জার্নি রেন্ডারার (Tracking Card & 3D Journey)
           ৪. অ্যানিমেশন রি-প্লে কন্ট্রোলার (Replay Animation Controller)
           ৫. রিয়েল-টাইম অর্ডার সার্চ ও ফায়ারবেস লিসেনার (Realtime Orders Listener)
           ৬. পেজ লোড ও অটো-সার্চ ইনিশিয়ালাইজার (DOM & URL Auto-Search Handler)
           ========================================================================== */

        // ==========================================================================
        // ১. গ্লোবাল ভ্যারিয়েবল ও কনফেটি অ্যানিমেশন (Global State & Confetti Effect)
        // ==========================================================================
        // রিয়েল-টাইম লিসেনার আনসাবস্ক্রাইব করার জন্য গ্লোবাল ভ্যারিয়েবল
        let activeListener = null;

        // কনফেটি পার্টিকেল ফায়ার করার হেল্পার ফাংশন
        // এই ফাংশনটি অর্ডার সফলভাবে ডেলিভারি সম্পন্ন হলে স্ক্রিনে রঙিন কনফেটি অ্যানিমেশন তৈরি করে
        function triggerDeliveryConfetti(container) {
            if (!container) return;
            const colors = ['#F26522', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#FBBF24'];
            for (let i = 0; i < 35; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-piece';
                confetti.style.left = Math.random() * 95 + '%';
                confetti.style.top = Math.random() * 20 + 'px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = (Math.random() * 0.8) + 's';
                confetti.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
                container.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3500);
            }
        }

        // ==========================================================================
        // ২. লাইভ ডেমো সিমুলেশন ইঞ্জিন (Live Demo Simulation Engine)
        // ==========================================================================
        // লাইভ ডেমো সিমুলেশন ফাংশন (যাতে এক ক্লিকেই যে কেউ লাইভ অ্যানিমেশন দেখতে পারে)
        // এই ফাংশনটি ডেমো অর্ডারের লাইভ ট্র্যাকিং অ্যানিমেশন (Processing, On The Way, Delivered) সিমুলেট করে
        function simulateDemoOrder(stage) {
            if (activeListener) {
                activeListener();
                activeListener = null;
            }

            const resultsContainer = document.getElementById('tracking-results');
            const trackInput = document.getElementById('track-input');
            
            let status = 'Processing';
            let orderId = '#SCENT-88410';
            if (stage === 'ontheway') {
                status = 'On The Way';
                orderId = '#SCENT-99234';
            } else if (stage === 'delivered') {
                status = 'Delivered';
                orderId = '#SCENT-77192';
            }

            if (trackInput) trackInput.value = orderId;

            const demoOrder = {
                orderId: orderId,
                date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                status: status,
                name: 'Tanvir Ahmed',
                phone: '+880 1712-345678',
                address: 'Road 11, House 24, Nikunjo 2, Khilkhet, Dhaka',
                paymentMethod: 'cod',
                items: [
                    {
                        title: 'Royal Amber Extract De Parfum (100ml)',
                        price: '৳ 3,850',
                        quantity: 1,
                        image: './images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg'
                    },
                    {
                        title: 'Pure Dehn Al Oud Cambodi (6ml)',
                        price: '৳ 2,400',
                        quantity: 1,
                        image: './images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg'
                    }
                ]
            };

            resultsContainer.innerHTML = '';
            renderOrderTrackingCard(demoOrder, resultsContainer);
        }

        // ==========================================================================
        // ৩. অর্ডার ট্র্যাকিং কার্ড ও লাইভ জার্নি রেন্ডারার (Tracking Card & 3D Journey)
        // ==========================================================================
        // অর্ডার কার্ড ও লাইভ হাই-টেক অ্যানিমেশন রেন্ডার করার ফাংশন
        // এই ফাংশনটি অর্ডারের লাইভ ট্র্যাকিং কার্ড, স্যাটেলাইট রুট প্রগ্রেস বার এবং অর্ডারের বিবরণ রেন্ডার করে
        function renderOrderTrackingCard(order, container) {
            let itemsHtml = '';
            let subtotal = 0;

            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    let cleanPrice = parseInt(String(item.price).replace(/[^\d]/g, '')) || 0;
                    let qty = item.quantity || 1;
                    let itemTotal = cleanPrice * qty;
                    subtotal += itemTotal;

                    let itemImg = item.image || (item.images && item.images[0]) || './images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg';

                    itemsHtml += `
                        <div class="flex items-center justify-between py-2 px-1 hover:bg-neutral-100/40 dark:hover:bg-neutral-800/40 rounded-lg transition-colors">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <div class="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                                    <img src="${itemImg}" class="w-full h-full object-contain" alt="${item.title}" onerror="this.onerror=null; this.src='./images/logo/Gemini_Generated_Image_jnlkx1jnlkx1jnlk.jpeg';">
                                </div>
                                <div class="min-w-0">
                                    <h4 class="font-semibold text-neutral-800 dark:text-neutral-200 text-xs truncate max-w-[210px] sm:max-w-sm">${item.title}</h4>
                                    <p class="text-[10px] text-neutral-400 font-medium">Qty: ${qty} × ৳${cleanPrice.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <span class="font-bold text-xs text-neutral-900 dark:text-white shrink-0 ml-2">৳${itemTotal.toLocaleString('en-IN')}</span>
                        </div>
                    `;
                });
            }

            let grandTotal = subtotal + 60; // ৬০ টাকা স্ট্যান্ডার্ড ডেলিভারি চার্জ

            // ========================================================
            // লাইভ পার্সেল জার্নি অ্যানিমেশন ও স্ট্যাটাস ক্যালকুলেশন
            // ========================================================
            let normStatus = (order.status || 'Processing').trim().toLowerCase();
            let progressPercent = 25;
            let vehicleIcon = "fa-box";
            let vehicleLabel = "Packaging";
            let isMoving = false;
            let routeStatusText = "Order Received & Packaging";
            let liveLocationNote = "SCENT Central Atelier (Dhaka) — Fragrance formulation safely sealed.";
            let estDeliveryText = "Est. 24-48 Hours";
            let stageTitle = "Packaging";
            let stageSubtitle = "Protective Pack";
            let statusBadgeClass = "bg-orange-50 text-[#F26522] border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60";

            let w1Style = "bg-gradient-to-br from-[#F26522] to-amber-500 text-white shadow-lg shadow-orange-500/40";
            let w2Style = "bg-stone-800 text-stone-500 border border-stone-700";
            let w3Style = "bg-stone-800 text-stone-500 border border-stone-700";
            let w4Style = "bg-stone-800 text-stone-500 border border-stone-700";

            if (normStatus === 'pending') {
                progressPercent = 14;
                vehicleIcon = "fa-clipboard-check";
                vehicleLabel = "Order Placed";
                isMoving = false;
                routeStatusText = "Order Placed & Confirmed";
                liveLocationNote = "Order received and confirmed. Preparing formulation at SCENT Atelier.";
                estDeliveryText = "2-3 Days";
                stageTitle = "Order Placed";
                stageSubtitle = "Confirmed";
                w1Style = "bg-gradient-to-br from-[#F26522] to-amber-500 text-white shadow-md animate-pulse-glow";
            } else if (normStatus === 'processing') {
                progressPercent = 42;
                vehicleIcon = "fa-box-open";
                vehicleLabel = "Packaging";
                isMoving = true;
                routeStatusText = "Packaging & Quality Inspection";
                liveLocationNote = "Fragrance passed quality inspection. Protective luxury packaging completed.";
                estDeliveryText = "24-48 Hours";
                stageTitle = "Packaging";
                stageSubtitle = "Quality Inspection";
                w1Style = "bg-emerald-500 text-white shadow-md";
                w2Style = "bg-gradient-to-br from-[#F26522] to-amber-500 text-white shadow-md animate-pulse-glow";
            } else if (normStatus === 'on the way' || normStatus === 'shipped') {
                progressPercent = 75;
                vehicleIcon = "fa-truck-fast";
                vehicleLabel = "On The Way";
                isMoving = true;
                routeStatusText = "On The Way to Destination";
                liveLocationNote = `Parcel is currently on the way heading towards: ${order.address || 'your destination'}.`;
                estDeliveryText = "Arriving Soon (Today)";
                stageTitle = "On The Way";
                stageSubtitle = "In Transit";
                statusBadgeClass = "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 font-bold";
                w1Style = "bg-emerald-500 text-white shadow-md";
                w2Style = "bg-emerald-500 text-white shadow-md";
                w3Style = "bg-gradient-to-br from-[#F26522] to-amber-500 text-white shadow-md animate-pulse-glow";
            } else if (normStatus === 'delivered') {
                progressPercent = 100;
                vehicleIcon = "fa-house-circle-check";
                vehicleLabel = "Delivered";
                isMoving = false;
                routeStatusText = "Delivered to Doorstep";
                liveLocationNote = `Parcel successfully delivered to ${order.name || 'recipient'}. Enjoy your luxury fragrance!`;
                estDeliveryText = "Delivered Successfully";
                stageTitle = "Delivered";
                stageSubtitle = "Handover Completed";
                statusBadgeClass = "bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 font-bold";
                w1Style = "bg-emerald-500 text-white shadow-md";
                w2Style = "bg-emerald-500 text-white shadow-md";
                w3Style = "bg-emerald-500 text-white shadow-md";
                w4Style = "bg-emerald-500 text-white shadow-xl shadow-emerald-500/50 animate-bounce";
            }

            const orderCard = document.createElement('div');
            orderCard.className = "bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-xs transition-all relative overflow-hidden";

            orderCard.innerHTML = `
                <!-- Confetti Container (For delivered celebration) -->
                <div id="confetti-holder" class="absolute inset-0 pointer-events-none overflow-hidden z-30"></div>

                <!-- Order Summary Header -->
                <div class="flex flex-wrap justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-4 gap-3">
                    <div class="flex items-center gap-2.5">
                        <span class="font-black text-[#F26522] bg-orange-50 dark:bg-orange-950/50 px-3.5 py-1.5 rounded-xl border border-orange-200/60 dark:border-orange-900/60 text-xs sm:text-sm shadow-2xs">
                            ${order.orderId}
                        </span>
                        <span class="text-neutral-500 dark:text-neutral-400 font-bold text-xs flex items-center gap-1">
                            <i class="fa-regular fa-calendar-check text-[#F26522]"></i> ${order.date || 'N/A'}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-extrabold px-3.5 py-1.5 rounded-full ${statusBadgeClass} text-xs flex items-center gap-1.5 shadow-2xs">
                            <span class="w-2 h-2 rounded-full ${normStatus === 'delivered' ? 'bg-emerald-500' : 'bg-orange-500 animate-ping'}"></span>
                            <span>Status: ${order.status || 'Processing'}</span>
                        </span>
                    </div>
                </div>

                <!-- ======================================================== -->
                <!-- হাই-টেক সাইবার স্যাটেলাইট রাডার ও লাইভ অ্যানিমেটেড জার্নি -->
                <!-- ======================================================== -->
                <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-slate-900 to-stone-900 text-white p-5 sm:p-7 border border-stone-800 shadow-2xl my-4">
                    <!-- Ambient Glow Light Orbs -->
                    <div class="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute -bottom-16 -right-16 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>

                    <!-- Radar Scanner Background Element -->
                    <div class="absolute right-4 top-4 w-16 h-16 rounded-full border border-amber-500/20 pointer-events-none hidden sm:flex items-center justify-center">
                        <div class="w-10 h-10 rounded-full border border-amber-500/30"></div>
                        <div class="w-full h-0.5 bg-gradient-to-r from-transparent to-amber-400/60 animate-radar-sweep absolute"></div>
                    </div>

                    <!-- Live Journey Bar Header -->
                    <div class="flex items-center justify-between mb-6 flex-wrap gap-2.5 relative z-10">
                        <div class="flex items-center gap-2.5">
                            <span class="relative flex h-3.5 w-3.5">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 shadow-md shadow-amber-500"></span>
                            </span>
                            <div>
                                <span class="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                                    <span>Realtime Parcel Journey</span>
                                    <span class="text-[9px] text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded-full border border-emerald-800/60 font-mono">LIVE TRACKING</span>
                                </span>
                            </div>
                        </div>
                        <span class="text-[11px] font-bold text-stone-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-sm">
                            <i class="fa-solid fa-route text-amber-400"></i> ${routeStatusText}
                        </span>
                    </div>

                    <!-- The 3D Highway Track Scene with Live Moving Product -->
                    <div class="relative py-10 sm:py-12 px-2 sm:px-6 my-2">
                        <!-- Highway Road Track Surface -->
                        <div class="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-5 bg-gradient-to-b from-stone-900 to-stone-950 rounded-full overflow-hidden border border-stone-700/80 shadow-2xl flex items-center">
                            <!-- Animated Highway Dual Dashes -->
                            <div class="w-full h-1 animated-road-stripes"></div>
                            <!-- Active Progress Fill Glow -->
                            <div class="absolute left-0 top-0 h-full bg-gradient-to-r from-[#F26522] via-orange-500 to-amber-400 rounded-full transition-all duration-1000 shadow-lg shadow-orange-500/60" style="width: ${progressPercent}%;"></div>
                        </div>

                        <!-- Animated Moving Delivery Vehicle & Floating Perfume Box -->
                        <div class="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 z-20 flex flex-col items-center" style="left: calc(clamp(6%, ${progressPercent}%, 92%) - 30px);">
                            <!-- Floating SCENT Perfume Parcel Box -->
                            <div class="mb-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#F26522] to-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-lg shadow-orange-500/50 whitespace-nowrap animate-float-parcel flex items-center gap-1.5 border border-white/40">
                                <i class="fa-solid fa-box text-[10px]"></i>
                                <span>${vehicleLabel}</span>
                                ${isMoving ? '<span class="text-[8px] bg-white/20 px-1 rounded font-mono">MOVING</span>' : ''}
                            </div>

                            <!-- Animated Delivery Vehicle (Van / Box Icon) -->
                            <div class="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-[#F26522] text-white flex items-center justify-center text-xl shadow-2xl shadow-orange-500/60 border-2 border-white/90 ${isMoving ? 'animate-vehicle-drive' : ''}">
                                <i class="fa-solid ${vehicleIcon}"></i>
                                <!-- Headlight Projector Beam -->
                                ${isMoving ? '<div class="headlight-beam-cone"></div>' : ''}
                            </div>
                        </div>

                        <!-- 4 Waypoint Stations -->
                        <div class="relative flex justify-between z-10">
                            <!-- 1. Order Confirmed -->
                            <div class="flex flex-col items-center text-center">
                                <div class="w-11 h-11 rounded-2xl ${w1Style} flex items-center justify-center text-base font-bold shadow-lg transition-all border border-white/20">
                                    <i class="fa-solid fa-clipboard-check"></i>
                                </div>
                                <span class="text-[11px] font-black mt-2 text-stone-200">Confirmed</span>
                                <span class="text-[9px] text-stone-400 font-medium">SCENT Atelier</span>
                            </div>

                            <!-- 2. Packaging & Quality -->
                            <div class="flex flex-col items-center text-center">
                                <div class="w-11 h-11 rounded-2xl ${w2Style} flex items-center justify-center text-base font-bold shadow-lg transition-all border border-white/10">
                                    <i class="fa-solid fa-box-open"></i>
                                </div>
                                <span class="text-[11px] font-black mt-2 text-stone-200">Packaging</span>
                                <span class="text-[9px] text-stone-400 font-medium">Quality Checked</span>
                            </div>

                            <!-- 3. In Transit (On The Way) -->
                            <div class="flex flex-col items-center text-center">
                                <div class="w-11 h-11 rounded-2xl ${w3Style} flex items-center justify-center text-base font-bold shadow-lg transition-all border border-white/10">
                                    <i class="fa-solid fa-truck-fast"></i>
                                </div>
                                <span class="text-[11px] font-black mt-2 text-stone-200">On The Way</span>
                                <span class="text-[9px] text-stone-400 font-medium">In Transit</span>
                            </div>

                            <!-- 4. Customer Destination Doorstep -->
                            <div class="flex flex-col items-center text-center">
                                <div class="w-11 h-11 rounded-2xl ${w4Style} flex items-center justify-center text-base font-bold shadow-lg transition-all border border-white/10">
                                    <i class="fa-solid fa-house-chimney-user"></i>
                                </div>
                                <span class="text-[11px] font-black mt-2 text-stone-200">Delivered</span>
                                <span class="text-[9px] text-stone-400 font-medium">Your Doorstep</span>
                            </div>
                        </div>
                    </div>

                    <!-- ======================================================== -->
                    <!-- লাইভ ট্র্যাকিং স্ট্যাটাস ও ডেলিভারি বিবরণী -->
                    <!-- ======================================================== -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-2 border-t border-stone-800/80 text-left">
                        <!-- Current Stage -->
                        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                            <span class="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                                <i class="fa-solid fa-circle-dot text-amber-400"></i> Stage
                            </span>
                            <span class="text-sm font-black text-white mt-1">${stageTitle}</span>
                            <span class="text-[9px] text-stone-400 font-medium">${stageSubtitle}</span>
                        </div>

                        <!-- Estimated Arrival -->
                        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                            <span class="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                                <i class="fa-regular fa-clock text-emerald-400"></i> Est. Delivery
                            </span>
                            <span class="text-sm font-black text-emerald-400 mt-1">${estDeliveryText}</span>
                            <span class="text-[9px] text-stone-400 font-medium">Express Dispatch</span>
                        </div>

                        <!-- Package Protection -->
                        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                            <span class="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                                <i class="fa-solid fa-shield-heart text-sky-400"></i> Protection
                            </span>
                            <span class="text-sm font-black text-sky-300 mt-1">Luxury Sealed</span>
                            <span class="text-[9px] text-stone-400 font-medium">Tamper-Proof Box</span>
                        </div>

                        <!-- Shipping Destination Area -->
                        <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
                            <span class="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                                <i class="fa-solid fa-location-dot text-[#F26522]"></i> Delivery To
                            </span>
                            <span class="text-sm font-black text-white mt-1 truncate" title="${order.address || 'Doorstep'}">${order.address ? (order.address.length > 18 ? order.address.substring(0, 16) + '...' : order.address) : 'Your Doorstep'}</span>
                            <span class="text-[9px] text-stone-400 font-medium">Doorstep Handover</span>
                        </div>
                    </div>

                    <!-- Live Location Ticker -->
                    <div class="mt-3.5 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-xs text-stone-300 gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span class="text-[11px] font-semibold text-stone-200">${liveLocationNote}</span>
                        </div>
                        <button type="button" onclick="replayOrderAnimation(this, ${progressPercent})" class="text-[10px] text-amber-400 hover:text-white font-bold uppercase tracking-wider bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-400/30 transition flex items-center gap-1 cursor-pointer">
                            <i class="fa-solid fa-rotate-right text-[9px]"></i> Replay Journey
                        </button>
                    </div>
                </div>



                <!-- কাস্টমার লোকেশন ও অর্ডার বিস্তারিত -->
                <div class="bg-neutral-50/70 dark:bg-neutral-800/40 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 space-y-2.5">
                    <p class="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                        <i class="fa-solid fa-location-dot text-[#F26522]"></i> Customer & Shipping Details:
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-300">
                        <p><strong class="text-neutral-800 dark:text-white">Customer Name:</strong> ${order.name}</p>
                        <p><strong class="text-neutral-800 dark:text-white">Phone:</strong> ${order.phone}</p>
                        <p class="sm:col-span-2"><strong class="text-neutral-800 dark:text-white">Delivery Address:</strong> ${order.address}</p>
                        <p class="sm:col-span-2"><strong class="text-neutral-800 dark:text-white">Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Verified)'}</p>
                    </div>
                </div>

                <!-- প্রোডাক্টের সংক্ষিপ্ত তালিকা (Compact Items) -->
                <div class="bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl p-3.5 border border-neutral-200/70 dark:border-neutral-700/70">
                    <div class="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60 mb-1">
                        <span class="font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <i class="fa-solid fa-bag-shopping text-amber-500"></i> Ordered Items (${order.items ? order.items.length : 1})
                        </span>
                        <span class="text-[10px] font-medium text-neutral-400">Incl. ৳60 Delivery</span>
                    </div>
                    <div class="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                        ${itemsHtml}
                    </div>
                    <div class="flex justify-between items-center pt-2.5 mt-1 border-t border-neutral-200/60 dark:border-neutral-700/60 font-bold text-xs">
                        <span class="text-neutral-600 dark:text-neutral-400">Total Payable:</span>
                        <span class="text-[#F26522] font-black text-sm">৳${grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            `;

            container.appendChild(orderCard);

            // যদি স্ট্যাটাস Delivered হয়, কনফেটি সেলিব্রেশন ফায়ার করা
            if (normStatus === 'delivered') {
                const confettiHolder = orderCard.querySelector('#confetti-holder');
                triggerDeliveryConfetti(confettiHolder);
            }
        }

        // ==========================================================================
        // ৪. অ্যানিমেশন রি-প্লে কন্ট্রোলার (Replay Animation Controller)
        // ==========================================================================
        // অ্যানিমেশন রি-প্লে করার ফাংশন
        // এই ফাংশনটি ডেলিভারি ভেহিকল এবং প্রগ্রেস ট্রানজিট অ্যানিমেশন শুরু থেকে পুনরায় প্লে করে
        function replayOrderAnimation(btn, targetPercent) {
            const card = btn.closest('.relative');
            if (!card) return;
            const progressFill = card.querySelector('.bg-gradient-to-r');
            const vehicle = card.querySelector('.z-20');
            if (progressFill && vehicle) {
                progressFill.style.transition = 'none';
                vehicle.style.transition = 'none';
                progressFill.style.width = '6%';
                vehicle.style.left = 'calc(6% - 30px)';

                setTimeout(() => {
                    progressFill.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    vehicle.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    progressFill.style.width = targetPercent + '%';
                    vehicle.style.left = `calc(clamp(6%, ${targetPercent}%, 92%) - 30px)`;
                }, 100);
            }
        }

        // ==========================================================================
        // ৫. রিয়েল-টাইম অর্ডার সার্চ ও ফায়ারবেস লিসেনার (Realtime Orders Listener)
        // ==========================================================================
        // এই ফাংশনটি অর্ডার আইডি বা কাস্টমার ফোন নম্বর দিয়ে ফায়ারস্টোর থেকে রিয়েল-টাইমে অর্ডারের তথ্য অনুসন্ধান করে
        function searchOrders() {
            let inputVal = document.getElementById('track-input').value.trim();
            const resultsContainer = document.getElementById('tracking-results');

            if (!inputVal) {
                alert("Please enter an order ID or phone number.");
                return;
            }

            // যদি আগে থেকে কোনো রিয়েল-টাইম লিসেনার চালু থাকে, তবে তা বন্ধ করে দেওয়া
            if (activeListener) {
                activeListener();
            }

            resultsContainer.innerHTML = `
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center shadow-sm">
                    <div class="inline-flex items-center gap-2.5 text-xs text-[#F26522] font-black">
                        <i class="fa-solid fa-satellite fa-spin text-base"></i>
                        <span>Connecting to Realtime Satellite Tracking System...</span>
                    </div>
                </div>
            `;

            const db = firebase.firestore();

            // ফায়ারবেজ থেকে রিয়েল-টাইমে ডেটা আনার জন্য onSnapshot ব্যবহার করা হলো
            activeListener = db.collection("orders")
                .onSnapshot((snapshot) => {
                    let matchedOrders = [];

                    const cleanInput = inputVal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    const inputPhoneClean = inputVal.replace(/[^0-9]/g, "");

                    snapshot.forEach((doc) => {
                        let order = doc.data();
                        const orderClean = (order.orderId || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        const docClean = (doc.id || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

                        const orderIdMatch = (cleanInput.length > 0 && (orderClean === cleanInput || docClean === cleanInput)) ||
                                             (order.orderId && order.orderId.toLowerCase() === inputVal.toLowerCase());

                        const orderPhoneClean = String(order.phone || "").replace(/[^0-9]/g, "");
                        const phoneMatch = inputPhoneClean.length >= 7 && (
                            orderPhoneClean === inputPhoneClean ||
                            (inputPhoneClean.length >= 10 && orderPhoneClean.endsWith(inputPhoneClean.slice(-10))) ||
                            (orderPhoneClean.length >= 10 && inputPhoneClean.endsWith(orderPhoneClean.slice(-10)))
                        );

                        if (orderIdMatch || phoneMatch) {
                            matchedOrders.push({
                                firestoreId: doc.id,
                                ...order
                            });
                        }
                    });

                    resultsContainer.innerHTML = "";

                    if (matchedOrders.length === 0) {
                        resultsContainer.innerHTML = `
                            <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center shadow-sm">
                                <div class="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 text-lg">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                </div>
                                <p class="text-sm text-neutral-700 dark:text-neutral-200 font-bold">No orders found with this information!</p>
                                <p class="text-xs text-neutral-400 mt-1">Please double-check your Order ID or phone number and try again.</p>
                            </div>
                        `;
                        return;
                    }

                    matchedOrders.forEach((order) => {
                        renderOrderTrackingCard(order, resultsContainer);
                    });
                }, (error) => {
                    console.error("Error fetching real-time orders: ", error);
                });
        }

        // ==========================================================================
        // ৬. পেজ লোড ও অটো-সার্চ ইনিশিয়ালাইজার (DOM & URL Auto-Search Handler)
        // ==========================================================================
        // পেজ লোড হলে URL থেকে যদি id বা orderId আসে তবে স্বয়ংক্রিয়ভাবে সার্চ করা
        window.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const orderIdParam = urlParams.get('id') || urlParams.get('orderId');
            if (orderIdParam) {
                const input = document.getElementById('track-input');
                if (input) {
                    input.value = orderIdParam;
                    searchOrders();
                }
            }
        });