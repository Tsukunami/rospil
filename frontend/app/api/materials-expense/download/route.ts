import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getExpenseInvoiceHtml } from "@/lib/templates/expenseInvoiceTemplate";

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
    console.log("POST /api/materials-expense/download body:", body);

    const {
      invoiceNumber,
      invoiceDate,
      shipper,
      shipperAddress,
      consignee,
      consigneeAddress,
      basis,
      item,
      vatPercent,
    } = body;

    if (!item) {
      return NextResponse.json(
        { error: "Не переданы данные позиции накладной" },
        { status: 400 }
      );
    }

    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);
    const sum = price * quantity;

    const actualVatPercent = Number(vatPercent ?? 18);
    const vatAmount = sum * actualVatPercent / (100 + actualVatPercent);

    const html = getExpenseInvoiceHtml({
      invoiceNumber: invoiceNumber || item.id || "",
      invoiceDate: formatDate(invoiceDate),
      shipper: shipper || "ООО «Роспил»",
      shipperAddress: shipperAddress || "г. Сыктывкар",
      consignee: consignee || "Производство",
      consigneeAddress: consigneeAddress || "г. Сыктывкар",
      basis: basis || "Передача материалов в производство",
      items: [
        {
          index: 1,
          productName: item.productName || "Материал",
          unit: item.unit || "м³",
          price,
          quantity,
          sum,
        },
      ],
      vatPercent: actualVatPercent,
      total: sum,
      vatAmount,
      totalNamesCount: 1,
    });

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
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="expense-invoice-${invoiceNumber || item.id || "document"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Ошибка генерации PDF расходной накладной:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ошибка генерации PDF расходной накладной",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}