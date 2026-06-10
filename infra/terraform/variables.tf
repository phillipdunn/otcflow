# Input variables — set via terraform.tfvars (see terraform.tfvars.example).
# No secrets, passwords, or account-specific IDs belong in this file.

variable "project_name" {
  type        = string
  description = "Short name used as a prefix on resource names."
  default     = "otcflow"
}

variable "environment" {
  type        = string
  description = "Deployment slice (e.g. dev, staging). Not production-grade multi-account layout."
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.environment))
    error_message = "environment must be lowercase alphanumeric with hyphens."
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region for all resources. Set in tfvars — not hardcoded here."
}

variable "aws_account_id" {
  type        = string
  description = "12-digit AWS account ID for ARN construction (ECR image URI). Set in tfvars."
}

# --- Networking ---

variable "vpc_cidr" {
  type        = string
  description = "CIDR for the application VPC."
  default     = "10.0.0.0/16"
}

variable "availability_zone_count" {
  type        = number
  description = "How many AZs to span (2 is enough for a skeleton)."
  default     = 2
}

# --- Frontend (S3 + CDN) ---

variable "allow_force_destroy" {
  type        = bool
  description = "Allow destructive teardown of dev buckets/repos when running terraform destroy. Turn off for anything long-lived."
  default     = true
}

variable "frontend_cdn_price_class" {
  type        = string
  description = "CloudFront price class (PriceClass_100 = US/EU only, cheaper for demos)."
  default     = "PriceClass_100"
}

# Optional custom hostname — leave empty to use the default CloudFront domain only.
variable "frontend_domain_name" {
  type        = string
  description = "Optional custom domain for the static app (ACM cert wiring not included)."
  default     = ""
}

# --- API (container service) ---

variable "api_container_port" {
  type        = number
  description = "Container port (matches OTCFlow API PORT / Dockerfile EXPOSE)."
  default     = 3000
}

variable "api_cpu" {
  type        = number
  description = "Fargate task CPU units (256 = 0.25 vCPU)."
  default     = 256
}

variable "api_memory" {
  type        = number
  description = "Fargate task memory in MiB."
  default     = 512
}

variable "api_desired_count" {
  type        = number
  description = "Number of API tasks behind the load balancer."
  default     = 1
}

# Browser origin allowed by API CORS — set to the CDN URL after deploy (placeholder in example tfvars).
variable "cors_allowed_origin" {
  type        = string
  description = "Value for API CORS_ORIGIN (CloudFront HTTPS URL or custom domain)."
  default     = "https://placeholder.example.com"
}

# Optional ACM certificate ARN for the ALB HTTPS listener (same region as the ALB).
# Leave empty to use HTTP on port 80 only (educational sandbox default).
variable "api_listener_certificate_arn" {
  type        = string
  description = "ACM certificate ARN for the API load balancer HTTPS listener. Empty = HTTP :80."
  default     = ""
}

# --- Database (RDS PostgreSQL) ---

variable "db_name" {
  type        = string
  description = "PostgreSQL database name (matches Compose POSTGRES_DB default)."
  default     = "otcflow"
}

variable "db_username" {
  type        = string
  description = "Application database user name (not the master secret value)."
  default     = "otcflow_app"
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class for the skeleton."
  default     = "db.t4g.micro"
}

variable "db_allocated_storage_gb" {
  type        = number
  description = "Initial allocated storage (GB) for RDS."
  default     = 20
}

variable "db_backup_retention_days" {
  type        = number
  description = "Automated backup retention (days). Keep low for sandbox accounts."
  default     = 7
}

# --- Logging ---

variable "api_log_retention_days" {
  type        = number
  description = "CloudWatch log retention for API container logs."
  default     = 14
}
