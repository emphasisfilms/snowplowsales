// Site Settings - Fetches alert banner and business hours from Supabase
(function () {
    // Need Supabase client available
    if (typeof supabase === 'undefined') return;

    // ========================================
    // Alert Banner
    // ========================================
    supabase.from('site_settings').select('value').eq('key', 'site_alert').single()
        .then(function (r) {
            if (r.error || !r.data) return;
            var alert = r.data.value;
            if (!alert.active || !alert.message) return;

            // Check if dismissed this session
            if (sessionStorage.getItem('alert_dismissed') === alert.message) return;

            var colors = {
                info: { bg: 'rgba(33,150,243,0.95)', text: '#fff' },
                warning: { bg: 'rgba(255,152,0,0.95)', text: '#fff' },
                urgent: { bg: 'rgba(220,38,38,0.95)', text: '#fff' }
            };
            var c = colors[alert.type] || colors.info;

            var banner = document.createElement('div');
            banner.id = 'site-alert-banner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:' + c.bg +
                ';color:' + c.text + ';padding:12px 48px 12px 20px;text-align:center;font-family:Raleway,sans-serif;' +
                'font-weight:700;font-size:0.9rem;animation:slideDown 0.3s ease;';
            banner.textContent = alert.message;

            // Close button
            var close = document.createElement('button');
            close.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;' +
                'border:none;color:inherit;font-size:1.2rem;cursor:pointer;opacity:0.8;padding:4px 8px;';
            close.innerHTML = '&times;';
            close.addEventListener('click', function () {
                banner.remove();
                sessionStorage.setItem('alert_dismissed', alert.message);
                // Reset header position
                var header = document.querySelector('.header');
                if (header) header.style.top = '0';
            });
            banner.appendChild(close);

            document.body.prepend(banner);

            // Push fixed header down
            var header = document.querySelector('.header');
            if (header) {
                var bannerHeight = banner.offsetHeight;
                header.style.top = bannerHeight + 'px';
            }
        });

    // ========================================
    // Homepage inventory callout
    // Static markup is the "coming soon / call us" state; upgrade to a live
    // "View Inventory" link when the public inventory page is switched on.
    // ========================================
    var calloutText = document.getElementById('inventory-callout-text');
    var calloutBtn = document.getElementById('inventory-callout-btn');
    if (calloutText && calloutBtn && typeof getInventoryVisibility === 'function') {
        getInventoryVisibility().then(function (vis) {
            if (!vis.public) return;
            calloutText.textContent = 'New and used Fisher plows, spreaders, Toro snow blowers, mowers, and more. See what\'s in stock right now.';
            calloutBtn.textContent = 'View Inventory';
            calloutBtn.href = '/inventory';
        });
    }

    // ========================================
    // Dynamic Business Hours
    // ========================================
    supabase.from('site_settings').select('value').eq('key', 'business_hours').single()
        .then(function (r) {
            if (r.error || !r.data) return;
            var hours = r.data.value;

            // Build summary for hero-phone and contact-bar
            var mfOpen = hours.monday && !hours.monday.closed ? hours.monday.open : '';
            var mfClose = hours.monday && !hours.monday.closed ? hours.monday.close : '';
            var satOpen = hours.saturday && !hours.saturday.closed ? hours.saturday.open : '';
            var satClose = hours.saturday && !hours.saturday.closed ? hours.saturday.close : '';

            // Short format for hero phone area: "Mon-Fri 8-5 · Sat 8-12"
            var heroText = '';
            if (mfOpen && mfClose) {
                heroText = 'Mon\u2013Fri ' + shortTime(mfOpen) + '\u2013' + shortTime(mfClose);
            }
            if (satOpen && satClose) {
                heroText += (heroText ? ' \u2022 ' : '') + 'Sat ' + shortTime(satOpen) + '\u2013' + shortTime(satClose);
            }
            if (hours.sunday && hours.sunday.closed) {
                // Don't add Sunday to short format
            }

            // Update hero-phone span (legacy) and the utility bar mini hours (every page)
            var heroPhone = document.querySelector('.hero-phone span');
            if (heroPhone && heroText) {
                heroPhone.textContent = heroText;
            }
            document.querySelectorAll('.js-hours-mini').forEach(function (el) {
                if (heroText) el.textContent = heroText;
            });

            // Update footer hours summary (every page)
            document.querySelectorAll('.js-hours-short').forEach(function (el) {
                var lines = [];
                if (mfOpen && mfClose) lines.push('Mon\u2013Fri ' + mfOpen + '\u2013' + mfClose);
                if (satOpen && satClose) lines.push('Sat ' + satOpen + '\u2013' + satClose);
                if (hours.sunday && hours.sunday.closed) lines.push('Sun Closed');
                if (lines.length) el.innerHTML = lines.map(escapeHtml).join('<br>');
            });

            // Update contact-bar hours (index.html)
            var contactBarHours = document.querySelector('.contact-bar .contact-item:last-child p');
            if (contactBarHours) {
                var barText = '';
                if (mfOpen && mfClose) barText = 'Mon\u2013Fri: ' + mfOpen + '\u2013' + mfClose;
                if (satOpen && satClose) barText += (barText ? '\n' : '') + 'Sat: ' + satOpen + '\u2013' + satClose;
                if (hours.sunday && hours.sunday.closed) barText += (barText ? '\n' : '') + 'Sunday: Closed';
                if (barText) contactBarHours.innerHTML = barText.replace(/\n/g, '<br>');
            }

            // Update contact.html hours info-block and the homepage location block
            var contactHours = document.querySelector('.contact-info-card .info-block:last-of-type p');
            var longTargets = Array.prototype.slice.call(document.querySelectorAll('.js-hours-long'));
            if (contactHours) longTargets.push(contactHours);
            if (longTargets.length) {
                var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                var dayNames = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

                // Group consecutive days with same hours
                var lines = [];
                var i = 0;
                while (i < days.length) {
                    var day = days[i];
                    var d = hours[day];
                    if (!d) { i++; continue; }

                    if (d.closed) {
                        lines.push(dayNames[day] + ': Closed');
                        i++;
                    } else {
                        var rangeStart = day;
                        var rangeEnd = day;
                        var j = i + 1;
                        while (j < days.length) {
                            var nextD = hours[days[j]];
                            if (nextD && !nextD.closed && nextD.open === d.open && nextD.close === d.close) {
                                rangeEnd = days[j];
                                j++;
                            } else {
                                break;
                            }
                        }
                        if (rangeStart === rangeEnd) {
                            lines.push(dayNames[rangeStart] + ': ' + d.open + ' \u2013 ' + d.close);
                        } else {
                            lines.push(dayNames[rangeStart] + ' \u2013 ' + dayNames[rangeEnd] + ': ' + d.open + ' \u2013 ' + d.close);
                        }
                        i = j;
                    }
                }

                if (lines.length > 0) {
                    longTargets.forEach(function (el) { el.innerHTML = lines.join('<br>'); });
                }
            }

            // Special note
            if (hours.special_note) {
                var noteTargets = [
                    document.querySelector('.contact-bar .contact-item:last-child p'),
                    document.querySelector('.contact-info-card .info-block:last-of-type p')
                ].concat(Array.prototype.slice.call(document.querySelectorAll('.js-hours-long')));
                noteTargets.forEach(function (el) {
                    if (el) {
                        el.innerHTML += '<br><span style="color:#d4a017;font-weight:700;">' + escapeHtml(hours.special_note) + '</span>';
                    }
                });
            }
        });

    function shortTime(t) {
        // "8:00 AM" → "8" or "5:00 PM" → "5" or "12:00 PM" → "12"
        if (!t) return '';
        var m = t.match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
        if (!m) return t;
        var h = m[1];
        var min = m[2] || '00';
        if (min === '00') return h;
        return h + ':' + min;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
