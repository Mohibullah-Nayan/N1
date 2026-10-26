/* ==========================================================================
   SCENT LUXURY PERFUMES - ADMIN MESSAGES MODULE (js/admin-messages.js)
   --------------------------------------------------------------------------
   - Customer Contact Form Messages Real-time Fetch & Card Renderer
   - Unread Message Counter Badge
   - Admin Direct Email Reply & History Tracker
   - Customer Message Delete Controller
   ========================================================================== */

import { db } from './admin.js';
import { collection, addDoc, setDoc, getDocs, getDoc, query, deleteDoc, doc, serverTimestamp, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

    let adminMessagesRealtimeUnsub = null;

    // এই ফাংশনটি স্ট্রিংয়ের স্পেশাল ক্যারেক্টারকে সুরক্ষিত HTML এনটিটিতে রূপান্তর করে
    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    // ==========================================================================
    // ১১. কাস্টমার মেসেজ ইনবক্স ও ম্যানেজমেন্ট (Customer Messages Inbox)
    // ==========================================================================
    // এই ফাংশনটি কন্টাক্ট ফর্ম থেকে আসা কাস্টমার মেসেজগুলো রিয়েল-টাইমে ড্যাশবোর্ডে লোড করে
    async function loadAdminMessages() {
        const msgContainer = document.getElementById('admin-messages-list');
        const msgCountEl = document.getElementById('msg-count');
        
        if (!msgContainer) return;

        try {
            if (adminMessagesRealtimeUnsub) {
                adminMessagesRealtimeUnsub();
            }

            adminMessagesRealtimeUnsub = onSnapshot(collection(db, "messages"), (querySnapshot) => {
                msgContainer.innerHTML = "";
                let count = querySnapshot.size;
                
                if (msgCountEl) {
                    msgCountEl.innerText = `${count} Message${count !== 1 ? 's' : ''}`;
                }

                if (querySnapshot.empty) {
                    msgContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6 font-medium"><i class="fa-regular fa-comments text-2xl block mb-1.5 opacity-40"></i> No customer messages found.</p>`;
                    return;
                }

                querySnapshot.forEach((docSnap) => {
                    let data = docSnap.data();
                    let docId = docSnap.id;
                    
                    let dateStr = "Recent";
                    if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                        dateStr = data.timestamp.toDate().toLocaleString();
                    } else if (data.date) {
                        dateStr = data.date;
                    }

                    let initials = (data.name || 'Anonymous').slice(0, 2).toUpperCase();
                    let isReplied = !!data.reply || data.status === 'Replied';

                    msgContainer.innerHTML += `
                        <div class="border ${isReplied ? 'border-emerald-200/90 bg-emerald-50/20' : 'border-slate-200 bg-gradient-to-r from-slate-50/80 via-white to-rose-50/20'} rounded-2xl p-4 sm:p-5 hover:bg-white hover:shadow-md hover:border-blue-500/30 transition-all space-y-3 group">
                            <div class="flex justify-between items-start gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl ${isReplied ? 'bg-gradient-to-tr from-emerald-500 to-teal-600' : 'bg-gradient-to-tr from-rose-500 to-pink-500'} text-white font-black flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                                        ${initials}
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <h4 class="font-bold text-slate-900 text-sm">${data.name || 'Anonymous'}</h4>
                                            ${isReplied ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><i class="fa-solid fa-check-double text-[9px]"></i> Replied</span>' : '<span class="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">Pending</span>'}
                                        </div>
                                        <p class="text-xs text-[#F26522] font-semibold flex items-center gap-1.5 mt-0.5">
                                            <i class="fa-solid fa-envelope text-[10px]"></i>
                                            <a href="mailto:${data.email || ''}" class="hover:underline">${data.email || 'No Email'}</a>
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-[11px] text-slate-400 font-medium bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">${dateStr}</span>
                                    
                                    <!-- রিপ্লাই বাটন -->
                                    <button onclick="openReplyModal('${docId}', '${escapeHtml(data.name || 'Customer')}', '${escapeHtml(data.email || '')}', '${escapeHtml(data.message || '')}', '${escapeHtml(data.reply || '')}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200/80 transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer" title="Reply to Customer Email">
                                        <i class="fa-solid fa-reply text-[10px]"></i>
                                        <span>${isReplied ? 'Edit Reply' : 'Reply'}</span>
                                    </button>

                                    <!-- ডিলিট বাটন -->
                                    <button onclick="deleteCustomerMessage('${docId}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer" title="Delete Message">
                                        <i class="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- কাস্টমারের বার্তা -->
                            <div class="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium shadow-2xs">
                                "${data.message || ''}"
                            </div>

                            <!-- যদি পূর্বে কোনো রিপ্লাই দেওয়া হয়ে থাকে -->
                            ${data.reply ? `
                            <div class="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                                <div class="flex items-center justify-between text-[11px] font-bold text-blue-800">
                                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-reply-all text-blue-600"></i> Admin Reply:</span>
                                    <span class="text-slate-400 font-normal">${data.repliedAt ? (typeof data.repliedAt.toDate === 'function' ? data.repliedAt.toDate().toLocaleString() : data.repliedAt) : 'Replied'}</span>
                                </div>
                                <p class="font-medium text-slate-800 leading-relaxed whitespace-pre-line">"${data.reply}"</p>
                            </div>
                            ` : ''}
                        </div>
                    `;
                });
            });
        } catch (error) {
            console.error("Error loading messages: ", error);
            msgContainer.innerHTML = `<p class="text-xs text-rose-500 text-center py-4">Failed to load: ${error.message}</p>`;
        }
    }

    // এই ফাংশনটি কাস্টমারকে ইমেইলে রিপ্লাই দেওয়ার মডাল পপআপ ওপেন করে
    window.openReplyModal = function(docId, name, email, customerMsg, existingReply = '') {
        const modal = document.getElementById('reply-message-modal');
        if (!modal) return;

        document.getElementById('reply-modal-msg-id').value = docId;
        document.getElementById('reply-modal-recipient-email').value = email;
        document.getElementById('reply-modal-recipient-name').value = name;

        const targetLabel = document.getElementById('reply-modal-target');
        if (targetLabel) {
            targetLabel.innerText = `To: ${name} <${email || 'No email specified'}>`;
        }

        const inquiryEl = document.getElementById('reply-modal-customer-text');
        if (inquiryEl) {
            inquiryEl.innerText = `"${customerMsg}"`;
        }

        const subjectInput = document.getElementById('reply-modal-subject');
        if (subjectInput) {
            subjectInput.value = `Response to your inquiry - SCENT Luxury Perfumes`;
        }

        const bodyInput = document.getElementById('reply-modal-body');
        if (bodyInput) {
            if (existingReply) {
                bodyInput.value = existingReply;
            } else {
                bodyInput.value = `Dear ${name},\n\nThank you for reaching out to SCENT Luxury Perfumes & Attar Atelier.\n\nRegarding your inquiry:\n"${customerMsg}"\n\n\n\nIf you have any further questions or need custom perfume recommendations, please feel free to reply to this email.\n\nWarm regards,\nCustomer Concierge Team\nSCENT ATELIER\nHotline: +880 1234-567890`;
            }
        }

        modal.classList.remove('hidden');
    };

    // এই ফাংশনটি কাস্টমার রিপ্লাই মডাল বন্ধ করে
    window.closeReplyModal = function() {
        const modal = document.getElementById('reply-message-modal');
        if (modal) modal.classList.add('hidden');
    };

    // এই ফাংশনটি রিপ্লাইয়ের তথ্য ফায়ারস্টোর ডাটাবেসে সেভ করে
    async function saveReplyToFirestore(docId, replyText, subject) {
        if (!docId) return;
        try {
            await updateDoc(doc(db, "messages", docId), {
                reply: replyText.trim(),
                replySubject: subject.trim(),
                status: 'Replied',
                repliedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Error updating reply status in Firestore:", err);
        }
    }

    // এই ফাংশনটি রিপ্লাই মেসেজ ফায়ারস্টোরে সেভ করার পাশাপাশি অ্যাডমিনের ইমেইল ক্লায়েন্টে (Gmail/Outlook) ওপেন করে
    window.sendReplyViaEmail = async function() {
        const docId = document.getElementById('reply-modal-msg-id')?.value;
        const email = document.getElementById('reply-modal-recipient-email')?.value.trim();
        const subject = document.getElementById('reply-modal-subject')?.value.trim();
        const body = document.getElementById('reply-modal-body')?.value.trim();

        if (!email) {
            alert("Customer email address is missing.");
            return;
        }

        if (!body) {
            alert("Please enter a response message.");
            return;
        }

        // ফায়ারস্টোরে হিস্টোরিক্যাল রেকর্ড সেভ করা
        await saveReplyToFirestore(docId, body, subject);

        // অ্যাডমিনের ডিফল্ট ইমেইল ক্লায়েন্ট বা জিমেইল ওপেন করা
        const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');

        alert(`✓ Reply recorded and email client opened for: ${email}`);
        closeReplyModal();
    };

    // এই ফাংশনটি শুধুমাত্র ডাটাবেসে রিপ্লাই রেকর্ড সেভ করে (যদি অ্যাডমিন আলাদা কোনো মাধ্যমে উত্তর দিয়ে থাকেন)
    window.saveReplyRecordOnly = async function() {
        const docId = document.getElementById('reply-modal-msg-id')?.value;
        const subject = document.getElementById('reply-modal-subject')?.value.trim();
        const body = document.getElementById('reply-modal-body')?.value.trim();

        if (!body) {
            alert("Please enter a response message.");
            return;
        }

        await saveReplyToFirestore(docId, body, subject);
        alert("✓ Reply record successfully saved to database!");
        closeReplyModal();
    };

    // এই ফাংশনটি কাস্টমার মেসেজ ডাটাবেস থেকে ডিলিট করে
    window.deleteCustomerMessage = async function(docId) {
        if (confirm("Are you sure you want to delete this message?")) {
            try {
                await deleteDoc(doc(db, "messages", docId));
                // onSnapshot স্বয়ংক্রিয়ভাবে তালিকা আপডেট করবে
            } catch (error) {
                console.error("Error deleting message: ", error);
                alert("Failed to delete message: " + error.message);
            }
        }
    };


// Window Global Exports
window.loadAdminMessages = loadAdminMessages;
window.deleteCustomerMessage = deleteCustomerMessage;
window.openReplyModal = openReplyModal;
window.closeReplyModal = closeReplyModal;
window.sendReplyViaEmail = sendReplyViaEmail;
window.saveReplyRecordOnly = saveReplyRecordOnly;
