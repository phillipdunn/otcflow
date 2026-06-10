# Terraform and provider version constraints.
# Pin versions before any real deployment; run `terraform init` only when exploring locally.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

}

# Remote state (add before team use — not required to read this skeleton):
#
# terraform {
#   backend "s3" {
#     bucket         = "YOUR_TF_STATE_BUCKET"
#     key            = "otcflow/terraform.tfstate"
#     region         = "YOUR_AWS_REGION"
#     dynamodb_table = "YOUR_TF_LOCK_TABLE"
#     encrypt        = true
#   }
# }
