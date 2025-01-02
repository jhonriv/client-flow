import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'

export default class CustomersController {
  /**
   * Display a list of all customers
   */
  public async index({ request, view, session }: HttpContext) {
    session.forget('error')
    session.forget('formData')
    const search = request.input('search') || undefined
    const sortBy = request.input('sortBy') || 'id'
    const sortOrder = request.input('sortOrder') || 'asc'

    const query = Customer.query()

    // Filtrado por nombre, cédula/RUC, o teléfono
    if (search) {
      query.where((builder) => {
        builder
          .where('names', 'like', `%${search}%`)
          .orWhere('last_names', 'like', `%${search}%`)
          .orWhere('id_ruc', 'like', `%${search}%`)
      })
    }

    // Ordenación
    query.orderBy(sortBy, sortOrder)

    // Obtener los resultados con paginación
    const customers = await query.exec()

    // Pasar los datos a la vista
    return view.render('customers/index', {
      title: 'Client Flow',
      customers,
      search,
      sortBy,
      sortOrder,
    })
  }

  /**
   * Display form to create a new customer
   */
  public async create({ view }: HttpContext) {
    return view.render('customers/customer', {
      title: 'Register Customer',
      titleH1: 'Register a New Customer',
      actionUrl: '/customers/store',
      submitValue: 'Register Customer',
    })
  }

  /**
   * Handle form submission for the create action
   */
  public async store({ request, response, session }: HttpContext) {
    const data = request.only(['names', 'lastNames', 'idRuc', 'phone', 'email'])

    // Buscar si el customer ya existe en la base de datos
    const existingCustomer = await Customer.query().where('id_ruc', data.idRuc).first()
    if (existingCustomer) {
      // Agrega un mensaje de error en la sesión
      session.put('error', `The ID/RUC "${data.idRuc}" already exists.`)
      // Reenvía los datos a la vista
      session.put('formData', data)
      return response.redirect('back') // Vuelve al formulario
    }

    // Crear nuevo customer en la base de datos
    await Customer.create(data)

    session.forget('error')
    session.forget('formData')

    console.log('customer created')
    return response.redirect().toRoute('/customers') // Redirigir a la lista de customers
  }

  /**
   * Show form to edit an individual customer record
   */
  public async edit({ params, view }: HttpContext) {
    const customer = await Customer.findOrFail(params.id)
    return view.render('customers/customer', {
      title: 'Edit Customer',
      titleH1: 'Edit Customer Details',
      actionUrl: `/customers/${customer.id}`,
      submitValue: 'Update Customer',
      customer,
    })
  }

  /**
   * Handle form submission for the edit action
   */
  public async update({ params, request, response, session }: HttpContext) {
    const data = request.only(['names', 'lastNames', 'idRuc', 'phone', 'email'])
    //console.log('data', data, params)

    // Buscar el customer en la base de datos
    const customerDB = await Customer.query().where('id', params.id).first()
    if (!customerDB) {
      session.put('error', 'Customer not found')
      session.put('formData', data)
      return response.redirect('back') // Vuelve al formulario
    }

    // asegurar que el idRuc sea unico
    const existingCustomer = await Customer.query().where('id_ruc', data.idRuc).first()
    if (existingCustomer && existingCustomer.id !== customerDB.id) {
      // Agrega un mensaje de error en la sesión
      session.put('error', `The ID/RUC "${data.idRuc}" already exists for another customer.`)
      // Reenvía los datos a la vista
      session.put('formData', data)
      return response.redirect('back') // Vuelve al formulario
    }

    // Actualizar los datos del customer
    await customerDB.merge(data).save()

    session.forget('error')
    session.forget('formData')

    console.log('customer updated')
    return response.redirect().toRoute('/customers') // Redirigir a la lista de customers
  }
}
