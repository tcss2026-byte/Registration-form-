import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-runtime.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const success = document.getElementById("success");
const errorBox = document.getElementById("error");
const submissionSuccess = document.getElementById("submissionSuccess");
const registrationReference = document.getElementById("registrationReference");
const submitAnotherBtn = document.getElementById("submitAnotherBtn");

if (!form || !submitBtn || !success || !errorBox || !submissionSuccess || !registrationReference || !submitAnotherBtn) {
  console.error("Bayiira registration page: required form elements were not found.");
} else {
  const showMessage = (el, message) => {
    el.textContent = message;
    el.style.display = "block";
  };

  const hideMessage = (el) => {
    el.textContent = "";
    el.style.display = "none";
  };

  const showSubmittedState = (reference) => {
    registrationReference.textContent = reference;
    form.classList.add("hidden");
    submissionSuccess.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showFormState = () => {
    submissionSuccess.classList.add("hidden");
    form.classList.remove("hidden");
    form.reset();
    hideMessage(success);
    hideMessage(errorBox);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage(success);
    hideMessage(errorBox);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Submitting...';

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.agreement;
      data.fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      data.status = "pending";
      data.submittedAt = serverTimestamp();
      data.updatedAt = serverTimestamp();

      const ref = await addDoc(collection(db, "members"), data);
      showSubmittedState(ref.id);
    } catch (error) {
      console.error("Registration submission failed:", error);
      showMessage(errorBox, "Registration could not be submitted. Please check your internet connection and Firebase configuration, then try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "SUBMIT MEMBERSHIP REGISTRATION";
    }
  });

  submitAnotherBtn.addEventListener("click", showFormState);
}
