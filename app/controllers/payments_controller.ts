import type { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'
import Customer from '#models/customer'
import { DateTime } from 'luxon'
import { I18n } from '@adonisjs/i18n'

/** Gets the previous date for 3 months */
const minus3Months = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

/** Gets the current date */
const todayFormat = () => {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

/** Date range for the last 3 months */
const dateRange = { min: minus3Months(), max: todayFormat() }

export default class PaymentsController {
  /** Display a list of all payments */
  public async index({ params, request, view, session, i18n }: HttpContext) {
    session.forget('error')
    session.forget('formData')
    const customerId = params.customerId

    // Get the customer or return 404
    const customer = await Customer.find(customerId)
    if (!customer) return view.render('pages/errors/not_found')

    const startDate = request.input('startDate') || undefined
    const endDate = request.input('endDate') || undefined
    const sortBy = request.input('sortBy') || 'createdAt'
    const sortOrder = request.input('sortOrder') || 'desc'

    const query = Payment.query().where('customer_id', customerId)

    // Filter by payment date by range
    if (startDate && endDate) {
      query.where((builder) => {
        builder.where('payment_date', '>=', startDate).andWhere('payment_date', '<=', endDate)
      })
    }

    // Order
    query.orderBy(sortBy, sortOrder)

    // Get the results
    let out = await query.exec()
    //console.log('payments', out)

    let payments = out.map((payment) => {
      return {
        ...payment,
        id: payment.id,
        paymentDate: payment.paymentDate.toFormat('dd-MM-yyyy'),
        paymentConfirmed: payment.paymentConfirmed
          ? payment.paymentConfirmed.toFormat('dd-MM-yyyy')
          : '',
        amount: payment.amount.toLocaleString('es-PY', { style: 'currency', currency: 'PYG' }),
        description: payment.description || '',
        paymentMethod:
          this.paymentMethodName(payment.paymentMethod, i18n) ||
          i18n.t('payments.paymentMethods.unknown'),
      }
    })

    // Get the filter date range
    const filterDateRange = {
      startDate: DateTime.now().startOf('month').toFormat('yyyy-MM-dd'),
      endDate: DateTime.now().endOf('month').toFormat('yyyy-MM-dd'),
    }

    // Render the view
    return view.render('payments/index', {
      customer,
      payments,
      filterDateRange,
      searchDateRange: { startDate, endDate },
      sortBy,
      sortOrder,
    })
  }

  /** Display form to create a new payment */
  public async create({ params, view, i18n }: HttpContext) {
    const customerId = params.customerId

    // Get the customer or return 404
    const customer = await Customer.find(customerId)
    if (!customer) return view.render('pages/errors/not_found')

    return view.render('payments/payment', {
      customer,
      dateRange,
      title: i18n.t('payments.createTitle'),
      titleH1: i18n.t('payments.createTitleH1'),
      actionUrl: `/customers/${customerId}/payments/store`,
      submitValue: i18n.t('payments.createTitle'),
    })
  }

  /** Handle form submission for the create action */
  public async store({ params, request, response, session, i18n }: HttpContext) {
    const customerId = params.customerId
    let data = request.only(['paymentDate', 'paymentConfirmed', 'paymentMethod', 'amount'])
    let payment = {
      ...data,
      paymentMethod: Number.parseInt(data.paymentMethod),
      amount: Number.parseFloat(data.amount),
      customerId,
    }

    // Search for existing payment
    const existingPayment = await Payment.query()
      .where('customer_id', customerId)
      .andWhere('payment_date', data.paymentDate)
      .andWhere('payment_method', data.paymentMethod)
      .andWhere('amount', data.amount)
      .first()
    if (existingPayment) {
      // Add an error message to the session
      session.put('error', i18n.t('payments.errors.paymentExists'))
      // Resend the form data
      session.put('formData', data)
      return response.redirect('back') // Back to the form
    }

    // Create the payment
    await Payment.create(payment)

    session.forget('error')
    session.forget('formData')

    console.log('payment created')
    return response.redirect(`/customers/${customerId}/payments`) // Redirect to the index
  }

  /** Show form to edit an individual payment record */
  public async edit({ params, view, i18n }: HttpContext) {
    const customerId = params.customerId

    // Get the customer or return 404
    const customer = await Customer.find(customerId)
    if (!customer) return view.render('pages/errors/not_found')

    // Get the payment
    const payment = await Payment.query()
      .where('customer_id', params.customerId)
      .where('id', params.id)
      .first()
    if (!payment) return view.render('pages/errors/not_found')

    let out = {
      id: payment.id,
      paymentDate: payment.paymentDate.toFormat('yyyy-MM-dd'),
      paymentConfirmed: payment.paymentConfirmed
        ? payment.paymentConfirmed.toFormat('yyyy-MM-dd')
        : null,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
    }

    // Render the view
    return view.render('payments/payment', {
      customer,
      dateRange,
      title: i18n.t('payments.editTitle'),
      titleH1: i18n.t('payments.editTitleH1'),
      actionUrl: `/customers/${customer.id}/payments/${payment.id}`,
      submitValue: i18n.t('payments.editTitle'),
      payment: out,
    })
  }

  /** Handle form submission for the edit action */
  public async update({ params, request, response, view, session, i18n }: HttpContext) {
    const data = request.only(['paymentDate', 'paymentConfirmed', 'paymentMethod', 'amount'])

    // Get the customer or return 404
    const customer = await Customer.find(params.customerId)
    if (!customer) return view.render('pages/errors/not_found')

    // Search for existing payment or return 404
    const paymentDB = await Payment.query()
      .where('customer_id', params.customerId)
      .andWhere('id', params.id)
      .first()
    if (!paymentDB) {
      session.put('error', i18n.t('payments.errors.paymentNotFound'))
      session.put('formData', data)
      return response.redirect('back') // Back to the form
    }

    // Check that data is unique
    const existingPayment = await Payment.query()
      .where('customer_id', params.customerId)
      .andWhere('payment_date', data.paymentDate)
      .andWhere('payment_method', data.paymentMethod)
      .andWhere('amount', data.amount)
      .andWhere('id', '!=', params.id)
      .first()
    if (existingPayment) {
      // Add an error message to the session
      session.put('error', i18n.t('payments.errors.paymentExists'))
      // Resend the form data
      session.put('formData', data)
      return response.redirect('back') // Back to the form
    }

    // Update the payment
    await paymentDB.merge(data).save()

    session.forget('error')
    session.forget('formData')

    console.log('payment updated')
    return response.redirect(`/customers/${customer.id}/payments/`) // Redirect to the index
  }

  /** Mark a payment as confirmed */
  public async confirmPayment({ params, response }: HttpContext) {
    // Get the customer or return 404
    const customer = await Customer.find(params.customerId)
    if (!customer) return response.notFound()

    // Get the payment or return 404
    const payment = await Payment.query()
      .where('customerId', params.customerId)
      .where('id', params.id)
      .first()
    if (!payment) return response.notFound()

    // Mark the payment as confirmed
    payment.paymentConfirmed = DateTime.now()

    // Save the payment
    await payment.save()

    // Redirect to the index
    return response.redirect(`/customers/${customer.id}/payments`)
  }

  /** Return the translation for a payment method */
  paymentMethodName(paymentMethod: number, i18n: I18n) {
    return i18n.t(`payments.paymentMethod.${paymentMethod}`)
  }
}
