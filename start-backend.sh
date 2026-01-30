#!/bin/bash

echo "🧹 Cleaning up old processes..."
pkill -f "nodemon server.js" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

echo "🚀 Starting Backend Server..."
cd /Users/sarvadhisolution/diamond-bid/backend
npm run dev

echo "✅ Backend is running on http://localhost:5000"
echo "   Socket.IO is on ws://localhost:5000"
echo ""
echo "📝 In another terminal, run:"
echo "   cd /Users/sarvadhisolution/diamond-bid/frontend && npm run dev"
