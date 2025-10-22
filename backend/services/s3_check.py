from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "S3"


def check_s3(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("s3", account_id, role_name)
    if client is None:
        return findings

    try:
        buckets = client.list_buckets().get("Buckets", [])
    except (ClientError, BotoCoreError):
        return findings

    for bucket in buckets:
        name = bucket.get("Name")
        if not name:
            continue
        try:
            pab = client.get_public_access_block(Bucket=name)[
                "PublicAccessBlockConfiguration"
            ]
            if not all(pab.values()):
                findings.append(
                    {
                        "category": CATEGORY,
                        "description": f"Bucket {name} does not block all public access settings.",
                        "severity": "High",
                    }
                )
        except client.exceptions.NoSuchPublicAccessBlockConfiguration:
            findings.append(
                {
                    "category": CATEGORY,
                    "description": f"Bucket {name} lacks a public access block configuration.",
                    "severity": "High",
                }
            )
        except (ClientError, BotoCoreError):
            continue

        try:
            client.get_bucket_encryption(Bucket=name)
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code") if hasattr(exc, "response") else None
            if error_code == "ServerSideEncryptionConfigurationNotFoundError":
                findings.append(
                    {
                        "category": CATEGORY,
                        "description": f"Bucket {name} does not enforce default encryption.",
                        "severity": "Medium",
                    }
                )
        except BotoCoreError:
            continue

    return findings
