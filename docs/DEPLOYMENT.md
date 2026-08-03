# 部署与维护记录

本文记录库存系统在正式服务器上的部署约束，避免后续升级重复踩坑。

## 边界

库存系统与商品编码系统必须保持独立：独立 Git 仓库、Compose 项目、端口、SQLite 文件、数据卷和备份目录。库存系统只通过 `/api/v1` 和独立 API Key 读取商品资料，以 `internalCode` 作为永久 SKU 标识。

## 已验证配置

- 服务器：`47.105.76.89`
- 库存系统端口：`3220`
- 编码系统端口：`3210`
- 项目目录：`/opt/shangjiabianma-kucun`
- 自动同步周期：15 分钟
- 正式部署方式：Docker Compose

API Key 不记录在本文、README、Git 历史、镜像或部署日志中，只存于服务器 `.env`。

## 验收清单

1. `docker compose ps` 中 app、sync-worker、backup 均为 `Up`。
2. 应用日志显示 Next.js 监听 `0.0.0.0:3220`。
3. `http://服务器IP:3220` 返回 HTTP 200。
4. 手动同步成功，读取数量与上游 SKU 数量一致。
5. 定时同步日志出现 `status: SUCCESS`。
6. `data/inventory.db` 存在，且未提交 Git。
7. `backups/` 能生成独立备份文件。
8. 原编码系统的 `3210` 容器与数据未被修改。

## 回滚原则

应用镜像和代码可以回滚，库存数据库不能直接覆盖。更新前应先保留 SQLite 一致性备份；回滚代码后继续挂载原 `data/` 卷。任何涉及 Prisma schema 的回滚都应先在数据库副本上验证。
