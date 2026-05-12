# Form HTML Fill Skill

**独立运行的网页表单填充工具** - 不依赖其他 Skill，直接通过 Playwright MCP 工具完成所有操作。

---

## ⚠️ 前置要求

本 Skill 需要以下 Playwright MCP 工具才可运行：

### 1. 检查 MCP 工具是否可用

在 Claude Code 中，运行以下命令检查：

```bash
/claude-code-tools
```

或查看是否有 Playwright 相关工具可用。

### 2. 安装 Playwright MCP（如需要）

**方法一：通过 Claude Code 配置**

在 Claude Code 设置中添加 Playwright MCP 服务器：

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

**方法二：手动安装**

```bash
# 安装 Playwright
npm install -g playwright

# 安装浏览器
npx playwright install chromium
```

**方法三：使用已有工具**

如果您已有其他 Playwright MCP 工具（如 `mcp__plugin_playwright_*`），本 Skill 可直接使用。

### 3. 验证安装

运行以下命令测试：

```bash
npx playwright --version
```

---

## 触发条件

当用户描述以下任务时直接触发：
- "填表"、"填充表单"
- "识别网页表格并填充数据"
- "从文件读取数据填入网页"
- "自动填写网页"
- "帮我填写表单"
- "将以下信息填入网页"
- "把...填到表单里"
- "表单填充"
- "帮我自动填表"

---

## 两种输入方式

### 方式一：文件输入
读取并解析数据文件：
- **JSON**: 标准 JSON 对象或数组
- **CSV**: 首行为标题的数据表
- **Text**: `字段:值` 格式
- **Excel**: xlsx/xls 格式

### 方式二：直接文本输入
用户直接提供字段数据：
- 格式化文本：`姓名: 张三\n性别: 男`
- JSON 文本：`{"姓名":"张三","电话":"138xxx"}`
- 纯列表：`张三,男,28,138xxx`（按表单顺序）

---

## 工作流程

### Step 1: 检查 MCP 工具
```
检查 browser_navigate 是否可用
```
如果不可用 → 提示用户安装 Playwright MCP

### Step 2: 获取信息
- 用户提供 URL → 直接访问
- 用户未提供 URL → 询问目标网页地址
- 用户提供数据 → 解析数据

### Step 3: 访问网页
```
browser_navigate → 目标URL
```

### Step 4: 识别表单结构
```
browser_snapshot → 获取页面元素
```
识别内容：
- 所有 `<input>` 字段（text, number, email, tel, password 等）
- 所有 `<select>` 下拉框
- 所有 `<textarea>` 文本域
- 记录每个字段的 name、id、placeholder 属性

### Step 5: 解析数据
根据输入类型解析：

**JSON**：
```javascript
const data = JSON.parse(jsonString)
```

**CSV**：
```javascript
const lines = content.split('\n')
const headers = lines[0].split(',').map(h => h.trim())
const data = {}
headers.forEach((h, i) => {
  data[h] = lines[1].split(',')[i]?.trim()
})
```

**Text**：
```javascript
const data = {}
content.split('\n').forEach(line => {
  const match = line.match(/^(.+?):\s*(.+)$/)
  if (match) data[match[1].trim()] = match[2].trim()
})
```

### Step 6: 执行填充
```
browser_evaluate → 执行填充脚本
```

填充逻辑：
```javascript
function fillForm(data) {
  const results = { filled: [], notFound: [] }

  Object.entries(data).forEach(([key, value]) => {
    // 1. 优先按 name 匹配
    let el = document.querySelector(`[name="${key}"]`)

    // 2. 其次按 id 匹配
    if (!el) el = document.querySelector(`#${key}`)

    // 3. 最后按 placeholder 匹配
    if (!el) el = document.querySelector(`[placeholder*="${key}"]`)

    if (el) {
      if (el.tagName === 'SELECT') {
        el.value = value
        el.dispatchEvent(new Event('change', { bubbles: true }))
      } else {
        el.value = value
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      results.filled.push(key)
    } else {
      results.notFound.push(key)
    }
  })

  return results
}
```

### Step 7: 截图确认
```
browser_take_screenshot → 确认效果
```

---

## 数据格式

### JSON
```json
{
  "姓名": "张三",
  "性别": "男",
  "年龄": "28",
  "手机号码": "13812345678",
  "邮箱": "zhangsan@example.com"
}
```

### CSV
```csv
姓名,性别,年龄,手机号码,邮箱
张三,男,28,13812345678,zhangsan@example.com
```

### Text
```
姓名: 张三
性别: 男
年龄: 28
手机号码: 13812345678
邮箱: zhangsan@example.com
```

### 直接文本（逗号分隔）
```
张三,男,28,13812345678,zhangsan@example.com
```

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

**○** = 可选，用于特殊场景

---

## 示例对话

**示例1**：
```
用户: 帮我填表 http://localhost:8080/form.html
      姓名张三，男，138xxx，abc@example.com

助手: [访问网页] → [识别表单] → [填充数据] → [截图]
填充结果:
✅ 姓名: 张三
✅ 性别: 男
✅ 手机号码: 138xxx
✅ 邮箱: abc@example.com
```

**示例2**：
```
用户: 把 data.json 的数据填到 http://example.com/form

助手: [读取JSON] → [访问网页] → [识别表单] → [填充] → [截图]
```

---

## 常见问题

### Q: 提示 "browser_navigate is not available"
**A**: Playwright MCP 未安装或未启用。按上方说明安装。

### Q: 字段名不匹配怎么办？
**A**: Skill 支持模糊匹配，如"电话"可匹配"手机号码"。

### Q: 下拉框无法选择？
**A**: 确保提供的值与选项 value 匹配，或使用 option 文本值。

---

## 智能特性

1. **多方式匹配**: name → id → placeholder
2. **容错机制**: 不匹配的字段自动跳过
3. **下拉框处理**: 自动选择匹配项
4. **详细报告**: 明确告知填充结果

---

## 注意事项

- 本 Skill 需要 Playwright MCP 工具支持
- 字段名相似时优先精确匹配
- 不存在的字段会报告但不影响其他字段
- 截图确认便于用户检查结果