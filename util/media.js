const MEDIA_BASE_URL = (
  process.env.MEDIA_BASE_URL ||
  "https://zigo-live-media.stackearn.com"
).replace(/\/+$/, "");

const getMediaKey = (media) => {
  if (!media) return "";

  if (typeof media === "string") {
    const value = media.trim();

    if (!value) return "";

    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      try {
        const url = new URL(value);

        return decodeURIComponent(
          url.pathname.replace(/^\/+/, "")
        );
      } catch (error) {
        return "";
      }
    }

    return value.replace(/^\/+/, "");
  }

  if (typeof media === "object") {
    if (media.key) {
      return getMediaKey(media.key);
    }

    if (media.path) {
      return getMediaKey(media.path);
    }

    if (media.location) {
      return getMediaKey(media.location);
    }

    if (media.url) {
      return getMediaKey(media.url);
    }
  }

  return "";
};

const getMediaUrl = (media) => {
  const key = getMediaKey(media);

  if (!key) {
    return "";
  }

  return `${MEDIA_BASE_URL}/${key}`;
};

const getMediaObject = (media) => {
  const key = getMediaKey(media);

  if (!key) {
    return {
      key: "",
      url: "",
    };
  }

  return {
    key,
    url: `${MEDIA_BASE_URL}/${key}`,
  };
};

const getMediaUrls = (list = []) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item) =>
    getMediaObject(item)
  );
};

module.exports = {
  getMediaUrl,
  getMediaKey,
  getMediaObject,
  getMediaUrls,
};