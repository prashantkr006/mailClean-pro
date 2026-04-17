# Privacy Policy for MailClean Pro

## Data Collection and Use

MailClean Pro collects and processes the following data:

### OAuth Data
- **Email Address**: Used for user identification and display
- **Profile Information**: Name and profile picture (optional)
- **Access Tokens**: Stored temporarily in browser session storage for API access

### Gmail Data
- **Email Metadata**: Subject, sender, date, labels, size (used for categorization)
- **Email Content**: Only snippets and headers are processed (full bodies are never downloaded)
- **Categorization Data**: Sender patterns and email statistics for cleanup recommendations

### Storage
- **Session Storage**: OAuth tokens (cleared when browser closes)
- **Local Storage**: User profile and settings (persistent)
- **Sync Storage**: User preferences and thresholds

## Data Processing

### Purpose
- Analyze email patterns to identify cleanup candidates
- Provide bulk operations for email management
- Maintain user preferences and settings

### Processing Location
- All data processing occurs locally in the user's browser
- No data is transmitted to external servers except Gmail API calls

### Data Retention
- OAuth tokens: Session duration only
- User profile: Until sign out or extension removal
- Email data: Processed in memory, not stored permanently

## Third-Party Services

### Google Gmail API
- Used for reading and modifying emails
- Data shared: OAuth tokens and API requests
- Privacy: Governed by [Google's Privacy Policy](https://policies.google.com/privacy)

### Google OAuth 2.0
- Used for authentication
- Data shared: OAuth authorization requests
- Privacy: Governed by [Google's Privacy Policy](https://policies.google.com/privacy)

## Security Measures

- Strict Content Security Policy (no remote scripts)
- Session-only token storage
- No persistent sensitive data storage
- OAuth 2.0 with restricted scopes

## User Rights

### Data Access
- Users can view all collected data through the extension interface
- No hidden data collection

### Data Deletion
- Sign out clears all stored data
- Extension removal clears all local data
- Users can reset settings at any time

### Data Portability
- Settings can be exported/imported
- No user-generated content is stored

## Compliance

This extension complies with:
- Chrome Extension policies
- Google's OAuth 2.0 policies
- GDPR data processing principles
- CCPA privacy requirements

## Contact

For privacy concerns, contact the developer through the Chrome Web Store listing.

## Changes

This privacy policy may be updated with extension updates. Users will be notified of significant changes.