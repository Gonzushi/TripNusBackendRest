import { Router, Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";
import os from "os";
import supabase from "../supabaseClient";
import { redis, publisher } from "../index";

// Load package.json once
const packageJsonPath = path.resolve(__dirname, "../../package.json");
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  // Check Supabase health
  let supabaseStatus = "unknown";
  try {
    const { error } = await supabase.from("users").select("*").limit(1);
    supabaseStatus = error ? "unreachable" : "reachable";
  } catch {
    supabaseStatus = "unreachable";
  }

  // Check Redis health
  let redisStatus = "unknown";

  try {
    const pong = await redis.ping();
    redisStatus = pong === "PONG" ? "reachable" : "unreachable";
  } catch {
    redisStatus = "unreachable";
  }

  // Gather system metrics
  const mem = process.memoryUsage();
  const load = os.loadavg();
  const cpu = process.cpuUsage();
  const freemem = os.freemem();
  const totalmem = os.totalmem();

  // Build response object
  const response = {
    status: "ok",
    service: packageData.name,
    version: packageData.version,
    description: packageData.description,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",

    database: {
      supabase: supabaseStatus,
    },

    services: {
      redis: redisStatus,
      paymentGateway: "not implemented", // Add your payment gateway check here if needed
    },

    deployment: {
      gitCommit: process.env.GIT_COMMIT || "unknown",
      buildTime: process.env.BUILD_TIME || "unknown",
      port: process.env.PORT || "unknown",
      timezone:
        process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },

    node: {
      version: process.version,
      memoryUsageMB: {
        rss: +(mem.rss / 1024 / 1024).toFixed(1),
        heapTotal: +(mem.heapTotal / 1024 / 1024).toFixed(1),
        heapUsed: +(mem.heapUsed / 1024 / 1024).toFixed(1),
      },
      cpuUsageMicros: {
        user: cpu.user,
        system: cpu.system,
      },
    },

    system: {
      hostname: os.hostname(),
      platform: process.platform,
      arch: process.arch,
      loadavg: {
        "1min": +load[0].toFixed(2),
        "5min": +load[1].toFixed(2),
        "15min": +load[2].toFixed(2),
      },
      memoryMB: {
        free: +(freemem / 1024 / 1024).toFixed(1),
        total: +(totalmem / 1024 / 1024).toFixed(1),
      },
      cpus: os.cpus().length,
      uptimeSeconds: os.uptime(),
    },

    process: {
      pid: process.pid,
      title: process.title,
      nodeEnv: process.env.NODE_ENV,
    },

    dependencies:
      process.env.NODE_ENV !== "production"
        ? packageData.dependencies || {}
        : {
            express: packageData.dependencies?.express || "unknown",
            "@supabase/supabase-js":
              packageData.dependencies?.["@supabase/supabase-js"] || "unknown",
          },

    devDependencies:
      process.env.NODE_ENV !== "production"
        ? packageData.devDependencies || {}
        : undefined,
  };

  const prettyJson = JSON.stringify(response, null, 2);

  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(prettyJson);
});

export default router;
