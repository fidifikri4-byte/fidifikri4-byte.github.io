/* Flyping Blue — Scratch project player
   Menjalankan file .sb3 langsung di browser memakai scratch-vm + scratch-render. */
(function () {
  'use strict';

  var STAGE_WIDTH = 480;
  var STAGE_HEIGHT = 360;

  var canvas = document.getElementById('stage');
  var frame = document.getElementById('stageFrame');
  var loading = document.getElementById('loading');
  var statusEl = document.getElementById('status');
  var restartBtn = document.getElementById('restartBtn');
  var fullscreenBtn = document.getElementById('fullscreenBtn');

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  if (!window.VirtualMachine || !window.ScratchRender) {
    setStatus('Gagal memuat mesin game. Periksa koneksi internet lalu muat ulang halaman.', true);
    if (loading) loading.classList.add('is-hidden');
    return;
  }

  var vm = new window.VirtualMachine();
  var renderer = new window.ScratchRender(canvas);
  vm.attachRenderer(renderer);

  /* Buka di console browser untuk inspeksi: window.__flypingBlue */
  window.__flypingBlue = { vm: vm, renderer: renderer };

  /* Storage wajib ada agar aset kostum & suara dari file .sb3 bisa dimuat. */
  var StorageCtor = window.ScratchStorage &&
    (window.ScratchStorage.ScratchStorage || window.ScratchStorage);
  if (typeof StorageCtor === 'function') {
    vm.attachStorage(new StorageCtor());
  } else {
    console.warn('scratch-storage tidak termuat: aset project tidak akan tampil.');
  }

  /* Adapter bitmap diperlukan untuk kostum PNG/JPG. */
  var BitmapAdapterCtor = window.ScratchSVGRenderer &&
    window.ScratchSVGRenderer.BitmapAdapter;
  if (typeof BitmapAdapterCtor === 'function') {
    vm.attachV2BitmapAdapter(new BitmapAdapterCtor());
  } else {
    console.warn('BitmapAdapter tidak termuat: kostum bitmap bisa gagal dimuat.');
  }

  /* Audio opsional: game tetap jalan walau audio gagal dimuat. */
  if (window.ScratchAudioEngine) {
    try {
      vm.attachAudioEngine(new window.ScratchAudioEngine());
    } catch (error) {
      console.warn('Audio engine tidak aktif:', error);
    }
  }

  /* ---------- Ukuran panggung ---------- */
  function fitStage() {
    if (document.fullscreenElement === frame) return;
    var width = Math.max(1, Math.round(canvas.clientWidth));
    var height = Math.max(1, Math.round(canvas.clientHeight));
    renderer.resize(width, height);
  }

  function layoutStage() {
    if (document.fullscreenElement === frame) {
      var scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
      var width = Math.max(1, Math.floor(STAGE_WIDTH * scale));
      var height = Math.max(1, Math.floor(STAGE_HEIGHT * scale));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      renderer.resize(width, height);
      return;
    }

    canvas.style.width = '';
    canvas.style.height = '';
    fitStage();
  }

  window.addEventListener('resize', layoutStage);
  document.addEventListener('fullscreenchange', function () {
    window.requestAnimationFrame(layoutStage);
  });

  /* ---------- Input mouse / sentuh ---------- */
  function postPointer(event, isDown) {
    var rect = canvas.getBoundingClientRect();
    var data = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height
    };
    if (typeof isDown === 'boolean') data.isDown = isDown;
    vm.postIOData('mouse', data);
  }

  canvas.addEventListener('pointerdown', function (event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    postPointer(event, true);
  });

  window.addEventListener('pointermove', function (event) {
    postPointer(event);
  });

  window.addEventListener('pointerup', function (event) {
    postPointer(event, false);
  });

  /* ---------- Input keyboard ---------- */
  var GAME_KEYS = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  window.addEventListener('keydown', function (event) {
    var tag = event.target && event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (GAME_KEYS.indexOf(event.key) !== -1) event.preventDefault();
    vm.postIOData('keyboard', { key: event.key, isDown: true });
  });

  window.addEventListener('keyup', function (event) {
    vm.postIOData('keyboard', { key: event.key, isDown: false });
  });

  window.addEventListener('blur', function () {
    GAME_KEYS.forEach(function (key) {
      vm.postIOData('keyboard', { key: key, isDown: false });
    });
  });

  /* ---------- Kontrol ---------- */
  if (restartBtn) {
    restartBtn.addEventListener('click', function () {
      vm.greenFlag();
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function () {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        return;
      }
      if (frame.requestFullscreen) {
        frame.requestFullscreen().catch(function () {
          setStatus('Layar penuh tidak tersedia di browser ini.', true);
        });
      }
    });
  }

  /* ---------- Muat project ---------- */
  function base64ToArrayBuffer(base64) {
    var binary = window.atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  var projectBase64 = window.PROJECT_SB3_BASE64;

  if (!projectBase64) {
    setStatus('Data project tidak ditemukan (project-data.js belum termuat).', true);
    if (loading) loading.classList.add('is-hidden');
    return;
  }

  setStatus('Memuat project…');

  vm.loadProject(base64ToArrayBuffer(projectBase64))
    .then(function () {
      vm.start();
      vm.greenFlag();
      layoutStage();
      if (loading) loading.classList.add('is-hidden');
      setStatus('Siap! Klik layar atau tekan Spasi untuk mulai terbang.');
    })
    .catch(function (error) {
      console.error('Gagal memuat project:', error);
      if (loading) loading.classList.add('is-hidden');
      setStatus('Gagal memuat project: ' + (error && error.message ? error.message : 'kesalahan tidak diketahui'), true);
    });
})();
