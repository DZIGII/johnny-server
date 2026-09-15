import {
  Table, Column, Model, DataType, PrimaryKey, Default,
  AllowNull, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./User.js";
import { Chat } from "./Chat.js";
import { Message } from "./Message.js";

export enum ChatMemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

@Table({ tableName: "chat_members", timestamps: false, underscored: true })
export class ChatMember extends Model {

  @PrimaryKey
  @ForeignKey(() => Chat)
  @Column({ type: DataType.UUID, field: "chat_id" })
  chatId!: string;

  @PrimaryKey
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, field: "user_id" })
  userId!: string;

  @AllowNull(false)
  @Default(ChatMemberRole.MEMBER)
  @Column({ type: DataType.ENUM(...Object.values(ChatMemberRole)), field: "member_role" })
  memberRole!: ChatMemberRole;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: "joined_at" })
  joinedAt!: Date;

  @ForeignKey(() => Message)
  @AllowNull(true)
  @Column({ type: DataType.UUID, field: "last_read_message_id" })
  lastReadMessageId!: string | null;

  @BelongsTo(() => Chat)
  chat!: Chat;

  @BelongsTo(() => User)
  user!: User;
}