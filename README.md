# Overmorrow Canvas

A real-time collaborative drawing app built with Cloudflare Workers + Durable Objects.

## Features

- **Canvas drawing** with mouse/touch support
- **Left toolbar**: pen, eraser, color picker, brush size, opacity
- **Real-time collaboration**: see other users' strokes instantly
- **Chat**: send messages that appear as speech bubbles
- **Avatars & presence**: see who's online with emoji avatars
- **Majority-vote canvas clear**: all users must agree before clearing

## Architecture

```
┌─────────────────────────────────────────────┐
│           Cloudflare Worker                  │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │  Assets     │    │  Durable Objects   │  │
│  │  (public/)  │    │  (RoomDO)          │  │
│  │  index.html │◄──►│  - Broadcasts      │  │
│  │  styles.css │    │  - Presence        │  │
│  │  main.js    │    │  - Chat relay      │  │
│  └─────────────┘    │  - Vote clearing   │  │
│                     └────────────────────┘  │
└─────────────────────────────────────────────┘
```

Single URL serves both the frontend (static assets) and the WebSocket backend.

## Setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Navigate to the worker directory:
   ```bash
   cd plain-block-fcce
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Deploy:
   ```bash
   npm run deploy
   ```

Your app will be live at `https://plain-block-fcce.<your-account>.workers.dev`

## Local Development

```bash
cd plain-block-fcce
npm run dev
```

Open `http://localhost:8787` in two browser tabs to test real-time collaboration.

## Usage

1. Open the app URL
2. Set your name and pick an avatar (🎨 or 🚀)
3. Enter a room name (or use "default") and click **Join**
4. Share the same room URL with your friend
5. Draw, chat, and collaborate in real-time!

## Message Protocol

```
Client → Server:
  { type: 'join', userId, username, avatar }
  { type: 'stroke', points, color, size, opacity, eraser }
  { type: 'chat', message }
  { type: 'clear-request' }
  { type: 'clear-vote', voteId, agree }

Server → Client:
  { type: 'users', list: [{ userId, username, avatar }] }
  { type: 'user-joined', userId, username, avatar }
  { type: 'user-left', userId, username }
  { type: 'stroke', userId, points, color, size, opacity, eraser }
  { type: 'chat', userId, username, avatar, message }
  { type: 'clear-vote', voteId, requester, timeout }
  { type: 'clear-result', voteId, agreed, yesCount, totalVoted }
  { type: 'clear-canvas' }
```
