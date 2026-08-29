# openai-endpoint-playground

一个**零依赖单文件 HTML** 的 OpenAI 兼容端点对话游乐场：填任意 `…/v1` 端点即可拉取模型、流式对话、显示思考过程并统计吐字速度。

🔗 **在线使用**：https://fred-chen.github.io/openai-endpoint-playground/

## 特性

- 🔌 输入 OpenAI 兼容端点（如 `https://api.openai.com/v1`、vLLM、Ollama、DeepSeek、Kimi 等），自动拉取 `/models` 模型列表
- ⌨️ 模型框可下拉选择，也可自由键入未在端点列举的模型名
- 💬 系统提示词 + 用户提示词，支持多轮对话（可勾选开关）
- ⚡ 流式（SSE）输出，回复按帧渲染，逐字可见
- 🧠 思考过程实时显示（兼容 `reasoning_content` / `reasoning` 等字段）
- 🎛 采样参数：`temperature` / `top_p` / `top_k` / `reasoning_effort`（off/low/medium/high/xhigh）
- 📊 生成结束自动统计：TTFT、生成耗时、字数、吐字速度（字/s）、Tokens、tok/s
- 🖥 自动滚动跟随最新回复；回复区可最大化为大弹窗
- 仅依赖 CDN 上的 marked + DOMPurify（加载失败自动降级为纯文本），本地无任何依赖

## 使用

在线直接用上方链接，或本地用浏览器打开 `index.html`（无需服务器）：

```
open index.html              # macOS
```

填入端点地址 → 刷新模型 → 输入提示词 → 发送。

> **https 页面调用 http 端点会被浏览器拦截（混合内容）**：在线地址是 https，若你的端点是 http（如局域网 `http://ai395:8080/v1`），安全页面不能直接访问 http 接口，会报 `Failed to fetch`。这不是 CORS 问题。解决办法见下方「连接 http 端点」。

## 连接 http 端点（混合内容）

在线页是 **https**，浏览器禁止 https 页面请求 **http** 接口（混合内容），表现为 `获取模型失败：Failed to fetch`。三种解法，任选其一：

1. **本地代理（推荐）**：本地运行仓库里的 `dev-proxy.js`，它同时解决混合内容与 CORS，并能访问你内网的 `ai395`：
   ```
   node dev-proxy.js                 # 默认上游 http://ai395:8080
   # 或：node dev-proxy.js http://ai395:8080 8787
   ```
   然后打开 **http://localhost:8787/** ，端点填 **http://localhost:8787/v1**。
2. **本地直接打开**：`open index.html`（或任意 http 本地服务），本地页面访问 http 内网端点不受混合内容限制。
3. **给端点配 HTTPS**：为 `ai395:8080` 配上 TLS，或放到同源的 https 反向代理后面，在线页即可直连。

> 提示：`dev-proxy.js` 仅监听 `127.0.0.1`、无鉴权，只用于本地调试。

## 自动部署

本仓库通过 GitHub Pages（Deploy from a branch：`main` / `/`）托管。任何推送到 `main` 的提交都会自动触发 Pages 重新构建，线上页面保持最新。

## License

MIT
