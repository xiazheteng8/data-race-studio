# 🚀 部署瞎折腾看数据

[← 返回功能介绍](../README.md) · [API 与配置](CONFIGURATION.md)

## 1. 下载源码

在仓库页面点 **Code → Download ZIP**，完整解压；或运行：

```bash
git clone https://github.com/xiazheteng8/data-race-studio.git
cd data-race-studio
```

下面的命令都以仓库根目录为起点。没有服务器也能先用离线版。

## 2. 本地电脑：先跑起来

完整打开 `offline/index.html` 即可试用。若浏览器限制本地文件功能，先安装 Python 3，再运行：

```bash
python -m http.server 8080 --directory offline
```

浏览器访问 `http://127.0.0.1:8080/`。保持终端开启，按 `Ctrl+C` 停止。历史数据保存在当前站点的浏览器中；换地址访问相当于换一份本地存储。

## 3. VPS / NAS：Docker + SQLite

前提：服务器已安装 Git、Docker 和 Docker Compose 插件，`docker compose version` 能显示版本。

```bash
git clone https://github.com/xiazheteng8/data-race-studio.git
cd data-race-studio/server
cp .env.example .env
```

用文本编辑器打开 `.env`，填写至少 24 位随机的 `HISTORY_TOKEN`，不要沿用示例文字。然后启动：

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=50
```

访问 `http://服务器IP:8088/`。若无法访问，检查云安全组、系统防火墙及 8088 端口。网页中进入“历史数据”，连接自己的服务器 API 并填写相同密钥，再测试保存与载入。

### 域名与 HTTPS

将域名解析到服务器。已有 Nginx Proxy Manager 时，添加 Proxy Host：域名填你的域名，转发协议 `http`，目标填能访问服务器的地址，端口 `8088`；申请 SSL 并开启 HTTPS。

若代理和应用都在 Docker 中，代理里的 `127.0.0.1` 指代理容器本身。可使用服务器内网地址，或共享 Docker 网络后以服务名和容器端口 `8080` 转发。

HTTPS 正常后，可通过防火墙限制公网直接访问 8088，仅保留反向代理入口。

## 4. GitHub Pages：免费静态站

1. Fork 本仓库至自己的 GitHub 账号。
2. 打开 **Settings → Pages**，Source 选择 **GitHub Actions**。
3. 在 **Actions** 中启用工作流，运行 **Deploy GitHub Pages demo**。
4. 看到绿色成功标志后，在 Pages 设置中打开站点。

仓库工作流已经配置发布 `offline/`，不需要手动指定 `/docs`。GitHub Pages 只有静态网页，跨设备云端历史需要连接自己的外部 API。

## 5. Cloudflare Pages：静态前端 + 可选 KV

1. 将自己的仓库连接到 Cloudflare Pages。
2. 生产分支选 `main`，根目录选 `cloudflare`，框架选 **None**。
3. 构建命令留空，输出目录填 `.`，部署后打开 `pages.dev` 地址。
4. 只使用图表和本地历史，可以到这里结束。
5. 需要云端历史时，创建 KV 命名空间，在 Pages 的生产环境绑定变量名 **`HISTORY_KV`**；添加 Secret **`HISTORY_TOKEN`**（至少 24 位）。
6. 保存绑定后重新部署，再从网页历史数据中连接本站 API。

`_worker.js` 提供历史 API，请随目录一起发布。GitHub Pages 不会执行它。跨域连接还需要配置 [ALLOWED_ORIGINS](CONFIGURATION.md)。

## 6. 更新与备份

VPS 更新前先导出浏览器 JSON 备份，并停止服务备份完整 `server/data/` 与私密 `.env`：

```bash
docker compose stop
cp -a data ../data-backup
docker compose start
```

`../data-backup` 请改为每次不同的备份位置。确认备份完成后，在仓库根目录 `git pull --ff-only`，再到 `server/` 执行 `docker compose up -d --build`。不要删除 `data/`。

Pages 的浏览器历史需自己导出；KV 历史与本地 JSON 是不同存储，不要以为重新部署会自动搬运浏览器数据。

## 🔎 排错

| 现象 | 先检查 |
| --- | --- |
| Docker 启动失败 | `.env` 是否填写合法的 `HISTORY_TOKEN`，查看日志 |
| 历史 API 401 | 网页密钥与服务端是否一致 |
| 历史 API 503 | KV 绑定、Secret、是否重新部署 |
| 跨域保存失败 | 目标 API 的 `ALLOWED_ORIGINS` 是否包含当前网页来源 |
| 导出慢或失败 | 先试 1080p，使用较新的 Chrome / Edge，保持页面开启 |

部署验证：导入示例 → 保存 → 刷新恢复 → 导出 PNG → 导出短 MP4；需要云端历史时，再换浏览器测试载入。
