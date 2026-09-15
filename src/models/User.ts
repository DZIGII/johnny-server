import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  Unique, AllowNull
} from "sequelize-typescript";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER"
}

@Table({
  tableName: "users",
  timestamps: true,
  underscored: true
})
export class User extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: "user_id"
  })
  userId!: string;

  @AllowNull(false)
  @Default(UserRole.USER)
  @Column(DataType.ENUM(...Object.values(UserRole)))
  role!: UserRole;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    field: "first_name"
  })
  firstName!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    field: "last_name"
  })
  lastName!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(50))
  nickname!: string;

  @Unique
  @AllowNull(false)
  @Column({
    type: DataType.STRING(255),
    validate: { isEmail: true }
  })
  email!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: "password_hash"
  })
  passwordHash!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  enabled!: boolean;
}