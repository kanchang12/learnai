import { jsPDF } from 'jspdf';
import { User, UserProgress } from '../types.ts';

export async function generateCertificate(user: User, progress: UserProgress) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(245, 244, 239);
  doc.rect(0, 0, W, H, 'F');

  // Navy Border
  doc.setDrawColor(27, 48, 104);
  doc.setLineWidth(1);
  doc.rect(10, 10, W - 20, H - 20, 'S');

  // Gold Inner Border
  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, W - 24, H - 24, 'S');

  // Header band
  doc.setFillColor(27, 48, 104);
  doc.rect(10, 10, W - 20, 30, 'F');

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('CEAL', 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Certified Enterprise AI Lead', 20, 36);

  doc.setFontSize(8);
  doc.setTextColor(212, 160, 23);
  doc.text('aiwithai.online', W - 40, 36);

  // Main Body
  doc.setTextColor(28, 24, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('This certifies that', W / 2, 70, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text(user.name.toUpperCase(), W / 2, 90, { align: 'center' });

  // Gold Line
  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(1.5);
  doc.line(W / 2 - 60, 95, W / 2 + 60, 95);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('has successfully completed the enterprise simulation for', W / 2, 110, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const title = user.tier === 'foundation' ? 'CEAL Foundation' : user.tier === 'professional' ? 'CEAL Professional' : 'Certified Enterprise AI Lead';
  doc.text(title, W / 2, 125, { align: 'center' });

  // Stats Box
  const scores = Object.values(progress.scores);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  doc.setFillColor(27, 48, 104);
  doc.roundedRect(W / 2 - 40, 140, 80, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`AVERAGE READINESS SCORE: ${avg}/100`, W / 2, 149, { align: 'center' });

  // Footer
  doc.setTextColor(115, 113, 138);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Issued on ${date} • Verification ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, W / 2, 180, { align: 'center' });
  
  doc.text('LOVEUAD LTD • Company No. 16838046', W / 2, 185, { align: 'center' });

  doc.save(`CEAL_Certificate_${user.name.replace(/\s/g, '_')}.pdf`);
}
