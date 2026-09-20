import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  EmailAuthProvider, reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-runtime.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginView=document.getElementById("loginView"), dashboardView=document.getElementById("dashboardView");
const email=document.getElementById("email"), password=document.getElementById("password");
const loginBtn=document.getElementById("loginBtn"), loginError=document.getElementById("loginError");
const membersBody=document.getElementById("membersBody"), search=document.getElementById("search"), statusFilter=document.getElementById("statusFilter");
const modal=document.getElementById("detailModal"), detailBody=document.getElementById("detailBody");

let members=[];

function msg(el,text){el.textContent=text;el.style.display="block"}
function hide(el){el.style.display="none"}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function dateText(v){ if(!v) return "—"; try { return v.toDate().toLocaleString(); } catch { return String(v); } }
function statusBadge(s){s=s||"pending";return `<span class="badge badge-${esc(s)}">${esc(s.toUpperCase())}</span>`}

if (!loginBtn || !email || !password || !loginView || !dashboardView || !loginError || !membersBody || !search || !statusFilter || !modal || !detailBody) {
  console.error("Bayiira admin page: required dashboard elements were not found.");
} else loginBtn.onclick=async()=>{
  hide(loginError); loginBtn.disabled=true; loginBtn.textContent="Signing in...";
  try{
    const cred=await signInWithEmailAndPassword(auth,email.value.trim(),password.value);
    if(cred.user.email.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){
      await signOut(auth); throw new Error("This account is not authorized as administrator.");
    }
  }catch(e){console.error(e);msg(loginError,e.code==="auth/invalid-credential"?"Invalid administrator email or password.":e.message)}
  finally{loginBtn.disabled=false;loginBtn.textContent="LOGIN"}
};
password.addEventListener("keydown",e=>{if(e.key==="Enter")loginBtn.click()});
const logoutBtn=document.getElementById("logoutBtn");
if(logoutBtn) logoutBtn.onclick=()=>signOut(auth);

onAuthStateChanged(auth,user=>{
  if(user && user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()){
    loginView.classList.add("hidden");dashboardView.classList.remove("hidden");listenMembers();
  }else{
    dashboardView.classList.add("hidden");loginView.classList.remove("hidden");
  }
});

function listenMembers(){
  const q=query(collection(db,"members"),orderBy("submittedAt","desc"));
  onSnapshot(q,snap=>{
    members=snap.docs.map(d=>({id:d.id,...d.data()}));
    render();
  },err=>{
    console.error(err); membersBody.innerHTML=`<tr><td colspan="6" class="empty">Unable to load registrations. Check Firestore Rules.</td></tr>`;
  });
}

function render(){
  const term=search.value.trim().toLowerCase(), filter=statusFilter.value;
  const filtered=members.filter(m=>{
    const hay=[m.fullName,m.firstName,m.lastName,m.phone,m.email,m.district,m.id].join(" ").toLowerCase();
    return (!term||hay.includes(term)) && (filter==="all"||((m.status||"pending")===filter));
  });
  const counts={pending:0,approved:0,rejected:0};
  members.forEach(m=>counts[m.status||"pending"]=(counts[m.status||"pending"]||0)+1);
  document.getElementById("totalCount").textContent=members.length;
  document.getElementById("pendingCount").textContent=counts.pending||0;
  document.getElementById("approvedCount").textContent=counts.approved||0;
  document.getElementById("rejectedCount").textContent=counts.rejected||0;
  if(!filtered.length){membersBody.innerHTML=`<tr><td colspan="6" class="empty">No registrations found.</td></tr>`;return}
  membersBody.innerHTML=filtered.map(m=>`<tr>
    <td><strong>${esc(m.fullName||"Unnamed")}</strong><br><small>${esc(m.email||"No email")}</small></td>
    <td>${esc(m.phone||"—")}</td>
    <td>${esc(m.membershipType||"—")}<br>${esc(m.membershipCategory||"—")}</td>
    <td>${esc(dateText(m.submittedAt))}</td>
    <td>${statusBadge(m.status)}</td>
    <td><div class="actions">
      <button class="btn btn-secondary btn-small" data-action="view" data-id="${esc(m.id)}">View</button>
      ${m.status!=="approved"?`<button class="btn btn-primary btn-small" data-action="approve" data-id="${esc(m.id)}">Approve</button>`:""}
      ${m.status!=="rejected"?`<button class="btn btn-danger btn-small" data-action="reject" data-id="${esc(m.id)}">Reject</button>`:""}
      <button class="btn btn-danger btn-small" data-action="delete" data-id="${esc(m.id)}">Delete</button>
    </div></td>
  </tr>`).join("");
}

membersBody.addEventListener("click",async e=>{
  const b=e.target.closest("button"); if(!b)return;
  const m=members.find(x=>x.id===b.dataset.id); if(!m)return;
  const action=b.dataset.action;
  if(action==="view"){openDetails(m);return}
  if(action==="approve"||action==="reject"){
    const next=action==="approve"?"approved":"rejected";
    if(!confirm(`Set ${m.fullName||"this member"} as ${next}?`))return;
    try{await updateDoc(doc(db,"members",m.id),{status:next,updatedAt:new Date()})}
    catch(err){alert("Could not update this member: "+err.message)}
    return;
  }
  if(action==="delete"){
    const ok=confirm(`Permanently delete ${m.fullName||"this member"} from Firebase?\n\nThis cannot be undone.`);
    if(!ok)return;
    const pw=prompt("Enter the administrator password to permanently delete this member:");
    if(pw===null)return;
    if(!pw){alert("Password is required.");return}
    try{
      const user=auth.currentUser;
      const credential=EmailAuthProvider.credential(user.email,pw);
      await reauthenticateWithCredential(user,credential);
      await deleteDoc(doc(db,"members",m.id));
      alert("Member deleted permanently from Firebase.");
    }catch(err){
      console.error(err);
      alert(err.code==="auth/invalid-credential"?"Incorrect administrator password. Member was NOT deleted.":"Delete failed. Member was NOT deleted.");
    }
  }
});

function openDetails(m){
  const entries=Object.entries(m).filter(([k])=>k!=="id"&&k!=="updatedAt");
  detailBody.innerHTML=`<div class="detail-grid">${entries.map(([k,v])=>{
    let value=v;
    if(k==="submittedAt")value=dateText(v);
    if(k==="status")value=statusBadge(v);
    return `<div class="detail"><small>${esc(k.replace(/([A-Z])/g," $1"))}</small><div>${k==="status"?value:esc(value)}</div></div>`;
  }).join("")}</div>`;
  modal.classList.add("open");
}
document.getElementById("closeModal").onclick=()=>modal.classList.remove("open");
modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open")});
search.addEventListener("input",render);statusFilter.addEventListener("change",render);
document.getElementById("refreshBtn").onclick=()=>render();
