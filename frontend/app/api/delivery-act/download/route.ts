import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getDeliveryActHtml } from "@/lib/templates/deliveryActTemplate";

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
      city,
      actDate,
      contractDate,
      contractNumber,
      supplierName,
      productName,
      price,
      scope,
    } = body;

    if (!contractNumber) {
      return NextResponse.json(
        { error: "Не указан номер договора" },
        { status: 400 }
      );
    }

    const numericPrice =
      price !== undefined && price !== null && price !== ""
        ? Number(price)
        : 0;

    const numericScope =
      scope !== undefined && scope !== null && scope !== ""
        ? Number(scope)
        : 0;

    const total = numericPrice * numericScope;
    const vat = total * 0.2;
    const totalWithVat = total + vat;

    const html = getDeliveryActHtml({
      city: city || "Сыктывкар",
      actDate: formatDate(actDate),
      contractDate: formatDate(contractDate),
      contractNumber: String(contractNumber),
      supplierName: supplierName || "Поставщик",
      productName: productName || "Товар",
      price: numericPrice,
      scope: numericScope,
      total,
      vat,
      totalWithVat,
    });

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
        "Content-Disposition": `attachment; filename="delivery-act-${contractNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Ошибка генерации акта PDF:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка генерации PDF",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}