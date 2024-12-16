const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../model/listing.js");  // Ensure this path is correct
const ObjectId = mongoose.Types.ObjectId; // Import ObjectId

// MongoDB URL
const mongoUrl = "mongodb://127.0.0.1:27017/wanderLust";

// Connect to MongoDB
async function main() {
    try {
        await mongoose.connect(mongoUrl);  // No need for useNewUrlParser and useUnifiedTopology in newer versions
        console.log("Connected to MongoDB");
    } 
    catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
}

main();

// Initialize the database
const initDB = async () => {
  try {
    // Clear existing listings
    await Listing.deleteMany({});

    // Initialize new data
    initData.data = initData.data.map((obj) => {
      return { ...obj, owner: new ObjectId("66d68d248732e1345e9dbd17") };  // Set the valid owner ID
    });

    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
  } catch (err) {
    console.error("Error initializing data:", err);
  }
};

initDB();
