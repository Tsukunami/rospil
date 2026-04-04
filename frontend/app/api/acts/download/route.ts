import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getActHtml } from "@/lib/templates/actTemplate";
import { getTerminationAgreementHtml } from "@/lib/templates/terminationAgreementTemplate";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU");
  } catch {
    return dateStr;
  }
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
      contractNumber,
      contractDate,
      items,
      grandTotal,
      vat,
      totalWithVat,
    } = body;

    let html = "";

    if (actType === "акт о расхождении") {
      html = getTerminationAgreementHtml({
        city: city || "Сыктывкар",
        agreementDate: formatDate(actDate),
        contractNumber: contractNumber || "",
        contractDate: formatDate(contractDate),
        supplierName: supplierName || "Поставщик",
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
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
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

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="act-${actId}.pdf"`,
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