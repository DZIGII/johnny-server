import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo, HasMany
} from "sequelize-typescript";
import { User } from "./User.js";
import { Folder } from "./Folder.js";

@Table({ tableName: "drives", timestamps: true, underscored: true })
export class Drive extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: "drive_id" })
  driveId!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  name!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "user_id" })
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => Folder)
  folders!: Folder[];
}