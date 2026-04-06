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
  const createBtn = document.getElementById('createBtn');
  const joinBtn = document.getElementById('joinBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const statusEl = document.getElementById('status');
  const usernameInput = document.getElementById('usernameInput');
  const avatarBtns = document.querySelectorAll('.avatar-btn');
  const usersGroup = document.getElementById('usersGroup');
  const usersList = document.getElementById('usersList');
  const chatHistory = document.getElementById('chatHistory');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const voteModal = document.getElementById('voteModal');
  const voteText = document.getElementById('voteText');
  const voteYes = document.getElementById('voteYes');
  const voteNo = document.getElementById('voteNo');
  const voteTimer = document.getElementById('voteTimer');
  const roomSetupGroup = document.getElementById('roomSetupGroup');
  const roomInfoGroup = document.getElementById('roomInfoGroup');
  const currentRoomName = document.getElementById('currentRoomName');
  const drawingTools = document.getElementById('drawingTools');
  const chatGroup = document.getElementById('chatGroup');

  let drawing = false;
  let current = {
    color: colorPicker.value,
    size: parseInt(sizeRange.value, 10) || 5,
    opacity: parseFloat(opacityRange.value) || 1,
    eraser: false,
  };
  let lastX = 0, lastY = 0;
  let room = null;
  let ws = null;
  let myUserId = crypto.randomUUID();
  let myUsername = 'Anonymous';
  let myAvatar = '🎨';
  let users = new Map();
  let activeVote = null;
  let voteTimerInterval = null;

  function resizeCanvas() {
    const parent = canvas.parentElement;
    const w = parent.clientWidth - 2;
    const h = parent.clientHeight - 2;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = w;
    canvas.height = Math.max(400, h);
    ctx.putImageData(imageData, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function setToolFromButtons() {
    const isPen = !current.eraser;
    penBtn.classList.toggle('active', isPen);
    eraserBtn.classList.toggle('active', !isPen);
  }
  penBtn.addEventListener('click', () => { current.eraser = false; setToolFromButtons(); });
  eraserBtn.addEventListener('click', () => { current.eraser = true; setToolFromButtons(); });

  colorPicker.addEventListener('change', () => { current.color = colorPicker.value; });
  sizeRange.addEventListener('input', () => { current.size = parseInt(sizeRange.value, 10); });
  opacityRange.addEventListener('input', () => { current.opacity = parseFloat(opacityRange.value); });

  avatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      avatarBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      myAvatar = btn.dataset.avatar;
    });
  });

  clearBtn.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear-request' }));
    } else {
      if (confirm('Clear canvas?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
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

  function renderStroke(stroke) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.eraser ? '#000000' : stroke.color;
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over';
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    if (stroke.points.length > 0) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  let currentStrokePoints = [];

  function onPointerDown(e) {
    const p = getPointerEventPos(e);
    beginStroke(p.x, p.y);
    currentStrokePoints = [p];
  }
  function onPointerMove(e) {
    const p = getPointerEventPos(e);
    drawStroke(p.x, p.y);
    if (drawing) currentStrokePoints.push(p);
  }
  function onPointerUp() {
    if (!drawing) return;
    endStroke();
    if (ws && ws.readyState === WebSocket.OPEN && currentStrokePoints.length > 0) {
      ws.send(JSON.stringify({
        type: 'stroke',
        points: currentStrokePoints,
        color: current.color,
        size: current.size,
        opacity: current.opacity,
        eraser: current.eraser,
      }));
    }
    currentStrokePoints = [];
  }

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

  function renderUsers() {
    usersList.innerHTML = '';
    users.forEach((user) => {
      const el = document.createElement('div');
      el.className = 'user-item';
      el.innerHTML = `<span class="user-avatar">${user.avatar}</span><span class="user-name">${user.username}</span>`;
      usersList.appendChild(el);
    });
    usersGroup.style.display = users.size > 0 ? '' : 'none';
  }

  function addChatMessage(username, message) {
    const el = document.createElement('div');
    el.className = 'chat-msg';
    el.innerHTML = `<span class="chat-user">${username}:</span> ${escapeHtml(message)}`;
    chatHistory.appendChild(el);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat', message: msg }));
    chatInput.value = '';
  }

  chatSendBtn.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showVoteModal(requester, timeout) {
    activeVote = { voteId: null, timeout };
    voteText.textContent = `${requester} wants to clear the canvas. Agree?`;
    voteModal.style.display = 'flex';
    let remaining = Math.ceil(timeout / 1000);
    voteTimer.textContent = `Auto-closes in ${remaining}s`;
    voteTimerInterval = setInterval(() => {
      remaining--;
      voteTimer.textContent = `Auto-closes in ${remaining}s`;
      if (remaining <= 0) clearInterval(voteTimerInterval);
    }, 1000);
  }

  function hideVoteModal() {
    voteModal.style.display = 'none';
    if (voteTimerInterval) clearInterval(voteTimerInterval);
    activeVote = null;
  }

  voteYes.addEventListener('click', () => {
    if (activeVote && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear-vote', voteId: activeVote.voteId, agree: true }));
    }
    hideVoteModal();
  });

  voteNo.addEventListener('click', () => {
    if (activeVote && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear-vote', voteId: activeVote.voteId, agree: false }));
    }
    hideVoteModal();
  });

  function getWsUrl() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }

  function setInRoom(inRoom) {
    roomSetupGroup.style.display = inRoom ? 'none' : '';
    roomInfoGroup.style.display = inRoom ? '' : 'none';
    drawingTools.style.display = inRoom ? '' : 'none';
    chatGroup.style.display = inRoom ? '' : 'none';
  }

  function enterRoom(roomId) {
    room = roomId;
    myUsername = usernameInput.value.trim() || 'Anonymous';
    currentRoomName.textContent = room;
    setInRoom(true);

    const url = `${getWsUrl()}/?room=${encodeURIComponent(room)}&userId=${encodeURIComponent(myUserId)}&username=${encodeURIComponent(myUsername)}&avatar=${encodeURIComponent(myAvatar)}`;

    if (ws) {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
    }

    statusEl.textContent = 'Status: Connecting...';

    ws = new WebSocket(url);

    ws.onopen = () => {
      statusEl.textContent = `Status: Connected — Room: ${room}`;
    };

    ws.onclose = () => {
      statusEl.textContent = 'Status: Disconnected';
      users.clear();
      renderUsers();
    };

    ws.onerror = () => {
      statusEl.textContent = 'Status: Connection error';
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.type) {
        case 'user-joined':
          users.set(data.userId, { userId: data.userId, username: data.username, avatar: data.avatar });
          renderUsers();
          break;

        case 'user-left':
          users.delete(data.userId);
          renderUsers();
          break;

        case 'users':
          users.clear();
          (data.list || []).forEach(u => users.set(u.userId, u));
          renderUsers();
          break;

        case 'stroke':
          renderStroke(data);
          break;

        case 'chat':
          addChatMessage(data.username, data.message);
          break;

        case 'clear-vote':
          activeVote = { voteId: data.voteId };
          showVoteModal(data.requester, data.timeout);
          break;

        case 'clear-result':
          hideVoteModal();
          if (!data.agreed) {
            addChatMessage('System', `Clear canvas vote failed (${data.yesCount}/${data.totalVoted} agreed)`);
          }
          break;

        case 'clear-canvas':
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          addChatMessage('System', 'Canvas cleared');
          break;
      }
    };
  }

  function leaveRoom() {
    if (ws) {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
      ws = null;
    }
    room = null;
    users.clear();
    renderUsers();
    setInRoom(false);
    statusEl.textContent = 'Status: Offline — create or join a room';
  }

  createBtn.addEventListener('click', () => {
    const id = roomInput.value.trim();
    if (!id) {
      roomInput.value = crypto.randomUUID().slice(0, 8);
    }
    enterRoom(roomInput.value.trim());
  });

  joinBtn.addEventListener('click', () => {
    const id = roomInput.value.trim();
    if (!id) return;
    enterRoom(id);
  });

  leaveBtn.addEventListener('click', leaveRoom);

  copyLinkBtn.addEventListener('click', () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room)}`;
    navigator.clipboard.writeText(url).then(() => {
      copyLinkBtn.textContent = 'Copied!';
      setTimeout(() => { copyLinkBtn.textContent = 'Copy Link'; }, 2000);
    });
  });

  // Auto-join from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const autoRoom = urlParams.get('room');
  if (autoRoom) {
    roomInput.value = autoRoom;
    enterRoom(autoRoom);
  }
})();
