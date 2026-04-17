# OAuth Setup for MailClean Pro

This guide walks you through setting up Google OAuth 2.0 for the MailClean Pro Chrome Extension.

## Prerequisites

- Google Cloud Console access
- Chrome Extension ID (obtained after loading the unpacked extension)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Chrome Extension" as the application type
4. Enter your Chrome Extension ID (find it in `chrome://extensions` after loading unpacked)
5. Add the authorized redirect URIs (if required)

## Step 3: Configure OAuth Scopes

The extension uses these restricted scopes (do NOT add `gmail.readonly` alongside `gmail.modify`):

```
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

## Step 4: Update Manifest

Replace the placeholder in `manifest.config.ts`:

```typescript
oauth2: {
  client_id: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com',
  // ... rest of config
}
```

## Step 5: OAuth Verification (Production Only)

⚠️ **Required for production deployment**

### Restricted Scopes
The `gmail.modify` scope is **restricted** and requires OAuth verification.

### Verification Process
1. Go to Google Cloud Console > APIs & Services > OAuth consent screen
2. Fill out the OAuth verification form
3. Submit for review
4. **Timeline**: 4-8 weeks for approval

### CASA Security Assessment
After verification approval, you must complete a **CASA (Customer Authorized Security Assessment)**:
- **Tier**: 2 or 3 (depending on user count)
- **Cost**: Paid service
- **Frequency**: Annual renewal
- **Timeline**: 2-6 months

### User Limits
- **Unverified**: Max 100 test users
- **Verified but no CASA**: Limited user count
- **Verified + CASA**: Full production access

## Step 6: Testing

1. Load the extension as unpacked in Chrome
2. Test the OAuth flow
3. Verify Gmail API calls work

## Troubleshooting

- **Invalid Client**: Ensure the Chrome Extension ID matches exactly
- **Scope Errors**: Only use the three specified scopes
- **Consent Screen**: Must be configured for Chrome Extension type
- **Rate Limits**: Gmail API has quotas; implement proper rate limiting

## Security Notes

- Never commit real client IDs to version control
- Use environment variables for different environments
- Regularly rotate credentials
- Monitor API usage and quotas