const Group = require('../models/Group');

// Create a group
exports.createGroup = async (req, res) => {
  const { name, description, course, maxMembers } = req.body;
  try {
    const group = await Group.create({
      name, description, course,
      maxMembers: maxMembers || 10,
      creator: req.user._id,
      members: [req.user._id],
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'name email')
      .populate('members', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join a group
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.members.includes(req.user._id))
      return res.status(400).json({ message: 'Already a member' });

    if (group.members.length >= group.maxMembers)
      return res.status(400).json({ message: 'Group is full' });

    group.members.push(req.user._id);
    await group.save();
    res.json({ message: 'Joined successfully', group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(
      m => m.toString() !== req.user._id.toString()
    );
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};