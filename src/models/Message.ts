import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./User.js";
import { Chat } from "./Chat.js";
import { Blob } from "./Blob.js";

@Table({ tableName: "messages", timestamps: false, underscored: true,   indexes: [{ name: "messages_chat_sent_idx", fields: ["chat_id", "sent_at"] }] })
export class Message extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: "message_id" })
  messageId!: string;

  @ForeignKey(() => Chat)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "chat_id" })
  chatId!: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "sent_at" })
  sentAt!: Date;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.UUID, field: "sender_id" })
  senderId!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  text!: string | null;

  @ForeignKey(() => Blob)
  @AllowNull(true)
  @Column({ type: DataType.STRING(64), field: "blob_hash" })
  blobHash!: string | null;

  @BelongsTo(() => Chat)
  chat!: Chat;

  @BelongsTo(() => User, "senderId")
  sender!: User;

  @BelongsTo(() => Blob)
  blob!: Blob | null;
}