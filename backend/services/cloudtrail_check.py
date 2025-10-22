from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "CloudTrail"


def check_trail(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("cloudtrail", account_id, role_name)
    if client is None:
        return findings

    try:
        trails = client.describe_trails(includeShadowTrails=False).get("trailList", [])
    except (ClientError, BotoCoreError):
        return findings

    if not trails:
        findings.append(
            {
                "category": CATEGORY,
                "description": "No CloudTrail trails configured.",
                "severity": "High",
            }
        )
        return findings

    for trail in trails:
        if not trail.get("IsMultiRegionTrail"):
            findings.append(
                {
                    "category": CATEGORY,
                    "description": f"Trail {trail.get('Name')} does not capture all regions.",
                    "severity": "Medium",
                }
            )
        if not trail.get("LogFileValidationEnabled"):
            findings.append(
                {
                    "category": CATEGORY,
                    "description": f"Trail {trail.get('Name')} does not have log file validation enabled.",
                    "severity": "Low",
                }
            )

    return findings
