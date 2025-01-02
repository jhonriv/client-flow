import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Customer extends BaseModel {
  constructor(data?: Partial<Customer>) {
    super()
    Object.assign(this, data)
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare names: string

  @column()
  declare lastNames: string

  @column()
  declare idRuc: string

  @column()
  declare phone: string

  @column()
  declare email: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
