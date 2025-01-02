import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('customer_id').unsigned().references('id').inTable('customers')
      table.date('payment_date').notNullable()
      table.date('payment_confirmed').nullable()
      table.integer('payment_method').notNullable() // 0 = cash, 1 = TDC, 2 = TDD, 3 = QR, 4 = transfer, 5 = bank draft
      table.decimal('amount', 12, 2).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
