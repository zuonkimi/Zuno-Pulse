const User = require('../models/User');
const Follow = require('../models/Follow');
const taskService = require('./task.service');

class UserService {
  async getUsersWithFollowState(currentUserId) {
    const users = await User.find({ _id: { $ne: currentUserId } }).lean();
    const following = await Follow.find({ follower: currentUserId }).lean();
    const followingIds = following.map(f => f.following.toString());
    return users.map(user => ({
      ...user,
      isFollowing: followingIds.includes(user._id.toString()),
    }));
  }

  async getProfilePage(viewerId, profileUserId, keyword) {
    const user = await User.findById(profileUserId).lean();
    if (!user) return null;
    const viewer = await User.findById(viewerId).lean();
    // Lấy tasks của profile
    const tasksData = await taskService.getTasksPage(
      profileUserId,
      { keyword },
      'profile',
    );
    const followersCount = await Follow.countDocuments({
      following: profileUserId,
    });
    const followingCount = await Follow.countDocuments({
      follower: profileUserId,
    });
    const isFollowing = await Follow.exists({
      follower: viewerId,
      following: profileUserId,
    });
    return {
      user,
      viewer: {
        _id: viewer?._id,
        role: viewer?.role,
      },
      posts: tasksData.tasks,
      isFollowing: !!isFollowing,
      isOwner: String(viewerId) === String(profileUserId),
      stats: {
        total: tasksData.tasks.length,
        done: tasksData.tasks.filter(t => t.status === 'done').length,
        followers: followersCount,
        following: followingCount,
      },
    };
  }

  async getEditProfilePage(viewerId, userId) {
    if (String(viewerId) !== String(userId)) return null;
    return await User.findById(userId).lean();
  }

  async updateProfilePage(viewerId, userId, updateData, file) {
    if (String(viewerId) !== String(userId)) return false;
    const user = await User.findById(userId);
    if (!user) return false;
    user.name = updateData.name || updateData.fullname || user.name;
    user.bio = updateData.bio !== undefined ? updateData.bio : user.bio;
    if (file) {
      user.avatar = `/uploads/${file.filename}`;
    }
    await user.save();
    return true;
  }

  async search(queryData, viewerId) {
    let keyword = (queryData.keyword || '').toString().trim();
    const meaningful = keyword.replace(/[^\p{L}\p{N}]/gu, '').trim();
    if (meaningful.length < 2) {
      return { tasks: [], users: [], keyword };
    }
    // Search users
    const users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } },
      ],
    })
      .limit(10)
      .lean();
    // Search tasks
    const tasksData = await taskService.getTasksPage(viewerId, { keyword });
    return {
      tasks: tasksData.tasks,
      users,
      keyword,
    };
  }
}

module.exports = new UserService();
