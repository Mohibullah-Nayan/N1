import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

        const firebaseConfig = {
            apiKey: "AIzaSyD6TSzBthiUw_HkKfBc3hkQnw_mQEs8FZU",
            authDomain: "nayan-bc068.firebaseapp.com",
            projectId: "nayan-bc068",
            storageBucket: "nayan-bc068.firebasestorage.app",
            messagingSenderId: "782323259018",
            appId: "1:782323259018:web:a428fe0d96897711223f73",
            measurementId: "G-8PJVBLSPZV"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const googleProvider = new GoogleAuthProvider();
        const facebookProvider = new FacebookAuthProvider();

        const myRealAdminEmail = "mohibullahnayan.cse@gmail.com";

        // ইমেইল পাসওয়ার্ড লগইন
        // এই ফাংশনটি ইমেইল ও পাসওয়ার্ড যাচাই করে ফায়ারবেস অথেন্টিকেশনের মাধ্যমে অ্যাডমিন বা গ্রাহক লগইন নিশ্চিত করে
        window.handleAdminLogin = async function(e) {
            e.preventDefault();
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                if (email.toLowerCase() === myRealAdminEmail.toLowerCase()) {
                    alert('Welcome, Admin! 🎉');
                    window.location.href = 'admin.html';
                } else {
                    alert('Login successful! 🎉');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                alert('Login failed! Please check your email or password.');
                console.error(error);
            }
        }

        // গুগল দিয়ে লগইন
        // এই ফাংশনটি গুগল পপআপ অ্যাকাউন্টের মাধ্যমে গ্রাহক বা অ্যাডমিনকে অথেনটিকেশন ও লগইন করায়
        window.handleGoogleLogin = async function() {
            try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                if (user.email && user.email.toLowerCase() === myRealAdminEmail.toLowerCase()) {
                    alert('Welcome, Admin! 🎉');
                    window.location.href = 'admin.html';
                } else {
                    alert('Google Login successful! 🎉');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                alert('Google Login failed: ' + error.message);
                console.error(error);
            }
        }

        // ফেসবুক দিয়ে লগইন
        // এই ফাংশনটি ফেসবুক পপআপ অ্যাকাউন্টের মাধ্যমে গ্রাহক বা অ্যাডমিনকে অথেনটিকেশন ও লগইন করায়
        window.handleFacebookLogin = async function() {
            try {
                const result = await signInWithPopup(auth, facebookProvider);
                const user = result.user;
                
                if (user.email && user.email.toLowerCase() === myRealAdminEmail.toLowerCase()) {
                    alert('Welcome, Admin! 🎉');
                    window.location.href = 'admin.html';
                } else {
                    alert('Facebook Login successful! 🎉');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                alert('Facebook Login failed: ' + error.message);
                console.error(error);
            }
        }