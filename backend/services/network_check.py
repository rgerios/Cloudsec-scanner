from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "Network"


def _is_cidr_open(ranges):
    return any(r.get("CidrIp") == "0.0.0.0/0" or r.get("CidrIpv6") == "::/0" for r in ranges or [])


def check_sg(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("ec2", account_id, role_name)
    if client is None:
        return findings

    try:
        response = client.describe_security_groups()
    except (ClientError, BotoCoreError):
        return findings

    for group in response.get("SecurityGroups", []):
        name = group.get("GroupName") or group.get("GroupId")
        for permission in group.get("IpPermissions", []):
            ip_ranges = permission.get("IpRanges", []) + permission.get("Ipv6Ranges", [])
            if not _is_cidr_open(ip_ranges):
                continue

            from_port = permission.get("FromPort")
            to_port = permission.get("ToPort")
            if from_port is None and to_port is None:
                severity = "High"
                description = f"Security group {name} allows all ports from the internet."
            elif from_port in (22, 3389) or to_port in (22, 3389):
                severity = "High"
                description = f"Security group {name} exposes administrative port {from_port or to_port} to the internet."
            else:
                severity = "Medium"
                description = f"Security group {name} has open ingress from the internet on port range {from_port}-{to_port}."

            findings.append(
                {
                    "category": CATEGORY,
                    "description": description,
                    "severity": severity,
                }
            )

    return findings
