const userOnlineNotificationMessages = [
  {
    title: (name) => `🟢 ${name} is Online Now!`,
    body: "Abhi connect karo aur Zigo Live par baat shuru karo ❤️",
  },
  {
    title: (name) => `✨ ${name} just came Online!`,
    body: "Your next interesting conversation is waiting for you 😊",
  },
  {
    title: (name) => `💖 ${name} Online aa gaye hain!`,
    body: "Zigo Live kholo aur abhi unse connect karo 💕",
  },
  {
    title: (name) => `👋 Hey! ${name} is Here`,
    body: "Abhi baat karne ka perfect time hai 😉",
  },
  {
    title: (name) => `🔥 ${name} is Online`,
    body: "Don't miss the chance to connect with them on Zigo Live ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Abhi connect karo aur Zigo Live ka maza lo 💕",
  },
  {
    title: (name) => `💬 ${name} wants to connect!`,
    body: "Zigo Live par jao aur ek interesting conversation start karo 😊",
  },
  {
    title: (name) => `🌟 ${name} just joined Online`,
    body: "Aaj ki next conversation shayad inke saath ho 😉",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Unse hello bolne ka chance miss mat karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Back Online!`,
    body: "Welcome them with a quick hello on Zigo Live 👋",
  },
  {
    title: (name) => `💫 ${name} Online ho gaye!`,
    body: "Abhi Zigo Live open karo aur connect karo 💖",
  },
  {
    title: (name) => `❤️ ${name} is Waiting Online`,
    body: "Ek simple hello se conversation start karo 😊",
  },
  {
    title: (name) => `🔔 ${name} is Online`,
    body: "Maybe it's the right time to say hello 👋",
  },
  {
    title: (name) => `😍 ${name} just came Online`,
    body: "Abhi milo, baat karo aur new connection banao 💕",
  },
  {
    title: (name) => `⚡ ${name} is Active Now`,
    body: "Zigo Live par abhi connect karne ka perfect moment hai 🔥",
  },
  {
    title: (name) => `💙 ${name} is Online Now`,
    body: "Don't wait too long, go say hi 😊",
  },
  {
    title: (name) => `🌈 ${name} is Online!`,
    body: "Aaj ki conversation ko thoda special banao 💖",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Dekho kaun online hai! Abhi connect karo 😉",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Zigo Live kholo aur conversation start karo 💬",
  },
  {
    title: (name) => `💕 ${name} is Online Again`,
    body: "Maybe they are ready for a fun conversation 🥰",
  },
  {
    title: (name) => `🚨 ${name} Just Came Online`,
    body: "Don't miss this moment, connect now ❤️",
  },
  {
    title: (name) => `🎯 ${name} is Online`,
    body: "Your next chat could start right now 😉",
  },
  {
    title: (name) => `😊 ${name} is Here`,
    body: "Zigo Live par jao aur unhe ek warm hello bolo 👋",
  },
  {
    title: (name) => `💥 ${name} is Online Now`,
    body: "Abhi connect karo, baat karo aur enjoy karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "They are online on Zigo Live. Go say hello ❤️",
  },
  {
    title: (name) => `🫶 ${name} is Online`,
    body: "Ek cute hello se conversation start ho sakti hai 💕",
  },
  {
    title: (name) => `📲 ${name} Just Came Online`,
    body: "App kholo aur abhi connect kar lo 😊",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Zigo Live par jao aur baat shuru karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Online!`,
    body: "Come online and make this conversation fun 🎉",
  },
  {
    title: (name) => `✨ Someone You Know is Online`,
    body: (name) =>`${name} abhi Zigo Live par active hain 💕`,
  },
  {
    title: (name) => `❤️ ${name} is Active`,
    body: "Abhi connect karo, don't miss the moment 😊",
  },
  {
    title: (name) => `🔥 ${name} Online aa gaye!`,
    body: "Zigo Live kholo aur abhi chat start karo 💬",
  },
  {
    title: (name) => `👋 ${name} Says Hello`,
    body: "Ab aapki turn hai! Go say hi on Zigo Live 😉",
  },
  {
    title: (name) => `💎 ${name} is Online`,
    body: "Aaj ek special connection banane ka chance hai 💖",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Jump into Zigo Live and start chatting ❤️",
  },
  {
    title: (name) => `🌸 ${name} is Online`,
    body: "Thodi si baat, ek naya connection 😊",
  },
  {
    title: (name) => `🔔 ${name} just appeared Online`,
    body: "Abhi connect karna ho to ye perfect time hai 💕",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "They are online again! Go say hello 🥰",
  },
  {
    title: (name) => `🎊 ${name} is Online Now`,
    body: "Zigo Live par milo aur conversation enjoy karo ❤️",
  },

  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi connect karo before they go offline 😉",
  },
  {
    title: (name) => `💫 ${name} is Active on Zigo Live`,
    body: "Come online and start an amazing conversation ❤️",
  },
  {
    title: (name) => `🟢 ${name} is Available Now`,
    body: "Abhi baat karne ka best time hai 😊",
  },
  {
    title: (name) => `💝 ${name} is Online`,
    body: "Don't just wait, go make a connection 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Zigo Live par abhi connect karo aur enjoy karo 🎉",
  },
  {
    title: (name) => `📢 ${name} is Online`,
    body: "Your next conversation is just one tap away 👋",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Abhi hello bolo, conversation ka wait mat karo ❤️",
  },
  {
    title: (name) => `⚡ ${name} Just Came Online`,
    body: "Quick! Zigo Live kholo aur connect karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Available`,
    body: "Aaj ki chat abhi se start kar sakte ho 😊",
  },
  {
    title: (name) => `🎯 ${name} is Online Now`,
    body: "One tap and you can start talking ❤️",
  },
  {
    title: (name) => `💗 ${name} is Online Again`,
    body: "Abhi connect karo aur ek beautiful conversation banao 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Abhi connect karo aur Zigo Live ka maza lo 💕",
  },
];

const getRandomUserOnlineNotification = (userName) => {
  const name = userName || "User";

  const randomIndex = Math.floor(
    Math.random() * userOnlineNotificationMessages.length
  );

  const notification =
    userOnlineNotificationMessages[randomIndex];

  return {
    title: notification.title(name),
    body:
      typeof notification.body === "function"
        ? notification.body(name)
        : notification.body,
  };
};

module.exports = {
  getRandomUserOnlineNotification,
};