# Root module: provider wiring and shared locals.
# Split by concern in sibling .tf files (networking, frontend, api, database, logging, secrets).

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Application = "otcflow"
    Purpose     = "educational-skeleton"
  }

  # Placeholder image until CI pushes to ECR (see api.tf).
  api_image_placeholder = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${local.name_prefix}-api:latest"
}
