// /api/blog-preview.js
// Detects social media crawlers (X/Twitter, WhatsApp, Facebook, Slack, Discord, etc.)
// requesting a blog post URL, and serves a lightweight HTML page with proper
// Open Graph / Twitter Card meta tags for that specific post.
//
// Real human visitors are NOT affected — this only responds to known bot user-agents.
// Wired up via vercel.json rewrite: any /blog/:slug request first hits this function;
// if it's not a crawler, it redirects through to the normal SPA.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const CRAWLER_PATTERNS = [
  'facebookexternalhit', 'Facebot',
  'Twitterbot',
  'WhatsApp',
  'Slackbot',
  'Discordbot',
  'LinkedInBot',
  'TelegramBot',
  'Googlebot',
  'bingbot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_PATTERNS.some(pattern => userAgent.toLowerCase().includes(pattern.toLowerCase()));
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || '';
  const slug = req.query.slug;

  // Extract slug from the path if not passed as a query param directly
  const pathSlug = slug || req.url.split('/blog/')[1]?.split('?')[0];

  if (!pathSlug) {
    res.writeHead(302, { Location: '/blog' });
    return res.end();
  }

  // If this isn't a known crawler, redirect with a bypass flag so the rewrite
  // rule sends it straight to the real app instead of back through this function
  if (!isCrawler(userAgent)) {
    res.writeHead(302, { Location: `/blog/${pathSlug}?spa=1` });
    return res.end();
  }

  // Crawler detected — fetch the post and serve minimal HTML with correct meta tags
  try {
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, subtitle, image_url, published')
      .eq('slug', pathSlug)
      .eq('published', true)
      .single();

    if (!post) {
      res.writeHead(302, { Location: '/blog' });
      return res.end();
    }

    const title = escapeHtml(post.title || 'Deep433');
    const description = escapeHtml(post.subtitle || "Data-driven football insights, predictions, and community takes.");
    const image = post.image_url || 'https://deep433.com/deep433.jpg';
    const url = `https://deep433.com/blog/${pathSlug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — Deep433</title>
  <meta name="description" content="${description}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Deep433" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:site" content="@Deep_433" />
</head>
<body>
  <p>${title}</p>
  <a href="${url}">Read on Deep433</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    res.writeHead(302, { Location: `/blog/${pathSlug}?spa=1` });
    return res.end();
  }
}
