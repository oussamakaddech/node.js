const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const Hotel = require("./models/HOTEL");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
const mongoURI = "mongodb://127.0.0.1:27017/hotel";
mongoose
    .connect(mongoURI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// CRUD Operations

// Create a new hotel
app.post("/hotels", async (req, res) => {
    try {
        const { name, fabricationDate, nbrRooms } = req.body;

        if (!name || !fabricationDate) {
            return res.status(400).send({ error: "Name and fabricationDate are required" });
        }

        const newHotel = new Hotel({ name, fabricationDate, nbrRooms });
        await newHotel.save();

        res.status(201).send({ message: "Hotel created successfully", hotel: newHotel });
    } catch (error) {
        console.error("Error creating hotel:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Get all hotels
app.get("/hotels", async (req, res) => {
    try {
        const hotels = await Hotel.find();
        res.status(200).send(hotels);
    } catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Get a single hotel by ID
app.get("/hotels/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({ error: "Invalid ID format" });
        }

        const hotel = await Hotel.findById(id);

        if (!hotel) {
            return res.status(404).send({ error: "Hotel not found" });
        }

        res.status(200).send(hotel);
    } catch (error) {
        console.error("Error fetching hotel:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Update a hotel by ID
app.put("/hotels/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({ error: "Invalid ID format" });
        }

        const { name, fabricationDate, nbrRooms } = req.body;

        const updatedHotel = await Hotel.findByIdAndUpdate(
            id,
            { name, fabricationDate, nbrRooms },
            { new: true, runValidators: true }
        );

        if (!updatedHotel) {
            return res.status(404).send({ error: "Hotel not found" });
        }

        res.status(200).send({ message: "Hotel updated successfully", hotel: updatedHotel });
    } catch (error) {
        console.error("Error updating hotel:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Delete a hotel by ID
app.delete("/hotels/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({ error: "Invalid ID format" });
        }

        const deletedHotel = await Hotel.findByIdAndDelete(id);

        if (!deletedHotel) {
            return res.status(404).send({ error: "Hotel not found" });
        }

        res.status(200).send({ message: "Hotel deleted successfully", hotel: deletedHotel });
    } catch (error) {
        console.error("Error deleting hotel:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// Search hotels by number of rooms
app.get("/find/", async (req, res) => {
    try {
        const hotels = await Hotel.find({nbrRooms : {$gte:10 , $lte:100}});

        if (hotels.length === 0) {
            return res.status(404).send({ message: "No hotels found with this capacity" });
        }

        res.status(200).send(hotels);
    } catch (error) {
        console.error("Error finding hotels:", error);
        res.status(500).send({ error: "Internal server error" });
    }
});

// WebSocket connection
io.on("connection", (socket) => {
    console.log("New WebSocket connection established");

    // Event to add a room to a specific hotel
    socket.on("addRoom", async ({ hotelId }, callback) => {
        try {
            if (!mongoose.isValidObjectId(hotelId)) {
                return callback({ error: "Invalid hotel ID" });
            }

            const updatedHotel = await Hotel.findByIdAndUpdate(
                hotelId,
                { $inc: { nbrRooms: 1 } }, // Increment nbrRooms by 1
                { new: true, runValidators: true }
            );

            if (!updatedHotel) {
                return callback({ error: "Hotel not found" });
            }

            // Emit the updated hotel data back to the client
            callback({ message: "Room added successfully", hotel: updatedHotel });
        } catch (error) {
            console.error("Error adding room:", error);
            callback({ error: "Internal server error" });
        }
    });

    socket.on("disconnect", () => {
        console.log("WebSocket connection closed");
    });
});
// Start the server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
