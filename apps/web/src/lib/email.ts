type DriverCredentialsEmail = {
  to: string;
  driverName: string;
  ownerName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

export async function sendDriverCredentialsEmail(payload: DriverCredentialsEmail): Promise<void> {
  const subject = "Your CarryMe driver account is ready";
  const body = [
    `Hi ${payload.driverName},`,
    "",
    `${payload.ownerName} added you as a driver on CarryMe.`,
    "",
    "Sign in with:",
    `  Email: ${payload.email}`,
    `  Temporary password: ${payload.temporaryPassword}`,
    "",
    `Login here: ${payload.loginUrl}`,
    "",
    "Change your password after your first sign-in for security.",
    "",
    "— CarryMe",
  ].join("\n");

  if (process.env.SMTP_HOST) {
    // Production hook — wire to your SMTP provider when ready.
    console.info("[email] SMTP not implemented yet; would send to", payload.to);
  }

  console.info("[carryme-email]", { to: payload.to, subject, body });
}
