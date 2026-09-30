const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const fs = require("fs");

const localPath = require("path").join(
  __dirname,
  "../firebase-service-account.json"
);

const renderPath = "/etc/secrets/firebase-service-account.json";

const serviceAccountPath = fs.existsSync(renderPath)
  ? renderPath
  : localPath;

const serviceAccount = require(serviceAccountPath);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const adminAuth = getAuth();

module.exports = adminAuth;