(function () {
  const cynosura = window.cynosura = window.cynosura ?? {};
  const lifecycleState = cynosura.homeMusicSwitcherLifecycle ?? {};
  cynosura.homeMusicSwitcherLifecycle = lifecycleState;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updatePlayButton = (button, options) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const { hasPreview, isPlaying, title } = options;
    button.disabled = !hasPreview;
    button.classList.toggle('is-playing', hasPreview && isPlaying);
    button.setAttribute('aria-pressed', hasPreview && isPlaying ? 'true' : 'false');

    if (hasPreview) {
      const actionLabel = isPlaying ? '暂停' : '播放';
      button.setAttribute('aria-label', `${actionLabel} ${title} 的试听片段`);
    } else {
      button.setAttribute('aria-label', '当前曲目暂无试听');
    }
  };

  /* ── Audio fade helpers (volume ramp) ── */

  const FADE_MS = 160;
  const FADE_STEPS = 10;

  const createAudioGraph = () => {
    const audio = new Audio();
    audio.preload = 'none';
    let fadeTimer = null;

    const clearFade = () => {
      if (fadeTimer !== null) {
        clearInterval(fadeTimer);
        fadeTimer = null;
      }
    };

    const fadeIn = async () => {
      clearFade();
      audio.volume = 0;
      await audio.play();

      let step = 0;
      const interval = FADE_MS / FADE_STEPS;

      fadeTimer = setInterval(() => {
        step += 1;
        audio.volume = Math.min(step / FADE_STEPS, 1);

        if (step >= FADE_STEPS) {
          clearFade();
        }
      }, interval);
    };

    const fadeOut = () => {
      return new Promise((resolve) => {
        clearFade();

        if (audio.paused) {
          audio.currentTime = 0;
          audio.volume = 1;
          resolve();
          return;
        }

        const startVolume = audio.volume;
        let step = 0;
        const interval = FADE_MS / FADE_STEPS;

        fadeTimer = setInterval(() => {
          step += 1;
          audio.volume = Math.max(startVolume * (1 - step / FADE_STEPS), 0);

          if (step >= FADE_STEPS) {
            clearFade();
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1;
            resolve();
          }
        }, interval);
      });
    };

    return { audio, fadeIn, fadeOut };
  };

  const initMusicSwitcher = () => {
    const containers = document.querySelectorAll('[data-home-music]');

    containers.forEach((root) => {
      if (!(root instanceof HTMLElement) || root.dataset.musicBound === 'true') {
        return;
      }

      root.dataset.musicBound = 'true';

      const items = Array.from(root.querySelectorAll('[data-music-item]')).filter((item) => item instanceof HTMLElement);
      const playToggles = Array.from(root.querySelectorAll('[data-music-play-toggle]')).filter((btn) => btn instanceof HTMLButtonElement);
      const musicList = root.querySelector('.home-music-list');
      let activeItem = null;
      let currentPreviewUrl = '';

      if (items.length === 0) {
        return;
      }

      const audioGraph = createAudioGraph();
      const { audio, fadeIn, fadeOut } = audioGraph;
      lifecycleState.audioGraphs = lifecycleState.audioGraphs ?? new Set();
      lifecycleState.audioGraphs.add(audioGraph);

      /* ── Scroll fade mask: reveal top/bottom overflow hints ── */
      if (musicList instanceof HTMLElement) {
        const listProgress = root.querySelector('.home-music-list-progress');
        let progressHideTimer = null;
        let scrollRAF = null;

        const updateListProgress = ({ maxScrollTop, scrollTop }) => {
          if (!(listProgress instanceof HTMLElement)) {
            return;
          }

          const ratio = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;
          const clamped = clamp(ratio, 0, 1);

          listProgress.style.setProperty('--music-list-progress', String(clamped));
          listProgress.classList.toggle('is-disabled', maxScrollTop <= 1);
        };

        const revealListProgress = () => {
          if (!(listProgress instanceof HTMLElement) || listProgress.classList.contains('is-disabled')) {
            return;
          }

          listProgress.classList.add('is-visible');

          if (progressHideTimer) {
            clearTimeout(progressHideTimer);
          }

          progressHideTimer = setTimeout(() => {
            listProgress.classList.remove('is-visible');
          }, 700);
        };

        const applyScrollState = () => {
          const scrollTop = musicList.scrollTop;
          const maxScrollTop = Math.max(musicList.scrollHeight - musicList.clientHeight, 0);
          const remaining = maxScrollTop - scrollTop;
          const atTop = scrollTop < 8;
          const hasScrolled = !atTop;
          const atVisualEnd = remaining < 12;
          const atScrollBoundary = remaining <= 1;

          musicList.classList.toggle('is-scrolled-start', hasScrolled);
          musicList.classList.toggle('is-scrolled-end', atVisualEnd);
          musicList.style.overscrollBehavior = atTop || atScrollBoundary ? 'auto' : 'contain';
          updateListProgress({ maxScrollTop, scrollTop });
          revealListProgress();
        };

        const onMusicListScroll = () => {
          if (scrollRAF !== null) {
            return;
          }

          scrollRAF = requestAnimationFrame(() => {
            scrollRAF = null;
            applyScrollState();
          });
        };

        musicList.addEventListener('scroll', onMusicListScroll, { passive: true });
        applyScrollState();
      }

      const getActivePlayButton = () => {
        if (!(activeItem instanceof HTMLElement)) return null;
        return activeItem.querySelector('[data-music-play-toggle]');
      };

      const stopPlayback = async () => {
        await fadeOut();
        root.dataset.musicPlaying = 'false';
      };

      const syncPreviewForSelection = (selected) => {
        activeItem = selected;
        const previewUrl = selected.dataset.previewUrl || '';

        if (currentPreviewUrl !== previewUrl) {
          currentPreviewUrl = previewUrl;

          if (previewUrl) {
            audio.src = previewUrl;
          } else {
            audio.removeAttribute('src');
            audio.load();
          }
        }
      };

      audio.addEventListener('ended', () => {
        root.dataset.musicPlaying = 'false';
        const btn = getActivePlayButton();
        if (btn instanceof HTMLButtonElement && activeItem instanceof HTMLElement) {
          updatePlayButton(btn, {
            hasPreview: Boolean(activeItem.dataset.previewUrl),
            isPlaying: false,
            title: activeItem.dataset.title ?? 'Music',
          });
        }
      });

      /* ── Per-item play button click handlers ── */
      playToggles.forEach((playBtn) => {
        playBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const item = playBtn.closest('[data-music-item]');
          if (!(item instanceof HTMLElement)) return;

          const previewUrl = item.dataset.previewUrl || '';
          if (!previewUrl) return;

          // Different item: switch and play in one atomic step — no flicker
          if (item !== activeItem) {
            await applyActiveItem(item, { shouldPlay: true });
            return;
          }

          // Same item: toggle play/pause
          if (!audio.paused && currentPreviewUrl === previewUrl) {
            const btn = getActivePlayButton();
            if (btn instanceof HTMLButtonElement) {
              updatePlayButton(btn, {
                hasPreview: true,
                isPlaying: false,
                title: activeItem?.dataset.title ?? 'Music',
              });
            }
            await stopPlayback();
            return;
          }

          // Resume playing same item
          try {
            await fadeIn();
            root.dataset.musicPlaying = 'true';
            const btn = getActivePlayButton();
            if (btn instanceof HTMLButtonElement) {
              updatePlayButton(btn, {
                hasPreview: true,
                isPlaying: true,
                title: activeItem?.dataset.title ?? 'Music',
              });
            }
          } catch {
            root.dataset.musicPlaying = 'false';
          }
        });
      });

      const applyActiveItem = async (selected, { scroll = true, shouldPlay = false } = {}) => {
        if (activeItem instanceof HTMLElement && activeItem !== selected) {
          /* ── Reset old item's button immediately ── */
          const oldBtn = getActivePlayButton();
          if (oldBtn instanceof HTMLButtonElement) {
            updatePlayButton(oldBtn, {
              hasPreview: Boolean(activeItem.dataset.previewUrl),
              isPlaying: false,
              title: activeItem.dataset.title ?? 'Music',
            });
          }
          await stopPlayback();
        }

        items.forEach((item) => {
          item.classList.toggle('is-active', item === selected);
        });

        /* ── Update accent color ── */
        root.style.setProperty('--music-accent', selected.dataset.accent || '194 88% 46%');

        /* ── Update artwork inside the active item ── */
        const artworkEl = selected.querySelector('[data-music-item-artwork]');
        if (artworkEl instanceof HTMLElement) {
          const artworkUrl = selected.dataset.artwork || '';
          const img = artworkEl.querySelector('img');

          if (artworkUrl && img instanceof HTMLImageElement) {
            const nextSrc = artworkUrl;
            const nextRequestId = (artworkEl.__artworkRequestId || 0) + 1;
            artworkEl.__artworkRequestId = nextRequestId;

            if (img.src === nextSrc || img.src.endsWith(new URL(nextSrc, location.href).pathname)) {
              img.style.opacity = '1';
            } else {
              const preloader = new Image();
              preloader.crossOrigin = 'anonymous';
              preloader.referrerPolicy = 'no-referrer';

              preloader.onload = () => {
                if (artworkEl.__artworkRequestId !== nextRequestId) return;
                img.style.opacity = '0';
                img.src = nextSrc;
                img.alt = selected.dataset.title ? selected.dataset.title + ' 封面' : '';
                requestAnimationFrame(() => {
                  if (artworkEl.__artworkRequestId !== nextRequestId) return;
                  img.style.opacity = '1';
                });
              };

              preloader.onerror = () => {
                if (artworkEl.__artworkRequestId !== nextRequestId) return;
                img.removeAttribute('src');
                img.alt = '';
                img.style.opacity = '1';
              };

              preloader.src = nextSrc;
            }
          }
        }

        syncPreviewForSelection(selected);

        if (shouldPlay) {
          const previewUrl = selected.dataset.previewUrl || '';
          if (previewUrl) {
            if (currentPreviewUrl !== previewUrl) {
              currentPreviewUrl = previewUrl;
              audio.src = previewUrl;
            }
            try {
              await fadeIn();
              root.dataset.musicPlaying = 'true';
              const btn = getActivePlayButton();
              if (btn instanceof HTMLButtonElement) {
                updatePlayButton(btn, {
                  hasPreview: true,
                  isPlaying: true,
                  title: selected.dataset.title ?? 'Music',
                });
              }
            } catch {
              root.dataset.musicPlaying = 'false';
            }
          }
        } else {
          /* ── Reset new item's play button to paused state ── */
          const newBtn = selected.querySelector('[data-music-play-toggle]');
          if (newBtn instanceof HTMLButtonElement) {
            updatePlayButton(newBtn, {
              hasPreview: Boolean(selected.dataset.previewUrl),
              isPlaying: false,
              title: selected.dataset.title ?? 'Music',
            });
          }
        }

        if (scroll) {
          selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      };

      items.forEach((item) => {
        item.addEventListener('click', () => {
          applyActiveItem(item);
        });

        item.addEventListener('keydown', (event) => {
          const currentIndex = items.indexOf(item);

          if (currentIndex < 0) {
            return;
          }

          let nextIndex = currentIndex;

          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % items.length;
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + items.length) % items.length;
          } else if (event.key === 'Home') {
            nextIndex = 0;
          } else if (event.key === 'End') {
            nextIndex = items.length - 1;
          } else {
            return;
          }

          event.preventDefault();
          const target = items[nextIndex];
          target.focus();
          applyActiveItem(target);
        });
      });

      const initialSelected = items.find((item) => item.classList.contains('is-active')) || items[0];
      applyActiveItem(initialSelected, { scroll: false });
    });
  };

  const initMusicSwitcherWrapped = () => {
    initMusicSwitcher();
  };

  cynosura.initHomeMusicSwitcher = initMusicSwitcherWrapped;

  lifecycleState.cleanupAudioGraphs = () => {
    if (!(lifecycleState.audioGraphs instanceof Set) || lifecycleState.audioGraphs.size === 0) {
      return;
    }

    lifecycleState.audioGraphs.forEach((graph) => {
      graph.audio.pause();
      graph.audio.removeAttribute('src');
      graph.audio.load();
    });
    lifecycleState.audioGraphs.clear();
  };

  if (!lifecycleState.bound) {
    const onBeforeSwap = () => {
      lifecycleState.cleanupAudioGraphs?.();
    };

    lifecycleState.bound = true;
    lifecycleState.onBeforeSwap = onBeforeSwap;
    document.addEventListener('astro:before-swap', onBeforeSwap);
  }

  initMusicSwitcherWrapped();
})();
