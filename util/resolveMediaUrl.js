const resolveMediaKey = (file) => {
  if (!file) return "";

  if (file.key) {
    return file.key;
  }

  if (file.path) {
    const path = file.path;

    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      try {
        const url = new URL(path);
        return url.pathname.replace(/^\/+/, "");
      } catch (error) {
        return "";
      }
    }

    return path.replace(/^\/+/, "");
  }

  if (file.location) {
    try {
      const url = new URL(file.location);
      return url.pathname.replace(/^\/+/, "");
    } catch (error) {
      return "";
    }
  }

  return "";
};