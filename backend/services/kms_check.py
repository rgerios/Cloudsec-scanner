from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "KMS"


def check_kms(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("kms", account_id, role_name)
    if client is None:
        return findings

    try:
        paginator = client.get_paginator("list_keys")
        for page in paginator.paginate():
            for entry in page.get("Keys", []):
                key_id = entry.get("KeyId")
                if not key_id:
                    continue
                try:
                    rotation = client.get_key_rotation_status(KeyId=key_id)
                    if not rotation.get("KeyRotationEnabled"):
                        aliases = client.list_aliases(KeyId=key_id).get("Aliases", [])
                        alias_name = next((a.get("AliasName") for a in aliases if a.get("AliasName")), key_id)
                        findings.append(
                            {
                                "category": CATEGORY,
                                "description": f"KMS key {alias_name} does not have automatic rotation enabled.",
                                "severity": "Low",
                            }
                        )
                except client.exceptions.NotFoundException:
                    continue
                except (ClientError, BotoCoreError):
                    continue
    except (ClientError, BotoCoreError):
        return findings

    return findings
