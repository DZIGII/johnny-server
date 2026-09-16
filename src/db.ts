import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import pgvector from 'pgvector/sequelize';
import { Sequelize as SequelizeCore } from 'sequelize';

import { User } from './models/User.js';
import { Drive } from './models/Drive.js';
import { Folder } from './models/Folder.js';
import { Blob } from './models/Blob.js';
import { File } from './models/File.js';
import { Chat } from './models/Chat.js';
import { ChatMember } from './models/ChatMember.js';
import { Message } from './models/Message.js';

pgvector.registerType(SequelizeCore);

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
  models: [User, Drive, Folder, Blob, File, Chat, ChatMember, Message],
});