import nodemailer from 'nodemailer';

/**
 * Send an email report when a new user registers.
 * @param {Object} userData - Details of the registered user.
 */
export async function sendRegistrationReport(userData) {
  const { name, email, orgName, ipAddress, ipLocation, ipLat, ipLon } = userData;

  // Basic validation - check if SMTP settings exist
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP settings not configured. Skipping registration report email.');
    return;
  }

  const destination = process.env.EMAIL_REPORT_DEST || process.env.SMTP_USER;

  // Configure transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"QueuePro System" <${process.env.SMTP_USER}>`,
    to: destination,
    subject: `🔔 Registrasi Baru: ${name} (${orgName})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #4f46e5;">Laporan Registrasi Baru</h2>
        <p>Ada pengguna baru yang baru saja mendaftar di QueuePro:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Nama Pengguna</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Nama Organisasi</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${orgName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Alamat IP</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${ipAddress || 'Unknown'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Lokasi (Estimasi)</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${ipLocation || 'Unknown'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Koordinat</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              ${ipLat && ipLon ? `Lat: ${ipLat}, Lon: ${ipLon}` : 'Tidak tersedia'}
            </td>
          </tr>
        </table>

        ${ipLat && ipLon ? `
        <div style="margin-top: 20px;">
          <a href="https://www.google.com/maps/search/?api=1&query=${ipLat},${ipLon}" 
             style="background-color: #4f46e5; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">
             Lihat di Google Maps
          </a>
        </div>` : ''}
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          Email ini dikirim otomatis oleh sistem QueuePro.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration report sent to ${destination}`);
  } catch (error) {
    console.error('❌ Failed to send registration report:', error);
  }
}
