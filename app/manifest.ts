import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const referer = headersList.get('referer') || '';
  const currentHost = host.split(':')[0].toLowerCase();
  const isTroubleshoot = currentHost === 'hemmts.academythriveni.com' || currentHost.includes('hemmts') || currentHost.startsWith('troubleshoot');

  if (isTroubleshoot) {
    return {
      name: 'Troubleshooting Library',
      short_name: 'Troubleshooting Library',
      description: 'Standalone troubleshooting guide for Thriveni earthmoving machinery.',
      start_url: '/',
      display: 'standalone',
      background_color: '#f8fafc',
      theme_color: '#0a3292',
      icons: [
        {
          src: '/logo_ts.webp',
          sizes: '192x192 512x512',
          type: 'image/webp',
          purpose: 'maskable',
        },
        {
          src: '/logo_ts.webp',
          sizes: '192x192 512x512',
          type: 'image/webp',
          purpose: 'any',
        },
      ],
    };
  }

  // Default Portal Manifest (Completely non-installable)
  return {
    name: 'Training Thriveni',
    short_name: 'Training',
    display: 'browser',
  };
}
