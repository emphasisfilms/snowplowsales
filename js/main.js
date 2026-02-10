document.addEventListener('DOMContentLoaded', function () {

    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (this.classList.contains('nav-dropdown-toggle')) return;
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // Navbar Scroll Detection
    var header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 80) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="/#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            // Only handle if we're on the homepage
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                var targetId = this.getAttribute('href').replace('/', '');
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Also handle plain # anchors on the same page
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Contact Form Handler - dual submission to Supabase + Formspree
    var contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = this.querySelector('.btn');
            var originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            var formData = new FormData(contactForm);
            var name = formData.get('name') || '';
            var email = formData.get('email') || '';
            var phone = formData.get('phone') || '';
            var message = formData.get('message') || '';

            // Submit to Formspree (email notifications)
            var formspreePromise = fetch('https://formspree.io/f/xjgekayw', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            }).catch(function () { /* Formspree failure is non-blocking */ });

            // Submit to Supabase messages table (CRM inbox)
            var supabasePromise = Promise.resolve();
            if (typeof supabase !== 'undefined') {
                supabasePromise = supabase.from('messages').insert({
                    name: name,
                    email: email,
                    phone: phone,
                    message: message
                }).then(function () {}).catch(function () {});
            }

            Promise.all([formspreePromise, supabasePromise]).then(function () {
                btn.textContent = 'Message Sent!';
                contactForm.reset();
                setTimeout(function () {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 3000);
            });
        });
    }

});
