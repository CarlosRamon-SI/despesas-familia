import { startClient } from '../lib/whatsapp/client'
import { botLog } from '../lib/whatsapp/logger'

botLog('🚀 Iniciando cliente WhatsApp...')
startClient().catch((err) => {
  console.error('Erro ao iniciar cliente:', err)
  process.exit(1)
})
