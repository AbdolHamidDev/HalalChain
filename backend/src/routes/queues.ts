import { Router } from "express";
import { shipmentTrackingQueue, notificationQueue, emailQueue } from "../lib/queue";
import { authorize } from "../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

/**
 * GET /api/admin/queues
 * Get status of all queues - ADMIN only
 */
router.get("/queues", authorize(UserRole.ADMIN), async (_req, res) => {
  try {
    const [shipmentStats, notificationStats, emailStats] = await Promise.all([
      shipmentTrackingQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
      emailQueue.getJobCounts(),
    ]);

    res.json({
      queues: {
        "shipment-tracking": shipmentStats,
        notifications: notificationStats,
        emails: emailStats,
      },
    });
  } catch (error) {
    console.error("Failed to get queue stats:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get queue stats",
    });
  }
});

/**
 * GET /api/admin/queues/:name
 * Get status of a specific queue - ADMIN only
 */
router.get("/queues/:name", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const queueName = req.params.name;
    let queue;

    switch (queueName) {
      case "shipment-tracking":
        queue = shipmentTrackingQueue;
        break;
      case "notifications":
        queue = notificationQueue;
        break;
      case "emails":
        queue = emailQueue;
        break;
      default:
        return res.status(404).json({ error: "Queue not found" });
    }

    const stats = await queue.getJobCounts();
    res.json({ queue: queueName, stats });
  } catch (error) {
    console.error("Failed to get queue stats:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get queue stats",
    });
  }
});

/**
 * POST /api/admin/queues/:name/retry
 * Retry failed jobs in a queue - ADMIN only
 */
router.post("/queues/:name/retry", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const queueName = req.params.name;
    let queue;

    switch (queueName) {
      case "shipment-tracking":
        queue = shipmentTrackingQueue;
        break;
      case "notifications":
        queue = notificationQueue;
        break;
      case "emails":
        queue = emailQueue;
        break;
      default:
        return res.status(404).json({ error: "Queue not found" });
    }

    // Get failed jobs
    const failedJobs = await queue.getFailed(0, 100);
    let retriedCount = 0;

    for (const job of failedJobs) {
      await job.retry();
      retriedCount++;
    }

    res.json({
      message: "Failed jobs retried successfully",
      retriedCount,
    });
  } catch (error) {
    console.error("Failed to retry jobs:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to retry jobs",
    });
  }
});

/**
 * POST /api/admin/queues/:name/purge
 * Purge completed jobs from a queue - ADMIN only
 */
router.post("/queues/:name/purge", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const queueName = req.params.name;
    let queue;

    switch (queueName) {
      case "shipment-tracking":
        queue = shipmentTrackingQueue;
        break;
      case "notifications":
        queue = notificationQueue;
        break;
      case "emails":
        queue = emailQueue;
        break;
      default:
        return res.status(404).json({ error: "Queue not found" });
    }

    await queue.clean(0, 0, "completed");
    await queue.clean(0, 0, "failed");

    res.json({
      message: "Queue purged successfully",
      queue: queueName,
    });
  } catch (error) {
    console.error("Failed to purge queue:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to purge queue",
    });
  }
});

/**
 * GET /api/admin/queues/:name/jobs
 * Get jobs from a queue - ADMIN only
 */
router.get("/queues/:name/jobs", authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const queueName = req.params.name;
    const status = req.query.status as string || "waiting";
    const limit = parseInt(req.query.limit as string) || 20;

    let queue;
    switch (queueName) {
      case "shipment-tracking":
        queue = shipmentTrackingQueue;
        break;
      case "notifications":
        queue = notificationQueue;
        break;
      case "emails":
        queue = emailQueue;
        break;
      default:
        return res.status(404).json({ error: "Queue not found" });
    }

    let jobs;
    switch (status) {
      case "waiting":
        jobs = await queue.getWaiting(0, parseInt(req.query.limit as string) || 20);
        break;
      case "active":
        jobs = await queue.getActive(0, parseInt(req.query.limit as string) || 20);
        break;
      case "completed":
        jobs = await queue.getCompleted(0, parseInt(req.query.limit as string) || 20);
        break;
      case "failed":
        jobs = await queue.getFailed(0, parseInt(req.query.limit as string) || 20);
        break;
      default:
        jobs = await queue.getWaiting(0, parseInt(req.query.limit as string) || 20);
    }

    const jobData = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }));

    res.json({
      queue: queueName,
      status,
      jobs: jobData,
    });
  } catch (error) {
    console.error("Failed to get jobs:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get jobs",
    });
  }
});

export default router;