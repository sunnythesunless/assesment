const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            minlength: [1, 'Title cannot be empty'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
            default: '',
        },
        status: {
            type: String,
            enum: {
                values: ['todo', 'in-progress', 'done'],
                message: 'Status must be todo, in-progress, or done',
            },
            default: 'todo',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user-scoped queries with status filter
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
