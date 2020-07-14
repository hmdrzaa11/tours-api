let nodemailer = require("nodemailer");

let sendEmail = async (options) => {
  //1- we need to create a transporter
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //2- define the email options
  let mailOptions = {
    from: "Natours <natours@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };
  //3-send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
