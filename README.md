# MailClean Pro

A production-grade Chrome Extension for safely cleaning unnecessary Gmail emails with smart categorization and bulk operations.

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome

## Development

1. Run `npm run dev` for HMR development
2. Load the `dist` folder as an unpacked extension in Chrome
3. The extension will reload automatically on changes

## OAuth Setup

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed instructions on setting up Google OAuth for the extension.

## Features

- **Smart Email Classification**: Automatically categorizes emails into promotional, old unread, bulk senders, inactive subscriptions, and newsletters
- **Cleanup Scoring**: Uses a weighted algorithm to recommend emails for cleanup
- **Bulk Operations**: Trash thousands of emails at once with Gmail's batch API
- **Unsubscribe Support**: One-click unsubscribe for RFC 8058 compliant senders
- **Dashboard**: Full-tab interface for reviewing and managing flagged emails
- **Settings**: Configurable thresholds and aggressiveness levels
- **Auto-Scan**: Background scanning with MV3-safe alarms

## Architecture

- **Framework**: React 18 + TypeScript
- **State**: Zustand stores
- **Styling**: TailwindCSS
- **Build**: Vite + @crxjs/vite-plugin
- **Gmail API**: REST v1 with batch operations
- **Rate Limiting**: Token bucket with exponential backoff

## Security

- Strict CSP (no remote scripts, no eval)
- Session-only token storage
- No persistent sensitive data
- OAuth 2.0 with restricted scopes

## Production Notes

⚠️ **Important**: This extension uses restricted Gmail API scopes that require OAuth verification for production use.

- **Verification Required**: Gmail `modify` scope is restricted
- **User Limit**: Unverified extensions limited to 100 test users
- **CASA Assessment**: Required for production (Tier 2/3, paid, annual)
- **Timeline**: Verification: 4-8 weeks, CASA: 2-6 months

See [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) for the required privacy policy template.