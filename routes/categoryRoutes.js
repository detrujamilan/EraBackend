const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Story = require('../models/Story');
const upload = require('../middleware/multerConfig');
const {protect} = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Fetch all categories
 * @access  Protected
 */
router.get('/', protect, async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({message: 'Failed to fetch categories', error: error.message});
    }
});

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Protected
 */
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const {name, description} = req.body;

        // Validate the presence of an image
        if (!req.file) {
            return res.status(400).json({message: 'Image file is required'});
        }

        const newCategory = new Category({
            name,
            description,
            image: req.file.filename,
        });

        await newCategory.save();

        res.status(201).json({
            status: 'success',
            message: 'Category created successfully',
            category: newCategory,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

/**
 * @route   GET /api/categories/:categoryId/stories
 * @desc    Fetch all stories under a specific category by ID
 * @access  Protected
 */
router.get('/:categoryId/stories', protect, async (req, res) => {
    try {
        const {categoryId} = req.params;

        // Validate the category ID
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({message: 'Invalid category ID'});
        }

        // Check if the category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({message: 'Category not found'});
        }

        // Fetch stories for the category
        const stories = await Story.find({category: categoryId}).select('name image rating');
        if (!stories.length) {
            return res.status(404).json({message: 'No stories found for this category'});
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
