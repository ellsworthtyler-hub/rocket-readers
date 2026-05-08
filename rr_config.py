# FILE:  rr_config.py — ROCKET READERS CENTRAL CONFIG (v2.1)
# Created: 28-04-2026, Updated: 01-05-2026
# (v.2.0) NEW: Heavy comments for beginners + bug-fix visibility
# (v.2.1) NEW: Implement Cloudflare data storage for large tables and digital products.
# =================================================================================

import os
import boto3
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# 1. Supabase Initialization
url: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# 2. Cloudflare R2 Initialization (S3 Compatible)
r2_client = boto3.client(
    service_name='s3',
    endpoint_url=f"https://{os.getenv('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name='auto' # R2 doesn't use regions, but the driver requires this
)

# 3. Logging & Helpers
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("RocketReaders")

def log_step(msg):
    logger.info(f"🚀 {msg}")

# Bucket Names
BUCKET_ANALYSIS = "rr-analysis-data"
BUCKET_PRODUCTS = "rr-digital-products"
BUCKET_CLEANED  = "cleaned-books"
