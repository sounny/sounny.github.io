#!/bin/bash
npm start &
SERVER_PID=$!
sleep 3
npx pa11y http://localhost:3000
kill $SERVER_PID
