// /api/sitemap.js
// Generates sitemap.xml dynamically from published blog posts.
// Accessed via /sitemap.xml (routed through vercel.json rewrite).

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const baseUrl = 'https://deep433.com';

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/blog', priority: '0.9', changefreq: 'daily' },
    { url: '/submit', priority: '0.6', changefreq: 'weekly' },
  ];

  let postUrls = [];
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    postUrls = (posts || []).map(p => ({
      url: `/blog/${p.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : null,
    }));
  } catch (err) {
    // If Supabase fails, still return the static pages so the sitemap isn't broken entirely
  }

  const allUrls = [...staticPages, ...postUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${baseUrl}${u.url}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(xml);
}
