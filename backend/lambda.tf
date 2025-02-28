# Create a Lambda function that uses the mTLS layer to communicate with Teller API
resource "aws_lambda_function" "teller_accounts" {
  function_name    = "${var.environment}-${var.project_name}-teller-accounts"
  description      = "Fetches accounts from Teller API using mTLS"
  
  # S3 bucket containing the Lambda code
  s3_bucket        = aws_s3_bucket.lambda_layers.id
  s3_key           = aws_s3_object.teller_accounts_lambda.key
  
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 256
  
  # Use the role we created for accessing Teller secrets
  role             = aws_iam_role.lambda_teller_role.arn
  
  # Add the mTLS layer
  layers           = [aws_lambda_layer_version.teller_mtls_layer.arn]
  
  # Environment variables for the Lambda function
  environment {
    variables = {
      TELLER_CERT_SECRET_NAME = aws_secretsmanager_secret.teller_certificate.name
      TELLER_KEY_SECRET_NAME  = aws_secretsmanager_secret.teller_private_key.name
      TELLER_ENV              = var.teller_environment
    }
  }
}

# Upload the Lambda function code to S3
resource "aws_s3_object" "teller_accounts_lambda" {
  bucket = aws_s3_bucket.lambda_layers.id
  key    = "lambda/teller-accounts-${var.lambda_version}.zip"
  source = var.lambda_zip_path
  etag   = filemd5(var.lambda_zip_path)
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "teller_api" {
  name        = "${var.environment}-${var.project_name}-api"
  description = "API Gateway for Teller integration"
}

# API Gateway resource for accounts endpoint
resource "aws_api_gateway_resource" "accounts" {
  rest_api_id = aws_api_gateway_rest_api.teller_api.id
  parent_id   = aws_api_gateway_rest_api.teller_api.root_resource_id
  path_part   = "accounts"
}

# API Gateway method for accounts endpoint
resource "aws_api_gateway_method" "accounts_post" {
  rest_api_id   = aws_api_gateway_rest_api.teller_api.id
  resource_id   = aws_api_gateway_resource.accounts.id
  http_method   = "POST"
  authorization = "NONE" # Change to "COGNITO_USER_POOLS" or other for production
}

# API Gateway integration with Lambda
resource "aws_api_gateway_integration" "accounts_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.teller_api.id
  resource_id             = aws_api_gateway_resource.accounts.id
  http_method             = aws_api_gateway_method.accounts_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.teller_accounts.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.teller_accounts.function_name
  principal     = "apigateway.amazonaws.com"
  
  # The source ARN for the API Gateway deployment
  source_arn    = "${aws_api_gateway_rest_api.teller_api.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "teller_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.accounts_lambda
  ]
  
  rest_api_id = aws_api_gateway_rest_api.teller_api.id
  stage_name  = var.environment
  
  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "api_url" {
  value = "${aws_api_gateway_deployment.teller_api_deployment.invoke_url}/accounts"
}

output "lambda_function_name" {
  value = aws_lambda_function.teller_accounts.function_name
}