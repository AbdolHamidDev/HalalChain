import { Queue, Worker, Job } from "bullmq";

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

// BullMQ connection options (BullMQ uses its own ioredis instance)
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isUpstash = redisUrl.includes("upstash.io");

const queueConnection = {
  host: isUpstash ? new URL(redisUrl).hostname : "localhost",
  port: isUpstash ? parseInt(new URL(redisUrl).port) : 6379,
  password: isUpstash ? new URL(redisUrl).password : undefined,
  tls: isUpstash ? {} : undefined,
};

export const shipmentTrackingQueue = new Queue<ShipmentTrackingJob>("shipment-tracking", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
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
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
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
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
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
      return { success: true };
    },
    { connection: queueConnection }
  );

  const notificationWorker = new Worker<NotificationJob>(
    "notifications",
    async (job: Job<NotificationJob>) => {
      console.log(`[NotificationWorker] Processing job ${job.id}:`, job.data);
      return { success: true };
    },
    { connection: queueConnection }
  );

  const emailWorker = new Worker<EmailJob>(
    "emails",
    async (job: Job<EmailJob>) => {
      console.log(`[EmailWorker] Processing job ${job.id}:`, job.data);
      return { success: true };
    },
    { connection: queueConnection }
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
