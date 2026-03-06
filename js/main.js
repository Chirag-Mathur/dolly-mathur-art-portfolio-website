const state = {
  pages: [],
  currentIndex: 0,
  cleanupTimer: null
};

const elements = {
  book: document.getElementById('book'),
  pageLabel: document.getElementById('pageLabel'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  hallToggle: document.getElementById('hallToggle'),
  hallClose: document.getElementById('hallClose'),
  hallOverlay: document.getElementById('hallOverlay'),
  hallGrid: document.getElementById('hallGrid'),
  paintingModal: document.getElementById('paintingModal'),
  modalClose: document.getElementById('modalClose'),
  modalImage: document.getElementById('modalImage'),
  modalImageStage: document.getElementById('modalImageStage'),
  modalCaption: document.getElementById('modalCaption'),
  modalZoomIn: document.getElementById('modalZoomIn'),
  modalZoomOut: document.getElementById('modalZoomOut'),
  modalZoomReset: document.getElementById('modalZoomReset'),
  contactTemplate: document.getElementById('contactPageTemplate'),
  paintingTemplate: document.getElementById('paintingPageTemplate')
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function touchDistance(touchA, touchB) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
}

function setupPinchZoom(image) {
  const state = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    startDistance: 0,
    startScale: 1,
    panStartX: 0,
    panStartY: 0,
    lastTouchX: 0,
    lastTouchY: 0,
    isPanning: false,
    isMousePanning: false,
    mouseStartX: 0,
    mouseStartY: 0
  };

  function maxPanX() {
    return ((state.scale - 1) * image.clientWidth) / 2;
  }

  function maxPanY() {
    return ((state.scale - 1) * image.clientHeight) / 2;
  }

  function applyTransform() {
    const panX = maxPanX();
    const panY = maxPanY();
    state.translateX = clamp(state.translateX, -panX, panX);
    state.translateY = clamp(state.translateY, -panY, panY);
    image.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  }

  function resetZoom() {
    state.scale = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyTransform();
  }

  image.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
      state.startDistance = touchDistance(event.touches[0], event.touches[1]);
      state.startScale = state.scale;
      state.isPanning = false;
      return;
    }

    if (event.touches.length === 1 && state.scale > 1) {
      state.isPanning = true;
      state.lastTouchX = event.touches[0].clientX;
      state.lastTouchY = event.touches[0].clientY;
      state.panStartX = state.translateX;
      state.panStartY = state.translateY;
    }
  }, { passive: true });

  image.addEventListener('touchmove', (event) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const distance = touchDistance(event.touches[0], event.touches[1]);
      if (!state.startDistance) {
        state.startDistance = distance;
      }

      const ratio = distance / state.startDistance;
      state.scale = clamp(state.startScale * ratio, 1, 4);
      if (state.scale === 1) {
        state.translateX = 0;
        state.translateY = 0;
      }
      applyTransform();
      return;
    }

    if (event.touches.length === 1 && state.isPanning && state.scale > 1) {
      event.preventDefault();
      const touch = event.touches[0];
      state.translateX = state.panStartX + (touch.clientX - state.lastTouchX);
      state.translateY = state.panStartY + (touch.clientY - state.lastTouchY);
      applyTransform();
    }
  }, { passive: false });

  image.addEventListener('touchend', () => {
    if (state.scale <= 1) {
      state.isPanning = false;
      state.startDistance = 0;
      state.startScale = 1;
    } else {
      state.isPanning = false;
      state.startDistance = 0;
      state.startScale = state.scale;
    }
  });

  image.addEventListener('dblclick', () => {
    resetZoom();
  });

  image.addEventListener('wheel', (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 0.2 : -0.2;
    state.scale = clamp(state.scale + direction, 1, 4);
    if (state.scale === 1) {
      state.translateX = 0;
      state.translateY = 0;
    }
    applyTransform();
  }, { passive: false });

  image.addEventListener('mousedown', (event) => {
    if (state.scale <= 1) {
      return;
    }
    state.isMousePanning = true;
    state.mouseStartX = event.clientX - state.translateX;
    state.mouseStartY = event.clientY - state.translateY;
  });

  window.addEventListener('mousemove', (event) => {
    if (!state.isMousePanning) {
      return;
    }
    state.translateX = event.clientX - state.mouseStartX;
    state.translateY = event.clientY - state.mouseStartY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    state.isMousePanning = false;
  });

  return {
    zoomIn() {
      state.scale = clamp(state.scale + 0.2, 1, 4);
      applyTransform();
    },
    zoomOut() {
      state.scale = clamp(state.scale - 0.2, 1, 4);
      if (state.scale === 1) {
        state.translateX = 0;
        state.translateY = 0;
      }
      applyTransform();
    },
    reset() {
      resetZoom();
    }
  };
}

const modalZoomController = setupPinchZoom(elements.modalImage);

function clearAnimClasses(page) {
  page.classList.remove('flip-in-forward', 'flip-out-forward', 'flip-in-backward', 'flip-out-backward');
}

function updateUiState() {
  const total = state.pages.length;
  const current = state.currentIndex + 1;
  elements.pageLabel.textContent = `${current} / ${total}`;
  elements.prevBtn.disabled = state.currentIndex === 0;
  elements.nextBtn.disabled = state.currentIndex === total - 1;
}

function setPage(index) {
  if (!state.pages.length) {
    return;
  }

  const nextIndex = Math.max(0, Math.min(index, state.pages.length - 1));
  if (nextIndex === state.currentIndex) {
    return;
  }

  const currentPage = state.pages[state.currentIndex];
  const nextPage = state.pages[nextIndex];
  const direction = nextIndex > state.currentIndex ? 'forward' : 'backward';

  if (state.cleanupTimer) {
    window.clearTimeout(state.cleanupTimer);
  }

  clearAnimClasses(currentPage);
  clearAnimClasses(nextPage);

  currentPage.classList.remove('active');
  currentPage.classList.add(direction === 'forward' ? 'flip-out-forward' : 'flip-out-backward');

  nextPage.classList.add('active', direction === 'forward' ? 'flip-in-forward' : 'flip-in-backward');

  state.currentIndex = nextIndex;
  updateUiState();

  state.cleanupTimer = window.setTimeout(() => {
    state.pages.forEach(clearAnimClasses);
  }, 820);
}

function createContactPage() {
  return elements.contactTemplate.content.firstElementChild.cloneNode(true);
}

function createPaintingPage(painting, pageNumber) {
  const node = elements.paintingTemplate.content.firstElementChild.cloneNode(true);
  const image = node.querySelector('.painting-image');
  const frame = node.querySelector('.royal-frame');

  node.querySelector('.chapter').textContent = `Page ${pageNumber}`;
  node.querySelector('.painting-title').textContent = painting.title;
  node.querySelector('.painting-description').textContent = painting.description || 'No description added yet.';

  const metaParts = [painting.medium, painting.year].filter(Boolean);
  node.querySelector('.painting-meta').textContent = metaParts.length
    ? metaParts.join(' | ')
    : 'Medium and year not specified.';

  node.querySelector('.painting-price').textContent = painting.price
    ? `Price: ${painting.price}`
    : 'Price: Available on request';

  image.src = painting.image;
  image.alt = painting.title;

  image.addEventListener('load', () => {
    const ratio = image.naturalWidth / image.naturalHeight;
    if (Number.isFinite(ratio) && ratio > 0) {
      frame.style.setProperty('--art-ratio', String(ratio));
    }
  });

  image.addEventListener('click', () => {
    openPaintingModal(painting.image, painting.title);
  });

  return node;
}

function openPaintingModal(src, title) {
  elements.modalImage.src = src;
  elements.modalImage.alt = title;
  elements.modalCaption.textContent = title;
  elements.paintingModal.classList.add('open');
  elements.paintingModal.setAttribute('aria-hidden', 'false');
  modalZoomController.reset();
}

function closePaintingModal() {
  elements.paintingModal.classList.remove('open');
  elements.paintingModal.setAttribute('aria-hidden', 'true');
}

function openHall() {
  elements.hallOverlay.classList.add('open');
  elements.hallOverlay.setAttribute('aria-hidden', 'false');
}

function closeHall() {
  elements.hallOverlay.classList.remove('open');
  elements.hallOverlay.setAttribute('aria-hidden', 'true');
}

function createHallItem(index, title, image) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hall-thumb';

  const frame = document.createElement('div');
  frame.className = 'hall-frame';

  const img = document.createElement('img');
  img.src = image;
  img.alt = title;
  img.addEventListener('load', () => {
    const ratio = img.naturalWidth / img.naturalHeight;
    if (Number.isFinite(ratio) && ratio > 0) {
      frame.style.setProperty('--thumb-ratio', String(ratio));
    }
  });

  const label = document.createElement('span');
  label.textContent = title;

  frame.appendChild(img);
  button.appendChild(frame);
  button.appendChild(label);

  button.addEventListener('click', () => {
    setPage(index);
    closeHall();
  });

  return button;
}

function renderHall(paintings) {
  elements.hallGrid.innerHTML = '';

  paintings.forEach((painting, idx) => {
    elements.hallGrid.appendChild(createHallItem(idx + 1, painting.title, painting.image));
  });
}

function renderBook(paintings) {
  elements.book.innerHTML = '';
  state.pages = [];

  const contactPage = createContactPage();
  elements.book.appendChild(contactPage);
  state.pages.push(contactPage);

  paintings.forEach((painting, idx) => {
    const page = createPaintingPage(painting, idx + 2);
    elements.book.appendChild(page);
    state.pages.push(page);
  });

  state.currentIndex = 0;
  state.pages[0].classList.add('active');
  updateUiState();
  renderHall(paintings);
}

async function fetchPaintings() {
  const response = await fetch('/api/paintings', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load paintings');
  }

  const data = await response.json();
  return Array.isArray(data.paintings) ? data.paintings : [];
}

function bindNavigation() {
  elements.prevBtn.addEventListener('click', () => setPage(state.currentIndex - 1));
  elements.nextBtn.addEventListener('click', () => setPage(state.currentIndex + 1));

  elements.hallToggle.addEventListener('click', openHall);
  elements.hallClose.addEventListener('click', closeHall);
  elements.modalClose.addEventListener('click', closePaintingModal);
  elements.modalZoomIn.addEventListener('click', () => modalZoomController.zoomIn());
  elements.modalZoomOut.addEventListener('click', () => modalZoomController.zoomOut());
  elements.modalZoomReset.addEventListener('click', () => modalZoomController.reset());

  elements.hallOverlay.addEventListener('click', (event) => {
    if (event.target === elements.hallOverlay) {
      closeHall();
    }
  });

  elements.paintingModal.addEventListener('click', (event) => {
    if (event.target === elements.paintingModal) {
      closePaintingModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeHall();
      closePaintingModal();
      return;
    }

    if (elements.hallOverlay.classList.contains('open') || elements.paintingModal.classList.contains('open')) {
      return;
    }

    if (event.key === 'ArrowRight') {
      setPage(state.currentIndex + 1);
    }

    if (event.key === 'ArrowLeft') {
      setPage(state.currentIndex - 1);
    }
  });
}

async function init() {
  bindNavigation();

  try {
    const paintings = await fetchPaintings();
    renderBook(paintings);
  } catch {
    renderBook([]);
  }
}

init();
