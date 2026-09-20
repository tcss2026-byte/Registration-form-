BAYIIRA OF RWENZORI MY HOME LAND ASSOCIATION
ONLINE MEMBERSHIP REGISTRATION SYSTEM

TECHNOLOGY
- Pure HTML
- Pure CSS
- Pure JavaScript
- Firebase Authentication
- Cloud Firestore
- No React / Vite / Tailwind / Node build required

FILES
- index.html          Public membership registration form
- admin.html          Administrator login/dashboard
- style.css           Responsive professional design
- app.js              Public registration -> Firestore
- admin.js            Admin authentication/dashboard/approve/reject/delete
- firebase-runtime.js Firebase web configuration
- firebase-config.js  Configuration reference
- firestore.rules     Firestore security rules
- logo.png            Supplied Bayiira logo

FIREBASE SETUP
1. Open Firebase Console for project borh-d7a41.
2. Authentication -> Sign-in method -> enable Email/Password.
3. Authentication -> Users -> create/confirm:
   Email: tcss2026@gmail.com
   Password: use the administrator password you supplied.
4. Firestore Database -> create database.
5. Firestore -> Rules -> paste firestore.rules and Publish.
6. Host the files on Firebase Hosting, Netlify, GitHub Pages, or another HTTPS host.

IMPORTANT SECURITY
- The administrator password is NOT written into the website source.
- Firebase Authentication stores/verifies the password.
- The Delete button asks for the administrator password and re-authenticates the currently signed-in administrator before deleting the Firestore member document.
- Firestore Rules independently restrict member reads/updates/deletes to tcss2026@gmail.com.
- Public users can create pending registrations only.

DEPLOYMENT
For Firebase Hosting, serve this folder as the public directory. No npm install or build step is required.
