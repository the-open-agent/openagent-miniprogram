# openagent-miniprogram

WeChat Mini Program (微信小程序) for [OpenAgent](https://github.com/the-open-agent/openagent), built with [Taro](https://github.com/NervJS/taro) + React.

## Features

- Sign in with WeChat (`wx.login`), via the Casdoor application that OpenAgent uses
- Chat with streaming answers (Markdown, reasoning, suggestions), stop generation
- Chat history: open, delete (long press)

## How it works

- **Sign-in**: `wx.login` returns a code, which is sent to OpenAgent's `POST /api/signin?code=<code>&tag=wechat_miniprogram`. OpenAgent exchanges it at Casdoor's `/api/login/oauth/access_token` with `tag=wechat_miniprogram`, and Casdoor uses the application's **WeChat Mini Program** provider to call `jscode2session`. The session cookie returned by OpenAgent is stored and sent with every request, since `wx.request` has no cookie jar.
- **Streaming**: mini programs have no `EventSource`, so `/api/get-message-answer` is read with `wx.request({enableChunked: true})` and parsed as `text/event-stream` (`src/api/stream.weapp.js`). If the stream drops, the answer keeps being generated on the server, and the page polls the message until it is saved. Platforms without chunked responses use `src/api/stream.js`, which only polls.

## Setup

1. Register a Mini Program at https://mp.weixin.qq.com and get its AppID and AppSecret.
2. In Casdoor, add a provider with category **OAuth** and type **WeChat Mini Program** (Client ID = AppID, Client secret = AppSecret), and add it to the application that OpenAgent uses (`casdoorApplication` in OpenAgent's `app.conf`). Enable sign-up in that application if new users should be created on first sign-in.
3. In the Mini Program admin console, add the OpenAgent server to **request 合法域名** (HTTPS only).
4. Set `ServerUrl` in `src/config.js` to the OpenAgent server, and `appid` in `project.config.json` to your AppID.

## Development

```bash
npm install
npm run dev:weapp
```

Open this directory in WeChat DevTools (微信开发者工具); it loads the build from `dist/`. For a local OpenAgent server, turn off domain checking in DevTools (详情 → 本地设置 → 不校验合法域名).

Production build:

```bash
npm run build:weapp
```

## License

[Apache-2.0](LICENSE)
