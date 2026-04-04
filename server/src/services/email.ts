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

function buildEnquiryHtml(data: EnquiryEmailData): string {
  return `
    <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c2c2c;">New Leasing Enquiry</h2>
      ${data.vendorName ? `<p style="color: #3c5a77;">Via vendor calculator: <strong>${data.vendorName}</strong></p>` : ''}

      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Contact Name</td>
          <td style="padding: 8px 0;">${data.contactName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Company</td>
          <td style="padding: 8px 0;">${data.companyName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${data.email}">${data.email}</a></td>
        </tr>
        ${data.phone ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Phone</td>
          <td style="padding: 8px 0;">${data.phone}</td>
        </tr>` : ''}
        ${data.countryName ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Country</td>
          <td style="padding: 8px 0;">${data.countryName}</td>
        </tr>` : ''}
        ${data.equipmentType ? `<tr style="border-bottom: 1px solid #dce3eb;">
          <td style="padding: 8px 0; color: #3c5a77; font-weight: 600;">Equipment Type</td>
          <td style="padding: 8px 0;">${data.equipmentType}</td>
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

      ${data.message ? `<h3 style="color: #2c2c2c;">Message</h3><p style="color: #3c5a77;">${data.message}</p>` : ''}

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
    console.log('Email skipped (SMTP not configured):', {
      to: recipients.join(', '),
      subject: `Leasing Enquiry: ${data.companyName}`,
    });
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
  } catch (err) {
    console.error('Failed to send enquiry email:', err);
    return false;
  }
}
