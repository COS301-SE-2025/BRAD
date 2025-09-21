import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

/*export const connectInMemoryDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};*/

export const connectInMemoryDB = async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '4.4.6' },
    instance: { dbName: 'testdb' },
  });

  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnectInMemoryDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
