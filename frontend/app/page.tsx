export default function HomePage() {
  return (
    <div
      style={{
        maxWidth: "1100px",
        color: "#1f1f1f",
      }}
    >
      <section
        style={{
          background: "#f3eedf",
          border: "1px solid #8d8d8d",
          borderRadius: "12px",
          padding: "28px",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "32px",
            lineHeight: 1.2,
          }}
        >
          Добро пожаловать в систему «Роспил»
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "16px",
            lineHeight: 1.7,
            maxWidth: "900px",
          }}
        >
          Это внутренняя информационная система для работы с поставщиками,
          договорами, поставками сырья, расчетами, складскими остатками и
          аналитикой. Сайт позволяет быстро получать доступ к данным по
          закупкам, контролировать движение сырья и отслеживать состояние
          ключевых бизнес-процессов.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background: "#f3eedf",
            border: "1px solid #8d8d8d",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: "22px" }}>
            Что есть на сайте
          </h2>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
            <li>выбор поставщиков по видам древесины;</li>
            <li>раздел заключения договоров;</li>
            <li>учет поставки и приемки сырья;</li>
            <li>расчеты с поставщиками;</li>
            <li>склад с остатками по древесине;</li>
            <li>раздел статистики и аналитики.</li>
          </ul>
        </div>

        <div
          style={{
            background: "#f3eedf",
            border: "1px solid #8d8d8d",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: "22px" }}>
            Что можно делать
          </h2>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
            <li>искать поставщиков по материалам и названию компании;</li>
            <li>просматривать документы и договоры;</li>
            <li>создавать и удалять записи в рабочих разделах;</li>
            <li>следить за поставками и остатками на складе;</li>
            <li>анализировать показатели через графики.</li>
          </ul>
        </div>

        <div
          style={{
            background: "#f3eedf",
            border: "1px solid #8d8d8d",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2 style={{ margin: "0 0 12px", fontSize: "22px" }}>
            Доступ и роли
          </h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Функциональность сайта зависит от роли пользователя. После входа в
            систему в боковом меню отображаются только те разделы, к которым у
            пользователя есть доступ.
          </p>
        </div>
      </section>

      <section
        style={{
          background: "#f3eedf",
          border: "1px solid #8d8d8d",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: "24px",
          }}
        >
          Основные разделы системы
        </h2>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          <div>
            <strong>Выбор поставщиков</strong> — поиск поставщиков по типу
            древесины и по названию компании, просмотр контактных данных и
            стоимости материалов.
          </div>

          <div>
            <strong>Заключение договоров</strong> — работа со списком договоров,
            поиск документов и создание новых записей.
          </div>

          <div>
            <strong>Поставка и приемка сырья</strong> — контроль поступления
            материалов, просмотр поставок по документам, поставщикам и видам
            древесины.
          </div>

          <div>
            <strong>Расчеты с поставщиками</strong> — учет расчетных документов,
            контроль статусов и работа с платежной документацией.
          </div>

          <div>
            <strong>Склад</strong> — просмотр текущих остатков древесины,
            распределения по ячейкам хранения и быстрый переход к поиску
            поставщиков по нужному материалу.
          </div>

          <div>
            <strong>Статистика</strong> — графики и аналитика по заказам,
            документообороту, договорам, расходу материала и доходу.
          </div>
        </div>
      </section>
    </div>
  );
}