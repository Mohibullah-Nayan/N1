// এই ফাংশনটি কন্টাক্ট ফর্মের মেসেজ সাবমিশন হ্যান্ডেল করে, ইউজার লগইন চেক করে ফায়ারস্টোর ডাটাবেসে মেসেজ সংরক্ষণ করে
window.handleContactSubmit = async function(e) {
            e.preventDefault();

            // ১. ফায়ারবেস কমপ্যাট ভার্সন দিয়ে চেক করা ইউজার লগইন করা আছে কিনা
            const currentUser = firebase.auth().currentUser;

            if (!currentUser) {
                alert('⚠️ Please log in first to send a message!');
                window.location.href = "login.html"; // লগইন পেজের লিংক
                return;
            }

            const nameInput = e.target.querySelector('input[type="text"]');
            const emailInput = e.target.querySelector('input[type="email"]');
            const messageInput = e.target.querySelector('textarea');
            const submitBtn = e.target.querySelector('button[type="submit"]');

            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';

            if (!name || !email || !message) {
                alert('Please fill out all fields.');
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Sending...';
            }

            try {
                // হ্যাশ আইডির বদলে সহজে চেনার মতো ক্লিয়ার আইডি (যেমন: MSG-20261024-4821) তৈরি
                const msgDocId = "MSG-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

                await firebase.firestore().collection("messages").doc(msgDocId).set({
                    id: msgDocId,
                    name: name,
                    email: email,
                    message: message,
                    userId: currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Your message has been sent successfully! Thank you. 🚀');
                e.target.reset();
            } catch (error) {
                console.error("Error sending message: ", error);
                alert('Failed to send message. Please try again.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit';
                }
            }
        }