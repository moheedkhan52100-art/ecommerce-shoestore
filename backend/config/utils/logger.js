const AdminLog = require("../models/AdminLog");

/**
 * Log an administrative action to MongoDB.
 * @param {Object} params
 * @param {string} [params.adminEmail]
 * @param {string} params.action
 * @param {string} params.description
 * @param {string} [params.targetType]
 * @param {string} [params.targetId]
 * @param {Object} [params.metadata]
 */
const logAdminAction = async ({
  adminEmail = "Admin",
  action,
  description,
  targetType = "System",
  targetId = "",
  metadata = {}
}) => {
  try {
    const log = await AdminLog.create({
      adminEmail,
      action,
      description,
      targetType,
      targetId: targetId ? String(targetId) : "",
      metadata
    });
    return log;
  } catch (error) {
    console.error("Failed to write admin log:", error.message);
    return null;
  }
};

module.exports = {
  logAdminAction
};
