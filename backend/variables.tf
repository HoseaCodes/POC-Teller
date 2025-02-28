variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "teller-app"
}

variable "teller_certificate_content" {
  description = "Content of the Teller client certificate"
  type        = string
  sensitive   = true
  # Do not set a default for sensitive values
}

variable "teller_private_key_content" {
  description = "Content of the Teller client private key"
  type        = string
  sensitive   = true
  # Do not set a default for sensitive values
}

variable "teller_layer_zip_path" {
  description = "Path to the zip file containing the Lambda Layer for Teller mTLS"
  type        = string
  default     = "./teller-mtls-layer.zip"
}

variable "teller_layer_version" {
  description = "Version of the Teller mTLS Lambda Layer"
  type        = string
  default     = "1.0.0"
}

variable "teller_environment" {
  description = "Teller API environment (sandbox, development, production)"
  type        = string
  default     = "sandbox"
}

variable "lambda_zip_path" {
  description = "Path to the zip file containing the Lambda function code"
  type        = string
  default     = "./lambda-function.zip"
}

variable "lambda_version" {
  description = "Version of the Lambda function"
  type        = string
  default     = "1.0.0"
}