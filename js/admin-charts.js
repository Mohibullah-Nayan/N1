/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN CHARTS & ANALYTICS MODULE (js/admin-charts.js)
   --------------------------------------------------------------------------
   - Real-time 7-day Sales & Revenue Line / Area Chart (Chart.js)
   - Real-time Order Delivery Status Breakdown Doughnut Chart
   - Dynamic Canvas Resize, Gradient Fills & Number Formatting
   ========================================================================== */

    // ৭. রিয়েল-টাইম সেলস ও স্ট্যাটাস চার্টস (Chart.js Real-time Analytics)
    // ==========================================================================
    let salesChartInstance = null;
    let statusChartInstance = null;

    // এই ফাংশনটি অর্ডারের ডাটা বিশ্লেষণ করে সেলস ও রেভিনিউ চার্ট রিয়েল-টাইমে আপডেট করে
    function updateRealtimeCharts(orders) {
        const canvasSales = document.getElementById('salesAnalyticsChart');
        const canvasStatus = document.getElementById('orderStatusChart');
        if (!canvasSales || !canvasStatus || typeof Chart === 'undefined') return;

        // বিগত ৭ দিনের লেবেল এবং ডেটা ইনিশিয়ালাইজেশন
        const dayLabels = [];
        const salesData = [0, 0, 0, 0, 0, 0, 0];
        const ordersData = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const labelStr = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dayLabels.push(labelStr);
        }

        let statusCounts = {
            'Processing': 0,
            'On The Way': 0,
            'Delivered': 0,
            'Cancelled': 0
        };

        const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        orders.forEach(order => {
            // ১. টাকার পরিমাণ নিখুঁতভাবে সংখ্যায় রূপান্তর
            let cleanTotal = 0;
            if (typeof order.totalAmount === 'number') {
                cleanTotal = order.totalAmount;
            } else if (order.totalAmount) {
                cleanTotal = parseInt(String(order.totalAmount).replace(/[^\d]/g, '')) || 0;
            } else if (order.items && Array.isArray(order.items)) {
                order.items.forEach(it => {
                    let p = parseInt(String(it.price || 0).replace(/[^\d]/g, '')) || 0;
                    let q = parseInt(it.quantity) || 1;
                    cleanTotal += (p * q);
                });
            }

            // ২. ডেট ক্যালকুলেশন করে গত ৭ দিনের কোনো দিনে পড়ে তা বের করা
            let orderDateObj = null;
            if (order.createdAt) {
                orderDateObj = new Date(order.createdAt);
            } else if (order.date) {
                let parts = String(order.date).split('/');
                if (parts.length === 3) {
                    orderDateObj = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
                } else {
                    orderDateObj = new Date(order.date);
                }
            }

            if (orderDateObj && !isNaN(orderDateObj.getTime())) {
                const orderMid = new Date(orderDateObj.getFullYear(), orderDateObj.getMonth(), orderDateObj.getDate()).getTime();
                const diffDays = Math.round((todayMid - orderMid) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    const targetIdx = 6 - diffDays;
                    salesData[targetIdx] += cleanTotal;
                    ordersData[targetIdx] += 1;
                }
            } else {
                salesData[6] += cleanTotal;
                ordersData[6] += 1;
            }

            // ৩. স্ট্যাটাস কাউন্ট
            const st = String(order.status || 'Processing').toLowerCase();
            if (st.includes('way') || st.includes('on the way')) statusCounts['On The Way']++;
            else if (st.includes('deliver')) statusCounts['Delivered']++;
            else if (st.includes('cancel')) statusCounts['Cancelled']++;
            else statusCounts['Processing']++;
        });

        // লেজেন্ড কাউন্ট আপডেট
        const legProc = document.getElementById('legend-processing');
        const legWay = document.getElementById('legend-ontheway');
        const legDel = document.getElementById('legend-delivered');
        const legCan = document.getElementById('legend-cancelled');
        if (legProc) legProc.innerText = statusCounts['Processing'];
        if (legWay) legWay.innerText = statusCounts['On The Way'];
        if (legDel) legDel.innerText = statusCounts['Delivered'];
        if (legCan) legCan.innerText = statusCounts['Cancelled'];

        // ৪. রেন্ডার / আপডেট সেলস এবং রেভিনিউ লাইন গ্রাফ (Line / Area Chart)
        const ctxSales = canvasSales.getContext('2d');
        const gradientRevenue = ctxSales.createLinearGradient(0, 0, 0, 320);
        gradientRevenue.addColorStop(0, 'rgba(79, 70, 229, 0.35)');
        gradientRevenue.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

        const gradientOrders = ctxSales.createLinearGradient(0, 0, 0, 320);
        gradientOrders.addColorStop(0, 'rgba(242, 101, 34, 0.30)');
        gradientOrders.addColorStop(1, 'rgba(242, 101, 34, 0.00)');

        if (salesChartInstance) {
            salesChartInstance.data.labels = dayLabels;
            salesChartInstance.data.datasets[0].data = salesData;
            salesChartInstance.data.datasets[1].data = ordersData;
            salesChartInstance.update('active');
        } else {
            salesChartInstance = new Chart(ctxSales, {
                type: 'line',
                data: {
                    labels: dayLabels,
                    datasets: [
                        {
                            label: 'Revenue (৳)',
                            data: salesData,
                            borderColor: '#4F46E5',
                            backgroundColor: gradientRevenue,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#4F46E5',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 7,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Orders Volume',
                            data: ordersData,
                            borderColor: '#F26522',
                            backgroundColor: gradientOrders,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointBackgroundColor: '#F26522',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                usePointStyle: true,
                                boxWidth: 8,
                                padding: 16,
                                font: { family: 'Inter', size: 12, weight: '700' }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0F172A',
                            padding: 12,
                            cornerRadius: 12,
                            titleFont: { family: 'Inter', size: 13, weight: '700' },
                            bodyFont: { family: 'Inter', size: 12 },
                            callbacks: {
                                label: function(context) {
                                    if (context.dataset.yAxisID === 'y') {
                                        return ' Total Revenue: ৳' + context.parsed.y.toLocaleString('en-IN');
                                    }
                                    return ' Total Orders: ' + context.parsed.y + ' orders';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: 'Inter', size: 11, weight: '600' }, color: '#64748B' }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: 'rgba(226, 232, 240, 0.6)' },
                            ticks: {
                                font: { family: 'Inter', size: 11, weight: '500' },
                                color: '#64748B',
                                callback: value => '৳' + (value >= 1000 ? (value / 1000) + 'k' : value)
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: {
                                font: { family: 'Inter', size: 11, weight: '600' },
                                color: '#F26522',
                                precision: 0,
                                callback: value => value + ' pcs'
                            }
                        }
                    }
                }
            });
        }

        // ৫. রেন্ডার / আপডেট অর্ডার স্ট্যাটাস ডোনাট গ্রাফ (Doughnut Chart)
        const ctxStatus = canvasStatus.getContext('2d');
        const statusDataArray = [
            statusCounts['Processing'],
            statusCounts['On The Way'],
            statusCounts['Delivered'],
            statusCounts['Cancelled']
        ];

        const totalStatusCount = statusDataArray.reduce((a, b) => a + b, 0);
        const displayData = totalStatusCount === 0 ? [1] : statusDataArray;
        const displayColors = totalStatusCount === 0 ? ['#E2E8F0'] : ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

        if (statusChartInstance) {
            statusChartInstance.data.datasets[0].data = displayData;
            statusChartInstance.data.datasets[0].backgroundColor = displayColors;
            statusChartInstance.update('active');
        } else {
            statusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: totalStatusCount === 0 ? ['No Orders Yet'] : ['Processing', 'On The Way', 'Delivered', 'Cancelled'],
                    datasets: [{
                        data: displayData,
                        backgroundColor: displayColors,
                        borderWidth: 3,
                        borderColor: '#ffffff',
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#0F172A',
                            padding: 10,
                            cornerRadius: 10,
                            titleFont: { family: 'Inter', size: 12, weight: '700' },
                            bodyFont: { family: 'Inter', size: 12 }
                        }
                    }
                }
            });
        }
    }


// Window Global Exports
window.updateRealtimeCharts = updateRealtimeCharts;
