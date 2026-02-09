// Inventory Page - Fetch and render equipment from Supabase
(function () {
    var grid = document.querySelector('.inventory-grid');
    var tabs = document.querySelectorAll('.inventory-tab');
    var currentFilter = 'all';
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
        card.href = '/inventory-detail.html?id=' + item.id;
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

    // Render all cards with current filter
    function renderCards() {
        var filtered = equipmentData;
        if (currentFilter !== 'all') {
            filtered = equipmentData.filter(function (item) {
                return item.condition === currentFilter;
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
            })
            .catch(function (err) {
                console.error('Error fetching equipment:', err);
                showError();
            });
    }

    // Tab filtering
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var filter = this.getAttribute('data-filter');
            currentFilter = filter;

            tabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');

            renderCards();
        });
    });

    // Initialize
    fetchEquipment();
})();
