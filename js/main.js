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

    // Parallax - image scrolls at half speed
    var parallaxSection = document.querySelector('.fisher-lineup');
    var parallaxImg = parallaxSection ? parallaxSection.querySelector('img') : null;
    if (parallaxSection && parallaxImg) {
        window.addEventListener('scroll', function () {
            var rect = parallaxSection.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
                var center = rect.top + rect.height / 2 - window.innerHeight / 2;
                var offset = center * -0.15;
                parallaxImg.style.transform = 'translate(-50%, calc(-50% + ' + offset + 'px))';
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

    // Contact Form Handler - submits to /api/messages (Supabase inbox + owner email)
    var contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = this.querySelector('.btn');
            var originalText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            var formData = new FormData(contactForm);

            fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name') || '',
                    email: formData.get('email') || '',
                    phone: formData.get('phone') || '',
                    message: formData.get('message') || ''
                })
            }).then(function (res) {
                if (!res.ok) throw new Error('submit failed');
                btn.textContent = 'Message Sent!';
                contactForm.reset();
                setTimeout(function () {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 3000);
            }).catch(function () {
                btn.textContent = 'Something went wrong — please call us';
                setTimeout(function () {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 4000);
            });
        });
    }

});
