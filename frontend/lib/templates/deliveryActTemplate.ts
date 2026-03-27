type DeliveryActTemplateParams = {
  city: string;
  actDate: string;
  contractDate: string;
  contractNumber: string;
  supplierName: string;
  productName: string;
  price: number;
  scope: number;
  total: number;
  vat: number;
  totalWithVat: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getDeliveryActHtml({
  city,
  actDate,
  contractDate,
  contractNumber,
  supplierName,
  productName,
  price,
  scope,
  total,
  vat,
  totalWithVat,
}: DeliveryActTemplateParams) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Акт приема-передачи товара</title>
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
      margin-bottom: 30px;
    }

    .top-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
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
      width: 320px;
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
    <div class="title">Акт приема-передачи товара</div>

    <div class="top-row">
      <div>г. ${city}</div>
      <div>${actDate}</div>
    </div>

    <p>
      ${supplierName} (далее — Продавец), с одной стороны, и ООО «Роспил»
      (далее — Покупатель), в лице Попова Алексея Олеговича, действующего
      на основании Устава, с другой стороны подписали акт к договору
      от ${contractDate} № ${contractNumber} (далее — Договор) о нижеследующем.
    </p>

    <p>1. Продавец передал, а Покупатель принял товары:</p>

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
        <tr>
          <td style="text-align:center;">1</td>
          <td>${productName}</td>
          <td style="text-align:right;">${formatMoney(price)}</td>
          <td style="text-align:right;">${formatMoney(scope)}</td>
          <td style="text-align:right;">${formatMoney(total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <strong>Итого к оплате</strong>
        <strong>${formatMoney(total)} руб.</strong>
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

    <p>2. У Покупателя нет претензий к состоянию товаров.</p>
    <p>3. Акт составлен в двух экземплярах равной юридической силы, по одному каждой стороне.</p>

    <div class="signatures">
      <div class="sign-col">
        <div><strong>Продавец</strong></div>
        <div style="margin-top: 18px;">${supplierName}</div>
        <div class="line">Подпись</div>
        <div class="stamp">М. П.</div>
      </div>

      <div class="sign-col">
        <div><strong>Покупатель</strong></div>
        <div style="margin-top: 18px;">Генеральный директор ООО «Роспил»</div>
        <div class="line">Попов А. О.</div>
        <div class="stamp">М. П.</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}