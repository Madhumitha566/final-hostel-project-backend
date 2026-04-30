import Maintenance from '../models/Maintenance.js';
import User from '../models/User.js';

/**
 * TENANT: Submit a new maintenance request
 * Default status: 'Pending'
 */
export const addRequest = async (req, res) => {
  try {
    const { issueType, description, priority } = req.body;
    const newRequest = new Maintenance({
      tenantId: req.user._id,
      roomId: req.user.currentRoom, // Assuming this is stored in User session
      issueType,
      description,
      priority: priority || 'Medium'
    });
    await newRequest.save();
    res.status(201).json({ success: true, message: "Request Submitted Successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ADMIN: Get all requests and the list of staff members
 */
export const getAdminData = async (req, res) => {
  try {
    const requests = await Maintenance.find()
    .populate({
        path: 'tenantId',
        select: 'name',
        populate: { path: 'currentRoom', select: 'roomnumber' } // Deep populate backup
      })
      .populate('roomId', 'roomnumber') // Primary populate
      .populate('assignedStaff', 'name')
      .sort({ createdAt: -1 });

    const staff = await User.find({ role: 'Staff' }).select('name');
    
    res.json({ success: true, requests, staff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ADMIN: Assign a staff member to a request
 * Logic: Changes status from 'Pending' to 'Assigned'
 */
export const assignStaff = async (req, res) => {
  try {
    const { requestId, staffId } = req.body;

    const updatedTask = await Maintenance.findByIdAndUpdate(
      requestId,
      { 
        assignedStaff: staffId, 
        status: 'Assigned' 
      },
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ success: false, message: "Task not found" });

    res.json({ success: true, message: "Staff assigned and status set to Assigned" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * STAFF: Update task status (In Progress or Resolved)
 * Logic: Restricted to the staff member assigned to the task
 */
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'In Progress' or 'Resolved'

    // Verify the status is valid based on your Mongoose Enum
    const validStatuses = ['In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status update" });
    }

    const task = await Maintenance.findById(id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Optional: Security check to ensure the logged-in staff is the one assigned
    if (task.assignedStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: This task is not assigned to you" });
    }

    task.status = status;
    await task.save();

    res.json({ success: true, message: `Task marked as ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * STAFF: Get tasks assigned specifically to the logged-in staff
 */
export const getStaffTasks = async (req, res) => {
  try {
    const tasks = await Maintenance.find({ 
      assignedStaff: req.user._id,
      status: { $ne: 'Resolved' } // Only show tasks that aren't finished yet
    })
    .populate('tenantId', 'name phone')
    .populate('roomId', 'roomnumber')
    .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * TENANT: Get my own submitted requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Maintenance.find({ tenantId: req.user._id })
      .populate('roomId', 'roomnumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};