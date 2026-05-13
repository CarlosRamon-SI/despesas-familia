import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import QRCode from 'qrcode'
import { handleIncomingMessage } from './handler'
import { writeStatus } from './status'
import { botLog } from './logger'

export async function startClient() {
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  })

  writeStatus({ status: 'initializing', pid: process.pid })

  client.on('qr', async (qr) => {
    console.log('📱 Escaneie o QR Code abaixo com o WhatsApp:')
    qrcode.generate(qr, { small: true })
    const dataUrl = await QRCode.toDataURL(qr)
    writeStatus({ status: 'qr', qr: dataUrl, pid: process.pid })
  })

  client.on('ready', () => {
    botLog('✅ WhatsApp conectado!')
    writeStatus({ status: 'connected', phone: client.info?.wid?.user, pid: process.pid })
  })

  client.on('disconnected', (reason) => {
    botLog(`⚠️ WhatsApp desconectado: ${reason}`)
    writeStatus({ status: 'disconnected' })
    process.exit(0)
  })

  client.on('message', async (message) => {
    botLog(`[event:message] from=${message.from}`)
    await handleIncomingMessage(message)
  })

  client.on('message_create', async (message) => {
    if (!message.fromMe) return
    botLog(`[event:message_create] from=${message.from} (próprio número)`)
  })

  await client.initialize()
}
