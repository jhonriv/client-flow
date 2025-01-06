import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'

export default class CustomersController {
  /** Display a list of all customers */
  public async index({ request, view, session }: HttpContext) {
    session.forget('error')
    session.forget('formData')
    const search = request.input('search') || undefined
    const sortBy = request.input('sortBy') || 'id'
    const sortOrder = request.input('sortOrder') || 'asc'

    const query = Customer.query()

    // Filter by name, ID or RUC
    if (search) {
      query.where((builder) => {
        builder
          .where('names', 'like', `%${search}%`)
          .orWhere('last_names', 'like', `%${search}%`)
          .orWhere('id_ruc', 'like', `%${search}%`)
      })
    }

    // Order
    query.orderBy(sortBy, sortOrder)

    // Get the results
    const customers = await query.exec()

    // Render the view
    return view.render('customers/index', {
      customers,
      search,
      sortBy,
      sortOrder,
    })
  }

  /** Display form to create a new customer */
  public async create({ view, i18n }: HttpContext) {
    return view.render('customers/customer', {
      title: i18n.t('customers.createTitle'),
      titleH1: i18n.t('customers.createTitleH1'),
      actionUrl: '/customers/store',
      submitValue: i18n.t('customers.createTitle'),
    })
  }

  /** Handle form submission for the create action */
  public async store({ request, response, session, i18n }: HttpContext) {
    const data = request.only(['names', 'lastNames', 'idRuc', 'phone', 'email'])

    // Check if idRuc already exists
    const existingCustomer = await Customer.query().where('id_ruc', data.idRuc).first()
    if (existingCustomer) {
      session.put('error', i18n.t('customers.errors.idRucExists', { idRuc: data.idRuc }))
      session.put('formData', data)
      return response.redirect('back') // Back to the form
    }

    // Create the new customer
    await Customer.create(data)

    session.forget('error')
    session.forget('formData')

    console.log('customer created')
    return response.redirect().toRoute('/customers') // Redirect to the index
  }

  /** Show form to edit an individual customer record */
  public async edit({ params, view, i18n }: HttpContext) {
    const customer = await Customer.find(params.id)
    if (!customer) return view.render('pages/errors/not_found')
    return view.render('customers/customer', {
      title: i18n.t('customers.editTitle'),
      titleH1: i18n.t('customers.editTitleH1'),
      actionUrl: `/customers/${customer.id}`,
      submitValue: i18n.t('customers.editTitle'),
      customer,
    })
  }

  /** Handle form submission for the edit action */
  public async update({ params, request, response, session, i18n }: HttpContext) {
    const data = request.only(['names', 'lastNames', 'idRuc', 'phone', 'email'])
    //console.log('data', data, params)

    // Search for the customer or return an error
    const customerDB = await Customer.query().where('id', params.id).first()
    if (!customerDB) {
      session.put('error', i18n.t('customers.errors.customerNotFound'))
      session.put('formData', data)
      return response.redirect('back') // Back to the form
    }

    // Check that idRuc is unique
    const existingCustomer = await Customer.query().where('id_ruc', data.idRuc).first()
    if (existingCustomer && existingCustomer.id !== customerDB.id) {
      // Add an errormessage to the session
      session.put('error', i18n.t('customers.errors.idRucExists', { idRuc: data.idRuc }))
      // Resend the form data
      session.put('formData', data)
      return response.redirect('back') // Back to the form
    }

    // Update the customer data
    await customerDB.merge(data).save()

    session.forget('error')
    session.forget('formData')

    console.log('customer updated')
    return response.redirect().toRoute('/customers') // Redirect to the index
  }
}
