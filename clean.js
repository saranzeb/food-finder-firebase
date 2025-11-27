// clean.js – Delete duplicates inside foodNodes (Option-B structure)

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupDuplicates() {
  console.log("🧹 Starting duplicate cleanup...");

  const snap = await db.collection("foodNodes").get();
  const seen = new Map();
  let deleteCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // UNIQUE KEY = name + parentId (Option-B rule)
    const key = `${data.name}_${data.parentId || "root"}`;

    if (seen.has(key)) {
      console.log(`🗑️ Duplicate found → deleting: ${data.name} (ID: ${doc.id})`);
      await doc.ref.delete();
      deleteCount++;
    } else {
      seen.set(key, doc.id);
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deleteCount} duplicates.`);
  process.exit(0);
}

cleanupDuplicates();
