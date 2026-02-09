// Admin Dashboard - Auth, CRUD, Image Management
(function () {
    // Elements
    var loginScreen = document.getElementById('login-screen');
    var dashboard = document.getElementById('dashboard');
    var loginForm = document.getElementById('login-form');
    var loginError = document.getElementById('login-error');
    var logoutBtn = document.getElementById('logout-btn');
    var listView = document.getElementById('list-view');
    var formView = document.getElementById('form-view');
    var addNewBtn = document.getElementById('add-new-btn');
    var formBackBtn = document.getElementById('form-back-btn');
    var equipmentForm = document.getElementById('equipment-form');
    var tableBody = document.getElementById('equipment-table-body');
    var listLoading = document.getElementById('list-loading');
    var listEmpty = document.getElementById('list-empty');
    var deleteBtn = document.getElementById('delete-btn');
    var formTitle = document.getElementById('form-title');
    var saveBtn = document.getElementById('save-btn');
    var imageInput = document.getElementById('image-input');
    var imageUploadBtn = document.getElementById('image-upload-btn');
    var imagePreviewGrid = document.getElementById('image-preview-grid');
    var existingImagesGrid = document.getElementById('existing-images');
    var alertContainer = document.getElementById('admin-alert');

    var pendingFiles = []; // Files waiting to be uploaded

    // ========================================
    // Alerts
    // ========================================
    function showAlert(message, type) {
        var cls = type === 'error' ? 'admin-alert-error' : 'admin-alert-success';
        alertContainer.innerHTML = '<div class="admin-alert ' + cls + '">' + message + '</div>';
        setTimeout(function () { alertContainer.innerHTML = ''; }, 5000);
    }

    // ========================================
    // Auth
    // ========================================
    function checkSession() {
        supabase.auth.getSession().then(function (result) {
            if (result.data.session) {
                showDashboard();
            } else {
                showLogin();
            }
        });
    }

    function showLogin() {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadEquipment();
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginError.style.display = 'none';

        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;

        supabase.auth.signInWithPassword({ email: email, password: password })
            .then(function (result) {
                if (result.error) {
                    loginError.textContent = result.error.message;
                    loginError.style.display = 'block';
                    return;
                }
                showDashboard();
            });
    });

    logoutBtn.addEventListener('click', function () {
        supabase.auth.signOut().then(function () {
            showLogin();
        });
    });

    // ========================================
    // Equipment List
    // ========================================
    function loadEquipment() {
        listLoading.style.display = 'block';
        listEmpty.style.display = 'none';
        tableBody.innerHTML = '';

        supabase
            .from('equipment')
            .select('*, equipment_images(id)')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false })
            .then(function (response) {
                listLoading.style.display = 'none';

                if (response.error) {
                    showAlert('Error loading equipment: ' + response.error.message, 'error');
                    return;
                }

                var items = response.data || [];
                if (items.length === 0) {
                    listEmpty.style.display = 'block';
                    return;
                }

                items.forEach(function (item) {
                    var row = document.createElement('tr');
                    var statusClass = 'status-' + item.status;
                    var priceText = item.price_display || (item.price ? '$' + Number(item.price).toLocaleString() : '—');
                    var imageCount = item.equipment_images ? item.equipment_images.length : 0;

                    row.innerHTML =
                        '<td><strong>' + item.title + '</strong></td>' +
                        '<td><span class="inventory-badge ' + (item.condition === 'new' ? 'badge-new' : 'badge-used') + '">' +
                            (item.condition === 'new' ? 'New' : 'Used') + '</span></td>' +
                        '<td>' + priceText + '</td>' +
                        '<td><span class="admin-status ' + statusClass + '">' + item.status + '</span></td>' +
                        '<td>' + imageCount + '</td>' +
                        '<td class="admin-actions">' +
                            '<button class="btn-edit" data-id="' + item.id + '">Edit</button>' +
                        '</td>';
                    tableBody.appendChild(row);
                });

                // Bind edit buttons
                tableBody.querySelectorAll('.btn-edit').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        editEquipment(this.getAttribute('data-id'));
                    });
                });
            });
    }

    // ========================================
    // Show Form (Add/Edit)
    // ========================================
    addNewBtn.addEventListener('click', function () {
        resetForm();
        formTitle.textContent = 'Add Equipment';
        deleteBtn.style.display = 'none';
        listView.style.display = 'none';
        formView.style.display = 'block';
    });

    formBackBtn.addEventListener('click', function () {
        formView.style.display = 'none';
        listView.style.display = 'block';
    });

    function resetForm() {
        equipmentForm.reset();
        document.getElementById('equipment-id').value = '';
        pendingFiles = [];
        imagePreviewGrid.innerHTML = '';
        existingImagesGrid.innerHTML = '';
    }

    function editEquipment(id) {
        resetForm();
        formTitle.textContent = 'Edit Equipment';
        deleteBtn.style.display = 'inline-flex';
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        supabase
            .from('equipment')
            .select('*, equipment_images(*)')
            .eq('id', id)
            .single()
            .then(function (response) {
                saveBtn.textContent = 'Save Equipment';
                saveBtn.disabled = false;

                if (response.error) {
                    showAlert('Error loading equipment: ' + response.error.message, 'error');
                    return;
                }

                var item = response.data;
                document.getElementById('equipment-id').value = item.id;
                document.getElementById('eq-title').value = item.title || '';
                document.getElementById('eq-category').value = item.category || '';
                document.getElementById('eq-manufacturer').value = item.manufacturer || '';
                document.getElementById('eq-model').value = item.model || '';
                document.getElementById('eq-year').value = item.year || '';
                document.getElementById('eq-condition').value = item.condition || 'new';
                document.getElementById('eq-price').value = item.price || '';
                document.getElementById('eq-price-display').value = item.price_display || '';
                document.getElementById('eq-hours').value = item.hours || '';
                document.getElementById('eq-serial').value = item.serial_number || '';
                document.getElementById('eq-status').value = item.status || 'active';
                document.getElementById('eq-sort').value = item.sort_order || '';
                document.getElementById('eq-featured').checked = item.featured || false;
                document.getElementById('eq-description').value = item.description || '';

                // Render existing images
                renderExistingImages(item.equipment_images || []);

                listView.style.display = 'none';
                formView.style.display = 'block';
            });
    }

    // ========================================
    // Image Management
    // ========================================
    imageUploadBtn.addEventListener('click', function () {
        imageInput.click();
    });

    imageInput.addEventListener('change', function () {
        var files = Array.from(this.files);
        files.forEach(function (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert(file.name + ' is too large (max 5MB)', 'error');
                return;
            }
            if (!file.type.startsWith('image/')) {
                showAlert(file.name + ' is not an image', 'error');
                return;
            }
            pendingFiles.push(file);
            renderPendingPreview(file);
        });
        imageInput.value = '';
    });

    function renderPendingPreview(file) {
        var div = document.createElement('div');
        div.className = 'image-preview-item';

        var reader = new FileReader();
        reader.onload = function (e) {
            div.innerHTML =
                '<img src="' + e.target.result + '" alt="Preview">' +
                '<button type="button" class="image-remove-btn" title="Remove">&times;</button>';
            div.querySelector('.image-remove-btn').addEventListener('click', function () {
                var idx = pendingFiles.indexOf(file);
                if (idx > -1) pendingFiles.splice(idx, 1);
                div.remove();
            });
        };
        reader.readAsDataURL(file);
        imagePreviewGrid.appendChild(div);
    }

    function renderExistingImages(images) {
        existingImagesGrid.innerHTML = '';
        if (!images || images.length === 0) return;

        var sorted = images.slice().sort(function (a, b) {
            return (a.display_order || 0) - (b.display_order || 0);
        });

        sorted.forEach(function (img) {
            var url = getImageUrl(img.storage_path);
            var div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML =
                '<img src="' + url + '" alt="' + (img.alt_text || 'Equipment photo') + '">' +
                '<button type="button" class="image-remove-btn" title="Delete image" data-image-id="' + img.id + '" data-storage-path="' + img.storage_path + '">&times;</button>';

            div.querySelector('.image-remove-btn').addEventListener('click', function () {
                var imageId = this.getAttribute('data-image-id');
                var storagePath = this.getAttribute('data-storage-path');
                if (!confirm('Delete this image?')) return;
                deleteImage(imageId, storagePath, div);
            });

            existingImagesGrid.appendChild(div);
        });
    }

    function deleteImage(imageId, storagePath, element) {
        // Delete from database
        supabase.from('equipment_images').delete().eq('id', imageId)
            .then(function (response) {
                if (response.error) {
                    showAlert('Error deleting image record: ' + response.error.message, 'error');
                    return;
                }
                // Delete from storage
                supabase.storage.from('equipment-photos').remove([storagePath])
                    .then(function () {
                        element.remove();
                        showAlert('Image deleted', 'success');
                    });
            });
    }

    // Upload images for an equipment item
    function uploadImages(equipmentId) {
        if (pendingFiles.length === 0) return Promise.resolve();

        var currentMaxOrder = existingImagesGrid.children.length;
        var promises = pendingFiles.map(function (file, index) {
            var ext = file.name.split('.').pop();
            var path = equipmentId + '/' + Date.now() + '-' + index + '.' + ext;

            return supabase.storage.from('equipment-photos').upload(path, file, {
                contentType: file.type
            }).then(function (uploadResult) {
                if (uploadResult.error) {
                    throw new Error('Upload failed: ' + uploadResult.error.message);
                }
                // Insert image record
                return supabase.from('equipment_images').insert({
                    equipment_id: equipmentId,
                    storage_path: path,
                    display_order: currentMaxOrder + index,
                    alt_text: ''
                });
            });
        });

        return Promise.all(promises);
    }

    // ========================================
    // Save Equipment
    // ========================================
    equipmentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        var id = document.getElementById('equipment-id').value;
        var data = {
            title: document.getElementById('eq-title').value,
            category: document.getElementById('eq-category').value || null,
            manufacturer: document.getElementById('eq-manufacturer').value || null,
            model: document.getElementById('eq-model').value || null,
            year: document.getElementById('eq-year').value ? parseInt(document.getElementById('eq-year').value) : null,
            condition: document.getElementById('eq-condition').value,
            price: document.getElementById('eq-price').value ? parseFloat(document.getElementById('eq-price').value) : null,
            price_display: document.getElementById('eq-price-display').value || null,
            hours: document.getElementById('eq-hours').value ? parseInt(document.getElementById('eq-hours').value) : null,
            serial_number: document.getElementById('eq-serial').value || null,
            status: document.getElementById('eq-status').value,
            sort_order: document.getElementById('eq-sort').value ? parseInt(document.getElementById('eq-sort').value) : null,
            featured: document.getElementById('eq-featured').checked,
            description: document.getElementById('eq-description').value || null,
            updated_at: new Date().toISOString()
        };

        var savePromise;
        if (id) {
            // Update
            savePromise = supabase.from('equipment').update(data).eq('id', id).select().single();
        } else {
            // Insert
            savePromise = supabase.from('equipment').insert(data).select().single();
        }

        savePromise.then(function (response) {
            if (response.error) {
                showAlert('Error saving: ' + response.error.message, 'error');
                saveBtn.textContent = 'Save Equipment';
                saveBtn.disabled = false;
                return;
            }

            var savedId = response.data.id;

            // Upload any pending images
            uploadImages(savedId).then(function () {
                showAlert('Equipment saved successfully!', 'success');
                saveBtn.textContent = 'Save Equipment';
                saveBtn.disabled = false;
                pendingFiles = [];
                imagePreviewGrid.innerHTML = '';

                formView.style.display = 'none';
                listView.style.display = 'block';
                loadEquipment();
            }).catch(function (err) {
                showAlert('Equipment saved but some images failed: ' + err.message, 'error');
                saveBtn.textContent = 'Save Equipment';
                saveBtn.disabled = false;
            });
        });
    });

    // ========================================
    // Delete Equipment
    // ========================================
    deleteBtn.addEventListener('click', function () {
        var id = document.getElementById('equipment-id').value;
        if (!id) return;

        if (!confirm('Are you sure you want to delete this equipment? This will also delete all associated images.')) return;

        deleteBtn.textContent = 'Deleting...';
        deleteBtn.disabled = true;

        // First get all images to delete from storage
        supabase.from('equipment_images').select('storage_path').eq('equipment_id', id)
            .then(function (imgResponse) {
                var paths = (imgResponse.data || []).map(function (img) { return img.storage_path; });

                // Delete image records
                return supabase.from('equipment_images').delete().eq('equipment_id', id)
                    .then(function () {
                        // Delete from storage
                        if (paths.length > 0) {
                            return supabase.storage.from('equipment-photos').remove(paths);
                        }
                    })
                    .then(function () {
                        // Delete equipment
                        return supabase.from('equipment').delete().eq('id', id);
                    });
            })
            .then(function (response) {
                if (response && response.error) {
                    showAlert('Error deleting: ' + response.error.message, 'error');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.disabled = false;
                    return;
                }

                showAlert('Equipment deleted', 'success');
                formView.style.display = 'none';
                listView.style.display = 'block';
                loadEquipment();
            })
            .catch(function (err) {
                showAlert('Error deleting: ' + err.message, 'error');
                deleteBtn.textContent = 'Delete';
                deleteBtn.disabled = false;
            });
    });

    // ========================================
    // Init
    // ========================================
    checkSession();

    // Listen for auth changes
    supabase.auth.onAuthStateChange(function (event) {
        if (event === 'SIGNED_OUT') {
            showLogin();
        }
    });
})();
