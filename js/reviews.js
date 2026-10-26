/* ==========================================================================
   SCENT LUXURY PERFUMES - PRODUCT REVIEWS MODULE (js/reviews.js)
   --------------------------------------------------------------------------
   - Real-time customer ratings and reviews
   - Firebase Firestore 'reviews' collection sync
   - Star rating picker & form submission
   - Verified buyer badge & relative time formatter
   ========================================================================== */


// ==========================================================================

// ================= রিয়েল-টাইম রিভিউ এবং রেটিং সিস্টেম লজিক =================

// ১. ফায়ারবেস থেকে রিয়েল-টাইম ডেটা ফেচ করার জন্য হেল্পার
// এই ফাংশনটি ফায়ারস্টোর থেকে নির্দিষ্ট প্রোডাক্টের সমস্ত কাস্টমার রিভিউ রিয়েল-টাইমে ফেচ করে কলব্যাকে পাঠায়
function getProductReviews(prodId, callback) {
    if (!db) {
        console.error("Firestore (db) is not initialized!");
        alert("Firebase connection error! Please make sure Firebase scripts are loaded properly.");
        return;
    }

    db.collection("reviews")
        .where("productId", "==", String(prodId))
        .onSnapshot((snapshot) => {
            let reviewsList = [];
            snapshot.forEach((doc) => {
                let data = doc.data();
                data.docId = doc.id; // ফায়ারবেস ডকুমেন্ট আইডি সংরক্ষণ
                reviewsList.push(data);
            });

            // নতুন রিভিউগুলো উপরে দেখানোর জন্য সর্টিং
            reviewsList.sort((a, b) => {
                let timeA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
                let timeB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
                return timeB - timeA;
            });

            if (typeof callback === 'function') {
                callback(reviewsList);
            }
        }, (error) => {
            console.error("Review loading error: ", error);
        });
}

// ২. ফায়ারবেসে রিভিউ সেভ করার ফাংশন
// এই ফাংশনটি ভেরিফাইড ইউজারের রিভিউ ও রেটিং ফায়ারস্টোরের 'reviews' কালেকশনে সংরক্ষণ করে
function saveProductReview(prodId, reviewObj) {
    if (!db) {
        alert("Database connection error! Firebase Firestore (db) is missing.");
        return;
    }

    // ফায়ারবেস অথেনটিকেশন বা লোকাল ইউজার চেক
    const firebaseUser = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
    const customUser = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    const user = firebaseUser || customUser;

    if (!user) {
        if (typeof showPopupNotification === 'function') {
            showPopupNotification("Please sign in to submit a review!");
        } else {
            alert("Please sign in to submit a review!");
        }
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    const firestoreReviewObj = {
        productId: String(prodId),
        userId: user.uid || customUser?.uid || "",
        userEmail: user.email || customUser?.email || "",
        name: reviewObj.name || user.displayName || user.name || (user.email ? user.email.split('@')[0] : "Valued Customer"),
        role: reviewObj.role || "Verified Buyer",
        rating: Number(reviewObj.rating),
        comment: reviewObj.comment,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const cleanProd = String(prodId || 'item').replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);

    const reviewDocId = "REV-" + cleanProd + "-" + Date.now();

    db.collection("reviews").doc(reviewDocId).set(firestoreReviewObj)
        .then(() => {
            console.log("Review saved successfully to Firebase!");
            if (typeof showPopupNotification === 'function') {
                showPopupNotification("Your review has been submitted successfully! 🎉");
            }
        })
        .catch((error) => {
            console.error("Error saving review to Firestore: ", error);
            if (typeof showPopupNotification === 'function') {
                showPopupNotification("Failed to submit review. Try again!");
            } else {
                alert("Failed to submit review. Try again!");
            }
        });
}

// অ্যাডমিন চেক করার ফাংশন
// এই ফাংশনটি বর্তমান লগইন করা ইউজার অ্যাডমিন কি না তা ইমেইল ও লোকালস্টোরেজ ফ্ল্যাগ দিয়ে যাচাই করে
function checkIsAdmin() {
    const user = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null);
    const adminEmail = "mohibullahnayan.cse@gmail.com";

    const isLocalStorageAdmin = localStorage.getItem('isAdminLoggedIn') === 'true' ||
        localStorage.getItem('adminEmail') === adminEmail ||
        localStorage.getItem('adminLoged') === 'true';

    if (user && user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
        return true;
    }

    return isLocalStorageAdmin || (user && user.isAdmin === true);
}

// রিভিউ ডিলিট করার ফাংশন
// এই ফাংশনটি অ্যাডমিন বা রিভিউ প্রদানকারী আসল ইউজারকে ফায়ারস্টোর থেকে রিভিউ ডিলিট করার অনুমতি দেয়
function deleteProductReview(prodId, docId) {
    if (!db) return;

    const firebaseUser = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
    const customUser = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    const currentUser = firebaseUser || customUser;
    const isAdmin = checkIsAdmin();

    db.collection("reviews").doc(docId).get().then((doc) => {
        if (!doc.exists) {
            if (typeof showPopupNotification === 'function') {
                showPopupNotification("Review not found!");
            }
            return;
        }

        const reviewToDelete = doc.data();

        let isOwner = false;
        if (currentUser) {
            const currentEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : "";
            const currentEmailPrefix = currentUser.email ? currentUser.email.split('@')[0].toLowerCase().trim() : "";
            const currentDisplayName = currentUser.displayName ? currentUser.displayName.toLowerCase().trim() : "";
            const currentUserNameField = currentUser.name ? currentUser.name.toLowerCase().trim() : "";
            const currentUid = currentUser.uid ? String(currentUser.uid).trim() : "";

            const revName = reviewToDelete.name ? reviewToDelete.name.toLowerCase().trim() : "";
            const revEmail = reviewToDelete.userEmail ? reviewToDelete.userEmail.toLowerCase().trim() : "";
            const revUid = reviewToDelete.userId ? String(reviewToDelete.userId).trim() : "";

            isOwner = (revEmail && revEmail === currentEmail) ||
                (revUid && revUid === currentUid) ||
                (revName === currentDisplayName) ||
                (revName === currentEmailPrefix) ||
                (revName === currentUserNameField);
        }

        if (!isAdmin && !isOwner) {
            if (typeof showPopupNotification === 'function') {
                showPopupNotification("Sorry, you can only delete your own reviews!");
            } else {
                alert("Sorry, you can only delete your own reviews!");
            }
            return;
        }

        if (confirm("You are about to delete this review. Are you sure?")) {
            db.collection("reviews").doc(docId).delete()
                .then(() => {
                    console.log("Review deleted successfully from Firebase.");
                    if (typeof showPopupNotification === 'function') {
                        showPopupNotification("Review deleted successfully! 🗑️");
                    }
                })
                .catch((error) => {
                    console.error("Error deleting review: ", error);
                    alert("There was an error deleting the review. Please try again.");
                });
        }
    }).catch((error) => {
        console.error("Error fetching review for deletion: ", error);
    });
}

let selectedReviewRating = 5;
// এই ফাংশনটি রিভিউ ফর্মে ইউজারের ক্লিক করা স্টার রেটিং অনুযায়ী স্টারের রঙ ও মান নির্ধারণ করে
function setReviewRating(rating) {
    selectedReviewRating = rating;
    const stars = document.querySelectorAll('#star-rating-selector i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('fa-regular');
            star.classList.add('fa-solid');
        } else {
            star.classList.remove('fa-solid');
            star.classList.add('fa-regular');
        }
    });
}

// এই ফাংশনটি রিভিউ ফর্ম সাবমিশন হ্যান্ডেল করে এবং নতুন রিভিউ ফায়ারস্টোরে সেভ করার ফাংশন কল করে
function submitProductReview(prodId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const targetProdId = prodId || (typeof productId !== 'undefined' ? productId : null) || (typeof currentProduct !== 'undefined' && currentProduct?.id ? currentProduct.id : null) || new URLSearchParams(window.location.search).get('id') || "1";

    const firebaseUser = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
    const customUser = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
    const user = firebaseUser || customUser;

    if (!user) {
        if (typeof showPopupNotification === 'function') {
            showPopupNotification("Please sign in to submit a review!");
        } else {
            alert("Please sign in to submit a review!");
        }
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return false;
    }

    const commentInput = document.getElementById('review-comment-input');
    const comment = commentInput ? commentInput.value.trim() : '';

    if (!comment) {
        if (typeof showPopupNotification === 'function') {
            showPopupNotification("Please write your feedback or review!");
        } else {
            alert("Please write your feedback or review!");
        }
        return false;
    }

    let userName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : "Valued Customer");

    const newReview = {
        name: userName,
        userEmail: user.email || "",
        userId: user.uid || "",
        role: "Verified Buyer",
        rating: selectedReviewRating,
        comment: comment
    };

    saveProductReview(targetProdId, newReview);

    if (commentInput) commentInput.value = "";
    setReviewRating(5);

    return false;
}

// পেজ লোড হওয়ার সাথে সাথে রিয়েল-টাইম লিসেনার চালু করা

// ================= রেটিং সামারি এবং রেন্ডারিং লজিক =================
// এই ফাংশনটি প্রোডাক্টের গড় রেটিং, রেটিং বার পার্সেন্টেজ এবং সমস্ত কাস্টমার রিভিউর তালিকা রেন্ডার করে
function renderProductReviews(prodId) {
    const targetProdId = prodId || (typeof productId !== 'undefined' ? productId : null) || (typeof currentProduct !== 'undefined' && currentProduct?.id ? currentProduct.id : null) || new URLSearchParams(window.location.search).get('id') || "1";

    getProductReviews(targetProdId, (reviews) => {
        const container = document.getElementById('customer-reviews-container');

        const avgRatingElem = document.getElementById('avg-rating');
        const avgStarsContainer = document.getElementById('rating-stars-container');
        const totalReviewsElem = document.getElementById('total-reviews-count');
        const tabReviewCount = document.getElementById('tab-review-count');
        const recTextElem = document.getElementById('recommendation-text');
        const reviewCountDisplays = document.querySelectorAll('.review-count-display');

        if (tabReviewCount) {
            tabReviewCount.innerText = `(${reviews.length})`;
        }

        reviewCountDisplays.forEach(el => {
            el.innerText = `(${reviews.length} Reviews)`;
        });

        if (totalReviewsElem) {
            totalReviewsElem.innerText = `(${reviews.length} Reviews)`;
        }

        if (reviews.length === 0) {
            if (avgRatingElem) avgRatingElem.innerText = "0.0";
            if (avgStarsContainer) {
                avgStarsContainer.innerHTML = '<i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i>';
            }
            if (recTextElem) {
                recTextElem.innerText = `0.00% Recommended (0 of 0)`;
            }
            for (let i = 1; i <= 5; i++) {
                const bar = document.getElementById(`bar-star-${i}`) || document.getElementById(`rating-bar-${i}`);
                const percent = document.getElementById(`percent-star-${i}`) || document.getElementById(`rating-percent-${i}`);
                if (bar) bar.style.width = '0%';
                if (percent) percent.innerText = '0%';
            }
            if (container) {
                container.innerHTML = '<p class="text-xs text-neutral-400 text-center py-4">No reviews yet. Be the first to review!</p>';
            }
            return;
        }

        let totalScore = 0;
        let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        reviews.forEach(rev => {
            let r = parseInt(rev.rating) || 5;
            totalScore += r;
            if (ratingCounts[r] !== undefined) {
                ratingCounts[r]++;
            }
        });

        let avgRating = (totalScore / reviews.length).toFixed(1);
        if (avgRatingElem) avgRatingElem.innerText = avgRating;

        if (avgStarsContainer) {
            let starsHtml = '';
            let fullStars = Math.floor(parseFloat(avgRating));
            for (let i = 1; i <= 5; i++) {
                if (i <= fullStars) {
                    starsHtml += '<i class="fa-solid fa-star"></i>';
                } else {
                    starsHtml += '<i class="fa-regular fa-star"></i>';
                }
            }
            avgStarsContainer.innerHTML = starsHtml;
        }

        const recommendedCount = ratingCounts[4] + ratingCounts[5];
        const recPercent = ((recommendedCount / reviews.length) * 100).toFixed(2);
        if (recTextElem) {
            recTextElem.innerText = `${recPercent}% Recommended (${recommendedCount} of ${reviews.length})`;
        }

        for (let i = 1; i <= 5; i++) {
            let count = ratingCounts[i];
            let percentage = Math.round((count / reviews.length) * 100);

            const bar = document.getElementById(`bar-star-${i}`) || document.getElementById(`rating-bar-${i}`);
            const percent = document.getElementById(`percent-star-${i}`) || document.getElementById(`rating-percent-${i}`);

            if (bar) bar.style.width = percentage + '%';
            if (percent) percent.innerText = percentage + '%';
        }

        const firebaseUser = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
        const customUser = typeof checkUserLoggedIn === 'function' ? checkUserLoggedIn() : null;
        const currentUser = firebaseUser || customUser;
        const isAdmin = checkIsAdmin();

        if (container) {
            container.innerHTML = "";
            reviews.forEach((rev) => {
                let starHtml = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= rev.rating) {
                        starHtml += '<i class="fa-solid fa-star"></i>';
                    } else {
                        starHtml += '<i class="fa-regular fa-star"></i>';
                    }
                }

                let isOwner = false;
                if (currentUser) {
                    const currentEmail = currentUser.email ? currentUser.email.toLowerCase().trim() : "";
                    const currentEmailPrefix = currentUser.email ? currentUser.email.split('@')[0].toLowerCase().trim() : "";
                    const currentDisplayName = currentUser.displayName ? currentUser.displayName.toLowerCase().trim() : "";
                    const currentUserNameField = currentUser.name ? currentUser.name.toLowerCase().trim() : "";
                    const currentUid = currentUser.uid ? String(currentUser.uid).trim() : "";

                    const revName = rev.name ? rev.name.toLowerCase().trim() : "";
                    const revEmail = rev.userEmail ? rev.userEmail.toLowerCase().trim() : "";
                    const revUid = rev.userId ? String(rev.userId).trim() : "";

                    isOwner = (revEmail && revEmail === currentEmail) ||
                        (revUid && revUid === currentUid) ||
                        (revName === currentDisplayName) ||
                        (revName === currentEmailPrefix) ||
                        (revName === currentUserNameField);
                }

                let deleteButtonHtml = "";
                if (isAdmin || isOwner) {
                    deleteButtonHtml = `
                        <button onclick="deleteProductReview('${targetProdId}', '${rev.docId}')" class="absolute top-3 right-3 text-red-500 hover:text-red-700 text-[11px] font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer border border-red-200 shadow-sm z-10" title="Delete Review">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    `;
                }

                const reviewCard = document.createElement('div');
                reviewCard.className = "bg-neutral-50 border border-neutral-200 p-4 rounded-lg space-y-2 relative min-h-[85px]";
                reviewCard.innerHTML = `
                    <div class="flex items-center justify-between pr-20">
                        <h5 class="text-xs font-bold text-neutral-800">${escapeHTML(rev.name)} <span class="text-[10px] font-normal text-neutral-400 ml-1">(${escapeHTML(rev.date || '')})</span></h5>
                        <div class="text-amber-400 text-xs flex gap-0.5">${starHtml}</div>
                    </div>
                    <p class="text-xs text-neutral-600 leading-relaxed pr-16">${escapeHTML(rev.comment)}</p>
                    <span class="inline-block text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded">${escapeHTML(rev.role)}</span>
                    ${deleteButtonHtml}
                `;
                container.appendChild(reviewCard);
            });
        }
    });
}

// ==========================================================================

// Window Global Exports
window.getProductReviews = getProductReviews;
window.saveProductReviewToFirebase = saveProductReviewToFirebase;
window.submitProductReview = submitProductReview;
window.renderProductReviews = renderProductReviews;
window.formatReviewTime = formatReviewTime;
