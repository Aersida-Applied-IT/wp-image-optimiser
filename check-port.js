#!/usr/bin/env node

import { createServer } from 'net'

/** This should be the same as the port defined in vite.config.ts */
const PORT = 9081

function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer()
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true) // Port is available
      })
      server.close()
    })
    
    server.on('error', () => {
      resolve(false) // Port is not available
    })
  })
}

async function main() {
  console.log(`🔍 Checking if port ${PORT} is available...`)
  
  const isAvailable = await checkPort(PORT)
  
  if (!isAvailable) {
    console.error(`❌ ERROR: Port ${PORT} is already in use!`)
    console.error(`   Please stop any other applications using port ${PORT}`)
    console.error(`   Common solutions:`)
    console.error(`   - Linux: Kill the process using: lsof -ti:${PORT} | xargs kill -9`)
    console.error(`   - Windows: Kill the process using: taskkill /f /im node.exe`)
    console.error(`   - Mac: Kill the process using: pkill -f "node ./check-port.js"`)
    process.exit(1)
  }
  
  console.log(`✅ Port ${PORT} is available!`)
  console.log(`🚀 Starting development server on port ${PORT}...`)
}

main().catch(console.error) 