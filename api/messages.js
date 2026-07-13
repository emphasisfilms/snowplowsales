// Contact form endpoint (Vercel serverless function).
//
// Mirrors cvyardworks /api/messages: inserts the message into the Supabase
// `messages` inbox, then emails the owner via Resend. Email is best-effort —
// a Resend outage or missing key never blocks the submission. Until
// RESEND_API_KEY / NOTIFY_EMAIL_TO are set in Vercel, the email falls back
// to the legacy Formspree endpoint so alerts keep flowing.
//
// Env vars (Vercel project settings):
//   RESEND_API_KEY     — resend.com API key
//   NOTIFY_EMAIL_TO    — where owner alerts go
//   NOTIFY_EMAIL_FROM  — sender, e.g. "Snow Plow Sales <onboarding@resend.dev>"

// Public values — same ones shipped to browsers in js/supabase-config.js.
var SUPABASE_URL = process.env.SUPABASE_URL || 'https://mmkzpssjmkwrevgfebua.supabase.co';
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ta3pwc3NqbWt3cmV2Z2ZlYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTM5MTIsImV4cCI6MjA4NjIyOTkxMn0.gjmaZ_odMQv6hKRrrQCk8eCZ1mF7A026haJ6WZjSEIQ';

var FORMSPREE_URL = 'https://formspree.io/f/xjgekayw';
var SITE_URL = process.env.NOTIFY_SITE_URL || 'https://www.snowplowsales.com';

function clean(v, max) {
    if (typeof v !== 'string') return null;
    var s = v.trim().slice(0, max || 500);
    return s || null;
}

function esc(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function row(label, value) {
    if (!value) return '';
    return '<tr>' +
        '<td style="padding:6px 14px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">' + label + '</td>' +
        '<td style="padding:6px 0;color:#1a1a1a;font-size:14px;">' + esc(value) + '</td>' +
        '</tr>';
}

async function sendResendEmail(msg) {
    var apiKey = process.env.RESEND_API_KEY;
    var to = process.env.NOTIFY_EMAIL_TO;
    if (!apiKey || !to) return false;

    var from = process.env.NOTIFY_EMAIL_FROM || 'Snow Plow Sales <onboarding@resend.dev>';

    var html =
        '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">' +
        '<div style="background:#1a1a1a;border-radius:10px 10px 0 0;padding:18px 24px;">' +
        '<h1 style="margin:0;color:#ffffff;font-size:18px;">New Website Message</h1>' +
        '</div>' +
        '<div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:20px 24px;">' +
        '<table cellpadding="0" cellspacing="0" style="width:100%;">' +
        row('Name', msg.name) +
        row('Email', msg.email) +
        row('Phone', msg.phone) +
        row('Message', msg.message) +
        '</table>' +
        '<p style="margin:18px 0 0;">' +
        '<a href="' + SITE_URL + '/admin.html" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:10px 18px;border-radius:6px;">View in admin inbox</a>' +
        '</p>' +
        '</div></div>';

    var res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: from,
            to: to,
            reply_to: msg.email || undefined,
            subject: 'New website message from ' + msg.name,
            html: html,
        }),
    });

    if (!res.ok) {
        console.error('notify: Resend send failed', res.status, await res.text());
    }
    return true; // key was configured — don't also hit Formspree
}

async function sendFormspreeFallback(msg) {
    var params = new URLSearchParams();
    if (msg.name) params.set('name', msg.name);
    if (msg.email) params.set('email', msg.email);
    if (msg.phone) params.set('phone', msg.phone);
    if (msg.message) params.set('message', msg.message);

    var res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!res.ok) {
        console.error('notify: Formspree fallback failed', res.status, await res.text());
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
    }

    var body = req.body || {};
    var name = clean(body.name);
    if (!name) {
        res.status(400).json({ ok: false, error: 'Name is required' });
        return;
    }

    var payload = {
        name: name,
        email: clean(body.email),
        phone: clean(body.phone),
        message: clean(body.message, 5000),
    };

    var insert = await fetch(SUPABASE_URL + '/rest/v1/messages', {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
    });

    if (!insert.ok) {
        console.error('messages: insert failed', insert.status, await insert.text());
        res.status(500).json({ ok: false, error: 'Failed to save message' });
        return;
    }

    // Best-effort — never fail the submission over a notification problem.
    try {
        var sentViaResend = await sendResendEmail(payload);
        if (!sentViaResend) {
            console.warn('notify: RESEND_API_KEY / NOTIFY_EMAIL_TO not set — using Formspree fallback');
            await sendFormspreeFallback(payload);
        }
    } catch (e) {
        console.error('messages: notification email failed', e);
    }

    res.status(200).json({ ok: true });
};
