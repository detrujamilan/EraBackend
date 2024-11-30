const {protect} = require("../middleware/authMiddleware");
const Category = require("../models/Category");
const Story = require("../models/Story");
const upload = require("../middleware/multerConfig");
const express = require("express");
const router = express.Router();


// POST - Add a new story to a category
router.post('/:categoryId/stories', protect, upload.single('image'), async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, rating } = req.body;

        // Check if the category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if an image is provided
        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Create a new story
        const newStory = new Story({
            name,
            rating,
            image: req.file.filename, // Save the filename of the uploaded image
            category: categoryId, // Reference the category
        });

        const savedStory = await newStory.save();

        res.status(201).json({
            status: 'success',
            message: 'Story added successfully',
            data: savedStory,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        // Fetch all stories and populate the category field
        const stories = await Story.find()
            .populate('category', 'name') // Populate category field with its name
            .select('name image rating category'); // Select fields to include in response

        if (!stories.length) {
            return res.status(404).json({ message: 'No stories found' });
        }

        res.status(200).json({
            status: 'success',
            data: stories,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});


module.exports = router;
