const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const { taskValidation } = require('../validation'); // Add validation if not exists

// Helper function for error responses
const errorResponse = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message
  });
};

// Get all tasks for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .select('-__v') // Exclude version key
      .sort({ createdAt: -1 }); // Newest first
    
    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    errorResponse(res, 500, 'Server error fetching tasks');
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    // Validate input
    const { error } = taskValidation(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    const task = new Task({
      user: req.user.id,
      title: req.body.title,
      description: req.body.description || '',
      completed: req.body.completed || false
    });

    const savedTask = await task.save();
    res.status(201).json({
      success: true,
      task: {
        id: savedTask._id,
        title: savedTask.title,
        description: savedTask.description,
        completed: savedTask.completed,
        createdAt: savedTask.createdAt
      }
    });
  } catch (err) {
    console.error('Create task error:', err);
    errorResponse(res, 500, 'Server error creating task');
  }
});

// Update task
router.patch('/:id', auth, async (req, res) => {
  try {
    // Validate input
    const { error } = taskValidation(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!task) return errorResponse(res, 404, 'Task not found');

    // Update allowed fields
    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.completed !== undefined) updates.completed = req.body.completed;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      task: updatedTask
    });
  } catch (err) {
    console.error('Update task error:', err);
    errorResponse(res, 500, 'Server error updating task');
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!task) return errorResponse(res, 404, 'Task not found');

    res.json({
      success: true,
      message: 'Task deleted successfully',
      deletedId: req.params.id
    });
  } catch (err) {
    console.error('Delete task error:', err);
    errorResponse(res, 500, 'Server error deleting task');
  }
});

module.exports = router;