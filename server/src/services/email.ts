import transporter from '../config/email';

interface EnquiryEmailData {
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  equipmentType?: string;
  equipmentValue?: number;
  termMonths?: number;
  monthlyPayment?: number;
  countryName?: string;
  message?: string;
  vendorName?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEnquiryHtml(data: EnquiryEmailData): string {
  // Escape all user-supplied values to prevent HTML injection
  const safe = {
    contactName: escapeHtml(data.contactName),
    companyName: escapeHtml(data.companyName),
    email: escapeHtml(data.email),
    phone: data.phone ? escapeHtml(data.phone) : undefined,
    equipmentType: data.equipmentType ? escapeHtml(data.equipmentType) : undefined,
    countryName: data.countryName ? escapeHtml(data.countryName) : undefined,
    message: data.message ? escapeHtml(data.message) : undefined,
    vendorName: data.vendorName ? escapeHtml(data.vendorName) : undefined,
  };
  return `
    <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c2c2c;">New Leasing Enquiry</h2>
      ${safe.vendorName ? `<p style="color: #3c5a77;">Via vendor calculator: <strong>${safe.vendorName}</strong></p>` : ''}

      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Contact Name</td>
          <td style="padding: 8px 0;">${safe.contactName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Company</td>
          <td style="padding: 8px 0;">${safe.companyName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${safe.email}">${safe.email}</a></td>
        </tr>
        ${safe.phone ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Phone</td>
          <td style="padding: 8px 0;">${safe.phone}</td>
        </tr>` : ''}
        ${safe.countryName ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Country</td>
          <td style="padding: 8px 0;">${safe.countryName}</td>
        </tr>` : ''}
        ${safe.equipmentType ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Equipment Type</td>
          <td style="padding: 8px 0;">${safe.equipmentType}</td>
        </tr>` : ''}
        ${data.equipmentValue ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Equipment Value</td>
          <td style="padding: 8px 0;">&euro;${data.equipmentValue.toLocaleString()}</td>
        </tr>` : ''}
        ${data.termMonths ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Lease Term</td>
          <td style="padding: 8px 0;">${data.termMonths} months</td>
        </tr>` : ''}
        ${data.monthlyPayment ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Est. Monthly Payment</td>
          <td style="padding: 8px 0;">&euro;${data.monthlyPayment.toLocaleString()}</td>
        </tr>` : ''}
      </table>

      ${safe.message ? `<h3 style="color: #2c2c2c;">Message</h3><p style="color: #3c5a77;">${safe.message}</p>` : ''}

      <hr style="border: none; border-top: 1px solid #dce3eb; margin: 1.5rem 0;" />
      <p style="color: #8a9bb5; font-size: 12px;">
        Sent from the Oaklease European Leasing Calculator<br />
        &copy; Oaklease Ltd 2026
      </p>
    </div>
  `;
}

export async function sendEnquiryEmail(
  recipients: string[],
  data: EnquiryEmailData,
): Promise<boolean> {
  const fromAddress = process.env.EMAIL_FROM || 'enquiries@oaklease.co.uk';

  // Skip sending if SMTP is not configured (dev environment)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('Email skipped (SMTP not configured): enquiry notification to', recipients.length, 'recipients');
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Oaklease Leasing Calculator" <${fromAddress}>`,
      to: recipients.join(', '),
      subject: `Leasing Enquiry: ${data.companyName} — ${data.contactName}`,
      html: buildEnquiryHtml(data),
    });
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send enquiry email:', message);
    return false;
  }
}
