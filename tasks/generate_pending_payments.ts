import { BaseCommand } from '@adonisjs/ace'
import Customer from '#models/customer'
import Payment from '#models/payment'
import { DateTime } from 'luxon'
import Env from '#start/env'

export default class GeneratePendingPayments extends BaseCommand {
  /**
   * Command name is used to call the task.
   */
  public static commandName = 'generate:pending-payments'

  /**
   * Command description displayed in the "help" output.
   */
  public static description = 'Generate pending payments for customers automatically every month'

  /**
   * The code to execute when the task is run.
   */
  public static async run() {
    console.log('Generating pending payments for customers...')

    try {
      // Obtener todos los clientes
      const customers = await Customer.all()

      // Iterar sobre los clientes y generar pagos
      for (const customer of customers) {
        const d = new Date()
        d.setMonth(d.getMonth() + 1) // Fecha de vencimiento en el siguiente mes
        const dueDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`

        // Verificar si ya existe un pago pendiente para el cliente
        const existingPayment = await Payment.query()
          .where('customer_id', customer.id)
          .andWhere('payment_method', Env.get('PENDING_PAYMENT_METHOD', 0))
          .andWhere('amount', Env.get('PENDING_PAYMENT_AMOUNT', 300000))
          .andWhereNull('payment_confirmed')
          .first()

        if (existingPayment) {
          console.log(`Pending payment already exists for customer ${customer.id}`)
          continue
        }

        await Payment.create({
          customerId: customer.id,
          amount: Env.get('PENDING_PAYMENT_AMOUNT', 300000),
          paymentDate: DateTime.fromISO(dueDate),
          paymentMethod: Env.get('PENDING_PAYMENT_METHOD', 0),
        })
      }

      console.log('Pending payments generated successfully.')
    } catch (error) {
      console.error(`Error generating pending payments: ${error.message}`)
    }
  }
}
