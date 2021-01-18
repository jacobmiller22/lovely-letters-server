const sendgrid = require("sendgrid");
const { sendgridKey } = require("../../config/keys");
const axios = require("axios");

class Mailer2 {
  constructor({ recipients, subject, template_id, dynamic_template_data }) {
    this.recipients = this.addRecipients(recipients);
    this.subject = subject;
    this.template_id = template_id;
    this.dynamic_template_data = dynamic_template_data;
  }

  async send() {
    const sg = axios.create({
      baseURL: "https://api.sendgrid.com",
      headers: this.createHeaders(),
    });

    const res = await sg.post(
      "/v3/mail/send",
      JSON.stringify(this.createBody())
    );
  }

  createHeaders() {
    return {
      Authorization: `Bearer ${sendgridKey}`,
      "Content-Type": "application/json",
    };
  }

  createBody() {
    return {
      personalizations: [
        {
          to: [
            {
              email: "jacobmiller22@vt.edu",
            },
          ],
          dynamic_template_data: this.dynamic_template_data,
          subject: this.subject,
        },
      ],
      from: {
        email: "jacobmillerdev@gmail.com",
        name: "Lovely Letters",
      },
      template_id: this.template_id,
    };
  }

  addRecipients(recipients) {
    return recipients.map(({ email }) => {
      return email;
    });
  }
}

module.exports = Mailer2;
