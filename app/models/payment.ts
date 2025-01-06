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
  declare paymentMethod: number // 0 = Cash, 1 = Transfer, 2 = Debit Card, 3 = Credit Card, 4 = Bank Draft

  @column()
  declare amount: number

  @column()
  declare description: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
