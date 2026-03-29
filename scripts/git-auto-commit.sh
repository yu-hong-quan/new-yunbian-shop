#!/bin/bash

# 云边小铺 - 自动 Git 提交脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 默认提交消息
DEFAULT_MSG="更新 $(date '+%Y-%m-%d %H:%M')"

# 解析参数
COMMIT_MSG="${1:-$DEFAULT_MSG}"
BRANCH="${2:-main}"

echo -e "${GREEN}======================================"
echo -e "    云边小铺 - Git 自动提交脚本"
echo -e "======================================${NC}"
echo ""

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo -e "${RED}错误: Git 未安装${NC}"
    exit 1
fi

# 检查是否为 git 仓库
if [ ! -d ".git" ]; then
    echo -e "${RED}错误: 当前目录不是 Git 仓库${NC}"
    exit 1
fi

# 显示当前状态
echo -e "${YELLOW}📊 当前状态:${NC}"
git status --short
echo ""

# 检查是否有更改
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  没有检测到更改，无需提交${NC}"
    exit 0
fi

# 添加所有更改
echo -e "${GREEN}📦 添加更改...${NC}"
git add -A

# 显示暂存的文件
echo ""
echo -e "${YELLOW}📁 暂存的文件:${NC}"
git diff --cached --name-only | while read file; do
    echo "   • $file"
done
echo ""

# 提交
echo -e "${GREEN}✓ 提交更改...${NC}"
git commit -m "$COMMIT_MSG"

# 显示提交结果
echo ""
echo -e "${GREEN}✅ 提交成功!${NC}"
echo -e "${YELLOW}📋 最近提交:${NC}"
git log -1 --oneline

echo ""
read -p "是否推送到远程仓库? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 推送到 $BRANCH...${NC}"
    git push origin $BRANCH
    echo -e "${GREEN}✅ 推送成功!${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
