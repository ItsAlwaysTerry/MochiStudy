(function () {
  const API_KEY = "api_config";
  const DEFAULT_MAX_TOKENS = 2200;

  function readConfig() {
    try {
      return JSON.parse(localStorage.getItem(API_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveConfig(config) {
    const maxTokens = Number(config.maxTokens || 0);
    localStorage.setItem(API_KEY, JSON.stringify({
      baseUrl: (config.baseUrl || "").replace(/\/+$/, ""),
      apiKey: config.apiKey || "",
      model: config.model || "",
      maxTokens: maxTokens > 0 ? Math.round(maxTokens) : DEFAULT_MAX_TOKENS,
    }));
  }

  function buildFallbackNote(log) {
    const subject = log.subjectLabel || log.subject || "数学";
    const date = new Date(log.date || Date.now()).toLocaleDateString("zh-CN");
    return `# ${subject}-${log.nodeLabel}-${date}
#高考 #${subject} #${log.nodeLabel}

## 今日总结
${log.content || log.routine || "今天完成了一段稳定的学习记录。"}

## 原题
${log.originalQuestion || "暂无原题描述。"}

## 解题套路
- 第一步：先识别题目给出的核心条件。
- 第二步：把条件对应到 ${log.nodeLabel} 的常用模型或公式。
- 第三步：按步骤演算，最后检查单位、范围和特殊情况。

## 卡点记录
- ${log.painPoint || "下次可以注意把易混概念单独整理成对照表。"}

## 相关知识点
- [[${log.nodeLabel}]]
`;
  }

  function configuredMaxTokens(config, override) {
    const value = Number(override || config?.maxTokens || DEFAULT_MAX_TOKENS);
    return Number.isFinite(value) && value > 0 ? Math.round(value) : DEFAULT_MAX_TOKENS;
  }

  function isAnthropicBase(baseUrl) {
    return String(baseUrl || "").includes("anthropic.com");
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("图片读取失败"));
      reader.readAsDataURL(blob);
    });
  }

  async function imageToDataUrl(image) {
    if (!image) throw new Error("缺少题目图片");
    if (typeof image === "string") return image;
    if (image instanceof Blob) return blobToDataUrl(image);
    if (image.blob instanceof Blob) return blobToDataUrl(image.blob);
    throw new Error("不支持的图片格式");
  }

  function parseDataUrl(dataUrl) {
    const match = String(dataUrl || "").match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) throw new Error("图片需要是 base64 data URL");
    return { mediaType: match[1], data: match[2] };
  }

  function normalizeAnthropicContent(content) {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return String(content || "");
    return content.map((part) => {
      if (part.type === "text") return { type: "text", text: String(part.text || "") };
      if (part.type === "image_url") {
        const parsed = parseDataUrl(part.image_url?.url || "");
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: parsed.mediaType,
            data: parsed.data,
          },
        };
      }
      return { type: "text", text: String(part.text || part.content || "") };
    });
  }

  function normalizeOpenAIContent(content) {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return String(content || "");
    return content;
  }

  function extractAnthropicText(data) {
    return (data.content || [])
      .map((part) => part?.text || "")
      .filter(Boolean)
      .join("\n")
      .trim() || null;
  }

  function extractOpenAIText(data) {
    return data.choices?.[0]?.message?.content || null;
  }

  async function requestAnthropic(config, systemPrompt, messages, options = {}) {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const model = config.model || "claude-sonnet-4-20250514";
    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: configuredMaxTokens(config, options.maxTokens),
        system: systemPrompt,
        messages: messages.map((message) => ({
          role: message.role,
          content: normalizeAnthropicContent(message.content),
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI 连接失败");
    return extractAnthropicText(data);
  }

  async function requestOpenAICompatible(config, systemPrompt, messages, options = {}) {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const model = config.model || "deepseek-chat";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: configuredMaxTokens(config, options.maxTokens),
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          ...messages.map((message) => ({
            role: message.role,
            content: normalizeOpenAIContent(message.content),
          })),
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI 连接失败");
    return extractOpenAIText(data);
  }

  async function callMessages(systemPrompt, messages, options = {}) {
    const config = readConfig();
    if (!config.apiKey || !config.baseUrl) return null;
    return isAnthropicBase(config.baseUrl)
      ? requestAnthropic(config, systemPrompt, messages, options)
      : requestOpenAICompatible(config, systemPrompt, messages, options);
  }

  async function callAI(systemPrompt, userMessage, options = {}) {
    return callMessages(systemPrompt, [{ role: "user", content: userMessage }], options);
  }

  async function callAIWithImage(systemPrompt, userMessage, image, options = {}) {
    const dataUrl = await imageToDataUrl(image);
    return callMessages(systemPrompt, [{
      role: "user",
      content: [
        { type: "text", text: String(userMessage || "") },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    }], options);
  }

  async function testVisionAI(image) {
    const systemPrompt = [
      "你是 MochiStudy 的题图识别验证助手。",
      "请判断自己是否真的看到了图片，而不是猜测。",
      "你的回答开头必须先写【图中原文】：然后逐字抄出图片里任意一个具体数字、题号、公式片段或题干原文，例如“第3题”“x²-2x+1”“如图所示”。",
      "如果你抄不出任何图中原文，就说明你没真正读到图，请直接说“我看不到图片”。",
      "抄出原文后，再用中文输出：1）科目判断；2）题目里你能读到的关键词或条件；3）你会如何开始引导学生。",
    ].join("\n");
    const userMessage = "请读取这张题图。不要完整解题，只做视觉能力验证。先按要求抄出一个图中原文片段。";
    return callAIWithImage(systemPrompt, userMessage, image, { maxTokens: 900 });
  }

  async function generateStudyNote(log) {
    const systemPrompt = "你是一个学习笔记助手。根据学习记录生成 Markdown 学习小结。包含标题、#高考 标签、今日总结、原题、解题套路、卡点记录和相关知识点链接。语气鼓励。";
    const userMessage = JSON.stringify(log, null, 2);
    try {
      const aiText = await callAI(systemPrompt, userMessage);
      return aiText || buildFallbackNote(log);
    } catch (error) {
      window.MochiApp?.toast(error.message || "AI 连接失败，已生成基础模板");
      return buildFallbackNote(log);
    }
  }

  window.MochiAI = {
    readConfig,
    saveConfig,
    callAI,
    callAIWithImage,
    callMessages,
    testVisionAI,
    generateStudyNote,
    buildFallbackNote,
  };
})();
