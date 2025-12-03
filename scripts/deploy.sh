#!/bin/bash

# =============================================================================
# 詢價清單系統 - 部署腳本
# =============================================================================
# 這個腳本會引導你完成部署流程
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}詢價清單系統 - 部署腳本${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""

# Step 1: Check if wrangler is installed
echo -e "${YELLOW}步驟 1: 檢查 Wrangler CLI...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}✗ Wrangler 未安裝${NC}"
    echo ""
    echo "請先安裝 Wrangler:"
    echo "  pnpm install -g wrangler"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Wrangler 已安裝${NC}"
echo ""

# Step 2: Check if logged in
echo -e "${YELLOW}步驟 2: 檢查 Cloudflare 登入狀態...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ 尚未登入 Cloudflare${NC}"
    echo ""
    echo "請執行以下命令登入:"
    echo "  wrangler login"
    echo ""
    read -p "按 Enter 繼續登入..." 
    wrangler login
fi
echo -e "${GREEN}✓ 已登入 Cloudflare${NC}"
echo ""

# Step 3: Check environment variables
echo -e "${YELLOW}步驟 3: 檢查環境變數...${NC}"
echo ""
echo "請確認你已經準備好以下資訊:"
echo ""
echo "1. ${BLUE}DATABASE_URL${NC} - Neon 資料庫連接字串"
echo "   範例: postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname"
echo ""
echo "2. ${BLUE}EMAIL_API_KEY${NC} - 郵件服務 API 金鑰"
echo "   Resend: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "   SendGrid: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""
echo "3. ${BLUE}BUSINESS_EMAIL${NC} - 接收詢價通知的郵箱"
echo "   範例: business@example.com"
echo ""
read -p "是否已準備好這些資訊？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}請先準備好環境變數，然後重新執行此腳本${NC}"
    echo ""
    echo "參考文檔:"
    echo "  - docs/ENVIRONMENT_VARIABLES_GUIDE.md"
    echo "  - docs/NEON_SETUP.md"
    echo "  - docs/EMAIL_SERVICE_GUIDE.md"
    echo ""
    exit 1
fi
echo ""

# Step 4: Create R2 bucket
echo -e "${YELLOW}步驟 4: 創建 R2 Bucket...${NC}"
if wrangler r2 bucket list | grep -q "product-images"; then
    echo -e "${GREEN}✓ R2 bucket 'product-images' 已存在${NC}"
else
    echo "創建 R2 bucket..."
    wrangler r2 bucket create product-images
    echo -e "${GREEN}✓ R2 bucket 已創建${NC}"
fi
echo ""

# Step 5: Run database migration
echo -e "${YELLOW}步驟 5: 資料庫遷移...${NC}"
echo ""
read -p "是否要執行資料庫遷移？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "$DATABASE_URL" ]; then
        echo ""
        echo -e "${YELLOW}請輸入 DATABASE_URL:${NC}"
        read -r DATABASE_URL
        export DATABASE_URL
    fi
    
    echo "執行遷移..."
    ./scripts/migrate-database.sh production
    echo -e "${GREEN}✓ 資料庫遷移完成${NC}"
else
    echo -e "${YELLOW}⚠ 跳過資料庫遷移${NC}"
    echo "稍後可以手動執行: ./scripts/migrate-database.sh production"
fi
echo ""

# Step 6: Set secrets
echo -e "${YELLOW}步驟 6: 設置 Cloudflare Secrets...${NC}"
echo ""
echo "現在需要設置三個 secrets..."
echo ""

read -p "設置 DATABASE_URL？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler pages secret put DATABASE_URL
fi

read -p "設置 EMAIL_API_KEY？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler pages secret put EMAIL_API_KEY
fi

read -p "設置 BUSINESS_EMAIL？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler pages secret put BUSINESS_EMAIL
fi

echo ""
echo -e "${GREEN}✓ Secrets 設置完成${NC}"
echo ""

# Step 7: Build
echo -e "${YELLOW}步驟 7: 構建專案...${NC}"
pnpm run build
echo -e "${GREEN}✓ 構建完成${NC}"
echo ""

# Step 8: Deploy
echo -e "${YELLOW}步驟 8: 部署到 Cloudflare Pages...${NC}"
echo ""
read -p "確認部署？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm wrangler pages deploy dist
    echo ""
    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo ""
    echo "下一步:"
    echo "1. 訪問你的網站 URL"
    echo "2. 測試所有功能"
    echo "3. 上傳產品圖片到 R2"
    echo "4. 設置自訂域名（可選）"
    echo ""
else
    echo ""
    echo -e "${YELLOW}部署已取消${NC}"
    echo ""
    echo "稍後可以手動部署:"
    echo "  pnpm wrangler pages deploy dist"
    echo ""
fi
