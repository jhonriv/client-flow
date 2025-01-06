/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const CustomersController = () => import('#controllers/customers_controller')
const PaymentsController = () => import('#controllers/payments_controller')
import GeneratePendingPayments from '#tasks/generate_pending_payments'
import { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'

router.get('/', ({ view, response, session }: HttpContext) => {
  const currentLang = session.get('locale') || undefined

  if (currentLang) return response.redirect('/customers')
  return view.render('layouts/main')
})

router.get('/set-language', ({ view }: HttpContext) => {
  return view.render('layouts/main')
})

router.post('/set-language', async ({ request, response, session, i18n }) => {
  const lang = request.input('lang') || 'en'
  i18n.switchLocale(lang)
  session.put('locale', lang)
  response.redirect('/customers')
})

router
  .group(() => {
    router.get('/', [CustomersController, 'index'])
    router.get('/create', [CustomersController, 'create'])
    router.post('/store', [CustomersController, 'store'])
    router.get('/edit/:id', [CustomersController, 'edit'])
    router.post('/:id', [CustomersController, 'update'])
  })
  .prefix('/customers')

router
  .group(() => {
    router.get('/', [PaymentsController, 'index'])
    router.get('/create', [PaymentsController, 'create'])
    router.post('/store', [PaymentsController, 'store'])
    router.get('/edit/:id', [PaymentsController, 'edit'])
    router.get('/confirm/:id', [PaymentsController, 'confirmPayment'])
    router.post('/:id', [PaymentsController, 'update'])
  })
  .prefix('/customers/:customerId/payments')

router.get('/run-task', async ({ response }: HttpContext) => {
  await GeneratePendingPayments.run()
  return response.redirect().toRoute('/customers')
})
