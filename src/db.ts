import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { User } from './models/User.ts';

export const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
  models: [User],
});