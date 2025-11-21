/**
 * Utility functions for file operations
 */

/**
 * Check if a file object represents a folder
 * @param {Object} file - The file object to check
 * @returns {boolean} - True if the file is a folder, false otherwise
 */
export const isFolder = (file) => {
  if (!file || !file.type) return false;
  return file.type.toLowerCase() === "folder";
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename to parse
 * @returns {string} - The file extension (lowercase, without dot)
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== "string") return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - The file size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === undefined) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val >= 10 ? 0 : 1)} ${sizes[i]}`;
};
