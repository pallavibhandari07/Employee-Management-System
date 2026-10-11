import express from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';

const router = express.Router();

// Helper: validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/employees - Get all employees
router.get('/', async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const filter = {};

    if (department && department !== 'All') {
      filter.department = department;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { role: searchRegex },
        { department: searchRegex }
      ];
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees',
      error: error.message
    });
  }
});

// GET /api/employees/:id - Get single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// POST /api/employees - Create new employee
router.post('/', async (req, res) => {
  try {
    const { name, email, role, department, salary, status } = req.body;

    // Check for existing email manually for clear error message
    if (email) {
      const existing = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists'
        });
      }
    }

    const employee = new Employee({
      name,
      email,
      role,
      department,
      salary,
      status: status || 'Active'
    });

    const savedEmployee = await employee.save();
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: savedEmployee
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    // Handle Mongoose CastError (invalid data types, e.g. salary: "abc")
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value provided for field: ${error.path}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    });
  }
});

// PUT /api/employees/:id - Update existing employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    const { name, email, role, department, salary, status } = req.body;

    // Check for email collision with other employees
    if (email) {
      const existing = await Employee.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists'
        });
      }
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        name,
        email,
        role,
        department,
        salary,
        status
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    // Handle Mongoose CastError (invalid data types, e.g. salary: "abc")
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value provided for field: ${error.path}`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    });
  }
});

// DELETE /api/employees/:id - Delete an employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Employee "${deletedEmployee.name}" deleted successfully`,
      data: deletedEmployee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee',
      error: error.message
    });
  }
});

export default router;
