const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const message = {
      from: `${process.env.FROM_NAME || 'Influencer Marketplace'} <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Influencer Marketplace',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining our Influencer Marketplace platform.</p>
      <p>You can now start exploring campaigns and connecting with brands/influencers.</p>
    `
  }),

  influencerApproved: (name) => ({
    subject: 'Your Influencer Profile Has Been Approved!',
    html: `
      <h1>Congratulations ${name}!</h1>
      <p>Your influencer profile has been approved and you can now apply to campaigns.</p>
      <p>Start browsing available campaigns and grow your influence!</p>
    `
  }),

  influencerRejected: (name, reason) => ({
    subject: 'Influencer Profile Review Update',
    html: `
      <h1>Hello ${name},</h1>
      <p>Unfortunately, your influencer profile was not approved at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You can update your profile and resubmit for review.</p>
    `
  }),

  campaignApplication: (influencerName, campaignTitle) => ({
    subject: 'New Campaign Application',
    html: `
      <h1>New Application Received</h1>
      <p><strong>${influencerName}</strong> has applied to your campaign: <strong>${campaignTitle}</strong></p>
      <p>Review the application in your dashboard.</p>
    `
  }),

  campaignAccepted: (campaignTitle, brandName) => ({
    subject: 'Campaign Application Accepted!',
    html: `
      <h1>Great News!</h1>
      <p>Your application for <strong>${campaignTitle}</strong> by <strong>${brandName}</strong> has been accepted!</p>
      <p>Check your dashboard for next steps.</p>
    `
  })
};

// Send template email
const sendTemplateEmail = async (email, templateName, data) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const emailContent = template(data);
    await sendEmail({
      email,
      subject: emailContent.subject,
      html: emailContent.html
    });
  } catch (error) {
    console.error('Template email error:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  emailTemplates
};