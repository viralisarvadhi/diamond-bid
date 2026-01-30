#!/bin/bash

echo "🧹 Cleaning up old processes..."
pkill -f "vite" 2>/dev/null || true
sleep 2

echo "🚀 Starting Frontend Server..."
cd /Users/sarvadhisolution/diamond-bid/frontend
npm run dev

echo "✅ Frontend is running on http://localhost:5173"
echo ""
echo "📝 Make sure backend is also running:"
echo "   cd /Users/sarvadhisolution/diamond-bid/backend && npm run dev"
