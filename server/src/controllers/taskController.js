const Task = require('../models/Task');
const { encrypt } = require('../utils/encryption');

// @desc    Get all tasks for current user (with pagination, filter, search)
// @route   GET /api/tasks
exports.getTasks = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

        // Build query — scoped to current user only
        const query = { user: req.user._id };

        // Filter by status
        if (status && ['todo', 'in-progress', 'done'].includes(status)) {
            query.status = status;
        }

        // Search by title (case-insensitive)
        if (search && search.trim()) {
            query.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }

        // Execute query with pagination
        const [tasks, total] = await Promise.all([
            Task.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Task.countDocuments(query),
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            data: encrypt({
                tasks,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalTasks: total,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                },
            }),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).lean();

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        res.status(200).json({
            success: true,
            data: encrypt(task),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, status } = req.body;

        const task = await Task.create({
            title,
            description,
            status,
            user: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: encrypt(task.toObject()),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
    try {
        const { title, description, status } = req.body;

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { title, description, status },
            { new: true, runValidators: true }
        ).lean();

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: encrypt(task),
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
