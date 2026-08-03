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

## 验证

```powershell
npm test
npm run build
```
