# Outputs for wiring the web build and post-deploy configuration (no secret values).

output "vpc_id" {
  description = "Application VPC ID."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnets (ALB)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnets (API tasks, RDS)."
  value       = aws_subnet.private[*].id
}

output "frontend_bucket_name" {
  description = "S3 bucket for Vite build artifacts (aws s3 sync dist/)."
  value       = aws_s3_bucket.frontend.id
}

output "frontend_cdn_domain_name" {
  description = "CloudFront domain — set VITE_* build args to point at the API URL, host the app here."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_cdn_url" {
  description = "HTTPS URL for the static web app."
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "api_load_balancer_dns_name" {
  description = "ALB DNS name — API base URL for the browser until a custom API domain exists."
  value       = aws_lb.api.dns_name
}

output "api_url" {
  description = "Suggested API base URL for VITE_API_URL. WebSocket: wss:// or ws:// same host, path /ws/deals."
  value       = var.api_listener_certificate_arn != "" ? "https://${aws_lb.api.dns_name}" : "http://${aws_lb.api.dns_name}"
}

output "api_ecr_repository_url" {
  description = "Push the apps/api Docker image here from CI."
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster running the API service."
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name for the API."
  value       = aws_ecs_service.api.name
}

output "rds_endpoint" {
  description = "PostgreSQL hostname (port 5432). Combine with credentials from Secrets Manager."
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "database_url_secret_arn" {
  description = "Secrets Manager ARN — populate DATABASE_URL for the ECS task."
  value       = aws_secretsmanager_secret.database_url.arn
}

output "cors_origin_secret_arn" {
  description = "Secrets Manager ARN — populate CORS_ORIGIN (usually frontend_cdn_url)."
  value       = aws_secretsmanager_secret.cors_origin.arn
}

output "api_log_group_name" {
  description = "CloudWatch log group for API container stdout (structured JSON logs)."
  value       = aws_cloudwatch_log_group.api.name
}
