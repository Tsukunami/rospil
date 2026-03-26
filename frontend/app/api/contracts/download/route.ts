import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { amountToRussianWords } from "@/lib/numberToRussian";
import { getContractHtml } from "@/lib/templates/contractTemplate";

export async function POST(req: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const body = await req.json();
const { number, cost, date, supplierName, supplierInn, scope } = body;

    if (!number) {
      return NextResponse.json(
        { error: "Не указан номер договора" },
        { status: 400 }
      );
    }

    const numericCost =
      cost !== undefined && cost !== null && cost !== ""
        ? Number(cost)
        : 0;

    const costText = amountToRussianWords(numericCost);
const html = getContractHtml({
  number: String(number),
  date: date || "",
  supplierName: supplierName || "Поставщик",
  supplierInn: supplierInn || "",
  costText,
  scope,
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
        "Content-Disposition": `attachment; filename="contract-${number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Ошибка генерации PDF:", error);

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