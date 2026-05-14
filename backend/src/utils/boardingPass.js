const moment = require('moment');
const htmlToPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const logoPath = path.join(__dirname, '../assets/logo.png');
const frassiLogo = fs.readFileSync(logoPath, 'base64');

async function generateBoardingPass(codeReservation, passengers, startDate, title, qrText) {
  let qrDataUrl = null;
  const size = 150;
  if (qrText) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrText, {
        type: 'image/png',
        margin: 1,
        width: size,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      qrDataUrl = null;
    }
  }

  const boardingPassesHtml = passengers.map((p) => {
    const qrHtml = qrDataUrl
      ? `<div class="barcode"><img class="qr" src="${qrDataUrl}" alt="QR code" /></div>`
      : '<div class="barcode"></div>';
    return `
  <section class="ticket">
    <header class="ticket-header">
      <div class="brand">
        <img src="data:image/png;base64,${frassiLogo}" alt="Frassi Aviation Tours" class="brand-logo" />
      </div>
      <div class="ticket-meta">
        <div class="ticket-title">BOARDING PASS</div>
        <div class="ticket-subtitle">Reservation #${codeReservation}</div>
      </div>
    </header>

    <div class="ticket-body">
      <div class="ticket-main">
        <div class="row">
          <div class="label">Passenger</div>
          <div class="value">${p.lastname}, ${p.name}</div>
        </div>

        <div class="row">
          <div class="label">Experience</div>
          <div class="value">${title}</div>
        </div>

        <div class="row">
          <div class="label">Date</div>
          <div class="value">${moment(startDate).format('MMMM DD, YYYY')}</div>
        </div>

        <div class="row">
          <div class="label">Time</div>
          <div class="value">${moment(startDate).format('HH:mm')}</div>
        </div>

      </div>

        <aside class="ticket-stub">

        ${qrHtml}

        <div class="stub-footer">Show this QR code at check-in.</div>
      </aside>
    </div>

    <footer class="ticket-footer">
      <div class="footer-text">Frassi Aviation Tours · Miami, FL</div>
    </footer>
  </section>
`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          :root {
            --bg: #ffffff;
            --card: #ffffff;
            --border: #e2e8f0;
            --text: #0f172a;
            --muted: #64748b;
            --primary: white;
            --accent: #fc088b;
            --shadow: rgba(15, 23, 42, 0.12);
          }

          html,
          body {
            margin-left: 0;
            padding: 0;
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
              Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
          }

          .ticket {
            max-width: 600px;
            margin: 40px auto;
            background: var(--card);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid var(--border);
            box-shadow: 0 10px 20px var(--shadow);
              page-break-after: always;
  break-after: page;
          }

          .ticket:last-child {
  page-break-after: auto;
  break-after: auto;
}

          .ticket-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 20px;
            background: linear-gradient(150deg, var(--primary), var(--accent));
            color: #fff;
          }

          .brand-logo {
            height: 42px;
            width: auto;
            object-fit: contain;
          }

          .ticket-title {
            font-size: 14px;
            text-transform: uppercase;
            font-weight: 800;
          }

          .ticket-subtitle {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 4px;
          }

          .ticket-body {
            display: table;
            width: 100%;
          }

          .ticket-main {
            display: table-cell;
            width: 65%;
            vertical-align: top;
            padding: 20px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px 0;
            border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          }

          .row:last-child {
            border-bottom: none;
          }

          .label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--muted);
            width: 40%;
          }

          .value {
            font-size: 12px;
            font-weight: 700;
            width: 58%;
            text-align: right;
            color: var(--text);
          }

          .ticket-stub {
            display: table-cell;
            width: 35%;
            vertical-align: top;
            border-left: 2px dashed #cbd5e1;
          }

          .barcode {
            display: flex;
            justify-content: center;
            margin: 20px;
            overflow: hidden;
            max-width: 100%;
          }

          .barcode img {
            max-height: 100%;
            max-width: 100%;
            display: block;
            object-fit: contain;
          }

          .stub-footer {
            margin-top: 14px;
            font-size: 8px;
            color: var(--muted);
            text-align: center;
            padding: 10px 0;
          }

          .ticket-footer {
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
            border-top: 1px solid rgba(226, 232, 240, 0.9);
            background: rgba(245, 247, 251, 0.8);
          }

          .footer-text {
            font-size: 8px;
            color: var(--muted);
            letter-spacing: 0.03em;
          }

          .qr {
            max-width: 100% !important;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${boardingPassesHtml}
      </body>
    </html>
  `;

  const file = { content: html };

  const options = {
    format: 'A4',
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '2mm'
    },
    printBackground: true
  };

  const pdfBuffer = await htmlToPdf.generatePdf(file, options);
  return pdfBuffer;
}

module.exports = { generateBoardingPass };
