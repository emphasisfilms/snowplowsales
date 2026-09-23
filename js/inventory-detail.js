// Inventory Detail Page - Fetch and render single equipment item
(function () {
    var loadingEl = document.querySelector('.detail-loading');
    var contentEl = document.querySelector('.detail-content');
    var errorEl = document.querySelector('.detail-error');

    var SITE_ORIGIN = 'https://www.snowplowsales.com';

    // Get equipment ID from the URL. Canonical form is /inventory/<id>
    // (rewritten by vercel.json); ?id=<id> is still accepted.
    var params = new URLSearchParams(window.location.search);
    var equipmentId = params.get('id');
    if (!equipmentId) {
        var m = window.location.pathname.match(/^\/inventory\/([^\/]+)\/?$/);
        if (m) equipmentId = decodeURIComponent(m[1]);
    }

    if (!equipmentId) {
        showError();
        return;
    }

    function setMeta(selector, attr, value) {
        var el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
    }

    function setRobots(value) {
        var el = document.querySelector('meta[name="robots"]');
        if (!el) {
            el = document.createElement('meta');
            el.name = 'robots';
            document.head.appendChild(el);
        }
        el.content = value;
    }

    function showError() {
        loadingEl.style.display = 'none';
        contentEl.style.display = 'none';
        errorEl.style.display = 'block';
        // Sold / removed listings should drop out of the index.
        setRobots('noindex, follow');
        document.title = 'Equipment Not Found | Snow Plow Sales';
    }

    // SEO: page metadata + schema.org Product for this listing
    function applySeo(item, images) {
        var url = SITE_ORIGIN + '/inventory/' + item.id;
        var condition = item.condition === 'new' ? 'New' : 'Used';
        var title = item.title + ' | ' + condition + ' | Snow Plow Sales, Walpole NH';
        var descText = (item.description || '').replace(/\s+/g, ' ').trim();
        var snippet = descText.slice(0, 110);
        if (snippet && !/[.!?]$/.test(snippet)) snippet += '.';
        var description = condition + ' ' + item.title + ' for sale at Snow Plow Sales in Walpole, NH.' +
            (snippet ? ' ' + snippet : '') + ' Call 603-352-6855.';

        document.title = title;
        setMeta('meta[name="description"]', 'content', description);
        var canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = url;
        setMeta('meta[property="og:url"]', 'content', url);
        setMeta('meta[property="og:title"]', 'content', title);
        setMeta('meta[property="og:description"]', 'content', description);
        setMeta('meta[name="twitter:title"]', 'content', title);
        setMeta('meta[name="twitter:description"]', 'content', description);

        var imageUrls = (images || []).map(function (img) { return getImageUrl(img.storage_path); });
        if (imageUrls.length) {
            setMeta('meta[property="og:image"]', 'content', imageUrls[0]);
            setMeta('meta[name="twitter:image"]', 'content', imageUrls[0]);
        }

        var crumb = document.getElementById('crumb-current');
        if (crumb) crumb.textContent = item.title;

        var product = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Product',
                    '@id': url + '#product',
                    'name': item.title,
                    'description': descText || (condition + ' ' + item.title),
                    'url': url,
                    'sku': item.serial_number || item.id,
                    'itemCondition': item.condition === 'new'
                        ? 'https://schema.org/NewCondition'
                        : 'https://schema.org/UsedCondition',
                    'offers': {
                        '@type': 'Offer',
                        'url': url,
                        'priceCurrency': 'USD',
                        'availability': 'https://schema.org/InStock',
                        'itemCondition': item.condition === 'new'
                            ? 'https://schema.org/NewCondition'
                            : 'https://schema.org/UsedCondition',
                        'seller': { '@id': SITE_ORIGIN + '/#business' },
                        'availableAtOrFrom': { '@id': SITE_ORIGIN + '/#business' }
                    }
                },
                {
                    '@type': 'BreadcrumbList',
                    'itemListElement': [
                        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_ORIGIN + '/' },
                        { '@type': 'ListItem', 'position': 2, 'name': 'Inventory', 'item': SITE_ORIGIN + '/inventory' },
                        { '@type': 'ListItem', 'position': 3, 'name': item.title, 'item': url }
                    ]
                }
            ]
        };
        var p = product['@graph'][0];
        if (imageUrls.length) p.image = imageUrls;
        if (item.manufacturer) p.brand = { '@type': 'Brand', 'name': item.manufacturer };
        if (item.model) p.model = item.model;
        if (item.year) p.productionDate = String(item.year);
        if (item.price && !isNaN(Number(item.price))) {
            p.offers.price = Number(item.price).toFixed(2);
        }

        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'product-ld';
        script.textContent = JSON.stringify(product);
        document.head.appendChild(script);
    }

    function showContent() {
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        errorEl.style.display = 'none';
    }

    // Render photo gallery
    function renderGallery(images) {
        var mainImg = document.getElementById('gallery-main-img');
        var placeholder = document.querySelector('.gallery-placeholder');
        var thumbsContainer = document.getElementById('gallery-thumbs');

        if (!images || images.length === 0) {
            mainImg.style.display = 'none';
            placeholder.style.display = 'flex';
            return;
        }

        // Sort by display_order
        var sorted = images.slice().sort(function (a, b) {
            return (a.display_order || 0) - (b.display_order || 0);
        });

        // Set main image
        var mainUrl = getImageUrl(sorted[0].storage_path);
        mainImg.src = mainUrl;
        mainImg.alt = sorted[0].alt_text || (document.getElementById('detail-title').textContent || 'Equipment') + ' at Snow Plow Sales, Walpole NH';
        mainImg.style.display = 'block';
        placeholder.style.display = 'none';

        // Render thumbnails if more than one image
        if (sorted.length > 1) {
            sorted.forEach(function (img, index) {
                var url = getImageUrl(img.storage_path);
                var thumb = document.createElement('button');
                thumb.className = 'gallery-thumb' + (index === 0 ? ' active' : '');
                thumb.innerHTML = '<img src="' + url + '" alt="' + (img.alt_text || 'Thumbnail') + '">';
                thumb.addEventListener('click', function () {
                    mainImg.src = url;
                    mainImg.alt = img.alt_text || 'Equipment photo';
                    thumbsContainer.querySelectorAll('.gallery-thumb').forEach(function (t) {
                        t.classList.remove('active');
                    });
                    thumb.classList.add('active');
                });
                thumbsContainer.appendChild(thumb);
            });
        }
    }

    // Render specs table
    function renderSpecs(item) {
        var tbody = document.querySelector('#specs-table tbody');
        var specs = [];

        if (item.manufacturer) specs.push(['Manufacturer', item.manufacturer]);
        if (item.model) specs.push(['Model', item.model]);
        if (item.year) specs.push(['Year', item.year]);
        if (item.condition) specs.push(['Condition', item.condition === 'new' ? 'New' : 'Used']);
        if (item.hours) specs.push(['Hours', item.hours]);
        if (item.serial_number) specs.push(['Serial Number', item.serial_number]);

        if (specs.length === 0) {
            document.getElementById('specs-table').style.display = 'none';
            return;
        }

        specs.forEach(function (spec) {
            var row = document.createElement('tr');
            row.innerHTML = '<td>' + spec[0] + '</td><td>' + spec[1] + '</td>';
            tbody.appendChild(row);
        });
    }

    // Public inventory hidden → show the "coming soon" notice instead of the listing
    var hiddenEl = document.querySelector('.detail-hidden');
    function showHidden(message) {
        loadingEl.style.display = 'none';
        contentEl.style.display = 'none';
        errorEl.style.display = 'none';
        if (hiddenEl) {
            var txt = hiddenEl.querySelector('.js-inventory-notice-text');
            if (txt && message) txt.textContent = message;
            hiddenEl.style.display = 'block';
        }
        setRobots('noindex, follow');
        document.title = 'Online Inventory Coming Soon | Snow Plow Sales';
    }

    getInventoryVisibility().then(function (vis) {
        if (!vis.public) {
            showHidden(vis.message);
            return;
        }
        fetchItem();
    });

    // Fetch equipment
    function fetchItem() {
    supabase
        .from('equipment')
        .select('*, equipment_images(*)')
        .eq('id', equipmentId)
        .eq('status', 'active')
        .single()
        .then(function (response) {
            if (response.error || !response.data) {
                showError();
                return;
            }

            var item = response.data;

            // SEO metadata + Product schema
            applySeo(item, (item.equipment_images || []).slice().sort(function (a, b) {
                return (a.display_order || 0) - (b.display_order || 0);
            }));

            // Fill in details
            document.getElementById('detail-title').textContent = item.title;

            var badge = document.getElementById('detail-badge');
            badge.textContent = item.condition === 'new' ? 'New' : 'Used';
            badge.className = 'inventory-badge ' + (item.condition === 'new' ? 'badge-new' : 'badge-used');

            var priceEl = document.getElementById('detail-price');
            if (item.price_display) {
                priceEl.textContent = item.price_display;
            } else if (item.price) {
                priceEl.textContent = '$' + Number(item.price).toLocaleString();
            } else {
                priceEl.textContent = 'Call for Pricing';
            }

            document.getElementById('detail-description').textContent = item.description || '';

            // Update "Send a Message" link with product info
            var messageLink = document.querySelector('.detail-cta .btn-secondary');
            if (messageLink) {
                messageLink.href = '/contact?product=' + encodeURIComponent(item.title) + '#message-form';
            }

            renderGallery(item.equipment_images);
            renderSpecs(item);
            showContent();
        })
        .catch(function (err) {
            console.error('Error fetching equipment:', err);
            showError();
        });
    }
})();
