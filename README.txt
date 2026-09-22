BAYIIRA MEMBERSHIP SYSTEM - CLEAN WORKING BUILD

1. Open index.html through a local/web server (not file://).
2. Registration uses Firebase Firestore and browser-compressed passport photos; Cloudinary is NOT required.
3. Admin login uses Firebase Authentication.
4. Membership IDs are generated only for approved members.
5. Member signature is generated on the ID only; it is NOT a registration-form field.
6. Chairperson and General Secretary signatures are fixed on the ID.
7. Deploy firestore.rules to the Firebase project before testing registration/admin.
8. The project intentionally uses Firebase compat SDK scripts instead of ES-module imports to avoid initializeApp/module-loading errors on simple phone/local web servers.

IMPORTANT: Firestore rules must be published in Firebase Console for the hosted database.


IMPORTANT FIRESTORE SETUP
1. In Firebase Console open Firestore Database > Rules.
2. Replace the current rules with the firestore.rules file included in this ZIP.
3. Publish the rules. The public registration create rule is intentional; admin reads/updates/deletes require the administrator email.
4. The registration form no longer asks for or uploads a member signature or thumb impression.
5. The Membership ID generates only the member signature from the last name.


UPGRADE NOTES
- Membership numbers are generated on approval in the format BOR-YYYY-H01, BOR-YYYY-H02, etc.
- The sequence restarts at H01 each calendar year.
- Approved members get a public verification record used by the QR code.
- Admin can export the membership register to CSV or print/save it as PDF.
- Admin approval, rejection, deletion and exports are recorded in auditLogs.

SECURITY AND PROFESSIONAL UPGRADES
- Administrator authentication is fresh per page load; Firebase Auth persistence is disabled so a password is required again after reload/new visit.
- Administrator session automatically expires after 30 minutes of inactivity.
- No temporary client-side lockout is applied after failed login attempts.
- Registration form is fully reset after a successful submission and before a new application.
- Passport photo selection stays in the file picker and uses a FileReader preview; no automatic download is created by the registration form.
- Admin can export a JSON backup of the membership register and view the latest audit logs.
- Rejection reasons are recorded in the member record and audit log.
- Public QR verification calculates current status from the membership expiry year.
