import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo, HasMany
} from "sequelize-typescript";
import { Blob } from "./Blob.js";
import { ChatMember } from "./ChatMember.js";
import { Message } from "./Message.js";

export enum ChatType {
  PRIVATE = "PRIVATE",
  GROUP = "GROUP"
}

@Table({ tableName: "chats", timestamps: true, underscored: true })
export class Chat extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: "chat_id" })
  chatId!: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(ChatType)))
  type!: ChatType;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  name!: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  description!: string | null;

  @ForeignKey(() => Blob)
  @AllowNull(true)
  @Column({ type: DataType.STRING(64), field: "icon_blob_hash" })
  iconBlobHash!: string | null;

  @BelongsTo(() => Blob)
  icon!: Blob | null;

  @HasMany(() => ChatMember)
  members!: ChatMember[];

  @HasMany(() => Message)
  messages!: Message[];
}