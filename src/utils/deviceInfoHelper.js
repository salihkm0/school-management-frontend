export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown Browser";
  let osVersion = "Unknown OS";
  
  // Basic OS detection
  if (userAgent.indexOf("Win") !== -1) osVersion = "Windows";
  if (userAgent.indexOf("Mac") !== -1) osVersion = "MacOS";
  if (userAgent.indexOf("X11") !== -1) osVersion = "UNIX";
  if (userAgent.indexOf("Linux") !== -1) osVersion = "Linux";
  if (/Android/.test(userAgent)) osVersion = "Android";
  if (/iPhone|iPad|iPod/.test(userAgent)) osVersion = "iOS";

  // Basic Browser detection
  if (userAgent.indexOf("Edg") !== -1) browserName = "Edge";
  else if (userAgent.indexOf("Chrome") !== -1) browserName = "Chrome";
  else if (userAgent.indexOf("Firefox") !== -1) browserName = "Firefox";
  else if (userAgent.indexOf("Safari") !== -1) browserName = "Safari";
  else if (userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident/") !== -1) browserName = "IE";

  return {
    deviceName: browserName,
    osVersion: osVersion,
    appVersion: 'web',
    platform: 'web',
  };
};
