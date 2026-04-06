import { DurableObject } from "cloudflare:workers";

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
		console.log(`[DO] ${userInfo.username} joined room, total clients: ${this.clients.size}`);

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

		console.log(`[DO] Received from ${sender.username}:`, data.type);

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
				console.log(`[DO] Broadcast stroke to ${sent} clients`);
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

		return env.ASSETS.fetch(request);
	},
};
