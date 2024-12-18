const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the hotel schema
const hotelSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Hotel name is required"], // Validation: required
            trim: true, // Automatically removes whitespace
        },
        fabricationDate: {
            type: Date,
            required: [true, "Fabrication date is required"], // Validation: required
        },
        nbrRooms: {
            type: Number,
            default: 10,
            required: [true, "Number of rooms is required"], // Validation: required
            min: [1, "Number of rooms must be at least 1"], // Validation: minimum value
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create the model
const Hotel = mongoose.model("Hotel", hotelSchema);

// Export the model
module.exports = Hotel;
