type ActItemRow = {
  index: number;
  productName: string;
  price: number;
  scope: number;
  total: number;
  contractNumber: string;
  contractDate: string;
  supplierName: string;
};

type ActTemplateParams = {
  actId: number;
  actType: string;
  actDate: string;
  employeeName: string;
  city: string;
  supplierName: string;
  contractNumber: string;
  contractDate: string;
  items: ActItemRow[];
  grandTotal: number;
  vat: number;
  totalWithVat: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getActHtml({
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
}: ActTemplateParams) {
  const rowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="text-align:center;">${item.index}</td>
        <td>${item.productName}</td>
        <td style="text-align:right;">${formatMoney(item.price)}</td>
        <td style="text-align:right;">${formatMoney(item.scope)}</td>
        <td style="text-align:right;">${formatMoney(item.total)}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Акт № ${actId}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: Arial, sans-serif;
      color: #000;
      margin: 0;
      padding: 0;
      font-size: 14px;
      line-height: 1.45;
    }

    .container {
      width: 100%;
    }

    .title {
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .subtitle {
      text-align: center;
      margin-bottom: 28px;
      font-size: 14px;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    p {
      margin: 0 0 12px 0;
      text-align: justify;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 24px 0;
      font-size: 14px;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px 10px;
      vertical-align: top;
    }

    th {
      text-align: center;
      font-weight: 700;
    }

    .summary {
      width: 340px;
      margin-left: auto;
      margin-top: 10px;
      margin-bottom: 24px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #ccc;
      padding: 6px 0;
      gap: 16px;
    }

    .summary-row strong:last-child {
      white-space: nowrap;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-top: 50px;
    }

    .sign-col {
      width: 45%;
    }

    .line {
      margin-top: 50px;
      border-top: 1px solid #000;
      padding-top: 8px;
    }

    .stamp {
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${actType === "акт приемки" ? "Акт приема-передачи товара" : "Акт о расхождении"}</div>
    <div class="subtitle">Акт № ${actId}</div>

    <div class="top-row">
      <div>г. ${city}</div>
      <div>${actDate}</div>
    </div>

    <p>
      ${supplierName} (далее — Поставщик), с одной стороны, и ООО «Роспил»
      (далее — Покупатель), с другой стороны, подписали акт к договору
      от ${contractDate} № ${contractNumber}.
    </p>

    <p>
      Ответственный сотрудник: ${employeeName}.
    </p>

    <p>Перечень товаров/материалов:</p>

    <table>
      <thead>
        <tr>
          <th style="width: 7%">№</th>
          <th style="width: 43%">Наименование товара</th>
          <th style="width: 16%">Цена за ед., руб.</th>
          <th style="width: 14%">Объем, м³</th>
          <th style="width: 20%">Итого, руб.</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <strong>Итого к оплате</strong>
        <strong>${formatMoney(grandTotal)} руб.</strong>
      </div>
      <div class="summary-row">
        <span>в т. ч. НДС 20%</span>
        <strong>${formatMoney(vat)} руб.</strong>
      </div>
      <div class="summary-row">
        <strong>Сумма с НДС</strong>
        <strong>${formatMoney(totalWithVat)} руб.</strong>
      </div>
    </div>

    <p>Претензии и замечания фиксируются в соответствии с типом акта.</p>
    <p>Акт составлен в двух экземплярах равной юридической силы, по одному для каждой стороны.</p>

    <div class="signatures">
      <div class="sign-col">
        <div><strong>Поставщик</strong></div>
        <div style="margin-top: 18px;">${supplierName}</div>
        <div class="line">Подпись</div>
        <div class="stamp">М. П.</div>
      </div>

      <div class="sign-col">
        <div><strong>Покупатель</strong></div>
        <div style="margin-top: 18px;">ООО «Роспил»</div>
        <div class="line">Подпись</div>
        <div class="stamp">М. П.</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}