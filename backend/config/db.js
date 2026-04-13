const mongoose = require("mongoose");
const { seedDemoData } = require("../services/demoDataService");

const removeStaleIndexes = async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  const patientCollectionExists = collections.some((collection) => collection.name === "patients");

  if (!patientCollectionExists) {
    return;
  }

  const patientCollection = mongoose.connection.collection("patients");
  const indexes = await patientCollection.indexes();
  const staleUserIdIndex = indexes.find((index) => index.name === "userId_1");

  if (staleUserIdIndex) {
    await patientCollection.dropIndex("userId_1");
    console.log("Removed stale patients.userId_1 index");
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/earogyaseva";

  try {
    await mongoose.connect(mongoUri);
    await removeStaleIndexes();
    await seedDemoData();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
