import { config } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";

interface DonationConfirmationData {
  donorName: string;
  amount: number;
  isRecurring: boolean;
  frequency?: string;
  allocations: Array<{ name: string; percentage: number; amount: number }>;
  donationId: string;
}

interface ImpactReportNotificationData {
  donorName: string;
  nonprofitName: string;
  reportTitle: string;
  reportSummary: string;
  reportUrl: string;
}

interface ReceiptReadyData {
  donorName: string;
  year: number;
  totalAmount: number;
  downloadUrl: string;
}

export function getDonationConfirmationEmail(data: DonationConfirmationData) {
  const allocationList = data.allocations
    .map((a) => `• ${a.name}: ${formatCurrency(a.amount)} (${a.percentage}%)`)
    .join("\n");

  const frequencyText = data.isRecurring
    ? ` (${data.frequency} recurring donation)`
    : "";

  return {
    subject: `Thank you for your ${formatCurrency(data.amount)} donation${frequencyText}`,
    text: `
Dear ${data.donorName},

Thank you for your generous donation of ${formatCurrency(data.amount)}${frequencyText} through ${config.appName}!

Your donation will be distributed as follows:
${allocationList}

Donation ID: ${data.donationId}

${data.isRecurring ? "Your recurring donation will be processed automatically according to your selected frequency. You can manage your subscription anytime from your dashboard." : ""}

You'll receive a tax receipt for this donation. All donations made through ${config.appName} are tax-deductible to the extent allowed by law.

Thank you for making a difference!

Best regards,
The ${config.appName} Team

---
${config.appName}
${config.description}
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .amount { font-size: 32px; font-weight: bold; color: #1d4ed8; }
    .allocations { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .allocation-item { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .allocation-item:last-child { border-bottom: none; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-radius: 0 0 12px 12px; }
    .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Thank You!</h1>
      <p style="margin: 0; opacity: 0.9;">Your donation makes a difference</p>
    </div>
    <div class="content">
      <p>Dear ${data.donorName},</p>
      <p>Thank you for your generous donation through ${config.appName}!</p>

      <div style="text-align: center; margin: 30px 0;">
        <div class="amount">${formatCurrency(data.amount)}</div>
        ${data.isRecurring ? `<span class="badge">${data.frequency} recurring</span>` : ""}
      </div>

      <div class="allocations">
        <h3 style="margin-top: 0;">Your allocation:</h3>
        ${data.allocations.map((a) => `
          <div class="allocation-item">
            <strong>${a.name}</strong><br>
            <span style="color: #64748b;">${formatCurrency(a.amount)} (${a.percentage}%)</span>
          </div>
        `).join("")}
      </div>

      <p style="font-size: 14px; color: #64748b;">
        Donation ID: ${data.donationId}
      </p>

      ${data.isRecurring ? "<p>Your recurring donation will be processed automatically. You can manage your subscription anytime from your dashboard.</p>" : ""}

      <p>You'll receive a tax receipt for this donation. All donations are tax-deductible to the extent allowed by law.</p>

      <p>Thank you for making a difference!</p>

      <p>Best regards,<br>The ${config.appName} Team</p>
    </div>
    <div class="footer">
      <p>${config.appName} • ${config.description}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function getImpactReportNotificationEmail(data: ImpactReportNotificationData) {
  return {
    subject: `New impact update from ${data.nonprofitName}`,
    text: `
Dear ${data.donorName},

Great news! ${data.nonprofitName} has shared a new impact report:

"${data.reportTitle}"

${data.reportSummary}

View the full report: ${data.reportUrl}

Thank you for your continued support!

Best regards,
The ${config.appName} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .report-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
    .button { display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Impact Update</h1>
      <p style="margin: 0; opacity: 0.9;">See the difference you're making</p>
    </div>
    <div class="content">
      <p>Dear ${data.donorName},</p>
      <p>Great news! <strong>${data.nonprofitName}</strong> has shared a new impact report:</p>

      <div class="report-card">
        <h3 style="margin-top: 0;">${data.reportTitle}</h3>
        <p style="margin-bottom: 0;">${data.reportSummary}</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.reportUrl}" class="button">View Full Report</a>
      </p>

      <p>Thank you for your continued support!</p>

      <p>Best regards,<br>The ${config.appName} Team</p>
    </div>
    <div class="footer">
      <p>${config.appName} • ${config.description}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function getReceiptReadyEmail(data: ReceiptReadyData) {
  return {
    subject: `Your ${data.year} tax receipt is ready`,
    text: `
Dear ${data.donorName},

Your ${data.year} tax receipt is now available for download.

Total donations: ${formatCurrency(data.totalAmount)}

Download your receipt: ${data.downloadUrl}

This receipt includes all donations made through ${config.appName} during ${data.year}. Please consult with your tax advisor for guidance on claiming charitable deductions.

Thank you for your generosity!

Best regards,
The ${config.appName} Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7c3aed; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
    .amount { font-size: 32px; font-weight: bold; color: #7c3aed; text-align: center; margin: 20px 0; }
    .button { display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">Tax Receipt Ready</h1>
      <p style="margin: 0; opacity: 0.9;">Your ${data.year} donation summary</p>
    </div>
    <div class="content">
      <p>Dear ${data.donorName},</p>
      <p>Your ${data.year} tax receipt is now available for download.</p>

      <div class="amount">${formatCurrency(data.totalAmount)}</div>
      <p style="text-align: center; color: #64748b;">Total ${data.year} donations</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${data.downloadUrl}" class="button">Download Receipt</a>
      </p>

      <p style="font-size: 14px; color: #64748b;">
        This receipt includes all donations made through ${config.appName} during ${data.year}.
        Please consult with your tax advisor for guidance on claiming charitable deductions.
      </p>

      <p>Thank you for your generosity!</p>

      <p>Best regards,<br>The ${config.appName} Team</p>
    </div>
    <div class="footer">
      <p>${config.appName} • ${config.description}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
