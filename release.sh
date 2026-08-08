#!/usr/bin/env bash
# 发布脚本：更新版本号、类型检查、提交、打 tag、push
# 用法：
#   ./scripts/release.sh 0.3.6          # 发布指定版本
#   ./scripts/release.sh patch          # 0.3.5 -> 0.3.6
#   ./scripts/release.sh minor          # 0.3.5 -> 0.4.0
#   ./scripts/release.sh major          # 0.3.5 -> 1.0.0

set -euo pipefail

cd "$(dirname "$0")/.."

# ─── 颜色 ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}✔${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✘${NC} $1"; }

# ─── 前置检查 ───
if [[ -n $(git status --porcelain --untracked=no) ]]; then
    error "工作区有未提交的改动，请先提交或 stash"
    git status --short
    exit 1
fi

if [[ ! -f key.pem ]]; then
    warn "未找到 key.pem（商店版本可忽略此警告）"
fi

# ─── 解析参数 ───
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEW_VERSION="${1:-}"

if [[ -z "$NEW_VERSION" ]]; then
    echo "当前版本：$CURRENT_VERSION"
    echo "用法：$0 <version>（如 0.3.6）"
    exit 0
fi

# 计算新版本号
if [[ "$NEW_VERSION" == "patch" || "$NEW_VERSION" == "minor" || "$NEW_VERSION" == "major" ]]; then
    NEW_VERSION=$(node -e "
        const semver = require('./package.json').version;
        let [ma, mi, pa] = semver.split('.').map(Number);
        const t = '$NEW_VERSION';
        if (t === 'major') { ma++; mi = 0; pa = 0; }
        else if (t === 'minor') { mi++; pa = 0; }
        else { pa++; }
        console.log(ma + '.' + mi + '.' + pa);
    ")
elif ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error "版本号格式错误，应为 x.y.z，如 0.3.6"
    exit 1
fi

if [[ "$NEW_VERSION" == "$CURRENT_VERSION" ]]; then
    error "新版本号与当前版本号相同：$CURRENT_VERSION"
    exit 1
fi

# 检查 tag 是否已存在
if git rev-parse -q --verify "refs/tags/v$NEW_VERSION" >/dev/null; then
    error "tag v$NEW_VERSION 已存在"
    exit 1
fi

echo "────────────────────────────────"
info "当前版本：$CURRENT_VERSION"
info "发布版本：$NEW_VERSION"
echo "────────────────────────────────"

# ─── 更新版本号 ───
# 1. package.json
node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
info "已更新 package.json"

# 2. wxt.config.ts
node -e "
    const fs = require('fs');
    let cfg = fs.readFileSync('wxt.config.ts', 'utf8');
    cfg = cfg.replace(/version:\s*'[^']*'/, \"version: '$NEW_VERSION'\");
    fs.writeFileSync('wxt.config.ts', cfg);
"
info "已更新 wxt.config.ts"

# ─── 类型检查 ───
info "运行类型检查..."
npm run compile
info "类型检查通过"

# ─── 提交并打 tag ───
git add package.json wxt.config.ts
git commit -m "release: v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
info "已提交并打 tag：v$NEW_VERSION"

# ─── push ───
info "推送代码和 tag..."
git push origin master
git push origin "v$NEW_VERSION"
info "推送完成"

echo ""
echo "────────────────────────────────"
info "发布完成！v$NEW_VERSION"
echo "────────────────────────────────"
