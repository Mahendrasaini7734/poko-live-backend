const express = require("express");
const app = express();

const cors = require("cors");

app.use(cors());

app.options("*", cors());

const {
  startEmailCampaignCron
} = require("./cron/emailCampaign.cron");

app.use(express.urlencoded({ extended: true }));

app.use(
  express.json({
    type: ["application/json"],
    // raw bytes are needed to verify the Razorpay webhook signature
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.includes("/coinPlan/razorpay/webhook")) req.rawBody = buf;
    },
  })
);



const logger = require("morgan");
app.use(logger("dev"));

const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: ".env" });

const http = require("http");
const server = http.createServer(app);

// pingInterval/pingTimeout: a mobile client in a tunnel / switching networks is declared dead after
// interval+timeout (default 25s+20s). 25s+40s tolerates normal network changes; the host additionally
// gets LIVE_DISCONNECT_GRACE_SECONDS before its live is ended (see services/liveSocketHandlers.js).
global.io = require("socket.io")(server, {
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL_MS) || 25000,
  pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT_MS) || 40000,
});

const db = require("./util/connection");

global.settingJSON = {};

global.updateSettingFile = (settingData) => {
  const settingJSON = JSON.stringify(
    settingData,
    null,
    2
  );

  fs.writeFileSync(
    "setting.js",
    `module.exports = ${settingJSON};`,"utf8");

  global.settingJSON = settingData;
};

const initializeSettings = require("./util/initializeSettings");

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Zigo Live Server Running..."});
});

async function startServer() {
  try {
    await initializeSettings();
    const routes = require("./routes/route");
    app.use("/api", routes);

    require("./socket");

    // realtime Live Analytics engine (admin panel)
    require("./services/liveAnalytics.service").start();

    // Host Daily LIVE Task: one global 60s scheduler (live hosts only)
    require("./services/dailyTask.service").startDailyTaskScheduler();

    // Live sessions: finalize sessions that lost their host (app killed / offline / server restart)
    require("./services/liveSession.service").startLiveSessionReaper();

    app.use(
      "/storage",
      express.static(
        path.join(__dirname, "storage")
      )
    );

    db.once("open", async () => {
      try {
        const startCronJobs = require("./cron");
        startCronJobs();
        // startEmailCampaignCron();
      } catch (cronError) {
        console.error(
          "❌ Cron initialization failed:",
          cronError
        );
      }
    });

    server.listen(
      process.env.PORT || 5000,
      () => {
        console.log(
          "Zigo live app running on " +
          (process.env.PORT || 5000)
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ Server initialization failed:",
      error
    );

    process.exit(1);
  }
}

startServer();