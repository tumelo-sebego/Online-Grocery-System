const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter using Ethereal for testing
  // In production, you would use a real email service like SendGrid, Mailgun, etc.
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'maddison53@ethereal.email',
      pass: 'jn7jnAPss4f63QBp6D',
    },
  });

  const mailOptions = {
    from: '"WeDeliver" <no-reply@wedeliver.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log('Message sent: %s', info.messageId);
  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
