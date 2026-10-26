/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN EXTENSIONS MODULE (js/admin-extensions.js)
   --------------------------------------------------------------------------
   - 1. One-Click Luxury Invoice & Cash Memo Printer (printOrderInvoice)
   - 2. Orders Report Excel / CSV Exporter with UTF-8 BOM (exportOrdersToCSV)
   - 3. Courier Consignment ID & Tracking Sync (updateCourierTracking)
   - 4. Low Stock Inventory Detection & Badge Helper (checkLowStockAlerts)
   ========================================================================== */

// ১. এই ফাংশনটি নির্দিষ্ট অর্ডারের জন্য প্রফেশনাল প্যাকিং ইনভয়েস ও ক্যাশমেমো প্রিন্ট উইন্ডো ওপেন করে
window.printOrderInvoice = function(orderId) {
    if (!orderId) {
        alert("Order ID missing for invoice printing.");
        return;
    }

    const cleanTargetId = String(orderId).replace(/^#+/, '').trim().toLowerCase();

    // ক্যাশ করা অর্ডার থেকে নির্দিষ্ট অর্ডার খুঁজে বের করা
    let allOrders = window.cachedRawOrders || window.cachedAllOrders || window.allOrdersCache || [];
    let order = allOrders.find(o => {
        let oId = String(o.orderId || o.firebaseId || '').replace(/^#+/, '').trim().toLowerCase();
        let fId = String(o.firebaseId || '').trim().toLowerCase();
        return oId === cleanTargetId || fId === cleanTargetId;
    });

    if (!order) {
        alert("Order details not found in cache. Please try again or refresh.");
        return;
    }

    const displayOrderId = order.orderId ? (order.orderId.startsWith('#') ? order.orderId : '#' + order.orderId) : ('#ORD-' + (order.firebaseId || '0000'));
    const orderDate = order.date || order.orderDate || new Date().toLocaleDateString('en-GB');
    const custName = order.name || order.fullName || order.customerName || 'Valued Customer';
    const custPhone = order.phone || order.phoneNumber || 'N/A';
    const custEmail = order.email || order.userEmail || 'N/A';
    const custAddress = order.address || order.shippingAddress || 'Doorstep Delivery';
    const payMethod = order.paymentMethod === 'cod' || !order.paymentMethod ? 'Cash on Delivery (COD)' : order.paymentMethod;
    const items = order.items || order.products || [];

    let subtotal = 0;
    let itemsRows = items.map((item, idx) => {
        let cleanPrice = parseInt(String(item.price).replace(/[^\d]/g, '')) || 0;
        let qty = parseInt(item.quantity || item.qty) || 1;
        let total = cleanPrice * qty;
        subtotal += total;
        return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-size: 13px; color: #1e293b;">${idx + 1}</td>
                <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #0f172a;">${item.title || item.name || 'Luxury Perfume'}</td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: center; color: #334155;">${qty} pcs</td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #334155;">৳${cleanPrice.toLocaleString('en-IN')}</td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">৳${total.toLocaleString('en-IN')}</td>
            </tr>
        `;
    }).join('');

    let grandTotalStr = order.totalAmount || ('৳' + (subtotal + 60).toLocaleString('en-IN'));

    const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${displayOrderId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 25px; color: #0f172a; background: #fff; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #cbd5e1; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #0f172a; font-family: Georgia, serif; }
        .brand span { color: #f26522; }
        .tagline { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
        .inv-badge { background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; padding: 6px 14px; border-radius: 10px; font-weight: 800; font-size: 14px; font-family: monospace; display: inline-block; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
        .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; }
        .meta-title { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .meta-val { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #f1f5f9; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 800; letter-spacing: 0.5px; }
        .summary-box { display: flex; justify-content: flex-end; }
        .summary-table { width: 280px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
        .summary-total { border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 900; color: #f26522; }
        .footer-note { text-align: center; margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 12px; color: #64748b; }
        .print-btn-bar { text-align: center; margin-bottom: 20px; }
        .print-btn { background: #f26522; color: #fff; border: none; padding: 10px 22px; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; }
        @media print {
            .print-btn-bar { display: none; }
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="print-btn-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Print Packing Invoice</button>
    </div>
    <div class="invoice-box">
        <div class="header">
            <div>
                <div class="brand">SCENT<span>.</span></div>
                <div class="tagline">Luxury Perfumes & Pure Attar Atelier</div>
                <div style="font-size: 12px; color: #475569; margin-top: 6px;">Hotline: +880 1234-567890 &bull; Dhaka, Bangladesh</div>
            </div>
            <div style="text-align: right;">
                <div class="inv-badge">${displayOrderId}</div>
                <div style="font-size: 12px; color: #64748b; font-weight: 600; margin-top: 6px;">Date: ${orderDate}</div>
                <div style="font-size: 12px; color: #047857; font-weight: 700; margin-top: 2px;">Status: ${order.status || 'Processing'}</div>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-card">
                <div class="meta-title">📦 Customer / Delivery Address</div>
                <div class="meta-val"><strong>${custName}</strong></div>
                <div class="meta-val">Phone: ${custPhone}</div>
                <div class="meta-val">Address: ${custAddress}</div>
            </div>
            <div class="meta-card">
                <div class="meta-title">💳 Payment & Shipment Details</div>
                <div class="meta-val">Method: <strong>${payMethod}</strong></div>
                <div class="meta-val">Courier: <strong>${order.courierName || 'Standard Express'}</strong></div>
                ${order.courierTracking ? `<div class="meta-val">Tracking No: <strong>${order.courierTracking}</strong></div>` : ''}
                <div class="meta-val" style="color: #c2410c; margin-top: 4px;">Collection Amount: <strong>${grandTotalStr}</strong></div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="text-align: left; width: 40px;">#</th>
                    <th style="text-align: left;">Item Description</th>
                    <th style="text-align: center; width: 80px;">Qty</th>
                    <th style="text-align: right; width: 110px;">Price</th>
                    <th style="text-align: right; width: 110px;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
        </table>

        <div class="summary-box">
            <div class="summary-table">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>৳${subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-row">
                    <span>Delivery Charge:</span>
                    <span>৳60</span>
                </div>
                ${order.couponUsed && order.couponUsed !== 'None' ? `
                <div class="summary-row" style="color: #059669; font-weight: 600;">
                    <span>Coupon (${order.couponUsed}):</span>
                    <span>${order.discountAmount || '-৳0'}</span>
                </div>` : ''}
                <div class="summary-row summary-total">
                    <span>Grand Total:</span>
                    <span>${grandTotalStr}</span>
                </div>
            </div>
        </div>

        <div class="footer-note">
            <p style="margin: 0; font-weight: 600; color: #334155;">Thank you for choosing SCENT Luxury Perfumes & Attar! ✨</p>
            <p style="margin: 4px 0 0 0; font-size: 11px;">For inquiries, return policies or verification, please contact our concierge service.</p>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
        };
    </script>
</body>
</html>
    `;

    const printWin = window.open('', '_blank', 'width=880,height=920');
    if (printWin) {
        printWin.document.open();
        printWin.document.write(invoiceHtml);
        printWin.document.close();
    } else {
        alert("Pop-up blocked! Please allow pop-ups for this site to print invoices.");
    }
};

// ২. এই ফাংশনটি বর্তমান অর্ডারের রিপোর্ট এক্সেল ও সিএসভি ফরম্যাটে ডাউনলোড করায়
window.exportOrdersToCSV = function() {
    let orders = window.cachedRawOrders || window.cachedAllOrders || window.allOrdersCache || [];
    if (orders.length === 0) {
        alert("No order records available to export.");
        return;
    }

    const headers = [
        "Order ID",
        "Order Date",
        "Customer Name",
        "Phone Number",
        "Email",
        "Delivery Address",
        "Payment Method",
        "Total Amount",
        "Status",
        "Ordered Items",
        "Courier Name",
        "Courier Tracking"
    ];

    const escapeCsv = (val) => {
        let str = String(val == null ? '' : val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    let csvRows = [];
    csvRows.push(headers.map(escapeCsv).join(','));

    orders.forEach(o => {
        let itemsList = (o.items || o.products || [])
            .map(it => `${it.title || it.name || 'Perfume'} (${it.quantity || 1} pcs)`)
            .join('; ');

        let row = [
            o.orderId || ('#' + (o.firebaseId || '')),
            o.date || o.orderDate || '',
            o.name || o.fullName || o.customerName || 'Customer',
            o.phone || o.phoneNumber || '',
            o.email || o.userEmail || '',
            o.address || o.shippingAddress || '',
            o.paymentMethod || 'Cash on Delivery (COD)',
            o.totalAmount || '',
            o.status || 'Processing',
            itemsList,
            o.courierName || '',
            o.courierTracking || ''
        ];
        csvRows.push(row.map(escapeCsv).join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `SCENT_Orders_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// ৩. এই ফাংশনটি কুরিয়ারের ট্র্যাকিং ও কনসাইনমেন্ট নম্বর ফায়ারস্টোর অর্ডারে যুক্ত করে
window.updateCourierTracking = async function(firebaseId) {
    if (!firebaseId) {
        alert("Order record ID missing.");
        return;
    }

    const courier = prompt("Enter Courier Name (e.g. Steadfast, Pathao, RedX):", "Steadfast");
    if (!courier) return;

    const trackingId = prompt("Enter Courier Tracking / Consignment ID (e.g. ST-89120):");
    if (!trackingId) return;

    try {
        if (window.db && window.firestoreUpdateDoc && window.firestoreDoc) {
            const timestampVal = window.firestoreServerTimestamp ? window.firestoreServerTimestamp() : new Date().toISOString();
            await window.firestoreUpdateDoc(window.firestoreDoc(window.db, "orders", firebaseId), {
                courierName: courier.trim(),
                courierTracking: trackingId.trim(),
                updatedAt: timestampVal
            });
            alert(`✓ Courier tracking updated successfully!\nCourier: ${courier}\nTracking: ${trackingId}`);
        } else if (typeof firebase !== 'undefined' && firebase.firestore) {
            await firebase.firestore().collection("orders").doc(firebaseId).update({
                courierName: courier.trim(),
                courierTracking: trackingId.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`✓ Courier tracking updated successfully!\nCourier: ${courier}\nTracking: ${trackingId}`);
        } else {
            alert("Database connection is initializing. Please try again in a few moments.");
            return;
        }

        // লাইভ ভিউ আপডেট করা
        if (typeof applyFiltersAndRender === 'function') {
            applyFiltersAndRender();
        }
    } catch (err) {
        console.error("Error updating courier tracking:", err);
        alert("Failed to update courier tracking: " + err.message);
    }
};

// ৪. এই ফাংশনটি লো-স্টক প্রোডাক্ট শনাক্ত করে সতর্কবার্তা প্রদর্শন করে
window.checkLowStockAlerts = function(products) {
    if (!products || !Array.isArray(products)) return;
    const lowStockItems = products.filter(p => {
        let stock = p.stock !== undefined && p.stock !== null && p.stock !== '' ? parseInt(p.stock) : null;
        const isBanner = p.isBanner || p.isHeroBanner || (p.homeSection && (p.homeSection.startsWith('slider-') || p.homeSection === 'side-banner'));
        return !isBanner && stock !== null && !isNaN(stock) && stock <= 10;
    });

    const alertBanner = document.getElementById('low-stock-alert-banner');
    if (alertBanner) {
        if (lowStockItems.length > 0) {
            let summaryList = lowStockItems.map(p => {
                let st = parseInt(p.stock) || 0;
                let badge = st <= 0 ? '<span class="text-rose-600 font-extrabold underline">Out of Stock</span>' : `<span class="text-amber-800 font-extrabold">${st} pcs left</span>`;
                let pId = p.id || 'N/A';
                return `<span class="inline-flex items-center gap-1.5 bg-amber-100/70 px-2.5 py-1 rounded-xl border border-amber-300/80 shadow-2xs"><strong>${p.title || 'Perfume'}</strong> <span class="font-mono text-[10px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-300 shadow-2xs">ID: ${pId}</span> (${badge})</span>`;
            }).join(' ');

            alertBanner.classList.remove('hidden');
            alertBanner.innerHTML = `
                <div class="flex items-start gap-2.5 w-full">
                    <i class="fa-solid fa-triangle-exclamation text-amber-600 text-base mt-0.5 flex-shrink-0 animate-bounce"></i>
                    <div>
                        <span class="font-bold text-amber-900 block text-xs">⚠️ Low Stock & Inventory Warning (${lowStockItems.length} items):</span>
                        <p class="text-xs text-amber-800 mt-0.5 leading-relaxed">${summaryList}</p>
                    </div>
                </div>
            `;
        } else {
            alertBanner.classList.add('hidden');
        }
    }
};
