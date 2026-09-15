import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Folder, Visibility } from "./Folder.js";
import { Blob } from "./Blob.js";

@Table({ tableName: "files", timestamps: true, underscored: true })
export class File extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: "file_id" })
  fileId!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @AllowNull(false)
  @Default(Visibility.PRIVATE)
  @Column(DataType.ENUM(...Object.values(Visibility)))
  visibility!: Visibility;

  @ForeignKey(() => Folder)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "folder_id" })
  folderId!: string;

  @BelongsTo(() => Folder)
  folder!: Folder;

  @ForeignKey(() => Blob)
  @AllowNull(false)
  @Column({ type: DataType.STRING(64), field: "blob_hash" })
  blobHash!: string;

  @BelongsTo(() => Blob)
  blob!: Blob;
}