// Firebase Configuration
      const firebaseConfig = {
        apiKey: "AIzaSyD6TSzBthiUw_HkKfBc3hkQnw_mQEs8FZU",
        authDomain: "nayan-bc068.firebaseapp.com",
        projectId: "nayan-bc068",
        storageBucket: "nayan-bc068.firebasestorage.app",
        messagingSenderId: "782323259018",
        appId: "1:782323259018:web:a428fe0d96897711223f73",
        measurementId: "G-8PJVBLSPZV",
      };

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);

      const auth = firebase.auth();
      const db = firebase.firestore();

      // Admin Login Logic
      document
        .getElementById("adminLoginForm")
        // এই ফাংশনটি অ্যাডমিনের ইমেইল ও পাসওয়ার্ড যাচাই করে এবং শুধুমাত্র অথরাইজড অ্যাডমিন রোল থাকলে অ্যাডমিন প্যানেলে প্রবেশাধিকার দেয়
        .addEventListener("submit", async function (event) {
          event.preventDefault();

          const email = document.getElementById("adminEmail").value.trim();
          const password = document.getElementById("adminPassword").value;
          const message = document.getElementById("message");

          message.style.color = "#94a3b8";
          message.textContent = "Authenticating with Firebase... please wait.";

          const loginBtn = document.querySelector(".login-btn");
          loginBtn.disabled = true;
          loginBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

          try {
            const userCredential = await auth.signInWithEmailAndPassword(
              email,
              password,
            );
            const user = userCredential.user;

            const userDoc = await db.collection("users").doc(user.uid).get();

            if (!userDoc.exists) {
              message.style.color = "#fb7185";
              message.textContent = "Access denied: Admin record not found.";
              await auth.signOut();
              return;
            }

            const userData = userDoc.data();
            if (userData.role !== "admin") {
              message.style.color = "#fb7185";
              message.textContent = "Access denied: Unauthorized role.";
              await auth.signOut();
              return;
            }

            message.style.color = "#34d399";
            message.textContent = "✓ Access granted! Redirecting to Dashboard...";

            setTimeout(() => {
              window.location.href = "admin.html";
            }, 600);
          } catch (error) {
            console.error("Admin login error:", error);
            message.style.color = "#fb7185";

            if (
              error.code === "auth/invalid-credential" ||
              error.code === "auth/wrong-password" ||
              error.code === "auth/user-not-found"
            ) {
              message.textContent = "Invalid administrator email or password.";
            } else {
              message.textContent = error.message;
            }
          } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML =
              '<i class="fa-solid fa-right-to-bracket"></i> <span>Secure Login</span>';
          }
        });