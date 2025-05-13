# Unsplash API Setup Guide

This guide will help you set up the Unsplash API for the slide generator application.

## Getting Your API Keys

1. Go to the [Unsplash Developer Portal](https://unsplash.com/developers)
2. Sign up or log in to your Unsplash account
3. Navigate to "Your applications"
4. Create a new application
5. Fill in the required details about your application:
   - Application name
   - Description
   - Website URL (can be localhost during development)
   - Select "Demo" for testing purposes
6. Accept the terms and create the application
7. You'll receive both an **Access Key** and a **Secret Key**

## Setting Up Environment Variables

Create or edit the `.env` file in your backend directory to include:

```
# MongoDB and other existing variables
...

# Unsplash API Keys
UNSPLASH_ACCESS_KEY=your-access-key-here
UNSPLASH_SECRET_KEY=your-secret-key-here
```

## Alternative: Setting Environment Variables in PowerShell

If you prefer to set environment variables directly in PowerShell:

```powershell
$env:UNSPLASH_ACCESS_KEY="your-access-key-here"
$env:UNSPLASH_SECRET_KEY="your-secret-key-here"
npm start
```

## Usage in the Application

The application will use these keys to:

1. Search for relevant images based on slide content
2. Properly attribute images as required by Unsplash
3. Track downloads if Secret Key is provided (fulfilling Unsplash API requirements)

## Troubleshooting

If you encounter issues with the Unsplash API:

1. Check the server logs for error messages
2. Verify that your API keys are correctly set
3. Ensure your application is registered correctly on Unsplash
4. Check that you haven't exceeded API rate limits

## Important Notes

- The Access Key is used for authentication with the Unsplash API
- The Secret Key enables proper download tracking (required by Unsplash for production)
- For development/testing, the Access Key alone is typically sufficient
- In production, both keys should be properly secured and never exposed client-side 