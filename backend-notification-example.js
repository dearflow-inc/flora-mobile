// backend-notification-example.js
const express = require("express");
const { Expo } = require("expo-server-sdk");
const cron = require("node-cron");

// Load environment variables
require("dotenv").config();

const app = express();
app.use(express.json());

// Create a new Expo SDK client
// Option 1: Without access token (simpler, but less secure)
const expo = new Expo();

// Option 2: With access token (more secure, recommended for production)
// const expo = new Expo({
//   accessToken: process.env.EXPO_ACCESS_TOKEN,
//   useFcmV1: true // Use FCM V1 API for Android
// });

// In-memory storage for demo (use database in production)
const deviceTokens = new Map();

// Endpoint to receive device tokens from mobile app
app.post("/profiles/my/push-tokens", async (req, res) => {
  try {
    const { pushToken, deviceId, platform, isActive } = req.body;

    // Get user ID from auth token (implement your auth logic here)
    const userId = getUserIdFromToken(req.headers.authorization);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Store device token
    deviceTokens.set(userId, {
      pushToken,
      deviceId,
      platform,
      isActive,
      userId,
      createdAt: new Date(),
    });

    console.log(`Device registered for user ${userId}:`, {
      pushToken: pushToken ? pushToken.substring(0, 20) + "..." : "none",
      platform,
      isActive,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Function to send notification to a specific user
async function sendNotificationToUser(userId, notification) {
  const deviceInfo = deviceTokens.get(userId);

  if (!deviceInfo || !deviceInfo.isActive || !deviceInfo.pushToken) {
    console.log(`No active device found for user ${userId}`);
    return;
  }

  // Check that all push tokens are valid Expo push tokens
  if (!Expo.isExpoPushToken(deviceInfo.pushToken)) {
    console.error(
      `Push token ${deviceInfo.pushToken} is not a valid Expo push token`
    );
    return;
  }

  // Construct the notification message
  const message = {
    to: deviceInfo.pushToken,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    badge: notification.badge || 0,
    ttl: notification.ttl || 2419200, // 4 weeks
    priority: notification.priority || "default",
    channelId: "default",
  };

  try {
    // Send the notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    console.log("Notification sent successfully:", tickets);

    // Handle the tickets to check for errors
    const receiptIds = [];
    for (const ticket of tickets) {
      if (ticket.status === "ok") {
        receiptIds.push(ticket.id);
      } else {
        console.error("Error sending notification:", ticket.message);
      }
    }

    // Later, you can check the receipts for delivery status
    if (receiptIds.length > 0) {
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptIdChunks) {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];

          if (receipt.status === "ok") {
            console.log("Notification delivered successfully");
          } else if (receipt.status === "error") {
            console.error(`Error delivering notification: ${receipt.message}`);

            // Handle specific error cases
            if (receipt.details && receipt.details.error) {
              const errorCode = receipt.details.error;

              if (errorCode === "DeviceNotRegistered") {
                // Remove the device token from your database
                deviceTokens.delete(userId);
                console.log(`Removed invalid device token for user ${userId}`);
              }
            }
          }
        }
      }
    }

    return { success: true, tickets };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message };
  }
}

// API endpoint to send notification manually
app.post("/api/send-notification", async (req, res) => {
  try {
    const { userId, title, body, data, badge, priority } = req.body;

    const result = await sendNotificationToUser(userId, {
      title,
      body,
      data,
      badge,
      priority,
    });

    res.json(result);
  } catch (error) {
    console.error("Error in send-notification endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Background task examples
// Send daily reminders
cron.schedule("0 9 * * *", async () => {
  console.log("Sending daily reminders...");

  for (const [userId, deviceInfo] of deviceTokens.entries()) {
    if (deviceInfo.isActive) {
      await sendNotificationToUser(userId, {
        title: "Daily Reminder",
        body: "Don't forget to check your todos today!",
        data: { type: "daily_reminder" },
      });
    }
  }
});

// Send task deadline reminders
async function sendTaskDeadlineReminders() {
  // Query your database for tasks with upcoming deadlines
  // This is pseudocode - replace with your actual database logic
  /*
  const upcomingTasks = await db.query(`
    SELECT user_id, task_title, deadline 
    FROM tasks 
    WHERE deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 HOUR)
    AND notification_sent = false
  `);

  for (const task of upcomingTasks) {
    await sendNotificationToUser(task.user_id, {
      title: 'Task Deadline Approaching',
      body: `"${task.task_title}" is due in 1 hour`,
      data: { 
        type: 'task_deadline',
        taskId: task.id,
        deadline: task.deadline 
      }
    });
    
    // Mark notification as sent
    await db.query('UPDATE tasks SET notification_sent = true WHERE id = ?', [task.id]);
  }
  */
}

// Run deadline reminders every 15 minutes
cron.schedule("*/15 * * * *", sendTaskDeadlineReminders);

// Send email classification notifications
async function sendEmailNotifications() {
  // Example: Send notification when important emails are classified
  /*
  const importantEmails = await db.query(`
    SELECT user_id, email_subject, classification
    FROM emails 
    WHERE classification = 'urgent' 
    AND notification_sent = false
    AND processed_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
  `);

  for (const email of importantEmails) {
    await sendNotificationToUser(email.user_id, {
      title: 'Important Email Received',
      body: `Urgent: ${email.email_subject}`,
      data: { 
        type: 'email_classification',
        emailId: email.id,
        classification: email.classification 
      }
    });
    
    await db.query('UPDATE emails SET notification_sent = true WHERE id = ?', [email.id]);
  }
  */
}

// Check for important emails every 2 minutes
cron.schedule("*/2 * * * *", sendEmailNotifications);

// Utility function to get user ID from auth token
function getUserIdFromToken(authHeader) {
  // Implement your JWT/auth token verification logic here
  // This should match the authentication format your app uses

  if (!authHeader || !authHeader.startsWith("JWT ")) {
    return null;
  }

  try {
    const token = authHeader.split("JWT ")[1];
    const [jwtToken, refreshToken] = token.split(";;;;;");

    // Verify JWT token and extract user ID
    // const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    // return decoded.userId;

    // For demo purposes, return a mock user ID
    return "mock-user-id";
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    activeDevices: deviceTokens.size,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Notification server running on port ${PORT}`);
  console.log("Scheduled tasks:");
  console.log("- Daily reminders: 9:00 AM");
  console.log("- Task deadline checks: Every 15 minutes");
  console.log("- Email notifications: Every 2 minutes");
});

module.exports = app;
