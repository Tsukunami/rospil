type DiscrepancyActTemplateParams = {
  actDate: string;
  organizationName: string;
  organizationAddress: string;
  place: string;
  employeeName: string;
  supplierName: string;
  supplierAddress: string;
  contractNumber: string;
  contractDate: string;
  deliveryDate: string;
  productName: string;
  unit: string;
  price: number;
  documentedQuantity: number;
  actualQuantity: number;
  shortageQuantity: number;
  defectQuantity: number;
  discrepancyType: string;
  defectDescription: string;
  documentedSum: number;
  actualSum: number;
  shortageSum: number;
  defectSum: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getDiscrepancyActHtml({
  actDate,
  organizationName,
  organizationAddress,
  place,
  employeeName,
  supplierName,
  supplierAddress,
  contractNumber,
  contractDate,
  deliveryDate,
  productName,
  unit,
  price,
  documentedQuantity,
  actualQuantity,
  shortageQuantity,
  defectQuantity,
  discrepancyType,
  defectDescription,
  documentedSum,
  actualSum,
  shortageSum,
  defectSum,
}: DiscrepancyActTemplateParams) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Акт о расхождении</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }

    body {
      font-family: "Times New Roman", serif;
      color: #000;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.35;
    }

    .title {
      text-align: center;
      font-weight: bold;
      font-size: 20px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .subtitle {
      text-align: center;
      font-weight: bold;
      font-size: 16px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }

    .date-line {
      text-align: center;
      margin-bottom: 18px;
      font-weight: bold;
    }

    p {
      margin: 0 0 8px 0;
    }

    .line {
      display: inline-block;
      min-width: 220px;
      border-bottom: 1px solid #000;
      padding: 0 4px 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
    }

    th, td {
      border: 1px solid #000;
      padding: 6px;
      vertical-align: top;
      text-align: center;
    }

    th {
      font-weight: bold;
    }

    .left {
      text-align: left;
    }

    .signatures {
      margin-top: 30px;
    }

    .sign-line {
      margin-top: 18px;
    }
  </style>
</head>
<body>
  <div class="title">АКТ</div>
  <div class="subtitle">ОБ УСТАНОВЛЕННОМ РАСХОЖДЕНИИ ПРИ ПРИЕМКЕ ТОВАРА</div>
  <div class="date-line">ОТ «${actDate}»</div>

  <p>Наименование организации <span class="line">${organizationName}</span></p>
  <p>Адрес <span class="line">${organizationAddress}</span></p>
  <p>Место составления акта <span class="line">${place}</span></p>
  <p>Комиссия в составе <span class="line">${employeeName}</span></p>
  <p>в присутствии представителя <span class="line">${supplierName}</span></p>

  <p>произвела прием товара и установила:</p>

  <p>1. Наименование и адрес грузоотправителя <span class="line">${supplierName}, ${supplierAddress}</span></p>
  <p>2. Наименование и адрес перевозчика <span class="line">Самовывоз / не указан</span></p>
  <p>3. Договор № <span class="line">${contractNumber}</span> от <span class="line">${contractDate}</span> на поставку продукции.</p>
  <p>4. Товарная накладная / дата поставки: <span class="line">${deliveryDate}</span></p>
  <p>5. Результаты приемки:</p>

  <table>
    <thead>
      <tr>
        <th>№</th>
        <th>Наименование товара</th>
        <th>Ед. изм.</th>
        <th>Цена</th>
        <th>По документам<br/>количество</th>
        <th>По документам<br/>сумма</th>
        <th>Фактически<br/>оказалось количество</th>
        <th>Фактически<br/>сумма</th>
        <th>Недостача<br/>количество</th>
        <th>Недостача<br/>сумма</th>
        <th>Брак / дефект<br/>количество</th>
        <th>Брак / дефект<br/>сумма</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="left">${productName}</td>
        <td>${unit}</td>
        <td>${formatMoney(price)}</td>
        <td>${formatNumber(documentedQuantity)}</td>
        <td>${formatMoney(documentedSum)}</td>
        <td>${formatNumber(actualQuantity)}</td>
        <td>${formatMoney(actualSum)}</td>
        <td>${formatNumber(shortageQuantity)}</td>
        <td>${formatMoney(shortageSum)}</td>
        <td>${formatNumber(defectQuantity)}</td>
        <td>${formatMoney(defectSum)}</td>
      </tr>
    </tbody>
  </table>

  <p><strong>Тип расхождения:</strong> ${discrepancyType || "не указан"}</p>
  <p><strong>Описание дефекта:</strong> ${defectDescription || "не указано"}</p>

  <p>
    По остальным товарам, перечисленным в товарной накладной поставщика,
    расхождений в качестве и количестве нет.
  </p>

  <div class="signatures">
    <p>Члены комиссии:</p>
    <div class="sign-line">______________________________ / ${employeeName}</div>
    <div class="sign-line">______________________________ / Представитель поставщика</div>
  </div>
</body>
</html>
`;
}