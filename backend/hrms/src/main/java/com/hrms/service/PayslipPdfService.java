package com.hrms.service;

import com.hrms.entity.Payslip;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Builds the employee payslip PDF - white background, bordered tables,
 * company letterhead (logo + address) at the top. Matches the formal
 * salary-statement template style.
 */
@Service
public class PayslipPdfService {

    // ---- Company letterhead details - EDIT THESE for your company ----
    private static final String COMPANY_NAME = "SAITEJA INFOTECH PRIVATE LIMITED";
    private static final String[] COMPANY_ADDRESS_LINES = {
            "#21-04-24,",
            "GOVINDA NAGAR, TIRUPATI,",
            "CHITTOR, AP 517501",
            "PHONE NO: 9686617096"
    };
    // Optional logo: place a file at src/main/resources/static/logo.png
    // If it isn't there, the logo is simply skipped (no error).

    private static final String[] MONTHS = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
    };

    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float MARGIN = 36f;

    private static final Color BLACK = Color.BLACK;
    private static final Color GRAY = new Color(90, 90, 90);
    private static final Color GREEN = new Color(22, 163, 74);

    private final PDType1Font FONT_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private final PDType1Font FONT_REG = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

    public byte[] generatePayslipPdf(Payslip p) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.setStrokingColor(BLACK);
                cs.setNonStrokingColor(BLACK);

                float pageLeft = MARGIN;
                float pageRight = PAGE_WIDTH - MARGIN;
                float y = PAGE_HEIGHT - MARGIN;

                // ---------------- Letterhead ----------------
                float logoSize = 60f;
                boolean hasLogo = false;
                try {
                    PDImageXObject logo = PDImageXObject.createFromFile(
                            new ClassPathResource("static/logo.png").getFile().getAbsolutePath(), doc);
                    cs.drawImage(logo, pageLeft, y - logoSize, logoSize, logoSize);
                    hasLogo = true;
                } catch (Exception ignored) {
                    // No logo bundled - skip silently
                }

                float textX = hasLogo ? pageLeft + logoSize + 14 : pageLeft;
                float lineY = y - 12;
                drawText(cs, FONT_BOLD, 12, BLACK, textX, lineY, COMPANY_NAME);
                lineY -= 13;
                for (String line : COMPANY_ADDRESS_LINES) {
                    drawText(cs, FONT_REG, 9, GRAY, textX, lineY, line);
                    lineY -= 12;
                }

                // Title, top-right
                int monthIndex = p.getMonth() - 1;
                if (monthIndex < 0 || monthIndex > 11)
                    monthIndex = 0;
                String title = "Salary statement for " + MONTHS[monthIndex] + " " + p.getYear();
                float titleWidth = FONT_BOLD.getStringWidth(title) / 1000f * 14f;
                drawText(cs, FONT_BOLD, 14, BLACK, pageRight - titleWidth, y - 12, title);

                y -= (logoSize + 20);

                // ---------------- Employee info box ----------------
                float infoBoxTop = y;
                float colGap = (pageRight - pageLeft) / 2;
                float leftLabelX = pageLeft + 6;
                float leftValueX = pageLeft + 80;
                float rightLabelX = pageLeft + colGap + 6;
                float rightValueX = pageLeft + colGap + 90;
                float rowH = 18f;
                int infoRows = 5;

                String employeeName = p.getEmployee() != null
                        ? (p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName())
                        : "-";
                String employeeCode = p.getEmployee() != null ? p.getEmployee().getEmployeeId() : "-";
                String designation = p.getEmployee() != null ? p.getEmployee().getDesignation() : "-";
                String department = p.getEmployee() != null ? nullSafe(p.getEmployee().getDepartment()) : "-";
                String phone = p.getEmployee() != null ? nullSafe(p.getEmployee().getPhone()) : "-";
                String email = p.getEmployee() != null ? nullSafe(p.getEmployee().getEmail()) : "-";
                String doj = (p.getEmployee() != null && p.getEmployee().getDateOfJoining() != null)
                        ? p.getEmployee().getDateOfJoining().toString()
                        : "-";
                String dob = (p.getEmployee() != null && p.getEmployee().getDateOfBirth() != null)
                        ? p.getEmployee().getDateOfBirth().toString()
                        : "-";

                String[][] leftRows = {
                        { "NAME", nullSafe(employeeName) },
                        { "DEPARTMENT", department },
                        { "DESIGNATION", nullSafe(designation) },
                        { "EMAIL", email },
                        { "PHONE", phone },
                };
                String[][] rightRows = {
                        { "EMPNO", nullSafe(employeeCode) },
                        { "DOB", dob },
                        { "DOJ", doj },
                        { "", "" },
                        { "", "" },
                };

                float rowY = infoBoxTop - 13;
                for (int i = 0; i < infoRows; i++) {
                    drawText(cs, FONT_BOLD, 9, BLACK, leftLabelX, rowY, leftRows[i][0]);
                    drawText(cs, FONT_REG, 9, BLACK, leftValueX, rowY, leftRows[i][1]);
                    drawText(cs, FONT_BOLD, 9, BLACK, rightLabelX, rowY, rightRows[i][0]);
                    drawText(cs, FONT_REG, 9, BLACK, rightValueX, rowY, rightRows[i][1]);
                    rowY -= rowH;
                }

                float afterInfoY = rowY + rowH - 18; // bottom of the info rows
                float attendanceRowH = 24f;
                float infoBoxBottom = afterInfoY - attendanceRowH;

                int standardDays = 31;
                int presentDays = p.getPresentDays();
                int lopDays = p.getLopDays();
                float attTextY = afterInfoY - 15;
                drawText(cs, FONT_REG, 9, BLACK, leftLabelX, attTextY,
                        "Standard Days: " + standardDays + "    Payable Days: " + presentDays
                                + "    Loss of Pay Days: " + lopDays
                                + "    LOP Reversal Days: 0    Arrear Days: 0");

                // Box border: outer rect + vertical divider + horizontal line above attendance
                // row
                cs.setLineWidth(1f);
                cs.addRect(pageLeft, infoBoxBottom, pageRight - pageLeft, infoBoxTop - infoBoxBottom);
                cs.stroke();
                cs.moveTo(pageLeft + colGap, infoBoxTop);
                cs.lineTo(pageLeft + colGap, afterInfoY);
                cs.stroke();
                cs.moveTo(pageLeft, afterInfoY);
                cs.lineTo(pageRight, afterInfoY);
                cs.stroke();

                y = infoBoxBottom - 18;

                // ---------------- Earnings / Deductions table ----------------
                // NOTE: simplified to two columns per side (LABEL + AMOUNT), right-aligned.
                // The previous CURRENT MONTH / ARREAR / TOTAL three-column layout had no
                // real arrear data to show and the columns were too tightly packed for the
                // available width, which caused the header text to visually overlap/merge.
                float tableTop = y;
                float tableLeft = pageLeft;
                float tableRight = pageRight;
                float midX = tableLeft + (tableRight - tableLeft) * 0.55f;

                float earnLabelX = tableLeft + 6;
                float earnAmtRight = midX - 8; // right edge of earnings amount column
                float dedLabelX = midX + 6;
                float dedAmtRight = tableRight - 10; // right edge of deductions amount column

                float headerH = 20f;
                float headerTextY = tableTop - 14;
                drawText(cs, FONT_BOLD, 9, BLACK, earnLabelX, headerTextY, "EARNINGS");
                drawTextRight(cs, FONT_BOLD, 9, BLACK, earnAmtRight, headerTextY, "AMOUNT");
                drawText(cs, FONT_BOLD, 9, BLACK, dedLabelX, headerTextY, "DEDUCTIONS");
                drawTextRight(cs, FONT_BOLD, 9, BLACK, dedAmtRight, headerTextY, "AMOUNT");

                float headerBottomY = tableTop - headerH;

                String[][] earnings = {
                        { "BASIC", fmt(p.getBasicSalary()) },
                        { "HRA", fmt(p.getHra()) },
                        { "DA", fmt(p.getDa()) },
                        { "SPECIAL ALLOWANCE", fmt(p.getSpecialAllowance()) },
                };
                String[][] deductions = {
                        { "ESI", fmt(p.getEsi()) },
                        { "TDS", fmt(p.getTds()) },
                        { "PF", "0" },
                };

                int maxRows = Math.max(earnings.length, deductions.length);
                float lineH = 26f;
                float rowsTop = headerBottomY;
                for (int i = 0; i < maxRows; i++) {
                    float ry = rowsTop - 16 - i * lineH;
                    if (i < earnings.length) {
                        drawText(cs, FONT_REG, 9, BLACK, earnLabelX, ry, earnings[i][0]);
                        drawTextRight(cs, FONT_REG, 9, BLACK, earnAmtRight, ry, earnings[i][1]);
                    }
                    if (i < deductions.length) {
                        drawText(cs, FONT_REG, 9, BLACK, dedLabelX, ry, deductions[i][0]);
                        drawTextRight(cs, FONT_REG, 9, BLACK, dedAmtRight, ry, deductions[i][1]);
                    }
                }

                float rowsBottomY = rowsTop - maxRows * lineH;

                float summaryH = 22f;
                float summaryTextY = rowsBottomY - 15;
                drawText(cs, FONT_BOLD, 10, BLACK, earnLabelX, summaryTextY, "GROSS EARNINGS");
                drawTextRight(cs, FONT_BOLD, 10, BLACK, earnAmtRight, summaryTextY, fmt(p.getGrossSalary()));
                drawText(cs, FONT_BOLD, 10, BLACK, dedLabelX, summaryTextY, "TOTAL DEDUCTIONS");
                drawTextRight(cs, FONT_BOLD, 10, BLACK, dedAmtRight, summaryTextY, fmt(p.getTotalDeductions()));

                float summaryBottomY = rowsBottomY - summaryH;

                float netH = 40f;
                float netBottomY = summaryBottomY - netH;
                float netTextY = summaryBottomY - 18;
                drawText(cs, FONT_BOLD, 12, BLACK, earnLabelX, netTextY, "NET PAY");
                String netStr = fmt(p.getNetSalary());
                float netStrWidth = FONT_BOLD.getStringWidth(netStr) / 1000f * 13f;
                drawText(cs, FONT_BOLD, 13, BLACK, tableRight - 10 - netStrWidth, netTextY, netStr);

                String words = numberToWords(p.getNetSalary() == null ? 0 : p.getNetSalary().longValue());
                drawText(cs, FONT_REG, 8, GRAY, earnLabelX, netTextY - 14, "(RUPEES " + words + " ONLY)");

                // ---- Table borders ----
                cs.setLineWidth(1f);
                // Outer rectangle around whole earnings/deductions + net pay block
                cs.addRect(tableLeft, netBottomY, tableRight - tableLeft, tableTop - netBottomY);
                cs.stroke();
                // Vertical divider between earnings and deductions (down through the rows, not
                // through net pay)
                cs.moveTo(midX, tableTop);
                cs.lineTo(midX, summaryBottomY);
                cs.stroke();
                // Line under header
                cs.moveTo(tableLeft, headerBottomY);
                cs.lineTo(tableRight, headerBottomY);
                cs.stroke();
                // Line under earning/deduction rows (above GROSS/TOTAL summary)
                cs.moveTo(tableLeft, rowsBottomY);
                cs.lineTo(tableRight, rowsBottomY);
                cs.stroke();
                // Line under summary (above NET PAY)
                cs.moveTo(tableLeft, summaryBottomY);
                cs.lineTo(tableRight, summaryBottomY);
                cs.stroke();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate payslip PDF", e);
        }
    }

    private void drawText(PDPageContentStream cs, PDType1Font font, float size, Color color, float x, float y,
            String text) throws IOException {
        cs.beginText();
        cs.setFont(font, size);
        cs.setNonStrokingColor(color);
        cs.newLineAtOffset(x, y);
        cs.showText(text == null ? "" : text);
        cs.endText();
    }

    /**
     * Draws text right-aligned so its right edge lands at {@code rightX}.
     * Used for amount columns so numbers line up neatly regardless of digit count.
     */
    private void drawTextRight(PDPageContentStream cs, PDType1Font font, float size, Color color, float rightX,
            float y, String text) throws IOException {
        if (text == null)
            text = "";
        float width = font.getStringWidth(text) / 1000f * size;
        drawText(cs, font, size, color, rightX - width, y, text);
    }

    private String nullSafe(String s) {
        return (s == null || s.isBlank()) ? "-" : s;
    }

    private String fmt(java.math.BigDecimal amount) {
        if (amount == null)
            return "0";
        NumberFormat nf = NumberFormat.getInstance(new Locale("en", "IN"));
        nf.setMaximumFractionDigits(0);
        return nf.format(amount);
    }

    private String numberToWords(long number) {
        if (number == 0)
            return "ZERO";
        String[] ones = { "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
                "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN" };
        String[] tens = { "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY" };

        StringBuilder sb = new StringBuilder();
        long crore = number / 10000000;
        number %= 10000000;
        long lakh = number / 100000;
        number %= 100000;
        long thousand = number / 1000;
        number %= 1000;
        long hundred = number / 100;
        number %= 100;

        if (crore > 0)
            sb.append(twoDigit(crore, ones, tens)).append(" CRORE ");
        if (lakh > 0)
            sb.append(twoDigit(lakh, ones, tens)).append(" LAKH ");
        if (thousand > 0)
            sb.append(twoDigit(thousand, ones, tens)).append(" THOUSAND ");
        if (hundred > 0)
            sb.append(ones[(int) hundred]).append(" HUNDRED ");
        if (number > 0) {
            if (sb.length() > 0)
                sb.append("AND ");
            sb.append(twoDigit(number, ones, tens));
        }
        return sb.toString().trim();
    }

    private String twoDigit(long n, String[] ones, String[] tens) {
        if (n < 20)
            return ones[(int) n];
        return (tens[(int) (n / 10)] + " " + ones[(int) (n % 10)]).trim();
    }
}