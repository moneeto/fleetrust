const moment = require('moment');
const htmlToPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const templatePath = path.resolve(__dirname, '../../../frontend/public/images/ticketplantilla.jpeg');
const ticketTemplate = fs.readFileSync(templatePath, 'base64');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function passengerFullName(passenger) {
  return [passenger?.name, passenger?.lastname || passenger?.lastName].filter(Boolean).join(' ').trim();
}

async function generateBoardingPass(codeReservation, passengers, startDate, title, qrText, passengerCount) {
  let qrDataUrl = null;
  const size = 220;
  if (qrText) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrText, {
        type: 'image/png',
        margin: 0,
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

  const formattedDate = moment(startDate).format('MM/DD/YYYY');
  const formattedTime = moment(startDate).format('HH:mm');
  const totalPassengers = passengerCount || passengers.length;
  const safeCodeReservation = escapeHtml(codeReservation);
  const safeTitle = escapeHtml(title);
  const safeDate = escapeHtml(formattedDate);
  const safeTime = escapeHtml(formattedTime);
  const safePassengerCount = escapeHtml(totalPassengers);

  const boardingPassesHtml = passengers.map((p) => {
    const passengerName = escapeHtml(passengerFullName(p));
    const qrHtml = qrDataUrl
      ? `<img class="qr" src="${qrDataUrl}" alt="QR code" />`
      : '';

    return `
  <section class="ticket">
    <div class="field main-passenger">${passengerName}</div>
    <div class="field main-flight-number">${safeCodeReservation}</div>
    <div class="field main-flight-type">${safeTitle}</div>
    <div class="field main-date">${safeDate}</div>
    <div class="field main-departure-time">${safeTime}</div>
    <div class="field main-passenger-count">${safePassengerCount}</div>

    <div class="field stub-date">${safeDate}</div>
    <div class="field stub-departure-time">${safeTime}</div>
    <div class="field stub-flight-number">${safeCodeReservation}</div>
    <div class="field stub-passenger">${passengerName}</div>
    <div class="qr-box">${qrHtml}</div>
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
          @page {
            size: 1536px 1024px;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
          }

          .ticket {
            width: 1536px;
            height: 1024px;
            position: relative;
            overflow: hidden;
            background-image: url("data:image/jpeg;base64,${ticketTemplate}");
            background-repeat: no-repeat;
            background-size: 1536px 1024px;
            page-break-after: always;
            break-after: page;
          }

          .ticket:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .field {
            position: absolute;
            color: #111111;
            font-size: 23px;
            font-weight: 400;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .main-passenger { left: 222px; top: 331px; width: 285px; }
          .main-flight-number { left: 544px; top: 331px; width: 290px; }
          .main-flight-type { left: 222px; top: 437px; width: 285px; }
          .main-date { left: 544px; top: 437px; width: 290px; }
          .main-departure-time { left: 222px; top: 543px; width: 285px; }
          .main-passenger-count { left: 544px; top: 543px; width: 290px; }

          .stub-date,
          .stub-departure-time,
          .stub-flight-number,
          .stub-passenger {
            left: 1174px;
            width: 270px;
            font-size: 21px;
          }

          .stub-date { top: 271px; }
          .stub-departure-time { top: 359px; }
          .stub-flight-number { top: 449px; }
          .stub-passenger { top: 539px; }

          .qr-box {
            position: absolute;
            left: 1192px;
            top: 585px;
            width: 212px;
            height: 203px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr {
            margin: 0;
            width: 190px;
            height: 190px;
            display: block;
            object-fit: contain;
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
    width: '1536px',
    height: '1024px',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true
  };

  return htmlToPdf.generatePdf(file, options);
}

module.exports = { generateBoardingPass };
