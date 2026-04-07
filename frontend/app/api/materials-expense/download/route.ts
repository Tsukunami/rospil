import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getExpenseInvoiceHtml } from "@/lib/templates/expenseInvoiceTemplate";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("ru-RU");
  } catch {
    return dateStr;
  }
}

type RequestItem = {
  id?: number | string;
  productName?: string;
  unit?: string;
  price?: number;
  quantity?: number;
};

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
      items,
      vatPercent,
    } = body;

    let sourceItems: RequestItem[] = [];

    if (Array.isArray(items) && items.length > 0) {
      sourceItems = items;
    } else if (item) {
      sourceItems = [item];
    }

    if (sourceItems.length === 0) {
      return NextResponse.json(
        { error: "Не переданы данные позиции накладной" },
        { status: 400 }
      );
    }

    const normalizedItems = sourceItems.map((entry, index) => {
      const price = Number(entry.price || 0);
      const quantity = Number(entry.quantity || 0);
      const sum = price * quantity;

      return {
        index: index + 1,
        productName: entry.productName || "Материал",
        unit: entry.unit || "м³",
        price,
        quantity,
        sum,
      };
    });

    const total = normalizedItems.reduce((acc, entry) => acc + entry.sum, 0);
    const actualVatPercent = Number(vatPercent ?? 18);
    const vatAmount = total * actualVatPercent / (100 + actualVatPercent);

    const html = getExpenseInvoiceHtml({
      invoiceNumber: invoiceNumber || sourceItems[0]?.id || "document",
      invoiceDate: formatDate(invoiceDate),
      shipper: shipper || "ООО «Роспил»",
      shipperAddress: shipperAddress || "г. Сыктывкар",
      consignee: consignee || "Производство",
      consigneeAddress: consigneeAddress || "г. Сыктывкар",
      basis: basis || "Передача материалов в производство",
      items: normalizedItems,
      vatPercent: actualVatPercent,
      total,
      vatAmount,
      totalNamesCount: normalizedItems.length,
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
        "Content-Disposition": `attachment; filename="expense-invoice-${invoiceNumber || sourceItems[0]?.id || "document"}.pdf"`,
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