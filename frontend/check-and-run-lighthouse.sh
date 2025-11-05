#!/bin/bash

# Script to check if dev server is running and run Lighthouse

cd "$(dirname "$0")"

echo "🔍 Checking if dev server is running..."

# Check if server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Dev server is running on http://localhost:3000"
    echo ""
else
    echo "❌ Dev server is NOT running!"
    echo ""
    echo "Please start it in another terminal:"
    echo "   cd frontend"
    echo "   npm run dev"
    echo ""
    exit 1
fi

# Create lighthouse directory if it doesn't exist
mkdir -p lighthouse

echo "🚀 Running Lighthouse audits..."
echo ""

# Run Lighthouse for home page
echo "📊 Analyzing home page..."
npx --yes lighthouse http://localhost:3000 \
    --output=html \
    --output-path=./lighthouse/home.html \
    --only-categories=performance,accessibility,best-practices,seo \
    --quiet

echo "✅ Home page report saved: lighthouse/home.html"
echo ""

# Run Lighthouse for products page
echo "📊 Analyzing products page..."
npx --yes lighthouse http://localhost:3000/products \
    --output=html \
    --output-path=./lighthouse/products.html \
    --only-categories=performance,accessibility,best-practices,seo \
    --quiet

echo "✅ Products page report saved: lighthouse/products.html"
echo ""

echo "✨ Lighthouse audit complete!"
echo ""
echo "📊 Reports saved in: frontend/lighthouse/"
echo "   - home.html"
echo "   - products.html"
echo ""
echo "💡 Open the HTML files in your browser to view reports"

