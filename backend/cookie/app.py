import json
import uuid
from datetime import datetime, timedelta

# Set the expiration period (e.g., 1 year)
COOKIE_EXPIRATION_DAYS = 365


def handler(event, context):
    # Generate a new UUID token
    session_token = str(uuid.uuid4())

    # Set expiration time for the token (could be useful for storing it in a database, etc.)
    expiration_time = datetime.utcnow() + timedelta(days=COOKIE_EXPIRATION_DAYS)

    # Optionally, save the token to a database for future reference (not required for basic functionality)

    # Return the token and expiration info to the frontend
    response = {
        "statusCode": 200,
        "body": json.dumps({
            "sessionToken": session_token,
            "expiresAt": expiration_time.isoformat(),  # Include the expiration date (optional)
        }),
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",  # Allow all origins (can be restricted to specific ones)
            "Access-Control-Allow-Methods": "OPTIONS, POST",  # Allowed methods
            "Access-Control-Allow-Headers": "Content-Type",  # Allowed headers
        }
    }

    return response
