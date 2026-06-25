const express = require('express');
const router = express.Router();
const { createGroup, getAllGroups, joinGroup, leaveGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createGroup);
router.get('/', protect, getAllGroups);
router.put('/:id/join', protect, joinGroup);
router.put('/:id/leave', protect, leaveGroup);

module.exports = router;