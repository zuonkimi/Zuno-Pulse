const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const notificationService = require('./notification.service');
const { connectRedis, safeDel } = require('./redis.service');

const canAccessTask = (taskId, user) => {
  if (!user) throw new Error('Unauthorized');
  if (user.role === 'admin') {
    return { _id: taskId };
  }
  return {
    _id: taskId,
    author: user._id,
  };
};

const enrichTasks = async (tasks, userId) => {
  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;
  const commentCounts = await Comment.aggregate([
    {
      $match: {
        isDeleted: false,
        taskId: { $ne: null },
        parentId: null,
      },
    },
    {
      $group: {
        _id: '$taskId',
        count: { $sum: 1 },
      },
    },
  ]);

  const commentMap = {};
  commentCounts.forEach(item => {
    if (item?._id) commentMap[String(item._id)] = item.count;
  });
  return tasks.map(task => {
    const obj = task.toObject ? task.toObject() : task;
    const deadline = obj.deadline ? new Date(obj.deadline).getTime() : null;
    return {
      ...obj,
      isOverdue: deadline && deadline < now && obj.status !== 'done',
      isSoon:
        deadline &&
        deadline > now &&
        (deadline - now) / DAY <= 3 &&
        obj.status !== 'done',
      isLiked:
        userId &&
        Array.isArray(obj.likes) &&
        obj.likes.some(id => String(id) === String(userId)),
      commentCount: commentMap[String(obj._id)] || 0,
    };
  });
};

const buildQuery = (viewerId, filters = {}, options = {}) => {
  const keyword = filters.keyword;
  let status = filters.status || filters.filter;
  const tags = filters.tags;
  const { mode = 'user', targetUserId, followingIds = [] } = options;
  const query = {};
  query.deleted = mode === 'trash';
  const isAdminMode = mode === 'admin';
  if (!isAdminMode) {
    if (mode === 'profile' && targetUserId) {
      query.author = targetUserId;
    } else if (mode === 'feed') {
      query.author = { $in: [viewerId, ...followingIds] };
    } else if (mode === 'trash') {
      query.author = viewerId;
    } else {
      query.author = viewerId;
    }
  }

  const trimmedKeyword = keyword ? keyword.toString().trim() : '';
  const meaningfulKeyword = trimmedKeyword
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();
  if (meaningfulKeyword.length >= 2) {
    query.$or = [
      { title: { $regex: trimmedKeyword, $options: 'i' } },
      { description: { $regex: trimmedKeyword, $options: 'i' } },
      { tags: { $regex: trimmedKeyword, $options: 'i' } },
    ];
    return query;
  }
  if (status) {
    if (status === 'done' || status === 'pending') {
      query.status = status;
    }
  }
  if (tags) {
    const tagArray = [].concat(tags).filter(Boolean);
    if (tagArray.length) {
      query.tags = { $in: tagArray };
    }
  }
  return query;
};

class TaskService {
  // CREATE
  async createTask(userId, data) {
    const task = await Task.create({
      ...data,
      author: userId,
      deleted: false,
    });
    await safeDel(`tasks:${userId}`);
    const followers = await Follow.find({
      following: userId,
    }).select('follower');
    for (const follow of followers) {
      await notificationService.createNotification({
        recipient: follow.follower,
        sender: userId,
        type: 'new_task',
        task: task._id,
      });
    }
    return task;
  }

  // UPDATE
  async updateTask(taskId, userId, data, user) {
    const query = canAccessTask(taskId, user);
    const result = await Task.updateOne(query, data);
    await safeDel(`tasks:${userId}`);
    return result.modifiedCount > 0;
  }

  // DELETE
  async deleteTask(taskId, userId, soft = true, user) {
    const query = canAccessTask(taskId, user);
    if (soft) {
      await Task.updateOne(query, { deleted: true });
    } else {
      await Task.deleteOne(query);
    }
    await safeDel(`tasks:${userId}`);
  }

  // RESTORE
  async restoreTask(taskId, userId, user) {
    const query = canAccessTask(taskId, user);
    await Task.updateOne(query, { deleted: false });
    await safeDel(`tasks:${userId}`);
  }

  // TOGGLE STATUS
  async toggleStatus(taskId, userId, user) {
    const query = canAccessTask(taskId, user);
    const task = await Task.findOne(query);
    if (!task) return null;
    task.status = task.status === 'done' ? 'pending' : 'done';
    await task.save();
    await safeDel(`tasks:${userId}`);
    return task.status;
  }

  // LIKE
  async toggleLike(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    const isLiked = task.likes.some(id => id.toString() === userId.toString());
    if (isLiked) {
      task.likes = task.likes.filter(id => id.toString() !== userId.toString());
      task.likeCount = Math.max(0, task.likeCount - 1);
    } else {
      task.likes.push(userId);
      task.likeCount += 1;
      await notificationService.createNotification({
        recipient: task.author,
        sender: userId,
        type: 'like_task',
        task: task._id,
      });
    }
    await task.save();
    return { liked: !isLiked, likeCount: task.likeCount };
  }

  async getTasksPage(userId, filters = {}, mode = 'user') {
    let options = { mode };
    if (mode === 'profile') {
      options.targetUserId = userId;
    }
    if (mode === 'feed') {
      const followingIds = await this.getFollowingIds(userId);
      options.followingIds = followingIds;
    }
    const query = buildQuery(userId, filters, options);
    const tasks = await Task.find(query)
      .populate('author')
      .sort({ createdAt: -1 })
      .lean();
    const enriched = await enrichTasks(tasks, userId);
    const statusFilter = filters.status || filters.filter;
    let result = enriched;
    if (statusFilter === 'overdue') {
      result = enriched.filter(task => task.isOverdue);
    } else if (statusFilter === 'soon') {
      result = enriched.filter(task => task.isSoon);
    }
    return {
      tasks: result,
      filters,
    };
  }

  async getHomePageData(userId) {
    await connectRedis();
    const followingIds = await this.getFollowingIds(userId);
    const visibleUserIds = [userId, ...followingIds];
    const query = buildQuery(
      userId,
      {},
      {
        mode: 'feed',
        followingIds,
      },
    );
    const tasks = await Task.find(query)
      .populate('author')
      .sort({ createdAt: -1 })
      .lean();
    const enriched = await enrichTasks(tasks, userId);
    const allTasks = await Task.find({
      author: { $in: visibleUserIds },
      deleted: false,
    }).lean();
    const enrichedStatsTasks = await enrichTasks(allTasks, userId);
    return {
      tasks: enriched,
      stats: {
        total: enrichedStatsTasks.length,
        done: enrichedStatsTasks.filter(t => t.status === 'done').length,
        overdue: enrichedStatsTasks.filter(t => t.isOverdue).length,
        soon: enrichedStatsTasks.filter(t => t.isSoon).length,
        trash: await Task.countDocuments({
          author: { $in: visibleUserIds },
          deleted: true,
        }),
      },
    };
  }

  // DETAIL
  async getDetail(taskId, userId) {
    const task = await Task.findOne({
      _id: taskId,
      deleted: false,
    })
      .populate('author')
      .lean();
    if (!task) return null;
    return (await enrichTasks([task], userId))[0];
  }

  async getFollowingIds(userId) {
    const follows = await Follow.find({
      follower: userId,
    })
      .select('following')
      .lean();
    return follows.map(follow => follow.following);
  }

  async getTrash(userId, mode = 'user') {
    const query = {
      deleted: true,
    };
    if (mode !== 'admin') {
      query.author = userId;
    }
    const tasks = await Task.find(query)
      .populate('author')
      .sort({ updatedAt: -1 })
      .lean();
    return {
      tasks: await enrichTasks(tasks, userId),
    };
  }
}

module.exports = new TaskService();
