'use strict';

const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();
const tellerClient = require('/opt/nodejs/teller-client');

// Environment variables that will be set in the Lambda function
const CERT_SECRET_NAME = process.env.TELLER_CERT_SECRET_NAME;
const KEY_SECRET_NAME = process.env.TELLER_KEY_SECRET_NAME;

/**
 * Example Lambda function to fetch accounts from Teller API using mTLS
 */
exports.handler = async (event) => {
  try {
    // Get the access token from the Lambda event
    const { accessToken } = JSON.parse(event.body || '{}');
    
    if (!accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Access token is required' })
      };
    }
    
    // Get certificates from Secrets Manager
    const certs = await tellerClient.getTellerCertificates(
      secretsManager, 
      CERT_SECRET_NAME, 
      KEY_SECRET_NAME
    );
    
    // Create the Teller API client with mTLS
    const client = tellerClient.createTellerClient(
      certs.certificate,
      certs.privateKey,
      accessToken
    );
    
    // Make a request to Teller API
    const response = await client.get('/accounts');
    
    // Return the accounts data
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error fetching accounts from Teller API:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch accounts',
        message: error.message
      })
    };
  }
};