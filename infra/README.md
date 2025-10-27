# Static Site Hosting on AWS

This Terraform stack provisions everything needed to host a static web site on AWS using:

- S3 bucket for site assets (private, served through CloudFront)
- CloudFront distribution with managed cache/origin policies and SPA-friendly error pages
- ACM certificate (issued in `us-east-1`) with automatic DNS validation
- Route53 alias records for the requested domains

## Prerequisites

1. Terraform `>= 1.5.0`
2. AWS credentials with permissions for S3, CloudFront, ACM, and Route53
3. A public Route53 hosted zone for the domain you want to serve

## Variables

| Name | Required | Description |
| --- | --- | --- |
| `aws_region` | ✅ | Region for S3/Route53 resources (CloudFront & ACM are global/us-east-1). |
| `domain_name` | ✅ | Primary domain (e.g. `example.com`). |
| `hosted_zone_name` | ✅ | Matching Route53 hosted zone (`example.com` or `example.com.`). |
| `alternate_domain_names` | | Extra aliases for the distribution such as `www.example.com`. |
| `bucket_name` | | Override the S3 bucket name (defaults to `domain_name`). Must be globally unique. |
| `bucket_force_destroy` | | Set `true` to allow Terraform to delete non-empty buckets. |
| `enable_bucket_versioning` | | Default `true`. Disable only if you understand the risk. |
| `cors_allowed_origins` | | List of origins allowed via S3 CORS. Leave empty to skip CORS rules. |
| `cloudfront_price_class` | | Defaults to `PriceClass_100`. Use `PriceClass_All` for global POPs. |
| `default_root_object` | | Defaults to `index.html`. Used for SPA fallbacks in error responses. |
| `response_headers_policy_id` | | Optionally override the response headers policy. Defaults to AWS managed security headers. |
| `tags` | | Map of tags propagated to supported resources. |

Extra knobs such as TLS minimum version (`viewer_minimum_protocol_version`) and compression flags are also exposed in `variables.tf`.

## Getting Started

Create a `terraform.tfvars` file (or pass the variables via CLI) that includes at minimum:

```hcl
aws_region       = "eu-central-1"
domain_name      = "example.com"
hosted_zone_name = "example.com."
alternate_domain_names = ["www.example.com"]

tags = {
  Project = "parttrade"
  Stack   = "production"
}
```

Then run the standard Terraform workflow:

```bash
terraform init
terraform plan
terraform apply
```

After `apply` completes, upload your built site assets to the provisioned S3 bucket (`terraform output s3_bucket_name`). CloudFront may take a few minutes to deploy before the domain is reachable.

## Notes

- ACM certificates for CloudFront **must** be created in `us-east-1`; the secondary provider configuration handles this automatically.
- The S3 bucket blocks all public access and only trusts the configured CloudFront distribution via an Origin Access Control (OAC).
- CloudFront error responses for 403/404 are mapped to `index.html`, which keeps single-page applications working on hard-refresh.
- Removing the stack will also remove DNS records and the CloudFront distribution. If you have important objects in S3, either set `bucket_force_destroy = false` or empty the bucket manually before destroying.
