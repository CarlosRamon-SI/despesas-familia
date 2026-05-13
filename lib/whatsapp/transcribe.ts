import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { Message } from 'whatsapp-web.js'

let daemon: ChildProcess | null = null
let daemonReady = false
let pendingResolve: ((text: string) => void) | null = null

function getDaemon(): Promise<ChildProcess> {
  if (daemon && daemonReady) return Promise.resolve(daemon)

  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), 'scripts/transcribe_daemon.py')
    const proc = spawn('python3', [scriptPath])
    daemon = proc
    daemonReady = false

    let buffer = ''
    proc.stdout!.on('data', (chunk: Buffer) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed === 'READY') {
          daemonReady = true
          resolve(proc)
          continue
        }

        if (pendingResolve) {
          pendingResolve(trimmed)
          pendingResolve = null
        }
      }
    })

    proc.stderr!.on('data', (chunk: Buffer) => {
      // Logs do faster-whisper vão para stderr — suprimidos intencionalmente
      void chunk
    })

    proc.on('error', (err) => {
      daemon = null
      daemonReady = false
      reject(err)
    })

    proc.on('exit', () => {
      daemon = null
      daemonReady = false
    })
  })
}

function sendToDaemon(proc: ChildProcess, audioPath: string): Promise<string> {
  return new Promise((resolve) => {
    pendingResolve = resolve
    proc.stdin!.write(audioPath + '\n')
  })
}

export async function transcribeAudio(message: Message): Promise<string | null> {
  const media = await message.downloadMedia()
  if (!media) return null

  const ext = media.mimetype.includes('ogg') ? 'ogg' : 'mp4'
  const tmpPath = join(tmpdir(), `wa_audio_${Date.now()}.${ext}`)

  try {
    writeFileSync(tmpPath, Buffer.from(media.data, 'base64'))
    const proc = await getDaemon()
    const result = await sendToDaemon(proc, tmpPath)
    if (result.startsWith('ERROR:')) return null
    return result || null
  } catch {
    return null
  } finally {
    try { unlinkSync(tmpPath) } catch {}
  }
}
