const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Ensures category names are unique
        },
        description: {
            type: String,
        },
        image: {
            type: String, // Filename of the uploaded image
        },
    },
    {
        timestamps: true, // Adds `createdAt` and `updatedAt` fields
    }
);

module.exports = mongoose.model('Category', categorySchema);
