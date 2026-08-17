"use server";

import prisma from "@/lib/dbClient/prisma";
import { revalidatePath } from "next/cache";

// --- Tenders Actions ---
export async function getTenders() {
  try {
    return await prisma.tender.findMany({
      orderBy: { submissionDeadline: "asc" },
    });
  } catch {
    return [];
  }
}

export async function createTender(data: {
  tenderNumber: string;
  title: string;
  authority: string;
  category: string;
  value: number;
  location: string;
  submissionDeadline: string;
  publishDate?: string;
  emdAmount?: number;
  tenderFee?: number;
  sourcePortal?: string;
  description?: string;
}) {
  try {
    const item = await prisma.tender.create({
      data: {
        tenderNumber: data.tenderNumber,
        title: data.title,
        authority: data.authority,
        category: data.category,
        value: data.value,
        location: data.location,
        submissionDeadline: new Date(data.submissionDeadline),
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        emdAmount: data.emdAmount,
        tenderFee: data.tenderFee,
        sourcePortal: data.sourcePortal || "GeM",
        description: data.description,
      },
    });
    revalidatePath("/tenders");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTender(id: string) {
  try {
    await prisma.tender.delete({ where: { id } });
    revalidatePath("/tenders");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Bids Actions ---
export async function getBids() {
  try {
    return await prisma.bid.findMany({
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createBid(data: {
  tenderId: string;
  tenderNumber: string;
  tenderTitle: string;
  clientName: string;
  estimatedValue: number;
  quotedAmount: number;
  profitMargin?: number;
  stage?: string;
  submissionDeadline: string;
  notes?: string;
}) {
  try {
    const item = await prisma.bid.create({
      data: {
        tenderId: data.tenderId,
        tenderNumber: data.tenderNumber,
        tenderTitle: data.tenderTitle,
        clientName: data.clientName,
        estimatedValue: data.estimatedValue,
        quotedAmount: data.quotedAmount,
        profitMargin: data.profitMargin,
        stage: data.stage || "drafting",
        submissionDeadline: new Date(data.submissionDeadline),
        notes: data.notes,
      },
    });
    revalidatePath("/bids");
    revalidatePath("/");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateBidStage(id: string, stage: string) {
  try {
    const item = await prisma.bid.update({
      where: { id },
      data: { stage },
    });
    revalidatePath("/bids");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBid(id: string) {
  try {
    await prisma.bid.delete({ where: { id } });
    revalidatePath("/bids");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Competitor Intelligence & BOQ Actions ---
export async function getCompetitors() {
  try {
    return await prisma.competitor.findMany({
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function createCompetitor(data: {
  name: string;
  gstin?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  marketStrength?: string;
  typicalDiscountRate?: number;
  historicalWinRate?: number;
  notes?: string;
}) {
  try {
    const item = await prisma.competitor.create({
      data: {
        name: data.name,
        gstin: data.gstin,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        marketStrength: data.marketStrength || "medium",
        typicalDiscountRate: data.typicalDiscountRate || 0,
        historicalWinRate: data.historicalWinRate || 0,
        notes: data.notes,
      },
    });
    revalidatePath("/competitors");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCompetitor(id: string) {
  try {
    await prisma.competitor.delete({ where: { id } });
    revalidatePath("/competitors");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCompetitorBids(tenderId?: string) {
  try {
    if (tenderId && tenderId !== "all") {
      return await prisma.competitorBid.findMany({
        where: { tenderId },
        orderBy: { quotedPrice: "asc" },
      });
    }
    return await prisma.competitorBid.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createCompetitorBid(data: {
  tenderId: string;
  tenderNumber: string;
  tenderTitle: string;
  competitorId: string;
  competitorName: string;
  quotedPrice: number;
  ourPrice?: number;
  technicalScore?: number;
  rank?: string;
  notes?: string;
}) {
  try {
    const ourPrice = data.ourPrice ?? 0;
    const variance = ourPrice > 0 ? Number((((data.quotedPrice - ourPrice) / ourPrice) * 100).toFixed(2)) : 0;
    const margin = Number((data.quotedPrice - ourPrice).toFixed(2));

    const item = await prisma.competitorBid.create({
      data: {
        tenderId: data.tenderId,
        tenderNumber: data.tenderNumber,
        tenderTitle: data.tenderTitle,
        competitorId: data.competitorId,
        competitorName: data.competitorName,
        quotedPrice: data.quotedPrice,
        ourPrice: data.ourPrice,
        technicalScore: data.technicalScore || 90,
        rank: data.rank || "L2",
        isWinner: data.rank === "L1",
        priceVariancePercent: variance,
        marginSpread: margin,
        notes: data.notes,
      },
    });
    revalidatePath("/competitors");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCompetitorBid(id: string) {
  try {
    await prisma.competitorBid.delete({ where: { id } });
    revalidatePath("/competitors");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getBOQItems(tenderId?: string) {
  try {
    if (tenderId && tenderId !== "all") {
      return await prisma.bOQItem.findMany({
        where: { tenderId },
        orderBy: { groupName: "asc" },
      });
    }
    return await prisma.bOQItem.findMany({
      orderBy: { groupName: "asc" },
    });
  } catch {
    return [];
  }
}

export async function createBOQItem(data: {
  tenderId: string;
  groupName: string;
  itemCode: string;
  description: string;
  quantity: number;
  uom: string;
  estimatedRate: number;
  ourQuotedRate: number;
}) {
  try {
    const item = await prisma.bOQItem.create({
      data: {
        tenderId: data.tenderId,
        groupName: data.groupName,
        itemCode: data.itemCode,
        description: data.description,
        quantity: data.quantity,
        uom: data.uom,
        estimatedRate: data.estimatedRate,
        ourQuotedRate: data.ourQuotedRate,
      },
    });
    revalidatePath("/competitors");
    revalidatePath("/sheets");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBOQItem(id: string) {
  try {
    await prisma.bOQItem.delete({ where: { id } });
    revalidatePath("/competitors");
    revalidatePath("/sheets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Vendors Actions ---
export async function getVendors() {
  try {
    return await prisma.vendor.findMany({
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function createVendor(data: {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category: string;
  rating?: number;
  gstin?: string;
  pan?: string;
  address?: string;
  notes?: string;
}) {
  try {
    const item = await prisma.vendor.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        category: data.category,
        rating: data.rating || 5.0,
        gstin: data.gstin,
        pan: data.pan,
        address: data.address,
        notes: data.notes,
      },
    });
    revalidatePath("/vendors");
    return { success: true, data: item };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteVendor(id: string) {
  try {
    await prisma.vendor.delete({ where: { id } });
    revalidatePath("/vendors");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Alerts & Automation Actions ---
export async function getAlerts() {
  try {
    return await prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function markAlertRead(id: string) {
  try {
    await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
    revalidatePath("/alerts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
