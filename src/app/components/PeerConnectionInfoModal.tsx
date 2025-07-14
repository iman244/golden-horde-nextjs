import React, { useEffect, useState } from "react";
import {
//   getAllSenderInfo,
//   getAllReceiverInfo,
  getPeerConnectionConfig,
//   getSenderParameters,
//   getSenderStats,
//   getReceiverStats,
  getPeerConnectionStats,
  type RTCStatsReport,
} from "../utils";

interface PeerConnectionInfoModalProps {
  open: boolean;
  onClose: () => void;
  peerConnection: RTCPeerConnection | null;
}

type TabType = "info" | "senders" | "receivers";
// type SenderTab = "info" | "parameters" | "stats";
// type ReceiverTab = "info" | "stats";

// interface SenderDetail {
//   sender: RTCRtpSender;
//   info: ReturnType<typeof getAllSenderInfo>[0];
//   parameters?: Record<string, unknown>;
//   stats?: RTCStatsReport[];
//   expanded: boolean;
//   loadingStats: boolean;
//   loadingParameters: boolean;
//   activeTab: SenderTab;
//   fetchedParameters: boolean;
//   fetchedStats: boolean;
// }

// interface ReceiverDetail {
//   receiver: RTCRtpReceiver;
//   info: ReturnType<typeof getAllReceiverInfo>[0];
//   stats?: RTCStatsReport[];
//   expanded: boolean;
//   loadingStats: boolean;
//   activeTab: ReceiverTab;
//   fetchedStats: boolean;
// }

export const PeerConnectionInfoModal: React.FC<PeerConnectionInfoModalProps> = ({ open, onClose, peerConnection }) => {
  const [activeTab, setActiveTab] = useState<TabType>("info");
//   const [senderDetails, setSenderDetails] = useState<SenderDetail[]>([]);
//   const [receiverDetails, setReceiverDetails] = useState<ReceiverDetail[]>([]);
  const [connectionStats, setConnectionStats] = useState<RTCStatsReport[] | null>(null);
  const [loadingConnectionStats, setLoadingConnectionStats] = useState(false);

  useEffect(() => {
    if (peerConnection) {
      // Initialize sender details
    //   const senders = peerConnection.getSenders();
    //   const senderInfo = getAllSenderInfo(peerConnection);
    //   setSenderDetails(
    //     senders.map((sender, index) => ({
    //       sender,
    //       info: senderInfo[index],
    //       expanded: false,
    //       loadingStats: false,
    //       loadingParameters: false,
    //       activeTab: "info",
    //       fetchedParameters: false,
    //       fetchedStats: false,
    //     }))
    //   );

      // Initialize receiver details
    //   const receivers = peerConnection.getReceivers();
    //   const receiverInfo = getAllReceiverInfo(peerConnection);
    //   setReceiverDetails(
    //     receivers.map((receiver, index) => ({
    //       receiver,
    //       info: receiverInfo[index],
    //       expanded: false,
    //       loadingStats: false,
    //       activeTab: "info",
    //       fetchedStats: false,
    //     }))
    //   );
    }
  }, [peerConnection]);

  if (!open) return null;

//   const handleSenderExpand = (index: number) => {
//     setSenderDetails((prev) =>
//       prev.map((detail, i) => (i === index ? { ...detail, expanded: !detail.expanded } : detail))
//     );
//   };

//   const handleReceiverExpand = (index: number) => {
//     setReceiverDetails((prev) =>
//       prev.map((detail, i) => (i === index ? { ...detail, expanded: !detail.expanded } : detail))
//     );
//   };

//   const handleSenderTabChange = async (index: number, tab: SenderTab) => {
//     setSenderDetails((prev) =>
//       prev.map((detail, i) =>
//         i === index ? { ...detail, activeTab: tab } : detail
//       )
//     );
//     if (tab === "parameters" && !senderDetails[index].fetchedParameters) {
//       setSenderDetails((prev) =>
//         prev.map((detail, i) =>
//           i === index ? { ...detail, loadingParameters: true } : detail
//         )
//       );
//       const parameters = await getSenderParameters(senderDetails[index].sender);
//       setSenderDetails((prev) =>
//         prev.map((detail, i) =>
//           i === index
//             ? {
//                 ...detail,
//                 parameters: parameters || undefined,
//                 loadingParameters: false,
//                 fetchedParameters: true,
//               }
//             : detail
//         )
//       );
//     }
//     if (tab === "stats" && !senderDetails[index].fetchedStats) {
//       setSenderDetails((prev) =>
//         prev.map((detail, i) =>
//           i === index ? { ...detail, loadingStats: true } : detail
//         )
//       );
//       const stats = await getSenderStats(senderDetails[index].sender);
//       setSenderDetails((prev) =>
//         prev.map((detail, i) =>
//           i === index
//             ? {
//                 ...detail,
//                 stats: stats || undefined,
//                 loadingStats: false,
//                 fetchedStats: true,
//               }
//             : detail
//         )
//       );
//     }
//   };

//   const handleReceiverTabChange = async (index: number, tab: ReceiverTab) => {
//     setReceiverDetails((prev) =>
//       prev.map((detail, i) =>
//         i === index ? { ...detail, activeTab: tab } : detail
//       )
//     );
//     if (tab === "stats" && !receiverDetails[index].fetchedStats) {
//       setReceiverDetails((prev) =>
//         prev.map((detail, i) =>
//           i === index ? { ...detail, loadingStats: true } : detail
//         )
//       );
//       const stats = await getReceiverStats(receiverDetails[index].receiver);
//       setReceiverDetails((prev) =>
//         prev.map((detail, i) =>
//           i === index
//             ? {
//                 ...detail,
//                 stats: stats || undefined,
//                 loadingStats: false,
//                 fetchedStats: true,
//               }
//             : detail
//         )
//       );
//     }
//   };

  const handleGetConnectionStats = async () => {
    if (!peerConnection) return;
    setLoadingConnectionStats(true);
    const stats = await getPeerConnectionStats(peerConnection);
    setConnectionStats(stats);
    setLoadingConnectionStats(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[80vh] relative text-white">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">PeerConnection Info</h2>

        {peerConnection ? (
          <>
            {/* Tab Buttons */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "info"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setActiveTab("senders")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "senders"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Senders ({peerConnection.getSenders().length})
              </button>
              <button
                onClick={() => setActiveTab("receivers")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "receivers"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Receivers ({peerConnection.getReceivers().length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto max-h-[60vh]">
              {activeTab === "info" && (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">Connection State:</span>{" "}
                      {peerConnection.connectionState}
                    </div>
                    <button
                      onClick={handleGetConnectionStats}
                      disabled={loadingConnectionStats}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingConnectionStats ? "Loading..." : "Get Stats"}
                    </button>
                  </div>
                  <div>
                    <span className="font-semibold">Signaling State:</span>{" "}
                    {peerConnection.signalingState}
                  </div>
                  <div>
                    <span className="font-semibold">Configuration:</span>
                    <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
                      {JSON.stringify(getPeerConnectionConfig(peerConnection), null, 2)}
                    </pre>
                  </div>
                  {connectionStats && (
                    <div>
                      <span className="font-semibold">Connection Stats:</span>
                      <pre className="bg-gray-900 rounded p-2 mt-1 overflow-x-auto text-xs">
                        {JSON.stringify(connectionStats, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* {activeTab === "senders" && (
                <div className="space-y-3">
                  <h3 className="font-semibold mb-2">Outgoing Tracks (Senders)</h3>
                  {senderDetails.map((detail, index) => (
                    <SenderCard
                      key={index}
                      detail={detail}
                      index={index}
                      onExpand={handleSenderExpand}
                      onTabChange={handleSenderTabChange}
                    />
                  ))}
                </div>
              )} */}

              {/* {activeTab === "receivers" && (
                <div className="space-y-3">
                  <h3 className="font-semibold mb-2">Incoming Tracks (Receivers)</h3>
                  {receiverDetails.map((detail, index) => (
                    <ReceiverCard
                      key={index}
                      detail={detail}
                      index={index}
                      onExpand={handleReceiverExpand}
                      onTabChange={handleReceiverTabChange}
                    />
                  ))}
                </div>
              )} */}
            </div>
          </>
        ) : (
          <div>No peer connection available.</div>
        )}
      </div>
    </div>
  );
};
