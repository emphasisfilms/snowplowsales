// Admin Dashboard - Full CRM with equipment, messages, alert, hours
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
    var dashNav = document.getElementById('dash-nav');

    var pendingFiles = [];
    var existingImages = [];
    var currentFilter = 'active';
    var currentSection = 'dashboard';

    // ========================================
    // Toast
    // ========================================
    function showToast(msg, type) {
        toast.textContent = msg;
        toast.className = 'toast toast-' + (type || 'success') + ' show';
        setTimeout(function () { toast.className = 'toast'; }, 3000);
    }

    // ========================================
    // Section Navigation
    // ========================================
    function navigateTo(section) {
        currentSection = section;

        // Update nav buttons
        document.querySelectorAll('.dash-nav-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-section') === section);
        });

        // Show/hide sections
        document.querySelectorAll('.dash-section').forEach(function (sec) {
            sec.classList.remove('active');
        });
        var target = document.getElementById('section-' + section);
        if (target) target.classList.add('active');

        // Reset equipment view when switching to equipment
        if (section === 'equipment') {
            listSection.style.display = 'block';
            formSection.style.display = 'none';
            backBtn.style.display = 'none';
            appTitle.textContent = 'Dashboard';
            loadGear();
        } else {
            backBtn.style.display = 'none';
            appTitle.textContent = 'Dashboard';
        }

        // Show dashboard nav
        dashNav.style.display = 'flex';

        // Load section data
        if (section === 'dashboard') loadStats();
        if (section === 'messages') loadMessages();
        if (section === 'alert') loadAlert();
        if (section === 'hours') loadHours();
    }

    // Dashboard nav click handlers
    document.querySelectorAll('.dash-nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            navigateTo(this.getAttribute('data-section'));
        });
    });

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
        if (window.location.search.indexOf('new') !== -1) {
            navigateTo('equipment');
            resetForm();
            appTitle.textContent = 'Add Equipment';
            deleteBtn.style.display = 'none';
            showForm();
        } else {
            navigateTo('dashboard');
        }
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
    // Dashboard Stats
    // ========================================
    function loadStats() {
        // Equipment stats
        supabase.from('equipment').select('id, status, condition').then(function (r) {
            var items = r.data || [];
            var active = items.filter(function (i) { return i.status === 'active'; });
            var newItems = active.filter(function (i) { return i.condition === 'new'; });
            var usedItems = active.filter(function (i) { return i.condition === 'used'; });

            document.getElementById('stat-active').textContent = active.length;
            document.getElementById('stat-new').textContent = newItems.length;
            document.getElementById('stat-used').textContent = usedItems.length;
        });

        // Messages stats
        supabase.from('messages').select('id, is_read').then(function (r) {
            var msgs = r.data || [];
            var unread = msgs.filter(function (m) { return !m.is_read; });
            document.getElementById('stat-messages').textContent = msgs.length;
            document.getElementById('stat-unread').textContent = unread.length;
            updateUnreadBadge(unread.length);
        });
    }

    function updateUnreadBadge(count) {
        var msgBtn = document.querySelector('.dash-nav-btn[data-section="messages"]');
        var badge = msgBtn.querySelector('.badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge';
                msgBtn.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    // ========================================
    // Equipment List View
    // ========================================
    function showList() {
        listSection.style.display = 'block';
        formSection.style.display = 'none';
        backBtn.style.display = 'none';
        appTitle.textContent = 'Dashboard';
        dashNav.style.display = 'flex';
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
        } else if (currentFilter === 'new') {
            query = query.eq('status', 'active').eq('condition', 'new');
        } else if (currentFilter === 'used') {
            query = query.eq('status', 'active').eq('condition', 'used');
        }

        query.then(function (r) {
            if (r.error) {
                gearList.innerHTML = '<div class="list-empty">Error loading equipment</div>';
                return;
            }

            var items = r.data || [];
            if (items.length === 0) {
                gearList.innerHTML = '<div class="list-empty">No equipment yet. Tap + Add New Equipment below.</div>';
                return;
            }

            gearList.innerHTML = '';
            items.forEach(function (item) {
                var card = document.createElement('div');
                card.className = 'gear-card';

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
    // Equipment Form View
    // ========================================
    newGearBtn.addEventListener('click', function () {
        resetForm();
        appTitle.textContent = 'Add Equipment';
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
        dashNav.style.display = 'none';
        window.scrollTo(0, 0);
    }

    function resetForm() {
        gearForm.reset();
        document.getElementById('gear-id').value = '';
        pendingFiles = [];
        existingImages = [];
        renderPhotos();

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
    // Equipment Edit
    // ========================================
    function editGear(id) {
        resetForm();
        appTitle.textContent = 'Edit Equipment';
        deleteBtn.style.display = 'block';
        showForm();

        saveBtn.disabled = true;
        saveBtn.textContent = 'Loading...';

        supabase.from('equipment').select('*, equipment_images(*)').eq('id', id).single()
            .then(function (r) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Equipment';

                if (r.error) { showToast('Error loading', 'error'); return; }

                var item = r.data;
                document.getElementById('gear-id').value = item.id;
                document.getElementById('f-title').value = item.title || '';
                document.getElementById('f-category').value = item.category || '';
                document.getElementById('f-manufacturer').value = item.manufacturer || '';
                document.getElementById('f-model').value = item.model || '';
                document.getElementById('f-price').value = item.price || '';
                document.getElementById('f-price-display').value = item.price_display || '';
                document.getElementById('f-description').value = item.description || '';
                document.getElementById('f-year').value = item.year || '';
                document.getElementById('f-hours').value = item.hours || '';
                document.getElementById('f-serial').value = item.serial_number || '';
                document.getElementById('f-status').value = item.status || 'active';

                var cond = item.condition || 'new';
                document.querySelectorAll('.condition-opt').forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute('data-val') === cond);
                });

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
        var files = Array.from(this.files);
        photoInput.value = '';
        var processed = 0;
        files.forEach(function (file) {
            if (file.size > 4.5 * 1024 * 1024) {
                resizeImage(file, 2000, 0.85).then(function (resized) {
                    pendingFiles.push(resized);
                    processed++;
                    if (processed === files.length) renderPhotos();
                });
            } else {
                pendingFiles.push(file);
                processed++;
                if (processed === files.length) renderPhotos();
            }
        });
    });

    function resizeImage(file, maxDim, quality) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    var w = img.width;
                    var h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                        else { w = Math.round(w * maxDim / h); h = maxDim; }
                    }
                    var canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    canvas.toBlob(function (blob) {
                        var resized = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
                        resolve(resized);
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function renderPhotos() {
        var items = photoGrid.querySelectorAll('.photo-thumb');
        items.forEach(function (el) { el.remove(); });

        existingImages.forEach(function (img, idx) {
            var div = document.createElement('div');
            div.className = 'photo-thumb';
            var url = getImageUrl(img.storage_path);
            div.innerHTML =
                '<img src="' + url + '" alt="">' +
                '<button type="button" class="photo-remove" data-idx="' + idx + '" data-type="existing">&times;</button>';
            photoGrid.insertBefore(div, addPhotoBtn);
        });

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
    // Equipment Save
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
            category: document.getElementById('f-category').value || null,
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
                saveBtn.textContent = 'Save Equipment';
                return;
            }

            uploadPhotos(r.data.id).then(function () {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Equipment';
                showToast(id ? 'Equipment updated!' : 'Equipment added!');
                showList();
            }).catch(function () {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Equipment';
                showToast('Saved but some photos failed', 'error');
                showList();
            });
        });
    });

    // ========================================
    // Equipment Delete
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
    // Alert Settings
    // ========================================
    var alertActiveEl = document.getElementById('alert-active');
    var alertMessageEl = document.getElementById('alert-message');
    var alertPreviewEl = document.getElementById('alert-preview');
    var saveAlertBtn = document.getElementById('save-alert-btn');
    var currentAlertType = 'info';

    // Type selector
    document.querySelectorAll('.type-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.type-opt').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentAlertType = this.getAttribute('data-type');
            updateAlertPreview();
        });
    });

    // Live preview
    alertActiveEl.addEventListener('change', updateAlertPreview);
    alertMessageEl.addEventListener('input', updateAlertPreview);

    function updateAlertPreview() {
        var msg = alertMessageEl.value.trim();
        if (alertActiveEl.checked && msg) {
            alertPreviewEl.textContent = msg;
            alertPreviewEl.className = 'alert-preview preview-' + currentAlertType;
            alertPreviewEl.style.display = 'block';
        } else {
            alertPreviewEl.style.display = 'none';
        }
    }

    function loadAlert() {
        supabase.from('site_settings').select('value').eq('key', 'site_alert').single()
            .then(function (r) {
                if (r.error || !r.data) return;
                var val = r.data.value;
                alertActiveEl.checked = val.active || false;
                alertMessageEl.value = val.message || '';
                currentAlertType = val.type || 'info';

                document.querySelectorAll('.type-opt').forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute('data-type') === currentAlertType);
                });
                updateAlertPreview();
            });
    }

    saveAlertBtn.addEventListener('click', function () {
        saveAlertBtn.disabled = true;
        saveAlertBtn.textContent = 'Saving...';

        var data = {
            active: alertActiveEl.checked,
            message: alertMessageEl.value.trim(),
            type: currentAlertType
        };

        supabase.from('site_settings')
            .upsert({ key: 'site_alert', value: data, updated_at: new Date().toISOString() })
            .then(function (r) {
                saveAlertBtn.disabled = false;
                saveAlertBtn.textContent = 'Save Alert';
                if (r.error) {
                    showToast('Error saving alert', 'error');
                } else {
                    showToast('Alert saved!');
                }
            });
    });

    // ========================================
    // Hours Settings
    // ========================================
    var hoursEditorEl = document.getElementById('hours-editor');
    var hoursNoteEl = document.getElementById('hours-note');
    var saveHoursBtn = document.getElementById('save-hours-btn');
    var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    function buildHoursEditor(hoursData) {
        hoursEditorEl.innerHTML = '';
        days.forEach(function (day) {
            var d = (hoursData && hoursData[day]) || { open: '', close: '', closed: false };
            var row = document.createElement('div');
            row.className = 'hours-row';
            row.innerHTML =
                '<span class="day-label">' + day.charAt(0).toUpperCase() + day.slice(1, 3) + '</span>' +
                '<input type="text" data-day="' + day + '" data-field="open" placeholder="8:00 AM" value="' + (d.open || '') + '"' + (d.closed ? ' disabled' : '') + '>' +
                '<input type="text" data-day="' + day + '" data-field="close" placeholder="5:00 PM" value="' + (d.close || '') + '"' + (d.closed ? ' disabled' : '') + '>' +
                '<label class="closed-check"><input type="checkbox" data-day="' + day + '" data-field="closed"' + (d.closed ? ' checked' : '') + '> Closed</label>';
            hoursEditorEl.appendChild(row);
        });

        // Handle closed checkbox toggle
        hoursEditorEl.querySelectorAll('input[data-field="closed"]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var day = this.getAttribute('data-day');
                var row = this.closest('.hours-row');
                var inputs = row.querySelectorAll('input[type="text"]');
                inputs.forEach(function (inp) { inp.disabled = cb.checked; });
            });
        });
    }

    function loadHours() {
        supabase.from('site_settings').select('value').eq('key', 'business_hours').single()
            .then(function (r) {
                if (r.error || !r.data) {
                    buildHoursEditor(null);
                    return;
                }
                var val = r.data.value;
                buildHoursEditor(val);
                hoursNoteEl.value = val.special_note || '';
            });
    }

    saveHoursBtn.addEventListener('click', function () {
        saveHoursBtn.disabled = true;
        saveHoursBtn.textContent = 'Saving...';

        var hoursData = { special_note: hoursNoteEl.value.trim() };
        days.forEach(function (day) {
            var openEl = hoursEditorEl.querySelector('input[data-day="' + day + '"][data-field="open"]');
            var closeEl = hoursEditorEl.querySelector('input[data-day="' + day + '"][data-field="close"]');
            var closedEl = hoursEditorEl.querySelector('input[data-day="' + day + '"][data-field="closed"]');
            hoursData[day] = {
                open: openEl.value.trim(),
                close: closeEl.value.trim(),
                closed: closedEl.checked
            };
        });

        supabase.from('site_settings')
            .upsert({ key: 'business_hours', value: hoursData, updated_at: new Date().toISOString() })
            .then(function (r) {
                saveHoursBtn.disabled = false;
                saveHoursBtn.textContent = 'Save Hours';
                if (r.error) {
                    showToast('Error saving hours', 'error');
                } else {
                    showToast('Hours saved!');
                }
            });
    });

    // ========================================
    // Messages Inbox
    // ========================================
    var messagesList = document.getElementById('messages-list');

    function loadMessages() {
        messagesList.innerHTML = '<div style="text-align:center;padding:40px;color:#8a8478;">Loading messages...</div>';

        supabase.from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .then(function (r) {
                if (r.error) {
                    messagesList.innerHTML = '<div class="list-empty">Error loading messages</div>';
                    return;
                }

                var msgs = r.data || [];
                if (msgs.length === 0) {
                    messagesList.innerHTML = '<div class="list-empty">No messages yet. Messages from the contact form will appear here.</div>';
                    return;
                }

                // Update unread badge
                var unread = msgs.filter(function (m) { return !m.is_read; });
                updateUnreadBadge(unread.length);

                messagesList.innerHTML = '';
                msgs.forEach(function (msg) {
                    var card = document.createElement('div');
                    card.className = 'msg-card' + (msg.is_read ? '' : ' unread');
                    card.setAttribute('data-id', msg.id);

                    var date = new Date(msg.created_at);
                    var dateStr = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

                    var preview = (msg.message || '').substring(0, 60);
                    if ((msg.message || '').length > 60) preview += '...';

                    card.innerHTML =
                        '<div class="msg-header">' +
                            '<div>' +
                                '<div class="msg-from">' + escapeHtml(msg.name || 'Unknown') + '</div>' +
                                '<div class="msg-preview">' + escapeHtml(preview) + '</div>' +
                            '</div>' +
                            '<span class="msg-date">' + dateStr + '</span>' +
                        '</div>' +
                        '<div class="msg-body">' +
                            '<div class="msg-contact">' +
                                (msg.email ? '<a href="mailto:' + escapeHtml(msg.email) + '">' + escapeHtml(msg.email) + '</a>' : '') +
                                (msg.phone ? ' &bull; ' + escapeHtml(msg.phone) : '') +
                            '</div>' +
                            '<p>' + escapeHtml(msg.message || 'No message') + '</p>' +
                            '<div class="msg-actions">' +
                                '<button data-action="toggle-read" data-id="' + msg.id + '">' +
                                    (msg.is_read ? 'Mark Unread' : 'Mark Read') +
                                '</button>' +
                                (msg.email ? '<a href="mailto:' + escapeHtml(msg.email) + '?subject=Re: Your message to Snow Plow Sales">Reply</a>' : '') +
                                '<button data-action="delete-msg" data-id="' + msg.id + '" style="border-color:var(--red);color:var(--red);">Delete</button>' +
                            '</div>' +
                        '</div>';

                    // Toggle expand
                    card.querySelector('.msg-header').addEventListener('click', function () {
                        var body = card.querySelector('.msg-body');
                        body.classList.toggle('open');

                        // Auto mark as read when opened
                        if (body.classList.contains('open') && !msg.is_read) {
                            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(function () {
                                msg.is_read = true;
                                card.classList.remove('unread');
                                card.querySelector('[data-action="toggle-read"]').textContent = 'Mark Unread';
                                // Update badge
                                var remaining = document.querySelectorAll('.msg-card.unread').length;
                                updateUnreadBadge(remaining);
                            });
                        }
                    });

                    messagesList.appendChild(card);
                });

                // Bind action buttons
                messagesList.querySelectorAll('[data-action="toggle-read"]').forEach(function (btn) {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        var id = this.getAttribute('data-id');
                        var card = this.closest('.msg-card');
                        var isUnread = card.classList.contains('unread');

                        supabase.from('messages').update({ is_read: isUnread }).eq('id', id).then(function (r) {
                            if (!r.error) {
                                loadMessages();
                            }
                        });
                    });
                });

                messagesList.querySelectorAll('[data-action="delete-msg"]').forEach(function (btn) {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        if (!confirm('Delete this message?')) return;
                        var id = this.getAttribute('data-id');
                        supabase.from('messages').delete().eq('id', id).then(function (r) {
                            if (!r.error) {
                                showToast('Message deleted');
                                loadMessages();
                            }
                        });
                    });
                });
            });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========================================
    // Init
    // ========================================
    checkSession();
})();
