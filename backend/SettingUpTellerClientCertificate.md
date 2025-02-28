# Teller.io mTLS Setup for AWS Lambda

This repository contains Terraform configurations for setting up mTLS authentication with Teller.io using AWS Lambda, Lambda Layers, and Secrets Manager.

## Overview

The implementation handles Teller API calls through AWS Lambda functions using mutual TLS (mTLS) authentication. The Lambda functions securely access Teller client certificates stored in AWS Secrets Manager.

## Architecture

- **AWS Secrets Manager**: Securely stores Teller client certificates and private keys
- **AWS Lambda Layer**: Contains the libraries needed for mTLS communication with Teller API
- **AWS Lambda Functions**: Handle API calls to Teller with proper authentication
- **API Gateway**: Provides REST API endpoints that your React Native app can call

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) (version 1.0.0 or later)
2. [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate permissions
3. [Node.js](https://nodejs.org/) (version 16.x or later)
4. Teller.io client certificate and private key

## Setup Instructions

### 1. Prepare Your Teller Certificates

First, locate your Teller client certificate and private key. These were provided when you signed up for Teller.io, typically in a `teller.zip` file.

### 2. Prepare the Lambda Layer

Run the provided script to create the Lambda Layer ZIP file:

```bash
chmod +x prepare-lambda-layer.sh
./prepare-lambda-layer.sh
```

This creates a `teller-mtls-layer.zip` file that contains the necessary libraries for mTLS communication.

### 3. Prepare Your Lambda Function Code

Create a ZIP file containing your Lambda function code:

```bash
mkdir -p lambda-function
cp example-lambda.js lambda-function/index.js
cd lambda-function
zip -r ../lambda-function.zip .
cd ..
```

### 4. Configure Terraform Variables

Create a `terraform.tfvars` file with your configuration values. You can use the provided `terraform.tfvars.example` as a template.

**IMPORTANT**: Never commit files containing your certificate or private key to version control!

For security, provide the certificate content via environment variables:

```bash
export TF_VAR_teller_certificate_content="$(cat ./certificate.pem)"
export TF_VAR_teller_private_key_content="$(cat ./private_key.pem)"
```

### 5. Deploy with Terraform

Initialize, plan, and apply the Terraform configuration:

```bash
terraform init
terraform plan
terraform apply
```

## Using the Deployed Resources

After deployment, Terraform will output:

- `api_url`: The URL of your API Gateway endpoint
- `lambda_function_name`: The name of the deployed Lambda function
- `lambda_layer_arn`: The ARN of the Lambda Layer
- `lambda_role_arn`: The ARN of the IAM role used by Lambda

Your React Native app should make requests to the API Gateway endpoint, which will trigger the Lambda function. The Lambda function will securely access the Teller certificates and make authenticated requests to the Teller API.

## Security Considerations

- The Teller private key should be kept strictly confidential
- Consider using AWS KMS for additional encryption of secrets
- For production, ensure proper authorization is configured on API Gateway
- Review and refine IAM permissions for least privilege

## Troubleshooting

If you encounter issues with mTLS authentication:

1. Check that your certificates are correctly loaded from Secrets Manager
2. Verify that the Lambda has the necessary permissions to access Secrets Manager
3. Check Lambda execution logs for detailed error messages
4. Ensure your Teller certificates are valid and not expired

## Next Steps

After deploying this infrastructure, you'll need to:

1. Implement your React Native application with Teller Connect
2. Set up webhook handling for Teller events
3. Implement user authentication and authorization
4. Configure proper error handling and monitoring