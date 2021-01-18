const sendgrid = require("sendgrid");
const helper = sendgrid.mail;
const { sendgridKey } = require("../../config/keys");

class Mailer extends helper.Mail {
  constructor({ subject, recipients }, content) {
    super();

    this.sgApi = sendgrid(sendgridKey);
    this.from_email = new helper.Email("jacobmillerdev@gmail.com");
    this.subject = subject;
    this.body = new helper.Content("application/json", "<div>wow</div>");
    this.recipients = this.formatAddresses(recipients);

    this.addContent(this.body);
    this.addClickTracking();
    this.addRecipients();
  }

  formatAddresses(recipients) {
    return recipients.map(({ email }) => {
      return new helper.Email(email);
    });
  }

  addClickTracking() {
    const trackingSettings = new helper.TrackingSettings();
    const clickTracking = new helper.ClickTracking(true, true);

    trackingSettings.setClickTracking(clickTracking);
    this.addTrackingSettings(trackingSettings);
  }

  addRecipients() {
    const personalize = new helper.Personalization();
    this.recipients.forEach((recipient) => {
      personalize.addTo(recipient);
    });
    this.addPersonalization(personalize);
  }

  async send() {
    const req = this.sgApi.emptyRequest({
      method: "POST",
      path: "/v3/mail/send",
      headers: { Authorization: `Bearer ${sendgridKey}` },
      body: this.toJSON(),
    });
    console.log("ERRRRRRRRRRORS!!!!!!!!!!!!!!!!!!!!!!!;");
    console.log("REQUEST", req);
    const res = await this.sgApi.API(req);
    console.log("-------------------------");
    console.log("RES", res);
    console.log("ERRORS:", res.body.errors);
    return res;
  }
}

module.exports = Mailer;
