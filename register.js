// ইউজার রেজিস্ট্রেশন হ্যান্ডেল করার ফাংশন
function handleRegister(event) {
    event.preventDefault(); // পেজ রিলোড হওয়া বন্ধ করবে

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const gender = document.getElementById('register-gender').value;
    const dob = document.getElementById('register-dob').value;
    const address = document.getElementById('register-address').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // পাসওয়ার্ড মিলছে কিনা চেক করা
    if (password !== confirmPassword) {
        alert("পাসওয়ার্ড দুটি মিল নেই! অনুগ্রহ করে পুনরায় চেক করুন।");
        return;
    }

    // ফায়ারবেস অথেন্টিকেশন দিয়ে ইউজার তৈরি করা
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // ফায়ারস্টোর ডেটাবেজে ইউজারের অতিরিক্ত তথ্য ও কাস্টমার রোল সেভ করা
            return firebase.firestore().collection("users").doc(user.uid).set({
                uid: user.uid,
                fullName: name,
                email: email,
                phone: phone,
                gender: gender,
                dateOfBirth: dob,
                shippingAddress: address,
                role: "customer", // নতুন ইউজাররা সবাই সাধারণ কাস্টমার হিসেবে থাকবে
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert("welcome! Your account has been created successfully.");
            window.location.href = "index.html"; // সফল হলে হোমপেজে রিডাইরেক্ট করবে
        })
        .catch((error) => {
            console.error("Error occurred while registering: ", error);
            alert("Error: " + error.message);
        });
}