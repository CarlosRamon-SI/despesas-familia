import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), '.wwebjs_bot.log')

export function botLog(message: string): void {
  const line = `[${new Date().toISOString()}] ${message}\n`
  process.stdout.write(line)
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch {}
}
