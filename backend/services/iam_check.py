from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "IAM"


def check_iam(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("iam", account_id, role_name)
    if client is None:
        return findings

    try:
        summary = client.get_account_summary().get("SummaryMap", {})
        if summary.get("AccountMFAEnabled", 0) == 0:
            findings.append(
                {
                    "category": CATEGORY,
                    "description": "Root account does not have MFA enabled.",
                    "severity": "High",
                }
            )
        if summary.get("AccountAccessKeysPresent", 0) > 0:
            findings.append(
                {
                    "category": CATEGORY,
                    "description": "Root account still has active access keys.",
                    "severity": "Medium",
                }
            )
    except (ClientError, BotoCoreError):
        return findings

    try:
        policy = client.get_account_password_policy()["PasswordPolicy"]
        if policy.get("MinimumPasswordLength", 0) < 12:
            findings.append(
                {
                    "category": CATEGORY,
                    "description": "Password policy allows passwords shorter than 12 characters.",
                    "severity": "Medium",
                }
            )
        if not policy.get("RequireNumbers") or not policy.get("RequireSymbols"):
            findings.append(
                {
                    "category": CATEGORY,
                    "description": "Password policy does not enforce complexity requirements (numbers & symbols).",
                    "severity": "Low",
                }
            )
    except client.exceptions.NoSuchEntityException:
        findings.append(
            {
                "category": CATEGORY,
                "description": "No account password policy configured.",
                "severity": "High",
            }
        )
    except (ClientError, BotoCoreError):
        return findings

    return findings
