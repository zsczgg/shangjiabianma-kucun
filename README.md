# 媛媛和小肥朱｜商品库库存管理

独立的单仓库存管理系统，通过只读 `/api/v1` 对接 [商品编码系统](https://github.com/zsczgg/shangjiabianma)，永久以 `internalCode` 关联 SKU。

## 首版功能

- 商品全量同步（默认每 15 分钟，也可手动立即同步）
- 单仓库存余额与低库存预警
- 扫码入库、出库及三种负库存策略
- 不可修改的库存流水
- 扫码库存盘点与差异调整
- 独立 SQLite 数据库、Docker 部署与定时备份

## 本地运行

```powershell
npm install
Copy-Item .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

访问 `http://127.0.0.1:3220`。在 `.env` 中配置编码系统的 API 地址和独立 API Key 后，点击首页“立即同步”。

## Docker 部署

```bash
docker compose up -d --build
```

应用使用独立端口 `3220`，数据库位于 `./data/inventory.db`，备份每 6 小时写入 `./backups/` 并保留 30 天。应用应仅在内网或 Tailscale 私网开放。

### 服务器部署注意事项

- 编码系统使用 `3210`，库存系统固定使用 `3220`，不要修改为相同端口。
- `.env` 包含上游 API Key，只能保存在服务器，权限建议设为 `600`，禁止提交 Git。
- Prisma 在 Linux 容器中依赖 OpenSSL。默认使用 Debian Node 镜像；不要直接换成未安装 OpenSSL 的 Alpine 镜像。
- 构建阶段需要安装 `devDependencies`，最终运行阶段才使用 `NODE_ENV=production`，否则 TypeScript 路径别名可能无法正确解析。
- 复用已有基础镜像时，必须覆盖其 `ENTRYPOINT`、`PORT` 和 `HOSTNAME`。当前 Dockerfile 已显式清空入口并固定监听 `0.0.0.0:3220`。
- 同步进程启动时可能早于应用就绪；首次连接失败不会退出，15 分钟后会再次执行。部署完成后可在首页点击“立即同步”验证。
- Docker Hub 网络较慢时，可在服务器 `.env` 指定已有的兼容 Node + OpenSSL 镜像，例如 `NODE_BASE_IMAGE=shangjiabianma-app:local`。
- 不要将库存系统与编码系统放在同一个 Compose 项目、数据库目录或数据卷中。

### 正式服务器当前布局

- 项目目录：`/opt/shangjiabianma-kucun`
- 访问地址：`http://服务器IP:3220`
- 应用容器：`shangjiabianma-kucun-app-1`
- 定时同步：`shangjiabianma-kucun-sync-worker-1`
- 数据备份：`shangjiabianma-kucun-backup-1`

### 后续更新

```bash
cd /opt/shangjiabianma-kucun
git pull --ff-only
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app sync-worker
```

更新后应确认三个容器均为 `Up`，再访问 `http://服务器IP:3220`，并检查最近一次同步结果。

### 常见故障

| 现象 | 常见原因 | 处理方式 |
| --- | --- | --- |
| Prisma 提示无法加载 schema engine | 镜像缺少兼容 OpenSSL | 使用默认 Debian 镜像或兼容的本地基础镜像 |
| 构建提示无法解析 `@/lib/*` | 构建时跳过了开发依赖 | 确保依赖阶段不是 `NODE_ENV=production` |
| 容器尝试运行其他项目脚本 | 基础镜像遗留 `ENTRYPOINT` | 保留 Dockerfile 中的 `ENTRYPOINT []` |
| 容器正常但 `3220` 无法访问 | 容器仍监听其他端口 | 检查日志应显示 `0.0.0.0:3220` |
| 同步进程首次出现 `ECONNREFUSED` | 应用容器尚未就绪 | 等待下一周期、重启同步容器或手动同步 |
| 构建长时间无输出 | Docker Hub 或软件源网络慢 | 使用后台构建并检查日志，或配置本地基础镜像 |

## 验证

```powershell
npm test
npm run build
```
