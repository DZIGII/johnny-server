import {
  Table, Column, Model, DataType, PrimaryKey,
  AllowNull, HasMany
} from "sequelize-typescript";
import { File } from "./File.js";

@Table({ tableName: "blobs", timestamps: true, underscored: true })
export class Blob extends Model {

  @PrimaryKey
  @Column(DataType.STRING(64))
  hash!: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  size!: number;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  mime!: string;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  width!: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  height!: number | null;

  @AllowNull(true)
  @Column({ type: DataType.DATE, field: "captured_at" })
  capturedAt!: Date | null;

  @AllowNull(true)
  @Column(DataType.DOUBLE)
  latitude!: number | null;

  @AllowNull(true)
  @Column(DataType.DOUBLE)
  longitude!: number | null;

  @AllowNull(true)
  @Column({ type: "VECTOR(512)" as any })
  embedding!: number[] | null;

  @HasMany(() => File)
  files!: File[];
}