import { SCORE_THRESHOLDS, QUALITY_LABELS } from '../constants/scoreThresholds';

/**
 * Get color classes based on score for text elements
 * @param {number} score - Quality score (0-100)
 * @returns {string} Tailwind CSS classes
 */
export const getScoreColor = (score) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600 dark:text-green-400';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-blue-600 dark:text-blue-400';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

/**
 * Get background and border color classes based on score
 * @param {number} score - Quality score (0-100)
 * @returns {string} Tailwind CSS classes
 */
export const getScoreBgColor = (score) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
  }
  return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
};

/**
 * Get combined score color classes (text + background)
 * @param {number} score - Quality score (0-100)
 * @returns {string} Tailwind CSS classes
 */
export const getScoreColorClasses = (score) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
  }
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
};

/**
 * Get badge background color based on score
 * @param {number} score - Quality score (0-100)
 * @returns {string} Tailwind CSS classes
 */
export const getScoreBadgeColor = (score) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'bg-green-600 dark:bg-green-500';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'bg-blue-600 dark:bg-blue-500';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'bg-yellow-600 dark:bg-yellow-500';
  return 'bg-red-600 dark:bg-red-500';
};

/**
 * Get quality label based on score
 * @param {number} score - Quality score (0-100)
 * @returns {string} Quality label
 */
export const getScoreLabel = (score) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return QUALITY_LABELS.EXCELLENT;
  if (score >= SCORE_THRESHOLDS.GOOD) return QUALITY_LABELS.GOOD;
  if (score >= SCORE_THRESHOLDS.FAIR) return QUALITY_LABELS.FAIR;
  return QUALITY_LABELS.POOR;
};

/**
 * Get quality category based on score
 * @param {number} score - Quality score (0-100)
 * @returns {string} Category key (excellent, good, fair, poor)
 */
export const getScoreCategory = (score) => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'good';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'fair';
  return 'poor';
};

/**
 * Calculate circular progress offset for SVG
 * @param {number} score - Quality score (0-100)
 * @param {number} radius - Circle radius
 * @returns {number} Stroke dash offset
 */
export const getCircularProgressOffset = (score, radius = 70) => {
  const circumference = 2 * Math.PI * radius;
  return circumference - (score / 100) * circumference;
};
