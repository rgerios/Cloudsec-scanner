from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "RDS"


def check_rds(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("rds", account_id, role_name)
    if client is None:
        return findings

    try:
        paginator = client.get_paginator("describe_db_instances")
        for page in paginator.paginate():
            for instance in page.get("DBInstances", []):
                identifier = instance.get("DBInstanceIdentifier", "unknown")
                engine = instance.get("Engine")

                if instance.get("PubliclyAccessible"):
                    findings.append(
                        {
                            "category": CATEGORY,
                            "description": f"RDS instance {identifier} ({engine}) is publicly accessible.",
                            "severity": "High",
                        }
                    )

                if not instance.get("StorageEncrypted", True):
                    findings.append(
                        {
                            "category": CATEGORY,
                            "description": f"RDS instance {identifier} ({engine}) does not use storage encryption.",
                            "severity": "Medium",
                        }
                    )
    except (ClientError, BotoCoreError):
        return findings

    return findings
