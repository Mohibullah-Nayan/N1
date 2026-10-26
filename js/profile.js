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
// এই ফাংশনটি প্রোফাইল আপডেট বা ভুলের বার্তা দিয়ে কালারফুল অ্যালার্ট টোস্ট নোটিফিকেশন প্রদর্শন করে
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
                alert("⚠️ You are logged in as an Admin. This customer profile form is not applicable for admin roles. Redirecting to admin dashboard...");
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
// এই ফাংশনটি কাস্টমারের নাম, ফোন নম্বর, জেন্ডার ও ডেলিভারি ঠিকানা যাচাই করে ফায়ারস্টোরে সেভ করে
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
        showProfileAlert("Please enter your full name.", false);
        document.getElementById("profile-name").focus();
        return;
    }

    // বাংলাদেশী মোবাইল নম্বর ভ্যালিডেশন
    const cleanPhone = phone.replace(/[\s\-\+]/g, "");
    if (phone && !/^(?:8801|01)[3-9]\d{8}$/.test(cleanPhone)) {
        showProfileAlert("Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).", false);
        document.getElementById("profile-phone").focus();
        return;
    }

    const saveBtn = document.getElementById("save-profile-btn");
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

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

        showProfileAlert("✓ Profile details saved and updated successfully!", true);
    } catch (error) {
        console.error("Error updating profile:", error);
        showProfileAlert("Failed to update profile: " + error.message, false);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

// ==========================================================================
// ৪. সিকিউর পাসওয়ার্ড পরিবর্তন (Firebase Auth Password Update)
// ==========================================================================
// এই ফাংশনটি ফায়ারবেস অথেন্টিকেশনের মাধ্যমে ইউজারের সিকিউর একাউন্ট পাসওয়ার্ড পরিবর্তন করে
async function handlePasswordChange(event) {
    if (event) event.preventDefault();
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    const newPassword = document.getElementById("profile-new-password").value;
    const confirmPassword = document.getElementById("profile-confirm-password").value;

    if (!newPassword || newPassword.length < 6) {
        showProfileAlert("New password must be at least 6 characters.", false);
        document.getElementById("profile-new-password").focus();
        return;
    }

    if (newPassword !== confirmPassword) {
        showProfileAlert("New password and confirm password do not match!", false);
        document.getElementById("profile-confirm-password").focus();
        return;
    }

    const changeBtn = document.getElementById("change-password-btn");
    const originalText = changeBtn.innerHTML;
    changeBtn.disabled = true;
    changeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating password...';

    try {
        await currentUser.updatePassword(newPassword);
        document.getElementById("profile-new-password").value = "";
        document.getElementById("profile-confirm-password").value = "";
        showProfileAlert("✓ Password changed successfully!", true);
    } catch (error) {
        console.error("Error updating password:", error);
        if (error.code === "auth/requires-recent-login") {
            alert("For security reasons, please log in again before changing password.");
            await firebase.auth().signOut();
            window.location.href = "login.html";
        } else {
            showProfileAlert("Failed to change password: " + error.message, false);
        }
    } finally {
        changeBtn.disabled = false;
        changeBtn.innerHTML = originalText;
    }
}

// পাসওয়ার্ড ভিউ/হাইড টগল
// এই ফাংশনটি পাসওয়ার্ড ইনপুটের টাইপ (Password/Text) এবং চোখের আইকন টগল করে পাসওয়ার্ড প্রদর্শন করে
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
// এই ফাংশনটি ইউজারকে ফায়ারবেস অথেন্টিকেশন থেকে লগআউট করিয়ে লগইন পেজে পাঠায়
async function handleUserLogout() {
    if (confirm("Are you sure you want to log out of your account?")) {
        try {
            await firebase.auth().signOut();
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout error: " + error.message);
        }
    }
}

// উইন্ডো এক্সপোর্ট
window.handleProfileSave = handleProfileSave;
window.handlePasswordChange = handlePasswordChange;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleUserLogout = handleUserLogout;

