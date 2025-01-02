import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare customerId: number

  @column.dateTime()
  declare paymentDate: DateTime

  @column.dateTime()
  declare paymentConfirmed: DateTime | null

  @column()
  declare paymentMethod: number // 0 = cash, 1 = TDC, 2 = TDD, 3 = QR, 4 = transfer, 5 = bank draft

  @column()
  declare amount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
