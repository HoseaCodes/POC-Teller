#!/bin/bash
# Script to prepare the Lambda Layer for Teller mTLS communication

# Exit on any error
set -e

# Create directory structure for the Lambda Layer
mkdir -p nodejs/node_modules

# Change directory to nodejs
cd nodejs

# Create a package.json file
cat > package.json << EOF
{
  "name": "teller-mtls-layer",
  "version": "1.0.0",
  "description": "Lambda Layer for mTLS communication with Teller API",
  "main": "index.js",
  "dependencies": {
    "axios": "^1.6.0",
    "https": "^1.0.0",
    "fs": "0.0.1-security"
  }
}
EOF

# Install dependencies
npm install

# Create a utility module for Teller API communication
cat > teller-client.js << EOF
'use strict';

const axios = require('axios');
const https = require('https');
const fs = require('fs');

/**
 * Creates a configured axios client for making mTLS requests to Teller API
 * @param {string} certContent - The certificate content
 * @param {string} keyContent - The private key content
 * @param {string} accessToken - The Teller API access token
 * @returns {Object} - Configured axios instance
 */
exports.createTellerClient = (certContent, keyContent, accessToken) => {
  // Create HTTPS agent with the certificate and key
  const httpsAgent = new https.Agent({
    cert: certContent,
    key: keyContent,
    keepAlive: true
  });

  // Create axios instance with the HTTPS agent
  const client = axios.create({
    baseURL: 'https://api.teller.io',
    httpsAgent,
    auth: {
      username: accessToken,
      password: ''
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return client;
};

/**
 * Helper function to get Teller certificates from AWS Secrets Manager
 * @param {Object} secretsManager - AWS Secrets Manager client
 * @param {string} certSecretName - Certificate secret name
 * @param {string} keySecretName - Private key secret name
 * @returns {Promise<Object>} - Object containing certificate and key
 */
exports.getTellerCertificates = async (secretsManager, certSecretName, keySecretName) => {
  const [certResponse, keyResponse] = await Promise.all([
    secretsManager.getSecretValue({ SecretId: certSecretName }).promise(),
    secretsManager.getSecretValue({ SecretId: keySecretName }).promise()
  ]);

  return {
    certificate: certResponse.SecretString,
    privateKey: keyResponse.SecretString
  };
};
EOF

# Go back to the root directory
cd ..

# Create the zip file for the Lambda Layer
zip -r teller-mtls-layer.zip nodejs

echo "Lambda Layer has been created: teller-mtls-layer.zip"