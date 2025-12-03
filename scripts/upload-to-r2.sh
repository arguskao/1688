#!/bin/bash

# Upload images to Cloudflare R2 using wrangler
# Usage: ./scripts/upload-to-r2.sh <image-path> <product-id>
# Example: ./scripts/upload-to-r2.sh ./images/bottle.jpg prod-001

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <image-path> <product-id>"
    echo "Example: $0 ./images/bottle.jpg prod-001"
    exit 1
fi

IMAGE_PATH=$1
PRODUCT_ID=$2
BUCKET_NAME="product-images"

# Get file extension
EXT="${IMAGE_PATH##*.}"

# Generate object key following naming convention: products/{product_id}.{ext}
OBJECT_KEY="products/${PRODUCT_ID}.${EXT}"

echo "Uploading ${IMAGE_PATH} to R2 bucket '${BUCKET_NAME}' as '${OBJECT_KEY}'..."

# Upload using wrangler
pnpm wrangler r2 object put "${BUCKET_NAME}/${OBJECT_KEY}" --file="${IMAGE_PATH}"

if [ $? -eq 0 ]; then
    echo "✓ Upload successful!"
    echo ""
    echo "Object key: ${OBJECT_KEY}"
    echo ""
    echo "Next steps:"
    echo "1. Configure R2 public access or custom domain"
    echo "2. Update products.json with the R2 URL:"
    echo "   \"image_url\": \"https://your-r2-domain.com/${OBJECT_KEY}\""
else
    echo "✗ Upload failed"
    exit 1
fi
