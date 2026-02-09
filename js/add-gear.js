// Add Gear - Mobile-first quick equipment manager
(function () {
    // Elements
    var loginScreen = document.getElementById('login-screen');
    var app = document.getElementById('app');
    var loginBtn = document.getElementById('login-btn');
    var loginEmail = document.getElementById('login-email');
    var loginPassword = document.getElementById('login-password');
    var loginError = document.getElementById('login-error');
    var logoutBtn = document.getElementById('logout-btn');
    var listSection = document.getElementById('list-section');
    var formSection = document.getElementById('form-section');
    var gearForm = document.getElementById('gear-form');
    var gearList = document.getElementById('gear-list');
    var newGearBtn = document.getElementById('new-gear-btn');
    var backBtn = document.getElementById('back-btn');
    var saveBtn = document.getElementById('save-btn');
    var deleteBtn = document.getElementById('delete-gear-btn');
    var appTitle = document.getElementById('app-title');
    var photoInput = document.getElementById('photo-input');
    var addPhotoBtn = document.getElementById('add-photo-btn');
    var photoGrid = document.getElementById('photo-grid');
    var toast = document.getElementById('toast');

    var pendingFiles = [];
    var existingImages = [];
    var currentFilter = 'active';

    // ========================================
    // Toast
    // ========================================
    function showToast(msg, type) {
        toast.textContent = msg;
        toast.className = 'toast toast-' + (type || 'success') + ' show';
        setTimeout(function () { toast.className = 'toast'; }, 3000);
    }

    // ========================================
    // Auth
    // ========================================
    function checkSession() {
        supabase.auth.getSession().then(function (r) {
            if (r.data.session) { showApp(); } else { showLogin(); }
        });
    }

    function showLogin() {
        loginScreen.style.display = 'flex';
        app.style.display = 'none';
    }

    function showApp() {
        loginScreen.style.display = 'none';
        app.style.display = 'block';
        showList();
    }

    loginBtn.addEventListener('click', function () {
        loginError.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';

        supabase.auth.signInWithPassword({
            email: loginEmail.value,
            password: loginPassword.value
        }).then(function (r) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
            if (r.error) {
                loginError.textContent = r.error.message;
                loginError.style.display = 'block';
                return;
            }
            showApp();
        });
    });

    // Allow Enter key to submit login
    loginPassword.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') loginBtn.click();
    });

    logoutBtn.addEventListener('click', function () {
        supabase.auth.signOut().then(function () { showLogin(); });
    });

    supabase.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_OUT') showLogin();
    });

    // ========================================
    // List View
    // ========================================
    function showList() {
        listSection.style.display = 'block';
        formSection.style.display = 'none';
        backBtn.style.display = 'none';
        appTitle.textContent = 'Gear';
        loadGear();
    }

    function loadGear() {
        gearList.innerHTML = '<div style="text-align:center;padding:40px;color:#8a8478;"><div class="loading-anim"></div>Loading...</div>';

        var query = supabase
            .from('equipment')
            .select('*, equipment_images(id, storage_path, display_order)')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (currentFilter === 'active') {
            query = query.eq('status', 'active');
        }

        query.then(function (r) {
            if (r.error) {
                gearList.innerHTML = '<div class="list-empty">Error loading gear</div>';
                return;
            }

            var items = r.data || [];
            if (items.length === 0) {
                gearList.innerHTML = '<div class="list-empty">No gear yet. Tap + Add New Gear below.</div>';
                return;
            }

            gearList.innerHTML = '';
            items.forEach(function (item) {
                var card = document.createElement('div');
                card.className = 'gear-card';

                // Get first image
                var thumbHtml = '<div class="gear-card-thumb">No Photo</div>';
                if (item.equipment_images && item.equipment_images.length > 0) {
                    var sorted = item.equipment_images.slice().sort(function (a, b) {
                        return (a.display_order || 0) - (b.display_order || 0);
                    });
                    var url = getImageUrl(sorted[0].storage_path);
                    thumbHtml = '<div class="gear-card-thumb"><img src="' + url + '" alt=""></div>';
                }

                var statusBadge = '';
                if (item.status !== 'active') {
                    statusBadge = ' <span class="gear-card-badge badge-' + item.status + '">' + item.status + '</span>';
                }

                var priceText = '';
                if (item.price_display) priceText = item.price_display;
                else if (item.price) priceText = '$' + Number(item.price).toLocaleString();

                card.innerHTML =
                    thumbHtml +
                    '<div class="gear-card-info">' +
                        '<h4>' + item.title + '</h4>' +
                        '<p>' + (item.manufacturer || '') + (item.model ? ' ' + item.model : '') +
                        (priceText ? ' &bull; ' + priceText : '') + '</p>' +
                        '<span class="gear-card-badge badge-' + item.condition + '">' + item.condition + '</span>' +
                        statusBadge +
                    '</div>';

                card.addEventListener('click', function () { editGear(item.id); });
                gearList.appendChild(card);
            });
        });
    }

    // Filter tabs
    document.querySelectorAll('.view-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.view-tab').forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            loadGear();
        });
    });

    // ========================================
    // Form View
    // ========================================
    newGearBtn.addEventListener('click', function () {
        resetForm();
        appTitle.textContent = 'Add Gear';
        deleteBtn.style.display = 'none';
        showForm();
    });

    backBtn.addEventListener('click', function () {
        showList();
    });

    function showForm() {
        listSection.style.display = 'none';
        formSection.style.display = 'block';
        backBtn.style.display = 'inline-block';
        window.scrollTo(0, 0);
    }

    function resetForm() {
        gearForm.reset();
        document.getElementById('gear-id').value = '';
        pendingFiles = [];
        existingImages = [];
        renderPhotos();

        // Reset condition toggle
        document.querySelectorAll('.condition-opt').forEach(function (b) { b.classList.remove('active'); });
        document.querySelector('.condition-opt[data-val="new"]').classList.add('active');
    }

    // Condition toggle
    document.querySelectorAll('.condition-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.condition-opt').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    // ========================================
    // Edit
    // ========================================
    function editGear(id) {
        resetForm();
        appTitle.textContent = 'Edit Gear';
        deleteBtn.style.display = 'block';
        showForm();

        saveBtn.disabled = true;
        saveBtn.textContent = 'Loading...';

        supabase.from('equipment').select('*, equipment_images(*)').eq('id', id).single()
            .then(function (r) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Gear';

                if (r.error) { showToast('Error loading', 'error'); return; }

                var item = r.data;
                document.getElementById('gear-id').value = item.id;
                document.getElementById('f-title').value = item.title || '';
                document.getElementById('f-manufacturer').value = item.manufacturer || '';
                document.getElementById('f-model').value = item.model || '';
                document.getElementById('f-price').value = item.price || '';
                document.getElementById('f-price-display').value = item.price_display || '';
                document.getElementById('f-description').value = item.description || '';
                document.getElementById('f-year').value = item.year || '';
                document.getElementById('f-hours').value = item.hours || '';
                document.getElementById('f-serial').value = item.serial_number || '';
                document.getElementById('f-status').value = item.status || 'active';

                // Condition toggle
                var cond = item.condition || 'new';
                document.querySelectorAll('.condition-opt').forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute('data-val') === cond);
                });

                // Existing images
                existingImages = (item.equipment_images || []).slice().sort(function (a, b) {
                    return (a.display_order || 0) - (b.display_order || 0);
                });
                renderPhotos();
            });
    }

    // ========================================
    // Photos
    // ========================================
    addPhotoBtn.addEventListener('click', function () {
        photoInput.click();
    });

    photoInput.addEventListener('change', function () {
        Array.from(this.files).forEach(function (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Photo too large (max 5MB)', 'error');
                return;
            }
            pendingFiles.push(file);
        });
        photoInput.value = '';
        renderPhotos();
    });

    function renderPhotos() {
        // Clear all except the add button
        var items = photoGrid.querySelectorAll('.photo-thumb');
        items.forEach(function (el) { el.remove(); });

        // Existing images
        existingImages.forEach(function (img, idx) {
            var div = document.createElement('div');
            div.className = 'photo-thumb';
            var url = getImageUrl(img.storage_path);
            div.innerHTML =
                '<img src="' + url + '" alt="">' +
                '<button type="button" class="photo-remove" data-idx="' + idx + '" data-type="existing">&times;</button>';
            photoGrid.insertBefore(div, addPhotoBtn);
        });

        // Pending files
        pendingFiles.forEach(function (file, idx) {
            var div = document.createElement('div');
            div.className = 'photo-thumb';
            div.innerHTML = '<div style="width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;color:#8a8478;font-size:0.7rem;">Loading...</div>' +
                '<button type="button" class="photo-remove" data-idx="' + idx + '" data-type="pending">&times;</button>';
            photoGrid.insertBefore(div, addPhotoBtn);

            var reader = new FileReader();
            reader.onload = function (e) {
                var imgEl = document.createElement('img');
                imgEl.src = e.target.result;
                imgEl.alt = '';
                div.querySelector('div').replaceWith(imgEl);
            };
            reader.readAsDataURL(file);
        });

        // Bind remove buttons
        photoGrid.querySelectorAll('.photo-remove').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var type = this.getAttribute('data-type');
                var idx = parseInt(this.getAttribute('data-idx'));

                if (type === 'pending') {
                    pendingFiles.splice(idx, 1);
                    renderPhotos();
                } else {
                    var img = existingImages[idx];
                    if (!confirm('Delete this photo?')) return;
                    supabase.from('equipment_images').delete().eq('id', img.id).then(function (r) {
                        if (!r.error) {
                            supabase.storage.from('equipment-photos').remove([img.storage_path]);
                            existingImages.splice(idx, 1);
                            renderPhotos();
                            showToast('Photo deleted');
                        }
                    });
                }
            });
        });
    }

    function uploadPhotos(equipmentId) {
        if (pendingFiles.length === 0) return Promise.resolve();

        var startOrder = existingImages.length;
        var promises = pendingFiles.map(function (file, i) {
            var ext = file.name.split('.').pop().toLowerCase();
            var path = equipmentId + '/' + Date.now() + '-' + i + '.' + ext;

            return supabase.storage.from('equipment-photos').upload(path, file, { contentType: file.type })
                .then(function (r) {
                    if (r.error) throw new Error(r.error.message);
                    return supabase.from('equipment_images').insert({
                        equipment_id: equipmentId,
                        storage_path: path,
                        display_order: startOrder + i,
                        alt_text: ''
                    });
                });
        });

        return Promise.all(promises);
    }

    // ========================================
    // Save
    // ========================================
    saveBtn.addEventListener('click', function () {
        var title = document.getElementById('f-title').value.trim();
        if (!title) {
            showToast('Title is required', 'error');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        var condition = 'new';
        var activeOpt = document.querySelector('.condition-opt.active');
        if (activeOpt) condition = activeOpt.getAttribute('data-val');

        var id = document.getElementById('gear-id').value;
        var data = {
            title: title,
            condition: condition,
            manufacturer: document.getElementById('f-manufacturer').value || null,
            model: document.getElementById('f-model').value || null,
            price: document.getElementById('f-price').value ? parseFloat(document.getElementById('f-price').value) : null,
            price_display: document.getElementById('f-price-display').value || null,
            description: document.getElementById('f-description').value || null,
            year: document.getElementById('f-year').value ? parseInt(document.getElementById('f-year').value) : null,
            hours: document.getElementById('f-hours').value ? parseInt(document.getElementById('f-hours').value) : null,
            serial_number: document.getElementById('f-serial').value || null,
            status: document.getElementById('f-status').value,
            updated_at: new Date().toISOString()
        };

        var savePromise;
        if (id) {
            savePromise = supabase.from('equipment').update(data).eq('id', id).select().single();
        } else {
            savePromise = supabase.from('equipment').insert(data).select().single();
        }

        savePromise.then(function (r) {
            if (r.error) {
                showToast('Error: ' + r.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Gear';
                return;
            }

            uploadPhotos(r.data.id).then(function () {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Gear';
                showToast(id ? 'Gear updated!' : 'Gear added!');
                showList();
            }).catch(function (err) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Gear';
                showToast('Saved but some photos failed', 'error');
                showList();
            });
        });
    });

    // ========================================
    // Delete
    // ========================================
    deleteBtn.addEventListener('click', function () {
        var id = document.getElementById('gear-id').value;
        if (!id || !confirm('Delete this listing and all its photos?')) return;

        deleteBtn.textContent = 'Deleting...';
        deleteBtn.disabled = true;

        supabase.from('equipment_images').select('storage_path').eq('equipment_id', id)
            .then(function (r) {
                var paths = (r.data || []).map(function (img) { return img.storage_path; });
                return supabase.from('equipment_images').delete().eq('equipment_id', id)
                    .then(function () {
                        if (paths.length > 0) return supabase.storage.from('equipment-photos').remove(paths);
                    })
                    .then(function () {
                        return supabase.from('equipment').delete().eq('id', id);
                    });
            })
            .then(function () {
                showToast('Deleted');
                showList();
            })
            .catch(function (err) {
                showToast('Error deleting: ' + err.message, 'error');
                deleteBtn.textContent = 'Delete This Listing';
                deleteBtn.disabled = false;
            });
    });

    // ========================================
    // Init
    // ========================================
    checkSession();
})();
