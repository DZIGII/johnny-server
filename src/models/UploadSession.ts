import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Folder } from "./Folder.js";
import { User } from "./User.js";

@Table({ tableName: "upload_sessions", timestamps: true, underscored: true })
export class UploadSession extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: "upload_id" })
  uploadId!: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "user_id" })
  userId!: string;

  @ForeignKey(() => Folder)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "folder_id" })
  folderId!: string;

  @BelongsTo(() => Folder, { onDelete: "CASCADE" })
  folder!: Folder;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  mime!: string;

  @AllowNull(false)
  @Column(DataType.BIGINT)
  size!: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "chunk_size" })
  chunkSize!: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "total_chunks" })
  totalChunks!: number;

  @AllowNull(false)
  @Default(0)
  @Column({ type: DataType.INTEGER, field: "received_chunks" })
  receivedChunks!: number;
}