/* ==========================================================================
   SCENT LUXURY PERFUMES & ATTAR - USER PROFILE & SECURITY ENGINE (profile.js)
   --------------------------------------------------------------------------
   ১. অথেন্টিকেশন স্টেট ও রিয়েল-টাইম ফায়ারবেস ডেটা সিঙ্ক
   ২. অ্যাডমিন রোল রেস্ট্রিকশন গার্ড (Admin Redirect Guard)
   ৩. কাস্টমার প্রোফাইল তথ্য আপডেট (Email Non-editable)
   ৪. সিকিউর পাসওয়ার্ড পরিবর্তন (Firebase Auth Password Update)
   ৫. ইউজার লগআউট সিস্টেম
   ========================================================================== */

let currentUser = null;
let profileUnsubscribe = null;

// ইউটিলিটি: নোটিফিকেশন টোস্ট দেখানো
function showProfileAlert(msg, isSuccess = true) {
    const alertBox = document.getElementById("profile-alert-box");
    if (!alertBox) return;

    alertBox.classList.remove("hidden", "bg-emerald-50", "border-emerald-200", "text-emerald-700", "dark:bg-emerald-950/50", "dark:border-emerald-800", "dark:text-emerald-300", "bg-rose-50", "border-rose-200", "text-rose-700", "dark:bg-rose-950/50", "dark:border-rose-800", "dark:text-rose-300");
    
    if (isSuccess) {
        alertBox.classList.add("bg-emerald-50", "border-emerald-200", "text-emerald-700", "dark:bg-emerald-950/50", "dark:border-emerald-800", "dark:text-emerald-300");
        alertBox.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i> <span>${msg}</span>`;
    } else {
        alertBox.classList.add("bg-rose-50", "border-rose-200", "text-rose-700", "dark:bg-rose-950/50", "dark:border-rose-800", "dark:text-rose-300");
        alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose-500 text-sm"></i> <span>${msg}</span>`;
    }

    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });

    setTimeout(() => {
        alertBox.classList.add("hidden");
    }, 5000);
}

// ==========================================================================
// ১. অথেন্টিকেশন স্টেট ও রিয়েল-টাইম ফায়ারবেস ডেটা সিঙ্ক
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase === "undefined" || !firebase.auth) {
        console.error("Firebase SDK not loaded.");
        return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            // লগইন করা না থাকলে সরাসরি লগইন পেজে রিডাইরেক্ট করবে
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        // ইমেইল ফিল্ডটি ফায়ারবেস অথ থেকে বসবে এবং এটি কোনোভাবেই এডিট করা যাবে না
        const emailInput = document.getElementById("profile-email");
        const headerEmail = document.getElementById("profile-header-email");
        if (emailInput) {
            emailInput.value = user.email || "";
            emailInput.readOnly = true;
            emailInput.disabled = true;
        }
        if (headerEmail) {
            headerEmail.textContent = user.email || "";
        }

        // পূর্ববর্তী লিসেনার থাকলে তা আনসাবস্ক্রাইব করা
        if (profileUnsubscribe) profileUnsubscribe();

        // রিয়েল-টাইম ফায়ারস্টোর লিসেনার (Realtime Firestore Sync)
        profileUnsubscribe = firebase.firestore().collection("users").doc(user.uid).onSnapshot((docSnap) => {
            if (!docSnap.exists) {
                console.warn("User profile document not found in Firestore.");
                return;
            }

            const data = docSnap.data();

            // ==========================================================================
            // ২. অ্যাডমিন রোল রেস্ট্রিকশন: "admin login kora thakle ei role kaj korbe na"
            // ==========================================================================
            if (data.role === "admin") {
                const adminBanner = document.getElementById("admin-role-banner");
                if (adminBanner) {
                    adminBanner.classList.remove("hidden");
                }
                const saveBtn = document.getElementById("save-profile-btn");
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.classList.add("opacity-50", "cursor-not-allowed");
                    saveBtn.innerText = "Admin Account (Restricted)";
                }
                alert("⚠️ আপনি অ্যাডমিন হিসেবে লগইন করেছেন। এই কাস্টমার প্রোফাইল ফর্মটি অ্যাডমিন রোলের জন্য প্রযোজ্য নয়। আপনাকে অ্যাডমিন কন্ট্রোল সেন্টারে পাঠানো হচ্ছে...");
                setTimeout(() => {
                    window.location.href = "admin.html";
                }, 1000);
                return;
            }

            // রেজিস্ট্রেশনের সময় দেওয়া তথ্য রিয়েল-টাইমে বসানো
            const nameInput = document.getElementById("profile-name");
            const phoneInput = document.getElementById("profile-phone");
            const genderInput = document.getElementById("profile-gender");
            const dobInput = document.getElementById("profile-dob");
            const addressInput = document.getElementById("profile-address");
            const headerName = document.getElementById("profile-header-name");
            const avatarInitials = document.getElementById("profile-avatar-initials");
            const memberSince = document.getElementById("profile-member-since");

            if (nameInput) nameInput.value = data.fullName || "";
            if (phoneInput) phoneInput.value = data.phone || "";
            if (genderInput && data.gender) genderInput.value = data.gender;
            if (dobInput) dobInput.value = data.dateOfBirth || "";
            if (addressInput) addressInput.value = data.shippingAddress || "";

            if (headerName) headerName.textContent = data.fullName || "SCENT Customer";

            // অ্যাভাটার ইনিশিয়াল (যেমন: Nayan -> NA)
            if (avatarInitials) {
                const parts = (data.fullName || "User").trim().split(" ");
                let initials = "";
                if (parts.length >= 2) {
                    initials = (parts[0][0] + parts[1][0]).toUpperCase();
                } else if (parts.length === 1 && parts[0].length > 0) {
                    initials = parts[0].slice(0, 2).toUpperCase();
                } else {
                    initials = "SC";
                }
                avatarInitials.textContent = initials;
            }

            // মেম্বারশিপ তারিখ
            if (memberSince) {
                if (data.createdAt && typeof data.createdAt.toDate === "function") {
                    memberSince.textContent = data.createdAt.toDate().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    });
                } else {
                    memberSince.textContent = "Verified Member";
                }
            }
        }, (error) => {
            console.error("Firestore realtime listener error:", error);
        });
    });
});

// ==========================================================================
// ৩. কাস্টমার প্রোফাইল তথ্য আপডেট (Email Non-editable & Protected)
// ==========================================================================
async function handleProfileSave(event) {
    if (event) event.preventDefault();
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const name = document.getElementById("profile-name").value.trim();
    const phone = document.getElementById("profile-phone").value.trim();
    const gender = document.getElementById("profile-gender").value;
    const dob = document.getElementById("profile-dob").value;
    const address = document.getElementById("profile-address").value.trim();

    if (!name || name.length < 2) {
        showProfileAlert("অনুগ্রহ করে আপনার সঠিক পূর্ণ নাম লিখুন।", false);
        document.getElementById("profile-name").focus();
        return;
    }

    // বাংলাদেশী মোবাইল নম্বর ভ্যালিডেশন
    const cleanPhone = phone.replace(/[\s\-\+]/g, "");
    if (phone && !/^(?:8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
        showProfileAlert("অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।", false);
        document.getElementById("profile-phone").focus();
        return;
    }

    const saveBtn = document.getElementById("save-profile-btn");
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> সেভ হচ্ছে...';

    try {
        // ফায়ারস্টোর আপডেটে ইমেইল বা রোল কখনোই পাঠানো যাবে না (নিরাপত্তা নিশ্চিতকরণ)
        await firebase.firestore().collection("users").doc(currentUser.uid).update({
            fullName: name,
            phone: phone,
            gender: gender,
            dateOfBirth: dob,
            shippingAddress: address,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showProfileAlert("✓ আপনার প্রোফাইলের তথ্য সফলভাবে সেভ ও আপডেট হয়েছে!", true);
    } catch (error) {
        console.error("Error updating profile:", error);
        showProfileAlert("প্রোফাইল আপডেট করতে সমস্যা হয়েছে: " + error.message, false);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

// ==========================================================================
// ৪. সিকিউর পাসওয়ার্ড পরিবর্তন (Firebase Auth Password Update)
// ==========================================================================
async function handlePasswordChange(event) {
    if (event) event.preventDefault();
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const newPassword = document.getElementById("profile-new-password").value;
    const confirmPassword = document.getElementById("profile-confirm-password").value;

    if (!newPassword || newPassword.length < 6) {
        showProfileAlert("নতুন পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।", false);
        document.getElementById("profile-new-password").focus();
        return;
    }

    if (newPassword !== confirmPassword) {
        showProfileAlert("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!", false);
        document.getElementById("profile-confirm-password").focus();
        return;
    }

    const changeBtn = document.getElementById("change-password-btn");
    const originalText = changeBtn.innerHTML;
    changeBtn.disabled = true;
    changeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> পাসওয়ার্ড আপডেট হচ্ছে...';

    try {
        await currentUser.updatePassword(newPassword);
        document.getElementById("profile-new-password").value = "";
        document.getElementById("profile-confirm-password").value = "";
        showProfileAlert("✓ আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!", true);
    } catch (error) {
        console.error("Error updating password:", error);
        if (error.code === "auth/requires-recent-login") {
            alert("নিরাপত্তার স্বার্থে পাসওয়ার্ড পরিবর্তনের জন্য আপনাকে পুনরায় লগইন করতে হবে। অনুগ্রহ করে আবার লগইন করে চেষ্টা করুন।");
            await firebase.auth().signOut();
            window.location.href = "login.html";
        } else {
            showProfileAlert("পাসওয়ার্ড পরিবর্তনে সমস্যা: " + error.message, false);
        }
    } finally {
        changeBtn.disabled = false;
        changeBtn.innerHTML = originalText;
    }
}

// পাসওয়ার্ড ভিউ/হাইড টগল
function togglePasswordVisibility(inputId, iconBtn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    const icon = iconBtn.querySelector("i");
    if (icon) {
        icon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    }
}

// ==========================================================================
// ৫. ইউজার লগআউট সিস্টেম
// ==========================================================================
async function handleUserLogout() {
    if (confirm("আপনি কি নিশ্চিতভাবে অ্যাকাউন্ট থেকে লগআউট করতে চান?")) {
        try {
            await firebase.auth().signOut();
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            alert("লগআউটে সমস্যা হয়েছে: " + error.message);
        }
    }
}

// উইন্ডো এক্সপোর্ট
window.handleProfileSave = handleProfileSave;
window.handlePasswordChange = handlePasswordChange;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleUserLogout = handleUserLogout;

