// Homepage content loader for the redesign.
//
// Everything editable on the homepage lives in one Supabase row:
//   site_settings.key = 'home_content'  (JSON, edited in Admin → Homepage)
// The HTML ships with sensible defaults so the page renders even if the row
// is missing. Elements opt in with data attributes:
//   data-h="path.to.text"        → textContent
//   data-h-html="path"           → innerHTML (trusted admin copy only)
//   data-h-href="path"           → href
//   data-h-img="path"            → <img src> or background-image (data-h-bg)
//   data-h-show="path"           → hide element when value is falsy
// Image values may be a site path (/assets/...), a full URL, or a storage
// path inside the equipment-photos bucket (uploaded from admin).
(function () {
    if (typeof supabase === 'undefined' || typeof getImageUrl !== 'function') return;

    function get(obj, path) {
        return path.split('.').reduce(function (o, k) { return (o == null) ? undefined : o[k]; }, obj);
    }

    function imageUrl(v) {
        if (!v) return '';
        if (/^(https?:)?\//.test(v)) return v;
        return getImageUrl(v);
    }

    function youtubeEmbed(url) {
        if (!url) return '';
        var m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{6,})/);
        return m ? 'https://www.youtube.com/embed/' + m[1] : '';
    }

    function apply(data) {
        document.querySelectorAll('[data-h]').forEach(function (el) {
            var v = get(data, el.getAttribute('data-h'));
            if (typeof v === 'string' && v.trim()) el.textContent = v;
        });
        document.querySelectorAll('[data-h-html]').forEach(function (el) {
            var v = get(data, el.getAttribute('data-h-html'));
            if (typeof v === 'string' && v.trim()) el.innerHTML = v;
        });
        document.querySelectorAll('[data-h-href]').forEach(function (el) {
            var v = get(data, el.getAttribute('data-h-href'));
            if (typeof v === 'string' && v.trim()) el.setAttribute('href', v);
        });
        document.querySelectorAll('[data-h-img]').forEach(function (el) {
            var v = imageUrl(get(data, el.getAttribute('data-h-img')));
            if (!v) return;
            if (el.tagName === 'IMG') el.src = v; else el.style.backgroundImage = 'url("' + v + '")';
        });
        // Gated elements start hidden (CSS) and are revealed only when their
        // setting is on, so nothing flashes before the settings load.
        var demo = /(^|[?&])demo(=|&|$)/.test(window.location.search);
        document.querySelectorAll('[data-h-show]').forEach(function (el) {
            var v = get(data, el.getAttribute('data-h-show'));
            var on = !(v === undefined || v === false || v === '' || v === null);
            if (on || (demo && el.hasAttribute('data-demo-keep'))) el.classList.add('h-visible');
        });

        // Video: swap the poster/play placeholder for a real embed when a URL is set
        var video = document.querySelector('[data-h-video]');
        var embed = youtubeEmbed(get(data, 'video.url'));
        if (video && embed) {
            video.innerHTML = '<iframe src="' + embed + '" title="Snowplow Sales video" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>';
            video.classList.add('video--live');
        }

        // Open/closed badge from business_hours (already maintained in admin)
        renderOpenBadge();
    }

    function renderOpenBadge() {
        var badge = document.querySelector('[data-open-badge]');
        if (!badge) return;
        supabase.from('site_settings').select('value').eq('key', 'business_hours').maybeSingle().then(function (r) {
            if (!r.data || !r.data.value) return;
            var hours = r.data.value;
            var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            var now = new Date();
            var d = hours[days[now.getDay()]];
            function mins(t) {
                var m = (t || '').match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
                if (!m) return null;
                var h = parseInt(m[1], 10) % 12, mm = parseInt(m[2] || '0', 10);
                if ((m[3] || '').toUpperCase() === 'PM') h += 12;
                return h * 60 + mm;
            }
            var cur = now.getHours() * 60 + now.getMinutes();
            var open = d && !d.closed && mins(d.open) != null && mins(d.close) != null && cur >= mins(d.open) && cur < mins(d.close);
            badge.querySelector('span').textContent = open ? 'Open now until ' + d.close : (d && !d.closed ? 'Closed now • opens ' + d.open : 'Closed today');
            badge.classList.toggle('is-closed', !open);
        });
    }

    supabase.from('site_settings').select('value').eq('key', 'home_content').maybeSingle()
        .then(function (r) {
            apply((r && r.data && r.data.value) || {});
        })
        .catch(function () { apply({}); });
})();
