const { supabase } = require('../config/db');

/**
 * Creates a notification for a user.
 * This is non-blocking — call without await in route handlers.
 *
 * @param {Object} opts
 * @param {string} opts.userId   - UUID of the recipient
 * @param {string} opts.type     - 'order_placed' | 'order_delivered' | 'order_completed' | 'order_disputed' | 'review_received'
 * @param {string} opts.title    - Short heading
 * @param {string} opts.body     - Detail text
 * @param {string} opts.link     - Frontend route e.g. '/orders/:id'
 */
async function createNotification({ userId, type, title, body, link }) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || '',
      link: link || '',
      is_read: false,
    });
    if (error) console.error('[Notification] Insert error:', error.message);
  } catch (err) {
    console.error('[Notification] Unexpected error:', err.message);
  }
}

module.exports = createNotification;
