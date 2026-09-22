(function(){
  "use strict";
  const config = window.BAYIIRA_FIREBASE_CONFIG;
  if (!window.firebase || !config) {
    console.error("Bayiira: Firebase SDK/config failed to load.");
    const box=document.getElementById("error"); if(box){box.textContent="The registration system could not load Firebase. Check your internet connection and reload.";box.style.display="block";}
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(config);
  const db = firebase.firestore();
  const form=document.getElementById("registrationForm"), submitBtn=document.getElementById("submitBtn");
  const success=document.getElementById("success"), errorBox=document.getElementById("error");
  const submissionSuccess=document.getElementById("submissionSuccess"), registrationReference=document.getElementById("registrationReference");
  const submitAnotherBtn=document.getElementById("submitAnotherBtn"), passportPhoto=document.getElementById("passportPhoto"), passportPreview=document.getElementById("passportPreview");
  if(!form||!submitBtn||!success||!errorBox||!submissionSuccess||!registrationReference||!submitAnotherBtn||!passportPhoto||!passportPreview){console.error("Bayiira: required registration elements are missing.");return;}
  function message(el,text){el.textContent=text;el.style.display="block";}
  function hide(el){el.textContent="";el.style.display="none";}
  function resetPassportPreview(){passportPreview.innerHTML="<span>Passport photo preview</span>";}
  function photoToDataUrl(file,maxW=420,maxH=525,quality=.70){
    return new Promise((resolve,reject)=>{
      if(!file) return reject(new Error("Passport photo is required."));
      if(!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Passport photo must be JPG, PNG or WebP."));
      if(file.size>5*1024*1024) return reject(new Error("Passport photo must be 5 MB or smaller."));
      const reader=new FileReader();
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight,r=Math.min(1,maxW/w,maxH/h);w=Math.max(1,Math.round(w*r));h=Math.max(1,Math.round(h*r));const c=document.createElement("canvas");c.width=w;c.height=h;const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);resolve(c.toDataURL("image/jpeg",quality));};
        img.onerror=()=>reject(new Error("The passport photo could not be read.")); img.src=reader.result;
      };
      reader.onerror=()=>reject(new Error("The passport photo could not be read."));
      reader.readAsDataURL(file);
    });
  }
  passportPhoto.addEventListener("change",()=>{
    const f=passportPhoto.files&&passportPhoto.files[0];
    resetPassportPreview();
    if(!f)return;
    if(f.size>5*1024*1024){passportPhoto.value="";passportPreview.innerHTML="<span>Photo is too large</span>";return;}
    if(!/^image\/(jpeg|png|webp)$/.test(f.type)){passportPhoto.value="";passportPreview.innerHTML="<span>Use JPG, PNG or WebP</span>";return;}
    const reader=new FileReader();
    reader.onload=()=>{passportPreview.innerHTML="";const img=document.createElement("img");img.src=reader.result;img.alt="Passport preview";passportPreview.appendChild(img);};
    reader.readAsDataURL(f);
  });
  const uploadBox=passportPhoto.closest(".upload-box");
  if(uploadBox){
    ["dragover","dragenter"].forEach(evt=>uploadBox.addEventListener(evt,e=>{e.preventDefault();e.stopPropagation();}));
    ["drop"].forEach(evt=>uploadBox.addEventListener(evt,e=>{e.preventDefault();e.stopPropagation();}));
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();hide(success);hide(errorBox);
    if(!form.checkValidity()){form.reportValidity();return;}
    const file=passportPhoto.files&&passportPhoto.files[0]; if(!file){message(errorBox,"Please upload the member's passport photo.");return;}
    submitBtn.disabled=true;submitBtn.textContent="SUBMITTING...";
    try{
      const data={}; new FormData(form).forEach((v,k)=>{if(k!=="agreement"&&k!=="passportPhoto")data[k]=v;});
      data.fullName=((data.firstName||"")+" "+(data.lastName||"")).trim();
      data.status="pending";
      data.membershipStatus="pending";
      data.passportPhotoUrl=await photoToDataUrl(file);
      data.submittedAt=firebase.firestore.FieldValue.serverTimestamp();
      data.updatedAt=firebase.firestore.FieldValue.serverTimestamp();
      const ref=await db.collection("members").add(data);
      registrationReference.textContent=ref.id;
      form.reset();
      resetPassportPreview();
      hide(errorBox); hide(success);
      submitBtn.disabled=false;submitBtn.textContent="SUBMIT MEMBERSHIP REGISTRATION";
      form.classList.add("hidden"); submissionSuccess.classList.remove("hidden"); window.scrollTo({top:0,behavior:"smooth"});
    }catch(err){
      console.error("Registration submission failed:",err);
      message(errorBox,(err&&err.code==="permission-denied")?"Registration failed: Firestore denied the registration. Publish the included firestore.rules to your Firebase project, then reload the form.":"Registration failed: "+(err&&err.message?err.message:"Please check your connection and try again."));
      submitBtn.disabled=false;submitBtn.textContent="SUBMIT MEMBERSHIP REGISTRATION";
    }
  });
  submitAnotherBtn.addEventListener("click",()=>{
    form.reset();resetPassportPreview();hide(success);hide(errorBox);submitBtn.disabled=false;submitBtn.textContent="SUBMIT MEMBERSHIP REGISTRATION";
    submissionSuccess.classList.add("hidden");form.classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"});
  });
})();
