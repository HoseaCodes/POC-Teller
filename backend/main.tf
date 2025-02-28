provider "aws" {
  region = var.aws_region
}

# Store Teller certificates in AWS Secrets Manager
resource "aws_secretsmanager_secret" "teller_certificate" {
  name                    = "${var.environment}/teller/certificate"
  description             = "Teller client certificate for mTLS authentication"
  recovery_window_in_days = 0  # Set to 0 for easier testing, use 7-30 for production
}

resource "aws_secretsmanager_secret" "teller_private_key" {
  name                    = "${var.environment}/teller/private-key"
  description             = "Teller client private key for mTLS authentication"
  recovery_window_in_days = 0  # Set to 0 for easier testing, use 7-30 for production
}

# Store the actual certificate and key values
# Note: For security, consider using Terraform variables with sensitive = true
# or using the AWS console to upload the values manually
resource "aws_secretsmanager_secret_version" "teller_certificate_value" {
  secret_id     = aws_secretsmanager_secret.teller_certificate.id
  secret_string = var.teller_certificate_content
}

resource "aws_secretsmanager_secret_version" "teller_private_key_value" {
  secret_id     = aws_secretsmanager_secret.teller_private_key.id
  secret_string = var.teller_private_key_content
}

# Create an S3 bucket to store the Lambda Layer zip file
resource "aws_s3_bucket" "lambda_layers" {
  bucket        = "${var.environment}-${var.project_name}-lambda-layers"
  force_destroy = true  # Set to false for production
}

# Upload the Lambda Layer zip file to S3
resource "aws_s3_object" "teller_mtls_layer" {
  bucket = aws_s3_bucket.lambda_layers.id
  key    = "teller-mtls-layer-${var.teller_layer_version}.zip"
  source = var.teller_layer_zip_path
  etag   = filemd5(var.teller_layer_zip_path)
}

# Create the Lambda Layer for mTLS communication
resource "aws_lambda_layer_version" "teller_mtls_layer" {
  layer_name          = "teller-mtls-layer"
  description         = "Lambda Layer with libraries for mTLS communication with Teller API"
  s3_bucket           = aws_s3_bucket.lambda_layers.id
  s3_key              = aws_s3_object.teller_mtls_layer.key
  compatible_runtimes = ["nodejs16.x", "nodejs18.x", "nodejs20.x"]
}

# IAM role and policy for Lambda functions to access the secrets
resource "aws_iam_role" "lambda_teller_role" {
  name = "${var.environment}-${var.project_name}-lambda-teller-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "teller_secrets_access" {
  name        = "${var.environment}-${var.project_name}-teller-secrets-access"
  description = "Policy for Lambda to access Teller certificate secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Effect = "Allow"
        Resource = [
          aws_secretsmanager_secret.teller_certificate.arn,
          aws_secretsmanager_secret.teller_private_key.arn
        ]
      }
    ]
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "teller_secrets_attachment" {
  role       = aws_iam_role.lambda_teller_role.name
  policy_arn = aws_iam_policy.teller_secrets_access.arn
}

# Add basic Lambda logging permissions
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_teller_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Outputs
output "lambda_layer_arn" {
  value = aws_lambda_layer_version.teller_mtls_layer.arn
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_teller_role.arn
}