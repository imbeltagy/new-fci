import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const FROM = () => process.env.NODEMAILER_SENDER_EMAIL ?? "noreply@fci.edu";

export const sendPasswordResetEmail = async (
  to: string,
  token: string,
): Promise<void> => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM(),
    to,
    subject: "Password Reset — FCI Platform",
    html: `<p>Click <a href="${url}">here</a> to reset your password. The link expires in 1 hour.</p>`,
  });
};

export const sendCredentialsEmail = async (
  to: string,
  temporaryPassword: string,
): Promise<void> => {
  await transporter.sendMail({
    from: FROM(),
    to,
    subject: "Your FCI Platform Credentials",
    html: `
      <p>Your account has been created on the FCI Platform.</p>
      <p><strong>Email:</strong> ${to}</p>
      <p><strong>Temporary password:</strong> ${temporaryPassword}</p>
      <p>You will be required to change this password on your first login.</p>
    `,
  });
};
