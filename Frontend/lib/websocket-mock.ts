export interface CivicNotification {
  id: string;
  category: "STATUTORY_DEADLINE" | "FINANCIAL_PFMS" | "FIELD_GIS" | "AUDIT_COMPLIANCE";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: "CRITICAL" | "HIGH" | "INFO" | "SUCCESS";
  actionUrl?: string;
  actionLabel?: string;
  meta?: {
    ulpin?: string;
    projectRef?: string;
    amountINR?: number;
    delayDays?: number;
  };
}

export const INITIAL_NOTIFICATIONS: CivicNotification[] = [
  {
    id: "NOTIF-001",
    category: "STATUTORY_DEADLINE",
    title: "Section 11 Gazette Lapsing Alert",
    message: "Doddaballapur STRR Package-02 has 12 days remaining before Section 11 statutory expiry. Issue Section 19 declaration to prevent docket voidance.",
    timestamp: "10 mins ago",
    read: false,
    severity: "CRITICAL",
    actionUrl: "/cases/CASE-2026-001",
    actionLabel: "Open Case Docket",
    meta: {
      projectRef: "PRJ-NHAI-01",
      delayDays: 12,
    },
  },
  {
    id: "NOTIF-002",
    category: "FINANCIAL_PFMS",
    title: "PFMS DBT Disbursement Completed",
    message: "Batch #PFMS-2026-09-044 cleared successfully. ₹1.42 Cr credited directly to 18 verified farmer bank accounts via NPCI Aadhaar Bridge.",
    timestamp: "35 mins ago",
    read: false,
    severity: "SUCCESS",
    actionUrl: "/compensation",
    actionLabel: "View PFMS Ledger",
    meta: {
      amountINR: 14200000,
    },
  },
  {
    id: "NOTIF-003",
    category: "FIELD_GIS",
    title: "Field Surveyor Evidence Uploaded",
    message: "Surveyor Suresh Patil uploaded DGPS boundary lock and 3 geo-tagged photographs for Khasra #142/2A, Doddaballapur Taluk.",
    timestamp: "2 hours ago",
    read: true,
    severity: "INFO",
    actionUrl: "/field",
    actionLabel: "Inspect Demarcation",
    meta: {
      ulpin: "KA-BLR-2026-0041",
    },
  },
  {
    id: "NOTIF-004",
    category: "AUDIT_COMPLIANCE",
    title: "CAG Compliance Audit Seal Generated",
    message: "Cryptographic SHA-256 block #104 appended to statutory ledger by District Magistrate Priya Sundaram, IAS.",
    timestamp: "4 hours ago",
    read: true,
    severity: "INFO",
    actionUrl: "/audit",
    actionLabel: "Inspect Audit Block",
  },
];

type NotificationListener = (notification: CivicNotification) => void;
type ConnectionListener = (connected: boolean) => void;

class MockWebSocketService {
  private listeners: Set<NotificationListener> = new Set();
  private connListeners: Set<ConnectionListener> = new Set();
  private isConnected: boolean = true;
  private autoPushInterval: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.startConnectionHeartbeat();
    }
  }

  private startConnectionHeartbeat() {
    this.isConnected = true;
    this.notifyConnection(true);
  }

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeConnection(listener: ConnectionListener) {
    this.connListeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.connListeners.delete(listener);
    };
  }

  private notifyConnection(status: boolean) {
    this.isConnected = status;
    this.connListeners.forEach((fn) => fn(status));
  }

  // Simulate incoming live event push
  simulateIncomingPush(custom?: Partial<CivicNotification>) {
    const templates = [
      {
        category: "STATUTORY_DEADLINE" as const,
        title: "Section 15 Hearing Scheduled",
        message: "Special Land Acquisition Officer scheduled Gram Sabha conciliation for Channapatna Village.",
        severity: "HIGH" as const,
        actionUrl: "/cases/CASE-2026-001",
        actionLabel: "Review Hearing Roster",
      },
      {
        category: "FIELD_GIS" as const,
        title: "Offline PWA Queue Synced",
        message: "5 offline cadastral boundary demarcations synchronized with Central NIC GIS server.",
        severity: "SUCCESS" as const,
        actionUrl: "/gis",
        actionLabel: "View in GIS Map",
      },
      {
        category: "FINANCIAL_PFMS" as const,
        title: "e-Award Solatium Certified",
        message: "Section 23 statutory award ₹2.85 Cr approved with 100% Solatium for Vadodara Spur corridor.",
        severity: "INFO" as const,
        actionUrl: "/compensation",
        actionLabel: "View Award Sheet",
      },
    ];

    const chosen = custom || templates[Math.floor(Math.random() * templates.length)];

    const newNotification: CivicNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      timestamp: "Just now",
      read: false,
      ...chosen,
    } as CivicNotification;

    this.listeners.forEach((fn) => fn(newNotification));
    return newNotification;
  }
}

export const mockWebSocket = new MockWebSocketService();
