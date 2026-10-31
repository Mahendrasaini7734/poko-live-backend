const nameStyles = [
  "꧁༺👑{name}👑༻꧂",
  "♛✨{name}✨♛",
  "👑『{name}』👑",
  "꧁👑{name}👑꧂",
  "♚💫{name}💫♚",
  "👑༺{name}༻👑",
  "꧁♛💎{name}💎♛꧂",
  "༺👑{name}👑༻",
  "꧁༒👑{name}👑༒꧂",
  "♔✨『{name}』✨♔",

  "♡⃝💕{name}💕♡⃝",
  "🥀💔{name}💔🥀",
  "❤️⃝{name}❤️⃝",
  "꧁༺💕{name}💕༻꧂",
  "💞{name}💞",
  "🌹✨{name}✨🌹",
  "꧁♡💗{name}💗♡꧂",
  "💘『{name}』💘",
  "🥰༺{name}༻🥰",
  "💕𓆩{name}𓆪💕",

  "꧁༺🔥{name}🔥༻꧂",
  "☠︎︎🔥{name}🔥☠︎︎",
  "🔥『{name}』🔥",
  "⚡{name}⚡",
  "☠️༺{name}༻☠️",
  "𒆜🔥{name}🔥𒆜",
  "꧁༒☬🔥{name}🔥☬༒꧂",
  "⚔️『{name}』⚔️",
  "😈༺{name}༻😈",
  "🔥♛{name}♛🔥",

  "꒰ঌ🌸{name}🌸໒꒱",
  "🎀{name}🎀",
  "♡🌷{name}🌷♡",
  "🌷{name}🌷",
  "🦋{name}🦋",
  "୨୧💕{name}💕୨୧",
  "꧁🌸{name}🌸꧂",
  "🦄✨{name}✨🦄",
  "🌺𓆩{name}𓆪🌺",
  "🎀꒰{name}꒱🎀",

  "✧˚ ༘ ⋆｡˚🌙{name}🌙✧˚ ༘ ⋆｡˚",
  "☾✨{name}✨☽",
  "✦🌟{name}🌟✦",
  "𐙚🌸{name}🌸𐙚",
  "˚₊‧꒰ა🌙{name}🌙໒꒱‧₊˚",
  "✧･ﾟ: *✧🌌{name}🌌✧*:･ﾟ✧",
  "☁️⋆｡°✩{name}✩°｡⋆☁️",
  "🌙༺{name}༻🌙",
  "✨𓆩{name}𓆪✨",
  "🌸⋆｡˚{name}˚｡⋆🌸",

  "『😎{name}』😎",
  "✦🔥{name}🔥✦",
  "★彡🔥{name}🔥彡★",
  "『🔥{name}🔥』",
  "メ⚡{name}⚡メ",
  "꧁😎{name}😎꧂",
  "⚡『{name}』⚡",
  "★🔥༺{name}༻🔥★",
  "メ💫{name}💫メ",
  "🎤『{name}』🎤",

  "🎙️{name}🎙️",
  "⭐{name}⭐",
  "🎧{name}🎧",
  "🔥{name}🔥",
  "🎤✨{name}✨🎤",
  "🔴『{name}』🔴",
  "🎙️༺{name}༻🎙️",
  "⭐꧁{name}꧂⭐",
  "🎤💎『{name}』💎🎤",
  "💎꧁{name}꧂💎",

  "👑{name}👑",
  "💰『{name}』💰",
  "💎{name}💎",
  "✨꧁{name}꧂✨",
  "💎༺{name}༻💎",
  "👑꧁💎{name}💎꧂👑",
  "✨『💎{name}💎』✨",
  "💰༺👑{name}👑༻💰",
  "💎𓆩✨{name}✨𓆪💎",
  "🦁꧁{name}꧂🦁",

  "❤️{name}❤️",
  "🚩꧁{name}꧂🚩",
  "🪷{name}🪷",
  "❤️‍🔥『{name}』❤️‍🔥",
  "❤️꧁{name}꧂❤️",
  "🦚༺{name}༻🦚",
  "🙏✨{name}✨🙏",
  "🚩👑{name}👑🚩"
];

const autoBios = [
  "💕 Good vibes only • Come say hello 👋✨",
  "🌸 Sweet soul • Beautiful moments • Happy vibes 💖",
  "🎤 Live now • Come join me & have some fun 🎉",
  "🦋 Spreading smiles, love & positive energy ✨",
  "👑 Queen of good vibes • Born to shine 💎",
  "🔥 No drama • Just vibes • Be yourself 😎",
  "🌷 Smile more • Dream more • Live more 💕",
  "🎧 Music • Fun • Friends • Good Vibes 🎶✨",
  "💖 Let's create beautiful memories together 🌸",
  "🌙 Dream big • Smile bigger • Stay positive ✨",
  "🥰 Friendly vibes • Sweet talks • Happy moments 💕",
  "⭐ Your favorite host is waiting for you 🎤",
  "🦄 Dreamer • Believer • Good Vibes Only 💫",
  "🌹 Stay classy • Stay happy • Stay beautiful 💖",
  "💎 Classy vibes • Positive energy • Big dreams ✨",
  "🎀 Cute vibes • Happy heart • Beautiful soul 🌸",
  "🔴 Live • Laugh • Connect • Repeat 🎤💕",
  "🦋 Simple heart • Wild dreams • Free soul ✨",
  "👑 Confidence is my crown • Kindness is my style 💕",
  "🌸 Blooming every day • Living every moment 🌷",
  "💫 Making every moment a beautiful memory 💖",
  "🎤 Come join my live and let's talk 👋✨",
  "❤️ Good heart • Good vibes • Good people 🌸",
  "🔥 Different vibe • Different story • Same me 😎",
  "🌺 Happiness looks good on everyone 💕",
  "💖 A little love, a lot of positive vibes ✨",
  "🪷 Peaceful heart • Positive mind • Happy soul 🌸",
  "🎙️ Live with love • Smile with confidence 💕",
  "⭐ Shine bright • Spread happiness • Stay real ✨",
  "🌹 Beautiful soul with beautiful dreams 💖",
  "😎 Be real • Be kind • Be unforgettable 🔥",
  "🦋 Finding beauty in every little moment 🌸",
  "💎 Rare energy • Real vibes • Pure heart ✨",
  "🎀 Sweet personality • Strong mindset • Happy life 💕",
  "👑 Royal vibes • Positive mind • Happy heart 💎",
  "🌷 Keep smiling • Keep shining • Keep growing ✨",
  "❤️ Here for friendship, fun & beautiful conversations 🌸",
  "🎤 Your daily dose of smiles & good vibes 😍",
  "💫 Positive energy only • Leave negativity outside 🚫",
  "🌙 Soft heart • Strong soul • Endless dreams ✨",
  "🔥 Confidence • Attitude • Positive vibes 😎",
  "💕 Let's laugh, talk & make memories together 🌸",
  "🦄 Be your own kind of beautiful ✨",
  "🌹 Love yourself • Enjoy life • Spread happiness 💖",
  "🎧 Music in my heart • Vibes in my soul 🎶💕",
  "💎 Stay unique • Stay confident • Stay amazing 👑",
  "🦚 Desi heart • Beautiful vibes • Big dreams ❤️",
  "🇮🇳 Desi vibes • Happy heart • Positive soul ✨",
  "🪷 Simple life • Pure heart • Peaceful mind 💕",
  "🌸 Dil se simple • Vibes se special ✨",
  "❤️ Desi heart with global dreams 🌎✨",
  "🚩 Dil mein positivity • Face pe smile 😊",
  "🦋 Be happy • Be kind • Be yourself 💖",
  "🎉 Life is short • Make every moment count ✨",
  "💕 Come for the live • Stay for the vibes 🎤",
  "✨ Smile • Connect • Enjoy • Repeat 💖",
  "🌺 Good energy finds good people 🦋",
  "👑 Born to shine • Made to inspire ✨"
];

const bioStyles = [
  { prefix: "✨ ", suffix: " 💕" },
  { prefix: "🌸 ", suffix: " 🦋" },
  { prefix: "💖 ", suffix: " ✨" },
  { prefix: "🎤 ", suffix: " 🎉" },
  { prefix: "👑 ", suffix: " 💎" },
  { prefix: "🦋 ", suffix: " 🌸" },
  { prefix: "💕 ", suffix: " 🌹" },
  { prefix: "🔥 ", suffix: " 😎" },
  { prefix: "🌙 ", suffix: " 💫" },
  { prefix: "💎 ", suffix: " 👑" }
];

const getStableHash = (value) => {
  const text = String(value || "");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getDisplayName = (name, hostId) => {
  const originalName = String(name || "Host").trim();
  const hash = getStableHash(hostId || originalName);
  const styleIndex = hash % nameStyles.length;

  return nameStyles[styleIndex].replace(
    "{name}",
    originalName
  );
};

const getDisplayBio = (bio, hostId) => {
  const cleanBio =
    typeof bio === "string"
      ? bio.trim()
      : "";

  const hash = getStableHash(hostId);

  if (!cleanBio) {
    return autoBios[hash % autoBios.length];
  }

  const style = bioStyles[hash % bioStyles.length];

  return `${style.prefix}${cleanBio}${style.suffix}`;
};

const applyHostDisplay = (host) => {
  if (!host || typeof host !== "object") {
    return host;
  }

  host.name = getDisplayName(
    host.name,
    host._id
  );

  host.bio = getDisplayBio(
    host.bio,
    host._id
  );

  return host;
};

const applyHostDisplays = (hosts) => {
  if (!Array.isArray(hosts)) {
    return hosts;
  }

  return hosts.map((host) =>
    applyHostDisplay(host)
  );
};

module.exports = {
  getDisplayName,
  getDisplayBio,
  applyHostDisplay,
  applyHostDisplays
};