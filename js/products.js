// Product Listings - Load products from Supabase and render on Fisher/Toro pages
(function () {
    var container = document.getElementById('product-grid');
    if (!container) return;

    var brand = container.getAttribute('data-brand');
    if (!brand) return;

    container.innerHTML = '<div class="product-grid-loading">Loading products...</div>';

    supabase.from('site_settings').select('value').eq('key', 'products_' + brand).single()
        .then(function (r) {
            if (r.error || !r.data || !r.data.value || !r.data.value.products || r.data.value.products.length === 0) {
                container.innerHTML = '';
                return;
            }

            var products = r.data.value.products;
            container.innerHTML = '';

            products.forEach(function (product) {
                var isLink = product.url && product.url.trim() !== '';
                var tag = isLink ? 'a' : 'div';
                var card = document.createElement(tag);
                card.className = 'product-card';

                if (isLink) {
                    card.href = product.url;
                    card.target = '_blank';
                    card.rel = 'noopener noreferrer';
                }

                var photoHtml = '';
                if (product.photo) {
                    var url = getImageUrl(product.photo);
                    photoHtml = '<img class="product-card-photo" src="' + url + '" alt="' + (product.name || '') + '">';
                }

                var linkHtml = isLink ? '<span class="product-card-link">Learn More &rarr;</span>' : '';

                card.innerHTML = photoHtml +
                    '<div class="product-card-body">' +
                        '<h3>' + (product.name || '') + '</h3>' +
                        (product.description ? '<p>' + product.description + '</p>' : '') +
                        linkHtml +
                    '</div>';

                container.appendChild(card);
            });
        })
        .catch(function (err) {
            console.error('Error loading products:', err);
            container.innerHTML = '';
        });
})();
