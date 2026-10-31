const cron = require("node-cron");

const sendAllUsersNotification = require(
  "./sendAllUsersNotification"
);

const initCronJobs = () => {

  cron.schedule(
    "0 0 6 * * *",
    async () => {
      try {
        await sendAllUsersNotification({
          title: "☀️ Good Morning from Zigo Live!",
          body: "सुबह की शुरुआत नए दोस्तों और Live Hosts के साथ करें ❤️",
          data: {
            type: "morning",
            screen: "home",
          },
        });
      } catch (error) {
        console.error(
          "Morning notification error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  cron.schedule(
    "0 0 12 * * *",
    async () => {
      try {
        await sendAllUsersNotification({
          title: "🎁 Zigo Live पर आज का Fun शुरू करें!",
          body: "Live जाएं, नए लोगों से मिलें और अपने खास पलों का आनंद लें 🚀❤️",
          data: {
            type: "midday",
            screen: "home",
          },
        });
      } catch (error) {
        console.error(
          "Midday notification error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  cron.schedule(
    "0 30 15 * * *",
    async () => {
      try {
        await sendAllUsersNotification({
          title: "🥰 कोई नया दोस्त आपका इंतज़ार कर रहा है!",
          body:
            "कभी-कभी एक छोटी सी बातचीत पूरा mood अच्छा कर देती है 💕 Zigo Live पर किसी नए दोस्त से मिलिए और साथ में कुछ मज़ेदार पल बिताइए ❤️",
          data: {
            type: "friendship",
            screen: "home",
          },
        });
      } catch (error) {
        console.error(
          "Friendship notification error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  cron.schedule(
    "0 0 18 * * *",
    async () => {
      try {
        await sendAllUsersNotification({
          title: "💖 कोई आपका इंतज़ार कर रहा है!",
          body:
            "Zigo Live खोलें और अपने पसंदीदा Hosts से अभी बात करें 📞🎥",
          data: {
            type: "engagement",
            screen: "home",
          },
        });
      } catch (error) {
        console.error(
          "Engagement notification error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  cron.schedule(
    "0 0 22 * * *",
    async () => {
      try {
        await sendAllUsersNotification({
          title: "🌙 आज रात थोड़ी बातें हो जाएं?",
          body:
            "रात अभी बाकी है 😊 Zigo Live पर कोई नया दोस्त शायद आपका इंतज़ार कर रहा हो। आइए, कुछ प्यारे पल साथ बिताएं ❤️",
          data: {
            type: "night",
            screen: "home",
          },
        });
      } catch (error) {
        console.error(
          "Night notification error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // Razorpay reconciliation: credit paid orders whose app-side verify call never arrived (idempotent)
  cron.schedule("0 */10 * * * *", async () => {
    try {
      const { reconcilePendingRazorpayOrders } = require("../services/coinPurchase.service");
      const r = await reconcilePendingRazorpayOrders();
      if (r.credited) console.log("[razorpay] reconciled", r);
    } catch (error) {
      console.error("Razorpay reconcile error:", error?.message || error);
    }
  });

  console.log(
    "Zigo notification cron initialized"
  );
};

module.exports = initCronJobs;