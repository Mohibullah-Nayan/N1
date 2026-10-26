/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN ORDERS & DASHBOARD MODULE (js/admin-dashboard.js)
   --------------------------------------------------------------------------
   - Real-time Orders Listener, KPI Metrics & Order Table Renderer
   - Order Status Transition (Processing -> On The Way -> Delivered)
   - Date Range Filter (Today, Yesterday, Last 7 Days, Month, Custom)
   - Customer Order History Search by Phone or Email
   ========================================================================== */

import { db } from './admin.js';
import { collection, addDoc, setDoc, getDocs, getDoc, query, deleteDoc, doc, serverTimestamp, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    // ==========================================================================
    // ৮. অ্যাডমিন ড্যাশবোর্ড ও রিয়েল-টাইম অর্ডার ইঞ্জিন (Orders Real-time Engine)
    // ==========================================================================
    // এই ফাংশনটি ড্যাশবোর্ডের মোট বিক্রি, মোট অর্ডার, রিয়েল-টাইম অর্ডার টেবিল ও রেভিনিউ কেপিআই কার্ড লোড করে
    window.loadAdminDashboardData = function(filteredOrders = null) {
        const ordersRef = collection(db, "orders");
        
        onSnapshot(ordersRef, (snapshot) => {
            let allOrdersForStats = [];
            snapshot.forEach((docSnap) => {
                let orderData = docSnap.data();
                orderData.firebaseId = docSnap.id;
                allOrdersForStats.push(orderData);
            });

            window.allOrdersCache = allOrdersForStats;

            allOrdersForStats.sort((a, b) => {
                let timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                let timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            });

            let orders = filteredOrders || allOrdersForStats;
            
            let todayStr = new Date().toLocaleDateString();
            let now = new Date();
            let currentDay = String(now.getDate());
            let currentMonth = String(now.getMonth() + 1);
            let currentYear = String(now.getFullYear());

            let todaySales = 0;
            let totalSales = 0;
            let productSalesCount = {};

            allOrdersForStats.forEach(order => {
                let cleanTotal = 0;
                if (typeof order.totalAmount === 'number') {
                    cleanTotal = order.totalAmount;
                } else if (order.totalAmount) {
                    cleanTotal = parseInt(String(order.totalAmount).replace(/[^\d]/g, '')) || 0;
                } else if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(it => {
                        let price = parseInt(String(it.price || 0).replace(/[^\d]/g, '')) || 0;
                        let qty = parseInt(it.quantity) || 1;
                        cleanTotal += (price * qty);
                    });
                }

                totalSales += cleanTotal;

                let isToday = false;
                
                if (order.createdAt) {
                    let orderDateObj = new Date(order.createdAt);
                    if (orderDateObj.toDateString() === now.toDateString()) {
                        isToday = true;
                    }
                }
                
                if (!isToday && order.date) {
                    let dStr = String(order.date).trim();
                    if (
                        dStr === todayStr || 
                        dStr.includes(currentYear) && dStr.includes(currentDay) && (dStr.includes(currentMonth) || dStr.includes(now.toLocaleString('default', { month: 'short' }))) ||
                        dStr.includes(now.toISOString().split('T')[0])
                    ) {
                        isToday = true;
                    }
                }

                if (!isToday && (!order.date && !order.createdAt)) {
                    isToday = true; 
                }

                if (isToday) {
                    todaySales += cleanTotal;
                }

                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        let pTitle = item.title;
                        let qty = parseInt(item.quantity) || 1;
                        if (productSalesCount[pTitle]) {
                            productSalesCount[pTitle] += qty;
                        } else {
                            productSalesCount[pTitle] = qty;
                        }
                    });
                }
            });

            // গ্লোবাল সেলস ম্যাপ আপডেট করা (যাতে প্রোডাক্ট ইনভেন্টরি টেবিলে বিক্রি সংখ্যা রিয়েলটাইমে প্রদর্শিত হয়)
            window.globalProductSalesCount = productSalesCount;
            if (typeof filterAdminProductsTable === 'function' && window.cachedAdminProducts && window.cachedAdminProducts.length > 0) {
                const searchInput = document.getElementById('admin-product-search-input');
                filterAdminProductsTable(searchInput ? searchInput.value : '');
            }

            const todaySalesElem = document.getElementById('today-sales');
            const totalSalesElem = document.getElementById('total-sales');
            const totalOrdersElem = document.getElementById('total-orders-count');
            
            if (todaySalesElem) todaySalesElem.innerText = '৳' + todaySales.toLocaleString('en-IN');
            if (totalSalesElem) totalSalesElem.innerText = '৳' + totalSales.toLocaleString('en-IN');
            if (totalOrdersElem) totalOrdersElem.innerText = allOrdersForStats.length;

            // প্রোডাক্ট সেলস ও ইনভেন্টরি ব্রেকডাউন রেন্ডার করার ফাংশন
            window.renderProductSalesBreakdown = function(salesCountMap = null) {
                let statsContainer = document.getElementById('product-sales-stats');
                if (!statsContainer) return;
                let activeSalesMap = salesCountMap || window.globalProductSalesCount || productSalesCount || {};
                statsContainer.innerHTML = '';

                // সকল ক্যাটালগ প্রোডাক্ট এবং সেলস ডেটা একত্রিত করা
                let catalogProducts = (window.cachedAdminProducts || []).filter(p => {
                    const isBanner = p.isBanner || p.isHeroBanner || (p.homeSection && (p.homeSection.startsWith('slider-') || p.homeSection === 'side-banner'));
                    return !isBanner;
                });

                let combinedMap = {};

                // ক্যাটালগের প্রোডাক্টগুলো যুক্ত করা
                catalogProducts.forEach(p => {
                    let title = p.title || 'Perfume';
                    let rawStock = (p.stock !== undefined && p.stock !== null && p.stock !== '') ? parseInt(p.stock) : null;
                    combinedMap[title] = {
                        title: title,
                        stock: rawStock,
                        sold: 0,
                        image: p.image || (p.images && p.images[0]) || ''
                    };
                });

                // সেলস ডেটা ম্যাচ করা
                for (let [title, qty] of Object.entries(productSalesCount)) {
                    let matched = false;
                    let titleClean = String(title).trim().toLowerCase();
                    for (let cTitle of Object.keys(combinedMap)) {
                        let cTitleClean = String(cTitle).trim().toLowerCase();
                        if (cTitleClean === titleClean || cTitleClean.includes(titleClean) || titleClean.includes(cTitleClean)) {
                            combinedMap[cTitle].sold += qty;
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        combinedMap[title] = {
                            title: title,
                            stock: null,
                            sold: qty,
                            image: ''
                        };
                    }
                }

                let itemsList = Object.values(combinedMap);
                // যে প্রোডাক্ট শেষ হয়ে যাবে (০ পিস) বা ১০ বা তার কম স্টক থাকবে সেগুলো সবার প্রথমে শো করবে
                itemsList.sort((a, b) => {
                    const getPriority = (item) => {
                        if (item.stock !== null && !isNaN(item.stock)) {
                            if (item.stock <= 0) return 0; // স্টক শেষ / Out of Stock (সবার শীর্ষে)
                            if (item.stock <= 10) return 1; // ১০ বা তার কম স্টক (লো-স্টক অগ্রাধিকার)
                            return 2; // স্টক পর্যাপ্ত (> ১০)
                        }
                        return 3; // স্টক সেট করা হয়নি
                    };

                    const prioA = getPriority(a);
                    const prioB = getPriority(b);

                    if (prioA !== prioB) {
                        return prioA - prioB;
                    }

                    // শেষ হতে চলা বা লো-স্টক প্রোডাক্টগুলোর মধ্যে সবচেয়ে কম স্টক আগে আসবে
                    if (prioA <= 1) {
                        return (a.stock || 0) - (b.stock || 0);
                    }

                    // পর্যাপ্ত স্টক থাকা প্রোডাক্টগুলোর মধ্যে বেশি বিক্রি হওয়াটি আগে আসবে
                    return b.sold - a.sold;
                });

                if (itemsList.length === 0) {
                    statsContainer.innerHTML = '<p class="text-slate-400 font-medium text-sm">No inventory or sales data available yet.</p>';
                } else {
                    itemsList.forEach(item => {
                        let stockBadge = '';
                        let cardBg = 'bg-gradient-to-r from-slate-50 via-white to-purple-50/20 border-slate-200';

                        if (item.stock === null || isNaN(item.stock)) {
                            stockBadge = '<span class="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">Stock not set</span>';
                        } else if (item.stock <= 0) {
                            stockBadge = `<span class="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-circle-xmark text-rose-600 text-[10px]"></i> ❌ Out of Stock</span>`;
                            cardBg = 'bg-gradient-to-r from-rose-50/70 via-white to-rose-50/30 border-rose-300 ring-1 ring-rose-400/20';
                        } else if (item.stock <= 10) {
                            stockBadge = `<span class="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 animate-pulse shadow-2xs"><i class="fa-solid fa-triangle-exclamation text-amber-600 text-[10px]"></i> ⚠️ Low: Only ${item.stock} left!</span>`;
                            cardBg = 'bg-gradient-to-r from-amber-50/70 via-white to-orange-50/30 border-amber-300 ring-1 ring-amber-400/20';
                        } else {
                            stockBadge = `<span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ${item.stock} in stock</span>`;
                        }

                        statsContainer.innerHTML += `
                            <div class="${cardBg} p-4 rounded-2xl border shadow-xs flex justify-between items-center hover:shadow-md hover:border-purple-500/40 hover:-translate-y-0.5 transition-all group">
                                <div class="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                    <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center text-sm group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0 overflow-hidden">
                                        ${item.image ? `<img src="${item.image}" alt="Fragrance" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fa-solid fa-bottle-droplet\\'></i>';">` : `<i class="fa-solid fa-bottle-droplet"></i>`}
                                    </div>
                                    <div class="min-w-0">
                                        <span class="font-bold text-slate-800 text-sm block truncate" title="${item.title}">${item.title}</span>
                                        <div class="mt-1 flex items-center gap-1.5">
                                            ${stockBadge}
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right shrink-0">
                                    <span class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-xl font-black text-xs shadow-sm shadow-purple-500/25 block">
                                        Sold: ${item.sold} pcs
                                    </span>
                                </div>
                            </div>
                        `;
                    });
                }
            };

            // ইনিশিয়াল ব্রেকডাউন রেন্ডার
            window.renderProductSalesBreakdown(productSalesCount);

            // অর্ডার টেবিল রেন্ডার
            let tableBody = document.getElementById('admin-orders-table');
            if (tableBody) {
                tableBody.innerHTML = '';
                if (orders.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-medium"><i class="fa-solid fa-cart-shopping text-3xl mb-2 block opacity-40"></i> কোনো অর্ডার পাওয়া যায়নি।</td></tr>`;
                    return;
                }

                orders.forEach((order) => {
                    let itemsHtml = '';
                    if(order.items) {
                        order.items.forEach(it => {
                            itemsHtml += `<div class="text-xs text-slate-600 font-medium flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>${it.title} <span class="font-bold text-slate-800">(${it.quantity} pcs)</span></div>`;
                        });
                    }

                    let currentStatus = order.status || 'Processing';
                    let customerEmail = order.userEmail || order.email || 'N/A (Guest/Not Logged In)';
                    let paymentInfo = order.paymentMethod ? `<span class="inline-flex items-center gap-1 font-bold text-slate-900 text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">${order.paymentMethod}</span><br><span class="text-[11px] text-slate-500 font-mono mt-1 inline-block">TrxID: ${order.trxId || order.transactionId || 'N/A'}</span>` : '<span class="text-slate-400 text-xs italic">Cash on Delivery</span>';

                    let statusBadgeClasses = {
                        'Processing': 'bg-amber-50 text-amber-700 border-amber-200/80',
                        'On The Way': 'bg-blue-50 text-blue-700 border-blue-200/80',
                        'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                        'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200/80'
                    }[currentStatus] || 'bg-slate-50 text-slate-700 border-slate-200';

                    tableBody.innerHTML += `
                        <tr class="hover:bg-slate-50/90 transition-colors border-b border-slate-100 group">
                            <td class="p-3.5">
                                <span class="inline-flex items-center gap-1 font-black text-[#F26522] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-md text-xs font-mono">
                                    ${order.orderId || 'N/A'}
                                </span><br>
                                <span class="text-[11px] text-slate-400 font-medium mt-1 inline-flex items-center gap-1"><i class="fa-regular fa-clock text-[9px]"></i>${order.date || 'N/A'}</span>
                            </td>
                            <td class="p-3.5">
                                <p class="font-bold text-slate-900 text-sm">${order.name || 'N/A'}</p>
                                <p class="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5"><i class="fa-solid fa-phone text-[9px] text-slate-400"></i>${order.phone || 'N/A'}</p>
                                <p class="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5"><i class="fa-solid fa-envelope text-[9px]"></i>${customerEmail}</p>
                                <p class="text-xs text-slate-500 truncate max-w-[170px] mt-0.5" title="${order.address || ''}"><i class="fa-solid fa-location-dot text-[9px] text-slate-400 mr-1"></i>${order.address || ''}</p>
                            </td>
                            <td class="p-3.5">${paymentInfo}</td>
                            <td class="p-3.5 space-y-1">${itemsHtml}</td>
                            <td class="p-3.5 font-black text-slate-900 text-sm">${order.totalAmount || '৳0'}</td>
                            <td class="p-3.5">
                                <select onchange="event.stopPropagation(); updateOrderStatus('${order.firebaseId}', this.value, this)" data-order-id="${order.firebaseId}" class="order-status-select border border-slate-200 bg-white p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-[#F26522] shadow-2xs cursor-pointer transition-all ${statusBadgeClasses}">
                                    <option value="Processing" ${currentStatus === 'Processing' ? 'selected' : ''}>⏳ Processing</option>
                                    <option value="On The Way" ${currentStatus === 'On The Way' ? 'selected' : ''}>🚚 On The Way</option>
                                    <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                                    <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                                </select>
                                <div class="flex items-center gap-1.5 mt-2">
                                    <button onclick="event.stopPropagation(); window.printOrderInvoice('${order.orderId || order.firebaseId}')" class="px-2 py-1 bg-orange-50 hover:bg-[#F26522] text-[#F26522] hover:text-white border border-orange-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer" title="Print Invoice">
                                        <i class="fa-solid fa-print"></i> Invoice
                                    </button>
                                    <button onclick="event.stopPropagation(); window.updateCourierTracking('${order.firebaseId}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer" title="Assign Courier & Tracking ID">
                                        <i class="fa-solid fa-truck-fast text-[#F26522]"></i> Courier
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }

            // রিয়েল-টাইম গ্রাফ আপডেট করা (Live Analysis Charts Update)
            updateRealtimeCharts(allOrdersForStats);
        });

        // ফায়ারবেসের 'carts' কালেকশন থেকে রিয়েলটাইমে Active Carts কাউন্ট করা
        const cartsRef = collection(db, "carts");
        onSnapshot(cartsRef, (cartSnapshot) => {
            let totalCartItems = 0;
            cartSnapshot.forEach((docSnap) => {
                let cartData = docSnap.data();
                let items = cartData.items || cartData.products || cartData.cartItems || [];
                if (Array.isArray(items)) {
                    items.forEach(ci => {
                        let q = parseInt(ci.quantity || ci.qty || ci.count) || 1;
                        totalCartItems += q;
                    });
                } else if (cartData.quantity || cartData.qty) {
                    totalCartItems += parseInt(cartData.quantity || cartData.qty) || 1;
                }
            });

            const cartItemsElem = document.getElementById('cart-items-count');
            if (cartItemsElem) {
                cartItemsElem.innerText = totalCartItems;
            }
        });
    }


    // ==========================================================================
    // ৯. অর্ডার স্ট্যাটাস ও ডেট ফিল্টারিং (Order Status & Date Range Filter)
    // ==========================================================================
    // কাস্টমার সার্চ সামারি কার্ড রিয়েলটাইমে রিফ্রেশ করার ফাংশন
    // এই ফাংশনটি কাস্টমার সার্চ সেকশনের সামারি স্ট্যাটাস রিফ্রেশ করে
    function refreshCustomerSearchStats() {
        const selects = document.querySelectorAll('#customer-history-tbody select.order-status-select');
        if (selects.length === 0) return;

        let total = selects.length;
        let processing = 0;
        let delivered = 0;
        let cancelled = 0;

        selects.forEach(sel => {
            let val = sel.value;
            if (val === 'Delivered') delivered++;
            else if (val === 'Cancelled') cancelled++;
            else processing++;
        });

        const setElemText = (id, text) => {
            let el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        setElemText('cust-stat-total', total);
        setElemText('cust-stat-processing', processing);
        setElemText('cust-stat-delivered', delivered);
        setElemText('cust-stat-cancelled', cancelled);
    }

    // অর্ডার স্ট্যাটাস আপডেট করার ফাংশন (Search Customer ও Order Management দুই জায়গা থেকেই রিয়েলটাইমে কার্যকর)
    // এই ফাংশনটি অর্ডারের ডেলিভারি স্ট্যাটাস (Processing/Delivered) পরিবর্তন করে ডাটাবেসে সেভ করে
    window.updateOrderStatus = async function(firebaseId, newStatus, selectElement) {
        if (!firebaseId) {
            alert("Order ID not found for status update.");
            return;
        }

        const badgeClassMap = {
            'Processing': 'bg-amber-50 text-amber-700 border-amber-200/80',
            'On The Way': 'bg-blue-50 text-blue-700 border-blue-200/80',
            'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200/80'
        };

        const matchingSelects = document.querySelectorAll(`select[data-order-id="${firebaseId}"]`);
        matchingSelects.forEach(sel => {
            sel.disabled = true;
            sel.style.opacity = '0.6';
        });

        try {
            const orderRef = doc(db, "orders", firebaseId);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            const newBadgeClasses = badgeClassMap[newStatus] || 'bg-slate-50 text-slate-700 border-slate-200';
            matchingSelects.forEach(sel => {
                sel.value = newStatus;
                sel.disabled = false;
                sel.style.opacity = '1';
                sel.className = `order-status-select border p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-[#F26522] shadow-2xs cursor-pointer transition-all ${newBadgeClasses}`;
            });

            // কাস্টমার সার্চ সেকশনের কাউন্টার রিয়েলটাইমে আপডেট
            refreshCustomerSearchStats();

            // লাইভ ফিডব্যাক টোস্ট নোটিফিকেশন
            let toast = document.getElementById('admin-status-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'admin-status-toast';
                toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700 transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
                document.body.appendChild(toast);
            }
            toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i> <span>Order status updated to "${newStatus}"</span>`;
            toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
            setTimeout(() => {
                toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
            }, 2500);

        } catch (error) {
            matchingSelects.forEach(sel => {
                sel.disabled = false;
                sel.style.opacity = '1';
            });
            console.error("Error updating status: ", error);
            alert("Failed to update status: " + error.message);
        }
    }

    // এই ফাংশনটি তারিখের রেঞ্জ অনুযায়ী নির্দিষ্ট সময়ের অর্ডারের তালিকা ফিল্টার করে
    window.filterOrdersByDate = function() {
        let startDateVal = document.getElementById('filter-start-date').value;
        let endDateVal = document.getElementById('filter-end-date').value;

        if (!startDateVal && !endDateVal) {
            alert('Please select at least one date.');
            return;
        }

        let orders = window.allOrdersCache || [];
        
        let filtered = orders.filter(order => {
            if (!order.date) return false;
            
            let parts = order.date.split('/');
            if (parts.length !== 3) return false;
            
            let day = parts[0].padStart(2, '0');
            let month = parts[1].padStart(2, '0');
            let year = parts[2];
            
            let orderDateObj = new Date(`${year}-${month}-${day}`);
            if (isNaN(orderDateObj.getTime())) {
                orderDateObj = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
            }
            
            if (isNaN(orderDateObj.getTime())) return false;

            let start = startDateVal ? new Date(startDateVal) : null;
            let end = endDateVal ? new Date(endDateVal) : null;

            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            orderDateObj.setHours(0, 0, 0, 0);

            if (start && end) {
                return orderDateObj >= start && orderDateObj <= end;
            } else if (start) {
                return orderDateObj >= start;
            } else if (end) {
                return orderDateObj <= end;
            }
            return true;
        });

        loadAdminDashboardData(filtered);
    }

    // এই ফাংশনটি তারিখের ফিল্টার রিসেট করে সব অর্ডারের তালিকা দেখায়
    window.resetDateFilter = function() {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        loadAdminDashboardData();
    }


    // ==========================================================================
    // ১০. কাস্টমার সার্চ ও অর্ডার হিস্ট্রি ইঞ্জিন (Customer History Engine)
    // ==========================================================================
    // এই ফাংশনটি কাস্টমারের ফোন বা ইমেইল দিয়ে পূর্ববর্তী অর্ডারের ইতিহাস সার্চ করে ড্যাশবোর্ডে দেখায়
    window.searchCustomerHistory = async function() {
        let searchInput = document.getElementById('customer-search-input');
        let resultContainer = document.getElementById('search-result-container');
        
        if (!searchInput || !resultContainer) {
            console.error("Search input or result container element not found!");
            return;
        }

        let queryText = searchInput.value.trim().toLowerCase();
        let cleanQueryDigits = queryText.replace(/\D/g, ''); 
        
        if (!queryText) {
            alert('Please enter phone, email, name, or order ID.');
            resultContainer.classList.add('hidden');
            return;
        }

        let orders = [];
        let usersMap = {};
        let matchedUserIds = new Set();

        try {
            let usersSnapshot = await getDocs(collection(db, "users"));
            usersSnapshot.forEach((docSnap) => {
                let uData = docSnap.data();
                let uId = docSnap.id;
                usersMap[uId] = uData;

                let fullUserString = JSON.stringify(uData).toLowerCase();
                let uPhone = String(uData.phone || uData.phoneNumber || uData.mobile || '').replace(/\D/g, '');
                let uEmail = String(uData.email || '').trim().toLowerCase();
                let uName = String(uData.fullName || uData.name || '').trim().toLowerCase();

                let matchPhone = (cleanQueryDigits.length >= 4 && (uPhone.includes(cleanQueryDigits) || fullUserString.includes(cleanQueryDigits)));
                let matchEmail = (uEmail && uEmail.includes(queryText));
                let matchName = (uName && uName.includes(queryText));

                if (matchPhone || matchEmail || matchName) {
                    matchedUserIds.add(uId);
                    if (uData.uid) matchedUserIds.add(uData.uid);
                }
            });

            let querySnapshot = await getDocs(collection(db, "orders"));
            querySnapshot.forEach((docSnap) => {
                let data = docSnap.data();
                data.firebaseId = docSnap.id;
                orders.push(data);
            });

        } catch (e) {
            console.error("Firebase fetch error:", e);
            alert("Firebase Error: " + e.message);
            return;
        }

        let matchedOrders = orders.filter(o => {
            let fullOrderString = JSON.stringify(o).toLowerCase();
            
            let firebaseId = String(o.firebaseId || '').trim().toLowerCase();
            let customOrderId = String(o.orderId || o.id || '').trim().toLowerCase();
            let orderEmail = String(o.userEmail || o.email || '').trim().toLowerCase();
            let orderUserId = String(o.userId || '').trim();

            let matchId = firebaseId.includes(queryText.replace('#', '').trim()) || customOrderId.includes(queryText.replace('#', '').trim());
            let matchEmail = orderEmail.includes(queryText);
            let matchUser = matchedUserIds.has(orderUserId);
            let matchFullOrderDigits = (cleanQueryDigits.length >= 4 && fullOrderString.includes(cleanQueryDigits));

            return matchId || matchEmail || matchUser || matchFullOrderDigits;
        });

        if (matchedOrders.length === 0) {
            alert('No orders found matching: "' + queryText + '". Please check if this phone number or email exists in Firebase database.');
            resultContainer.classList.add('hidden');
            return;
        }

        resultContainer.classList.remove('hidden');

        let totalOrders = matchedOrders.length;
        let processingCount = 0;
        let deliveredCount = 0;
        let cancelledCount = 0;
        let cartCount = 0;

        matchedOrders.forEach(o => {
            let st = String(o.status || 'Processing').toLowerCase();
            if (st.includes('process') || st.includes('way') || st.includes('on the way')) processingCount++;
            else if (st.includes('deliver')) deliveredCount++;
            else if (st.includes('cancel')) cancelledCount++;
        });

        const setElemText = (id, text) => {
            let el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        setElemText('cust-stat-total', totalOrders);
        setElemText('cust-stat-cart', cartCount);
        setElemText('cust-stat-processing', processingCount);
        setElemText('cust-stat-delivered', deliveredCount);
        setElemText('cust-stat-cancelled', cancelledCount);
        setElemText('customer-profile-title', `Search results for "${queryText}" (${totalOrders} items):`);

        let historyTbody = document.getElementById('customer-history-tbody');
        if (historyTbody) {
            historyTbody.innerHTML = '';

            matchedOrders.slice().reverse().forEach(order => {
                let itemsHtml = '';
                let orderItems = order.items || order.products || order.cart || [];
                if(Array.isArray(orderItems)) {
                    orderItems.forEach(it => {
                        itemsHtml += `<div class="text-[11px] text-slate-600 font-medium">• ${it.title || it.name || it.productName || 'Product'} (${it.quantity || it.qty || 1} pieces)</div>`;
                    });
                }

                let uInfo = usersMap[order.userId] || {};
                let customerEmail = order.userEmail || order.email || uInfo.email || 'N/A';
                let customerName = order.name || order.customerName || uInfo.fullName || uInfo.name || 'Valued Customer';
                let customerPhone = order.phone || order.phoneNumber || uInfo.phone || uInfo.phoneNumber || 'N/A';
                let customerAddress = order.address || order.shippingAddress || uInfo.shippingAddress || uInfo.address || 'N/A';
                
                let orderIdShow = order.firebaseId || order.orderId || 'N/A';
                
                let rawTotal = order.totalAmount || order.total || order.amount || order.grandTotal || '0';
                if ((!rawTotal || rawTotal === '0' || rawTotal === 0) && Array.isArray(orderItems) && orderItems.length > 0) {
                    let calcTotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (parseInt(item.quantity || item.qty || 1))), 0);
                    if (calcTotal > 0) rawTotal = calcTotal;
                }
                let totalAmt = String(rawTotal).startsWith('৳') ? rawTotal : '৳' + rawTotal;

                let paymentMethod = order.paymentMethod || order.method || 'Cash on Delivery';
                let trxId = order.trxId || order.transactionId || order.trxID || '';
                
                let paymentInfo = trxId ? `<span class="font-bold text-slate-900">${paymentMethod}</span><br><span class="text-[10px] text-slate-500 font-mono">TrxID: ${trxId}</span>` : `<span class="font-bold text-slate-900">${paymentMethod}</span>`;

                let orderDate = order.orderDate || order.date || order.createdAt || order.time || 'N/A';
                if (orderDate !== 'N/A' && orderDate.includes('T')) {
                    orderDate = orderDate.replace('T', ' ').substring(0, 19);
                }

                historyTbody.innerHTML += `
                    <tr class="hover:bg-slate-50/90 transition-colors border-b border-slate-100 group">
                        <td class="p-3.5">
                            <span class="inline-flex items-center gap-1 font-black text-[#F26522] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-md text-xs font-mono">${orderIdShow}</span><br>
                            <span class="text-[11px] text-slate-400 font-medium mt-1 inline-block">${orderDate}</span>
                        </td>
                        <td class="p-3.5">
                            <p class="font-bold text-slate-900 text-sm">${customerName}</p>
                            <p class="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5"><i class="fa-solid fa-phone text-[9px] text-slate-400"></i>${customerPhone}</p>
                            <p class="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5"><i class="fa-solid fa-envelope text-[9px]"></i>${customerEmail}</p>
                            <p class="text-xs text-slate-500 truncate max-w-[160px] mt-0.5" title="${customerAddress}"><i class="fa-solid fa-location-dot text-[9px] text-slate-400 mr-1"></i>${customerAddress}</p>
                        </td>
                        <td class="p-3.5">${paymentInfo}</td>
                        <td class="p-3.5 space-y-1">${itemsHtml}</td>
                        <td class="p-3.5 font-black text-slate-900 text-sm">${totalAmt}</td>
                        <td class="p-3.5">
                            <select onchange="event.stopPropagation(); updateOrderStatus('${order.firebaseId}', this.value, this)" data-order-id="${order.firebaseId}" class="order-status-select border bg-white p-2 rounded-xl text-xs font-bold focus:outline-none focus:border-[#F26522] shadow-2xs cursor-pointer transition-all ${
                                {
                                    'Processing': 'bg-amber-50 text-amber-700 border-amber-200/80',
                                    'On The Way': 'bg-blue-50 text-blue-700 border-blue-200/80',
                                    'Delivered': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                                    'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200/80'
                                }[order.status || 'Processing'] || 'bg-slate-50 text-slate-700 border-slate-200'
                            }">
                                <option value="Processing" ${(order.status || 'Processing') === 'Processing' ? 'selected' : ''}>⏳ Processing</option>
                                <option value="On The Way" ${order.status === 'On The Way' ? 'selected' : ''}>🚚 On The Way</option>
                                <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
                                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `;
            });
        }
    }


// Window Global Exports
window.loadAdminDashboardData = loadAdminDashboardData;
window.updateOrderStatus = updateOrderStatus;
window.filterOrdersByDate = filterOrdersByDate;
window.resetDateFilter = resetDateFilter;
window.refreshCustomerSearchStats = refreshCustomerSearchStats;
window.searchCustomerHistory = searchCustomerHistory;
