const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const zigoEmailTemplate = ({
  userName = "Zigo User",

  title = "We Miss You on Zigo Live! 💜",

  message =
    "It's been a while! Come back to Zigo Live, meet new people and enjoy exciting live streams again.",

  buttonText = "Come Back to Zigo",

  buttonUrl =
    "https://play.google.com/store/apps/details?id=com.stackearn.zigo.live&hl=en_IN",

  bannerUrl =
    "https://zigo-live-media.stackearn.com/email/zigo_promosions.webp",

  unsubscribeUrl =
    "https://zigolive.stackearn.com/unsubscribe"
}) => {

  const safeUserName = escapeHtml(userName);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeButtonText = escapeHtml(buttonText);

  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<meta
  name="x-apple-disable-message-reformatting"
>

<title>${safeTitle}</title>

<style>

html,
body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  background-color: #f4f5f9;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  color: #222222;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}

td {
  padding: 0;
}

img {
  display: block;
  border: 0;
  outline: none;
  text-decoration: none;
}

a {
  text-decoration: none;
}

/* EMAIL BACKGROUND */

.email-wrapper {
  width: 100%;
  padding: 24px 12px;
  background-color: #f4f5f9;
}

/* MAIN CONTAINER */

.email-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 18px;
  overflow: hidden;
}

/* TOP ACCENT */

.top-bar {
  height: 5px;
  background: linear-gradient(
    90deg,
    #5424c7 0%,
    #7b2cff 45%,
    #ef2b91 100%
  );

  font-size: 0;
  line-height: 0;
}

/* BANNER AREA */

.banner-area {
  width: 100%;
  padding: 18px 18px 8px;
  text-align: center;
  background-color: #ffffff;
  box-sizing: border-box;
}

/* BANNER */

.banner {
  display: block;

  width: 100%;
  max-width: 564px;
  height: auto;

  margin: 0 auto;

  border-radius: 15px;

  object-fit: contain;
}

/* CTA */

.button-area {
  padding: 16px 20px 22px;
  text-align: center;
  background-color: #ffffff;
}

.button {
  display: inline-block;

  padding: 14px 30px;

  border-radius: 9px;

  background: linear-gradient(
    90deg,
    #6529d7,
    #c52ff0
  );

  color: #ffffff !important;

  font-size: 15px;
  line-height: 1;
  font-weight: 700;

  box-shadow: 0 5px 14px rgba(104, 39, 210, 0.18);
}

.button-arrow {
  margin-left: 7px;
  font-size: 17px;
}

/* FOOTER */

.footer {
  padding: 11px 15px 13px;

  background-color: #fafafa;

  border-top: 1px solid #eeeeee;

  text-align: center;
}

.footer-text {
  margin: 0 0 4px;

  color: #aaa5ae;

  font-size: 9px;
  line-height: 1.4;
}

.unsubscribe {
  color: #6729cf;

  font-size: 9px;
  line-height: 1.3;

  font-weight: 600;
}

.copyright {
  margin-top: 4px;

  color: #b5b0b7;

  font-size: 8px;
  line-height: 1.3;
}

/* MOBILE */

@media only screen and (max-width: 620px) {

  .email-wrapper {
    padding: 10px 6px;
  }

  .email-container {
    border-radius: 13px;
  }

  .top-bar {
    height: 4px;
  }

  .banner-area {
    padding: 12px 10px 6px;
  }

  .banner {
    border-radius: 10px;
  }

  .button-area {
    padding: 13px 15px 19px;
  }

  .button {
    padding: 13px 26px;
    font-size: 14px;
  }

  .footer {
    padding: 9px 10px 11px;
  }

  .footer-text {
    font-size: 8px;
  }

  .unsubscribe {
    font-size: 8px;
  }

  .copyright {
    font-size: 7px;
  }

}

</style>

</head>

<body>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  role="presentation"
>

<tr>

<td>

<div class="email-wrapper">

<table
  class="email-container"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  role="presentation"
>

<!-- TOP ACCENT -->

<tr>

<td class="top-bar">
&nbsp;
</td>

</tr>

<!-- BANNER -->

<tr>

<td class="banner-area">

<a
  href="${buttonUrl}"
  target="_blank"
>

<img
  src="${bannerUrl}"
  width="564"
  alt="Zigo Live"
  class="banner"
>

</a>

</td>

</tr>

<!-- BUTTON -->

<tr>

<td class="button-area">

<a
  href="${buttonUrl}"
  target="_blank"
  class="button"
>

${safeButtonText}

<span class="button-arrow">
→
</span>

</a>

</td>

</tr>

<!-- FOOTER -->

<tr>

<td class="footer">

<p class="footer-text">
You're receiving this email because you have an account or interaction with Zigo Live.
</p>

<a
  href="${unsubscribeUrl}"
  target="_blank"
  class="unsubscribe"
>
Unsubscribe
</a>

<div class="copyright">
© ${new Date().getFullYear()} Zigo Live
</div>

</td>

</tr>

</table>

</div>

</td>

</tr>

</table>

</body>

</html>
`;
};

module.exports = zigoEmailTemplate;