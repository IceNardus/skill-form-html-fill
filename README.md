# Form HTML Fill Skill

**网页表单自动填充工具** - 通过 Playwright MCP 读取数据文件并自动填写到网页表单中。

---

## 功能特性

- 支持多种数据格式：**JSON**、**CSV**、**TXT**、**Excel**
- 支持直接文本输入：`姓名: 张三\n性别: 男`
- 智能字段匹配：name → id → placeholder
- 自动处理下拉框、文本框
- 截图确认填写结果

---

## 前置要求

### 1. 安装 Playwright MCP

在 Claude Code 设置中添加：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-playwright"]
    }
  }
}
```

或手动安装：

```bash
# 安装 Playwright
npm install -g playwright

# 安装浏览器
npx playwright install chromium
```

### 2. 验证安装

```bash
npx playwright --version
```

---

## 安装

### 方法一：克隆仓库

```bash
# 克隆到 Claude Code skills 目录
git clone https://github.com/IceNardus/skill-form-html-fill.git ~/.claude/skills/form-html-fill
```

### 方法二：手动复制

将整个 `form-html-fill` 文件夹复制到 `~/.claude/skills/` 目录下。

---

## 使用方式

在 Claude Code 中输入：

```
/form-html-fill
```

或描述您的需求：
- "帮我填表"
- "填充表单"
- "自动填写网页"
- "把...填到表单里"

---

## 数据文件格式

### JSON
```json
{
  "姓名": "张三",
  "性别": "男",
  "电话": "13800138000",
  "邮箱": "zhangsan@example.com"
}
```

### CSV
```csv
姓名,性别,电话,邮箱
张三,男,13800138000,zhangsan@example.com
```

### TXT
```
姓名: 张三
性别: 男
电话: 13800138000
邮箱: zhangsan@example.com
```

---

## 示例

**示例 1**：提供 URL 和数据
```
帮我填写 http://localhost:8080/form.html
数据：姓名张三，男，138xxx，abc@example.com
```

**示例 2**：从文件读取
```
把 data.json 的数据填到 http://example.com/form
```

**示例 3**：直接输入文本
```
把以下信息填到表单：
姓名: 李四
电话: 13900139000
```

---

## 工作流程

1. **询问目标** - 获取目标网页 URL 和数据
2. **访问网页** - 使用 browser_navigate
3. **识别表单** - 使用 browser_snapshot 获取页面结构
4. **读取数据** - 解析 JSON/CSV/TXT/Excel 文件
5. **执行填充** - 使用 browser_evaluate 自动填写
6. **截图确认** - 使用 browser_take_screenshot 展示结果

---

## 工具清单

| 工具 | 用途 | 必需 |
|------|------|------|
| browser_navigate | 访问目标URL | ✅ |
| browser_snapshot | 获取页面结构 | ✅ |
| browser_evaluate | 执行填充脚本 | ✅ |
| browser_take_screenshot | 截图确认 | ✅ |
| browser_type | 逐字输入 | ○ |
| browser_select_option | 选择下拉选项 | ○ |

---

## 常见问题

**Q: 提示 "browser_navigate is not available"**
A: Playwright MCP 未安装或未启用。请参考上方「前置要求」。

**Q: 字段名不匹配怎么办？**
A: Skill 支持模糊匹配，如"电话"可匹配"手机号码"。

**Q: 下拉框无法选择？**
A: 确保提供的值与选项 value 匹配。

---

## 目录结构

```
form-html-fill/
├── SKILL.md        # 核心技能文档
├── form-filler.js  # 辅助脚本（可选）
└── README.md       # 本说明文件
```

---

## License

MIT
