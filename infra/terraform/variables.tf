variable "aws_region" {
  description = "AWS region for regional resources such as S3 and Route53."
  type        = string
}

variable "aws_profile" {
  description = "Optional named AWS CLI profile to use for authentication."
  type        = string
  default     = null
}

variable "domain_name" {
  description = "Primary domain name (e.g. example.com) that CloudFront should serve."
  type        = string
}

variable "alternate_domain_names" {
  description = "Additional domain names (e.g. www.example.com) that should point to the distribution."
  type        = list(string)
  default     = []
}

variable "hosted_zone_name" {
  description = "Public Route53 hosted zone that contains the domain. Trailing dot optional."
  type        = string
}

variable "bucket_name" {
  description = "Optional explicit bucket name. Defaults to the primary domain."
  type        = string
  default     = null
}

variable "bucket_force_destroy" {
  description = "Allow Terraform to delete a non-empty bucket. Use with caution."
  type        = bool
  default     = false
}

variable "enable_bucket_versioning" {
  description = "Enable object versioning on the S3 bucket."
  type        = bool
  default     = true
}

variable "cors_allowed_origins" {
  description = "Optional list of origins allowed by S3 CORS. Leave empty to disable the rule."
  type        = list(string)
  default     = []
}

variable "default_root_object" {
  description = "Default object served by CloudFront when a directory is requested."
  type        = string
  default     = "index.html"
}

variable "enable_cloudfront_compression" {
  description = "Enable automatic GZIP/Brotli compression in CloudFront."
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "CloudFront price class. Use PriceClass_All for global edge locations."
  type        = string
  default     = "PriceClass_100"
}

variable "viewer_minimum_protocol_version" {
  description = "Minimum TLS protocol version for viewers."
  type        = string
  default     = "TLSv1.2_2021"
}

variable "response_headers_policy_id" {
  description = "Optional custom CloudFront response headers policy ID. Defaults to AWS managed security headers."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to all supported resources."
  type        = map(string)
  default     = {}
}
