const nodemailer = require('nodemailer');

let transportPromise = null;

const getTransport = async () => {
  // Si ya existe, reutiliza
  if (transportPromise) return transportPromise;

  // Si hay credenciales reales, usa service
  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    const t = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    transportPromise = Promise.resolve(t);
    return transportPromise;
  }

  // Si NO hay credenciales, usa Ethereal (test)
  transportPromise = nodemailer.createTestAccount().then((testAccount) => {
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  });

  return transportPromise;
};

const sendMail = async ({ to, subject, html }) => {
  const transport = await getTransport();

  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || 'Ecommerce <no-reply@ecommerce.test>',
    to,
    subject,
    html,
  });

  // ✅ Si es Ethereal, esto te da un link para ver el mail
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return { info, previewUrl };
};

module.exports = { sendMail };
