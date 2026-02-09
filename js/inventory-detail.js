// Inventory Detail Page - Fetch and render single equipment item
(function () {
    var loadingEl = document.querySelector('.detail-loading');
    var contentEl = document.querySelector('.detail-content');
    var errorEl = document.querySelector('.detail-error');

    // Get equipment ID from URL
    var params = new URLSearchParams(window.location.search);
    var equipmentId = params.get('id');

    if (!equipmentId) {
        showError();
        return;
    }

    function showError() {
        loadingEl.style.display = 'none';
        contentEl.style.display = 'none';
        errorEl.style.display = 'block';
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
        mainImg.alt = sorted[0].alt_text || 'Equipment photo';
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

    // Fetch equipment
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

            // Update page title
            document.title = item.title + ' | Snow Plow Sales';

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

            renderGallery(item.equipment_images);
            renderSpecs(item);
            showContent();
        })
        .catch(function (err) {
            console.error('Error fetching equipment:', err);
            showError();
        });
})();
