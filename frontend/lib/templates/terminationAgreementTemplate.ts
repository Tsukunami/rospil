type TerminationAgreementParams = {
  city: string;
  agreementDate: string;
  contractNumber: string;
  contractDate: string;
  supplierName: string;
};

export function getTerminationAgreementHtml({
  city,
  agreementDate,
  contractNumber,
  contractDate,
  supplierName,
}: TerminationAgreementParams) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Соглашение о расторжении договора</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }

    body {
      font-family: "Times New Roman", serif;
      color: #000;
      margin: 0;
      padding: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .container {
      width: 100%;
    }

    .title {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 24px;
      text-transform: uppercase;
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

    .section-title {
      margin-top: 28px;
      font-weight: bold;
      text-align: center;
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
      margin-top: 40px;
      border-top: 1px solid #000;
      padding-top: 8px;
    }

    .details {
      margin-top: 30px;
    }

    .details-row {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">
      СОГЛАШЕНИЕ О РАСТОРЖЕНИИ ДОГОВОРА № ${contractNumber}<br />
      ОТ ${contractDate}
    </div>

    <div class="top-row">
      <div>г. ${city}</div>
      <div>${agreementDate}</div>
    </div>

    <p>
      ООО «Роспил», именуемое в дальнейшем «Заказчик», в лице Попова Алексея Олеговича,
      действующего на основании Устава, с одной стороны, и ${supplierName}, именуемый
      в дальнейшем «Исполнитель», с другой стороны, заключили настоящее соглашение
      о нижеследующем:
    </p>

    <p>
      1. Договор № ${contractNumber} от ${contractDate} считать расторгнутым с ${agreementDate}.
    </p>

    <p>
      2. Обязательства сторон по вышеназванному договору прекращаются с момента вступления
      в силу настоящего соглашения.
    </p>

    <p>
      3. Стороны не имеют друг к другу претензий.
    </p>

    <p>
      4. Соглашение составлено в двух подлинных экземплярах, имеющих равную юридическую
      силу, по одному для каждой из Сторон.
    </p>

    <p>
      5. Настоящее Соглашение вступает в силу с момента его подписания уполномоченными
      представителями Сторон.
    </p>

    <div class="section-title">РЕКВИЗИТЫ СТОРОН</div>

    <div class="details">
      <div class="details-row">
        <strong>Реквизиты ИСПОЛНИТЕЛЯ:</strong> ${supplierName}
      </div>
      <div class="details-row">
        <strong>Реквизиты ЗАКАЗЧИКА:</strong> ООО «Роспил»
      </div>
    </div>

    <div class="section-title">ПОДПИСИ СТОРОН</div>

    <div class="signatures">
      <div class="sign-col">
        <div><strong>ИСПОЛНИТЕЛЬ</strong></div>
        <div class="line">${supplierName}</div>
      </div>

      <div class="sign-col">
        <div><strong>ЗАКАЗЧИК</strong></div>
        <div class="line">ООО «Роспил»</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}