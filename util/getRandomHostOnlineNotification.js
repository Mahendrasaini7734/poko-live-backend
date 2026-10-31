const hostOnlineNotificationMessages = [
  {
    title: (name) => `🟢 ${name} is Online Now!`,
    body: "Zigo Live open karo aur unse baat karne ka chance miss mat karo ❤️",
  },
  {
    title: (name) => `✨ ${name} just came Online!`,
    body: "They are waiting for you on Zigo Live 😊 Come join the fun 💕",
  },
  {
    title: (name) => `💖 ${name} Online aa gaye hain!`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Live & Online!`,
    body: "Don't miss the chance to connect with them on Zigo Live ❤️",
  },
  {
    title: (name) => `👋 Hey! ${name} is Online`,
    body: "Zigo Live kholo, maybe they are waiting for you 😉",
  },
  {
    title: (name) => `💫 ${name} is Back Online!`,
    body: "Welcome back vibes! Zigo Live par jao aur say hi 👋",
  },
  {
    title: (name) => `🥰 ${name} aa gaye Online!`,
    body: "Ab wait kis baat ka? Zigo Live kholo aur connect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online!`,
    body: "Your favorite moments are waiting for you on Zigo Live ✨",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Thodi baatein ho jaye? Zigo Live par join karo 😊",
  },
  {
    title: (name) => `❤️ ${name} just went Online!`,
    body: "Unse connect karne ka perfect time hai. Open Zigo Live now!",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Aaj ki live vibes miss mat karo, Zigo Live par aa jao 🔥",
  },
  {
    title: (name) => `🎉 ${name} Online aa gaye!`,
    body: "Come say hello and enjoy some fun moments together 😍",
  },

  {
    title: (name) => `👀 ${name} is Online!`,
    body: "Kya aap ready ho? Zigo Live kholo aur unhe join karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} just appeared Online`,
    body: "Don't miss this moment! Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `✨ ${name} is waiting Online`,
    body: "Maybe it's time for a little chat 😊 Open Zigo Live!",
  },
  {
    title: (name) => `🥳 ${name} is Online!`,
    body: "Fun start ho chuka hai! Zigo Live par aao aur enjoy karo 🎉",
  },
  {
    title: (name) => `💌 ${name} is Online Now`,
    body: "Ek quick hello toh banta hai ❤️ Zigo Live open karo!",
  },
  {
    title: (name) => `🌈 ${name} is Online`,
    body: "Good vibes are live! Come join ${name} on Zigo Live 💕",
  },
  {
    title: (name) => `⚡ ${name} just came Online`,
    body: "Fast! Zigo Live kholo aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `❤️ ${name} aa gaye hain!`,
    body: "Aaj unke saath thodi special baatein ho jaye? 😉",
  },
  {
    title: (name) => `👋 ${name} Online hain!`,
    body: "Ek hello se conversation start karo. Zigo Live par milte hain 💬",
  },
  {
    title: (name) => `🔥 ${name} is Ready!`,
    body: "Are you ready to join? Zigo Live open karo and say hello 😍",
  },
  {
    title: (name) => `💫 ${name} is Live`,
    body: "Abhi perfect time hai connect karne ka. Don't miss it ❤️",
  },
  {
    title: (name) => `🎯 ${name} is Online Now`,
    body: "Your next interesting conversation could be just one tap away 😉",
  },
  {
    title: (name) => `🥰 ${name} is Here!`,
    body: "Zigo Live par aao aur unke saath good vibes share karo 💕",
  },
  {
    title: (name) => `🌟 ${name} just came online!`,
    body: "Aaj ka live moment miss nahi karna. Join now 🔥",
  },
  {
    title: (name) => `💬 Chat Time with ${name}!`,
    body: "Unse baat karne ka chance hai. Zigo Live open karo 😊",
  },
  {
    title: (name) => `🚨 ${name} is Online!`,
    body: "Don't miss out! Abhi Zigo Live par check karo 👀",
  },
  {
    title: (name) => `💖 ${name} is Back!`,
    body: "Long time no see? Zigo Live par jao aur reconnect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Unke saath ek fun conversation start karne ka time hai 💬",
  },
  {
    title: (name) => `🔥 ${name} Online aa chuke hain!`,
    body: "Zigo Live kholo aur live vibes ka maza lo ❤️",
  },

  {
    title: (name) => `💕 ${name} is Online for You`,
    body: "Maybe they are waiting for your hello. Join Zigo Live now 😊",
  },
  {
    title: (name) => `🎉 ${name} just joined Online`,
    body: "Come on! Zigo Live par aao aur kuch fun moments enjoy karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka perfect conversation partner online hai 💬❤️",
  },
  {
    title: (name) => `💫 ${name} Online Mil Gaye!`,
    body: "Abhi connect karo aur conversation ko interesting banao 😉",
  },
  {
    title: (name) => `❤️ ${name} is Available`,
    body: "Zigo Live par unse connect karne ka chance hai. Join now!",
  },
  {
    title: (name) => `🔥 ${name} Online Hai!`,
    body: "Aaj ki live vibes ka part banna hai? Zigo Live kholo 😍",
  },
  {
    title: (name) => `😊 ${name} is Online Now`,
    body: "Smile ke saath ek hello bhejo aur conversation start karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't wait! Zigo Live par abhi connect karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Thodi interesting baatein ho jaye? Join Zigo Live now ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Online Again!`,
    body: "Your next fun moment is waiting. Zigo Live open karo ✨",
  },
  {
    title: (name) => `🌟 ${name} Online Ho Gaye!`,
    body: "Unhe miss mat karo, abhi Zigo Live par visit karo 💖",
  },
  {
    title: (name) => `👋 ${name} Says Hi!`,
    body: "Maybe it's time to say hello back 😉 Zigo Live kholo!",
  },
  {
    title: (name) => `❤️ Time to Meet ${name}`,
    body: "They are online now. Come connect and enjoy the conversation 💬",
  },
  {
    title: (name) => `✨ ${name} is Active Now!`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Calling the Vibe!`,
    body: "Good conversations start with one tap. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aaj ka connection miss mat karo. Zigo Live par milte hain 😊",
  },
  {
    title: (name) => `🎊 ${name} is Online!`,
    body: "Fun ka time aa gaya! Zigo Live kholo aur join karo 🔥",
  },
  {
    title: (name) => `👀 ${name} is Active Right Now`,
    body: "Unke live moments dekhne ka chance hai. Check Zigo Live!",
  },
  {
    title: (name) => `💫 ${name} is Waiting`,
    body: "Ek simple hello se conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Perfect timing! Zigo Live par abhi connect karo 😉",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Come join the conversation and make the moment special 💕",
  },
  {
    title: (name) => `⚡ ${name} Online!`,
    body: "Quick! Zigo Live par jao before you miss the moment 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Live Now`,
    body: "Unke saath connect karo aur apni conversation start karo 💬",
  },
  {
    title: (name) => `🎉 ${name} is Back Online`,
    body: "Welcome back vibes! Zigo Live par milte hain 😊",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "A little chat, a little fun? Zigo Live open karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Online Again`,
    body: "This could be your perfect time to connect ❤️",
  },
  {
    title: (name) => `💬 Talk Time with ${name}`,
    body: "They are online now. Zigo Live kholo aur conversation start karo 😉",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Abhi unse connect karo aur kuch memorable moments banao 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online!`,
    body: "Your Zigo Live moment is waiting. Come join now ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Zigo Live par unka welcome karo aur say hello 😊",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "Don't stay away! Come join the live vibes on Zigo Live 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Ready`,
    body: "Fun conversation ke liye Zigo Live par aao 💬💕",
  },
  {
    title: (name) => `💫 ${name} is Around`,
    body: "Maybe today is the day for a great conversation ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Zigo Live par aao aur unke saath live connection banao 😍",
  },
  {
    title: (name) => `❤️ ${name} is Available Now`,
    body: "Ek tap karo aur apni conversation start karo. Join Zigo Live!",
  },
  {
    title: (name) => `✨ ${name} is Online Again!`,
    body: "Aaj ka chance miss mat karna. Zigo Live par connect karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Live fun is waiting! Zigo Live open karo and join now 🔥",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Unse baat karni hai? Abhi perfect time hai ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Check what's happening on Zigo Live right now 😉",
  },
  {
    title: (name) => `🌈 ${name} is Online`,
    body: "Positive vibes ke saath Zigo Live par aao aur connect karo ✨",
  },
  {
    title: (name) => `💬 ${name} Online Hai!`,
    body: "Conversation ka mood hai? Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi connect karo aur live moment ko special banao 🥰",
  },
  {
    title: (name) => `😊 ${name} is Online Again`,
    body: "Say hello before they go offline! Zigo Live kholo 👋",
  },
  {
    title: (name) => `🚀 ${name} is Live`,
    body: "Your next Zigo moment starts now. Join them ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Abhi Zigo Live par jao aur unke saath connect karo 💕",
  },
  {
    title: (name) => `🎯 ${name} is Online Now`,
    body: "One tap can start a great conversation. Try Zigo Live 😉",
  },
  {
    title: (name) => `❤️ ${name} is Waiting Online`,
    body: "Aaj thodi heart-to-heart baatein ho jaye? 💬",
  },
  {
    title: (name) => `✨ ${name} Just Appeared`,
    body: "Zigo Live par abhi unhe check karo. Don't miss out 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Online!`,
    body: "Aao thodi cute aur fun baatein karte hain 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live connection ka best time abhi hai. Join Zigo Live!",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Miss kiya tha? Abhi Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Online Now`,
    body: "Your favorite conversation might be one tap away 😉",
  },
  {
    title: (name) => `🌟 ${name} Just Came Back`,
    body: "Zigo Live par aao aur unke saath catch up karo 😊",
  },
  {
    title: (name) => `🎉 ${name} Online Ho Gaye!`,
    body: "Chalo ek fun conversation start karte hain. Join now 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready to Talk`,
    body: "Abhi online hain. Zigo Live kholo aur say hello ❤️",
  },
  {
    title: (name) => `⚡ ${name} is Online`,
    body: "The moment is live! Don't miss your chance to connect 🔥",
  },
  {
    title: (name) => `✨ ${name} is Back!`,
    body: "Good vibes are back on Zigo Live. Come join 😊",
  },
  {
    title: (name) => `❤️ ${name} Online Aa Chuke Hain`,
    body: "Abhi connect karo aur conversation ko interesting banao 💬",
  },
  {
    title: (name) => `👀 ${name} is Live Now`,
    body: "Kuch interesting miss toh nahi kar rahe? Zigo Live check karo 😉",
  },
  {
    title: (name) => `💫 ${name} is Online Today`,
    body: "Aaj ka connection special ho sakta hai. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Fun mode ON! Zigo Live kholo aur join karo 🎉",
  },
  {
    title: (name) => `🔥 ${name} Online Now!`,
    body: "Don't wait too long. Come say hi on Zigo Live 👋",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Ek message se conversation start karo. Zigo Live par aao 💬",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Aaj ki live vibes enjoy karne ka perfect time hai ✨",
  },
  {
    title: (name) => `🚨 ${name} Just Came Online!`,
    body: "This is your sign to open Zigo Live 😉❤️",
  },
  {
    title: (name) => `😊 ${name} Online Hai`,
    body: "Unse milne ka chance hai. Zigo Live kholo aur connect karo 💕",
  },
  {
    title: (name) => `💬 ${name} is Waiting Online`,
    body: "Conversation start karne ke liye sirf ek tap chahiye ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Online Again!`,
    body: "Come back to Zigo Live and enjoy some fresh vibes 🔥",
  },
  {
    title: (name) => `✨ Meet ${name} Online`,
    body: "They are active right now. Zigo Live par connect karo 😊",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Aapka hello unka mood bana sakta hai. Go say hi 😉",
  },
  {
    title: (name) => `🔥 ${name} is Back Online!`,
    body: "Abhi unse connect karne ka perfect moment hai. Join now 💕",
  },
  {
    title: (name) => `🌟 ${name} is Live Now`,
    body: "Good conversations, good vibes. Zigo Live par aao ❤️",
  },
  {
    title: (name) => `👋 Say Hi to ${name}!`,
    body: "They are online now. Open Zigo Live and start chatting 💬",
  },
  {
    title: (name) => `💫 ${name} is Online`,
    body: "Aaj kuch new aur interesting baatein ho sakti hain 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Live moments ka maza lene ke liye Zigo Live join karo 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Went Online`,
    body: "Don't miss this chance to connect and have some fun 😊",
  },
  {
    title: (name) => `🚀 ${name} is Online Now!`,
    body: "Your next Zigo Live experience starts with one tap ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Aao phir se connect karein aur kuch achhi baatein karein 💬",
  },
  {
    title: (name) => `✨ ${name} Online Mil Gaye`,
    body: "Perfect timing! Zigo Live kholo aur join karo 😉",
  },
  {
    title: (name) => `🔥 ${name} is Active Now!`,
    body: "Live vibe miss mat karo. Zigo Live par abhi aa jao ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Chat ka mood hai? Come join the conversation on Zigo Live 😊",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived Online`,
    body: "Aapka next memorable moment yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `❤️ ${name} is Here Again`,
    body: "Zigo Live par aao aur unke saath reconnect karo 🥰",
  },
  {
    title: (name) => `👀 ${name} is Online Right Now`,
    body: "Abhi check karo before the moment passes 🔥",
  },
  {
    title: (name) => `🎉 ${name} Online Aa Gaye!`,
    body: "Let's make some fun memories on Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} is Available`,
    body: "Unse connect karne ka perfect moment abhi hai 😊",
  },
  {
    title: (name) => `🔥 ${name} is Online Again`,
    body: "Come back, say hello and enjoy the live vibes 💕",
  },
  {
    title: (name) => `✨ ${name} Just Came Online!`,
    body: "Ek tap karo aur Zigo Live par unke saath connect karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Online Now`,
    body: "Aao thodi fun baatein karein aur moment enjoy karein 💬",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Zigo Live par live connection ka time aa gaya 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Maybe your next favorite conversation starts today 😉",
  },
  {
    title: (name) => `🌟 ${name} Online Hai!`,
    body: "Unhe miss karne se pehle Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Go say hello! Ek simple hi se great conversation start ho sakti hai 😊",
  },
  {
    title: (name) => `🔥 ${name} is Live & Active`,
    body: "Zigo Live par aao aur live vibes ko feel karo 💕",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Aaj kis se baat karni hai? Maybe it's ${name} 😉",
  },
  {
    title: (name) => `✨ ${name} is Back Online!`,
    body: "Abhi connect karo aur apni Zigo Live story continue karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online Now`,
    body: "Fun moments are waiting. Zigo Live kholo aur join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} Online Aa Gaye`,
    body: "Thodi friendly baatein ho jaye? Come join Zigo Live 💬",
  },
  {
    title: (name) => `❤️ ${name} is Active Now`,
    body: "Your chance to connect is here. Zigo Live open karo 😊",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Abhi join karo aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `💫 ${name} is Online Today`,
    body: "Aaj ki vibe miss nahi karni. Zigo Live par aa jao ❤️",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Zigo Live kholo and see what's happening right now 😉",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Ek hello bhejne ka perfect time hai. Join now 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Ho Gaye!`,
    body: "Live conversation ka chance miss mat karo. Abhi join karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Waiting`,
    body: "Maybe your message is exactly what they need right now 😊",
  },
  {
    title: (name) => `🎊 ${name} is Online Again`,
    body: "Fresh vibes, fresh conversation. Zigo Live par milte hain 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active Right Now`,
    body: "Come join the moment and make a new connection 💬❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Zigo Live par aao aur unke saath kuch fun time spend karo 💕",
  },
  {
    title: (name) => `❤️ ${name} is Online`,
    body: "Aaj ek new conversation start karne ka perfect chance hai 😉",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Don't miss their return! Zigo Live par abhi connect karo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk, laugh and enjoy. Zigo Live par join karo 😊",
  },
  {
    title: (name) => `🌟 ${name} Online Now!`,
    body: "Aapka next exciting Zigo moment wait kar raha hai ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hello before they disappear. Zigo Live kholo 😉",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Live connection ke liye better time nahi ho sakta. Join now 🔥",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Chalo kuch fun karte hain! Zigo Live par aao ❤️",
  },
  {
    title: (name) => `✨ ${name} is Live`,
    body: "Aaj ka live moment special ho sakta hai. Don't miss it 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai!`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 💬",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek tap, ek hello aur ek new conversation. Join Zigo Live 😊",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "Your moment to connect is here. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Miss kiya tha? Abhi Zigo Live par milne ka chance hai 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Abhi check karo aur live vibes ka part bano 🔥",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Maybe they're the one you wanted to talk to today 😉",
  },
  {
    title: (name) => `❤️ ${name} Online Aa Gaye!`,
    body: "Ek cute sa hello bhejo aur conversation start karo 🥰",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Let's talk! Zigo Live par aao aur connect karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live vibes ko miss mat karo. Join Zigo Live today ✨",
  },
  {
    title: (name) => `🎉 ${name} is Online Again!`,
    body: "New conversation, new memories. Zigo Live par milte hain 💕",
  },
  {
    title: (name) => `💫 ${name} Just Arrived Online`,
    body: "Abhi connect karna easy hai. Zigo Live kholo 😊",
  },
  {
    title: (name) => `✨ ${name} is Available Now`,
    body: "Come say hi and make the conversation interesting 💬❤️",
  },
  {
    title: (name) => `🥳 ${name} Online Ho Gaye`,
    body: "Fun ka perfect moment aa gaya. Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Online Now`,
    body: "Good vibes aur great conversations are waiting for you ❤️",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Aao unhe welcome karein aur thodi baatein karein 😊",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Don't miss the chance to connect with them on Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now!`,
    body: "Zigo Live kholo, unse connect karo aur moment enjoy karo 😍",
  },
  {
    title: (name) => `🚀 ${name} is Live Now`,
    body: "Your next fun moment starts right here. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj ki conversation interesting ho sakti hai. Zigo Live kholo 😉",
  },
  {
    title: (name) => `✨ ${name} is Here Again`,
    body: "Reconnect karo aur kuch beautiful moments share karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aapka hello un tak pahunchne wala hai. Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🎉 ${name} Just Went Online`,
    body: "Come join the fun before they go offline 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Abhi connect karo aur apni Zigo Live conversation start karo 💬",
  },
  {
    title: (name) => `❤️ ${name} Online Now`,
    body: "Maybe today is the perfect day to say hello 😊",
  },
  {
    title: (name) => `🌟 ${name} Came Online!`,
    body: "Zigo Live par aao aur live connection ka experience lo 🔥",
  },
  {
    title: (name) => `👀 ${name} is Online Again`,
    body: "Check in karo, say hi karo aur conversation enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Ready to Connect`,
    body: "Don't wait! Zigo Live par abhi join karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Thodi baatein, thodi masti aur lots of good vibes 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a new Zigo Live moment. Join now ✨",
  },
  {
    title: (name) => `🎊 ${name} is Active Now`,
    body: "Aaj ka mood live hai! Zigo Live par aa jao 🔥",
  },
  {
    title: (name) => `💬 ${name} is Waiting Online`,
    body: "Conversation ka chance abhi hai. Don't miss it ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye!`,
    body: "Abhi Zigo Live kholo aur unke saath ek fun conversation karo 😊",
  },
  {
    title: (name) => `🥰 ${name} is Online Now`,
    body: "Aao connect karein, baatein karein aur moment enjoy karein 💕",
  },
  {
    title: (name) => `🌟 ${name} is Back Online!`,
    body: "Your favorite Zigo moment might be waiting for you ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi join karo aur live vibes ko experience karo 🚀",
  },
  {
    title: (name) => `👋 Hey, ${name} is Online!`,
    body: "Say hello before it's too late 😉 Open Zigo Live now!",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Aaj ek new connection start karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `❤️ ${name} is Active Now`,
    body: "Zigo Live par aao aur unke saath kuch special moments banao 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun is waiting! Come join ${name} on Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} is Live Now`,
    body: "Don't miss the vibe. Abhi Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `💖 ${name} Online Ho Gaye`,
    body: "Ek message bhejo, shayad ek beautiful conversation start ho jaye 💬",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Back to good vibes! Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi unhe check karne ka best time hai. Open Zigo Live 😉",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Let's make this moment fun! Zigo Live par aa jao 🎉",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live connection ka chance miss mat karo. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karte hain! Zigo Live par unse connect karo 😊",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Your chance to say hello is right now 💕",
  },
  {
    title: (name) => `❤️ ${name} is Available`,
    body: "Zigo Live par aao aur ek new conversation start karo ✨",
  },
  {
    title: (name) => `💫 ${name} is Online`,
    body: "Aaj ki live vibes enjoy karne ka perfect time hai 🥰",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Come join, chat and enjoy the moment on Zigo Live 🔥",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Unhe welcome karne ka time hai. Zigo Live par say hi ❤️",
  },
  {
    title: (name) => `✨ ${name} is Online Now`,
    body: "Ek tap karo aur live conversation ka part bano 💬",
  },
  {
    title: (name) => `🔥 ${name} Online Aa Gaye!`,
    body: "Aaj kuch interesting baatein ho sakti hain. Join Zigo Live 😉",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Good vibes, fun talks and new connections are waiting ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online!`,
    body: "Don't miss the moment. Zigo Live kholo aur connect karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Online Again`,
    body: "Aao phir se connect karein aur kuch fun memories banayein 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Abhi Zigo Live par aao, maybe your next great chat starts here 😊",
  },
  {
    title: (name) => `💬 Talk With ${name}!`,
    body: "They are online now. Zigo Live open karo and start chatting ❤️",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Kya chal raha hai? Zigo Live kholo aur khud check karo 😉",
  },
  {
    title: (name) => `🎉 ${name} is Back Online`,
    body: "Live fun is back! Come join the vibe on Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Abhi connect karo aur apna Zigo Live moment banao ❤️",
  },
  {
    title: (name) => `💫 ${name} is Waiting`,
    body: "Maybe your hello is the conversation they need today 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Live`,
    body: "Zigo Live par aao aur live experience ka maza lo 💕",
  },
  {
    title: (name) => `❤️ ${name} Online Hai`,
    body: "Ek tap se conversation start karo. Don't miss the moment 😊",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo connection could start right now 🔥",
  },
  {
    title: (name) => `👋 ${name} is Online Now`,
    body: "Go say hi! Zigo Live par ek new conversation start karo 💬",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Abhi Zigo Live kholo aur unke saath thoda fun time spend karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Aaj ki vibe miss nahi karni. Come join Zigo Live ✨",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Unse connect karne ka perfect moment abhi hai. Join now 😊",
  },
  {
    title: (name) => `🎊 ${name} Online Aa Gaye`,
    body: "Fun conversations are waiting for you on Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Chalo ek hello se start karte hain ❤️ Zigo Live kholo!",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka maza lo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Now!`,
    body: "Abhi join karo aur apna moment miss mat karo ❤️",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Zigo Live par abhi check karo, kuch interesting ho sakta hai 😉",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aao baatein karein aur ek new connection banayein 💕",
  },
  {
    title: (name) => `🥳 ${name} is Online!`,
    body: "Let's make the moment fun. Zigo Live par join karo 🎉",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Aapka hello shayad unka next favorite notification ho 😉",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "One tap and you're connected. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye!`,
    body: "Aaj ki conversation ka chance miss mat karo. Join now 🥰",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hello and let the conversation begin 💬",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live vibes ON hain! Zigo Live par aao aur enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Perfect timing for a quick hello. Open Zigo Live 😊",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Abhi connect karo aur kuch memorable moments share karo 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online Again`,
    body: "Come back to Zigo Live and enjoy the fresh vibes 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Waiting Online`,
    body: "Thodi baatein ho jaye? Zigo Live par join karo 💬",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Don't miss them! Abhi Zigo Live par check karo 😉",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aao connect karein aur thodi positive vibes share karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Your chance to reconnect is here. Join Zigo Live now 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live moment aapka wait kar raha hai 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk, laugh and connect. Zigo Live par aao 😊",
  },
  {
    title: (name) => `✨ ${name} is Online`,
    body: "Ek tap karo aur conversation ko start karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Abhi Zigo Live par aao before you miss the fun 🎉",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aapki next interesting conversation yahin se start ho sakti hai 😉",
  },
  {
    title: (name) => `👋 ${name} Online Ho Gaye`,
    body: "Ek simple hello se connection start karo 💬❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Zigo Live par aao aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Online Now`,
    body: "Fun mode ON! Come join the conversation on Zigo Live 🎉",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Abhi unse connect karne ka perfect chance hai ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Don't wait! Zigo Live kholo aur apna next connection banao ✨",
  },
  {
    title: (name) => `🔥 ${name} is Back Online!`,
    body: "Live vibes are back. Come say hello on Zigo Live ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj ek interesting conversation try karni hai? Join now 😉",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Live Now`,
    body: "Good vibes ke liye Zigo Live open karo aur join karo 💕",
  },
  {
    title: (name) => `👀 ${name} is Online Again`,
    body: "Check them out before they go offline. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🎉 ${name} Online Aa Gaye!`,
    body: "Aaj ki masti shuru! Zigo Live par aao aur enjoy karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Available Now`,
    body: "Ek tap se new conversation start karo. Join Zigo Live 😊",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Your next great Zigo moment could start right now 💬",
  },
  {
    title: (name) => `🔥 ${name} Online Now`,
    body: "Live connection miss mat karo. Abhi Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Aao reconnect karein aur kuch good vibes share karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your moment is here! Zigo Live kholo and connect now 🔥",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Chat ka perfect time hai. Zigo Live par milte hain ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi connect karo aur conversation ko interesting banao 😉",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Go say hi! Maybe a great conversation is waiting for you 💕",
  },
  {
    title: (name) => `🎉 ${name} is Active Now`,
    body: "Live fun start ho gaya hai. Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online Now!`,
    body: "Aao ek new connection banayein aur moment enjoy karein 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Don't miss the live vibe. Join Zigo Live today ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Ek hello bhejo, conversation shayad bahut interesting ho 😉",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Zigo Live par aao aur apni next conversation start karo 💬",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aaj unke saath connect karne ka perfect chance hai ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Good vibes are back! Zigo Live par join karo 💕",
  },
  {
    title: (name) => `👀 ${name} is Live`,
    body: "Kuch interesting ho raha hai. Zigo Live par abhi check karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Zigo Live kholo aur conversation start karo 😊",
  },
  {
    title: (name) => `❤️ ${name} is Here Again`,
    body: "Reconnect ka perfect time hai. Zigo Live par aao 🥰",
  },
  {
    title: (name) => `🎊 ${name} Just Went Online`,
    body: "Come join the fun and make some new memories 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ki live vibe miss mat karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Ho Gaye!`,
    body: "Ek tap karo aur unke saath live connection banao 💕",
  },
  {
    title: (name) => `🔥 ${name} is Online Again`,
    body: "Abhi Zigo Live par aao aur unhe say hello karo 👋",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Fun conversations are waiting. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing! Abhi connect karo aur moment enjoy karo 😊",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Maybe this is your sign to open Zigo Live 😉",
  },
  {
    title: (name) => `👋 ${name} is Waiting`,
    body: "Aao ek hello se conversation start karte hain 💬❤️",
  },
  {
    title: (name) => `🚀 ${name} is Live Now`,
    body: "Your next exciting moment starts on Zigo Live 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Abhi unse connect karo aur live vibes enjoy karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Back Online`,
    body: "Let's make this return a fun one! Join Zigo Live 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Conversation ka perfect time hai. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online!`,
    body: "Don't miss out. Abhi Zigo Live par connect karo 🚀",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aapka next Zigo Live moment sirf ek tap away hai ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Aa Gaye`,
    body: "Aaj thodi fun aur friendly baatein ho jaye? 💬",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Come join the vibe and start a new conversation 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo, maybe today brings a great conversation ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online Again`,
    body: "Reconnect karo aur Zigo Live ke live moments enjoy karo 💕",
  },
  {
    title: (name) => `❤️ ${name} is Active Now`,
    body: "Ek hello bhejne ka perfect time hai. Join Zigo Live 😊",
  },
  {
    title: (name) => `🔥 ${name} Online Now!`,
    body: "Aao connect karein aur live moment ko special banayein 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Zigo Live par abhi join karo and don't miss the moment ❤️",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Missed the connection? Abhi reconnect karne ka time hai 💬",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun ka mood hai? Zigo Live kholo aur join karo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Good vibes aur great conversations are waiting for you ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived Online`,
    body: "Aao unhe welcome karein aur ek fun chat start karein 💕",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Say hello, start chatting and enjoy your Zigo Live moment 😊",
  },
  {
    title: (name) => `👋 ${name} is Back Online!`,
    body: "Abhi Zigo Live par aao aur unke saath reconnect karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Live`,
    body: "Live vibes ON hain. Come join the fun on Zigo Live 🎉",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your chance to connect is here. Don't miss it 💕",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aaj ek interesting conversation start ho sakti hai. Join now ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Aa Gaye`,
    body: "Zigo Live kholo aur unke saath apna next moment create karo 🔥",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Abhi connect karo, baad mein wait mat karna 😉",
  },
  {
    title: (name) => `🥳 ${name} is Online Now`,
    body: "Chalo thodi masti ho jaye! Zigo Live par join karo 🎉",
  },
  {
    title: (name) => `✨ ${name} is Waiting Online`,
    body: "Maybe your next favorite chat is just one tap away 💬❤️",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Aaj ki live vibe miss mat karo. Open Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Ek cute sa hello bhejo aur conversation start karo 😊",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Abhi Zigo Live par check karo and see what's happening ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Good vibes ka time hai. Come connect on Zigo Live 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk, laugh and enjoy the moment. Join now 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Back online and ready for new conversations. Come join ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Here`,
    body: "Zigo Live par aao aur unke saath live moments enjoy karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Ho Gaye!`,
    body: "Abhi connect karo aur apni Zigo Live journey continue karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aao ek fresh conversation start karein. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Don't wait! Abhi join karo and enjoy the live vibe 🚀",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Your next fun conversation might be waiting for you 😊",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hi and make the first move. Zigo Live par milte hain 💬",
  },
  {
    title: (name) => `❤️ ${name} is Back Online`,
    body: "Abhi reconnect karo aur kuch beautiful moments share karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Live Now`,
    body: "Zigo Live par aao aur live connection ka maza lo 🔥",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Aaj ki vibe special hai. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek tap se conversation start karo. Don't miss this moment 😊",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online!`,
    body: "Your chance to connect is now. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Online Again`,
    body: "Let's make some fun memories together on Zigo Live 💕",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Aao baat karte hain aur live moment enjoy karte hain ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Conversation start karne ka perfect time hai. Join now 😉",
  },
  {
    title: (name) => `🔥 ${name} is Online Now`,
    body: "Don't miss their live presence. Zigo Live par aa jao ❤️",
  },
  {
    title: (name) => `👀 ${name} is Back`,
    body: "Abhi check karo and reconnect with them on Zigo Live 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Aa Gaye`,
    body: "Aaj ek new connection banane ka chance hai. Join now 🥰",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Live vibes aur good conversations ke liye Zigo Live kholo 🔥",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Ek hello se shuruaat karo. Maybe something special follows 💬",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time hai! Come join the Zigo Live experience ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Don't miss the comeback. Zigo Live par abhi connect karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aao thodi friendly baatein karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Abhi Zigo Live par jao aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Aaj ka perfect chat partner online hai. Join Zigo Live 😊",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Your next live moment is waiting. Don't miss it 🚀",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Ek quick hello bhejo aur conversation ko start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online Again`,
    body: "Good vibes are back. Come join Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Abhi connect karo aur ek memorable conversation banao 🥰",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Let's make this moment fun. Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka connection miss mat karo. Abhi Zigo Live kholo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "One tap away from a great conversation. Join Zigo Live 💬",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Unke saath connect karne ka perfect moment abhi hai 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Aa Gaye!`,
    body: "Live vibes ka maza lo aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao phir se connect karein. Zigo Live par milte hain 😊",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Maybe today is the perfect day to start a new conversation 😉",
  },
  {
    title: (name) => `💬 ${name} is Ready to Talk`,
    body: "Zigo Live kholo aur apni conversation abhi start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ki live vibe aapka wait kar rahi hai. Join now 🔥",
  },
  {
    title: (name) => `❤️ ${name} Online Now`,
    body: "Say hello, connect and enjoy your time on Zigo Live 🥰",
  },
  {
    title: (name) => `🎊 ${name} is Active`,
    body: "Fun conversations ke liye Zigo Live par aao 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Abhi connect karo before the live moment is gone 🔥",
  },
  {
    title: (name) => `💖 ${name} is Online Again`,
    body: "Reconnect karo aur aaj ki good vibes enjoy karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Online`,
    body: "Chalo thodi masti aur baatein ho jaye. Join Zigo Live 🎉",
  },
  {
    title: (name) => `✨ ${name} is Available`,
    body: "Aaj ka connection sirf ek tap away hai. Come join ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Don't miss the moment. Zigo Live par abhi connect karo 🚀",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Welcome back vibes! Unse milne Zigo Live par aao 💕",
  },
  {
    title: (name) => `💫 ${name} Online Ho Gaye`,
    body: "Ek hello bhejo aur ek new conversation start karo 😊",
  },
  {
    title: (name) => `🌟 ${name} is Live`,
    body: "Live moment ko miss mat karo. Join Zigo Live now ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Zigo Live kholo aur unse connect karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Good vibes, fun talks and new connections are waiting 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Active Now`,
    body: "Abhi Zigo Live par aao aur conversation start karo 💬",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Your chance to reconnect is here. Don't miss it 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aaj unke saath ek fun conversation ho sakti hai. Join now ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Zigo Live par aao aur live vibes ka part bano 🔥",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo, maybe your next favorite moment is waiting 😉",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Aao reconnect karein aur kuch good vibes share karein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Come say hello and enjoy the moment on Zigo Live 💬",
  },
  {
    title: (name) => `🔥 ${name} Online Hai!`,
    body: "Abhi join karo aur live connection ka maza lo 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Active Now`,
    body: "Fun ka time hai! Zigo Live kholo aur connect karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Aaj ka perfect moment abhi hai. Don't miss it 🔥",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Ek hello se start karo aur dekho conversation kahan jaati hai 💕",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye!`,
    body: "Abhi Zigo Live par connect karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Come join the fun and make some new memories 🔥",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Aao baat karte hain. Zigo Live par join karo 😊",
  },
  {
    title: (name) => `❤️ ${name} is Here Now`,
    body: "Your next great conversation could start right here 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Zigo Live par aao aur live moments ko enjoy karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aaj ki vibe miss mat karo. Join them on Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Don't wait! Ek tap karo aur connect ho jao 🥰",
  },
  {
    title: (name) => `💖 ${name} is Available Now`,
    body: "Thodi baatein ho jaye? Zigo Live par milte hain 💬",
  },
  {
    title: (name) => `👀 ${name} is Back`,
    body: "Abhi Zigo Live check karo aur unke saath reconnect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Online Again`,
    body: "Fresh vibes ke saath conversation start karne ka time hai 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Arrived Online`,
    body: "Live fun is waiting! Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Aao ek new conversation start karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Ek tap away from a new connection. Zigo Live kholo 💬",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your chance to connect is now. Don't miss the vibe 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Online`,
    body: "Say hi and start your next Zigo Live conversation 😊",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Unke saath reconnect karne ka perfect time hai. Join now 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi Zigo Live par aao aur live moment ka part bano ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aaj ek interesting chat start karne ka chance hai 😉",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Good vibes ke liye Zigo Live par join karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} Online Ho Gaye`,
    body: "Chalo aaj kuch fun moments create karte hain. Join now 🔥",
  },
  {
    title: (name) => `💖 ${name} is Waiting Online`,
    body: "Ek simple hello se conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Aao unhe say hi karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Zigo Live kholo aur abhi connect karo. Don't miss out 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Live Now`,
    body: "Aaj ka live moment aapka wait kar raha hai. Join ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Hai`,
    body: "Aao thodi friendly baatein karein aur good vibes share karein 💬",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Your next Zigo connection could start with one hello 😉",
  },
  {
    title: (name) => `🔥 ${name} Online Aa Gaye!`,
    body: "Abhi connect karo aur live moment ko miss mat karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Come join the conversation and enjoy Zigo Live 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Chat ka perfect time hai. Zigo Live par aao 😊",
  },
  {
    title: (name) => `🎊 ${name} is Online`,
    body: "Fun vibes are ON! Come join the live experience 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Active Now`,
    body: "Abhi unse connect karo aur ek beautiful moment share karo 🥰",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Don't miss the chance. Zigo Live kholo and check now ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Good vibes are back! Reconnect on Zigo Live 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Aapka next exciting conversation sirf ek tap away hai 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Aaj ka mood live hai. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Ho Gaye`,
    body: "Abhi ek hello karo aur conversation start karo 💬",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online!`,
    body: "Live vibes miss mat karo. Zigo Live par abhi aa jao 🥰",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Reconnect karo aur apna Zigo Live moment enjoy karo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Active`,
    body: "Say hello! Maybe a great conversation is waiting for you 💕",
  },
  {
    title: (name) => `💫 ${name} is Online Now`,
    body: "Aaj ka connection special ho sakta hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🎉 ${name} Just Arrived`,
    body: "Fun conversations ke liye Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Abhi connect karo aur live vibes ka full maza lo 🥰",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Ek tap karo aur apni conversation start karo. Join now ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Don't miss their return! Zigo Live par reconnect karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Your chance to say hello is here. Come join 💕",
  },
  {
    title: (name) => `❤️ ${name} is Here`,
    body: "Aao connect karein aur kuch memorable moments banayein 😊",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Friendly vibes ke liye Zigo Live kholo aur join karo 💬",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Aaj ki live vibes ka part bano. Don't miss out ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo aur unke saath connect karo 😉",
  },
  {
    title: (name) => `🌟 ${name} is Online Again`,
    body: "Come back and enjoy another great Zigo Live moment 💕",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Abhi baat karne ka perfect chance hai. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Live`,
    body: "Fun starts now! Zigo Live par aao aur enjoy karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Waiting`,
    body: "Aapka hello shayad unka wait kar raha hai. Join now 😊",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a new conversation. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Aaj ka moment miss mat karo. Come connect on Zigo Live 💕",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Go say hi and make the first move 💬❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi join karo aur live connection ka maza lo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your next good conversation might start right now ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Zigo Live par aao aur live moment ko enjoy karo 🔥",
  },
  {
    title: (name) => `🎊 ${name} is Online Again`,
    body: "Reconnect, chat and enjoy the vibes on Zigo Live 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Went Online`,
    body: "Aaj unse baat karne ka chance miss mat karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Talk time! Zigo Live kholo aur conversation start karo 😊",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Abhi connect karo and make your Zigo Live moment special 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello se shuru karo. Maybe something amazing follows ❤️",
  },
  {
    title: (name) => `❤️ ${name} is Back Online`,
    body: "Aao reconnect karein aur thodi good vibes share karein 🥰",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Zigo Live par abhi check karo. Don't miss the moment 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Abhi join karo aur live experience ka maza lo 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Online Now`,
    body: "Good vibes, good talks and a chance to connect ❤️",
  },
  {
    title: (name) => `💖 ${name} is Available`,
    body: "Unse connect karne ka perfect time abhi hai. Join Zigo Live 😊",
  },
  {
    title: (name) => `🎉 ${name} Online Aa Gaye`,
    body: "Chalo kuch fun moments create karte hain. Come join 🔥",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Online`,
    body: "Fun mode ON! Come join the conversation on Zigo Live 💕",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Ek hello bhejo aur apni conversation start karo 💬",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Abhi Zigo Live par aao aur live vibes feel karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Online Again`,
    body: "Don't miss this chance to reconnect and chat 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Your next Zigo Live moment is waiting. Join now 💕",
  },
  {
    title: (name) => `💬 ${name} Online Ho Gaye`,
    body: "Aao thodi baatein karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "One tap can start something interesting. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aaj ek new connection banane ka chance hai. Join now 😊",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Check them out and don't miss the live moment ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Back Online`,
    body: "Fresh conversation ke liye Zigo Live par aa jao 💕",
  },
  {
    title: (name) => `🥰 ${name} is Online Now`,
    body: "Aaj thodi friendly vibes aur fun baatein ho jaye 💬❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Abhi connect karo aur apna live moment create karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Maybe your next favorite conversation is waiting 😊",
  },
  {
    title: (name) => `🔥 ${name} Online Hai!`,
    body: "Zigo Live kholo aur unke saath abhi connect karo ❤️",
  },
  {
    title: (name) => `👋 Say Hi to ${name}`,
    body: "They are online now. Go make the first move 💬💕",
  },
  {
    title: (name) => `🌟 ${name} is Live Now`,
    body: "Live vibes ko miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello se shuruaat karo aur conversation enjoy karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Your next exciting Zigo moment starts now ❤️",
  },
  {
    title: (name) => `🎊 ${name} Online Aa Gaye!`,
    body: "Come join the fun, chat and enjoy the live vibes 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj ka perfect time hai baat karne ka. Join now ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur Zigo Live par good vibes enjoy karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Abhi unse connect karo aur ek memorable moment banao ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't wait! Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Kuch interesting miss toh nahi kar rahe? Check Zigo Live 😉",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Aao connect karein aur live moment ka full maza lein 💕",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Ek tap karo aur conversation ko start karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Active Now`,
    body: "Fun conversations ke liye Zigo Live par aao 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Waiting`,
    body: "Aaj ka connection miss mat karo. Come say hello 😊",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Your chance to reconnect is here. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🥳 ${name} Online Hai`,
    body: "Chalo thodi masti aur interesting baatein ho jaye 💬🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Zigo Live par aao aur unke saath live connect karo 💕",
  },
  {
    title: (name) => `💖 ${name} is Online Again`,
    body: "Don't miss their live presence. Come join now ❤️",
  },
  {
    title: (name) => `👋 ${name} is Active`,
    body: "Ek simple hello se new conversation start karo 😊",
  },
  {
    title: (name) => `🔥 ${name} Online Now!`,
    body: "Live vibe ON hai. Zigo Live par abhi aa jao 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Aapka next exciting connection sirf ek tap away hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Chat ka mood hai? Zigo Live kholo aur connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aao baat karein aur kuch good vibes share karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Live`,
    body: "Don't miss the live moment. Join Zigo Live now 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye`,
    body: "Abhi connect karo aur apna Zigo Live moment enjoy karo 💬",
  },
  {
    title: (name) => `❤️ ${name} Just Went Online`,
    body: "Aaj unke saath connect karne ka perfect chance hai 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Back`,
    body: "Welcome back vibes! Come join the fun on Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Aaj ka live moment miss mat karo. Join now ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and see what's happening on Zigo Live 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Good conversations are waiting. Zigo Live par aao 💬❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "One tap away from a fun conversation. Join now 🥰",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao connect karein aur kuch special moments banayein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Reconnect karo before they go offline. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Online`,
    body: "Live fun start ho gaya hai. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Ek hello bhejo aur conversation start karo 💬❤️",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Zigo Live par aao aur unke saath live vibes enjoy karo 💕",
  },
  {
    title: (name) => `👋 ${name} is Online Now`,
    body: "Aapka hello un tak pahunchne ka perfect time abhi hai 😊",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Don't miss the chance to connect. Join Zigo Live 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Back Online`,
    body: "Aao reconnect karein aur kuch achhi baatein karein 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Your next Zigo moment is waiting. Come join ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Online`,
    body: "Abhi Zigo Live par aao aur live connection ka maza lo 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Talk time! Ek tap karo aur conversation start karo 😊",
  },
  {
    title: (name) => `🎉 ${name} Online Ho Gaye!`,
    body: "Chalo live vibes enjoy karte hain. Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun aur friendly conversation ke liye abhi connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Maybe your next favorite chat starts right now 💬💕",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Don't miss this moment. Zigo Live kholo and join now 🔥",
  },
  {
    title: (name) => `👀 ${name} is Online Again`,
    body: "Abhi check karo aur unke saath reconnect karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Available`,
    body: "Aaj ek new connection start karne ka perfect time hai 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Live`,
    body: "Live vibes aur good conversations ke liye Zigo Live kholo 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Aa Gaye`,
    body: "Ek tap karo aur unke saath connect ho jao. Don't wait ❤️",
  },
  {
    title: (name) => `💫 ${name} is Online Now`,
    body: "Aao baat karein, laugh karein aur moment enjoy karein 😊",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Your chance to connect is here. Join Zigo Live 🔥",
  },
  {
    title: (name) => `👋 ${name} Just Arrived Online`,
    body: "Say hi and start something interesting on Zigo Live ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Missed the connection? Abhi reconnect karo 💕",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ki live vibe ka part bano. Zigo Live par aao 🔥",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Unse connect karne ka chance abhi hai. Join now 😊",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo Live moment starts with one tap 💬❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Come join the conversation and enjoy the live vibes 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Again`,
    body: "Aao phir se connect karein aur good vibes share karein 🥰",
  },
  {
    title: (name) => `🎊 ${name} is Online Now`,
    body: "Fun conversations are waiting. Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Chat ka perfect time hai. Abhi Zigo Live kholo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Don't miss the moment. Come connect on Zigo Live 🚀",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Kuch interesting ho raha hai. Abhi Zigo Live check karo 😉",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Ek hello bhejo aur conversation ko special banao ❤️",
  },
  {
    title: (name) => `🥳 ${name} Online Ho Gaye`,
    body: "Aaj ki masti aur live vibes aapka wait kar rahi hain 🔥",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Come reconnect and enjoy another Zigo Live moment 💕",
  },
  {
    title: (name) => `❤️ ${name} is Online`,
    body: "Aao connect karein aur ek memorable conversation start karein 😊",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Abhi join karo and don't miss the live experience 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Good vibes are live. Come join ${name} on Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} is Waiting`,
    body: "Maybe your next great conversation is one tap away 💬🥰",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Zigo Live par aao aur aaj ka live moment enjoy karo 🔥",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Aao ek warm hello karein aur conversation start karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing! Abhi Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Online Now`,
    body: "Aaj ka moment special bana sakte ho. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live connection ka chance miss mat karo. Join now 🚀",
  },
  {
    title: (name) => `💬 ${name} is Active`,
    body: "Ek tap karo aur conversation start karo. Zigo Live kholo 😊",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your next fun conversation is waiting. Don't miss it ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Abhi connect karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `🎊 ${name} is Online Again`,
    body: "Fresh vibes, fresh conversations. Join Zigo Live 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Here Now`,
    body: "Say hello and make your Zigo moment special 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Live Now`,
    body: "Don't wait. Zigo Live par aao aur connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye`,
    body: "Aaj unke saath thodi special baatein ho jaye 💬💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Abhi join karo and enjoy the live vibes on Zigo Live 🚀",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Check them out and maybe start a new conversation ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Welcome back vibes! Zigo Live par reconnect karo 💕",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Aapka next great conversation yahin se start ho sakta hai 😊",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Aaj ka live moment miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Abhi Zigo Live kholo aur connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Good vibes ke liye ek hello se start karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your chance to connect is right now. Don't miss it 💕",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Chalo kuch fun moments banate hain. Join Zigo Live 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Active`,
    body: "Abhi unse connect karo aur live moment enjoy karo 😊",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Ek hello bhejo. Maybe a beautiful conversation starts here 💕",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Reconnect karo aur Zigo Live ki good vibes enjoy karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Abhi Zigo Live par aao aur live connection ka maza lo 🚀",
  },
  {
    title: (name) => `🌟 ${name} Online Ho Gaye!`,
    body: "Aaj ka perfect chat moment aa gaya. Join now 💬❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Come say hi and enjoy some fun time on Zigo Live 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Aapka next Zigo Live moment sirf ek tap away hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Waiting Online`,
    body: "Maybe they are waiting for your hello. Join now 😊",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Abhi reconnect karo before they go offline ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Here`,
    body: "Live fun aur good conversations ke liye Zigo Live par aao 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Kya aap ready ho? Abhi Zigo Live kholo aur connect karo 💕",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aaj ek interesting chat start karne ka perfect chance hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Missed them? Come back and reconnect on Zigo Live 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Don't miss the live vibe. Abhi join karo 🚀",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Aao baat karein aur ek new connection start karein 💬❤️",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Fun ka mood hai? Zigo Live par aa jao aur join karo 💕",
  },
  {
    title: (name) => `💫 ${name} is Online Now`,
    body: "Aaj ki vibe aapka wait kar rahi hai. Don't miss it 🔥",
  },
  {
    title: (name) => `❤️ ${name} Came Online`,
    body: "Ek simple hello se great conversation start ho sakti hai 😊",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo moment starts now. Come join ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Aao reconnect karein aur thodi good vibes share karein 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Went Online`,
    body: "Live fun is waiting! Zigo Live kholo and join now 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Abhi connect karo aur apna live moment special banao ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aaj ka connection miss mat karo. Zigo Live par join karo 🥰",
  },
  {
    title: (name) => `💬 ${name} is Ready to Talk`,
    body: "Conversation ka time hai. Ek tap karo aur connect ho jao 💕",
  },
  {
    title: (name) => `🔥 ${name} is Online`,
    body: "Zigo Live kholo aur live vibes ka full experience lo 🚀",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Good vibes are back. Come say hello ❤️",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo aur unke saath connect karo. Don't miss out 🔥",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aao thodi cute aur fun baatein karein 💬❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Aaj ka perfect Zigo Live moment yahin se start hota hai 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Abhi join karo aur live connection ka maza lo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Ek hello se shuru karo aur dekho conversation kitni interesting hoti hai ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online Again`,
    body: "Come join the fun and reconnect on Zigo Live 💕",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hi and start your next Zigo conversation 😊",
  },
  {
    title: (name) => `❤️ ${name} Just Came Online`,
    body: "Unse connect karne ka chance abhi hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Good vibes ke liye Zigo Live kholo aur abhi connect karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Abhi reconnect karo aur live moment ka part bano ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Aaj ka conversation partner ready hai. Come join Zigo Live 😊",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Don't miss the chance to connect. Abhi join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aao baatein karein aur ek memorable Zigo moment banayein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your next great connection is just one tap away 💕",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Maybe it's time for a little chat. Zigo Live par aao 💬",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Fun vibes ON! Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `👀 ${name} is Online Again`,
    body: "Check them out before the moment passes ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Aaj ka live connection miss mat karo. Join now 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Ek tap karo aur unke saath live connect ho jao 💕",
  },
  {
    title: (name) => `💫 ${name} is Online`,
    body: "Aao connect karein aur kuch amazing moments share karein ❤️",
  },
  {
    title: (name) => `👋 ${name} Online Aa Gaye`,
    body: "Say hello and let the good conversation begin 💬🔥",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Zigo Live par aao aur unke saath live vibes enjoy karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Welcome back! Abhi Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Don't miss this moment. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Aaj ki conversation ka perfect time abhi hai 😊",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Thodi baatein ho jaye? Zigo Live par milte hain ❤️",
  },
  {
    title: (name) => `✨ ${name} is Online Again`,
    body: "Aao phir se connect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Abhi join karo and don't miss the Zigo Live moment 🚀",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Your next fun conversation is waiting for you ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Ek hello se start karo aur moment ko special banao 💬",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi Zigo Live par check karo and connect 😉",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Good vibes aur live connection ke liye join karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Chalo aaj kuch fun moments banate hain. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect ka perfect time hai. Abhi join karo 💕",
  },
  {
    title: (name) => `❤️ ${name} is Here`,
    body: "Aao baat karein aur ek new Zigo connection start karein 😊",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye!`,
    body: "Don't miss the chance. Zigo Live kholo aur connect karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello se conversation start karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Aaj ka live moment miss mat karo. Come join 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Fun aur good vibes ke liye Zigo Live par aa jao 🔥",
  },
  {
    title: (name) => `👋 ${name} is Online Now`,
    body: "Say hi! Maybe aaj ek beautiful conversation start ho ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Abhi connect karo aur apna Zigo Live moment enjoy karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is now. Don't wait 🔥",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Come join the live vibe and start a conversation 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live connection ka chance miss mat karo. Join now 🚀",
  },
  {
    title: (name) => `🎉 ${name} is Online Again`,
    body: "Fresh vibes ke saath Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aao thodi fun baatein karein aur good vibes enjoy karein 💬",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo before you miss the moment 💕",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Aaj ka perfect connection yahin se start ho sakta hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk, connect and enjoy your Zigo Live moment 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "One tap away from a new conversation. Join now 💕",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing for a hello. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Live Now`,
    body: "Aaj ki live vibe miss mat karo. Join them now 💕",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Aao welcome karein aur ek fun conversation start karein 😊",
  },
  {
    title: (name) => `🎊 ${name} Online Ho Gaye`,
    body: "Live fun ka time hai! Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Online Again`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aaj ek new conversation ka perfect chance hai 💬💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Don't miss the live connection. Join Zigo Live now 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi connect karo and enjoy the live vibes ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Aao thodi baatein karein aur moment ko special banayein 🥰",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Conversation ka perfect time hai. Zigo Live kholo 💕",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Good vibes are back! Come reconnect on Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Now`,
    body: "Your next fun moment is waiting. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👀 ${name} is Here Now`,
    body: "Kuch interesting miss mat karo. Abhi Zigo Live check karo 💕",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Fun conversations ke liye Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Ek hello bhejo aur apna next connection start karo 🥰",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Abhi unse connect karo aur live moment enjoy karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Don't miss their return. Zigo Live par abhi reconnect karo ❤️",
  },
  {
    title: (name) => `❤️ ${name} is Here`,
    body: "Aaj ka connection special ho sakta hai. Come join 💕",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Chalo kuch fun baatein karte hain. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Abhi ek hello se conversation start karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Unse connect karne ka perfect chance hai 😊",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi join karo before the moment passes 🚀❤️",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and start something interesting on Zigo Live 💬",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj unke saath connect karne ka perfect moment hai 🥰",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Come join the live vibes and make a new connection ❤️",
  },
  {
    title: (name) => `🎉 ${name} Online Now`,
    body: "Fun mode ON! Zigo Live par aao aur enjoy karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo Live moment starts right now 💕",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi connect karo aur apni conversation start karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Aao phir se connect karein aur good vibes share karein 💬",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Don't miss the live vibe. Zigo Live kholo and join now ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Maybe your next great conversation is waiting for you 💕",
  },
  {
    title: (name) => `🌟 ${name} is Online Now`,
    body: "Aaj ka live moment special banane ka chance hai 🥰",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek tap karo, say hello karo aur conversation start karo ❤️",
  },
  {
    title: (name) => `🎊 ${name} Just Came Online`,
    body: "Come join the fun and enjoy the live experience 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't wait! Abhi join karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Fresh vibes ke saath Zigo Live par reconnect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Ho Gaye`,
    body: "Live connection ka best time abhi hai. Join now 🚀",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Aao unhe welcome karein aur ek fun chat start karein 💬❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Good vibes aur new conversations ke liye Zigo Live kholo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aaj thodi friendly baatein ho jaye? Come join ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Your next Zigo Live moment could start right now 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aaj ka perfect time hai connect karne ka. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Back Online`,
    body: "Come back, say hi and enjoy the fresh live vibes 💕",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi connect karo aur ek memorable conversation banao 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Online Again`,
    body: "Miss mat karo! Zigo Live par abhi join karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "One tap away from a fun new conversation. Join now 💬",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aaj ka connection miss mat karo. Zigo Live par aao 🥰",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Abhi check karo and don't miss the live moment 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Good vibes are live! Come join Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} is Waiting`,
    body: "Ek hello se shayad ek beautiful conversation start ho jaye 💕",
  },
  {
    title: (name) => `🎊 ${name} is Active`,
    body: "Fun ka time aa gaya. Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Come connect, chat and enjoy the moment ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aaj ka next exciting moment sirf ek tap away hai 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live connection ka chance miss mat karo. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Aao phir se hello karein aur conversation continue karein ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Chat ka mood hai? Zigo Live kholo aur connect karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your next great Zigo conversation is waiting 💕",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Abhi unse connect karo aur live moment enjoy karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't miss the moment. Zigo Live par abhi join karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur aaj ki good vibes enjoy karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Online Hai`,
    body: "Aaj ki masti shuru! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo and maybe start a new conversation ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Ek hello bhejo aur apna next Zigo moment start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ka maza lene ke liye Zigo Live par aao 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived Online`,
    body: "Aaj ka connection miss mat karo. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Aao baat karein aur kuch fun moments share karein 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Online Again`,
    body: "Fresh vibes are waiting. Come reconnect on Zigo Live 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Ek simple hello se aaj ka best conversation start ho sakta hai ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your next Zigo Live moment is just one tap away 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Abhi join karo aur live vibes ka part bano 💕",
  },
  {
    title: (name) => `👋 ${name} Just Went Online`,
    body: "Say hello before they go offline. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur apni conversation ko continue karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Online`,
    body: "Don't miss the live connection. Abhi join karo 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Good conversations aur fresh vibes ke liye Zigo Live kholo ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Perfect time for a quick hello. Come join 💕",
  },
  {
    title: (name) => `🎊 ${name} Online Ho Gaye!`,
    body: "Live fun start ho gaya hai. Zigo Live par aao 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aaj ek new connection ka chance hai. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Abhi Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Don't miss their return. Come say hello on Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aao connect karein aur live moment ko special banayein ❤️",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Kuch interesting miss mat karo. Abhi Zigo Live check karo 😉",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek tap karo aur conversation start karo. Join now 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Live vibes ON hain. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aaj ka live moment aapka wait kar raha hai. Join now 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Aao phir se connect karein aur good vibes share karein 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Active Now`,
    body: "Fun conversations ke liye abhi Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Say hello and start a new Zigo Live conversation 💬💕",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Aapka next exciting connection sirf ek tap away hai 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Don't miss the chance to connect. Join Zigo Live ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Unhe welcome karo aur thodi fun baatein start karo 🥰",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Abhi connect karo aur live moment ko miss mat karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Aaj ki live vibes ka part banna hai? Join Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Ek hello se aaj ka best conversation start ho sakta hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karte hain aur Zigo Live ka moment enjoy karte hain 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Fresh vibes ke saath reconnect karo. Join now 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Your chance to connect is now. Don't miss it ❤️",
  },
  {
    title: (name) => `✨ ${name} is Online`,
    body: "Zigo Live kholo aur unke saath ek new conversation start karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Abhi join karo aur live connection ka full maza lo 💕",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Go check them out before the moment passes 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Here`,
    body: "Aaj ka connection special ban sakta hai. Come join Zigo Live 💬",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun ka time hai! Zigo Live par aao aur enjoy karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Ek hello bhejo aur conversation ko start karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur apna next Zigo Live moment enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Abhi connect karo before they go offline. Join Zigo Live 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Zigo Live par aao aur unse connect karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aao thodi friendly baatein karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Your next Zigo Live connection could start right here 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Don't wait! Abhi Zigo Live kholo aur join karo ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hi and make your first move. Zigo Live par milte hain 💬",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aaj ka live moment miss mat karo. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🎊 ${name} is Back Online`,
    body: "Good vibes are back! Reconnect and enjoy ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Aa Gaye`,
    body: "Abhi connect karo aur apna special Zigo moment banao 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Live vibes ka time hai. Zigo Live par join karo 🚀",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Aapka next interesting chat partner online hai. Join now 💬",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo and maybe start something special ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing for a hello. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun aur good vibes ke liye Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Aao reconnect karein aur live moments enjoy karein ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Thodi baatein ho jaye? Abhi Zigo Live par aao 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Your chance to connect is here. Don't miss the moment 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi join karo aur live vibes ka full experience lo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Ek hello se new connection start karne ka perfect time hai 💬",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Let's make some fun memories on Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Aao connect karein aur moment ko special banayein ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Zigo Live par aao aur unke saath good vibes share karo 💕",
  },
  {
    title: (name) => `👋 ${name} Online Again`,
    body: "Say hello before they go offline. Join now 🔥",
  },
  {
    title: (name) => `💖 ${name} is Waiting`,
    body: "Maybe your next great conversation is waiting for you ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Fresh live vibes are waiting. Come join 💕",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj ka perfect conversation time abhi hai. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live moment miss mat karo. Abhi connect karo 🚀",
  },
  {
    title: (name) => `✨ ${name} is Online Now`,
    body: "Come say hello and enjoy the Zigo Live vibes 🥰",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Kuch interesting ho sakta hai. Abhi Zigo Live check karo 💕",
  },
  {
    title: (name) => `🎉 ${name} is Here`,
    body: "Fun ka time aa gaya! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Aaj unke saath ek new connection start karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Reconnect karo aur good vibes enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Live`,
    body: "Your next Zigo Live moment starts now. Join ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello bhejna mat bhoolna. They are online now 😊",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ki live vibes ka part bano. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hi, connect and enjoy the moment ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Again`,
    body: "Abhi reconnect karo aur apni Zigo conversation continue karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't miss this chance. Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur live moment ko special banayein 🥰",
  },
  {
    title: (name) => `🎊 ${name} Online Hai`,
    body: "Fun conversations are waiting for you on Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ka perfect time hai connect karne ka. Join now 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes ke liye Zigo Live par aao aur connect karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Thodi friendly baatein aur lots of good vibes are waiting ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next conversation could start right now. Join Zigo Live 💬",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Aao phir se connect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo and don't miss the live moment 🔥",
  },
  {
    title: (name) => `✨ ${name} is Online`,
    body: "One tap away from a new connection. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Let's have some fun! Zigo Live par join karo 🥰",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation ka perfect time hai. Come say hello 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes miss mat karo. Abhi Zigo Live par aao 🚀",
  },
  {
    title: (name) => `🌟 ${name} Online Ho Gaye`,
    body: "Aaj ka special moment miss nahi karna. Join now ❤️",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Fun, chat aur good vibes ke liye Zigo Live par aao 💕",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Ek hello se aaj ki conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Reconnect karo before they go offline. Join Zigo Live 🔥",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hi and make your Zigo Live moment memorable 🥰",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aao connect karein aur kuch beautiful moments share karein 💕",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Good vibes are back. Abhi Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Your chance to connect is now. Don't miss it 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Live Now`,
    body: "Aaj ki live vibes ka full maza lo. Come join Zigo Live 💕",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Chat ka mood hai? Abhi connect karo aur baat shuru karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aaj ek new connection start karne ka perfect chance hai 💬",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Abhi Zigo Live kholo aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `👀 ${name} is Back`,
    body: "Missed them? Come reconnect on Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka live connection miss mat karo. Join now 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Went Online`,
    body: "Fun ka time hai! Zigo Live par aao aur enjoy karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Aao baat karein aur ek memorable moment banayein ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Aa Gaye`,
    body: "Don't wait. Abhi Zigo Live par connect karo 🚀",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Your next good conversation is just one tap away 💬💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Live vibes ke saath ek new connection start karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Online Again`,
    body: "Fresh vibes aur fun conversations are waiting 🔥",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Go say hello and start your Zigo Live conversation 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "Abhi connect karo aur live moment ka full maza lo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Maybe aaj ki best conversation yahin se start ho 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ON hain. Zigo Live par join karo 💕",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj thodi interesting baatein ho jaye? Come join ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing! Ek hello bhejo aur connect karo 🔥",
  },
  {
    title: (name) => `🎊 ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka maza lo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Your next Zigo Live moment is waiting for you ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here Again`,
    body: "Aao phir se baat karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the chance. Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} Just Went Online`,
    body: "Aaj ka perfect time hai connect karne ka. Join now ❤️",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Zigo Live kholo aur dekho kaun online hai 😉",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye!`,
    body: "Aao connect karein aur live moment ko special banayein 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Your chance to reconnect is here. Don't miss it ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Ek tap karo aur conversation start karo. Zigo Live kholo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Online`,
    body: "Good vibes aur new connections ke liye abhi join karo 🔥",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Come join the fun and make your Zigo moment special ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Abhi connect karo aur live conversation ka maza lo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next conversation starts with one tap. Join Zigo Live 💬",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Aaj ek new connection banane ka perfect chance hai 🥰",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start your next Zigo Live moment ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Arrived`,
    body: "Abhi Zigo Live par aao aur live vibes enjoy karo 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Reconnect karo aur unke saath conversation continue karo 😊",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Don't miss this moment. Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Fun conversations ke liye ek tap karo aur connect ho jao ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka live moment aapka wait kar raha hai. Join now 💕",
  },
  {
    title: (name) => `💬 ${name} Online Again`,
    body: "Talk time! Abhi Zigo Live kholo aur reconnect karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "One tap away from a new connection. Come join ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello bhejo aur conversation ko interesting banao 🔥",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Abhi check karo and don't miss the live vibes 💕",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur Zigo Live ka moment enjoy karein ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Aaj ki friendly conversation ka perfect time hai 💬",
  },
  {
    title: (name) => `🔥 ${name} Online Ho Gaye`,
    body: "Live connection ka chance miss mat karo. Join Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Come join the live vibes and start something interesting ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Abhi connect karo before they go offline 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time aa gaya! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Say hello and reconnect with ${name} on Zigo Live ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur kuch memorable moments banayein 🥰",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your next Zigo Live moment is just one tap away 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka connection miss mat karo. Abhi join karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ka full maza lene ke liye Zigo Live kholo 🚀",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Maybe your next favorite conversation is waiting for you 💬🥰",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Abhi connect karo aur apna special Zigo moment banao ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Kuch interesting miss mat karo. Come check Zigo Live 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Fresh vibes ke saath conversation start karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Online Again`,
    body: "Aao reconnect karein aur live moments enjoy karein ❤️",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Zigo Live par aao, chat karo aur moment enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't wait! Abhi connect karo and enjoy the vibe 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Zigo Live kholo aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live moment ka part bano. Abhi Zigo Live par join karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo ❤️",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Say hello and start a fresh conversation on Zigo Live 💬",
  },
  {
    title: (name) => `💖 ${name} Just Arrived`,
    body: "Aaj unke saath connect karne ka perfect chance hai 🥰",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye`,
    body: "Abhi join karo aur live vibes ko miss mat karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting connection is waiting. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online Again`,
    body: "Aao phir se connect karein aur fun moments share karein 💕",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Ek tap karo aur unke saath conversation start karo 😊",
  },
  {
    title: (name) => `🔥 ${name} is Online Now`,
    body: "Don't miss the live vibe. Abhi Zigo Live par aa jao ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aaj ka new connection sirf ek hello away hai 💬💕",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Live moments are waiting. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Reconnect karo aur unke saath good vibes share karo ❤️",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Abhi Zigo Live check karo aur live moment ka part bano 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing! Ek hello karo aur conversation start karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Your next fun moment is waiting. Join Zigo Live now 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aao baat karein aur aaj ka moment special banayein ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Here Now`,
    body: "Fun vibes ke liye Zigo Live par abhi join karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Chalo kuch fun aur interesting baatein ho jaye 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Good vibes are live. Come connect on Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka connection miss mat karo. Abhi join karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Live vibes are back! Come say hello 🥰",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Ek simple hello se conversation start karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aapka next Zigo moment yahin se start ho sakta hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Abhi connect karo aur live conversation enjoy karo 💬",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived`,
    body: "Don't miss the moment. Zigo Live kholo aur join karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Ho Gaye`,
    body: "Aaj ka live connection aapka wait kar raha hai 💕",
  },
  {
    title: (name) => `🥰 ${name} is Online Again`,
    body: "Reconnect karo aur kuch beautiful moments share karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Conversation ka mood hai? Zigo Live par aao 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Active Now`,
    body: "Fun ka time hai. Come join ${name} on Zigo Live 💕",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo before you miss something interesting ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Aao phir se connect karein aur live vibes enjoy karein 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Zigo Live kholo aur abhi unke saath connect karo 🚀",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Your chance to say hello is here. Join now ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ek interesting conversation start karne ka perfect time hai 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Live moment ka maza lo aur ek new connection banao 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Don't miss the live vibes. Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `👋 ${name} Online Now`,
    body: "Say hi and start your next Zigo Live conversation ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Back Online`,
    body: "Fresh vibes ke saath reconnect karo aur enjoy karo 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Abhi connect karo aur ek beautiful Zigo moment banao ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Come join Zigo Live and start chatting 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Ek hello bhejo aur conversation ko interesting banao 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ka live moment miss mat karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi connect karo aur live vibes ka full maza lo 🚀",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Your chance to connect is now. Come say hello 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun moments aur good conversations are waiting for you ❤️",
  },
  {
    title: (name) => `👀 ${name} is Back`,
    body: "Don't miss their return. Zigo Live par reconnect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a great conversation. Join now 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka connection special ho sakta hai. Come join ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aao thodi baatein karein aur Zigo Live moment enjoy karein 💕",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Chalo live vibes ke saath kuch fun moments banate hain 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Aapka next interesting conversation partner online hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Abhi ek hello karo aur conversation start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Reconnect karo before they go offline. Join Zigo Live 💕",
  },
  {
    title: (name) => `👋 ${name} is Active`,
    body: "Say hello and enjoy some good vibes on Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Live connection ka perfect time abhi hai. Join now 🔥",
  },
  {
    title: (name) => `🎊 ${name} is Online Now`,
    body: "Fun ka time aa gaya! Zigo Live kholo aur connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Aao reconnect karein aur kuch memorable moments banayein ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Your next Zigo Live moment is waiting for you 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Abhi connect karo aur live experience ka full maza lo 💕",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello se shayad aaj ki best conversation start ho jaye ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Live vibes ke saath ek new connection start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Don't miss the moment. Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Aaj baat karne ka perfect time hai. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and don't miss the live vibes 💕",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Good vibes are back. Reconnect on Zigo Live 🔥",
  },
  {
    title: (name) => `🥳 ${name} Just Went Online`,
    body: "Fun mode ON! Abhi Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aaj ka next great conversation yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `🚀 ${name} Online Aa Gaye`,
    body: "Abhi connect karo aur live moment ko miss mat karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aao baat karein aur kuch good vibes share karein 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Your chance to connect is now. Join Zigo Live ❤️",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Say hello and enjoy the fresh live vibes 💕",
  },
  {
    title: (name) => `🔥 ${name} is Online`,
    body: "Live connection ka chance miss mat karo. Abhi join karo 🚀",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation start karne ka perfect moment abhi hai ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Zigo Live kholo aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} Online Now`,
    body: "Let's make some fun memories together on Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Abhi check karo aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good conversations are waiting. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Ho Gaye`,
    body: "Aao ek hello se conversation start karein 💬💕",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo 🔥",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Don't miss the chance. Zigo Live par abhi aao ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka live connection special ho sakta hai 💕",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "One tap away from a new conversation. Join Zigo Live 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live vibes ON hain. Abhi connect karo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur moment ko memorable banayein ❤️",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Fun aur good vibes ke liye Zigo Live par join karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Abhi unse connect karne ka perfect chance hai 🔥",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Chalo thodi masti aur baatein ho jaye ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Your next Zigo Live moment starts right now 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein 🔥",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Ek hello karo aur new conversation start karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Online Again`,
    body: "Don't miss this chance to connect on Zigo Live 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi join karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka conversation moment sirf ek tap away hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Aa Gaye`,
    body: "Zigo Live kholo aur unke saath abhi connect karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Say hi and start your next fun conversation 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your chance to connect is here. Don't miss it 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Aaj ka live moment special banane ka time hai 💕",
  },
  {
    title: (name) => `👀 ${name} is Back Online`,
    body: "Abhi check karo and reconnect on Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ka maza lene ke liye Zigo Live par aao 🥰",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Ek hello se great conversation start ho sakti hai 💬❤️",
  },
  {
    title: (name) => `🎉 ${name} is Here Now`,
    body: "Come join the fun and enjoy the Zigo Live experience 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Abhi connect karo before the moment passes 🔥",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj unke saath baat karne ka perfect chance hai ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Online Again`,
    body: "Fresh vibes ke saath reconnect karo aur enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting Zigo connection is waiting 🔥",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Say hello and start something interesting on Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi Zigo Live kholo aur live moment ka part bano 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Don't miss the vibe. Come connect now 🥰",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Zigo Live par aao aur conversation start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Good vibes aur live connection ke liye join Zigo Live 🔥",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ka special moment miss mat karo. Join now 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Aao connect karein aur kuch memorable moments banayein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived Online`,
    body: "One tap away from a new Zigo Live connection 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur unke saath good vibes share karo 💕",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Abhi check karo and don't miss the live moment ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Ho Gaye`,
    body: "Ek hello bhejo aur conversation start karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Fun mode ON! Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ki live vibe ka full maza lo aur connect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aao baat karein aur ek new connection start karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Don't miss their return. Zigo Live par reconnect karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Aaj ka perfect conversation moment yahin hai ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Abhi connect karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Good vibes are back. Come join Zigo Live 🥰",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Live connection miss mat karo. Abhi join karo 🚀",
  },
  {
    title: (name) => `👋 ${name} is Active`,
    body: "Say hello and start your next conversation on Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Your next exciting moment is just one tap away 💕",
  },
  {
    title: (name) => `💖 ${name} Online Now`,
    body: "Aaj ki vibe special ho sakti hai. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🎊 ${name} Just Came Online`,
    body: "Aao connect karein aur live moment ka maza lein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi unke saath connect karne ka perfect chance hai 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Welcome back! Zigo Live par reconnect karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Good vibes ke liye abhi Zigo Live kholo aur join karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Don't miss the chance to connect. Join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Abhi reconnect karo aur live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Aao baat karein, connect karein aur moment enjoy karein 🔥",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Zigo Live par abhi check karo. Maybe something fun is waiting 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online Now`,
    body: "Come join the fun and start a new conversation ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Aaj ka connection miss mat karo. Abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is right now. Don't wait 💕",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aao unke saath ek beautiful Zigo moment share karein ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Reconnect karo aur apni conversation continue karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes are ON. Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `🌟 ${name} Online Aa Gaye`,
    body: "Aaj ka perfect live moment aapka wait kar raha hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Come connect and enjoy the Zigo Live vibe 💕",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hi before the moment passes. Join now 🔥",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Ek tap karo aur apna next Zigo connection start karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Fun conversations aur live vibes ke liye Zigo Live kholo 💕",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Aaj ki vibe miss mat karo. Abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "One tap away from a great conversation. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao connect karein aur kuch memorable moments banayein 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Good vibes are waiting. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi connect karo aur live moment ka full maza lo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj thodi baatein ho jaye? Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Reconnect karo aur good vibes enjoy karo 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo 🔥",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun mode ON! Aao aur live moment ka part bano ❤️",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Kuch interesting miss mat karo. Zigo Live check karo 💕",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka new connection sirf ek hello away hai 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't miss out! Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Your next conversation could start right now. Join ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Aao phir se connect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `✨ ${name} Online Aa Gaye`,
    body: "Ek hello karo aur apna Zigo Live moment special banao 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Online Again`,
    body: "Live connection ka chance miss mat karo. Join now 🚀",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Conversation ka perfect time hai. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hello and start a fresh conversation 💕",
  },
  {
    title: (name) => `🥳 ${name} is Online`,
    body: "Aaj thodi masti aur good vibes ho jaye 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Come connect and enjoy your next Zigo Live moment ❤️",
  },
  {
    title: (name) => `🎊 ${name} Just Went Online`,
    body: "Abhi join karo aur live vibes ka maza lo 💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your chance to connect is now. Zigo Live par aao 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Ek hello bhejo aur conversation ko start karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Fresh vibes ke saath reconnect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Abhi Zigo Live par connect karo aur moment enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Don't miss the live moment. Join Zigo Live now 🚀",
  },
  {
    title: (name) => `👀 ${name} is Online Again`,
    body: "Abhi check karo aur unke saath reconnect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Talk time! Come join Zigo Live and say hello 💕",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aaj ka perfect conversation moment abhi hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes aur new connections ke liye join now 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Ek tap karo aur apni next conversation start karo 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time aa gaya! Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Abhi connect karo aur live experience ka full maza lo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Aaj ki live vibe ka part bano aur connect karo ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hello and make your Zigo moment special 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ON hain. Don't miss the moment 🚀",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aao baat karein aur ek new connection start karein ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation ka chance abhi hai. Join Zigo Live 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Fresh vibes ke saath live moment enjoy karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Online`,
    body: "Your next great Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Don't wait! Abhi connect karo and enjoy the vibe 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect time for a hello. Zigo Live par join karo 🥰",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek tap se new conversation start karo. Join now 🔥",
  },
  {
    title: (name) => `👀 ${name} is Here Now`,
    body: "Abhi check karo and don't miss the live moment ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online Again`,
    body: "Reconnect karo aur good vibes share karo 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Chalo kuch fun moments banate hain. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} Online Ho Gaye`,
    body: "Aao connect karein aur thodi sweet baatein karein ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj ka chat moment miss mat karo. Come join 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next Zigo conversation is just one tap away 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi Zigo Live kholo aur live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj unke saath connect karne ka perfect chance hai 🥰",
  },
  {
    title: (name) => `👋 ${name} Online Now`,
    body: "Say hi and start a fresh Zigo Live conversation 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo aur live moment ko miss mat karo 🚀",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Good vibes are waiting. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 💕",
  },
  {
    title: (name) => `🎊 ${name} is Active`,
    body: "Fun ka time hai! Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the chance. Abhi connect karo 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Zigo Live par aao aur unke saath live connection banao 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Aao phir se connect karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before you miss the fun 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Your next exciting conversation could start right now 🥰",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aao baat karein aur apna Zigo Live moment banao ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Online Now`,
    body: "Live vibes ka full maza lene ke liye abhi join karo 🚀",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Fun conversations are waiting. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Welcome back vibes! Abhi reconnect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aaj ka connection special ho sakta hai. Don't miss it 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Ek hello karo aur conversation start karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "One tap away from a new Zigo Live connection ❤️",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and enjoy the live vibes on Zigo Live 🥰",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Abhi connect karo aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aaj ka perfect live connection yahin se start ho sakta hai ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Don't miss the moment. Zigo Live par join karo 💕",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur good vibes ke saath conversation continue karo 🥰",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj baat karne ka mood hai? Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Your chance to connect is right now. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aao connect karein aur kuch special moments banayein 💕",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Kuch interesting miss mat karo. Abhi Zigo Live check karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Online`,
    body: "Good vibes aur fresh conversations are waiting 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Fun mode ON! Zigo Live par abhi join karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived Online`,
    body: "Aaj ka live moment miss mat karo. Connect now ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Ek hello se new conversation start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Abhi reconnect karo before they go offline 🚀",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing! Zigo Live kholo aur join karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Aao baat karein aur moment enjoy karein 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Aaj thodi masti aur good vibes ho jaye 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting Zigo moment is waiting ❤️",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Aao unhe welcome karein aur ek fun chat start karein 💕",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Live vibes ke liye Zigo Live par aao aur connect karo 🥰",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Don't miss the chance to say hello. Join now ❤️",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Abhi connect karo aur live moment ka maza lo 💕",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aaj ek new connection start karne ka perfect time hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Zigo Live kholo aur unke saath good vibes share karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun conversations ke liye abhi join karo 💕",
  },
  {
    title: (name) => `👀 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "One tap away from a great conversation. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aaj ka chat moment special ho sakta hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your chance to connect is now. Don't miss it 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aao baatein karein aur live vibes enjoy karein 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Again`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Abhi join karo aur ek new conversation start karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Live connection ka perfect time abhi hai. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Say hello and enjoy the moment with ${name} ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Online`,
    body: "Good vibes are live. Come join Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Abhi connect karo aur live moment ko special banao 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka perfect connection sirf ek tap away hai 🔥",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't wait! Zigo Live kholo aur abhi join karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Aao phir se connect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🥳 ${name} Online Now`,
    body: "Fun ka mood hai? Zigo Live par aao aur enjoy karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello se conversation start karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before the moment passes 💕",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj unke saath connect karne ka perfect chance hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ON hain. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ka live moment miss mat karo. Join now 💕",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Reconnect karo aur fresh conversation start karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo Live connection is waiting ❤️",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aao thodi friendly baatein karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `✨ ${name} is Online Now`,
    body: "One tap away from a new conversation. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Abhi Zigo Live par connect karo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Here`,
    body: "Say hello and make your Zigo moment special 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Live vibes aur good conversations ke liye join karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Abhi join karo aur moment miss mat karo 🚀",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Aao reconnect karein aur live vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🎉 ${name} Online Aa Gaye`,
    body: "Fun conversations ke liye Zigo Live par aao 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka connection miss mat karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Don't miss their return. Abhi reconnect karo 💕",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Aao connect karein aur kuch memorable moments banayein 🥰",
  },
  {
    title: (name) => `👀 ${name} is Online Now`,
    body: "Abhi check karo and join the live vibes 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Your chance to say hello is here. Come join ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online Again`,
    body: "Aaj phir se conversation start karne ka time hai 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Zigo Live kholo aur unke saath live connect karo 🚀",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aao baat karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Chalo kuch fun moments banate hain. Join now 💕",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka live moment aapka wait kar raha hai 🔥",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hi and start a new Zigo Live conversation ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur fresh live vibes ka maza lo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Good vibes aur new connections ke liye Zigo Live kholo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi connect karo before they go offline ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Ek hello bhejo aur apna next conversation start karo 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk, connect and enjoy your Zigo Live moment 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ki vibe miss mat karo. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Abhi unke saath connect karo aur moment enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is now. Join Zigo Live 🔥",
  },
  {
    title: (name) => `👀 ${name} is Here Now`,
    body: "Kuch interesting miss mat karo. Abhi check karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Aao phir se connect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Aaj ka special live moment miss mat karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time hai! Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `❤️ ${name} is Active`,
    body: "Aao baat karein aur ek beautiful moment share karein 💕",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation ka perfect time abhi hai. Join Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Ek tap karo aur live connection start karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo moment is waiting. Come join ❤️",
  },
  {
    title: (name) => `🥳 ${name} Online Again`,
    body: "Fresh vibes aur fun conversations ke liye reconnect karo 💕",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and enjoy some good vibes on Zigo Live 🥰",
  },
  {
    title: (name) => `💖 ${name} Just Went Online`,
    body: "Don't miss the chance to connect. Abhi join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live moment aapka wait kar raha hai ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Reconnect karo aur apni Zigo Live conversation continue karo 💕",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Live fun aur good vibes ke liye abhi join karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aaj ek new connection start karne ka perfect chance hai ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aao thodi fun baatein karein aur live moment enjoy karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🔥",
  },
  {
    title: (name) => `👀 ${name} Online Hai`,
    body: "Check them out before they go offline ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready to Talk`,
    body: "Ek hello se conversation start karo. Join now 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Aaj ka live connection miss mat karo. Come join 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ON hain. Zigo Live par abhi connect karo ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aao connect karein aur kuch memorable moments banayein 💕",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Good vibes are back! Come reconnect on Zigo Live 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Online Now`,
    body: "Fun ka time hai. Abhi Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your next exciting connection starts with one tap 💕",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hello and make the moment special 🥰",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Aaj ki live vibe miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Reconnect karo aur good vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Talk time! Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live connection ka chance abhi hai. Don't miss it 🚀",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Ek hello bhejo aur new conversation start karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Abhi reconnect karo aur live vibes ka maza lo 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Your chance to connect is here. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Kuch interesting miss mat karo. Abhi check karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Aaj ka next great conversation yahin se start ho sakta hai 🥰",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo 🔥",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun moments are waiting. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't wait! Abhi connect karo and enjoy the moment 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Ek hello se conversation start karo aur good vibes enjoy karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo Live moment is just one tap away ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aaj thodi interesting baatein ho jaye? Join now 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Live vibes ka part banna hai? Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein ❤️",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Aaj ka connection special ho sakta hai. Come join 💕",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start your next Zigo conversation 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live moment miss mat karo. Abhi Zigo Live par join karo 🚀",
  },
  {
    title: (name) => `✨ ${name} Online Again`,
    body: "Reconnect karo aur unke saath conversation continue karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Aao baat karein aur kuch beautiful moments share karein 💕",
  },
  {
    title: (name) => `🎊 ${name} is Online`,
    body: "Fun aur live vibes ke liye abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't miss this chance to connect on Zigo Live ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Ho Gaye`,
    body: "Aaj ki conversation ka perfect time abhi hai 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Your next great Zigo Live moment is waiting for you 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Ek hello bhejo aur conversation start karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi connect karo aur live moment ka full maza lo 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Zigo Live kholo aur unke saath abhi connect karo 🥰",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Aao phir se connect karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo before the live moment passes 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online Now`,
    body: "Your next conversation is one tap away. Join Zigo Live 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Went Online`,
    body: "Fun ka time hai! Abhi join karo aur enjoy karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aaj ki live vibes ke saath ek new connection banao 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Aa Gaye`,
    body: "Don't miss the chance. Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `👋 ${name} is Here`,
    body: "Say hello and start something interesting on Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aao baat karein aur apna live moment special banayein ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Online Again`,
    body: "Reconnect karo aur good vibes ke saath enjoy karo 💕",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect time for a quick hello. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi connect karo aur live conversation ka maza lo ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka special connection miss mat karo. Join now 💕",
  },
  {
    title: (name) => `👀 ${name} is Back Online`,
    body: "Abhi check karo aur unke saath reconnect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live vibes ON hain. Come join Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived Online`,
    body: "Aao ek hello se conversation start karein ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Good vibes aur fun conversations are waiting 💕",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Zigo Live par aao aur live moment ka full maza lo 🔥",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Aaj ka mood live hai. Come join ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Ek tap karo aur connect ho jao 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss out. Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Fresh vibes are waiting. Come reconnect ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aaj ki best conversation yahin se start ho sakti hai 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Abhi connect karo aur live vibes enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Aaj ka chance miss mat karo. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hi and continue your conversation on Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Your next Zigo Live moment starts right here 💕",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Fun, chat aur good vibes ke liye join now 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Aao connect karein aur moment ko special banayein ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "One tap away from your next great conversation 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Aaj thodi friendly baatein ho jaye? Come join ❤️",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Don't miss the moment. Zigo Live par abhi check karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Aapka next exciting Zigo moment wait kar raha hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo aur live vibes ka maza lo 🚀",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Aaj ka perfect chat moment abhi hai. Join Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Ho Gaye`,
    body: "Ek hello karo aur conversation ko interesting banao 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun mode ON! Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is here. Come join ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aao live vibes enjoy karein aur ek new connection banao 💕",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and start a fresh conversation on Zigo Live 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Good vibes aur live connection ke liye join now 🔥",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Abhi connect karo aur apna Zigo moment special banao ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur conversation continue karein 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live moment miss mat karo. Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello se shuru karo aur good vibes enjoy karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Aaj ka new connection yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Come join the live vibes and make the moment special 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Don't miss the chance to start a great conversation 💕",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo and enjoy the live vibes 🥰",
  },
  {
    title: (name) => `🎉 ${name} is Here`,
    body: "Fun ka time aa gaya! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur kuch beautiful moments share karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ka perfect connection ek tap away hai 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't wait! Abhi join karo aur moment enjoy karo 🚀",
  },
  {
    title: (name) => `🥳 ${name} Online Again`,
    body: "Fresh vibes aur fun conversation ke liye reconnect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Talk time! Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ki live vibe miss mat karo. Join now 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Your next Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Ek hello karo aur conversation start karo 💕",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hi and enjoy the moment on Zigo Live 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Now`,
    body: "Live connection ka chance abhi hai. Join Zigo Live 🚀",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Good vibes are back. Come reconnect ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Abhi connect karo aur live moment ka maza lo 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Fun conversations are waiting. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Online`,
    body: "Aao thodi friendly baatein karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your chance to connect is now. Don't miss it 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Zigo Live par aao aur apna next connection start karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj baat karne ka perfect time hai. Join now ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Ek hello se conversation start karo aur moment enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka full maza lene ke liye abhi join karo 🥰",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Reconnect karo aur fresh Zigo Live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Say hello and continue your conversation on Zigo Live 💕",
  },
  {
    title: (name) => `🌟 ${name} is Online Now`,
    body: "Aaj ka special live moment aapka wait kar raha hai 🔥",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Fun, chat aur good vibes ke liye Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Went Online`,
    body: "Abhi connect karo aur live moment miss mat karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Your chance to reconnect is here. Join now 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aaj ek new conversation start karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Come join the live vibes and enjoy the moment 💕",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Kuch interesting miss mat karo. Abhi Zigo Live check karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Don't wait! Abhi Zigo Live par connect karo 🚀",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Aaj ki conversation abhi start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Your next Zigo Live moment is one tap away 💕",
  },
  {
    title: (name) => `🥳 ${name} is Online Again`,
    body: "Aao reconnect karein aur kuch fun moments banayein 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Live vibes ka chance miss mat karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Abhi connect karo aur apna moment special banao 💕",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Ek hello se great conversation start ho sakti hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo aur live vibes ka full maza lo ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka connection special ho sakta hai. Come join 💕",
  },
  {
    title: (name) => `👋 ${name} is Online Now`,
    body: "Say hi and start your next Zigo Live conversation 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Don't miss the moment. Abhi connect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur good vibes enjoy karein 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Ek hello karo aur new connection start karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting Zigo moment starts now ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi Zigo Live par aao aur live vibes enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Aaj ka chance miss mat karo. Join Zigo Live 🚀",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Aao reconnect karein aur conversation continue karein ❤️",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun ka time hai. Zigo Live par abhi join karo 💕",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo and enjoy the live vibes 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ki best conversation yahin se start ho sakti hai ❤️",
  },
  {
    title: (name) => `🥳 ${name} Just Arrived Online`,
    body: "Come join the fun and connect on Zigo Live 💕",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Don't miss their return. Abhi reconnect karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao thodi baatein karein aur moment enjoy karein 🥰",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect time for a hello. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Conversation ka mood hai? Abhi connect karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live vibes ka full maza lene ke liye join now 🚀",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka special connection miss mat karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Reconnect karo aur fresh good vibes enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo Live moment is waiting. Join now 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hello and enjoy some fun time on Zigo Live 💕",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Fun conversations ke liye abhi Zigo Live par aao 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi connect karo aur live moment ko special banao ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aaj unke saath connect karne ka perfect chance hai 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Live vibes are back. Come join Zigo Live 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss out. Abhi Zigo Live kholo aur connect karo 🚀",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur ek new connection start karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your next Zigo moment is waiting. Join now 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Ek hello karo aur conversation ko interesting banao 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Live vibes ke saath connect karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo and see what's happening on Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Aao reconnect karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `🎊 ${name} Just Came Online`,
    body: "Fun ka time aa gaya! Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live connection miss mat karo. Join now 💕",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aao connect karein aur kuch memorable moments banayein 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi Zigo Live kholo aur live moment ka maza lo 🚀",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Ek hello se new conversation start karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Come join the live conversation 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Fresh vibes aur fun talks ke liye reconnect karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Your chance to connect is now. Don't miss it ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Aaj ka next exciting Zigo moment yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `💫 ${name} Online Aa Gaye`,
    body: "Abhi connect karo aur live vibes enjoy karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live connection ka perfect time hai. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hi and start a fresh conversation ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Reconnect karo aur aaj ka live moment enjoy karo 💕",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka connection special ho sakta hai. Come join 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun conversations aur good vibes are waiting ❤️",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aao thodi sweet aur fun baatein karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi Zigo Live par connect karo aur moment enjoy karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Went Online`,
    body: "Conversation ka perfect time abhi hai. Join now ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Don't miss the live vibes. Come join Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Your next great connection could start with one hello 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Reconnect karo before they go offline. Join now 🚀",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Kuch interesting miss mat karo. Abhi check karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Ek tap karo aur apna Zigo Live moment start karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Fun mode ON! Zigo Live par aao aur enjoy karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Good vibes are back. Come reconnect ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Aaj ka live connection miss mat karo. Join Zigo Live 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aao baat karein aur ek memorable moment banao 🥰",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Abhi conversation start karo. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Live vibes aur good conversations are waiting ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Say hello and connect with ${name} on Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} is Online`,
    body: "Abhi join karo aur live moment ka full maza lo 🚀",
  },
  {
    title: (name) => `🥰 ${name} Online Aa Gaye`,
    body: "Ek hello bhejo aur good vibes ke saath baat start karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Your chance to connect is right now. Join Zigo Live 💕",
  },
  {
    title: (name) => `🎉 ${name} is Back`,
    body: "Aao reconnect karein aur fun moments share karein 🔥",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka perfect live moment aapka wait kar raha hai ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Abhi unke saath connect karo aur conversation enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "One tap away from your next Zigo Live moment 🥰",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Talk time! Zigo Live par aao aur say hello ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aaj kuch interesting baatein ho sakti hain. Join now 🔥",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Abhi check karo and don't miss the live vibe 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Went Online`,
    body: "Fun ka chance abhi hai. Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Reconnect karo aur fresh conversation start karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Aao live vibes enjoy karein aur connect karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Don't miss the chance to connect. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ek new connection start karne ka perfect moment hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live moment ka maza lene ke liye abhi join karo 💕",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Say hi and reconnect on Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Arrived Online`,
    body: "Aaj ka live connection miss mat karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Aao baat karein aur ek fun conversation start karein 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Your next beautiful Zigo moment could start now ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Fresh vibes are waiting. Come reconnect 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Abhi connect karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Ho Gaye`,
    body: "Zigo Live kholo aur abhi unke saath connect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur good vibes ke saath enjoy karo 💕",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before you miss the moment 🔥",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun conversations are waiting. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka connection miss mat karo. Come join 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Your next Zigo Live conversation starts with one tap 🥰",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Abhi connect karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Good vibes ke saath ek new connection start karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Chalo thodi masti aur fun baatein ho jaye 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka live moment special banane ka perfect time hai ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Missed them? Abhi Zigo Live par reconnect karo 💕",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Don't miss the chance to connect. Join Zigo Live 🥰",
  },
  {
    title: (name) => `👋 ${name} Online Now`,
    body: "Say hello and start a fresh conversation ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Live vibes are waiting. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aao connect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo moment could start right now ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation ka perfect time hai. Join now 🥰",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi Zigo Live kholo aur live moment enjoy karo 🔥",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't wait! Abhi connect karo aur moment miss mat karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Aaj ek new connection start karne ka chance hai 💬",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Your chance to say hello is here. Join Zigo Live 🔥",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Kuch interesting miss mat karo. Abhi check karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online Again`,
    body: "Fun vibes are back. Come join Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aaj ki conversation special ho sakti hai. Join now 🥰",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Live connection ka perfect time abhi hai 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aao baat karein aur apna Zigo Live moment banao ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Ek hello se conversation start karo aur enjoy karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Good vibes aur live moments ke liye Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Reconnect karo aur unke saath kuch fun moments share karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka next exciting conversation yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi join karo aur live vibes ka full maza lo 🚀",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hi and continue your Zigo Live connection ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing! Come join the live moment 💕",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka chance miss mat karo. Abhi connect karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aao live vibes enjoy karein aur ek new connection banao 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk, connect and enjoy. Zigo Live par aao 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 🔥",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Good vibes are back. Reconnect now ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before the live moment passes 💕",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun ka time hai. Zigo Live par join karo 🥰",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aaj ka connection special ho sakta hai. Join now ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Now`,
    body: "Live vibes miss mat karo. Abhi Zigo Live par aao 🚀",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao connect karein aur kuch memorable moments banayein 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Ek hello bhejo aur conversation start karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur live moment ka full maza lo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj thodi interesting baatein ho jaye? Come join 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun mode ON! Zigo Live par abhi connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka live moment aapka wait kar raha hai 🔥",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Say hello and start your next Zigo conversation 💕",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Don't miss the live connection. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Abhi connect karo aur apna Zigo moment special banao 💕",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ek new connection start karne ka perfect chance hai 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a great conversation. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Talk time! Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Aao reconnect karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aaj ka moment special banane ka time hai. Join ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and don't miss the fun 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Live vibes aur new conversations are waiting 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Zigo Live kholo aur unke saath live connect karo 🚀",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Aaj ka chance miss mat karo. Come join ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Ek hello se new connection start karo 💕",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun conversations ke liye Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Reconnect karo aur apna next live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Hai`,
    body: "Aao thodi fun baatein karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect time to connect. Abhi Zigo Live kholo 🔥",
  },
  {
    title: (name) => `👋 ${name} is Active`,
    body: "Say hello and enjoy your next Zigo Live moment ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation ka mood hai? Join Zigo Live 💕",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Good vibes are back. Come reconnect 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Now`,
    body: "Abhi connect karo aur live moment miss mat karo 🚀",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Your next great Zigo conversation is waiting ❤️",
  },
  {
    title: (name) => `🎊 ${name} Just Arrived`,
    body: "Live fun ke liye Zigo Live par abhi join karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Online`,
    body: "Chalo kuch fun aur interesting baatein ho jaye 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Ho Gaye`,
    body: "Aaj ka live connection miss mat karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your moment to connect is here. Join Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Ek hello se aaj ki beautiful conversation start ho sakti hai 🥰",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo and enjoy the live vibes 🔥",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka perfect Zigo moment yahin se start ho sakta hai ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur ek new connection banayein 💕",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka full maza lo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Don't miss the chance. Abhi join karo 💕",
  },
  {
    title: (name) => `💫 ${name} Just Arrived Online`,
    body: "Ek hello karo aur conversation start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live moment ka maza lene ke liye Zigo Live kholo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hi and make your next Zigo Live moment special 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ki live vibes aapka wait kar rahi hain 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj unse connect karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `🎉 ${name} Online Now`,
    body: "Fun, chat aur good vibes ke liye join Zigo Live 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Abhi connect karo aur live moment enjoy karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Aao reconnect karein aur fresh vibes share karein 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Zigo Live par aao aur conversation start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Your chance to connect is now. Don't miss it 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aaj ka new connection sirf ek hello away hai 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Reconnect karo aur apna Zigo Live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ON hain. Abhi join karo 💕",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Kuch interesting miss mat karo. Zigo Live check karo 🥰",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Perfect timing! Abhi connect karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `🎊 ${name} is Online`,
    body: "Fun ka time hai. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Your next Zigo Live connection starts with one tap 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aao baat karein aur kuch memorable moments banayein ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Good vibes ke liye Zigo Live par join karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Chalo aaj kuch fun moments banate hain 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready to Chat`,
    body: "Ek hello se conversation start karo aur enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aaj ka live moment miss mat karo. Join Zigo Live 💕",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Abhi reconnect karo aur live vibes enjoy karo 🥰",
  },
  {
    title: (name) => `👋 ${name} is Here`,
    body: "Say hello and start your next Zigo conversation 🔥",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ka connection special ho sakta hai. Come join ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't miss this chance. Join Zigo Live now 🚀",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aao connect karein aur live moment ka full maza lo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur good vibes ke saath conversation continue karo 💕",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Ek hello bhejo aur aaj ka moment special banao 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Your next Zigo Live moment is waiting. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aaj baat karne ka perfect time hai. Come join 💕",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Abhi check karo and enjoy the live vibes 🥰",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun ka time hai! Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Aao connect karein aur ek new conversation start karein ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Aaj ka chance miss mat karo. Abhi connect karo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Good vibes aur live connection ke liye join Zigo Live ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't wait! Your chance to connect is now 💕",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Ek hello se conversation start karo aur moment enjoy karo 🥰",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Say hi and reconnect on Zigo Live 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Aaj ki live vibe miss mat karo. Join now ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Zigo Live kholo aur connect karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka full maza lene ke liye abhi join karo 🥰",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ka connection special ho sakta hai. Come join ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a great conversation. Join Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Abhi connect karo aur apna Zigo moment special banao 🔥",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Aao thodi friendly baatein karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Back`,
    body: "Fresh vibes are back! Come reconnect 💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your chance to connect is waiting. Don't miss it 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Arrived`,
    body: "Abhi check karo and maybe start a new conversation ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka live moment enjoy karne ke liye Zigo Live kholo 💕",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Conversation ka perfect chance abhi hai. Join now 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Don't miss the moment. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Abhi connect karo aur live vibes ka maza lo ❤️",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun conversations aur good vibes ke liye join karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Online Again`,
    body: "Reconnect karo aur apna next Zigo Live moment enjoy karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Aaj ek new conversation start karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `👋 ${name} Online Now`,
    body: "Say hello and make your Zigo Live moment special 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Live vibes are back. Abhi reconnect karo 🥰",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka connection miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aao connect karein aur kuch good vibes share karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Your next great conversation could start now 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk, connect and enjoy. Zigo Live par aao 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Abhi join karo aur live moment ka part bano 🔥",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Kuch interesting miss mat karo. Zigo Live check karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time hai! Come join Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ka perfect live connection yahin se start ho sakta hai 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Aao reconnect karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Ek hello bhejo aur conversation start karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived`,
    body: "Don't miss the live moment. Abhi join karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aaj ek new connection banane ka chance hai ❤️",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hi and start your next Zigo Live conversation 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Good vibes aur live connections ke liye join karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🚀",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aao baat karein aur moment ko special banayein ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka maza lo 💕",
  },
  {
    title: (name) => `🥳 ${name} Online Again`,
    body: "Fresh vibes aur fun conversations are waiting 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo Live moment starts right now ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Don't miss the chance to connect. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka live connection special ho sakta hai 🥰",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo and enjoy the moment ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Here`,
    body: "Fun, chat aur good vibes ke liye join now 💕",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ka perfect conversation moment abhi hai 🔥",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "One tap away from a new Zigo connection ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein 💕",
  },
  {
    title: (name) => `💬 ${name} is Online Now`,
    body: "Talk time! Zigo Live par aao aur connect karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Good vibes are back. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live vibes miss mat karo. Abhi join karo 🚀",
  },
  {
    title: (name) => `✨ ${name} Just Arrived Online`,
    body: "Aaj unke saath connect karne ka perfect chance hai ❤️",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Say hello and start your next conversation 💕",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun ka time hai. Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao connect karein aur good vibes share karein 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Don't miss the moment. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka live moment aapka wait kar raha hai 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello se conversation start karo 🔥",
  },
  {
    title: (name) => `🥳 ${name} Online Now`,
    body: "Aao thodi masti karein aur live vibes enjoy karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Your chance to connect is now. Join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Reconnect karo aur fresh vibes ka maza lo 🥰",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aaj ka next great conversation yahin se start ho sakta hai ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Abhi check karo and don't miss out 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Good vibes aur live connection ke liye Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next Zigo Live moment starts with one tap ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka chance miss mat karo. Come connect 💕",
  },
  {
    title: (name) => `🎊 ${name} is Here`,
    body: "Fun conversations are waiting. Join Zigo Live 🥰",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Perfect timing! Abhi connect karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karein aur apna Zigo moment enjoy karein ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Don't miss the comeback. Reconnect now 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Aaj ka live connection aapka wait kar raha hai 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Abhi join karo aur live vibes ka full maza lo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Ek hello bhejo aur conversation ko start karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun mode ON! Zigo Live par aao aur enjoy karo 🔥",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Aao reconnect karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi connect karo aur live moment ko special banao 💕",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ek new connection start karne ka perfect time hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live vibes ka chance miss mat karo. Join Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Your next exciting conversation is waiting ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Abhi Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "One tap away from a great Zigo Live moment 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Missed them? Abhi reconnect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Aaj ka live moment miss mat karo. Come join 💕",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo and don't miss the vibe 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aao connect karein aur ek memorable moment banayein ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Here Now`,
    body: "Fun aur good vibes ke liye Zigo Live par join karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Aaj ka connection special ho sakta hai. Join now 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Fresh vibes are waiting. Come reconnect 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Ek hello se new conversation start karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Abhi join karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj thodi baatein ho jaye? Zigo Live par aao 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Don't miss this chance to connect ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Aao friendly vibes ke saath conversation start karein 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Your next Zigo Live moment is waiting for you 🔥",
  },
  {
    title: (name) => `👋 ${name} is Here`,
    body: "Say hello and enjoy the live moment ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Reconnect karo aur apni Zigo conversation continue karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live connection ka perfect time abhi hai. Join now 🚀",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka special moment miss mat karo 🥰",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun conversations aur live vibes ke liye Zigo Live kholo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Aao connect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Don't miss the moment. Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Ek hello bhejo aur conversation start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Aao reconnect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🥳 ${name} Online Again`,
    body: "Fresh vibes aur fun moments ke liye join Zigo Live 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Your chance to connect is now. Don't miss it ❤️",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Abhi check karo aur live moment ka part bano 💕",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Aaj ka connection sirf ek tap away hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Live vibes ON hain. Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aaj ka perfect conversation moment yahin hai ❤️",
  },
  {
    title: (name) => `🎊 ${name} Just Arrived`,
    body: "Come join the fun and start a new conversation 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Abhi connect karo aur live vibes ka maza lo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Reconnect karo aur apna next Zigo Live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aao thodi friendly baatein karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Conversation start karne ka perfect time abhi hai 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Say hello and enjoy your Zigo Live moment ❤️",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Kuch interesting miss mat karo. Abhi join karo 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Fresh live vibes ke saath reconnect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Don't miss the chance to connect on Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka special Zigo moment aapka wait kar raha hai ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Ek hello bhejo aur conversation start karo 💕",
  },
  {
    title: (name) => `🎉 ${name} is Here Now`,
    body: "Fun ka time hai! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🥳 ${name} Just Went Online`,
    body: "Abhi connect karo aur live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next great conversation could start right now 💕",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Aaj ka connection miss mat karo. Join now ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hi and make your Zigo Live moment special 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Reconnect karo aur live vibes ka maza lo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi Zigo Live par aao aur live connection enjoy karo 🚀",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aao baat karein aur kuch memorable moments banayein ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Come join Zigo Live and connect 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Ek hello se new conversation start karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Perfect timing! Abhi connect karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the live moment. Join Zigo Live 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Your next Zigo Live moment is waiting 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo and enjoy the vibe ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Aao reconnect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun ka time aa gaya. Zigo Live par join karo 🥰",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka live connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Ek hello karo aur conversation start karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is here. Come join 💕",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Say hi and reconnect on Zigo Live 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Aaj ki live vibe miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Conversation ka perfect time hai. Abhi connect karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aao baat karein aur ek new connection start karein 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Don't miss their return. Abhi join karo 🚀",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Good vibes ke saath ek fun conversation start karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aaj ka next Zigo Live moment sirf ek tap away hai 💕",
  },
  {
    title: (name) => `🎊 ${name} is Active Now`,
    body: "Fun aur live vibes ke liye Zigo Live par aao 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Abhi connect karo aur conversation ko special banao ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur fresh live vibes enjoy karo 💕",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and don't miss the moment 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka live connection aapka wait kar raha hai 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Zigo Live par abhi join karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Ek hello bhejo aur apna next Zigo moment start karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Here Now`,
    body: "Chalo thodi masti aur fun conversation ho jaye 🔥",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Your next great conversation could start now ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Live vibes ka full maza lene ke liye join Zigo Live 💕",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and enjoy the moment 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Abhi connect karo aur live moment miss mat karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Aao reconnect karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ek new connection start karne ka perfect chance hai 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Don't miss the live vibes. Join Zigo Live 🚀",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aao baat karein aur conversation start karein ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Good vibes aur friendly conversations are waiting 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Abhi join karo aur apna Zigo Live moment enjoy karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka connection miss mat karo. Come join ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Ek hello se beautiful conversation start ho sakti hai 💕",
  },
  {
    title: (name) => `🎉 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before you miss the fun ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka perfect live connection yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Zigo Live kholo aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Live vibes are back. Come join now 🚀",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karein aur moment ko special banayein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Don't miss the chance to connect on Zigo Live 💕",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Fun ka time hai. Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a new connection ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ki live vibes ka maza lo aur connect karo 💕",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Reconnect karo aur good vibes ke saath conversation continue karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Abhi join karo aur live moment ka part bano ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Say hello and start your Zigo Live conversation 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Aaj ka perfect connection sirf ek tap away hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao connect karein aur memorable moment banayein ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Zigo Live par abhi connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Went Online`,
    body: "Aaj unke saath friendly baatein ho jaye 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka maza lo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 💕",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Kuch interesting miss mat karo. Abhi join karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Live connection ka chance abhi hai. Join Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Your next Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aao thodi baatein karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Fun mode ON! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🥰 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Don't miss the moment. Abhi connect karo 💕",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka connection special ho sakta hai. Join now 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Your next great conversation could start right here ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and enjoy the live vibes 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live moment miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aao baat karein aur ek new connection start karein ❤️",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun conversations ke liye abhi join karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "One tap away from your next Zigo Live moment 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Aaj unke saath connect karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Abhi connect karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo aur apni Zigo Live journey continue karo 🥰",
  },
  {
    title: (name) => `👀 ${name} Just Came Online`,
    body: "Don't miss this chance. Abhi Zigo Live check karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka live connection aapka wait kar raha hai 💕",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek hello bhejo aur conversation ko special banao 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is now. Don't miss it 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Aao thodi friendly baatein karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Ek tap karo aur apna next Zigo moment start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Fresh live vibes are waiting. Come reconnect 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo 🚀",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Aaj phir se conversation start karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Say hi and start something interesting on Zigo Live 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time hai! Come join the live vibes 🔥",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka special connection miss mat karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Abhi connect karo aur moment ko memorable banao 💕",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your next Zigo Live conversation is waiting 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss the live moment. Join now 🔥",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Aao baat karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Reconnect karo aur fresh vibes enjoy karo 💕",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Abhi check karo and see what's happening 🔥",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ek new connection start karne ka chance hai ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing! Zigo Live par abhi join karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Live vibes ke saath apna next moment enjoy karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi connect karo before they go offline ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka perfect conversation moment yahin hai 💕",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Aao reconnect karein aur live moment enjoy karein 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Zigo Live kholo aur say hello ❤️",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived`,
    body: "Ek hello bhejo aur apna next connection start karo 💕",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Good vibes aur fun conversations are waiting 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your chance to connect is right now ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hello and enjoy your Zigo Live moment 💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Abhi join karo aur live connection ka maza lo 🥰",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aaj ka live moment miss mat karo. Come join 🔥",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun conversations ke liye Zigo Live par aao ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Ek hello se beautiful conversation start ho sakti hai 💕",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Reconnect karo aur fresh good vibes enjoy karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Don't miss this chance. Abhi join karo ❤️",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo aur live moment ka part bano 💕",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Chalo aaj kuch fun moments banate hain 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka connection special ho sakta hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Conversation ka perfect time hai. Abhi connect karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Aao reconnect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka full maza lene ke liye abhi join karo 🚀",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello karo aur new conversation start karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur live moment ko special banao ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka chance miss mat karo. Come join Zigo Live 💕",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hello and enjoy the live vibes 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Your next Zigo Live moment starts right now ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Aao baat karein aur moment enjoy karein 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Abhi unke saath connect karo aur good vibes share karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Perfect timing! Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "One tap away from a great conversation 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Aao reconnect karein aur live vibes enjoy karein 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't wait. Abhi connect karo aur moment miss mat karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Good vibes aur live connections are waiting 💕",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Aaj ek new connection start karne ka perfect chance hai 🔥",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo and enjoy the Zigo Live moment ❤️",
  },
  {
    title: (name) => `🎉 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Fun ka time hai. Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur conversation start karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Ho Gaye`,
    body: "Abhi connect karo aur live vibes ka maza lo 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Aaj ka moment special banane ka perfect time hai 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss the live connection. Join Zigo Live 🔥",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Aao connect karein aur ek memorable moment banayein ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka connection sirf ek tap away hai 💕",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hi and reconnect before they go offline 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ON hain. Abhi Zigo Live par join karo 🚀",
  },
  {
    title: (name) => `🎉 ${name} is Here`,
    body: "Fun conversations ke liye come join Zigo Live ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Ek hello bhejo aur conversation ko start karo 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aao thodi friendly baatein karein aur live moment enjoy karein 🔥",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your chance to connect is now. Don't miss it ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Reconnect karo aur fresh vibes enjoy karo 🥰",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Aaj ka perfect Zigo Live moment aapka wait kar raha hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aao connect karein aur kuch special moments share karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Abhi join karo aur live connection ka maza lo 💕",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Kuch interesting miss mat karo. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Fun aur good vibes ke liye abhi join karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Your next Zigo Live moment is just one tap away 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Aaj thodi masti aur interesting baatein ho jaye 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss the chance to connect ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka live connection special ho sakta hai 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Aao reconnect karein aur live vibes enjoy karein 🥰",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello karo aur apna next Zigo moment start karo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Active Now`,
    body: "Say hello and enjoy the live connection 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing! Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Aapka next exciting conversation wait kar raha hai ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aaj ka moment special banane ka chance hai 💕",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Conversation ka perfect time abhi hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Abhi connect karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Don't miss the live vibes. Zigo Live par join karo 🚀",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao phir se connect karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Arrived`,
    body: "Abhi check karo and enjoy the moment 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online Now`,
    body: "Fun ka time hai! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka connection miss mat karo. Join now ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your next Zigo moment starts right here 💕",
  },
  {
    title: (name) => `🥰 ${name} Online Hai`,
    body: "Aao thodi friendly baatein karein aur live vibes enjoy karein 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Say hello and start your next conversation ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes aur live connection ke liye Zigo Live kholo 💕",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Abhi connect karo aur apna Zigo moment special banao 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo before they go offline. Join now 🚀",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Aaj ka live moment miss mat karo ❤️",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hi and enjoy the live vibes on Zigo Live 💕",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Fun conversations are waiting. Come join 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Abhi Zigo Live par connect karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ka perfect connection sirf ek tap away hai 💕",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aao connect karein aur good vibes share karein 🥰",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Don't miss the chance. Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Arrived Online`,
    body: "Aaj unke saath connect karne ka perfect moment hai 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Reconnect karo aur fresh live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Your chance to connect is here. Join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live moment miss mat karo. Abhi join karo 🚀",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before you miss the fun ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur conversation continue karein 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun ka time hai! Zigo Live par aao aur enjoy karo 🥰",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Aaj ka live connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "One tap away from a great conversation ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Ek hello bhejo aur conversation start karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live moment miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Aao thodi masti aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Come connect and enjoy your next Zigo Live moment 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Missed them? Abhi reconnect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Don't miss their return. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hello and start a fresh conversation ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka chance miss mat karo. Abhi connect karo 💕",
  },
  {
    title: (name) => `🎊 ${name} Came Online`,
    body: "Live vibes aur fun conversations ke liye join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Aao connect karein aur apna moment special banayein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting conversation is waiting 💕",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Perfect time to say hello. Come join Zigo Live 🥰",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj thodi interesting baatein ho jaye? Join now 🔥",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi connect karo aur live moment ka full maza lo ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Ek tap karo aur new Zigo connection start karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Good vibes ke saath live conversation enjoy karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss the live moment. Join now ❤️",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo aur live vibes ka part bano 💕",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur apni Zigo Live conversation continue karo 🥰",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ka perfect connection abhi available hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Ek hello bhejo aur aaj ka moment special banao ❤️",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Fun mode ON! Zigo Live par abhi join karo 💕",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Aao baat karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka live moment aapka wait kar raha hai ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Aao reconnect karein aur kuch fun moments banayein 💕",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Your chance to connect is right now. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🔥 ${name} Online Now`,
    body: "Don't miss the moment. Abhi connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aao live vibes enjoy karein aur ek new connection banao 💕",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hello and reconnect before they go offline 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ka connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next Zigo Live moment is waiting 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj baat karne ka perfect time hai. Come join 🔥",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Ek hello se beautiful conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Live vibes ke saath connect karne ka time hai 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi join karo aur live moment ka maza lo 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Good vibes are back. Come reconnect ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka next exciting conversation sirf ek tap away hai 💕",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Kuch interesting miss mat karo. Abhi check karo 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Active`,
    body: "Fun conversations ke liye Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Aao thodi masti aur good vibes share karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "One tap away from your next Zigo Live moment 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur live vibes ka full maza lo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello karo aur conversation start karo 💕",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Abhi Zigo Live par connect karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka special live moment miss mat karo 🔥",
  },
  {
    title: (name) => `👋 ${name} Just Arrived Online`,
    body: "Say hi and enjoy the live connection ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Your chance to connect is now. Join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Don't miss their return. Abhi reconnect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aaj ka new connection sirf ek hello away hai ❤️",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun aur live vibes ke liye abhi join karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Abhi Zigo Live kholo aur live moment ka maza lo 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Now`,
    body: "Aao connect karein aur apna next moment special banao ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Fresh vibes ke saath conversation continue karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Don't miss the chance to connect on Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello bhejo aur baat start karo ❤️",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Abhi check karo aur live vibes enjoy karo 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing for a new Zigo connection 🥰",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived`,
    body: "Abhi connect karo aur moment miss mat karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Good conversations are waiting. Come join ❤️",
  },
  {
    title: (name) => `🎊 ${name} Online Hai`,
    body: "Fun ka time hai! Zigo Live par abhi aao 💕",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aaj ki vibe special ho sakti hai. Connect now 🔥",
  },
  {
    title: (name) => `🥳 ${name} Just Went Online`,
    body: "Chalo kuch fun moments banate hain ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Reconnect karo aur fresh live vibes enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your next conversation could start right now 🥰",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Aaj ka live connection miss mat karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Say hi and reconnect on Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Abhi join karo aur live moment ka full maza lo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Aaj ka special conversation moment yahin hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Online`,
    body: "Come join the live vibes and make a new connection 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Don't miss the chance. Zigo Live par abhi join karo 🚀",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Ek hello bhejo aur conversation ko start karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Fun conversations are waiting. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj baat karne ka perfect chance hai. Join now ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo Live moment is waiting 💕",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo and don't miss the vibe 🥰",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Abhi connect karo aur live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Active`,
    body: "Fun mode ON! Zigo Live par join karo 💕",
  },
  {
    title: (name) => `✨ ${name} Just Arrived Online`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur good vibes ke saath enjoy karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Don't wait! Abhi Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `👋 ${name} is Online Again`,
    body: "Say hello and enjoy the live connection 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Live vibes ke saath ek new connection start karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Aao baat karein aur apna moment special banao ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Your next exciting Zigo moment is one tap away 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aaj thodi friendly baatein ho jaye 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Abhi Zigo Live par aao aur live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Come connect and don't miss the moment 💕",
  },
  {
    title: (name) => `🎉 ${name} is Back Online`,
    body: "Fresh vibes aur fun talks ke liye join Zigo Live 🔥",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Abhi check karo and maybe start something special ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Hai`,
    body: "Aaj ka perfect live connection yahin se start ho sakta hai 💕",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Ek hello bhejo aur conversation start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ka full maza lene ke liye join now 🚀",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Don't miss the chance to connect on Zigo Live ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Come join and enjoy the live moment 💕",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Fun ka time hai. Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur good vibes share karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Aaj ka live connection miss mat karo 💕",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi connect karo aur apna next Zigo moment enjoy karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Your chance to connect is now. Join Zigo Live ❤️",
  },
  {
    title: (name) => `👋 ${name} is Active Now`,
    body: "Say hi and start your next conversation 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Aao reconnect karein aur live vibes enjoy karein 🔥",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka moment special banane ka chance hai ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello se conversation start karo aur enjoy karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Don't miss the live moment. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} Just Went Online`,
    body: "Aaj unke saath connect karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Good vibes aur new connections ke liye join karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Abhi check karo and enjoy the Zigo Live vibe 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Your next conversation could start right now ❤️",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun conversations are waiting. Come join 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Reconnect karo aur fresh live vibes enjoy karo 🥰",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Don't miss the chance. Abhi join karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Aao connect karein aur moment ko special banayein 💕",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Live connection ka perfect time abhi hai 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello bhejo aur conversation start karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live moment miss mat karo. Join Zigo Live 💕",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aao thodi fun baatein karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Zigo Live par abhi connect karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Reconnect karo aur apna next live moment enjoy karo 💕",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Aaj ka chance miss mat karo. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `👋 ${name} is Here Now`,
    body: "Say hello and make a new connection ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo moment is waiting. Join now 💕",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun ka time hai! Abhi Zigo Live par aao 🔥",
  },
  {
    title: (name) => `💖 ${name} is Online Again`,
    body: "Aao reconnect karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aaj ka special connection miss mat karo 💕",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Conversation start karne ka perfect time abhi hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka maza lo aur connect karo 🚀",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka next exciting Zigo moment yahin hai ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Abhi connect karo aur live conversation enjoy karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Fresh vibes aur fun talks ke liye join now 🔥",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo and don't miss the moment ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is here. Come join 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes ke liye Zigo Live par aao 🥰",
  },
  {
    title: (name) => `💖 ${name} Online Aa Gaye`,
    body: "Aao ek hello se conversation start karein 🔥",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Reconnect karo aur live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Abhi Zigo Live par join karo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Don't miss the live connection. Join now 🚀",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Aaj ka moment special banane ka perfect chance hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Aao reconnect karein aur fresh vibes share karein 💕",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Your next Zigo Live conversation could start now 🔥",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and enjoy the moment ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Abhi connect karo aur live vibes ka maza lo 💕",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Don't miss this chance to connect 🥰",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Aaj ki live vibe special ho sakti hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Reconnect karo aur good vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karein aur apna Zigo moment banao 💕",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Fun conversations ke liye abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting connection is waiting ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi Zigo Live kholo aur unke saath connect karo 💕",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ka live moment miss mat karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Live vibes are ON. Come join Zigo Live 🚀",
  },
  {
    title: (name) => `👀 ${name} is Here Now`,
    body: "Abhi check karo aur live connection ka maza lo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Aao reconnect karein aur apni conversation continue karein 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aaj ka perfect connection yahin se start ho sakta hai 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Arrived`,
    body: "Say hello and start a fresh conversation ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Don't miss their return. Abhi join karo 💕",
  },
  {
    title: (name) => `🥰 ${name} Online Hai`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect time for a hello. Join Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Your next Zigo Live moment is waiting 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka full maza lo. Abhi join karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Aaj ka connection miss mat karo. Join now 🔥",
  },
  {
    title: (name) => `💖 ${name} Online Now`,
    body: "Ek hello bhejo aur conversation start karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun mode ON! Zigo Live par aao 💕",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Reconnect karo aur good vibes enjoy karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next great conversation is one tap away ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Abhi connect karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka live connection special ho sakta hai 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes aur fun conversations ke liye join now 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Zigo Live par connect karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Aao thodi masti karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the chance. Abhi join karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur apna Zigo Live moment enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Again`,
    body: "Fresh vibes ke saath conversation continue karo 💕",
  },
  {
    title: (name) => `👀 ${name} Just Arrived`,
    body: "Abhi check karo and enjoy the live moment 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live connection ka perfect time abhi hai. Join Zigo Live 🚀",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka special Zigo moment miss mat karo ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Ek hello karo aur apna next connection start karo 💕",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aaj baat karne ka perfect chance hai. Join now 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Aao connect karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Your chance to connect is here. Don't miss it 💕",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka maza lo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Aaj ki live vibe aapka wait kar rahi hai 🔥",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Ek hello bhejo aur conversation ko special banao ❤️",
  },
  {
    title: (name) => `👋 ${name} is Active Now`,
    body: "Say hi and start your next Zigo Live conversation 💕",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Your next exciting moment could start right now 🥰",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun ka time hai! Zigo Live par abhi join karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Aao reconnect karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Aaj ka live connection miss mat karo 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Abhi Zigo Live par connect karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ka full maza lene ke liye join now 🚀",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka connection special ho sakta hai ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before they go offline 🔥",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Aao thodi masti aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "One tap away from a new Zigo connection 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Ek hello se conversation start karo aur moment enjoy karo 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Perfect time to connect. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Reconnect karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aaj ka new connection yahin se start ho sakta hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Don't miss the live moment. Abhi join karo 🚀",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aaj thodi interesting baatein ho jaye? ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Aao connect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Good vibes aur fun conversation ke liye join now 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo Live moment starts now ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Abhi connect karo aur apna moment special banao 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Missed them? Come reconnect on Zigo Live 🥰",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start something interesting 🔥",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka live connection miss mat karo ❤️",
  },
  {
    title: (name) => `🎉 ${name} Just Went Online`,
    body: "Fun ka time hai. Abhi Zigo Live par join karo 💕",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello bhejo aur conversation start karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur good vibes share karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Aaj thodi masti aur friendly baatein ho jaye 💕",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Your next Zigo Live connection could start now 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk, connect and enjoy the live moment ❤️",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Don't miss the chance. Come join Zigo Live 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Live vibes ON hain. Abhi connect karo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and enjoy the live connection 💕",
  },
  {
    title: (name) => `🎊 ${name} Online Hai`,
    body: "Fun conversations are waiting. Join now 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Arrived`,
    body: "Aaj ka special moment miss mat karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Your chance to reconnect is here 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Abhi Zigo Live par aao aur connect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Here Now`,
    body: "Talk time! Come join the live conversation 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing! Ek hello bhejo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Live vibes are back. Join Zigo Live now 🚀",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka connection special ho sakta hai ❤️",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hello and enjoy the moment 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Good vibes ke liye abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Chalo fun aur interesting baatein karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Here`,
    body: "Your next Zigo Live moment is waiting 💕",
  },
  {
    title: (name) => `💖 ${name} Online Now`,
    body: "Abhi connect karo aur live vibes ka full maza lo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Aaj ka live moment miss mat karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Conversation ka perfect time abhi hai. Join now ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Reconnect karo aur fresh vibes enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Don't miss this chance to connect 🚀",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Aao ek hello se conversation start karein ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Your next exciting connection could start now 💕",
  },
  {
    title: (name) => `🎉 ${name} is Online`,
    body: "Fun mode ON! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo and don't miss the live moment ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Again`,
    body: "Aao reconnect karein aur conversation enjoy karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi connect karo aur Zigo Live ka maza lo 🥰",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka connection miss mat karo. Join now 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Live vibes ke saath ek new connection banao ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aao baat karein aur moment ko special banayein 💕",
  },
  {
    title: (name) => `🥳 ${name} Online Hai`,
    body: "Fun conversations ke liye abhi Zigo Live par aao 🔥",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Reconnect karo aur good vibes share karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived`,
    body: "Your chance to connect is waiting. Join Zigo Live 💕",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka live moment aapka wait kar raha hai 🥰",
  },
  {
    title: (name) => `👋 ${name} is Active`,
    body: "Say hello and enjoy some good vibes 🔥",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Abhi connect karo aur live moment miss mat karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Aaj ek new conversation start karne ka perfect chance hai 💕",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Don't miss the comeback. Abhi join karo 🥰",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Zigo Live par connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Ek hello karo aur apna next Zigo moment start karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Live connection ka chance abhi hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} Came Online`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Good vibes aur new connections are waiting 💕",
  },
  {
    title: (name) => `💫 ${name} is Back`,
    body: "Reconnect karo aur live vibes ka full maza lo 🔥",
  },
  {
    title: (name) => `👀 ${name} is Here Now`,
    body: "Abhi check karo and don't miss the fun ❤️",
  },
  {
    title: (name) => `🎉 ${name} Just Came Online`,
    body: "Fun mode ON! Come join Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek hello se conversation start karo aur good vibes enjoy karo 🥰",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka special Zigo moment miss mat karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Your next conversation could start right now ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes share karein 💕",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Abhi Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🥳 ${name} Just Went Online`,
    body: "Chalo aaj kuch fun moments banate hain ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aaj ka connection special ho sakta hai 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Abhi connect karo aur live vibes ka full maza lo 🥰",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Good vibes ke saath Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start a new connection 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aaj ka live moment miss mat karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "One tap away from a great Zigo Live moment ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aao connect karein aur kuch memorable moments banayein 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Conversation start karne ka perfect time abhi hai 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo aur live vibes ka maza lo 🚀",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Abhi Zigo Live par aao aur unke saath connect karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your chance to connect is waiting 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aaj ek fun conversation start karne ka time hai 🔥",
  },
  {
    title: (name) => `💫 ${name} Just Arrived`,
    body: "Ek hello bhejo aur live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Online Again`,
    body: "Don't miss their return. Come join Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Good vibes aur new connections ke liye abhi join karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live connection ka chance miss mat karo. Join now 🚀",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Aaj ka perfect time hai connect karne ka ❤️",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo aur live moment ka part bano 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Aao baat karein aur Zigo Live vibes enjoy karein 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Ek hello se start karo ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Back Online`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your next Zigo moment is waiting. Join now 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka connection special banane ka chance hai ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Aao connect karein aur live moment enjoy karein 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Don't miss the live vibe. Abhi Zigo Live kholo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Live vibes ON hain. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ek new conversation start karne ka perfect chance hai 💕",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and enjoy the moment 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Aao baat karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Abhi connect karo aur live moment ka maza lo 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Aaj ki vibe miss mat karo. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Your next exciting Zigo moment starts now 💕",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi join karo before you miss the live moment 🚀",
  },
  {
    title: (name) => `💖 ${name} is Here`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `👀 ${name} is Active Now`,
    body: "Kuch interesting miss mat karo. Abhi check karo 💕",
  },
  {
    title: (name) => `🎉 ${name} Online Now`,
    body: "Fun ka time hai! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Aaj ka connection miss mat karo. Abhi connect karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Live vibes aur good conversations are waiting 💕",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Reconnect karo aur kuch fun moments share karo 🔥",
  },
  {
    title: (name) => `💬 ${name} is Online`,
    body: "Aaj baat karne ka perfect time hai. Join now ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Zigo Live par aao aur live connection enjoy karo 💕",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Ek hello bhejo aur apna next Zigo moment start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Don't miss the live moment. Join Zigo Live 🚀",
  },
  {
    title: (name) => `💖 ${name} Online Again`,
    body: "Fresh vibes are waiting. Come reconnect ❤️",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and enjoy some good vibes 💕",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Abhi connect karo aur live moment ko special banao 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Aaj ka special connection miss mat karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur Zigo Live ka maza lo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Here`,
    body: "Fun ka mood hai? Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Ek hello karo aur conversation start karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Your chance to connect is now 💕",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Abhi Zigo Live par aao aur live vibes enjoy karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Active`,
    body: "Don't miss the chance. Join now 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Aaj ka next great conversation yahin se start ho sakta hai ❤️",
  },
  {
    title: (name) => `💖 ${name} is Online`,
    body: "Aao connect karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and don't miss the live moment 🔥",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived Online`,
    body: "Your next Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Ek hello bhejo aur conversation ko special banao 💕",
  },
  {
    title: (name) => `✨ ${name} is Back`,
    body: "Reconnect karo aur fresh live vibes enjoy karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Went Online`,
    body: "Talk time! Zigo Live par aao ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live connection miss mat karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Abhi join karo aur live moment ka maza lo 🚀",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ek new connection start karne ka perfect time hai ❤️",
  },
  {
    title: (name) => `👋 ${name} is Here`,
    body: "Say hello and enjoy the live vibes 💕",
  },
  {
    title: (name) => `🎉 ${name} Online Again`,
    body: "Fresh vibes aur fun conversations are waiting 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Aao thodi friendly baatein karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't miss the chance to connect. Join Zigo Live 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Ek hello karo aur apna next Zigo moment start karo 🔥",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Aao reconnect karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Online Now`,
    body: "Your next exciting conversation is waiting 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Abhi baat karo aur live moment enjoy karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live vibes ON hain. Zigo Live par join karo 🚀",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo before the moment passes ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Aaj ka special connection miss mat karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Online`,
    body: "Fun ka time hai! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Good vibes ke saath connect karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo 💕",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Ek hello bhejo aur conversation start karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Aaj ka live moment aapka wait kar raha hai 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Abhi Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Live connection ka chance miss mat karo 💕",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Your next Zigo Live connection could start now 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Aao connect karein aur live vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Abhi join karo aur apna Zigo moment special banao 🔥",
  },
  {
    title: (name) => `👀 ${name} is Online Now`,
    body: "Don't miss the moment. Zigo Live par check karo ❤️",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aaj ek new connection start karne ka chance hai 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Good vibes are waiting. Come join Zigo Live 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Ek hello se conversation start karo aur moment enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Again`,
    body: "Reconnect karo aur live vibes ka maza lo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Aaj ka live moment miss mat karo. Join now 🚀",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun ka time hai. Zigo Live par abhi aao ❤️",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Your next conversation could start with one hello 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Abhi connect karo aur live vibes enjoy karo 🔥",
  },
  {
    title: (name) => `👋 ${name} is Back`,
    body: "Say hello and reconnect on Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Good vibes aur new connections ke liye join karo 💕",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka perfect live connection yahin se start ho sakta hai 🥰",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Abhi Zigo Live par aao aur moment enjoy karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Talk time! Come join the conversation ❤️",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your chance to connect is waiting 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Reconnect karo aur live vibes enjoy karo 🥰",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Don't miss the live moment. Abhi join karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj thodi fun baatein ho jaye? Come join 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun mode ON! Zigo Live par connect karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Went Online`,
    body: "Perfect timing! Abhi Zigo Live kholo ❤️",
  },
  {
    title: (name) => `👀 ${name} is Here`,
    body: "Kuch interesting miss mat karo. Come check now 💕",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Aao reconnect karein aur good vibes share karein 🥰",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Live connection ka chance abhi hai. Join now 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka special Zigo moment aapka wait kar raha hai ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Conversation ka perfect time abhi hai. Come join 💕",
  },
  {
    title: (name) => `🥰 ${name} Just Came Online`,
    body: "Ek hello bhejo aur live vibes enjoy karo 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Your next great conversation is one tap away ❤️",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Fresh vibes are back. Come reconnect 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi join karo aur live moment ka full maza lo 🥰",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start a new connection 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Aao reconnect karein aur live vibes enjoy karein ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Aaj ka connection special ho sakta hai 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Arrived Online`,
    body: "Don't miss this moment. Join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Ek hello karo aur conversation start karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Just Went Online`,
    body: "Talk time! Abhi connect karo 💕",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun ka time hai! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Live vibes aur good conversations are waiting ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka live moment miss mat karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur apna next Zigo moment enjoy karo 🥰",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aao connect karein aur good vibes share karein 🔥",
  },
  {
    title: (name) => `👀 ${name} is Online`,
    body: "Abhi check karo and don't miss the live connection ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Perfect timing for a hello. Join now 💕",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aaj baat karne ka perfect time hai. Zigo Live kholo 🔥",
  },
  {
    title: (name) => `🥰 ${name} is Here`,
    body: "Your next fun conversation is waiting ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Abhi connect karo aur live moment ka maza lo 💕",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss the chance to connect 🔥",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai ❤️",
  },
  {
    title: (name) => `🔥 ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein 💕",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Zigo Live par aao aur unke saath connect karo 🥰",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Say hello and enjoy the moment 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Here Now`,
    body: "Fun ka time hai. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `💖 ${name} Online Again`,
    body: "Reconnect karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Your chance to connect is now 🥰",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka live moment special ho sakta hai 🔥",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aao baat karein aur conversation start karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Abhi join karo aur good vibes enjoy karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun conversations ke liye Zigo Live par aao 🔥",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Your next Zigo connection is waiting ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the live moment. Join now 💕",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Aao reconnect karein aur good vibes share karein 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Ek hello karo aur apna next Zigo moment start karo 🔥",
  },
  {
    title: (name) => `👀 ${name} Online Hai`,
    body: "Abhi check karo and enjoy the live vibes ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active Now`,
    body: "Aaj ka connection miss mat karo 💕",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Zigo Live par abhi join karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Abhi connect karo before they go offline 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes aur new conversations are waiting ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Reconnect karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Aaj ek fun conversation start karne ka chance hai 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Online`,
    body: "Your next Zigo Live moment starts now ❤️",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aao connect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `👋 ${name} Just Arrived`,
    body: "Say hello and start something interesting 🥰",
  },
  {
    title: (name) => `💖 ${name} is Here Now`,
    body: "Aaj ka live connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Abhi Zigo Live par aao aur connect karo ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aaj ka perfect chat moment hai. Join now 💕",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Don't miss their return. Reconnect now 🔥",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun ka time hai! Zigo Live par join karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Good vibes ke saath live conversation start karo 💕",
  },
  {
    title: (name) => `💫 ${name} Just Came Online`,
    body: "Your chance to connect is right now 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Abhi join karo aur live moment miss mat karo 🚀",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Kuch interesting miss mat karo. Abhi check karo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Back`,
    body: "Reconnect karo aur fresh vibes enjoy karo 💕",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka special connection miss mat karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Your next Zigo moment is waiting ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello bhejo aur conversation start karo 💕",
  },
  {
    title: (name) => `🥰 ${name} Online Now`,
    body: "Aao thodi friendly baatein karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Abhi connect karo aur live vibes ka maza lo ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live connection aapka wait kar raha hai 💕",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aao ek new connection start karein 🥰",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Don't miss the live vibe. Join Zigo Live 🚀",
  },
  {
    title: (name) => `👋 ${name} is Online`,
    body: "Say hello and enjoy the moment ❤️",
  },
  {
    title: (name) => `🎉 ${name} Online Hai`,
    body: "Fun conversations ke liye abhi join karo 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next exciting Zigo connection starts now 🔥",
  },
  {
    title: (name) => `💖 ${name} Just Went Online`,
    body: "Aaj ka connection miss mat karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🥳 ${name} Just Came Online`,
    body: "Chalo thodi masti aur baatein ho jaye 🔥",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka special Zigo Live moment waiting for you ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Abhi connect karo 💕",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Ek hello se new conversation start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live vibes ka full maza lo aur join karo 🚀",
  },
  {
    title: (name) => `👀 ${name} is Active`,
    body: "Abhi check karo and don't miss the moment ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Perfect time to connect on Zigo Live 💕",
  },
  {
    title: (name) => `💖 ${name} is Back`,
    body: "Reconnect karo aur good vibes share karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your next Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Active Now`,
    body: "Aao baat karein aur live moment enjoy karein 💕",
  },
  {
    title: (name) => `🌟 ${name} Online Again`,
    body: "Fresh vibes ke saath reconnect karo 🔥",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Aaj ka perfect conversation time hai ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Abhi Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Went Online`,
    body: "Don't miss this chance. Join now 🥰",
  },
  {
    title: (name) => `💫 ${name} is Here`,
    body: "Aaj ka live connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `👋 ${name} is Back Online`,
    body: "Say hello and reconnect on Zigo Live ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Good vibes aur live conversations are waiting 💕",
  },
  {
    title: (name) => `🎉 ${name} is Active Now`,
    body: "Fun mode ON! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `🥰 ${name} Online Hai`,
    body: "Aao thodi friendly baatein karein ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "One tap away from a great conversation 💕",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka moment miss mat karo. Join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived Online`,
    body: "Abhi connect karo aur live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Talk time! Zigo Live par aao 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active`,
    body: "Your next Zigo Live moment could start now 🥰",
  },
  {
    title: (name) => `🔥 ${name} Online Again`,
    body: "Reconnect karo before they go offline 🚀",
  },
  {
    title: (name) => `💫 ${name} Just Went Online`,
    body: "Aaj ka live moment special ho sakta hai ❤️",
  },
  {
    title: (name) => `👀 ${name} Came Online`,
    body: "Abhi check karo and enjoy the live vibes 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Fresh vibes aur fun conversations are waiting 🔥",
  },
  {
    title: (name) => `✨ ${name} is Online Now`,
    body: "Ek hello bhejo aur apna next Zigo moment start karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the chance to connect 💕",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka connection sirf ek tap away hai 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Come join the live vibes and make a new connection 🔥",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Aao baat karein aur good vibes share karein ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing! Abhi Zigo Live par join karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Ek hello se aaj ki best conversation start ho sakti hai 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back Online`,
    body: "Reconnect karo aur live moment enjoy karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka special Zigo moment aapka wait kar raha hai 💕",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start your next conversation 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka maza lene ke liye abhi join karo 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Don't miss the live connection. Zigo Live kholo ❤️",
  },
  {
    title: (name) => `💖 ${name} Just Went Online`,
    body: "Aaj ka chance miss mat karo. Come connect 💕",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Ek hello bhejo aur live moment ko special banao 🥰",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Conversation ka perfect time hai. Join Zigo Live 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Hai`,
    body: "Your next Zigo Live moment starts now ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Arrived`,
    body: "Good vibes aur new connections are waiting 💕",
  },
  {
    title: (name) => `🥳 ${name} Online Again`,
    body: "Reconnect karo aur fresh live vibes enjoy karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Active`,
    body: "Aaj ka connection special ho sakta hai ❤️",
  },
  {
    title: (name) => `✨ ${name} is Here Now`,
    body: "Abhi connect karo aur apna Zigo moment enjoy karo 💕",
  },
  {
    title: (name) => `🔥 ${name} Just Came Online`,
    body: "Don't wait! Join Zigo Live now 🥰",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aao baat karein aur good vibes share karein 🔥",
  },
  {
    title: (name) => `👀 ${name} Online Now`,
    body: "Abhi check karo before the live moment passes ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur live connection enjoy karo 💕",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Aaj ka live moment miss mat karo 🥰",
  },
  {
    title: (name) => `💬 ${name} Just Went Online`,
    body: "Talk time! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello se new connection start karo ❤️",
  },
  {
    title: (name) => `💫 ${name} Came Online`,
    body: "Your chance to connect is here 💕",
  },
  {
    title: (name) => `🔥 ${name} is Here Now`,
    body: "Live vibes ON hain. Abhi join karo 🚀",
  },
  {
    title: (name) => `🥰 ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes enjoy karein ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Aaj ka special connection miss mat karo 💕",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Abhi connect karo aur live moment ka maza lo 🔥",
  },
  {
    title: (name) => `🚀 ${name} Online Now`,
    body: "Your next Zigo Live moment is waiting ❤️",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Aaj baat karne ka perfect time hai 💕",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Say hello and enjoy the live vibes 🥰",
  },
  {
    title: (name) => `🔥 ${name} Came Online`,
    body: "Abhi Zigo Live par join karo aur connect karo 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Good vibes aur fun conversations are waiting ❤️",
  },
  {
    title: (name) => `💫 ${name} Online Again`,
    body: "Reconnect karo aur live moment enjoy karo 💕",
  },
  {
    title: (name) => `🥳 ${name} is Active Now`,
    body: "Fun mode ON! Come join Zigo Live 🔥",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Kuch interesting miss mat karo. Abhi check karo ❤️",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Don't miss the live connection. Join now 🥰",
  },
  {
    title: (name) => `💖 ${name} Just Came Online`,
    body: "Aaj ka moment special banane ka perfect chance hai 🔥",
  },
  {
    title: (name) => `🌟 ${name} Online Hai`,
    body: "Aao connect karein aur good vibes enjoy karein ❤️",
  },
  {
    title: (name) => `💬 ${name} Came Online`,
    body: "Talk time! Abhi Zigo Live par connect karo 💕",
  },
  {
    title: (name) => `🥰 ${name} is Here Now`,
    body: "Ek hello bhejo aur conversation start karo 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Active`,
    body: "Your next Zigo Live moment could start now ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Now`,
    body: "Abhi join karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `🔥 ${name} is Back`,
    body: "Reconnect karo aur apna next moment special banao 🥰",
  },
  {
    title: (name) => `🌟 ${name} Just Came Online`,
    body: "Don't miss the chance. Come join Zigo Live ❤️",
  },
  {
    title: (name) => `💫 ${name} is Active Now`,
    body: "Aaj ka connection special ho sakta hai 💕",
  },
  {
    title: (name) => `👋 ${name} Came Online`,
    body: "Say hello and start something interesting 🔥",
  },
  {
    title: (name) => `🎉 ${name} is Here`,
    body: "Fun conversations ke liye abhi join karo ❤️",
  },
  {
    title: (name) => `🥰 ${name} Online Hai`,
    body: "Aao thodi friendly baatein karein aur live vibes enjoy karein 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Went Online`,
    body: "Your chance to connect is now. Join Zigo Live 🔥",
  },
  {
    title: (name) => `✨ ${name} is Back Online`,
    body: "Aao reconnect karein aur fresh vibes share karein ❤️",
  },
  {
    title: (name) => `💖 ${name} is Active`,
    body: "Ek hello karo aur apna next Zigo moment start karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Live vibes aur good conversations are waiting 🥰",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Talk time! Come connect on Zigo Live 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Abhi join karo aur live moment enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Just Came Online`,
    body: "Perfect timing for a hello 💕",
  },
  {
    title: (name) => `🥳 ${name} is Back`,
    body: "Fresh vibes aur fun moments ke liye reconnect karo 🔥",
  },
  {
    title: (name) => `💫 ${name} Online Hai`,
    body: "Aaj ka perfect connection sirf ek tap away hai ❤️",
  },
  {
    title: (name) => `👀 ${name} Just Arrived`,
    body: "Abhi check karo and enjoy the live vibes 💕",
  },
  {
    title: (name) => `🔥 ${name} is Active Now`,
    body: "Don't miss the moment. Zigo Live par join karo 🚀",
  },
  {
    title: (name) => `🌟 ${name} is Here`,
    body: "Aao connect karein aur apna Zigo moment special banao ❤️",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Aaj ka connection miss mat karo. Come join 💕",
  },
  {
    title: (name) => `💬 ${name} is Ready`,
    body: "Ek hello se conversation start karo 🥰",
  },
  {
    title: (name) => `🚀 ${name} Online Again`,
    body: "Reconnect karo aur live vibes ka full maza lo 🔥",
  },
  {
    title: (name) => `✨ ${name} is Active`,
    body: "Good vibes ke liye Zigo Live kholo ❤️",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Abhi connect karo before the moment passes 💕",
  },
  {
    title: (name) => `🥳 ${name} Came Online`,
    body: "Fun ka time hai! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Here Now`,
    body: "Your next great conversation could start here ❤️",
  },
  {
    title: (name) => `👋 ${name} Online Hai`,
    body: "Say hello and enjoy the moment 💕",
  },
  {
    title: (name) => `🚀 ${name} Just Came Online`,
    body: "Don't miss the chance to connect 🥰",
  },
  {
    title: (name) => `💖 ${name} is Back Online`,
    body: "Aao reconnect karein aur good vibes enjoy karein 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Aaj ka live moment special ho sakta hai ❤️",
  },
  {
    title: (name) => `🌟 ${name} is Active Now`,
    body: "Abhi Zigo Live par aao aur connect karo 💕",
  },
  {
    title: (name) => `💬 ${name} Just Came Online`,
    body: "Talk time! Conversation start karo 🥰",
  },
  {
    title: (name) => `🔥 ${name} is Here`,
    body: "Live vibes ka maza lene ke liye abhi join karo 🚀",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Your next Zigo moment is waiting ❤️",
  },
  {
    title: (name) => `🎉 ${name} Came Online`,
    body: "Fun conversations ke liye Zigo Live par aao 💕",
  },
  {
    title: (name) => `🥰 ${name} is Active`,
    body: "Aaj thodi friendly baatein ho jaye 🔥",
  },
  {
    title: (name) => `🚀 ${name} is Back`,
    body: "Reconnect karo aur fresh live vibes enjoy karo ❤️",
  },
  {
    title: (name) => `✨ ${name} Online Hai`,
    body: "Ek hello bhejo aur conversation start karo 💕",
  },
  {
    title: (name) => `👀 ${name} Just Went Online`,
    body: "Abhi check karo and don't miss the moment 🥰",
  },
  {
    title: (name) => `🌟 ${name} is Here Now`,
    body: "Aaj ka connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `💖 ${name} Came Online`,
    body: "Come connect and enjoy your Zigo Live moment ❤️",
  },
  {
    title: (name) => `💬 ${name} Online Now`,
    body: "Aao baat karein aur good vibes share karein 💕",
  },
  {
    title: (name) => `🚀 ${name} is Active Now`,
    body: "Your next exciting conversation is waiting 🔥",
  },
  {
    title: (name) => `✨ ${name} Just Arrived`,
    body: "Perfect time to connect. Join Zigo Live ❤️",
  },
  {
    title: (name) => `🥳 ${name} is Online Again`,
    body: "Fresh vibes ke saath reconnect karo 💕",
  },
  {
    title: (name) => `🌟 ${name} Came Online`,
    body: "Aaj ka live moment miss mat karo 🔥",
  },
  {
    title: (name) => `💫 ${name} is Back Online`,
    body: "Aao reconnect karein aur moment enjoy karein ❤️",
  },
  {
    title: (name) => `🔥 ${name} Online Hai`,
    body: "Abhi join karo aur live vibes ka full maza lo 💕",
  },
  {
    title: (name) => `👋 ${name} Just Came Online`,
    body: "Say hello and start your next conversation 🥰",
  },
  {
    title: (name) => `💖 ${name} is Active Now`,
    body: "Aaj ka connection special ho sakta hai 🔥",
  },
  {
    title: (name) => `✨ ${name} is Here`,
    body: "Good vibes aur live connections are waiting ❤️",
  },
  {
    title: (name) => `🚀 ${name} Came Online`,
    body: "Your chance to connect is now 💕",
  },
  {
    title: (name) => `💬 ${name} Online Hai`,
    body: "Talk time! Zigo Live par join karo 🔥",
  },
  {
    title: (name) => `🌟 ${name} Just Went Online`,
    body: "Don't miss the live moment ❤️",
  },
  {
    title: (name) => `🥰 ${name} is Back`,
    body: "Reconnect karo aur fresh vibes enjoy karo 💕",
  },
  {
    title: (name) => `💫 ${name} Online Now`,
    body: "Aaj ka perfect conversation moment abhi hai 🔥",
  },
  {
    title: (name) => `✨ ${name} Came Online`,
    body: "Ek hello karo aur live moment enjoy karo ❤️",
  },
  {
    title: (name) => `🚀 ${name} is Here Now`,
    body: "Abhi connect karo aur Zigo Live ka maza lo 💕",
  },
];

const getRandomHostOnlineNotification = (hostName) => {
  const name = hostName || "Host";

  const randomIndex = Math.floor(
    Math.random() * hostOnlineNotificationMessages.length
  );

  const notification =
    hostOnlineNotificationMessages[randomIndex];

  return {
    title: notification.title(name),
    body: notification.body,
  };
};

module.exports = {
  getRandomHostOnlineNotification,
};