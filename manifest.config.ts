import { defineManifest } from '@crxjs/vite-plugin';

export function createManifest(clientId: string) {
  return defineManifest({
  manifest_version: 3,
  name: 'MailClean Pro',
  version: '1.0.0',
  description: 'Safely clean unnecessary Gmail emails with smart categorization.',
  permissions: ['identity', 'storage', 'alarms', 'notifications', 'tabs'],
  host_permissions: [
    'https://gmail.googleapis.com/*',
    'https://www.googleapis.com/*',
    'https://oauth2.googleapis.com/*',
  ],
  oauth2: {
    client_id: clientId,
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
    // default_icon: {
    //   '16': 'icons/icon16.png',
    //   '32': 'icons/icon32.png',
    //   '48': 'icons/icon48.png',
    //   '128': 'icons/icon128.png',
    // },
  },
  options_page: 'src/pages/options/index.html',
  chrome_url_overrides: {},
  web_accessible_resources: [
    {
      resources: ['src/pages/dashboard/index.html'],
      matches: ['<all_urls>'],
    },
  ],
  content_security_policy: {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; base-uri 'self'; frame-ancestors 'none';",
  },
  // icons: {
  //   '16': 'icons/icon16.png',
  //   '32': 'icons/icon32.png',
  //   '48': 'icons/icon48.png',
  //   '128': 'icons/icon128.png',
  // },
  });
}
