const express = require('express');
const { body, param, query } = require('express-validator');
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All task routes are protected
router.use(auth);

// Validation rules
const taskValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('status')
        .optional()
        .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done'),
];

const idValidation = [
    param('id').isMongoId().withMessage('Invalid task ID'),
];

router.get('/', getTasks);
router.get('/:id', idValidation, validate, getTask);
router.post('/', taskValidation, validate, createTask);
router.put('/:id', [...idValidation, ...taskValidation], validate, updateTask);
router.delete('/:id', idValidation, validate, deleteTask);

module.exports = router;
