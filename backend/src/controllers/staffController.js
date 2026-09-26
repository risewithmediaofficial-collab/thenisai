import { Staff } from '../models/index.js';

export async function getStaff(req, res) {
  try {
    const staffList = await Staff.find({}, { password: 0 });
    return res.json({ success: true, staff: staffList });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch staff list.' });
  }
}

export async function createStaff(req, res) {
  try {
    const { username, password, name, title, role, counter } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'username, password, name and role are required.' });
    }
    if (!['admin', 'cashier'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or cashier.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    const existing = await Staff.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Username "${username}" is already taken.` });
    }

    const count = await Staff.countDocuments();
    const newId = `staff-${count + 10}-${Date.now().toString(36)}`;

    const newStaff = await Staff.create({
      id: newId,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      name: name.trim(),
      title: title?.trim() || (role === 'admin' ? 'Store Administrator' : 'Counter Cashier'),
      role,
      counter: counter?.trim() || (role === 'cashier' ? 'Counter Desk' : 'Admin Office'),
    });

    console.log(`[Staff] ✓ Created: ${newStaff.name} (${newStaff.role}) by ${req.adminUser.name}`);
    return res.status(201).json({
      success: true,
      message: `Staff account for ${newStaff.name} created successfully.`,
      staff: { id: newStaff.id, username: newStaff.username, name: newStaff.name, title: newStaff.title, role: newStaff.role, counter: newStaff.counter },
    });
  } catch (err) {
    console.error('[Staff] Create error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create staff account.' });
  }
}

export async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const { name, title, role, counter, password, username } = req.body;

    const staff = await Staff.findOne({ id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff account not found.' });

    if (staff.id === 'staff-1' && role && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot change the role of the primary admin account.' });
    }

    if (name?.trim()) staff.name = name.trim();
    if (title?.trim()) staff.title = title.trim();
    if (counter?.trim()) staff.counter = counter.trim();
    if (role && ['admin', 'cashier'].includes(role)) staff.role = role;
    if (password?.trim() && password.trim().length >= 4) staff.password = password.trim();
    if (username?.trim() && staff.id !== 'staff-1') {
      const conflict = await Staff.findOne({ username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }, id: { $ne: id } });
      if (conflict) return res.status(409).json({ success: false, message: `Username "${username}" is already taken.` });
      staff.username = username.trim().toLowerCase();
    }

    await staff.save();
    console.log(`[Staff] ✏️  Updated: ${staff.name} (${staff.role}) by ${req.adminUser.name}`);
    return res.json({
      success: true,
      message: `${staff.name}'s account updated successfully.`,
      staff: { id: staff.id, username: staff.username, name: staff.name, title: staff.title, role: staff.role, counter: staff.counter },
    });
  } catch (err) {
    console.error('[Staff] Update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update staff account.' });
  }
}

export async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    if (id === 'staff-1' || id === 'staff-2') {
      return res.status(403).json({ success: false, message: 'Built-in staff accounts cannot be deleted.' });
    }
    if (id === req.adminUser.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const staff = await Staff.findOne({ id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff account not found.' });

    await Staff.deleteOne({ id });
    console.log(`[Staff] 🗑️  Deleted: ${staff.name} (${staff.role}) by ${req.adminUser.name}`);
    return res.json({ success: true, message: `${staff.name}'s account has been removed.` });
  } catch (err) {
    console.error('[Staff] Delete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete staff account.' });
  }
}
