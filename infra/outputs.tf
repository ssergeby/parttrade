output "s3_bucket_name" {
  description = "Name of the S3 bucket that stores the site assets."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution."
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "Public domain of the CloudFront distribution."
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "acm_certificate_arn" {
  description = "ARN of the validated ACM certificate in us-east-1."
  value       = aws_acm_certificate_validation.cert.certificate_arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID used for DNS records."
  value       = data.aws_route53_zone.this.zone_id
}
