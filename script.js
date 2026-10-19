(function () {
      'use strict';

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const $ = (selector, scope = document) => scope.querySelector(selector);
      const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

      /* Current year */
      const yearEl = $('#year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      /* Scroll-driven UI: header, progress, parallax, active nav, back to top */
      const header = $('#siteHeader');
      const navShell = $('#navShell');
      const progress = $('#scrollProgress');
      const backToTop = $('#backToTop');
      const heroImage = $('#heroImage');
      const navLinks = $$('[data-section]');
      const sections = $$('main section[id]');
      let ticking = false;

      function updateScrollUI() {
        const y = window.scrollY;

        if (navShell) navShell.classList.toggle('is-scrolled', y > 12);

        if (progress) {
          const max = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
        }

        if (backToTop) backToTop.classList.toggle('is-visible', y > 600);

        if (heroImage) {
          if (!reduceMotion && window.innerWidth >= 768) {
            const shift = Math.min(y * 0.12, 28);
            heroImage.style.transform = `translate3d(0, ${shift}px, 0) scale(1.08)`;
          } else {
            heroImage.style.transform = '';
          }
        }

        const probe = y + window.innerHeight * 0.32;
        let current = sections.length ? sections[0].id : 'home';
        sections.forEach((section) => {
          if (section.offsetTop <= probe) current = section.id;
        });

        navLinks.forEach((link) => {
          const isActive = link.dataset.section === current;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });

        ticking = false;
      }

      function requestScrollUI() {
        if (!ticking) {
          window.requestAnimationFrame(updateScrollUI);
          ticking = true;
        }
      }

      window.addEventListener('scroll', requestScrollUI, { passive: true });
      window.addEventListener('resize', requestScrollUI);
      window.addEventListener('load', updateScrollUI);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateScrollUI);
      updateScrollUI();

      /* Mobile navigation */
      const mobileMenuBtn = $('#mobileMenuBtn');
      const mobileMenu = $('#mobileMenu');
      const menuIcon = $('#menuIcon');
      const closeIcon = $('#closeIcon');

      function setMenu(open) {
        if (!mobileMenu || !mobileMenuBtn || !menuIcon || !closeIcon) return;
        mobileMenu.classList.toggle('is-open', open);
        mobileMenuBtn.setAttribute('aria-expanded', String(open));
        mobileMenuBtn.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
        menuIcon.classList.toggle('hidden', open);
        closeIcon.classList.toggle('hidden', !open);
      }

      if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
          setMenu(!mobileMenu.classList.contains('is-open'));
        });
      }

      $$('.mobile-nav-link').forEach((link) => {
        link.addEventListener('click', () => setMenu(false));
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
          setMenu(false);
          if (mobileMenuBtn) mobileMenuBtn.focus();
        }
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && mobileMenu && mobileMenu.classList.contains('is-open')) setMenu(false);
      });

      document.addEventListener('click', (event) => {
        if (mobileMenu && mobileMenu.classList.contains('is-open') && header && !header.contains(event.target)) setMenu(false);
      });

      /* Reveal on scroll */
      const revealElements = $$('[data-reveal]');
      if (!('IntersectionObserver' in window) || reduceMotion) {
        revealElements.forEach((el) => el.classList.add('is-revealed'));
      } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealElements.forEach((el) => revealObserver.observe(el));
      }

      /* Animated counters */
      const counters = $$('[data-counter]');
      if (counters.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
          counters.forEach((el) => {
            el.textContent = `${el.dataset.counter}${el.dataset.suffix || ''}`;
          });
        } else {
          counters.forEach((el) => {
            el.textContent = `0${el.dataset.suffix || ''}`;
          });
          const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target;
              const target = Number(el.dataset.counter);
              const suffix = el.dataset.suffix || '';
              const duration = 1300;
              const start = performance.now();

              function step(now) {
                const progressValue = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progressValue, 3);
                el.textContent = `${Math.round(target * eased)}${suffix}`;
                if (progressValue < 1) window.requestAnimationFrame(step);
              }

              window.requestAnimationFrame(step);
              observer.unobserve(el);
            });
          }, { threshold: 0.5 });
          counters.forEach((el) => counterObserver.observe(el));
        }
      }

      /* Project filters */
      const filterButtons = $$('.filter-btn');
      const projectCards = $$('.project-card');
      const filterStatus = $('#filterStatus');

      function applyFilter(filter) {
        if (!projectCards.length) return;
        let visibleCount = 0;

        projectCards.forEach((card) => {
          const show = filter === 'all' || card.dataset.category === filter;

          if (!show) {
            card.style.display = 'none';
            card.style.transform = '';
            card.classList.remove('is-tilting');
            return;
          }

          visibleCount += 1;
          card.style.display = '';
          card.classList.add('is-revealed');

          if (!reduceMotion) {
            card.animate(
              [
                { opacity: 0, transform: 'translateY(10px) scale(.97)' },
                { opacity: 1, transform: 'translateY(0) scale(1)' }
              ],
              { duration: 420, easing: 'cubic-bezier(.16, 1, .3, 1)' }
            );
          }
        });

        if (filterStatus) filterStatus.textContent = `Menampilkan ${visibleCount} project`;

        filterButtons.forEach((button) => {
          const isActive = button.dataset.filter === filter;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        requestScrollUI();
      }

      filterButtons.forEach((button) => {
        button.addEventListener('click', () => applyFilter(button.dataset.filter));
      });

      /* Project detail dialog */
      const dialog = $('#projectDialog');
      const projectData = {
        project1: {
          title: 'Judul Project 1',
          category: 'UI/UX',
          year: '2026',
          description: 'Deskripsi detail project 1. Jelaskan latar belakang masalah, proses desain, peran kamu dalam tim, dan hasil akhir yang dicapai.',
          role: 'UI/UX Designer',
          platform: 'Web & Mobile',
          tech: ['Tech 1', 'Tech 2', 'Tech 3']
        },
        project2: {
          title: 'Judul Project 2',
          category: 'Web Platform',
          year: '2026',
          description: 'Deskripsi detail project 2. Jelaskan latar belakang masalah, proses desain, peran kamu dalam tim, dan hasil akhir yang dicapai.',
          role: 'Web Developer & UI Designer',
          platform: 'Website',
          tech: ['Tech 1', 'Tech 2', 'Tech 3']
        },
        project3: {
          title: 'Judul Project 3',
          category: 'Game',
          year: '2026',
          description: 'Deskripsi detail project 3. Jelaskan latar belakang masalah, proses desain, peran kamu dalam tim, dan hasil akhir yang dicapai.',
          role: 'UI/UX Designer',
          platform: 'Web & Mobile',
          tech: ['Tech 1', 'Tech 2', 'Tech 3']
        }
      };

      function openProject(id) {
        const data = projectData[id];
        if (!data || !dialog) return;

        $('#dialogCategory').textContent = data.category;
        $('#dialogYear').textContent = data.year;
        $('#dialogTitle').textContent = data.title;
        $('#dialogDesc').textContent = data.description;
        $('#dialogRole').textContent = data.role;
        $('#dialogPlatform').textContent = data.platform;

        const techBox = $('#dialogTech');
        techBox.innerHTML = '';
        data.tech.forEach((tech) => {
          const tag = document.createElement('span');
          tag.className = 'rounded-md border border-white/5 bg-zinc-800 px-2.5 py-1 font-mono text-[11px] text-zinc-300';
          tag.textContent = tech;
          techBox.appendChild(tag);
        });

        if (typeof dialog.showModal === 'function') {
          if (!dialog.open) dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
        document.body.classList.add('modal-open');
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(() => {
            const closeButton = dialog.querySelector('[data-close-dialog]');
            if (closeButton) closeButton.focus();
          });
        }
      }

      $$('.project-detail').forEach((button) => {
        button.addEventListener('click', () => openProject(button.dataset.project));
      });

      if (dialog) {
        $$('[data-close-dialog]', dialog).forEach((button) => {
          button.addEventListener('click', () => dialog.close());
        });

        dialog.addEventListener('click', (event) => {
          if (event.target === dialog) dialog.close();
        });

        dialog.addEventListener('close', () => {
          document.body.classList.remove('modal-open');
        });

        $$('[data-modal-contact]', dialog).forEach((link) => {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            dialog.close();
            const contact = $('#contact');
            if (contact) {
              window.setTimeout(() => {
                contact.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
              }, 60);
            }
          });
        });
      }

      /* Subtle 3D tilt and spotlight on project cards */
      if (finePointer && !reduceMotion) {
        projectCards.forEach((card) => {
          card.addEventListener('pointerenter', () => card.classList.add('is-tilting'));

          card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            card.style.setProperty('--mx', `${px * 100}%`);
            card.style.setProperty('--my', `${py * 100}%`);

            const rotateX = (0.5 - py) * 5;
            const rotateY = (px - 0.5) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
          });

          card.addEventListener('pointerleave', () => {
            card.classList.remove('is-tilting');
            card.style.transform = '';
            card.style.setProperty('--mx', '50%');
            card.style.setProperty('--my', '50%');
          });
        });
      }

      /* Magnetic buttons */
      if (finePointer && !reduceMotion) {
        $$('[data-magnetic]').forEach((element) => {
          element.addEventListener('pointermove', (event) => {
            const rect = element.getBoundingClientRect();
            const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
            const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
            element.style.transform = `translate(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px)`;
          });

          element.addEventListener('pointerleave', () => {
            element.style.transform = '';
          });
        });
      }

      /* Copy email with toast feedback */
      const copyButton = $('#copyEmail');
      const toast = $('#toast');
      const toastMessage = $('#toastMessage');
      let toastTimer = null;
      const emailAddress = 'fidifikri4@gmail.com';

      function showToast(message) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
      }

      function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        let copied = false;
        try {
          copied = document.execCommand('copy');
        } catch (error) {
          copied = false;
        }
        textarea.remove();
        return copied;
      }

      async function copyEmailAddress() {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(emailAddress);
            showToast('Alamat email disalin ke clipboard');
            return;
          }
          throw new Error('Clipboard API tidak tersedia');
        } catch (error) {
          if (fallbackCopy(emailAddress)) showToast('Alamat email disalin ke clipboard');
          else showToast(`Salin manual: ${emailAddress}`);
        }
      }

      if (copyButton) copyButton.addEventListener('click', copyEmailAddress);

      /* Back to top */
      if (backToTop) {
        backToTop.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
      }
    })();
