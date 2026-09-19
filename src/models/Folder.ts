import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo, HasMany
} from "sequelize-typescript";
import { Drive } from "./Drive.js";
import { File } from "./File.js";

export enum Visibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  FRIENDS = "FRIENDS"
}

@Table({ tableName: "folders", timestamps: true, underscored: true })
export class Folder extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: "folder_id" })
  folderId!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @AllowNull(false)
  @Default(Visibility.PRIVATE)
  @Column(DataType.ENUM(...Object.values(Visibility)))
  visibility!: Visibility;

  @ForeignKey(() => Folder)
  @AllowNull(true)
  @Column({ type: DataType.UUID, field: "parent_id" })
  parentId!: string | null;

  @BelongsTo(() => Folder, "parentId")
  parent!: Folder | null;

  @HasMany(() => Folder, {foreignKey: "parentId", onDelete: "CASCADE"})
  children!: Folder[];

  @ForeignKey(() => Drive)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "drive_id" })
  driveId!: string;

  @BelongsTo(() => Drive)
  drive!: Drive;

  @HasMany(() => File, {onDelete: "CASCADE"})
  files!: File[];
}
