import logging
import os
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def get_boto3_session(account_id: Optional[str] = None, role_name: Optional[str] = None) -> Optional[boto3.Session]:
    """Create a boto3 session, assuming a cross-account role when provided."""
    region = os.getenv("AWS_REGION", "us-east-1")
    try:
        if account_id and role_name:
            role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
            sts = boto3.client("sts", region_name=region)
            response = sts.assume_role(
                RoleArn=role_arn,
                RoleSessionName="CloudSecScannerSession",
                DurationSeconds=3600,
            )
            creds = response["Credentials"]
            return boto3.Session(
                aws_access_key_id=creds["AccessKeyId"],
                aws_secret_access_key=creds["SecretAccessKey"],
                aws_session_token=creds["SessionToken"],
                region_name=region,
            )
        # Fall back to the default credential chain
        return boto3.Session(region_name=region)
    except (NoCredentialsError, BotoCoreError, ClientError) as exc:
        logger.warning("Unable to establish AWS session: %s", exc)
        return None


def get_boto3_client(service_name: str, account_id: Optional[str] = None, role_name: Optional[str] = None):
    """Return a boto3 client for the given service or None when not available."""
    session = get_boto3_session(account_id, role_name)
    if not session:
        return None
    try:
        return session.client(service_name)
    except (BotoCoreError, ClientError) as exc:
        logger.warning("Unable to create client for %s: %s", service_name, exc)
        return None
