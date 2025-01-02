import type { HttpContext } from '@adonisjs/core/http'
import Payment from '#models/payment'
import Customer from '#models/customer'
import { DateTime } from 'luxon'

const minus3Months = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

const todayFormat = () => {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

const dateRange = { min: minus3Months(), max: todayFormat() }

export default class PaymentsController {
  /**
   * Display a list of all payments
   */
  public async index({ params, request, view, session }: HttpContext) {
    session.forget('error')
    session.forget('formData')
    const customerId = params.customerId
    const customer = await Customer.find(customerId)
    if (!customer) return view.render('errors/404')

    const startDate = request.input('startDate') || undefined
    const endDate = request.input('endDate') || undefined
    const sortBy = request.input('sortBy') || 'createdAt'
    const sortOrder = request.input('sortOrder') || 'desc'

    const query = Payment.query().where('customer_id', customerId)

    // Filtrado por nombre, cédula/RUC, o teléfono
    console.log('startDate', startDate, 'endDate', endDate)
    if (startDate && endDate) {
      query.where((builder) => {
        builder.where('payment_date', '>=', startDate).andWhere('payment_date', '<=', endDate)
      })
    }

    // Ordenación
    query.orderBy(sortBy, sortOrder)

    // Obtener los resultados con paginación
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
        paymentMethod: this.paymentMethodName(payment.paymentMethod),
      }
    })

    const filterDateRange = {
      startDate: DateTime.now().startOf('month').toFormat('yyyy-MM-dd'),
      endDate: DateTime.now().endOf('month').toFormat('yyyy-MM-dd'),
    }

    // Pasar los datos a la vista
    return view.render('payments/index', {
      title: 'Client Flow',
      customer,
      payments,
      filterDateRange,
      searchDateRange: { startDate, endDate },
      sortBy,
      sortOrder,
    })
  }

  /**
   * Display form to create a new payment
   */
  public async create({ params, view }: HttpContext) {
    const customerId = params.customerId
    const customer = await Customer.find(customerId)
    if (!customer) return view.render('errors/404')

    return view.render('payments/payment', {
      customer,
      dateRange,
      title: 'Register Payment',
      titleH1: 'Register a New Payment',
      actionUrl: `/customers/${customerId}/payments/store`,
      submitValue: 'Register Payment',
    })
  }

  /**
   * Handle form submission for the create action
   */
  public async store({ params, request, response, session }: HttpContext) {
    const customerId = params.customerId
    let data = request.only(['paymentDate', 'paymentConfirmed', 'paymentMethod', 'amount'])
    let payment = {
      ...data,
      paymentMethod: Number.parseInt(data.paymentMethod),
      amount: Number.parseFloat(data.amount),
      customerId,
    }

    //console.log('payment', payment)

    // Buscar si el payment ya existe en la base de datos
    const existingPayment = await Payment.query()
      .where('customer_id', customerId)
      .andWhere('payment_date', data.paymentDate)
      .andWhere('payment_method', data.paymentMethod)
      .andWhere('amount', data.amount)
      .first()
    if (existingPayment) {
      // Agrega un mensaje de error en la sesión
      session.put('error', `The payment for the date "${data.paymentDate}" already exists.`)
      // Reenvía los datos a la vista
      session.put('formData', data)
      return response.redirect('back') // Vuelve al formulario
    }

    // Crear nuevo payment en la base de datos
    await Payment.create(payment)

    session.forget('error')
    session.forget('formData')

    console.log('payment created')
    return response.redirect(`/customers/${customerId}/payments`) // Redirigir a la lista de payments
  }

  /**
   * Show form to edit an individual payment record
   */
  public async edit({ params, view }: HttpContext) {
    const customerId = params.customerId
    const customer = await Customer.find(customerId)
    if (!customer) return view.render('errors/404')
    const payment = await Payment.query()
      .where('customer_id', params.customerId)
      .where('id', params.id)
      .first()

    if (!payment) return view.render('errors/404')

    let out = {
      id: payment.id,
      paymentDate: payment.paymentDate.toFormat('yyyy-MM-dd'),
      paymentConfirmed: payment.paymentConfirmed
        ? payment.paymentConfirmed.toFormat('yyyy-MM-dd')
        : null,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
    }

    //console.log('payment-OUT', out)
    return view.render('payments/payment', {
      customer,
      dateRange,
      title: 'Edit Payment',
      titleH1: 'Edit Payment Details',
      actionUrl: `/customers/${customer.id}/payments/${payment.id}`,
      submitValue: 'Update Payment',
      payment: out,
    })
  }

  /**
   * Handle form submission for the edit action
   */
  public async update({ params, request, response, view, session }: HttpContext) {
    const data = request.only(['paymentDate', 'paymentConfirmed', 'paymentMethod', 'amount'])
    //console.log('data', data, params)
    const customer = await Customer.find(params.customerId)
    if (!customer) return view.render('errors/404')

    // Buscar el payment en la base de datos
    const paymentDB = await Payment.query()
      .where('customer_id', params.customerId)
      .andWhere('id', params.id)
      .first()
    if (!paymentDB) {
      session.put('error', 'Payment not found')
      session.put('formData', data)
      return response.redirect('back') // Vuelve al formulario
    }

    // asegurar que el idRuc sea unico
    const existingPayment = await Payment.query()
      .where('customer_id', params.customerId)
      .andWhere('payment_date', data.paymentDate)
      .andWhere('payment_method', data.paymentMethod)
      .andWhere('amount', data.amount)
      .andWhere('id', '!=', params.id)
      .first()
    if (existingPayment) {
      // Agrega un mensaje de error en la sesión
      session.put('error', `The payment for the date "${data.paymentDate}" already exists.`)
      // Reenvía los datos a la vista
      session.put('formData', data)
      return response.redirect('back') // Vuelve al formulario
    }

    // Actualizar los datos del payment
    await paymentDB.merge(data).save()

    session.forget('error')
    session.forget('formData')

    console.log('payment updated')
    return response.redirect(`/customers/${customer.id}/payments/`) // Redirigir a la lista de payments
  }

  public async confirmPayment({ params, response }: HttpContext) {
    const customer = await Customer.find(params.customerId)
    if (!customer) return response.notFound()

    const payment = await Payment.query()
      .where('customerId', params.customerId)
      .where('id', params.id)
      .first()
    if (!payment) return response.notFound()

    payment.paymentConfirmed = DateTime.now()

    await payment.save()

    return response.redirect(`/customers/${customer.id}/payments`)
  }

  paymentMethodName(paymentMethod: number) {
    switch (paymentMethod) {
      case 0:
        return 'Cash'
      case 1:
        return 'TDC'
      case 2:
        return 'TDD'
      case 3:
        return 'QR'
      case 4:
        return 'Transfer'
      case 5:
        return 'Bank Draft'
      default:
        return 'Unknown'
    }
  }
}
