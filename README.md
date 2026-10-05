# openagent-miniprogram

WeChat Mini Program (微信小程序) for [OpenAgent](https://github.com/the-open-agent/openagent), built with [Taro](https://github.com/NervJS/taro) + React.

## Features

- Sign in on the Casdoor sign-in page of the OpenAgent server (password, SMS code, WeChat, ... as configured in Casdoor), opened in a web-view
- Chat with streaming answers (Markdown, reasoning, suggestions), stop generation
- Chat history: open, delete (long press)

## How it works

- **Sign-in**: the Casdoor issuer, client ID and app name come from the `jsonWebConfig` cookie of OpenAgent's `/api/get-account`. The login page opens Casdoor's `/login/oauth/authorize` in a `<web-view>`, with OpenAgent's `/callback` as the redirect URI. OpenAgent's callback page detects the mini program web-view and calls `wx.miniProgram.redirectTo("/pages/callback/index?code=...&state=...")` instead of using the code itself; the mini program then calls `POST /api/signin?code=...&state=...`. The session cookie returned by OpenAgent is stored and sent with every request, since `wx.request` has no cookie jar.
- **Streaming**: mini programs have no `EventSource`, so `/api/get-message-answer` is read with `wx.request({enableChunked: true})` and parsed as `text/event-stream` (`src/api/stream.weapp.js`). If the stream drops, the answer keeps being generated on the server, and the page polls the message until it is saved. Platforms without chunked responses use `src/api/stream.js`, which only polls.

## Setup

1. Register a Mini Program at https://mp.weixin.qq.com.
2. In the Mini Program admin console (开发管理 → 开发设置):
   - **request 合法域名**: the OpenAgent server.
   - **业务域名** (for the web-view): the Casdoor server and the OpenAgent server. Each one must serve the verification file downloaded there at its root.
3. In Casdoor, the application's redirect URLs must include `https://<OpenAgent server>/callback` (already the case for the web sign-in).
4. Copy `.env.example` to `.env.local` (ignored by git) and set your AppID, OpenAgent server and app name.

## Development

```bash
npm install
npm run dev:weapp
```

Open the `dist/` directory in WeChat DevTools (微信开发者工具); its `project.config.json` carries the AppID from `.env.local`. For a local OpenAgent server, turn off domain checking in DevTools (详情 → 本地设置 → 不校验合法域名).

Production build:

```bash
npm run build:weapp
```

## License

[Apache-2.0](LICENSE)
