const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

exports.buildToken = ({ channel, uid, role = "publisher" }) => {

  const agoraRole = role === "publisher"
    ? RtcRole.PUBLISHER
    : RtcRole.SUBSCRIBER;

  const expireTime = 3600;
  const now = Math.floor(Date.now() / 1000);

  return RtcTokenBuilder.buildTokenWithUid(
    global.settingJSON?.agoraAppId,
    global.settingJSON?.agoraAppCertificate,
    channel,
    uid || 0,
    agoraRole,
    now + expireTime
  );
};