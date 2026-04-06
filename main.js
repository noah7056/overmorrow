// Overmorrow Canvas - Base drawing app with left toolbar
(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const colorPicker = document.getElementById('colorPicker');
  const sizeRange = document.getElementById('sizeRange');
  const opacityRange = document.getElementById('opacityRange');
  const penBtn = document.getElementById('penBtn');
  const eraserBtn = document.getElementById('eraserBtn');
  const clearBtn = document.getElementById('clearBtn');
  const roomInput = document.getElementById('roomInput');
  const joinBtn = document.getElementById('joinBtn');
  const statusEl = document.getElementById('status');

  let drawing = false;
  let current = {
    color: colorPicker.value,
    size: parseInt(sizeRange.value, 10) || 5,
    opacity: parseFloat(opacityRange.value) || 1,
    eraser: false,
  };
  let lastX = 0, lastY = 0;
  let room = null;
  let realtimeEnabled = false;

  // Fit canvas to display size
  function resizeCanvas() {
    const parent = canvas.parentElement;
    const w = parent.clientWidth - 2;
    const h = parent.clientHeight - 2;
    const img = canvas.toDataURL(); // snapshot (not strictly needed here)
    canvas.width = w;
    canvas.height = Math.max(400, h);
  }

  window.addEventListener('resize', resizeCanvas);
  // Initial size
  resizeCanvas();

  function setToolFromButtons() {
    const isPen = !current.eraser;
    penBtn.classList.toggle('active', isPen);
    eraserBtn.classList.toggle('active', !isPen);
  }
  penBtn.addEventListener('click', () => {
    current.eraser = false;
    setToolFromButtons();
  });
  eraserBtn.addEventListener('click', () => {
    current.eraser = true;
    setToolFromButtons();
  });

  colorPicker.addEventListener('change', () => {
    current.color = colorPicker.value;
  });
  sizeRange.addEventListener('input', () => {
    current.size = parseInt(sizeRange.value, 10);
  });
  opacityRange.addEventListener('input', () => {
    current.opacity = parseFloat(opacityRange.value);
  });

  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }

  function beginStroke(x, y) {
    drawing = true;
    lastX = x; lastY = y;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = current.opacity;
    ctx.strokeStyle = current.eraser ? '#000000' : current.color;
    ctx.globalCompositeOperation = current.eraser ? 'destination-out' : 'source-over';
    ctx.lineWidth = current.size;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function drawStroke(x, y) {
    if (!drawing) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  }

  function endStroke() {
    if (!drawing) return;
    drawing = false;
    ctx.closePath();
  }

  // Pointer events (support mouse and touch)
  function onPointerDown(e) {
    const p = getPointerEventPos(e);
    beginStroke(p.x, p.y);
  }
  function onPointerMove(e) {
    const p = getPointerEventPos(e);
    drawStroke(p.x, p.y);
  }
  function onPointerUp() { endStroke(); }

  // Normalize touch/mouse events to canvas coords
  function getPointerEventPos(e) {
    if (e.touches && e.touches.length > 0) {
      const t = e.touches[0];
      return getPos({ clientX: t.clientX, clientY: t.clientY });
    }
    return getPos(e);
  }

  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); onPointerMove(e); }, { passive: false });
  window.addEventListener('touchend', onPointerUp, { passive: false });

  // Real-time collaboration scaffolding (optional)
  function initRealtime() {
    // This is a scaffold to wire real-time drawing across clients.
    // You can substitute your own backend (e.g., Supabase, WebSocket server).
    // If no backend is configured, the app will operate in offline mode.
    statusEl.textContent = realtimeEnabled ? `Status: Connected (room=${room})` : 'Status: Offline (real-time disabled)';
  }

  function connectToRoom(roomId) {
    room = roomId || 'default';
    // Placeholder: replace with real-time backend connection logic
    realtimeEnabled = false;
    initRealtime();
  }

  joinBtn.addEventListener('click', () => {
    const id = roomInput.value.trim() || 'default';
    connectToRoom(id);
  });

  // Initialize
  connectToRoom('default');
})();
