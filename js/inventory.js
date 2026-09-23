// Inventory Page - Fetch and render equipment from Supabase
(function () {
    var grid = document.querySelector('.inventory-grid');
    var conditionTabs = document.querySelectorAll('.inventory-tab:not(.category-tab)');
    var categoryTabs = document.querySelectorAll('.category-tab');
    var currentCondition = 'all';
    var currentCategory = 'all';
    var equipmentData = [];

    // Show loading state
    function showLoading() {
        grid.innerHTML =
            '<div class="inventory-loading">' +
                '<div class="loading-spinner"></div>' +
                '<p>Loading inventory...</p>' +
            '</div>';
    }

    // Show error state
    function showError(message) {
        grid.innerHTML =
            '<div class="inventory-empty">' +
                '<p>' + (message || 'Unable to load inventory. Please try again later.') + '</p>' +
            '</div>';
    }

    // Show empty state
    function showEmpty() {
        grid.innerHTML =
            '<div class="inventory-empty">' +
                '<p>No equipment found in this category. Check back soon!</p>' +
            '</div>';
    }

    // Render a single equipment card
    function renderCard(item) {
        var imageHtml;
        if (item.equipment_images && item.equipment_images.length > 0) {
            var sorted = item.equipment_images.slice().sort(function (a, b) {
                return (a.display_order || 0) - (b.display_order || 0);
            });
            var url = getImageUrl(sorted[0].storage_path);
            imageHtml =
                '<div class="inventory-image">' +
                    '<img src="' + url + '" alt="' + (sorted[0].alt_text || item.title) + '" loading="lazy">' +
                '</div>';
        } else {
            imageHtml =
                '<div class="inventory-image">' +
                    '<span>Photo Coming Soon</span>' +
                '</div>';
        }

        var badgeClass = item.condition === 'new' ? 'badge-new' : 'badge-used';
        var badgeText = item.condition === 'new' ? 'New' : 'Used';

        var priceHtml = '';
        if (item.price_display) {
            priceHtml = '<p class="inventory-price">' + item.price_display + '</p>';
        } else if (item.price) {
            priceHtml = '<p class="inventory-price">$' + Number(item.price).toLocaleString() + '</p>';
        }

        var card = document.createElement('a');
        card.href = '/inventory/' + item.id;
        card.className = 'inventory-item';
        card.setAttribute('data-type', item.condition);
        card.innerHTML =
            imageHtml +
            '<div class="inventory-details">' +
                '<h3>' + item.title + '</h3>' +
                '<p>' + (item.description || '') + '</p>' +
                priceHtml +
                '<span class="inventory-badge ' + badgeClass + '">' + badgeText + '</span>' +
            '</div>';

        return card;
    }

    // Render all cards with current filters
    function renderCards() {
        var filtered = equipmentData;

        if (currentCondition !== 'all') {
            filtered = filtered.filter(function (item) {
                return item.condition === currentCondition;
            });
        }

        if (currentCategory !== 'all') {
            filtered = filtered.filter(function (item) {
                return item.category === currentCategory;
            });
        }

        grid.innerHTML = '';

        if (filtered.length === 0) {
            showEmpty();
            return;
        }

        filtered.forEach(function (item) {
            grid.appendChild(renderCard(item));
        });
    }

    // SEO: describe the listing grid as a schema.org ItemList so search
    // engines can associate each detail page with this collection.
    function injectItemListSchema(items) {
        if (!items || items.length === 0) return;
        var existing = document.getElementById('inventory-itemlist-ld');
        if (existing) existing.remove();
        var origin = 'https://www.snowplowsales.com';
        var list = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'Current inventory at Snowplow Sales',
            'numberOfItems': items.length,
            'itemListElement': items.map(function (item, i) {
                return {
                    '@type': 'ListItem',
                    'position': i + 1,
                    'url': origin + '/inventory/' + item.id,
                    'name': item.title
                };
            })
        };
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'inventory-itemlist-ld';
        script.textContent = JSON.stringify(list);
        document.head.appendChild(script);
    }

    // Fetch equipment from Supabase
    function fetchEquipment() {
        showLoading();

        supabase
            .from('equipment')
            .select('*, equipment_images(*)')
            .eq('status', 'active')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false })
            .then(function (response) {
                if (response.error) {
                    console.error('Error fetching equipment:', response.error);
                    showError();
                    return;
                }

                equipmentData = response.data || [];
                renderCards();
                injectItemListSchema(equipmentData);
            })
            .catch(function (err) {
                console.error('Error fetching equipment:', err);
                showError();
            });
    }

    // Condition tab filtering (All / New / Used)
    conditionTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            currentCondition = this.getAttribute('data-filter');
            conditionTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            renderCards();
        });
    });

    // Category tab filtering (All Types / Plows / Spreaders / etc.)
    categoryTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            currentCategory = this.getAttribute('data-category');
            categoryTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            renderCards();
        });
    });

    // Initialize: the page ships in the "coming soon" state. Only reveal the
    // live grid when the admin switch (site_settings.inventory_page) is on.
    var noticeEl = document.getElementById('inventory-notice');
    var liveEl = document.getElementById('inventory-live');
    var noticeText = document.getElementById('inventory-notice-text');

    getInventoryVisibility().then(function (vis) {
        if (vis.public) {
            if (noticeEl) noticeEl.style.display = 'none';
            if (liveEl) liveEl.hidden = false;
            fetchEquipment();
        } else if (noticeText && vis.message) {
            noticeText.textContent = vis.message;
        }
    });
})();
