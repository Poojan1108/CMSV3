/**
 * CampusCare CMS v2 - 100% Full-Viewport Native Presentation Engine
 * Controls Momentum Slide Progression, Progress Bar, Presentation Timer & Interactive Demos
 */

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.pres-slide');
  const totalSlides = slides.length;
  let currentSlide = 0;

  const progressLine = document.getElementById('pres-progress-line');
  const counterDisplay = document.getElementById('pres-counter-display');
  const dotsContainer = document.getElementById('pres-dots-container');
  const prevBtn = document.getElementById('pres-prev-btn');
  const nextBtn = document.getElementById('pres-next-btn');
  const fullscreenBtn = document.getElementById('pres-fullscreen-btn');
  const overviewBtn = document.getElementById('pres-overview-btn');
  const overviewModal = document.getElementById('pres-overview-modal');
  const overviewGrid = document.getElementById('pres-overview-grid');

  // 1. Build Dot Indicators
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `pres-dot ${idx === 0 ? 'active' : ''}`;
      dot.title = `Jump to Slide ${idx + 1}`;
      dot.addEventListener('click', () => goToSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  // 2. Build Overview Grid Modal
  if (overviewGrid) {
    overviewGrid.innerHTML = '';
    slides.forEach((slide, idx) => {
      const titleEl = slide.querySelector('.rx-slide-title') || slide.querySelector('h1');
      const title = titleEl ? titleEl.textContent.trim().replace(/\s+/g, ' ') : `Slide ${idx + 1}`;
      const badgeEl = slide.querySelector('.rx-section-badge');
      const badge = badgeEl ? badgeEl.textContent.trim() : `MODULE ${idx + 1}`;

      const card = document.createElement('div');
      card.className = 'overview-card';
      card.innerHTML = `
        <span class="overview-card-num">${badge}</span>
        <span class="overview-card-title">${title}</span>
      `;
      card.addEventListener('click', () => {
        goToSlide(idx);
        toggleOverview(false);
      });
      overviewGrid.appendChild(card);
    });
  }

  // 3. Slide Navigation Core
  function updateSlideView() {
    slides.forEach((slide, idx) => {
      if (idx === currentSlide) {
        slide.classList.add('active');
        slide.scrollTop = 0;
      } else {
        slide.classList.remove('active');
      }
    });

    // Update Dots
    const dots = document.querySelectorAll('.pres-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });

    // Update Progress Bar
    if (progressLine) {
      const progressPercent = ((currentSlide + 1) / totalSlides) * 100;
      progressLine.style.width = `${progressPercent}%`;
    }

    // Update Counter
    if (counterDisplay) {
      const curFormatted = String(currentSlide + 1).padStart(2, '0');
      const totFormatted = String(totalSlides).padStart(2, '0');
      counterDisplay.textContent = `Slide ${curFormatted} / ${totFormatted}`;
    }

    // Update URL hash
    window.location.hash = `#/${currentSlide + 1}`;
  }

  function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
      currentSlide = index;
      updateSlideView();
    }
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
      updateSlideView();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlideView();
    }
  }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  // 4. Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape toggles overview
    if (e.key === 'Escape') {
      toggleOverview();
      return;
    }

    // Ignore keys if overview modal is open
    if (overviewModal && overviewModal.classList.contains('open')) return;

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === 'j' || e.key === 'J' || e.key === 'o' || e.key === 'O') {
      toggleOverview();
    } else if (e.key === 'Home') {
      goToSlide(0);
    } else if (e.key === 'End') {
      goToSlide(totalSlides - 1);
    }
  });

  // 5. Fullscreen Management
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

  // 6. Overview Modal Management
  function toggleOverview(forceState) {
    if (!overviewModal) return;
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !overviewModal.classList.contains('open');
    overviewModal.classList.toggle('open', shouldOpen);
  }

  if (overviewBtn) overviewBtn.addEventListener('click', () => toggleOverview());
  if (overviewModal) {
    overviewModal.addEventListener('click', (e) => {
      if (e.target === overviewModal) toggleOverview(false);
    });
  }

  // 7. Presentation Timer
  let elapsedSeconds = 0;
  let timerInterval = null;
  const timerDisplay = document.getElementById('pres-timer-display');
  const timerToggleBtn = document.getElementById('pres-timer-btn');

  function updateTimerText() {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    if (timerDisplay) {
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  function startTimer() {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateTimerText();
      }, 1000);
      if (timerToggleBtn) timerToggleBtn.textContent = 'Pause';
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
      if (timerToggleBtn) timerToggleBtn.textContent = 'Resume';
    }
  }

  if (timerToggleBtn) timerToggleBtn.addEventListener('click', startTimer);
  // Auto-start presentation timer on load
  startTimer();

  // 8. Restore from URL hash on initial load (e.g., #/4)
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    const slideNum = parseInt(hash.replace('#/', ''), 10);
    if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= totalSlides) {
      currentSlide = slideNum - 1;
    }
  }

  updateSlideView();

  // 9. Interactive Demo UI Handlers (Live interactivity for "Sir")
  // Demo 1: Priority clicker updates SLA text
  const priorityChips = document.querySelectorAll('.mock-priority-chip');
  const demoSlaNote = document.getElementById('demo-sla-note');
  priorityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      priorityChips.forEach(c => c.style.outline = 'none');
      chip.style.outline = '2px solid var(--pres-obsidian)';
      const sla = chip.dataset.sla || '48 hrs';
      if (demoSlaNote) demoSlaNote.textContent = `Guaranteed SLA: ${sla}`;
    });
  });

  // Demo 2: Stepper Node Clicker
  const trackerNodes = document.querySelectorAll('.tracker-step-node');
  trackerNodes.forEach((node, nodeIdx) => {
    node.addEventListener('click', () => {
      trackerNodes.forEach((n, idx) => {
        const circle = n.querySelector('.tracker-circle');
        const label = n.querySelector('.tracker-step-label');
        if (idx < nodeIdx) {
          circle.className = 'tracker-circle done';
          circle.innerHTML = '&check;';
          label.className = 'tracker-step-label';
        } else if (idx === nodeIdx) {
          circle.className = 'tracker-circle active';
          circle.innerHTML = idx + 1;
          label.className = 'tracker-step-label active';
        } else {
          circle.className = 'tracker-circle';
          circle.innerHTML = idx + 1;
          label.className = 'tracker-step-label';
        }
      });
    });
  });

  // Demo 3: Queue Filter Chips
  const queueChips = document.querySelectorAll('.queue-chip');
  queueChips.forEach(chip => {
    chip.addEventListener('click', () => {
      queueChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
});
