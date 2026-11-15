# 瞎折腾看数据

[VPS 示范站点](https://data.xiazheteng.fun/) · [YouTube @xiazheteng8](https://www.youtube.com/@xiazheteng8) · [Telegram @xiazheteng8](https://t.me/xiazheteng8)

第一次部署？先按 [本地 / VPS 新手教程](../README.md) 或 [GitHub / Cloudflare Pages 新手教程](../README-PAGES.md) 操作。下面是本目录的功能和配置参考。

一个把表格变成动态看板、图表和竞速视频的数据工具。导入数据、匹配国旗或品牌图标、播放竞速、导出视频，并保存和管理自己的历史数据。

**本工具完全开源免费，如果您使用时被要求付款，请立即退款。** 赞赏为自愿支持，不是功能解锁费用。

## 先选部署方式

| 使用方式 | 使用文件 | 历史数据保存位置 | 大屏方式 |
| --- | --- | --- | --- |
| 本机免安装 | `瞎折腾看数据-本地离线版-v3.zip` | 浏览器 IndexedDB；支持 JSON 备份 | 独立窗口 |
| VPS、服务器、NAS | `瞎折腾看数据-VPS版-v3.zip` | 本机副本 + **服务器 SQLite 数据库** | 独立窗口，主页面控制 |
| GitHub Pages | `瞎折腾看数据-Pages版-v3.zip` | 浏览器 IndexedDB；跨设备需连接自己的 SQLite 或 Cloudflare KV 接口 | 当前页面大屏 |
| Cloudflare Pages | 同一个 Pages 包，保留 `_worker.js` | 浏览器 IndexedDB + 可选绑定 Cloudflare KV | 当前页面大屏 |

三个压缩包使用同一份前端。服务器版另外带数据库后端和 Docker 配置；**新版服务器版要保存到服务器数据库，必须启动后端，不能只把文件丢进静态站点目录。** GitHub Pages 本身没有后端或 KV。

## 功能介绍

- 导入 CSV、XLSX、XLS；世界银行原始 CSV、ZIP 可直接识别并选择国家和年份。
- 可填写数据名称，显示在看板、导出图表和视频标题中。
- 允许空表头，自动按数据名称补全；多个系列自动编号。支持无表头数值表。
- 动态竞速、条形图、扇形图、环形图、波浪图、折线图、点状分布。
- 自定义 TOP，控制参与展示的系列数量。
- 一键匹配内置国旗、品牌标志；支持中文、英文、常见缩写。无法识别时保留文字，也可逐项上传 PNG/JPG/WebP。
- 图标位于竞速条末端、具体数值前，跟随条形和排名移动。
- **空白值表示该时间点不参与展示**：退出时碎片化消散；后来加入或重新出现时从底部跳入。`0` 是真实零值，不等于缺失。
- 本机历史自动保存、刷新恢复最近数据、搜索、载入、重命名、删除、JSON 备份导入导出。
- 个人密钥访问自己的服务器或 Cloudflare KV；连接后可开启后续修改自动同步。
- PNG、MP4 和含原生可编辑图表的 Excel 导出。
- MP4 支持 720p、1080p、1440p、2160p，默认 1080p；竖屏自动交换宽高。
- MP4 和竞速大屏均支持排名收尾：独立设置展示 TOP、正序或倒序及庆祝效果，最后停留领奖台。
- 深蓝科技渐变背景、白色高对比文字，年份在右上角。
- 大屏默认每 5 秒刷新；指定其他间隔后沿用。静态数据只刷新展示，实时源才重新读取数据。

## 数据格式与空白规则

```csv
时间,品牌A,品牌B,品牌C
2020,100,80,
2021,120,90,
2022,140,,160
2023,180,,200
2024,210,220,230
```

含义：品牌 C 前两年不参加，之后从底部加入；品牌 B 中途退出，2024 年重新加入。保留空单元格，不要用字符 `null`、`-` 或 `N/A` 代替空白。

- 第一列为时间标签，不能为空或重复；至少两个周期。
- 最多 1000 个周期、30 个数值系列，单份导入文件最多 5 MB。
- 数值为非负数或空白，整份数据至少有一个正数。
- 当前不支持负数竞速；利润等数据有亏损时，不能直接按本工具当前格式导入。
- 时间标签按文件行顺序播放，不会自动排序，请先把年份、月份排好。
- 自动匹配仅采用明确名称，不做模糊猜测。品牌图标为统一浅色版本，未必是完整彩色商标。
- 世界银行缺失年份会保留为空白，不再擅自填零或删除整个年份。

## 目录结构

源代码仓库：

```text
dist/                         前端，HTML/JS/CSS 和随包依赖，无需构建
server/
  server.py                   SQLite API + 网页服务，Python 标准库
  Dockerfile
  compose.yaml
  .env.example
cloudflare/
  history-worker.mjs          Cloudflare KV API，可独立 Worker 部署
README.md
.openai/hosting.json           原 Sites 平台发布配置，其他平台不需要
```

服务器压缩包解压后：

```text
public/                       完整前端文件，含 index.html 和 screen.html
server.py
Dockerfile
compose.yaml
.env.example
.dockerignore
README.md
```

本地与 Pages 压缩包的 `index.html` 直接位于解压根目录。不要混淆服务器包的 `public/` 与静态包根目录。

## 一、本地电脑免安装使用

1. 下载本地离线版 ZIP，**完整解压**到固定目录。
2. 使用 Chrome 或 Edge 打开 `index.html`。
3. 点击“导入数据”，选择文件、填写名称并确认。
4. 点击“图标设置”，一键匹配或手动上传。
5. 导入或修改后自动保存到本机。右上角“历史数据 → 本机数据库”可管理记录。
6. 刷新会恢复最近保存的数据及图标。需要换一份时，在历史记录中点“载入”。

不需要安装 Python、Node.js、数据库或 FFmpeg。视频编码在浏览器完成。

### 本机历史的边界

IndexedDB 属于当前浏览器及访问来源，不是服务器数据库。换浏览器、清除网站数据、无痕模式或更换文件路径时，原记录可能不可见。更新网页文件不会自动把一个来源的数据迁移到另一个来源。

请在“历史数据”中定期点“导出全部备份”。换电脑后点“导入备份”恢复，导入会生成新记录，不覆盖现有记录。JSON 备份包含表格、图标和设置，**不含访问密钥**。

如果本机浏览器限制 `file://` 存储或文件权限，可选用本地 HTTP 服务。已安装 Python 的用户可在解压目录运行：

```bash
python -m http.server 8080 --bind 127.0.0.1
```

然后固定使用 `http://127.0.0.1:8080`。该命令只是提供网页，**不会启动服务器 SQLite API**；本机历史仍保存到浏览器中。不要把端口或主机名来回改，否则会形成不同的浏览器存储来源。

## 二、VPS / Linux 服务器：SQLite + Docker 部署

这是服务器数据库的推荐部署方式。以下以 Linux VPS、端口 `8088` 为例。

### 2.1 准备环境

1. 在服务器安装 Docker Engine 和 Docker Compose 插件，参照 [Docker 官方安装说明](https://docs.docker.com/engine/install/)。
2. 确认下面命令均可执行：

```bash
docker --version
docker compose version
```

服务器不需要另外安装 Python 或数据库。容器镜像内自带 Python，SQLite 使用 Python 标准库。

### 2.2 上传并解压

把 **VPS 版 ZIP** 上传并解压到固定目录，例如 `/opt/xiazheteng-data`。进入目录后应能直接看到 `compose.yaml`、`server.py`、`Dockerfile` 和 `public/`。

```bash
cd /opt/xiazheteng-data
cp .env.example .env
```

编辑 `.env`：

```dotenv
HISTORY_TOKEN=替换成你自己生成的至少24位随机密钥
ALLOWED_ORIGINS=
```

上面是说明占位符，**不要把这句话当作真实密钥**。建议使用密码管理器生成 32 位以上随机字符串，不要使用群晖密码或 Cloudflare 账户 Token。不要上传 `.env` 到 GitHub。

`ALLOWED_ORIGINS` 同站访问可留空。只有其他网站调用这台服务器时才填写，例如：

```dotenv
ALLOWED_ORIGINS=https://yourname.github.io,https://data.example.com
```

这里写网页的**源**（协议 + 域名 + 端口），不含路径。GitHub 项目地址即使是 `/repo/`，这里也只写 `https://yourname.github.io`。

如果是克隆源码仓库而不是解压 VPS 包，请先在仓库根目录准备服务器网页目录：

```bash
mkdir -p server/public
cp -a dist/. server/public/
cd server
cp .env.example .env
```

随后按上面的说明填写 `.env`，再启动。

### 2.3 启动

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=50 dashboard
```

首次构建需要联网拉取基础镜像。确认容器正常后，访问：

```text
http://服务器IP:8088
```

端口 `8088` 由 `compose.yaml` 的 `8088:8080` 控制。被占用时只改冒号左边，例如 `8090:8080`。

### 2.4 连接服务器数据库

1. 打开网页，点“历史数据 → 云端 / 服务器”。
2. 接口地址填写 `https://你的域名/api/history`；局域网测试可用 `http://服务器IP:8088/api/history`。
3. 输入 `.env` 中的 `HISTORY_TOKEN`。
4. 点击“连接 / 刷新列表”。
5. 首次把现有数据存到服务器时，点“上传当前数据”。
6. 保持“连接成功后，自动同步后续修改”勾选，后续导入和修改会延迟约两秒合并写入服务器。
7. 到其他电脑或手机，连接同一接口、输入同一密钥，再从远端列表点“载入”。

本机保存与服务器保存是两个动作。只有提示远端保存成功，才代表已写入 SQLite。密钥只保存于当前浏览器会话；重新打开浏览器后可能需要重新填写。

### 2.5 域名、HTTPS 与面板反向代理

如使用宝塔、1Panel 或其他面板：

1. 启动上面的容器。
2. 新建网站并绑定自己的域名。
3. 申请有效 HTTPS 证书。
4. 设置**整站反向代理**到 `http://127.0.0.1:8088`，保留原始 Host。
5. 确认 `index.html`、`screen.html` 和 `/api/history` 都经过同一个代理入口。

不要仅把 `public/` 上传成纯静态站点后期待数据库生效，也不要把 `/api/history` 误设为返回 `index.html` 的伪静态规则。

已有 Nginx 的站点可参考以下 `server` 内配置；证书请沿用面板或现有 HTTPS 配置：

```nginx
client_max_body_size 8m;
location / {
    proxy_pass http://127.0.0.1:8088;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

反向代理上传限制需要大于单份历史记录的 6 MB 上限，否则带图标的记录可能收到 `413`。

### 2.6 数据真正保存在哪里

数据库在部署目录下的 `data/history.sqlite3`，该目录挂载到容器 `/data`。SQLite 运行时还可能出现 `history.sqlite3-wal` 和 `history.sqlite3-shm`，不要随意删除。

重启容器不会清空这个挂载目录。更换服务器时需迁移 `data/` 和自己的 `.env`，不能只复制网页文件。

### 2.7 备份与更新

最简单的备份是网页中“导出全部备份”。若要备份服务器数据库，可先短暂停止服务，再完整复制 `data/`：

```bash
docker compose stop
cp -a data "data-backup-$(date +%Y%m%d-%H%M%S)"
docker compose start
```

备份 `.env` 时放在自己的安全位置。更新前先备份数据库；用新版 `public/`、`server.py`、Docker 配置替换旧代码，**保留原来的 `data/` 与 `.env`**，再执行：

```bash
docker compose up -d --build
```

### 2.8 不用 Docker 的方式

若服务器已经有 Python 3.10+，可在解压目录运行：

```bash
export HISTORY_TOKEN='换成自己的随机密钥，至少24位'
export PORT=8088
python3 server.py
```

默认网页目录为 `public/`，数据库为 `data/history.sqlite3`。长期部署请通过系统服务或面板进程守护启动，而不是依赖一个随时关闭的终端。

## 三、群晖 NAS：Container Manager 部署

新版服务器数据库需要运行后端，因此推荐 Container Manager；只使用 Web Station 静态托管无法写 SQLite。

1. 在群晖“套件中心”安装 **Container Manager**。旧系统可能叫 Docker；型号需支持容器。
2. 在 File Station 中建立 `/docker/xiazheteng-data`。
3. 将 VPS 版解压到该目录，确保这里直接有 `compose.yaml`、`Dockerfile`、`server.py`、`public/`。
4. 将 `.env.example` 复制为 `.env`，填入自己的 `HISTORY_TOKEN`。隐藏文件不可见时启用显示隐藏文件。
5. 在 Container Manager 的“项目”中创建项目，项目路径选择上述目录，使用现有 `compose.yaml`。
6. 构建并启动，检查日志没有密钥、权限、端口错误。
7. 局域网访问 `http://群晖IP:8088`。
8. 在网页“历史数据 → 云端 / 服务器”输入这个地址后的 `/api/history`，以及自己的密钥，连接并上传当前数据。

数据库位于 `/docker/xiazheteng-data/data/history.sqlite3`。请给 Container Manager 对这个目录的读写权限，备份整个 `data/`。

若使用群晖反向代理：在 DSM 登录门户的高级设置中创建反向代理，来源使用自己的 HTTPS 域名，目标指向 `http://127.0.0.1:8088`。名称可能因 DSM 版本略有不同。对应的证书在 DSM 证书管理中绑定。

局域网使用无需把端口暴露到公网。外网访问时建议用自己的 HTTPS 域名或已有可信组网入口。

## 四、GitHub Pages：静态前端部署

GitHub Pages 只提供静态网页，**没有 KV，也不能运行 Python/SQLite 后端**。可以使用本机历史，或连接前面部署的服务器、下面的 Cloudflare KV API。

### 4.1 上传网页

1. 在 GitHub 创建仓库，例如 `xiazheteng-data`。
2. 解压 **Pages 版**，将里面的全部内容上传到仓库根目录。
3. 根目录必须直接有 `index.html`，不要再套一层 ZIP 名称目录。
4. 保留 `.nojekyll`。没有构建步骤，不需要 npm install。
5. 进入仓库 **Settings → Pages**。
6. 在 **Build and deployment** 里选择 **Deploy from a branch**。
7. 选择上传文件的分支，例如 `main`，目录选择 `/ (root)`，保存。
8. 等发布完成，打开 GitHub 提供的网址。

Pages 包中的 `_worker.js` 不会在 GitHub 上作为后端运行。它只供 Cloudflare Pages 使用，文件中没有真实访问密钥。

### 4.2 开启跨设备历史

选择其一：

- 自己的服务器：部署 SQLite 服务，在服务器 `ALLOWED_ORIGINS` 填 `https://你的用户名.github.io`，重启服务。
- 自己的 Cloudflare Worker：按下一节部署 KV 后端，并允许同一 GitHub Origin。

随后在 GitHub 网站的“历史数据 → 云端 / 服务器”中填接口完整地址和个人密钥。HTTPS 的 GitHub 网页必须连接 HTTPS 后端，不能连接 HTTP 的 NAS 地址，否则浏览器会拦截混合内容。

## 五、Cloudflare Pages：前端 + KV 历史

本节使用 Cloudflare KV 保存历史快照，不是 SQLite。它适合个人跨设备记录，跨地区写入可见性可能延迟约一分钟。

### 5.1 创建 KV 命名空间

1. 进入自己的 Cloudflare 控制台，在存储相关菜单找到 **Workers KV**。
2. 新建命名空间，例如 `xiazheteng-history`。
3. 暂时不用手动添加任何键值，程序会自行写入。

### 5.2 发布 Pages 网站

1. 解压 **Pages 版**。
2. 确认根目录有 `index.html`、`_worker.js` 和 `_routes.json`。
3. 在 Cloudflare 的 **Workers & Pages** 中创建 Pages 项目，选择直接上传。
4. 上传这些网页文件并发布；若界面接受 ZIP，也可上传对应压缩包。
5. `_worker.js` 为 Pages Advanced Mode 后端；不要改成普通静态文件，也不要遗漏 `_routes.json`。

此项目不需要前端构建命令。Cloudflare 官方说明 `_worker.js` 支持控制台直接上传，普通 `functions/` 文件夹的直接上传行为不同。

### 5.3 绑定 KV 和访问密钥

在该 Pages 项目的生产环境设置中：

1. 添加 **KV namespace binding**。
2. 变量名必须为 **`HISTORY_KV`**，选择刚创建的命名空间。
3. 添加加密环境变量/Secret **`HISTORY_TOKEN`**，设置自己的随机密钥，至少 24 位。
4. 本站访问可不配置 `ALLOWED_ORIGINS`。如果还要让 GitHub Pages 或其他域名调用，填写允许的网页 Origin，多个用英文逗号分开。
5. **修改绑定或变量后重新部署一次。**

不要把真正的 Token 写进 `_worker.js`、README、GitHub 仓库或前端代码。

### 5.4 在网页连接

1. 打开 Pages 网站。
2. 点“历史数据 → 云端 / 服务器”。
3. 接口为 `https://你的项目.pages.dev/api/history`；自定义域名也可。
4. 输入前面设置的 `HISTORY_TOKEN`，点击连接。
5. 点击“上传当前数据”，或保持自动同步勾选后修改数据。

如果返回 `503`，优先检查 KV 绑定名、密钥长度，以及修改后有没有重新部署。

### 5.5 仅部署 Worker，让 GitHub/本地连接

若不想用 Cloudflare 托管网页，只需要一个云端数据库接口：

1. 创建一个普通 Worker。
2. 将源码 `cloudflare/history-worker.mjs` 的完整内容复制到 Worker 编辑器并部署。Pages 包中 `_worker.js` 与它是同一个接口实现。
3. 给 Worker 绑定 `HISTORY_KV` 命名空间，设置 `HISTORY_TOKEN` Secret。
4. 设置 `ALLOWED_ORIGINS`，例如 `https://你的用户名.github.io`。若要允许本机 HTTP 站点，再加入实际本机 Origin。
5. 重新部署。
6. 前端填写 `https://你的worker.workers.dev/api/history` 和自己的密钥。

直接从 `file://` 本地文件调用时，浏览器 Origin 通常为 `null`；如确实要这样使用，可明确把 `null` 加到允许列表。也可以改用固定的本机 HTTP 地址，避免文件来源差异。

## 六、历史管理与同步行为

### 本机

- 数据或图标变化后自动写入 IndexedDB。
- 重新导入一份数据会建立新历史记录；实时源更新当前记录，不会每次轮询都堆一份快照。
- 刷新恢复最近载入的数据；不会自动恢复文件访问授权、实时源登录状态或播放进度。
- “本机数据库”与“云端 / 服务器”是两个列表，不要把本机成功误认为服务器成功。

### 远端

- 首次连接后可手动上传当前数据。
- 开启自动同步后，后续修改会合并延迟写入，减少重复请求。
- 单份远端记录最多 6 MB，包含图标。
- 新设备需要输入自己的密钥并载入远端记录。网页没有多人账号系统，共用密钥即共用这一套数据。
- 密钥只保留在当前浏览器会话。清除连接密钥不会删除服务器记录。
- 远端删除不会自动删除各设备已经保存的本机副本；本机删除也不会自动删除远端。
- 同一记录同时在两台设备修改时，后写入的版本覆盖先写入的版本；当前没有协同编辑或冲突合并。
- KV 有跨地区传播延迟，不作为高频交易或逐秒实时数据库。实时图表仍通过原有数据源轮询更新。

### 备份

“导出全部备份”导出本机库。如果要把某条远端数据带走，先在远端列表点该记录的“导出备份”，或先载入本机。备份导入只导入本机，不会自动批量上传全部记录。

## 七、视频与大屏说明

### 视频分辨率

在“视频工作室”的主生成按钮上方，有高亮的“MP4 分辨率”下拉框，默认 1080p。主按钮为“生成 MP4 视频”；图表展示页顶部也有独立的 MP4 清晰度选择，两处保持同步。已移除 WebM 导出入口。


| 选项 | 横屏 | 竖屏 |
| --- | --- | --- |
| 720p | 1280×720 | 720×1280 |
| 1080p（默认） | 1920×1080 | 1080×1920 |
| 1440p / 2K | 2560×1440 | 1440×2560 |
| 2160p / 4K | 3840×2160 | 2160×3840 |

原生编码优先使用浏览器编码器，失败或超时后转软件兼容编码。兼容编码不再强制降到 720p，会按所选尺寸生成；高分辨率是否成功取决于设备内存和编码支持。4K 很耗时，失败后可主动选择 1080p 重试。视频编码仍在访问者设备上运行，服务器只保存历史和提供网页，不在服务器端转码。

主动画时长为所选的 12/20/30 秒；MP4 收尾额外增加约 `收尾 TOP × 2.6 + 5` 秒（并列可能增加人数）。收尾按**最后一个周期仍有数据**的系列最终数值排序，不是历史峰值排名。最后周期没有参与数据时不追加排名卡片。

PNG 和 Excel 不添加逐名收尾；竞速大屏也会展示庆祝动画及最终领奖台。

### 大屏

- 本地和服务器包：打开独立窗口，主页面“大屏控制”可切换模式、刷新、播放、关闭。
- Pages 包：当前页面展示，可切换全部图表、竞速总览和单图，退出后返回原网页。
- 独立窗口需要浏览器允许弹窗；`screen.html` 必须能在同站点直接打开。
- `screen-config.js` 可设置 `window`（独立窗口）、`inline`（当前页面）或 `auto`。
- 大屏默认每 5 秒刷新。没有实时源时刷新只重绘当前快照，不会凭空得到新数据。

## 八、常见问题

### 为什么刷新后仍是演示数据？

检查是否换了浏览器、域名、端口、文件路径或无痕模式；这些可能对应不同本机数据库。查看“历史数据”是否提示存储失败。若要跨设备，从云端/服务器连接并载入。

### 为什么新电脑看不到服务器记录？

新设备默认只显示自己的本机库。切到“云端 / 服务器”，填写同一个 API 地址和密钥，连接列表后载入。

### 云端返回 401 / 403 / 503？

- `401`：密钥不一致。
- `403`：网页 Origin 没有被允许，检查 `ALLOWED_ORIGINS`，不要填网页完整路径。
- `503`：Cloudflare 绑定缺失或未设置至少 24 位密钥。
- `404` 或接口返回 HTML：访问了纯静态站点而不是数据库 API，或反向代理路径错了。
- `413`：记录过大，或反向代理的请求体限制太小。

### SQLite 目录权限错误？

确认容器对宿主机 `data/` 有读写权限、磁盘未满。不要把数据库放进公开的 `public/`；后端会拒绝这种配置。

### 数据为什么突然消失？

检查对应时间单元格是不是空白。空白代表该时刻不参与，真实零请填 `0`。如果只是因为 TOP 排名之外，也不会显示在当前竞速列表中。

### 能否支持盈利负数？

当前不能，非负数限制仍保留。不要把亏损直接改成 0 来假装数据正确，需先选择适合该数据的处理方法或另行增加负数图表支持。

### 本工具是不是带登录权限的企业系统？

不是。当前为个人密钥模式，保护历史 API；网页界面可公开打开。访问密钥等同于历史数据访问权，请妥善保管。

## 九、开发与再分发

- 前端为普通 HTML/CSS/JavaScript，依赖随包提供，无需 npm 构建。
- Python 服务只依赖标准库。
- Cloudflare Worker 为单个 JavaScript 模块，无 npm 依赖。
- 保留 SheetJS、fflate、Mediabunny、H.264 编码器、flag-icons、Simple Icons、world-countries 的许可证和来源文件。
- 品牌图标仍属于对应权利人的商标；图标库许可不代表获得商标背书。
- 不要提交真实 `.env`、SQLite 数据库、个人 JSON 备份、访问密钥或真实用户数据。
- `.openai/hosting.json` 只用于原 Sites 托管，与自己的 VPS、GitHub 或 Cloudflare 配置无关。

## 官方参考

- [GitHub Pages 是静态托管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Cloudflare Pages Advanced Mode](https://developers.cloudflare.com/pages/functions/advanced-mode/)
- [Cloudflare Pages 绑定 KV](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages 直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare KV 写入与一致性](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)
- [Docker Compose](https://docs.docker.com/compose/gettingstarted/)
- [Python SQLite](https://docs.python.org/3/library/sqlite3.html)


### 赞赏收款码与开源说明

收款码已嵌入赞赏组件，不再以 assets 下的独立图片发布。赞赏弹窗提供作者 GitHub 主页核验入口。嵌入只是减少直接替换图片的情况，不是加密或防篡改：开源代码、页面截图和历史提交仍可被读取、复制或修改。请从作者官方发布渠道获取版本，自愿赞赏前核对收款人。

### 我的 LOGO

通过“已保存分类 / 上传新 LOGO”管理本地图标。点击上传分类文件夹或拖入文件夹，以所在文件夹名称分类；支持 PNG、JPG/JPEG、WebP、GIF、BMP、AVIF、SVG、ICO，可在分类文件夹内混放；非图片文件需先清理。GIF 使用首帧，SVG 不执行脚本、不加载外部资源，单张上限 5 MB。手动上传图片统一宽度 256 像素，高度按比例保留，长方形不会强制变成正方形。自动匹配优先使用本地图标文件名；内置品牌和国旗不套用手动上传规则。联网启动时后台静默更新匹配元数据，离线使用缓存和内置资源。

领奖台名称、LOGO 和数值已放大并移至奖杯上方。同分按竞赛排名处理；金牌或银牌并列时铜牌留空，第三名并列则共同展示。
