const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const { generateBoardingPass } = require('./boardingPass');
const moment = require('moment');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const mailPort = Number(process.env.MAILER_PORT) || 587;
  const isSecure = mailPort === 465;
  const password = String(process.env.MAILER_ADMIN_PASSWORD || '').replace(/^"|"$/g, '');

  transporter = nodemailer.createTransport(
    smtpTransport({
      host: process.env.MAILER_HOST,
      port: mailPort,
      secure: isSecure,
      requireTLS: !isSecure,
      auth: {
        user: process.env.MAILER_ADMIN,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  );

  transporter.verify()
    .then(() => console.log('SMTP OK.'))
    .catch((err) => console.log('Error al intentar conectar al servidor smtp.', err));

  return transporter;
}

async function sendBookingDetails(mailOptions) {
  let { codeReservation, email, passengers, passengerCount, startDate, title, confirmationHash } = mailOptions;
  const frassiLogo = (process.env.FRONTEND_URL || 'https://frassitours.com') + '/logo.png';

  if (!process.env.MAILER_HOST || !process.env.MAILER_ADMIN) {
    throw new Error('Mailer is not configured (MAILER_HOST / MAILER_ADMIN).');
  }

  const attachment = await generateBoardingPass(
    codeReservation,
    passengers,
    startDate,
    title,
    confirmationHash,
    passengerCount
  );

  await getTransporter().sendMail({
    from: `"Frassi Tours" <${process.env.MAILER_ADMIN}>`,
    to: email,
    replyTo: process.env.MAILER_ADMIN,
    subject: `Booking Confirmed! - #${codeReservation}`,
    html: `
    <div style="background-color: #f4f7f9; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <div style="padding: 30px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
          <img src="${frassiLogo}" style="width: 240px; height: auto; margin-bottom: 5px;" alt="Frassi Aviation Tours">
        </div>

        <div style="padding: 40px;">
          <h2 style="color: #333; font-size: 24px; margin-top: 0; text-align: center;">Your flight is confirmed!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; text-align: center;">
            Get ready for an unforgettable experience. Your booking details are listed below:
          </p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #fc088b; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Reservation number:</strong> #${codeReservation}</p>
            <p style="margin: 0 0 10px 0;"><strong>Passengers:</strong> ${passengers.length || passengerCount || 0}</p>
            <p style="margin: 0 0 10px 0;"><strong>Date & Time:</strong> ${moment(startDate).format('MMMM DD, YYYY')} at ${moment(startDate).format('HH:mm')}</p>
            <p style="margin: 0;"><strong>Status:</strong> <span style="color : #28a745; font-weight: bold;">Confirmed & Paid</span></p>
          </div>

          <div style="margin-top: 30px;">
            <h3 style="color: #333; font-size: 18px;">Important Information</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.6; padding-left: 20px;">
              <li><strong>Tickets:</strong> Your boarding passes are attached to this email. Please bring them with you to the airport, so our staff can validate your reservation before boarding.</li>
              <li><strong>Weather Conditions:</strong> Safety is our priority. In case of adverse weather, we will contact you to reschedule your flight.</li>
              <li><strong>Changes & Cancellations:</strong> If you need to change your schedule or request a refund, please contact us at least 24 hours in advance.</li>
              <li><strong>Arrival:</strong> Please arrive 15 minutes before your scheduled flight time.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 35px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Need help or want to make changes?</p>
            <a href="mailto:${process.env.MAILER_ADMIN}" style="background-color: #fc088b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Email Us</a>
          </div>
        </div>

        <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;">
          <p style="color: #999; font-size: 12px; line-height: 1.4; margin: 0;">
            This is an automated confirmation of your booking.<br>
            <strong>Frassi Aviation Tours</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #bbb; font-size: 11px;">
        &copy; ${new Date().getFullYear()} Frassi Aviation Tours. All rights reserved.
      </div>
    </div>
  `,
    attachments: [
      {
        filename: `boarding_pass_${codeReservation}.pdf`,
        content: attachment,
        contentType: 'application/pdf',
      },
    ],
  });
  console.log(`Booking details email sent to ${email} for reservation #${codeReservation}`);
}

module.exports = {
  sendBookingDetails,
};
