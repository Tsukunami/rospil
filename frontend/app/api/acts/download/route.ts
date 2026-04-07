import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getActHtml } from "@/lib/templates/actTemplate";
import { getDiscrepancyActHtml } from "@/lib/templates/discrepancyActTemplate";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU");
  } catch {
    return dateStr;
  }
}

function getSafeFilename(actId: string | number | undefined) {
  const safeId = String(actId ?? "document").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `act-${safeId}.pdf`;
}

export async function POST(req: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const body = await req.json();

    const {
      actId,
      actType,
      actDate,
      employeeName,
      city,
      supplierName,
      supplierAddress,
      contractNumber,
      contractDate,
      items,
      grandTotal,
      vat,
      totalWithVat,
      discrepancyType,
      defectQuantity,
      shortageQuantity,
      actuallyAccepted,
      defectDescription,
      deliveryDate,
      productName,
      unit,
      price,
      documentedQuantity,
    } = body;

    let html = "";

    if (actType === "акт о расхождении") {
      const numericPrice = Number(price || 0);
      const numericDocumentedQuantity = Number(documentedQuantity || 0);
      const numericActualQuantity = Number(actuallyAccepted || 0);
      const numericShortageQuantity = Number(shortageQuantity || 0);
      const numericDefectQuantity = Number(defectQuantity || 0);

      const documentedSum = numericPrice * numericDocumentedQuantity;
      const actualSum = numericPrice * numericActualQuantity;
      const shortageSum = numericPrice * numericShortageQuantity;
      const defectSum = numericPrice * numericDefectQuantity;

      html = getDiscrepancyActHtml({
        actDate: formatDate(actDate),
        organizationName: "ООО «Роспил»",
        organizationAddress: "г. Сыктывкар",
        place: city || "Сыктывкар",
        employeeName: employeeName || "",
        supplierName: supplierName || "Поставщик",
        supplierAddress: supplierAddress || "",
        contractNumber: contractNumber || "",
        contractDate: formatDate(contractDate),
        deliveryDate: formatDate(deliveryDate),
        productName: productName || "Товар",
        unit: unit || "м³",
        price: numericPrice,
        documentedQuantity: numericDocumentedQuantity,
        actualQuantity: numericActualQuantity,
        shortageQuantity: numericShortageQuantity,
        defectQuantity: numericDefectQuantity,
        discrepancyType: discrepancyType || "",
        defectDescription: defectDescription || "",
        documentedSum,
        actualSum,
        shortageSum,
        defectSum,
      });
    } else {
      html = getActHtml({
        actId,
        actType,
        actDate: formatDate(actDate),
        employeeName,
        city: city || "Сыктывкар",
        supplierName,
        contractNumber,
        contractDate: formatDate(contractDate),
        items: items || [],
        grandTotal: Number(grandTotal || 0),
        vat: Number(vat || 0),
        totalWithVat: Number(totalWithVat || 0),
      });
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    const filename = getSafeFilename(actId);

    return new NextResponse(Uint8Array.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Ошибка генерации PDF:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ошибка генерации PDF",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}