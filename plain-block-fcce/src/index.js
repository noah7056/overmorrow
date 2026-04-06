import { DurableObject } from "cloudflare:workers";

const ASSETS = {
	"/": {
		body: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Overmorrow Canvas - Co-working Draw</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="app" class="app">
      <aside id="toolbar" class="toolbar" aria-label="Drawing tools">
        <div class="tool-group">
          <label>Profile</label>
          <input type="text" id="usernameInput" placeholder="Your name" maxlength="20" />
          <div class="avatar-picker">
            <button class="avatar-btn active" data-avatar="🎨" title="Artist">🎨</button>
            <button class="avatar-btn" data-avatar="🚀" title="Rocket">🚀</button>
          </div>
        </div>
        <div class="tool-group" id="roomSetupGroup">
          <label>Room</label>
          <input type="text" id="roomInput" placeholder="Room name" maxlength="30" />
          <div class="room-buttons">
            <button id="createBtn" class="tool-btn primary">Create</button>
            <button id="joinBtn" class="tool-btn">Join</button>
          </div>
        </div>
        <div class="tool-group" id="roomInfoGroup" style="display:none;">
          <label>Room</label>
          <div class="room-info">
            <span id="currentRoomName"></span>
            <button id="copyLinkBtn" class="tool-btn" title="Copy room link">Copy Link</button>
          </div>
          <button id="leaveBtn" class="tool-btn">Leave Room</button>
        </div>
        <div id="drawingTools" style="display:none;">
          <div class="tool-group">
            <button id="penBtn" class="tool-btn active" title="Pen (Draw)">Pen</button>
            <button id="eraserBtn" class="tool-btn" title="Eraser">Eraser</button>
          </div>
          <div class="tool-group">
            <label for="colorPicker">Color</label>
            <input type="color" id="colorPicker" value="#000000" />
          </div>
          <div class="tool-group">
            <label for="sizeRange">Size</label>
            <input type="range" id="sizeRange" min="1" max="60" value="5" />
          </div>
          <div class="tool-group">
            <label for="opacityRange">Opacity</label>
            <input type="range" id="opacityRange" min="0.1" max="1" step="0.05" value="1" />
          </div>
          <div class="tool-group">
            <button id="clearBtn" class="tool-btn">Clear</button>
          </div>
        </div>
        <div class="tool-group" id="usersGroup" style="display:none;">
          <label>Online</label>
          <div id="usersList" class="users-list"></div>
        </div>
        <div class="tool-group chat-group" id="chatGroup" style="display:none;">
          <label>Chat</label>
          <div id="chatHistory" class="chat-history"></div>
          <div class="chat-input-row">
            <input type="text" id="chatInput" placeholder="Type a message..." maxlength="200" />
            <button id="chatSendBtn" class="tool-btn">→</button>
          </div>
        </div>
      </aside>
      <main class="stage" aria-label="Canvas stage">
        <canvas id="canvas" width="1200" height="800"></canvas>
        <div id="status" class="status" aria-live="polite">Status: Offline — create or join a room</div>
        <div id="voteModal" class="vote-modal" style="display:none;">
          <div class="vote-modal-content">
            <p id="voteText">Clear canvas?</p>
            <div class="vote-buttons">
              <button id="voteYes" class="tool-btn">Yes</button>
              <button id="voteNo" class="tool-btn">No</button>
            </div>
            <p id="voteTimer" class="vote-timer"></p>
          </div>
        </div>
      </main>
    </div>
    <script src="main.js"><\/script>
  </body>
</html>`,
		type: "text/html",
	},
	"/styles.css": {
		body: `:root {
  --toolbar-w: 220px;
  --bg: #0f111a;
  --panel: #141824;
  --text: #e8e8e8;
  --accent: #4dabf7;
  --green: #51cf66;
}
* { box-sizing: border-box; }
html, body, #app { height: 100%; margin: 0; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto; background: #111; color: #ddd; }
.app { display: flex; height: 100%; width: 100%; }
.toolbar {
  width: var(--toolbar-w);
  padding: 12px;
  background: #1b1f2b;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.tool-group { display: flex; flex-direction: column; gap: 6px; }
.tool-group label { font-size: 12px; opacity: 0.8; }
.tool-btn { padding: 8px 10px; border-radius: 6px; border: 1px solid #333; background: #2a3246; color: #fff; cursor: pointer; font-size: 12px; }
.tool-btn.active { outline: 2px solid var(--accent); }
.tool-btn:hover { background: #32405e; }
.tool-btn.primary { background: var(--accent); color: #000; font-weight: 600; border-color: var(--accent); }
.tool-btn.primary:hover { background: #3b9de8; }
.room-buttons { display: flex; gap: 6px; }
.room-buttons .tool-btn { flex: 1; }
.room-info { display: flex; align-items: center; gap: 4px; }
#currentRoomName {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--green);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stage { flex: 1; display: flex; align-items: center; justify-content: center; background: #f6f6f6; position: relative; }
#canvas { background: #fff; border: 1px solid #ccc; box-shadow: 0 0 0 1px rgba(0,0,0,.04) inset; touch-action: none; }
.status { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,.5); padding: 6px 12px; border-radius: 999px; color: #fff; font-size: 12px; }
#usernameInput {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #2a3246;
  color: #fff;
  font-size: 12px;
  width: 100%;
}
.avatar-picker { display: flex; gap: 6px; }
.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: #2a3246;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-btn.active { border-color: var(--accent); }
.users-list { display: flex; flex-direction: column; gap: 4px; }
.user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
  background: #2a3246;
}
.user-avatar { font-size: 16px; }
.user-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat-group { flex: 1; min-height: 80px; }
.chat-history {
  flex: 1;
  overflow-y: auto;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  background: #141824;
  border-radius: 6px;
  border: 1px solid #333;
}
.chat-msg {
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 4px;
  background: #2a3246;
  word-break: break-word;
}
.chat-msg .chat-user { font-weight: 600; color: var(--accent); }
.chat-input-row { display: flex; gap: 4px; }
#chatInput {
  flex: 1;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #2a3246;
  color: #fff;
  font-size: 12px;
}
#chatSendBtn { padding: 6px 10px; }
.vote-modal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.4);
  z-index: 10;
}
.vote-modal-content {
  background: #1b1f2b;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px 28px;
  text-align: center;
  color: #fff;
}
.vote-modal-content p { margin: 0 0 12px; font-size: 14px; }
.vote-buttons { display: flex; gap: 10px; justify-content: center; margin-bottom: 8px; }
.vote-timer { font-size: 11px; opacity: 0.6; }
@media (max-width: 900px) {
  :root { --toolbar-w: 160px; }
  #canvas { width: 100%; height: auto; }
}`,
		type: "text/css",
	},
	"/main.js": {
		body: `(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
      el.innerHTML = '<span class="user-avatar">' + user.avatar + '</span><span class="user-name">' + user.username + '</span>';
      usersList.appendChild(el);
    });
    usersGroup.style.display = users.size > 0 ? '' : 'none';
  }

  function addChatMessage(username, message) {
    const el = document.createElement('div');
    el.className = 'chat-msg';
    el.innerHTML = '<span class="chat-user">' + username + ':</span> ' + escapeHtml(message);
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
    voteText.textContent = requester + ' wants to clear the canvas. Agree?';
    voteModal.style.display = 'flex';
    let remaining = Math.ceil(timeout / 1000);
    voteTimer.textContent = 'Auto-closes in ' + remaining + 's';
    voteTimerInterval = setInterval(() => {
      remaining--;
      voteTimer.textContent = 'Auto-closes in ' + remaining + 's';
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
    return proto + '//' + window.location.host;
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

    const url = getWsUrl() + '/?room=' + encodeURIComponent(room) + '&userId=' + encodeURIComponent(myUserId) + '&username=' + encodeURIComponent(myUsername) + '&avatar=' + encodeURIComponent(myAvatar);

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
      statusEl.textContent = 'Status: Connected — Room: ' + room;
    };

    ws.onclose = (e) => {
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
            addChatMessage('System', 'Clear canvas vote failed (' + data.yesCount + '/' + data.totalVoted + ' agreed)');
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
    const url = window.location.origin + window.location.pathname + '?room=' + encodeURIComponent(room);
    navigator.clipboard.writeText(url).then(() => {
      copyLinkBtn.textContent = 'Copied!';
      setTimeout(() => { copyLinkBtn.textContent = 'Copy Link'; }, 2000);
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const autoRoom = urlParams.get('room');
  if (autoRoom) {
    roomInput.value = autoRoom;
    enterRoom(autoRoom);
  }
})();`,
		type: "application/javascript",
	},
};

export class RoomDO extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.clients = new Map();
		this.nextVoteId = 0;
		this.votes = new Map();
	}

	async registerWebSocket(webSocket, userInfo) {
		this.clients.set(webSocket, userInfo);
		webSocket.accept();
		console.log(`[DO] ${userInfo.username} joined, clients: ${this.clients.size}`);

		const joinMsg = JSON.stringify({
			type: "user-joined",
			userId: userInfo.userId,
			username: userInfo.username,
			avatar: userInfo.avatar,
		});
		for (const [ws] of this.clients) {
			if (ws !== webSocket) ws.send(joinMsg);
		}

		const userList = Array.from(this.clients.values()).map(
			({ userId, username, avatar }) => ({ userId, username, avatar })
		);
		webSocket.send(JSON.stringify({ type: "users", list: userList }));
	}

	webSocketMessage(webSocket, message) {
		const sender = this.clients.get(webSocket);
		if (!sender) return;

		let data;
		try {
			data = JSON.parse(message);
		} catch {
			return;
		}

		console.log(`[DO] ${data.type} from ${sender.username}, clients: ${this.clients.size}`);

		switch (data.type) {
			case "stroke": {
				const strokeMsg = JSON.stringify({
					type: "stroke",
					userId: sender.userId,
					username: sender.username,
					points: data.points,
					color: data.color,
					size: data.size,
					opacity: data.opacity,
					eraser: data.eraser,
				});
				let sent = 0;
				for (const [ws] of this.clients) {
					if (ws !== webSocket) {
						ws.send(strokeMsg);
						sent++;
					}
				}
				console.log(`[DO] broadcast stroke to ${sent}`);
				break;
			}

			case "chat": {
				if (!data.message || typeof data.message !== "string") return;
				const chatMsg = JSON.stringify({
					type: "chat",
					userId: sender.userId,
					username: sender.username,
					avatar: sender.avatar,
					message: data.message.slice(0, 200),
				});
				for (const [ws] of this.clients) {
					ws.send(chatMsg);
				}
				break;
			}

			case "clear-request": {
				const voteId = this.nextVoteId++;
				const votes = new Map();
				votes.set(sender.userId, true);

				const voteMsg = JSON.stringify({
					type: "clear-vote",
					voteId,
					requester: sender.username,
					timeout: 10000,
				});
				for (const [ws] of this.clients) {
					ws.send(voteMsg);
				}

				this.votes.set(voteId, { votes, totalClients: this.clients.size });

				this.ctx.waitUntil(
					new Promise((resolve) =>
						setTimeout(() => {
							this.resolveVote(voteId);
							resolve();
						}, 10000)
					)
				);
				break;
			}

			case "clear-vote": {
				const vote = this.votes.get(data.voteId);
				if (vote) {
					vote.votes.set(sender.userId, !!data.agree);
				}
				break;
			}
		}
	}

	resolveVote(voteId) {
		const vote = this.votes.get(voteId);
		if (!vote) return;
		this.votes.delete(voteId);

		const yesCount = Array.from(vote.votes.values()).filter((v) => v).length;
		const totalVoted = vote.votes.size;
		const agreed = yesCount > totalVoted / 2;

		const resultMsg = JSON.stringify({
			type: "clear-result",
			voteId,
			agreed,
			yesCount,
			totalVoted,
		});
		for (const [ws] of this.clients) {
			ws.send(resultMsg);
		}

		if (agreed) {
			for (const [ws] of this.clients) {
				ws.send(JSON.stringify({ type: "clear-canvas" }));
			}
		}
	}

	webSocketClose(webSocket, code, reason, wasClean) {
		const client = this.clients.get(webSocket);
		if (client) {
			this.clients.delete(webSocket);
			console.log(`[DO] ${client.username} left, clients: ${this.clients.size}`);

			const leaveMsg = JSON.stringify({
				type: "user-left",
				userId: client.userId,
				username: client.username,
			});
			for (const [ws] of this.clients) {
				ws.send(leaveMsg);
			}
		}
	}
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (request.headers.get("Upgrade") === "websocket") {
			const room = url.searchParams.get("room") || "default";
			const userId = url.searchParams.get("userId") || crypto.randomUUID();
			const username = url.searchParams.get("username") || "Anonymous";
			const avatar = url.searchParams.get("avatar") || "🎨";

			const id = env.ROOM_DO.idFromName(room);
			const stub = env.ROOM_DO.get(id);
			const pair = new WebSocketPair();

			await stub.registerWebSocket(pair[1], { userId, username, avatar });

			return new Response(null, {
				status: 101,
				webSocket: pair[0],
			});
		}

		const asset = ASSETS[url.pathname];
		if (asset) {
			return new Response(asset.body, {
				headers: { "Content-Type": asset.type },
			});
		}

		return new Response("Not Found", { status: 404 });
	},
};
