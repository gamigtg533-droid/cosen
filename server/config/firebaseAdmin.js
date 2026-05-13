const admin = require('firebase-admin');

// Ensure all required variables are present
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.warn('⚠️ Firebase Admin configuration is missing. Phone verification will not work.');
} else {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped literal \n with actual newlines, which is necessary if dotenv didn't parse them fully
        privateKey: privateKey.replace(/\\n/g, '\n')
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error.message);
  }
}

module.exports = admin;
