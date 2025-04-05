# Terraform configuration for GitHub H-Index Analytics infrastructure
# This file automates the deployment of the Cloudflare Worker and KV namespace

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure the Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers and KV permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "worker_name" {
  description = "Name of the Cloudflare Worker"
  type        = string
  default     = "github-hindex-analytics"
}

variable "kv_namespace_name" {
  description = "Name of the KV namespace"
  type        = string
  default     = "ANALYTICS_STORE"
}

variable "pages_project_name" {
  description = "Name of the Cloudflare Pages project"
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "List of origins allowed to access the worker via CORS"
  type        = list(string)
  default     = ["*"] # Default to all origins, or you can specify a list
}

# Optional variables for custom domain
variable "custom_domain" {
  description = "Custom domain for the worker (e.g., analytics.example.com/*)"
  type        = string
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID (required only if custom_domain is set)"
  type        = string
  default     = ""
}

# Create KV namespace
resource "cloudflare_workers_kv_namespace" "analytics_store" {
  account_id = var.cloudflare_account_id
  title      = var.kv_namespace_name
}

# Process the worker script with CORS configuration
locals {
  worker_template = file("${path.module}/analytics-worker.js")
  
  # Replace the ALLOWED_ORIGINS array in the script
  worker_script = replace(
    local.worker_template,
    "const ALLOWED_ORIGINS = [\\s\\S]*?];", # Match the entire ALLOWED_ORIGINS declaration including the array
    "const ALLOWED_ORIGINS = ${jsonencode(var.cors_allowed_origins)};"
  )
}

# Create Worker script
resource "cloudflare_workers_script" "analytics_worker" {
  account_id = var.cloudflare_account_id
  name       = var.worker_name
  content    = local.worker_script
  
  kv_namespace_binding {
    name         = var.kv_namespace_name
    namespace_id = cloudflare_workers_kv_namespace.analytics_store.id
  }
}

# Create Worker route (optional - only if you want a custom route)
resource "cloudflare_workers_route" "analytics_route" {
  count      = var.custom_domain != "" ? 1 : 0
  zone_id    = var.cloudflare_zone_id
  pattern    = var.custom_domain
  script_name = cloudflare_workers_script.analytics_worker.name
}





# Use cloudflare_pages_project instead for environment variables
resource "cloudflare_pages_project" "github_hindex" {
  account_id        = var.cloudflare_account_id
  name              = var.pages_project_name
  production_branch = "main"

  deployment_configs {
    production {
      environment_variables = {
        VITE_ANALYTICS_ENDPOINT = "https://${var.worker_name}.${var.cloudflare_account_id}.workers.dev"
      }
    }
    preview {
      environment_variables = {
        VITE_ANALYTICS_ENDPOINT = "https://${var.worker_name}.${var.cloudflare_account_id}.workers.dev"
  }
}
  }
}

# Outputs
output "worker_url" {
  description = "URL of the deployed worker"
  value       = "https://${var.worker_name}.${var.cloudflare_account_id}.workers.dev"
}

output "kv_namespace_id" {
  description = "ID of the KV namespace"
  value       = cloudflare_workers_kv_namespace.analytics_store.id
}

output "stats_endpoint" {
  description = "URL to access analytics stats"
  value       = "https://${var.worker_name}.${var.cloudflare_account_id}.workers.dev/stats"
}