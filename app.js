const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const storieRoute = require("./routes/storieRoute")
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());

// Middleware
app.use(express.json());


connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stories', storieRoute);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
