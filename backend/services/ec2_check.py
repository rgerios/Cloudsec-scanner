from typing import List

from botocore.exceptions import BotoCoreError, ClientError

from utils.aws_session import get_boto3_client

CATEGORY = "EC2"


def _extract_name(tags):
    if not tags:
        return None
    for tag in tags:
        if tag.get("Key") == "Name" and tag.get("Value"):
            return tag["Value"]
    return None


def check_ec2(account_id: str, role_name: str) -> List[dict]:
    findings: List[dict] = []
    client = get_boto3_client("ec2", account_id, role_name)
    if client is None:
        return findings

    try:
        paginator = client.get_paginator("describe_instances")
        for page in paginator.paginate():
            for reservation in page.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    public_ip = instance.get("PublicIpAddress")
                    public_dns = instance.get("PublicDnsName")
                    has_public_endpoint = bool(public_ip or public_dns)
                    if not has_public_endpoint:
                        continue

                    instance_id = instance.get("InstanceId", "unknown")
                    name_tag = _extract_name(instance.get("Tags"))
                    identifier = name_tag or instance_id

                    description = f"EC2 instance {identifier} is reachable from the internet"
                    if public_ip:
                        description += f" via public IP {public_ip}"
                    description += "."

                    findings.append(
                        {
                            "category": CATEGORY,
                            "description": description,
                            "severity": "High",
                        }
                    )
    except (ClientError, BotoCoreError):
        return findings

    return findings
