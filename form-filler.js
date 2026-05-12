#!/usr/bin/env node

/**
 * Form Filler - 自动网页表单填充工具
 *
 * 使用方法:
 *   node form-filler.js <url> <file_path> [options]
 *
 * 示例:
 *   node form-filler.js https://example.com/form data.json
 *   node form-filler.js https://example.com table data.csv --table
 */

const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs(args) {
  const url = args[0];
  const filePath = args[1];
  const options = {};

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--table') options.mode = 'table';
    if (args[i] === '--form') options.mode = 'form';
    if (args[i] === '--selector' && args[i + 1]) {
      options.selector = args[i + 1];
      i++;
    }
    if (args[i] === '--index' && args[i + 1]) {
      options.index = parseInt(args[i + 1]);
      i++;
    }
  }

  return { url, filePath, options };
}

// 根据文件扩展名检测类型
function detectFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.json': return 'json';
    case '.csv': return 'csv';
    case '.xlsx':
    case '.xls': return 'excel';
    case '.txt': return 'text';
    default: return 'text';
  }
}

// 读取JSON文件
function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// 读取CSV文件
function readCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) return [];

  // 解析标题行
  const headers = parseCSVLine(lines[0]);

  // 解析数据行
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    data.push(row);
  }

  return data;
}

// 解析CSV单行
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// 读取文本文件
function readTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // 假设格式为: 字段名:值 或 key=value
  const data = {};
  lines.forEach(line => {
    // 尝试 "字段: 值" 格式
    const colonMatch = line.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) {
      data[colonMatch[1].trim()] = colonMatch[2].trim();
    }

    // 尝试 "key=value" 格式
    const equalMatch = line.match(/^(.+?)=\s*(.+)$/);
    if (equalMatch) {
      data[equalMatch[1].trim()] = equalMatch[2].trim();
    }
  });

  return data;
}

// 读取Excel文件 (需要xlsx库支持)
function readExcelFile(filePath) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } catch (e) {
    console.error('读取Excel文件失败:', e.message);
    console.error('请确保已安装 xlsx 库: npm install xlsx');
    return [];
  }
}

// 根据文件类型读取数据
function readDataFile(filePath) {
  const fileType = detectFileType(filePath);

  console.log(`[Form Filler] 检测到文件类型: ${fileType}`);

  switch (fileType) {
    case 'json':
      return readJsonFile(filePath);
    case 'csv':
      return readCsvFile(filePath);
    case 'excel':
      return readExcelFile(filePath);
    case 'text':
    default:
      return readTextFile(filePath);
  }
}

// 生成填充脚本
function generateFillScript(data, options = {}) {
  let script = '';

  if (Array.isArray(data)) {
    // 数组数据 - 多行表格
    data.forEach((row, index) => {
      script += `\n// 行 ${index + 1}`;
      Object.entries(row).forEach(([key, value]) => {
        // 尝试多种选择器方式
        script += `\ntry { document.querySelector('[name="${key}"]').value = '${value}'; } catch(e) {}`;
        script += `\ntry { document.querySelector('#${key}').value = '${value}'; } catch(e) {}`;
        script += `\ntry { document.querySelector('.${key}').value = '${value}'; } catch(e) {}`;
      });
    });
  } else {
    // 对象数据 - 单行表单
    Object.entries(data).forEach(([key, value]) => {
      script += `\n// 字段: ${key}`;
      script += `\ntry { document.querySelector('[name="${key}"]').value = '${value}'; } catch(e) { console.log('未找到字段: ${key}'); }`;
      script += `\ntry { document.querySelector('#${key}').value = '${value}'; } catch(e) {}`;
      script += `\ntry { document.querySelector('.${key}').value = '${value}'; } catch(e) {}`;
    });
  }

  return script;
}

// 打印使用说明
function printUsage() {
  console.log(`
Form Filler - 自动网页表单填充工具
=====================================

使用方法:
  node form-filler.js <url> <file_path> [options]

参数:
  url           目标网页URL (必填)
  file_path     数据文件路径 (必填)

选项:
  --table      将数据作为表格行填充
  --form       将数据作为表单字段填充 (默认)
  --selector   指定表单选择器
  --index      表格索引 (默认0)

支持的文件格式:
  .json        JSON数组或对象
  .csv         CSV表格 (首行为标题)
  .xlsx/xls    Excel文件
  .txt         文本文件 (格式: 字段:值 或 key=value)

示例:
  node form-filler.js https://example.com/form data.json
  node form-filler.js https://example.com table data.csv --table
  node form-filler.js https://example.com input.json --selector "#main-form"

JSON数据格式示例:
  {"字段名": "值", "字段名2": "值2"}

CSV数据格式示例:
  字段1,字段2,字段3
  值1,值2,值3
  值4,值5,值6
`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2 || args[0] === '--help') {
    printUsage();
    process.exit(0);
  }

  const { url, filePath, options } = parseArgs(args);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error(`[错误] 文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`[Form Filler] 开始填充任务`);
  console.log(`[Form Filler] 目标URL: ${url}`);
  console.log(`[Form Filler] 数据文件: ${filePath}`);

  // 读取数据
  const data = readDataFile(filePath);

  if (!data || (Array.isArray(data) && data.length === 0) || Object.keys(data).length === 0) {
    console.error('[错误] 无法解析数据文件或文件为空');
    process.exit(1);
  }

  console.log(`[Form Filler] 成功读取 ${Array.isArray(data) ? data.length + ' 行' : '1 条'} 数据`);

  // 生成填充脚本
  const script = generateFillScript(data, options);

  console.log(`\n[Form Filler] 生成的填充脚本:\n${script}`);

  console.log(`\n[Form Filler] 提示: 请在 Playwright 浏览器中使用 browser_evaluate 执行上述脚本`);
  console.log(`[Form Filler] 或者将脚本复制到浏览器控制台执行\n`);
}

// 运行
main();
