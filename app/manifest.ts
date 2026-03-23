import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const troubleshootHost = process.env.TROUBLESHOOT_HOSTNAME || 'hemmts.academythriveni.com';
  const isTroubleshoot = host.split(':')[0] === troubleshootHost.split(':')[0];

  if (isTroubleshoot) {
    return {
      name: 'Troubleshooting Library - Thriveni',
      short_name: 'Troubleshooting Library',
      description: 'Standalone troubleshooting guide for Thriveni earthmoving machinery.',
      start_url: '/',
      display: 'standalone',
      background_color: '#f8fafc',
      theme_color: '#0a3292',
      icons: [
        {
          src: '/logo%20ts.webp',
          sizes: '512x512',
          type: 'image/webp',
          purpose: 'maskable',
        },
        {
          src: '/logo%20ts.webp',
          sizes: '512x512',
          type: 'image/webp',
          purpose: 'any',
        },
      ],
    };
  }

  // Default Portal Manifest
  return {
    name: 'Training Thriveni',
    short_name: 'Training',
    description: 'Training Management System for Thriveni Earthmovers',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a3292',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
