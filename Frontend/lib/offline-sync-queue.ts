export interface OfflineQueueItem {
  id: string;
  type: "GPS_DEMARCATION" | "FIELD_PHOTO" | "POSSESSION_MEMO" | "SURVEY_RECORD";
  title: string;
  ulpin: string;
  surveyNo: string;
  payload: any;
  status: "QUEUED" | "SYNCING" | "SYNCED" | "FAILED";
  timestamp: string;
  retries: number;
  errorMessage?: string;
}

const INITIAL_QUEUE: OfflineQueueItem[] = [
  {
    id: "Q-001",
    type: "GPS_DEMARCATION",
    title: "Joint Demarcation & Boundary Pillar Lock",
    ulpin: "KA-BLR-2026-0041",
    surveyNo: "142/1",
    payload: {
      coords: [13.2941, 77.5342],
      accuracyMeters: 1.4,
      witness: "Sarpanch Narayan Gowda",
    },
    status: "QUEUED",
    timestamp: "Today, 11:20 AM",
    retries: 0,
  },
  {
    id: "Q-002",
    type: "FIELD_PHOTO",
    title: "Active Borewell & Tree Asset Photo",
    ulpin: "KA-BLR-2026-0042",
    surveyNo: "142/2A",
    payload: {
      coords: [13.2952, 77.5375],
      treesCount: 14,
      borewellActive: true,
    },
    status: "QUEUED",
    timestamp: "Today, 11:45 AM",
    retries: 0,
  },
];

class OfflineSyncQueueManager {
  private getStorage(): OfflineQueueItem[] {
    if (typeof window === "undefined") return INITIAL_QUEUE;
    try {
      const stored = localStorage.getItem("aarohan_offline_queue");
      return stored ? JSON.parse(stored) : INITIAL_QUEUE;
    } catch {
      return INITIAL_QUEUE;
    }
  }

  private setStorage(queue: OfflineQueueItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("aarohan_offline_queue", JSON.stringify(queue));
    } catch (e) {
      console.error("Queue storage error", e);
    }
  }

  getQueue(): OfflineQueueItem[] {
    return this.getStorage();
  }

  enqueue(item: Omit<OfflineQueueItem, "id" | "status" | "timestamp" | "retries">): OfflineQueueItem {
    const queue = this.getStorage();
    const newItem: OfflineQueueItem = {
      ...item,
      id: `Q-${Date.now().toString().slice(-4)}`,
      status: "QUEUED",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      retries: 0,
    };
    queue.unshift(newItem);
    this.setStorage(queue);
    return newItem;
  }

  async syncAll(
    onProgress?: (syncedItem: OfflineQueueItem) => void
  ): Promise<{ synced: number; failed: number }> {
    const queue = this.getStorage();
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      if (queue[i].status === "QUEUED" || queue[i].status === "FAILED") {
        queue[i].status = "SYNCING";
        this.setStorage(queue);

        // Simulate network API transmission
        await new Promise((resolve) => setTimeout(resolve, 600));

        queue[i].status = "SYNCED";
        synced++;
        if (onProgress) onProgress(queue[i]);
      }
    }

    this.setStorage(queue);
    return { synced, failed };
  }

  clearSynced(): void {
    const queue = this.getStorage().filter((item) => item.status !== "SYNCED");
    this.setStorage(queue);
  }

  remove(id: string): void {
    const queue = this.getStorage().filter((item) => item.id !== id);
    this.setStorage(queue);
  }
}

export const offlineSyncQueue = new OfflineSyncQueueManager();
