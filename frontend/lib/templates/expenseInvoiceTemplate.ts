type ExpenseInvoiceItem = {
  index: number;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  sum: number;
};

type ExpenseInvoiceTemplateData = {
  invoiceNumber: string | number;
  invoiceDate: string;
  shipper: string;
  shipperAddress: string;
  consignee: string;
  consigneeAddress: string;
  basis: string;
  items: ExpenseInvoiceItem[];
  vatPercent?: number;
  total: number;
  vatAmount: number;
  totalNamesCount: number;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getExpenseInvoiceHtml(data: ExpenseInvoiceTemplateData) {
  const {
    invoiceNumber,
    invoiceDate,
    shipper,
    shipperAddress,
    consignee,
    consigneeAddress,
    basis,
    items,
    vatPercent = 18,
    total,
    vatAmount,
    totalNamesCount,
  } = data;

  const tableRows = items
    .map((item, idx) => {
      return `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>${escapeHtml(item.productName)}</td>
          <td class="center">${escapeHtml(item.unit)}</td>
          <td class="right">${formatMoney(item.price)}</td>
          <td class="right">${formatMoney(item.quantity)}</td>
          <td class="right">${formatMoney(item.sum)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <title>Расходная накладная</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            font-family: "Times New Roman", serif;
            color: #111;
            font-size: 16px;
            line-height: 1.2;
            margin: 0;
          }

          .document {
            width: 100%;
          }

          .title {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
          }

          .meta-block {
            margin-bottom: 18px;
          }

          .meta-line {
            margin: 6px 0;
            font-size: 18px;
          }

          .underline-inline {
            display: inline-block;
            border-bottom: 1px solid #000;
            min-width: 220px;
            padding: 0 6px 2px;
          }

          .wide {
            min-width: 480px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          th, td {
            border: 1px solid #222;
            padding: 6px 8px;
            vertical-align: middle;
            font-size: 16px;
          }

          th {
            text-align: center;
            font-weight: 700;
          }

          td {
            height: 26px;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .summary-wrap {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }

          .summary-table {
            width: 36%;
            border-collapse: collapse;
            margin-top: 0;
          }

          .summary-table td {
            border: 1px solid #222;
            padding: 8px 10px;
            font-size: 16px;
          }

          .summary-label {
            text-align: right;
            font-weight: 700;
            width: 65%;
          }

          .summary-value {
            text-align: right;
            width: 35%;
          }

          .totals-text {
            margin-top: 18px;
            font-size: 18px;
          }

          .totals-text .line {
            margin: 6px 0;
          }

          .signatures {
            margin-top: 34px;
          }

          .signature-row {
            margin: 24px 0 8px;
            font-size: 18px;
          }

          .signature-line {
            display: inline-block;
            border-bottom: 1px solid #000;
            min-width: 170px;
            height: 20px;
            vertical-align: bottom;
            margin: 0 8px;
          }

          .signature-line.short {
            min-width: 120px;
          }

          .signature-line.medium {
            min-width: 220px;
          }

          .signature-labels {
            margin-left: 165px;
            font-size: 12px;
            color: #222;
          }

          .signature-labels span {
            display: inline-block;
            text-align: center;
            margin-right: 8px;
          }

          .stamp {
            font-weight: 700;
            font-size: 22px;
            margin: 8px 0 -4px;
          }
        </style>
      </head>
      <body>
        <div class="document">
          <div class="title">
            Расходная накладная № ${escapeHtml(invoiceNumber)} от «${escapeHtml(invoiceDate)}»
          </div>

          <div class="meta-block">
            <div class="meta-line">
              Грузоотправитель:
              <span class="underline-inline wide">${escapeHtml(shipper)}</span>
            </div>
            <div class="meta-line">
              Адрес грузоотправителя:
              <span class="underline-inline wide">${escapeHtml(shipperAddress)}</span>
            </div>
          </div>

          <div class="meta-block">
            <div class="meta-line">
              Грузополучатель:
              <span class="underline-inline wide">${escapeHtml(consignee)}</span>
            </div>
            <div class="meta-line">
              Адрес грузополучателя:
              <span class="underline-inline wide">${escapeHtml(consigneeAddress)}</span>
            </div>
          </div>

          <div class="meta-block">
            <div class="meta-line">
              Основание для отпуска:
              <span class="underline-inline wide">${escapeHtml(basis)}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 6%">№</th>
                <th style="width: 45%">Товар</th>
                <th style="width: 8%">Ед.</th>
                <th style="width: 15%">Цена</th>
                <th style="width: 11%">Кол-во</th>
                <th style="width: 15%">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="summary-wrap">
            <table class="summary-table">
              <tr>
                <td class="summary-label">в том числе НДС ${vatPercent}%:</td>
                <td class="summary-value">${formatMoney(vatAmount)}</td>
              </tr>
              <tr>
                <td class="summary-label">Итого:</td>
                <td class="summary-value">${formatMoney(total)}</td>
              </tr>
            </table>
          </div>

          <div class="totals-text">
            <div class="line">Всего отпущено ${escapeHtml(totalNamesCount)} наименования</div>
            <div class="line">На сумму ${formatMoney(total)}</div>
            <div class="line">в том числе НДС ${vatPercent}% ${formatMoney(vatAmount)}</div>
          </div>

          <div class="signatures">
            <div class="signature-row">
              Отпуск разрешил
              <span class="signature-line"></span>
              <span class="signature-line short"></span>
              <span class="signature-line medium"></span>
            </div>
            <div class="signature-labels">
              <span style="width:170px;">(подпись)</span>
              <span style="width:120px;">(должность)</span>
              <span style="width:220px;">(Ф.И.О.)</span>
            </div>

            <div class="stamp">М. П.</div>

            <div class="signature-row">
              Отпустил
              <span class="signature-line"></span>
              <span class="signature-line medium"></span>
              <span class="signature-line medium"></span>
            </div>
            <div class="signature-labels" style="margin-left: 95px;">
              <span style="width:170px;">(подпись)</span>
              <span style="width:220px;">(должность)</span>
              <span style="width:220px;">(Ф.И.О.)</span>
            </div>

            <div class="signature-row" style="margin-top: 44px;">
              Получил
              <span class="signature-line"></span>
              <span class="signature-line medium"></span>
              <span class="signature-line medium"></span>
            </div>
            <div class="signature-labels" style="margin-left: 80px;">
              <span style="width:170px;">(подпись)</span>
              <span style="width:220px;">(должность)</span>
              <span style="width:220px;">(Ф.И.О.)</span>
            </div>

            <div class="stamp">М. П.</div>
          </div>
        </div>
      </body>
    </html>
  `;
}