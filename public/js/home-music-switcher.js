(function () {
  const cynosura = window.cynosura = window.cynosura ?? {};
  const lifecycleState = cynosura.homeMusicSwitcherLifecycle ?? {};
  cynosura.homeMusicSwitcherLifecycle = lifecycleState;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updatePlayButton = (button, options) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const { hasPreview, isPlaying, title, state = 'idle' } = options;
    button.disabled = !hasPreview;
    button.classList.toggle('is-playing', hasPreview && isPlaying);
    button.setAttribute('aria-pressed', hasPreview && isPlaying ? 'true' : 'false');
    button.setAttribute('aria-busy', String(state === 'loading'));

    if (hasPreview) {
      const actionLabel = state === 'loading' ? '取消加载' : state === 'error' ? '重试' : isPlaying ? '暂停' : '播放';
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
    let finishFade = null;
    let disposed = false;
    let cancelPlay = null;
    let playVersion = 0;

    const clearFade = () => {
      if (fadeTimer !== null) {
        clearInterval(fadeTimer);
        fadeTimer = null;
      }
      const finish = finishFade;
      finishFade = null;
      finish?.();
    };

    const cancelPending = () => {
      if (!cancelPlay) return false;
      const cancel = cancelPlay;
      cancelPlay = null;
      playVersion += 1;
      cancel();
      audio.pause();
      return true;
    };

    const fadeIn = async () => {
      if (disposed) return false;
      clearFade();
      audio.volume = 0;
      const version = ++playVersion;
      let timeout;
      try {
        const cancelled = new Promise(resolve => { cancelPlay = () => resolve(false); });
        const expired = new Promise((_, reject) => {
          timeout = setTimeout(() => { audio.pause(); reject(new Error('Preview timed out')); }, 15000);
        });
        const played = await Promise.race([audio.play().then(() => true), cancelled, expired]);
        if (!played || disposed || version !== playVersion) return false;
      } finally {
        clearTimeout(timeout);
        if (version === playVersion) cancelPlay = null;
      }

      let step = 0;
      const interval = FADE_MS / FADE_STEPS;

      fadeTimer = setInterval(() => {
        step += 1;
        audio.volume = Math.min(step / FADE_STEPS, 1);

        if (step >= FADE_STEPS) {
          clearFade();
        }
      }, interval);
      return true;
    };

    const fadeOut = ({ reset = false } = {}) => {
      return new Promise((resolve) => {
        clearFade();

        if (disposed || audio.paused) {
          if (reset) audio.currentTime = 0;
          audio.volume = 1;
          resolve();
          return;
        }

        const startVolume = audio.volume;
        finishFade = resolve;
        let step = 0;
        const interval = FADE_MS / FADE_STEPS;

        fadeTimer = setInterval(() => {
          step += 1;
          audio.volume = Math.max(startVolume * (1 - step / FADE_STEPS), 0);

          if (step >= FADE_STEPS) {
            audio.pause();
            if (reset) audio.currentTime = 0;
            audio.volume = 1;
            clearFade();
          }
        }, interval);
      });
    };

    const dispose = () => {
      disposed = true;
      cancelPending();
      clearFade();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };

    return { audio, fadeIn, fadeOut, cancelPending, dispose };
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
      let playbackQueue = Promise.resolve();
      let disposed = false;
      let cleanupScroll = () => {};
      const controller = new AbortController();
      const { signal } = controller;
      const status = root.querySelector('[data-music-status]');
      const original = root.querySelector('[data-music-original]');

      // Finish each fade before handling the next click so rapid toggles cannot
      // cancel a fade timer and leave its promise unresolved.
      const queuePlayback = (action) => {
        playbackQueue = playbackQueue.then(() => {
          if (!disposed) return action();
        }).catch(() => {
          if (!disposed) setState('error');
        });
      };

      if (items.length === 0) {
        return;
      }

      const audioGraph = createAudioGraph();
      const { audio, fadeIn, fadeOut } = audioGraph;
      lifecycleState.audioGraphs = lifecycleState.audioGraphs ?? new Set();
      lifecycleState.audioGraphs.add(audioGraph);
      audioGraph.cleanup = () => {
        disposed = true;
        controller.abort();
        cleanupScroll();
        audioGraph.dispose();
        root.dataset.musicPlaying = 'false';
        root.dataset.musicBound = 'false';
      };

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
        cleanupScroll = () => {
          musicList.removeEventListener('scroll', onMusicListScroll);
          if (scrollRAF !== null) cancelAnimationFrame(scrollRAF);
          if (progressHideTimer !== null) clearTimeout(progressHideTimer);
        };
        applyScrollState();
      }

      const getActivePlayButton = () => {
        if (!(activeItem instanceof HTMLElement)) return null;
        return activeItem.querySelector('[data-music-play-toggle]');
      };

      const setState = (state) => {
        if (disposed || !activeItem) return;
        const title = activeItem.dataset.title || '当前曲目';
        const hasPreview = Boolean(activeItem.dataset.previewUrl);
        if (!hasPreview) state = 'unavailable';
        root.dataset.musicState = state;
        root.dataset.musicPlaying = String(state === 'playing');
        const messages = {
          idle: `已选择《${title}》，可播放试听片段。`,
          loading: `正在加载《${title}》的试听…可再次点击取消。`,
          playing: `正在试听《${title}》的片段。`,
          paused: `《${title}》已暂停，可继续试听。`,
          ended: `《${title}》试听结束，可重新播放。`,
          error: `《${title}》试听加载失败，请重试或前往 Apple Music 听原曲。`,
          unavailable: `《${title}》暂无试听，可前往 Apple Music 听原曲。`,
        };
        if (status) status.textContent = messages[state];
        updatePlayButton(getActivePlayButton(), { hasPreview, isPlaying: state === 'playing', title, state });
      };

      const stopPlayback = async ({ reset = false } = {}) => {
        await fadeOut({ reset });
        if (!disposed) setState('paused');
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
        setState('ended');
      }, { signal });
      audio.addEventListener('error', () => {
        audioGraph.cancelPending();
        audio.pause();
        setState('error');
      }, { signal });
      audio.addEventListener('waiting', () => { if (!audio.paused) setState('loading'); }, { signal });
      audio.addEventListener('playing', () => setState('playing'), { signal });

      const startPlayback = async () => {
        const selected = activeItem;
        setState('loading');
        try {
          if (audio.error) audio.load();
          const played = await fadeIn();
          if (disposed || activeItem !== selected) return;
          if (played) setState('playing');
          else if (root.dataset.musicState !== 'error') setState('paused');
        } catch {
          if (!disposed && activeItem === selected) setState('error');
        }
      };

      /* ── Per-item play button click handlers ── */
      playToggles.forEach((playBtn) => {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cancelLoading = root.dataset.musicState === 'loading' && playBtn.closest('[data-music-item]') === activeItem;
          audioGraph.cancelPending();
          queuePlayback(async () => {
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
            if (cancelLoading || (!audio.paused && currentPreviewUrl === previewUrl)) {
              await stopPlayback();
              return;
            }

            // Resume playing same item
            await startPlayback();
          });
        }, { signal });
      });

      const applyActiveItem = async (selected, { scroll = true, shouldPlay = false } = {}) => {
        if (disposed || activeItem === selected) return;

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
          await stopPlayback({ reset: true });
          if (disposed) return;
        }

        items.forEach((item) => {
          item.classList.toggle('is-active', item === selected);
          item.querySelector('[data-music-select]')?.setAttribute('aria-pressed', String(item === selected));
        });

        /* ── Update accent color ── */
        root.style.setProperty('--music-accent', selected.dataset.accent || '194 88% 46%');

        // Each row owns its cover. Fetch an inactive cover only when selected,
        // and let srcset choose the resolution without a second preloader.
        const artwork = selected.querySelector('.home-music-item-artwork-img');
        if (artwork instanceof HTMLImageElement && artwork.dataset.src) {
          artwork.loading = 'eager';
          if (artwork.dataset.srcset) artwork.srcset = artwork.dataset.srcset;
          artwork.src = artwork.dataset.src;
          delete artwork.dataset.src;
          delete artwork.dataset.srcset;
        }

        syncPreviewForSelection(selected);
        if (original) {
          original.setAttribute('href', selected.dataset.link);
          original.setAttribute('aria-label', `在 Apple Music 打开 ${selected.dataset.title}（新窗口）`);
        }
        setState('idle');

        if (shouldPlay) {
          const previewUrl = selected.dataset.previewUrl || '';
          if (previewUrl) {
            await startPlayback();
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
        const select = item.querySelector('[data-music-select]');
        select?.addEventListener('click', () => {
          if (activeItem === item) return;
          audioGraph.cancelPending();
          queuePlayback(() => applyActiveItem(item));
        }, { signal });

        select?.addEventListener('keydown', (event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
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
          target.querySelector('[data-music-select]')?.focus();
          audioGraph.cancelPending();
          queuePlayback(() => applyActiveItem(target));
        }, { signal });
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
      graph.cleanup();
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
    document.addEventListener('astro:page-load', () => cynosura.initHomeMusicSwitcher?.());
  }

  initMusicSwitcherWrapped();
})();
