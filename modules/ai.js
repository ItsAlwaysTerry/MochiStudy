(function () {
  const API_KEY = "api_config";

  function readConfig() {
    try {
      return JSON.parse(localStorage.getItem(API_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveConfig(config) {
    localStorage.setItem(API_KEY, JSON.stringify({
      baseUrl: (config.baseUrl || "").replace(/\/+$/, ""),
      apiKey: config.apiKey || "",
      model: config.model || "",
    }));
  }

  function buildFallbackNote(log) {
    const subject = log.subjectLabel || log.subject || "数学";
    const date = new Date(log.date || Date.now()).toLocaleDateString("zh-CN");
    return `# ${subject}-${log.nodeLabel}-${date}
#高考 #${subject} #${log.nodeLabel}

## 今日总结
${log.content || log.routine || "今天完成了一段稳定的学习记录。"}

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

  async function callAI(systemPrompt, userMessage) {
    const config = readConfig();
    if (!config.apiKey || !config.baseUrl) return null;
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const model = config.model || "deepseek-chat";

    if (baseUrl.includes("anthropic.com")) {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "AI 连接失败");
      return data.content?.[0]?.text || null;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "AI 连接失败");
    return data.choices?.[0]?.message?.content || null;
  }

  async function generateObsidianNote(log) {
    const systemPrompt = "你是一个学习笔记助手。根据学习记录生成适合存入 Obsidian 的 Markdown 笔记。包含标题、#高考 标签、今日总结、解题套路、卡点记录和相关知识点链接。语气鼓励。";
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
    generateObsidianNote,
    buildFallbackNote,
  };
})();
