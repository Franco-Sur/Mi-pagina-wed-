// NEXUS: interfaz inicial. Para activar cuentas y datos compartidos, configura Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "TU-PROYECTO.firebaseapp.com",
  projectId: "TU-PROYECTO",
  storageBucket: "TU-PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
const configured = !Object.values(firebaseConfig).some(v => String(v).includes("PEGA_AQUI") || String(v).includes("TU-") || String(v).includes("TU_"));
const $ = id => document.getElementById(id);
const dialog = $("authDialog");
let auth, db, currentUser = null, mode = "register";

function message(text){ $("statusNote").textContent = text; }
function openAuth(nextMode){ mode=nextMode; $("authTitle").textContent=mode==="register"?"Crear cuenta":"Iniciar sesión"; $("authSubmit").textContent=mode==="register"?"Crear cuenta":"Entrar"; $("authName").hidden=mode!=="register"; $("authMessage").textContent="Usa una contraseña única y no la compartas."; dialog.showModal(); }
$("registerOpen").onclick=()=>openAuth("register");
$("loginOpen").onclick=()=>openAuth("login");
$("authForm").addEventListener("submit", async e=>{
  e.preventDefault();
  if(!configured){ $("authMessage").textContent="Primero conecta Firebase siguiendo el archivo LEEME.txt."; return; }
  const email=$("authEmail").value.trim(), password=$("authPassword").value, name=$("authName").value.trim();
  try{
    if(mode==="register"){
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      if(name) await updateProfile(cred.user,{displayName:name});
    } else await signInWithEmailAndPassword(auth,email,password);
    dialog.close(); $("authForm").reset();
  }catch(err){ $("authMessage").textContent=err.message; }
});
$("publishBtn").onclick=async()=>{
  if(!currentUser){openAuth("login");return;}
  const body=$("postText").value.trim(), imageUrl=$("postImage").value.trim();
  if(!body){message("Escribe algo antes de publicar.");return;}
  if(!configured){message("Conecta Firebase para guardar publicaciones.");return;}
  try{await addDoc(collection(db,"posts"),{body,imageUrl,authorId:currentUser.uid,authorName:currentUser.displayName||"Usuario",createdAt:serverTimestamp()});$("postText").value="";$("postImage").value="";}catch(e){message("No se pudo publicar. Revisa la configuración.");}
};
$("profileEdit").onclick=()=>currentUser?alert("Para cambiar tu nombre, configura la edición de perfil desde Firebase."):openAuth("login");
$("contactForm").onsubmit=e=>{e.preventDefault();$("contactStatus").textContent="Formulario de muestra. Conecta un servicio de formularios para recibir mensajes.";};
$("searchInput").addEventListener("input",e=>{const term=e.target.value.toLowerCase();document.querySelectorAll(".post").forEach(p=>p.hidden=!p.textContent.toLowerCase().includes(term));});

if(configured){
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
  onAuthStateChanged(auth,user=>{
    currentUser=user;
    $("accountArea").innerHTML=user?`<span class="signed">Hola, ${escapeHtml(user.displayName||"usuario")}</span><button class="btn ghost" id="logoutBtn">Salir</button>`:$("accountArea").innerHTML;
    const logout=$("logoutBtn");if(logout)logout.onclick=()=>signOut(auth);
    $("profileName").textContent=user?.displayName||"Invitado";
    $("profileEmail").textContent=user?"Sesión iniciada":"Inicia sesión para ver tu perfil.";
    message(user?"Sesión iniciada. ¡Bienvenido a NEXUS!":"Conectado a NEXUS. Inicia sesión para publicar.");
  });
  onSnapshot(query(collection(db,"posts"),orderBy("createdAt","desc")),snap=>{
    const root=$("posts");root.innerHTML="";
    snap.forEach(doc=>{const p=doc.data(),el=document.createElement("article");el.className="post panel";
      const meta=document.createElement("div");meta.className="post-meta";
      const author=document.createElement("b");author.textContent=p.authorName||"Usuario";
      const date=document.createElement("span");date.textContent="Publicación";
      meta.append(author,date);el.append(meta);
      const title=document.createElement("h3");title.textContent=(p.body||"").slice(0,90);el.append(title);
      const body=document.createElement("p");body.textContent=p.body||"";el.append(body);
      if(p.imageUrl && /^https:\\/\\//i.test(p.imageUrl)){const img=document.createElement("img");img.className="post-image";img.src=p.imageUrl;img.alt="Imagen de la publicación";img.loading="lazy";el.append(img);}
      root.append(el);
    });
  },()=>message("No se pudieron cargar publicaciones. Revisa las reglas de Firestore."));
}else{
  message("Vista previa de NEXUS: agrega tu configuración de Firebase para activar las funciones compartidas.");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
