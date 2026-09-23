// Dynamic XML sitemap (Vercel serverless function).
//
// Served at /sitemap.xml via the rewrite in vercel.json. Lists every static
// page plus one URL per active inventory listing pulled from Supabase, so
// new equipment gets discovered by search engines without a redeploy.
// If Supabase is unreachable the static pages are still returned.

var SITE_URL = 'https://www.snowplowsales.com';
var SUPABASE_URL = process.env.SUPABASE_URL || 'https://mmkzpssjmkwrevgfebua.supabase.co';
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ta3pwc3NqbWt3cmV2Z2ZlYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTM5MTIsImV4cCI6MjA4NjIyOTkxMn0.gjmaZ_odMQv6hKRrrQCk8eCZ1mF7A026haJ6WZjSEIQ';

// Static pages: [path, changefreq, priority]
var STATIC_PAGES = [
    ['/', 'weekly', '1.0'],
    ['/inventory', 'daily', '0.9'],
    ['/products/fisher', 'monthly', '0.9'],
    ['/products/fisher-plows', 'monthly', '0.8'],
    ['/products/fisher-spreaders', 'monthly', '0.8'],
    ['/products/accessories', 'monthly', '0.7'],
    ['/products/toro', 'monthly', '0.8'],
    ['/services', 'monthly', '0.8'],
    ['/contact', 'monthly', '0.7']
];

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function isoDate(v) {
    var d = v ? new Date(v) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d.toISOString().slice(0, 10);
}

async function fetchEquipment() {
    var url = SUPABASE_URL + '/rest/v1/equipment?select=id,updated_at,created_at&status=eq.active&order=updated_at.desc&limit=1000';
    var res = await fetch(url, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + SUPABASE_ANON_KEY
        }
    });
    if (!res.ok) throw new Error('supabase ' + res.status);
    var rows = await res.json();
    return Array.isArray(rows) ? rows : [];
}

// Mirrors getInventoryVisibility() in js/supabase-config.js: a missing row
// means the public inventory is hidden.
async function inventoryIsPublic() {
    var url = SUPABASE_URL + '/rest/v1/site_settings?select=value&key=eq.inventory_page';
    var res = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
    });
    if (!res.ok) throw new Error('supabase ' + res.status);
    var rows = await res.json();
    return !!(rows && rows[0] && rows[0].value && rows[0].value.public === true);
}

module.exports = async function handler(req, res) {
    var today = isoDate();
    var urls = STATIC_PAGES.map(function (p) {
        return { loc: SITE_URL + p[0], lastmod: today, changefreq: p[1], priority: p[2] };
    });

    try {
        var items = (await inventoryIsPublic()) ? await fetchEquipment() : [];
        items.forEach(function (item) {
            if (!item || !item.id) return;
            urls.push({
                loc: SITE_URL + '/inventory/' + encodeURIComponent(item.id),
                lastmod: isoDate(item.updated_at || item.created_at),
                changefreq: 'weekly',
                priority: '0.6'
            });
        });
    } catch (err) {
        console.error('sitemap: equipment fetch failed', err && err.message);
    }

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls.map(function (u) {
            return '  <url>\n' +
                '    <loc>' + esc(u.loc) + '</loc>\n' +
                '    <lastmod>' + u.lastmod + '</lastmod>\n' +
                '    <changefreq>' + u.changefreq + '</changefreq>\n' +
                '    <priority>' + u.priority + '</priority>\n' +
                '  </url>';
        }).join('\n') +
        '\n</urlset>\n';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
};
