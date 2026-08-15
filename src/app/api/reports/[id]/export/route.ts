import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Report, { IReportDocument } from "@/models/Report";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    await connectDB();

    const report = (await Report.findOne({
      _id: id,
      userId: session.user.id,
    }).lean()) as IReportDocument | null;

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(report, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="XEROVA_Report_${report.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.json"`,
        },
      });
    }

    if (format === "markdown" || format === "md") {
      const md = generateMarkdown(report);
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="XEROVA_Report_${report.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.md"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format requested. Use json or md." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Report Export Error]:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

function generateMarkdown(report: IReportDocument): string {
  const dateStr = new Date(report.createdAt).toUTCString();
  const statusStr = (report.status || "draft").toUpperCase();
  const riskStr = `${report.riskScore}/100`;

  let md = `# XEROVA Threat Intelligence & Security Report\n\n`;
  md += `> **Confidentiality**: INTERNAL / RESTRICTED  \n`;
  md += `> **Status**: ${statusStr}  \n`;
  md += `> **Report Date**: ${dateStr}  \n`;
  md += `> **Report ID**: \`${report._id}\`  \n\n`;

  md += `## Metadata\n\n`;
  md += `| Field | Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Title** | ${report.title} |\n`;
  md += `| **Type** | ${report.type.toUpperCase().replace("_", " ")} |\n`;
  md += `| **Overall Risk Score** | ${riskStr} |\n`;
  md += `| **Total IOCs** | ${report.iocs?.length || 0} |\n`;
  md += `| **Total Findings** | ${report.findings?.length || 0} |\n\n`;

  md += `---\n\n`;

  if (report.summary) {
    md += `## Executive Summary\n\n${report.summary}\n\n`;
  }

  if (report.iocs && report.iocs.length > 0) {
    md += `## Indicators of Compromise (IOCs)\n\n`;
    md += `| Type | Value | Context |\n`;
    md += `| :--- | :--- | :--- |\n`;
    report.iocs.forEach((ioc) => {
      const type = ioc.type.toUpperCase();
      const val = `\`${ioc.value}\``;
      const ctx = ioc.context || "Identified during investigation";
      md += `| **${type}** | ${val} | ${ctx} |\n`;
    });
    md += `\n`;
  }

  if (report.threatEvidence && report.threatEvidence.length > 0) {
    md += `## Threat Intelligence Evidence\n\n`;
    report.threatEvidence.forEach((ev, i) => {
      md += `### ${i + 1}. Source: ${ev.source}\n`;
      md += `- **Severity**: ${ev.severity.toUpperCase()}\n`;
      if (ev.date) md += `- **Date Recorded**: ${ev.date}\n`;
      md += `- **Evidence Summary**: ${ev.description}\n\n`;
    });
  }

  if (report.findings && report.findings.length > 0) {
    md += `## Detailed Findings & Impact Analysis\n\n`;
    report.findings.forEach((finding, i) => {
      md += `### ${i + 1}. ${finding.title}\n`;
      md += `**Severity**: \`${finding.severity.toUpperCase()}\`  \n\n`;
      md += `${finding.description}\n\n`;
      if (finding.evidence) {
        md += `#### Technical Evidence / Code Snippet:\n\`\`\`text\n${finding.evidence}\n\`\`\`\n\n`;
      }
    });
  }

  md += `---\n\n`;
  md += `*Generated automatically by XEROVA Security & Threat Intelligence Platform*\n`;

  return md;
}
