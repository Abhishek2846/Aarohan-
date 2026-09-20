import { NextResponse } from "next/server";

const AUDIT_LEDGER_BLOCKS = [
  {
    index: 104,
    timestamp: "09 Sep 2026, 14:32 IST",
    actor: "Priya Sundaram, IAS",
    role: "District Magistrate & LAO",
    action: "ENACT_AWARD_SOLATIUM",
    targetEntity: "Parcel KA-BLR-2026-0041 (ULPIN)",
    previousHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    currentHash: "7a2f1b098c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
    dscSignature: "SHA256withRSA:4f81...90ce (CCA Class-3 DSC)",
    clientIp: "10.42.14.88 (NIC Secure Gateway)",
    verified: true,
  },
  {
    index: 103,
    timestamp: "08 Sep 2026, 16:15 IST",
    actor: "Suresh Patil",
    role: "Revenue Field Surveyor (RI)",
    action: "UPLOAD_GPS_DEMARCATION_EVIDENCE",
    targetEntity: "Parcel KA-BLR-2026-0041 (ULPIN)",
    previousHash: "8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    currentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    dscSignature: "SHA256withECDSA:77b1...112a (Field PWA Key)",
    clientIp: "103.21.12.4 (Doddaballapur Cellular DGPS)",
    verified: true,
  },
  {
    index: 102,
    timestamp: "05 Sep 2026, 10:04 IST",
    actor: "Vikram Malhotra",
    role: "Project Director (NHAI)",
    action: "SUBMIT_ALIGNMENT_PROPOSAL",
    targetEntity: "Project NHAI/EXP/DEL-MUM/PKG-04",
    previousHash: "4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    currentHash: "8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    dscSignature: "SHA256withRSA:99a4...33bb (NHAI Gateway DSC)",
    clientIp: "10.14.8.11 (GatiShakti Portal Hub)",
    verified: true,
  },
];

export async function GET() {
  return NextResponse.json({
    status: "SUCCESS",
    merkleRoot: "9f8e7d6c5b4a3102ef8933ba882104fa",
    totalBlocksCount: 1420,
    tamperEventsDetected: 0,
    blocks: AUDIT_LEDGER_BLOCKS,
  });
}

export async function POST() {
  // Simulates cryptographic verification of all sequential blocks
  return NextResponse.json({
    status: "SUCCESS",
    verificationStatus: "PASSED",
    message: "All 1,420 sequential block hashes, Merkle root branches, and CCA digital signatures verified intact.",
    totalValidated: 1420,
    tamperDetected: false,
    timestamp: new Date().toISOString(),
  });
}
