import cron from 'node-cron'
import GeneratePendingPayments from '../tasks/generate_pending_payments.js'

// Ejecutar la tarea cada mes el día 1 a las 00:00
cron.schedule('0 0 1 * *', async () => {
  console.log('Running GeneratePendingPayments task...')
  await GeneratePendingPayments.run()
})
