import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const referer = headersList.get('referer') || '';
  const troubleshootHost = process.env.TROUBLESHOOT_HOSTNAME || 'hemmts.academythriveni.com';
  
  const isTroubleshoot = 
    host.split(':')[0] === troubleshootHost.split(':')[0] || 
    referer.includes('/troubleshoot');

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

  // Default Portal Manifest (Not an installable PWA)
  return {
    name: 'Training Thriveni',
    short_name: 'Training',
    description: 'Training Management System for Thriveni Earthmovers',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#0a3292',
  };
}
