import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";

export interface ShipmentTrackingJob {
  shipmentId: string;
  status: string;
  location?: string;
  notes?: string;
}

export interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
}

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
}

export const shipmentTrackingQueue = new Queue<ShipmentTrackingJob>("shipment-tracking", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

export const notificationQueue = new Queue<NotificationJob>("notifications", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

export const emailQueue = new Queue<EmailJob>("emails", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

export const startWorkers = () => {
  const shipmentWorker = new Worker<ShipmentTrackingJob>(
    "shipment-tracking",
    async (job: Job<ShipmentTrackingJob>) => {
      console.log(`[ShipmentWorker] Processing job ${job.id}:`, job.data);
      // Process shipment tracking update
      // In production: update Redis, broadcast via WebSocket, etc.
      return { success: true };
    },
    { connection: redis }
  );

  const notificationWorker = new Worker<NotificationJob>(
    "notifications",
    async (job: Job<NotificationJob>) => {
      console.log(`[NotificationWorker] Processing job ${job.id}:`, job.data);
      // Process notification: save to DB, broadcast via WebSocket, etc.
      return { success: true };
    },
    { connection: redis }
  );

  const emailWorker = new Worker<EmailJob>(
    "emails",
    async (job: Job<EmailJob>) => {
      console.log(`[EmailWorker] Processing job ${job.id}:`, job.data);
      // Process email: send via nodemailer/resend
      return { success: true };
    },
    { connection: redis }
  );

  shipmentWorker.on("completed", (job) => {
    console.log(`[ShipmentWorker] Job ${job.id} completed`);
  });

  shipmentWorker.on("failed", (job, err) => {
    console.error(`[ShipmentWorker] Job ${job?.id} failed:`, err);
  });

  notificationWorker.on("completed", (job) => {
    console.log(`[NotificationWorker] Job ${job.id} completed`);
  });

  notificationWorker.on("failed", (job, err) => {
    console.error(`[NotificationWorker] Job ${job?.id} failed:`, err);
  });

  emailWorker.on("completed", (job) => {
    console.log(`[EmailWorker] Job ${job.id} completed`);
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err);
  });

  return { shipmentWorker, notificationWorker, emailWorker };
};

export const addShipmentTrackingJob = async (data: ShipmentTrackingJob) => {
  return shipmentTrackingQueue.add("update", data, {
    jobId: `shipment:${data.shipmentId}:${Date.now()}`,
  });
};

export const addNotificationJob = async (data: NotificationJob) => {
  return notificationQueue.add("send", data);
};

export const addEmailJob = async (data: EmailJob) => {
  return emailQueue.add("send", data);
};