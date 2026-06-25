const Message = require('../models/Message');

// Get messages for a group
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save a new message
exports.saveMessage = async (groupId, senderId, senderName, text) => {
  try {
    const message = await Message.create({
      group: groupId,
      sender: senderId,
      senderName,
      text,
    });
    return message;
  } catch (error) {
    console.error('Error saving message:', error.message);
  }
};