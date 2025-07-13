export function createPeerConnection() {
  const rtcConfiguration = {
    iceServers: [
      {
        urls: [
          "turn:194.60.231.201:3478?transport=udp",
          "turn:194.60.231.201:3478?transport=tcp",
          "turn:194.60.231.201:5349?transport=udp",
          "turn:194.60.231.201:5349?transport=tcp",
        ],
        username: "iman244",
        credential: "qwer123456",
      },
      {
        urls: ["stun:194.60.231.201:3478", "stun:194.60.231.201:5349"],
      },
    ],
  };

  const peerConnection = new RTCPeerConnection(rtcConfiguration);

  return peerConnection;
}
