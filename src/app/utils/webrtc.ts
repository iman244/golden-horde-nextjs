/**
 * WebRTC utility functions for extracting serializable properties from WebRTC objects
 */

export interface SerializableMediaTrack {
  id: string;
  kind: string;
  enabled: boolean;
  muted: boolean;
  readyState: string;
  label: string;
  contentHint?: string;
}

export interface SerializableDTMF {
  canInsertDTMF: boolean;
  toneBuffer: string;
}

export interface SerializableTransport {
  state?: string;
  iceTransport?: {
    gatheringState?: string;
    state?: string;
  };
}

export interface SerializableSender {
  dtmf?: SerializableDTMF | null;
  track?: SerializableMediaTrack | null;
  transform?: unknown;
  transport?: SerializableTransport;
}

export interface SerializableReceiver {
  jitterBufferTarget?: number;
  track?: SerializableMediaTrack | null;
  transform?: unknown;
  transport?: SerializableTransport;
}

export interface RTCStatsReport {
  id: string;
  type: string;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Extract serializable properties from an RTCRtpSender
 */
export function extractSenderInfo(sender: RTCRtpSender): SerializableSender {
  const senderInfo: SerializableSender = {};

  // Extract DTMF info if available
  if (sender.dtmf) {
    senderInfo.dtmf = {
      canInsertDTMF: sender.dtmf.canInsertDTMF,
      toneBuffer: sender.dtmf.toneBuffer
    };
  }

  // Extract track info if available
  if (sender.track) {
    senderInfo.track = {
      id: sender.track.id,
      kind: sender.track.kind,
      enabled: sender.track.enabled,
      muted: sender.track.muted,
      readyState: sender.track.readyState,
      label: sender.track.label,
      contentHint: sender.track.contentHint
    };
  }

  // Extract transform if available (may be undefined in some browsers)
  if (sender.transform) {
    senderInfo.transform = sender.transform;
  }

  // Extract transport info if available
  if (sender.transport) {
    senderInfo.transport = {
      state: sender.transport.state,
      iceTransport: sender.transport.iceTransport ? {
        gatheringState: sender.transport.iceTransport.gatheringState,
        state: sender.transport.iceTransport.state
      } : undefined
    };
  }

  return senderInfo;
}

/**
 * Extract serializable properties from an RTCRtpReceiver
 */
export function extractReceiverInfo(receiver: RTCRtpReceiver): SerializableReceiver {
  const receiverInfo: SerializableReceiver = {};

  // Extract jitter buffer target if available
  if (receiver.jitterBufferTarget !== undefined && receiver.jitterBufferTarget !== null) {
    receiverInfo.jitterBufferTarget = receiver.jitterBufferTarget;
  }

  // Extract track info if available
  if (receiver.track) {
    receiverInfo.track = {
      id: receiver.track.id,
      kind: receiver.track.kind,
      enabled: receiver.track.enabled,
      muted: receiver.track.muted,
      readyState: receiver.track.readyState,
      label: receiver.track.label,
      contentHint: receiver.track.contentHint
    };
  }

  // Extract transform if available (may be undefined in some browsers)
  if (receiver.transform) {
    receiverInfo.transform = receiver.transform;
  }

  // Extract transport info if available
  if (receiver.transport) {
    receiverInfo.transport = {
      state: receiver.transport.state,
      iceTransport: receiver.transport.iceTransport ? {
        gatheringState: receiver.transport.iceTransport.gatheringState,
        state: receiver.transport.iceTransport.state
      } : undefined
    };
  }

  return receiverInfo;
}

/**
 * Get all sender information from a peer connection
 */
export function getAllSenderInfo(peerConnection: RTCPeerConnection): SerializableSender[] {
  return peerConnection.getSenders().map((sender, index) => {
    console.log(`Sender ${index}:`, sender);
    return extractSenderInfo(sender);
  });
}

/**
 * Get all receiver information from a peer connection
 */
export function getAllReceiverInfo(peerConnection: RTCPeerConnection): SerializableReceiver[] {
  return peerConnection.getReceivers().map((receiver, index) => {
    console.log(`Receiver ${index}:`, receiver);
    return extractReceiverInfo(receiver);
  });
}

/**
 * Get peer connection configuration as a serializable object
 */
export function getPeerConnectionConfig(peerConnection: RTCPeerConnection) {
  return peerConnection.getConfiguration();
}

/**
 * Get sender parameters as a serializable object
 */
export async function getSenderParameters(sender: RTCRtpSender) {
  try {
    const parameters = sender.getParameters();
    return {
      encodings: parameters.encodings,
      transactionId: parameters.transactionId,
      codecs: parameters.codecs,
      headerExtensions: parameters.headerExtensions,
      rtcp: parameters.rtcp,
      degradationPreference: parameters.degradationPreference
    };
  } catch (error) {
    console.error('Error getting sender parameters:', error);
    return null;
  }
}

/**
 * Get sender stats as a serializable object
 */
export async function getSenderStats(sender: RTCRtpSender) {
  try {
    const stats = await sender.getStats();
    const statsArray: RTCStatsReport[] = [];
    stats.forEach((report) => {
      const plain: Record<string, unknown> = {};
      for (const key in report) {
        if (Object.prototype.hasOwnProperty.call(report, key)) {
          plain[key] = report[key];
        }
      }
      statsArray.push(plain as RTCStatsReport);
    });
    return statsArray;
  } catch (error) {
    console.error('Error getting sender stats:', error);
    return null;
  }
}

/**
 * Get receiver stats as a serializable object
 */
export async function getReceiverStats(receiver: RTCRtpReceiver) {
  try {
    const stats = await receiver.getStats();
    const statsArray: RTCStatsReport[] = [];
    stats.forEach((report) => {
      const plain: Record<string, unknown> = {};
      for (const key in report) {
        if (Object.prototype.hasOwnProperty.call(report, key)) {
          plain[key] = report[key];
        }
      }
      statsArray.push(plain as RTCStatsReport);
    });
    return statsArray;
  } catch (error) {
    console.error('Error getting receiver stats:', error);
    return null;
  }
}

/**
 * Get peer connection stats as a serializable object
 */
export async function getPeerConnectionStats(peerConnection: RTCPeerConnection) {
  try {
    const stats = await peerConnection.getStats();
    const statsArray: RTCStatsReport[] = [];
    stats.forEach((report) => {
      const plain: Record<string, unknown> = {};
      for (const key in report) {
        if (Object.prototype.hasOwnProperty.call(report, key)) {
          plain[key] = report[key];
        }
      }
      statsArray.push(plain as RTCStatsReport);
    });
    return statsArray;
  } catch (error) {
    console.error('Error getting peer connection stats:', error);
    return null;
  }
} 