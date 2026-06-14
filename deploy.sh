#!/bin/bash
set -e

echo "🚀 Ocean11 Deployment Script"
echo "=============================="

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "Step 1: Deploy backend to Railway"
echo "----------------------------------"
cd backend
railway login
railway init --name ocean11-backend
railway up --detach
echo "✅ Backend deployed. Getting URL..."
RAILWAY_URL=$(railway status --json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('url',''))" 2>/dev/null || echo "")
echo "Railway URL: $RAILWAY_URL"
cd ..

echo ""
echo "Step 2: Set Railway environment variables"
echo "------------------------------------------"
echo "Run these commands manually in Railway dashboard or CLI:"
echo "  railway variables set GEMINI_API_KEY=your_key_here"
echo "  railway variables set AISSTREAM_API_KEY=your_key_here"
echo "  railway variables set FRONTEND_URL=https://ocean11.vercel.app"

echo ""
echo "Step 3: Update frontend env with Railway URL"
echo "---------------------------------------------"
if [ -n "$RAILWAY_URL" ]; then
    sed -i "s|REPLACE_WITH_RAILWAY_URL|https://$RAILWAY_URL|g" frontend/.env.production
    sed -i "s|REPLACE_WITH_RAILWAY_WS_URL|wss://$RAILWAY_URL|g" frontend/.env.production
    echo "✅ frontend/.env.production updated with Railway URL"
else
    echo "⚠️  Could not auto-detect Railway URL."
    echo "    Manually update frontend/.env.production with your Railway URL"
    echo "    Then re-run: cd frontend && vercel --prod"
fi

echo ""
echo "Step 4: Deploy frontend to Vercel"
echo "----------------------------------"
cd frontend
vercel --prod
cd ..

echo ""
echo "✅ Deployment complete!"
echo "   Test your deployment:"
echo "   1. Open your Vercel URL"
echo "   2. Check the map loads with vessels"
echo "   3. Click a simulated vessel and hit INVESTIGATE"
echo "   4. Watch all 5 agents fire in the timeline"
