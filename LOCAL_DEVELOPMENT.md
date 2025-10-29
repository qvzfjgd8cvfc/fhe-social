# 本地开发指南

当 FHE 中继器宕机时，可以使用本地 Hardhat 节点进行开发和测试。

## 快速开始

### 1. 启动 Hardhat 本地节点

```bash
cd contracts
npx hardhat node
```

保持此终端运行。你会看到测试账户列表和私钥。

### 2. 部署合约到本地网络

在新终端中：

```bash
cd contracts
npx hardhat run scripts/deploy-local.js --network localhost
```

部署完成后，合约地址会保存到 `contracts/deployments/localhost.json`

### 3. 配置前端

复制本地配置：

```bash
cd frontend
cp .env.local.example .env.local
```

然后编辑 `.env.local`，填入部署脚本输出的合约地址。

或者使用脚本自动生成（推荐）：

```bash
node scripts/update-local-env.js
```

### 4. 启动前端

```bash
cd frontend
yarn dev
```

访问 http://localhost:5173

### 5. 配置 MetaMask

1. 添加本地网络：
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. 导入测试账户：
   - 从 `npx hardhat node` 输出复制私钥
   - 在 MetaMask 中导入账户

## 本地模式 vs Sepolia 模式

### 本地模式
- ✅ 无需 FHE 中继器
- ✅ 快速测试
- ✅ 免费 gas
- ❌ 无真实 FHE 加密（使用 mock）

### Sepolia 模式
- ✅ 真实 FHE 加密
- ✅ 接近生产环境
- ❌ 需要中继器在线
- ❌ 需要测试 ETH

## 切换回 Sepolia

当中继器恢复后：

```bash
cd frontend
# 使用原来的 .env 文件
cp .env .env.local
yarn dev
```

## 注意事项

1. **本地节点数据不持久**：重启 `npx hardhat node` 会清除所有数据
2. **需要重新部署**：每次重启本地节点后需要重新部署合约
3. **FHE 功能限制**：本地模式下 FHE 加密是模拟的，不是真实加密

## 故障排查

### 问题：前端连接失败
- 确认 Hardhat 节点正在运行
- 检查 RPC URL 是否正确 (http://127.0.0.1:8545)
- 确认 Chain ID 为 31337

### 问题：交易失败
- 检查 MetaMask 是否连接到正确网络
- 确认账户有足够 ETH（本地节点提供测试 ETH）
- 查看 Hardhat 节点终端的错误信息

### 问题：投票失败
- 本地模式下，FHE 加密会被模拟
- 检查是否已注册用户
- 确认频道存在且投票活跃

## 开发工作流

推荐的开发流程：

1. **本地开发**：使用 Hardhat 本地节点快速迭代
2. **本地测试**：完成功能后在本地全面测试
3. **Sepolia 测试**：中继器恢复后部署到 Sepolia
4. **生产部署**：通过所有测试后部署到主网

## 相关文件

- `contracts/scripts/deploy-local.js` - 本地部署脚本
- `contracts/deployments/localhost.json` - 本地部署信息
- `frontend/.env.local` - 本地前端配置
- `frontend/scripts/update-local-env.js` - 自动更新配置脚本
