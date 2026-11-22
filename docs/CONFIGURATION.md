# ⚙️ 数据、API 与备份配置

[← 功能介绍](../README.md) · [部署教程](DEPLOY.md)

## 📦 本地历史与云端历史

本机历史存入 IndexedDB，不是服务器文件夹。服务器版可连接 SQLite 历史 API，Cloudflare 版可连接 KV 历史 API；二者均使用访问密钥认证。连接后可开启后续修改自动同步。

| 参数 | 填在哪里 | 用途 |
| --- | --- | --- |
| `HISTORY_TOKEN` | VPS `server/.env`；Pages 环境 Secret | 至少 24 位随机私密密钥，网页连接时填写同一个值 |
| `HISTORY_KV` | Cloudflare Pages 的 KV 绑定 | 绑定真实 KV 命名空间，不是普通文本变量 |
| `ALLOWED_ORIGINS` | VPS `.env`；Pages 环境变量 | 允许调用 API 的其他网页来源，英文逗号分隔 |

同域访问通常无需额外跨域配置。跨站示例：

```dotenv
ALLOWED_ORIGINS=https://yourname.github.io,https://charts.example.com
```

填来源的协议与域名，不能附带 `/repo/` 等路径。HTTPS 页面应连接 HTTPS API。

历史接口路径为 `/api/history`，认证头为 `Authorization: Bearer <你的密钥>`。网页已有历史管理入口，一般不必自己编写接口请求。

> 当前为密钥保护的个人历史库，不是带用户隔离的多人账号系统。共享同一个访问密钥意味着共享该历史库的访问权限。

## 🤖 AI 分析（可选）

打开顶部“AI 分析”，选择接口类型，填写模型、端点、密钥与系统提示词。图表和视频功能不依赖这一步。

### OpenAI 兼容服务

- 在所选服务商控制台创建 API Key。
- 基础地址填写服务商提供的兼容地址，例如 `https://api.openai.com/v1`。
- 模型填服务商实际支持的模型 ID，不能把界面显示名称当模型 ID。
- 保存后先进行小数据测试；调用失败检查 Key、额度、端点和模型权限。

### 自己的 HTTP Agent

选择 HTTP Agent，按界面要求配置服务地址。它是 HTTP 调用，不会执行本机终端 Agent。服务必须允许网页来源的 CORS。

### 数据如何发送

AI 请求由浏览器直接发出。默认不发送当前表格，勾选附带数据后才发送。API 设置可保存在本浏览器；密钥不会写入导出包与数据备份。不要在公共电脑保存个人 Key。

## 🏳️ 图标与音乐

国旗 / 品牌匹配使用随包资源，不需要额外申请 API；不识别时可上传单项图片。网页音乐与视频音乐独立设置，视频可选择无音乐、内置曲目或自定义音频。

## 💾 推荐备份方式

1. 本地历史定期导出 JSON，换电脑后通过历史管理导入。
2. VPS 停止服务后备份完整 `server/data/`，私密 `.env` 另行保存。
3. 不要把数据库、备份、真实数据集和密钥提交到公开仓库。

高级部署脚本与 Cloudflare 参数可参考 [cloudflare/deploy/oneclick.mjs](../cloudflare/deploy/oneclick.mjs)；普通使用者按控制台绑定 KV 即可，无需 Cloudflare API Token。
