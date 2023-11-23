/* eslint-disable */
const nodemailer = require('nodemailer');
const pug = require('pug');
const { cover } = require('html-to-text');
// import { htmlToText } from 'html-to-text';
// new Email(user, url).sendWelcome();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = 'xmuedujason@hotmail.com';
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: 'b65348d796295e',
        pass: '6c3fe120e198d4',
      },
      // Activate "less secure app" option in case of gmail
    });
  }

  // send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject: subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: cover(html),
    };

    // 3) Create a transport and send email
    // await transporter.sendMail(mailOptions); // returns promise
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token(valid for only 10 minutes)',
    );
  }
};
