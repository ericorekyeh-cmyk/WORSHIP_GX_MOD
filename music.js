(function () {
  const ROOT_ID = '__gx_worship_music_root';
  const MP3_FILES = ['track.mp3', 'music.mp3', 'song.mp3', 'worship.mp3', 'audio.mp3'];

  function init() {
    if (document.getElementById(ROOT_ID)) {
      return;
    }

    const state = {
      enabled: false,
      audioCtx: null,
      masterGain: null,
      intervalId: null,
      audioEl: null,
      step: 0,
      melody: [146.83, 164.81, 196.0, 220.0, 246.94, 220.0, 196.0, 174.61, 164.81, 146.83],
      bass: [55.0, 65.41, 73.42, 82.41],
      chords: [146.83, 174.61, 220.0, 261.63]
    };

    function findMp3() {
      if (state.audioEl) {
        return state.audioEl;
      }

      for (const file of MP3_FILES) {
        const audio = new Audio(file);
        audio.loop = true;
        audio.volume = 0.45;
        state.audioEl = audio;
        return audio;
      }

      return null;
    }

    function ensureAudio() {
      if (!state.audioCtx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) {
          return null;
        }

        state.audioCtx = new AudioCtor();
        state.masterGain = state.audioCtx.createGain();
        state.masterGain.gain.value = 0.085;
        state.masterGain.connect(state.audioCtx.destination);
      }

      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }

      return state.audioCtx;
    }

    function playTone(frequency, type, gainValue, duration, detune = 0) {
      const ctx = ensureAudio();
      if (!ctx || !state.masterGain) {
        return;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      gainNode.gain.value = gainValue;

      oscillator.connect(gainNode);
      gainNode.connect(state.masterGain);

      const now = ctx.currentTime;
      oscillator.start(now);
      oscillator.stop(now + duration);
      gainNode.gain.setValueAtTime(gainValue, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    function playChord() {
      const root = state.chords[state.step % state.chords.length];
      playTone(root, 'sine', 0.045, 1.0);
      playTone(root * 1.25, 'triangle', 0.025, 1.0, -4);
      playTone(root * 1.5, 'sine', 0.02, 1.0, 3);
    }

    function pulseSequence() {
      const root = state.bass[state.step % state.bass.length];
      const lead = state.melody[state.step % state.melody.length];
      const shimmer = state.melody[(state.step + 2) % state.melody.length] * 0.5;

      playChord();
      playTone(root, 'sine', 0.09, 0.8);
      playTone(lead, 'triangle', 0.055, 0.58);
      playTone(shimmer, 'sawtooth', 0.022, 0.44);

      state.step += 1;
    }

    function startSynth() {
      if (!ensureAudio()) {
        return;
      }

      if (state.intervalId) {
        return;
      }

      pulseSequence();
      state.intervalId = window.setInterval(pulseSequence, 520);
    }

    function stopSynth() {
      if (state.intervalId) {
        window.clearInterval(state.intervalId);
        state.intervalId = null;
      }
    }

    function startMusic() {
      const mp3 = findMp3();

      if (mp3) {
        mp3.currentTime = 0;
        mp3.play().catch(function () {
          startSynth();
        });
        state.enabled = true;
        button.classList.add('is-on');
        button.setAttribute('aria-pressed', 'true');
        return;
      }

      startSynth();
      state.enabled = true;
      button.classList.add('is-on');
      button.setAttribute('aria-pressed', 'true');
    }

    function stopMusic() {
      state.enabled = false;
      button.classList.remove('is-on');
      button.setAttribute('aria-pressed', 'false');

      const mp3 = state.audioEl;
      if (mp3) {
        mp3.pause();
        mp3.currentTime = 0;
      }

      stopSynth();
    }

    const button = document.createElement('button');
    button.id = ROOT_ID;
    button.type = 'button';
    button.className = 'gx-music-toggle';
    button.setAttribute('aria-label', 'Toggle Worship GX music');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `
      <span class="gx-eq" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span>Worship GX</span>
    `;

    button.addEventListener('click', function () {
      if (state.enabled) {
        stopMusic();
      } else {
        startMusic();
      }
    });

    document.body.appendChild(button);
  }

  function run() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
      return;
    }

    init();
  }

  run();
})();
