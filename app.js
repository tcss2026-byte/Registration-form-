import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-runtime.js";

const CLOUDINARY_CLOUD_NAME = "k5bsrnx1";
const CLOUDINARY_UPLOAD_PRESET = "new-conquerors";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const success = document.getElementById("success");
const errorBox = document.getElementById("error");
const submissionSuccess = document.getElementById("submissionSuccess");
const registrationReference = document.getElementById("registrationReference");
const submitAnotherBtn = document.getElementById("submitAnotherBtn");
const passportPhoto = document.getElementById("passportPhoto");
const passportPreview = document.getElementById("passportPreview");

async function uploadToCloudinary(file, folder) {
  if (!file) throw new Error("Passport photo is required.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Passport photo must be 5 MB or smaller.");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Passport photo must be JPG, PNG or WebP.");
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  body.append("folder", folder);
  let response;
  try {
    response = await fetch(CLOUDINARY_URL, { method: "POST", body, mode: "cors", credentials: "omit" });
  } catch (networkError) {
    throw new Error(`Cloudinary could not be reached. Check your internet connection and confirm that upload preset "${CLOUDINARY_UPLOAD_PRESET}" exists and is set to Unsigned in Cloudinary. (${networkError.message || "network error"})`);
  }
  let result = {};
  try { result = await response.json(); } catch (_) {}
  if (!response.ok || !result.secure_url) {
    const detail = result?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Cloudinary upload failed: ${detail}. Cloud: ${CLOUDINARY_CLOUD_NAME}; Preset: ${CLOUDINARY_UPLOAD_PRESET}`);
  }
  return result.secure_url;
}

passportPhoto?.addEventListener("change", () => {
  const file = passportPhoto.files?.[0];
  if (!file) { passportPreview.innerHTML = "<span>Passport photo preview</span>"; return; }
  if (file.size > 5 * 1024 * 1024) { passportPhoto.value = ""; passportPreview.innerHTML = "<span>Photo is too large</span>"; return; }
  const url = URL.createObjectURL(file);
  passportPreview.innerHTML = `<img src="${url}" alt="Passport preview">`;
});

if (!form || !submitBtn || !success || !errorBox || !submissionSuccess || !registrationReference || !submitAnotherBtn) {
  console.error("Bayiira registration page: required form elements were not found.");
} else {
  const showMessage = (el, message) => { el.textContent = message; el.style.display = "block"; };
  const hideMessage = (el) => { el.textContent = ""; el.style.display = "none"; };
  const showSubmittedState = (reference) => { registrationReference.textContent = reference; form.classList.add("hidden"); submissionSuccess.classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const showFormState = () => { submissionSuccess.classList.add("hidden"); form.classList.remove("hidden"); form.reset(); passportPreview.innerHTML = "<span>Passport photo preview</span>"; hideMessage(success); hideMessage(errorBox); window.scrollTo({ top: 0, behavior: "smooth" }); };

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); hideMessage(success); hideMessage(errorBox);
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!passportPhoto.files?.[0]) { showMessage(errorBox, "Please upload the member's passport photo."); return; }
    submitBtn.disabled = true; submitBtn.innerHTML = '<span class="spinner"></span>Uploading photo & submitting...';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      delete data.agreement; delete data.passportPhoto;
      data.passportPhotoUrl = await uploadToCloudinary(passportPhoto.files[0], "bayiira/members/passports");
      data.fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      data.status = "pending";
      data.submittedAt = serverTimestamp(); data.updatedAt = serverTimestamp();
      const ref = await addDoc(collection(db, "members"), data);
      showSubmittedState(ref.id);
    } catch (error) {
      console.error("Registration submission failed:", error);
      const code = error?.code ? ` [${error.code}]` : "";
      const message = error?.message || "Registration could not be submitted. Please try again.";
      showMessage(errorBox, `Registration failed${code}: ${message}`);
      submitBtn.disabled = false; submitBtn.textContent = "SUBMIT MEMBERSHIP REGISTRATION";
    }
  });
  submitAnotherBtn.addEventListener("click", showFormState);
}
