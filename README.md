# openai-endpoint-playground

一个**零依赖单文件 HTML** 的 OpenAI 兼容端点对话游乐场：填任意 `…/v1` 端点即可拉取模型、流式对话、显示思考过程并统计吐字速度。

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

直接用浏览器打开 `openai-chat.html`（无需服务器）：

```
open openai-chat.html        # macOS
```

填入端点地址 → 刷新模型 → 输入提示词 → 发送。

> 注意：页面从浏览器直接请求你的端点，需要端点允许浏览器跨域（CORS）；如端点不支持 CORS，请自行加反向代理。

## License

MIT
