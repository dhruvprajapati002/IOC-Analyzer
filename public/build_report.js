const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition, NumberFormat
} = require('docx');
const fs = require('fs');

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const TNR = "Times New Roman";
const A4W = 11906, A4H = 16838;
// GTU margins: Left 1.25", Right 1", Top 1", Bottom 1"
const ML = 1800, MR = 1440, MT = 1440, MB = 1440;
const CONTENT_W = A4W - ML - MR; // 8666 DXA

const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allBorders = { top: border, bottom: border, left: border, right: border };
const allThin = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { line: opts.line || 360, before: opts.before || 0, after: opts.after || 160 },
    children: [new TextRun({
      text,
      font: TNR,
      size: opts.size || 24,
      bold: opts.bold || false,
      italics: opts.italic || false,
      color: opts.color || "000000",
    })]
  });
}

function heading1(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: 32, bold: true })]
  });
}

function heading2(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font: TNR, size: 28, bold: true })]
  });
}

function heading3(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: TNR, size: 24, bold: true })]
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, before: 0, after: 240 },
    children: [new TextRun({ text, font: TNR, size: 24 })]
  });
}

function bulletItem(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, before: 0, after: 0 },
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: TNR, size: 24 })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function blankLine() {
  return new Paragraph({ spacing: { before: 0, after: 120 }, children: [new TextRun({ text: "" })] });
}

function infoTable(rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [Math.floor(CONTENT_W * 0.35), Math.floor(CONTENT_W * 0.65)],
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          borders: allThin,
          width: { size: Math.floor(CONTENT_W * 0.35), type: WidthType.DXA },
          shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, font: TNR, size: 22, bold: true })] })]
        }),
        new TableCell({
          borders: allThin,
          width: { size: Math.floor(CONTENT_W * 0.65), type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: value, font: TNR, size: 22 })] })]
        })
      ]
    }))
  });
}

function simpleTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders: allBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "C0C0C0", type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: h, font: TNR, size: 20, bold: true })] })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders: allBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, font: TNR, size: 20 })] })]
        }))
      }))
    ]
  });
}

// ─── DOCUMENT ────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [
    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: COVER PAGE (no page numbers)
    // ═══════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: A4W, height: A4H },
          margin: { top: MT, right: MR, bottom: MB, left: ML }
        },
        titlePage: false
      },
      children: [
        blankLine(), blankLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 360, before: 0, after: 240 },
          children: [new TextRun({ text: "THREATLENS — A FULL-STACK CYBER THREAT INTELLIGENCE", font: TNR, size: 36, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 360, before: 0, after: 480 },
          children: [new TextRun({ text: "PLATFORM FOR REAL-TIME IOC ANALYSIS", font: TNR, size: 36, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 240 },
          children: [new TextRun({ text: "A PROJECT REPORT", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "Submitted by", font: TNR, size: 28, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "DHRUV BHARATBHAI PRAJAPATI", font: TNR, size: 32, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: "220390107023", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "In partial fulfillment for the award of the degree of", font: TNR, size: 28, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "BACHELOR OF ENGINEERING", font: TNR, size: 32, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: "in", font: TNR, size: 28, italics: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: "Computer Engineering", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 240 },
          children: [new TextRun({ text: "Saffrony Institute of Technology, Mehsana", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "Gujarat Technological University, Ahmedabad", font: TNR, size: 32, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 0 },
          children: [new TextRun({ text: "March, 2026", font: TNR, size: 32, bold: true })]
        }),
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: FRONT MATTER (Roman numerals)
    // ═══════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: A4W, height: A4H },
          margin: { top: MT, right: MR, bottom: MB, left: ML },
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT] })]
          })]
        })
      },
      children: [
        // ── CERTIFICATE ─────────────────────────────────────────
        heading1("Certificate"),
        blankLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: "Saffrony Institute of Technology", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "Nr. Yogi Chowk, S.P. Ring Road, Mehsana – 384002, Gujarat", font: TNR, size: 24 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 480, before: 240, after: 240 },
          children: [new TextRun({
            text: "This is to certify that the project report submitted along with the project entitled ThreatLens — A Full-Stack Cyber Threat Intelligence Platform for Real-Time IOC Analysis has been carried out by Dhruv Bharatbhai Prajapati (Enrolment No. 220390107023) under my guidance in partial fulfillment for the degree of Bachelor of Engineering in Computer Engineering, 8th Semester of Gujarat Technological University, Ahmedabad during the academic year 2025-26.",
            font: TNR, size: 28
          })]
        }),
        blankLine(), blankLine(),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 480, after: 0 },
          children: [
            new TextRun({ text: "___________________________          ", font: TNR, size: 24 }),
            new TextRun({ text: "___________________________", font: TNR, size: 24 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: "Prof. Kunal Singh Kathia          ", font: TNR, size: 24, bold: true }),
            new TextRun({ text: "Head of the Department", font: TNR, size: 24, bold: true })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [
            new TextRun({ text: "Internal Guide                              ", font: TNR, size: 24 }),
            new TextRun({ text: "Computer Engineering", font: TNR, size: 24 })
          ]
        }),
        pageBreak(),

        // ── COMPANY CERTIFICATE ──────────────────────────────────
        heading1("Company Certificate"),
        blankLine(),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "Date: 28/03/2026", font: TNR, size: 24 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "TO WHOM IT MAY CONCERN", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 480, before: 240, after: 240 },
          children: [new TextRun({
            text: "This is to certify that Dhruv Bharatbhai Prajapati, a student of Saffrony Institute of Technology, Mehsana, has successfully completed his internship in the field of Full-Stack Cybersecurity Platform Development from 1st January 2026 to 28th March 2026 (Total number of Weeks: 12) under the guidance of Mr. Mayank Rajput.",
            font: TNR, size: 28
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 480, before: 0, after: 240 },
          children: [new TextRun({
            text: "His internship activities include full-stack development of the ThreatLens Cyber Threat Intelligence Platform, including API integration with VirusTotal, GreyNoise, ThreatFox, URLhaus, MalwareBazaar, and IPQS; database design and implementation using MongoDB Atlas; frontend development using Next.js 15 and React 18; and deployment on Vercel cloud infrastructure.",
            font: TNR, size: 28
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 480, before: 0, after: 240 },
          children: [new TextRun({
            text: "During the period of his internship programme with us, he had been exposed to different processes and was found diligent, hardworking, and inquisitive. We wish him every success in his life and career.",
            font: TNR, size: 28
          })]
        }),
        blankLine(), blankLine(),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 480, after: 0 },
          children: [new TextRun({ text: "For ForensicCyberTech", font: TNR, size: 24 })]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 0 },
          children: [new TextRun({ text: "___________________________", font: TNR, size: 24 })]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: "Mr. Mayank Rajput", font: TNR, size: 24, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: "Company Mentor | ForensicCyberTech", font: TNR, size: 24 })]
        }),
        pageBreak(),

        // ── DECLARATION ──────────────────────────────────────────
        heading1("Declaration"),
        blankLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: "Saffrony Institute of Technology", font: TNR, size: 28, bold: true })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 240 },
          children: [new TextRun({ text: "Nr. Yogi Chowk, S.P. Ring Road, Mehsana – 384002, Gujarat", font: TNR, size: 24 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 480, before: 240, after: 240 },
          children: [new TextRun({
            text: "I hereby declare that the Internship / Project report submitted along with the Internship / Project entitled ThreatLens — A Full-Stack Cyber Threat Intelligence Platform for Real-Time IOC Analysis, submitted in partial fulfillment for the degree of Bachelor of Engineering in Computer Engineering to Gujarat Technological University, Ahmedabad, is a bonafide record of original project work carried out by me at ForensicCyberTech under the supervision of Mr. Mayank Rajput (Company Mentor) and Prof. Kunal Singh Kathia (Internal Guide), and that no part of this report has been directly copied from any student's report or taken from any other source, without providing due reference.",
            font: TNR, size: 28
          })]
        }),
        blankLine(), blankLine(),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 480, after: 80 },
          children: [
            new TextRun({ text: "Name of the Student          ", font: TNR, size: 24 }),
            new TextRun({ text: "Sign of Student", font: TNR, size: 24 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 0 },
          children: [
            new TextRun({ text: "Dhruv Bharatbhai Prajapati          ", font: TNR, size: 24 }),
            new TextRun({ text: "___________________________", font: TNR, size: 24 })
          ]
        }),
        pageBreak(),

        // ── ACKNOWLEDGEMENT ──────────────────────────────────────
        heading1("Acknowledgement"),
        blankLine(),
        bodyPara("The successful completion of this internship project would not have been possible without the guidance, support, and encouragement of several individuals and institutions, to whom the author extends sincere gratitude and heartfelt appreciation."),
        bodyPara("First and foremost, the author would like to express profound gratitude to Gujarat Technological University (GTU) for structuring the 8th Semester Internship Programme as an integral part of the Bachelor of Engineering curriculum. This programme provided the invaluable opportunity to bridge the gap between academic theory and real-world industry practice, enabling the practical application of knowledge acquired throughout the four-year undergraduate journey. The foresight of GTU in mandating industry-based internship training has been instrumental in shaping the professional competencies of the author."),
        bodyPara("The author is deeply thankful to Saffrony Institute of Technology, Mehsana, and its esteemed faculty of the Computer Engineering Department for providing a strong academic foundation. The rigorous coursework in data structures, database management systems, computer networks, web development, and information security formed the bedrock upon which this internship project was built. Special thanks are due to the Head of the Department and all faculty members who supported the internship process with timely documentation and academic guidance."),
        bodyPara("The author wishes to convey sincere appreciation to the internal guide, Prof. Kunal Singh Kathia, whose consistent mentorship, constructive feedback, and academic supervision ensured that the project met the rigorous standards expected at the university level. His periodic reviews and willingness to discuss technical challenges were invaluable throughout the duration of the internship."),
        bodyPara("Immense gratitude is extended to ForensicCyberTech for offering the opportunity to work on a production-grade cybersecurity project in a professional environment. The company's commitment to fostering talent and providing hands-on experience in cyber threat intelligence was pivotal to the success of this internship. The author is especially grateful to the company mentor, Mr. Mayank Rajput, whose technical expertise, patient guidance, and industry insights were a constant source of learning and inspiration. His mentorship in API integration, secure coding practices, and threat intelligence methodologies profoundly shaped the outcome of this project over the full 12-week engagement."),
        bodyPara("Finally, the author extends heartfelt thanks to family members and fellow colleagues for their unwavering moral support and encouragement throughout the internship period. Their patience and understanding during long working hours and challenging phases of development are deeply appreciated."),
        pageBreak(),

        // ── ABSTRACT ─────────────────────────────────────────────
        heading1("Abstract"),
        blankLine(),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, before: 0, after: 240 },
          children: [new TextRun({
            text: "The contemporary cybersecurity landscape is characterised by an ever-expanding threat surface, with threat actors deploying increasingly sophisticated attack vectors including advanced persistent threats, polymorphic malware, phishing campaigns, and zero-day exploits at an unprecedented scale. Security Operations Centre (SOC) analysts and independent threat researchers face the daunting challenge of investigating hundreds of Indicators of Compromise (IOCs) daily — including suspicious IP addresses, domain names, URLs, and file hashes — using a fragmented ecosystem of open-source and commercial threat intelligence tools. The manual process of querying multiple intelligence sources, correlating responses, and synthesising unified verdicts is time-consuming, error-prone, and fundamentally unscalable in environments where timely threat detection is paramount.",
            font: TNR, size: 28, italics: true
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, before: 0, after: 240 },
          children: [new TextRun({
            text: "This internship report presents ThreatLens, a full-stack, production-grade Cyber Threat Intelligence (CTI) platform developed during a 12-week internship at ForensicCyberTech under the mentorship of Mr. Mayank Rajput. ThreatLens addresses the critical problem of intelligence fragmentation by aggregating, normalising, and correlating threat data from six major intelligence sources — VirusTotal, GreyNoise, ThreatFox, URLhaus, MalwareBazaar, and IP Quality Score (IPQS) — into a single, unified analysis interface. The platform enables analysts to submit any IOC type (IPv4/IPv6 addresses, domains, URLs, MD5/SHA1/SHA256 file hashes) and receive an instant, multi-source verdict with an automated risk score computed using a weighted algorithm that considers detection ratios, abuse confidence percentages, threat classifications, and community reputation data.",
            font: TNR, size: 28, italics: true
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, before: 0, after: 240 },
          children: [new TextRun({
            text: "The platform was built using Next.js 15 with App Router architecture, React 18, TypeScript, MongoDB Atlas, Tailwind CSS, Recharts for interactive data visualisation, and Framer Motion for fluid UI animations. The backend leverages Next.js API Routes with a modular service-oriented architecture featuring dedicated client modules for each intelligence source, response normaliser layers, and a multi-source orchestrator that executes parallel API calls using Promise.allSettled() for fault-tolerant data aggregation. Authentication is implemented via JSON Web Tokens with bcrypt password hashing, and input validation is enforced through Zod schema definitions.",
            font: TNR, size: 28, italics: true
          })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, before: 0, after: 240 },
          children: [new TextRun({
            text: "Key features implemented over the 12-week period include: (1) an automated IOC type detection engine using regular expression pattern matching; (2) a real-time security dashboard with 10+ interactive chart types; (3) a comprehensive search history module with pagination, filtering, and CSV/JSON export; (4) a file hash analysis module with MITRE ATT&CK framework mapping and sandbox analysis integration; (5) a domain intelligence side panel providing WHOIS, DNS, and SSL certificate data; (6) a centralised skeleton loading system for professional UX; and (7) a full security hardening pass addressing OWASP Top 10 vulnerabilities. The platform is production-deployed on Vercel, capable of analysing 100+ IOCs per session with an average response time of 8–12 seconds.",
            font: TNR, size: 28, italics: true
          })]
        }),
        pageBreak(),

        // ── LIST OF ABBREVIATIONS ─────────────────────────────────
        heading1("List of Abbreviations"),
        blankLine(),
        simpleTable(
          ["Abbreviation", "Full Form"],
          [
            ["IOC","Indicator of Compromise"],["CTI","Cyber Threat Intelligence"],
            ["API","Application Programming Interface"],["URL","Uniform Resource Locator"],
            ["IP","Internet Protocol"],["DNS","Domain Name System"],
            ["WHOIS","Who Is (Domain Registration Query Protocol)"],["SSL","Secure Sockets Layer"],
            ["TLS","Transport Layer Security"],["SOC","Security Operations Centre"],
            ["MITRE","Massachusetts Institute of Technology Research Establishment"],
            ["ATT&CK","Adversarial Tactics, Techniques, and Common Knowledge"],
            ["VT","VirusTotal"],["GN","GreyNoise"],["TF","ThreatFox"],
            ["UH","URLhaus"],["MB","MalwareBazaar"],["IPQS","IP Quality Score"],
            ["JWT","JSON Web Token"],["CRUD","Create, Read, Update, Delete"],
            ["REST","Representational State Transfer"],["JSON","JavaScript Object Notation"],
            ["NoSQL","Not Only Structured Query Language"],["ODM","Object-Document Mapper"],
            ["CDN","Content Delivery Network"],["HTTP","HyperText Transfer Protocol"],
            ["HTTPS","HyperText Transfer Protocol Secure"],["SHA","Secure Hash Algorithm"],
            ["MD5","Message Digest Algorithm 5"],["PE","Portable Executable"],
            ["DLL","Dynamic Link Library"],["C2","Command and Control"],
            ["RAT","Remote Access Trojan"],["APT","Advanced Persistent Threat"],
            ["OSINT","Open Source Intelligence"],["SIEM","Security Information and Event Management"],
            ["VAPT","Vulnerability Assessment and Penetration Testing"],
            ["CVE","Common Vulnerabilities and Exposures"],
            ["CVSS","Common Vulnerability Scoring System"],
            ["TTL","Time to Live"],["SSRF","Server-Side Request Forgery"],
            ["XSS","Cross-Site Scripting"],["RDAP","Registration Data Access Protocol"],
            ["STIX","Structured Threat Information Expression"],
            ["TAXII","Trusted Automated Exchange of Intelligence Information"],
            ["SDLC","Software Development Life Cycle"],["UI","User Interface"],
            ["UX","User Experience"],["CI/CD","Continuous Integration / Continuous Deployment"],
          ],
          [Math.floor(CONTENT_W * 0.25), Math.floor(CONTENT_W * 0.75)]
        ),
        pageBreak(),

        // ── TABLE OF CONTENTS ─────────────────────────────────────
        heading1("Table of Contents"),
        blankLine(),
        ...([
          ["Acknowledgement","i"],["Abstract","ii"],["List of Abbreviations","iii"],
          ["Table of Contents","iv"],
          ["Chapter 1    Overview of ForensicCyberTech","1"],
          ["   1.1   Company Introduction and Background","1"],
          ["   1.2   History and Evolution","3"],
          ["   1.3   Products and Scope of Work","5"],
          ["   1.4   Organisation Structure","8"],
          ["   1.5   Work Environment and Support","9"],
          ["Chapter 2    Technical Environment and Infrastructure","11"],
          ["   2.1   Development Environment Setup","11"],
          ["   2.2   Technology Stack Overview","13"],
          ["   2.3   API Integration Architecture","16"],
          ["   2.4   Database Architecture","19"],
          ["   2.5   Security Architecture","22"],
          ["Chapter 3    Project Introduction and Management","24"],
          ["   3.1   Project Summary","24"],
          ["   3.2   Purpose","27"],
          ["   3.3   Objectives","28"],
          ["   3.4   Scope","30"],
          ["   3.5   Technology and Literature Review","32"],
          ["   3.6   Project Planning","36"],
          ["   3.7   Project Scheduling","40"],
          ["Chapter 4    System Analysis","42"],
          ["   4.1   Study of Current System","42"],
          ["   4.2   Problems and Weaknesses of Current System","44"],
          ["   4.3   Requirements of New System","46"],
          ["   4.4   System Feasibility","49"],
          ["   4.5   Activity in Proposed System","51"],
          ["   4.6   Features of New System","52"],
          ["   4.7   Main Modules of System","55"],
          ["   4.8   Technology Selection and Justification","57"],
          ["Chapter 5    System Design","60"],
          ["   5.1   System Design and Methodology","60"],
          ["   5.2   Database Schema Design","63"],
          ["   5.3   Input/Output and Interface Design","67"],
          ["   5.4   API Design","70"],
          ["Chapter 6    Implementation","73"],
          ["   6.1   Implementation Platform and Environment","73"],
          ["   6.2   Module Implementation Details","75"],
          ["   6.3   Key Features Implementation","81"],
          ["   6.4   Results and Outcomes","85"],
          ["Chapter 7    Testing","87"],
          ["   7.1   Testing Strategy","87"],
          ["   7.2   Test Cases","89"],
          ["Chapter 8    Conclusion and Discussion","93"],
          ["   8.1   Overall Analysis","93"],
          ["   8.4   Continuous Evaluation Dates","95"],
          ["   8.5   Problems Encountered and Solutions","96"],
          ["   8.6   Summary of Internship Work","99"],
          ["   8.7   Limitations and Future Enhancements","101"],
          ["References","104"],
          ["Appendix","106"],
        ]).map(([title, pg]) => new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, before: 0, after: 0 },
          tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W, leader: TabStopType.DOT }],
          children: [
            new TextRun({ text: title, font: TNR, size: 22, bold: title.startsWith("Chapter") }),
            new TextRun({ text: "\t" + pg, font: TNR, size: 22 })
          ]
        })),
        pageBreak(),
      ]
    },

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: MAIN CHAPTERS (Arabic numerals)
    // ═══════════════════════════════════════════════════════════════
    {
      properties: {
        page: {
          size: { width: A4W, height: A4H },
          margin: { top: MT, right: MR, bottom: MB, left: ML },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
            children: [new TextRun({ text: "ThreatLens — Cyber Threat Intelligence Platform", font: TNR, size: 18 })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Gujarat Technological University          ", font: TNR, size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT] }),
              new TextRun({ text: "          Saffrony Institute of Technology", font: TNR, size: 18 })
            ]
          })]
        })
      },
      children: [
        // ════════════════════════════════════════════════════════
        // CHAPTER 1
        // ════════════════════════════════════════════════════════
        heading1("Chapter 1: Overview of ForensicCyberTech"),
        blankLine(),
        heading2("1.1   Company Introduction and Background"),
        bodyPara("ForensicCyberTech is a cybersecurity-focused technology firm headquartered in India that specialises in delivering comprehensive digital forensics, threat intelligence, penetration testing, and security consulting services to a diverse portfolio of clients spanning enterprises, financial institutions, government agencies, and technology startups. Founded with the core mission of democratising access to advanced threat intelligence capabilities — traditionally available only to large corporations with substantial security budgets — ForensicCyberTech has positioned itself at the intersection of cybersecurity research and practical security operations."),
        bodyPara("The company operates across multiple domains within the cybersecurity value chain. Its primary service verticals include proactive cyber threat hunting, where dedicated analysts continuously monitor the threat landscape for emerging attack patterns and indicators of compromise; reactive incident response, where forensic experts are deployed to investigate security breaches, recover digital evidence, and remediate compromised systems; and strategic security consulting, where the company assists organisations in designing and implementing security architectures that align with industry standards such as ISO 27001, NIST Cybersecurity Framework, and CIS Controls."),
        bodyPara("ForensicCyberTech distinguishes itself through its commitment to building proprietary threat analysis platforms that integrate open-source intelligence (OSINT) feeds, commercial threat intelligence APIs, and custom machine learning models into unified analysis pipelines. This engineering-driven approach to cybersecurity allows the company to offer services that are both technically sophisticated and economically accessible to organisations of varying sizes. The company's development team maintains a strong emphasis on full-stack software engineering, employing modern web technologies, cloud-native architectures, and DevSecOps practices to build tools that security analysts rely upon daily."),
        bodyPara("The client base of ForensicCyberTech includes mid-to-large enterprises in sectors such as banking and financial services, healthcare, e-commerce, and critical infrastructure. Government agencies and law enforcement bodies have also engaged the company for digital forensics investigations and cybercrime evidence recovery. The company's reputation for technical excellence and its ability to deliver actionable intelligence in time-sensitive situations has been central to its sustained growth and industry recognition."),

        heading2("1.2   History and Evolution"),
        bodyPara("ForensicCyberTech was established as a digital forensics startup with an initial focus on providing computer forensics investigation services to law enforcement agencies and legal firms. During its foundational phase, the company concentrated on evidence acquisition from digital devices, forensic imaging of hard drives and mobile devices, and chain-of-custody documentation for court proceedings. This work required deep expertise in file system analysis, data carving, and forensic tool proficiency with software such as EnCase, FTK, and Autopsy."),
        bodyPara("As the cybersecurity threat landscape evolved and organisations faced increasingly sophisticated adversaries, ForensicCyberTech expanded its service portfolio to include proactive security services. The company invested in building a dedicated Cyber Threat Intelligence (CTI) division, staffed with analysts proficient in OSINT methodologies, malware reverse engineering, and threat actor profiling. This strategic expansion coincided with the broader industry shift from reactive security to proactive security — identifying threats before they cause damage."),
        bodyPara("A significant milestone in the company's evolution was the decision to invest in proprietary platform development. Recognising that existing open-source and commercial threat intelligence tools were fragmented — requiring analysts to manually query multiple sources and correlate results — ForensicCyberTech began building integrated analysis platforms. The ThreatLens project represents the latest iteration of this platform development initiative. The company adopted agile development methodologies, continuous integration and deployment pipelines, and cloud-native infrastructure to accelerate platform delivery cycles."),

        heading2("1.3   Products and Scope of Work"),
        bodyPara("ForensicCyberTech offers five principal service areas, each addressing a critical dimension of the cybersecurity domain:"),
        bodyPara("1. Digital Forensics Investigation Services: The company provides end-to-end digital forensics services encompassing evidence identification, preservation, analysis, and presentation. Forensic analysts employ industry-standard tools and methodologies to recover deleted files, analyse browser artifacts, extract metadata, and reconstruct timelines of user activity. These services are utilised by law enforcement agencies, legal firms, and corporate entities. The technical approach follows NIST SP 800-86 guidelines, ensuring all findings are admissible in legal proceedings."),
        bodyPara("2. Cyber Threat Intelligence Platform Development: ForensicCyberTech designs and develops custom threat intelligence platforms that aggregate data from multiple OSINT and commercial feeds, normalise disparate data formats into unified schemas, and present actionable intelligence through interactive dashboards. The ThreatLens project developed during this internship falls under this service area."),
        bodyPara("3. Malware Analysis and Reverse Engineering: The company maintains a dedicated malware analysis laboratory where analysts perform static and dynamic analysis of suspicious executables, documents, and scripts. Static analysis involves disassembly and decompilation using IDA Pro, Ghidra, and Binary Ninja, while dynamic analysis is conducted in sandboxed environments using Cuckoo Sandbox, ANY.RUN, and Joe Sandbox."),
        bodyPara("4. Vulnerability Assessment and Penetration Testing (VAPT): ForensicCyberTech conducts comprehensive VAPT engagements for web applications, mobile applications, APIs, network infrastructure, and cloud environments. The methodology follows OWASP Testing Guide v4.0 and PTES frameworks, complemented by manual testing techniques for business logic vulnerabilities and privilege escalation vectors."),
        bodyPara("5. Security Awareness Training and Consulting: The company offers security awareness training programmes covering phishing recognition, password hygiene, social engineering defence, and secure coding practices. Consulting services include security architecture review, compliance assessment (ISO 27001, GDPR, PCI-DSS), and incident response planning."),

        heading2("1.4   Organisation Structure"),
        bodyPara("ForensicCyberTech operates with a lean, skill-focused organisational hierarchy designed to facilitate rapid decision-making and cross-functional collaboration. At the apex of the organisation is the Chief Executive Officer (CEO), who oversees business strategy, client relationships, and organisational direction. Reporting directly to the CEO is the Chief Technology Officer (CTO), who is responsible for technology strategy, platform architecture decisions, and technical team management."),
        bodyPara("The CTO oversees three primary divisions: the Development Team, the Security Team, and the Consulting Team. The Development Team is led by a Lead Developer and comprises backend developers, frontend developers, and DevOps engineers who collaboratively build and maintain the company's proprietary platforms. The Security Team consists of Threat Analysts, Forensic Experts, and VAPT Engineers who deliver the company's core cybersecurity services. The Consulting Team includes Security Consultants and Training Specialists who manage client engagements."),
        bodyPara("During the internship period, the author was placed within the Development Team under the direct mentorship of Mr. Mayank Rajput. The intern's responsibilities encompassed full-stack development of the ThreatLens platform, including frontend UI development, backend API implementation, database schema design, and external API integration across all 12 weeks of the engagement."),

        heading2("1.5   Work Environment and Support"),
        bodyPara("ForensicCyberTech maintains a professional, collaborative, and learning-oriented work environment that is particularly conducive to the growth of interns and junior developers. The company provided the author with a fully equipped development workstation, secure VPN access to the company's internal development infrastructure, and API credentials for all six threat intelligence sources integrated into ThreatLens."),
        bodyPara("The development process followed an Agile/Scrum methodology with two-week sprint cycles. Each sprint commenced with a planning session where tasks were defined, estimated, and assigned, and concluded with a sprint review and retrospective. Daily standup meetings ensured transparency regarding progress, blockers, and priorities. Weekly code review sessions with the mentor provided opportunities for technical feedback, architecture discussions, and knowledge sharing."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 2
        // ════════════════════════════════════════════════════════
        heading1("Chapter 2: Technical Environment and Infrastructure"),
        blankLine(),
        heading2("2.1   Development Environment Setup"),
        bodyPara("The development environment was configured on a Dell Precision workstation equipped with an Intel Core i7 12th Generation processor, 32 GB DDR5 RAM, 1 TB NVMe SSD, and a dedicated NVIDIA GPU for occasional machine learning experimentation. The primary operating system was Windows 11 Pro with Windows Subsystem for Linux 2 (WSL2) running Ubuntu 22.04 LTS, providing a Unix-like development environment within the Windows ecosystem."),
        bodyPara("The primary development tool was Visual Studio Code (VSCode) configured with extensions including ESLint for JavaScript/TypeScript linting, Prettier for code formatting, GitLens for Git history visualisation, Tailwind CSS IntelliSense for class name autocompletion, MongoDB for VS Code for database management, REST Client for API testing, and GitHub Copilot for AI-assisted code generation. Node.js v20 LTS was the runtime environment, with npm v10 as the package manager."),
        bodyPara("Version control was managed using Git with GitHub as the remote repository host. The repository followed a feature-branch workflow: the main branch contained production-ready code, a development branch served as the integration branch, and individual feature branches were created for each sprint task. Pull requests with mandatory code review by the mentor were required before merging to development. MongoDB Compass was used for visual database management and query development."),

        heading2("2.2   Technology Stack Overview"),
        bodyPara("The ThreatLens platform was built using a carefully selected modern technology stack, chosen for production suitability, developer productivity, and alignment with industry best practices in full-stack JavaScript development."),
        simpleTable(
          ["Technology", "Category", "Version", "Purpose"],
          [
            ["Next.js","Frontend/Backend","15.0","Full-stack framework with App Router, API Routes, SSR"],
            ["React","Frontend","18.0","Component-based UI library"],
            ["TypeScript","Language","5.x","Type-safe JavaScript development"],
            ["MongoDB Atlas","Database","7.x","Document-oriented NoSQL database"],
            ["Mongoose","ODM","8.x","MongoDB object-document mapper for schema definition"],
            ["Tailwind CSS","Styling","4.x","Utility-first CSS framework for responsive design"],
            ["Recharts","Charts","2.x","React-native charting library for dashboard visualisations"],
            ["Framer Motion","Animation","11.x","Production-grade React animation library"],
            ["Lucide React","Icons","0.4x","Icon library with consistent design language"],
            ["Zod","Validation","3.x","TypeScript-first schema validation for API inputs"],
            ["JWT","Auth","9.x","Stateless authentication tokens"],
            ["bcrypt","Security","5.x","Password hashing with salt rounds"],
            ["Vercel","Deployment","N/A","Serverless deployment with global edge network"],
          ],
          [Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.12), Math.floor(CONTENT_W*0.53)]
        ),
        blankLine(),

        heading2("2.3   API Integration Architecture"),
        bodyPara("The platform integrates with six external threat intelligence APIs, each providing a distinct category of intelligence data. The integration architecture was designed to be fault-tolerant, ensuring that the failure of any single source does not prevent the platform from returning a partial but useful result to the analyst."),
        bodyPara("API key management was implemented using Next.js environment variables stored in a .env.local file for development and Vercel's encrypted environment variable storage for production. Each API client module is a singleton class that reads its credentials at module initialisation, preventing repeated environment variable lookups during runtime. The safeFetch utility function wraps all external HTTP calls with a 10-second AbortController timeout, automatic retry logic for transient failures, and SSRF protection that blocklists private IP ranges."),
        bodyPara("All six API calls for a given IOC are executed in parallel using Promise.allSettled(), which unlike Promise.all() does not fail fast — if three sources return errors, the remaining three successful responses are still processed and returned. This design choice is critical in threat intelligence workflows where partial data is significantly more valuable than no data. Each API response is passed through a normaliser function that maps source-specific field names to the platform's internal schema."),
        simpleTable(
          ["Source", "Data Type", "Rate Limit", "Key Fields Used"],
          [
            ["VirusTotal","File/URL/IP/Domain analysis","4 req/min (free)","stats.malicious, stats.suspicious, malware_families, sandbox_verdicts"],
            ["GreyNoise","IP reputation","100 req/day (free)","classification, noise, riot, country, tags"],
            ["ThreatFox","IOC database","Unlimited (API key)","threat_type, malware, confidence_level, tags"],
            ["URLhaus","URL/Domain malware","Unlimited (free)","threat, url_status, tags, reporter"],
            ["MalwareBazaar","File hash database","Unlimited (API key)","file_type, signature, tags, first_seen"],
            ["IPQS","IP quality scoring","5000 req/mo (free)","fraud_score, proxy, vpn, tor, abuse_velocity"],
          ],
          [Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.22), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.4)]
        ),
        blankLine(),

        heading2("2.4   Database Architecture"),
        bodyPara("MongoDB Atlas M0 free tier (512 MB, hosted on AWS US-East-1) was selected as the database platform. The document-oriented nature of MongoDB was particularly well-suited to this project because each threat intelligence API returns responses with varying and nested schemas — a rigid relational schema would require extensive JOIN operations or repeated schema migrations as new API fields were discovered, whereas MongoDB's flexible document model accommodates these variations naturally."),
        bodyPara("The database comprises two primary collections. The IocCache collection stores complete analysis results for previously queried IOCs, with a TTL index on the cachedAt field set to expire documents after 3600 seconds (1 hour), ensuring that stale intelligence data is automatically evicted. The IocUserHistory collection maintains a persistent audit trail of all IOC queries submitted through the platform, keyed by userId (or the shared SYSTEM_USER_ID for public access), enabling the history page and dashboard analytics."),
        bodyPara("Key indexing decisions include: a compound index on { value: 1, type: 1 } for IocCache to optimise the primary cache lookup query; a compound index on { userId: 1, searched_at: -1 } for IocUserHistory to support paginated history queries sorted by recency; and a text index on the value field to support full-text search functionality. All read-only queries use Mongoose's .lean() option to return plain JavaScript objects rather than full Mongoose documents, reducing memory consumption by approximately 40% for large result sets."),

        heading2("2.5   Security Architecture"),
        bodyPara("Security was treated as a first-class concern throughout the development of ThreatLens. The authentication system uses JSON Web Tokens (JWT) signed with the HS256 algorithm using a secret key of minimum 64 characters. Token payloads contain only the minimum necessary claims (userId, username, role) and are set to expire after 24 hours. The JWT verification middleware explicitly specifies the expected algorithm, preventing algorithm confusion attacks."),
        bodyPara("All user-supplied inputs are validated using Zod schema definitions before being processed by API route handlers. IOC values are sanitised by stripping MongoDB operator characters ($ prefix) and enforcing maximum length limits of 500 characters. The safeFetch utility implements SSRF protection by maintaining a blocklist of private IP ranges (127.x.x.x, 10.x.x.x, 192.168.x.x, 169.254.x.x) that are rejected before any outbound HTTP request is made. Rate limiting was implemented at the application level (4 searches per minute, 100 per day) stored in server-side memory."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 3
        // ════════════════════════════════════════════════════════
        heading1("Chapter 3: Project Introduction and Management"),
        blankLine(),
        heading2("3.1   Project Summary"),
        bodyPara("ThreatLens is a full-stack, production-grade Cyber Threat Intelligence (CTI) platform conceived and developed during the 12-week internship at ForensicCyberTech. The platform directly addresses one of the most pervasive operational inefficiencies faced by cybersecurity analysts: the fragmentation of threat intelligence tools. In contemporary SOC environments, analysts are required to navigate between multiple browser tabs — simultaneously querying VirusTotal for file reputation, GreyNoise for IP noise classification, ThreatFox for malware-associated IOCs, URLhaus for malicious URLs, MalwareBazaar for file hash details, and IPQS for IP quality scoring — manually correlating results and synthesising judgements. This workflow is estimated to consume 15–30 minutes per IOC investigation, which is operationally untenable when analysts are processing hundreds of IOCs per day during active incident response."),
        bodyPara("ThreatLens eliminates this fragmentation by providing a single, unified interface where analysts submit an IOC and receive an aggregated, normalised, and scored intelligence report within 8–12 seconds. The platform's risk scoring algorithm computes a 0–100 numerical threat score using a weighted combination of signals from all six intelligence sources, mapping the score to severity levels (Low: 0–30, Medium: 31–50, High: 51–75, Critical: 76–100). This automated scoring transforms qualitative multi-source assessments into a quantitative, comparable metric that can be used for prioritisation and workflow automation."),
        bodyPara("The 12-week development timeline was structured into six two-week sprints, each delivering a functional vertical slice of the platform. Sprint 1 established the architectural foundation (database schema, authentication, routing). Sprint 2 integrated the core analysis engine with VirusTotal and GreyNoise. Sprint 3 added the remaining four API sources and implemented the response normalisation layer. Sprint 4 delivered the dashboard with 10+ chart types and the history page. Sprint 5 added the file analysis module, domain intelligence panel, and MITRE ATT&CK mapping. Sprint 6 focused on security hardening, performance optimisation, production deployment, and documentation."),

        heading2("3.2   Purpose"),
        bodyPara("The primary purpose of ThreatLens is to reduce the mean time to investigate (MTTI) an IOC from an industry average of 15–30 minutes to under 15 seconds by automating the multi-source query and correlation workflow. Secondary purposes include providing persistent search history for audit trail requirements, enabling trend analysis through the dashboard, and making enterprise-grade threat intelligence capabilities accessible to individual researchers who cannot afford commercial platforms such as Recorded Future (approximately $50,000/year) or IBM X-Force Exchange."),
        bodyPara("From an educational perspective, the project was designed to provide the author with practical experience in full-stack Next.js development, REST API integration at scale, NoSQL database design, JWT authentication implementation, and production deployment — competencies that are directly aligned with industry demand for full-stack JavaScript engineers in cybersecurity product companies."),

        heading2("3.3   Objectives"),
        bodyPara("The project was defined with eight specific, measurable objectives:"),
        bulletItem("Build a multi-source IOC analysis engine capable of querying six intelligence APIs in parallel and aggregating results within 15 seconds."),
        bulletItem("Implement an automated risk scoring algorithm producing a 0–100 numerical threat score from multi-source signals."),
        bulletItem("Create an interactive real-time security dashboard with a minimum of 10 distinct chart types displaying temporal trends, geolocation distribution, malware families, and detection engine performance."),
        bulletItem("Develop a comprehensive search history module with pagination (10/25/50 records per page), multi-field filtering (by IOC type, verdict, source, date range), and export in CSV and JSON formats."),
        bulletItem("Build a file hash analysis module supporting PE32, PDF, Office documents, ZIP archives, and PowerShell scripts, with MITRE ATT&CK framework mapping of detected techniques."),
        bulletItem("Implement a domain intelligence side panel providing WHOIS registration data, DNS record resolution (A, AAAA, MX, NS, TXT), SSL certificate validity, and reputation summary."),
        bulletItem("Implement a TTL-based MongoDB caching layer reducing redundant API calls by a minimum of 50%."),
        bulletItem("Deploy the platform to production on Vercel with all security headers, rate limiting, input validation, and SSRF protections in place."),
        blankLine(),

        heading2("3.4   Scope"),
        bodyPara("The platform supports IOC analysis for the following input types: IPv4 addresses, IPv6 addresses, fully qualified domain names (FQDNs), HTTP/HTTPS URLs, MD5 hashes (32 hexadecimal characters), SHA1 hashes (40 hexadecimal characters), and SHA256 hashes (64 hexadecimal characters). IOC type is automatically detected using regular expression pattern matching, eliminating the need for manual type selection in most cases."),
        bodyPara("The scope of analysis for each IOC type varies based on source API capabilities: IP addresses receive geolocation data, ASN details, abuse confidence scoring from IPQS, noise/riot classification from GreyNoise, and VirusTotal IP report data. Domains receive DNS resolution data, WHOIS registration details via RDAP, SSL certificate information from crt.sh, and VirusTotal domain report data. URLs receive VirusTotal URL analysis and URLhaus database lookup. File hashes receive VirusTotal file report (including PE structure, sandbox verdicts, malware family labels), MalwareBazaar file information, and ThreatFox IOC lookup."),
        bodyPara("Features explicitly outside the scope of the current version include: real-time network packet capture or passive DNS monitoring; automated threat response actions (e.g., firewall rule generation, blocking); bulk CSV file upload for batch analysis; integration with SIEM platforms; and mobile application development."),

        heading2("3.5   Technology and Literature Review"),
        bodyPara("A comprehensive review of existing threat intelligence platforms was conducted at the start of the internship to identify gaps that ThreatLens could address. VirusTotal is the industry's most widely used file and URL analysis service, providing detection results from 70+ antivirus engines. However, its web interface requires manual navigation across multiple tabs for different IOC types, and its API is rate-limited to 4 requests per minute on the free tier. GreyNoise specialises in differentiating between benign internet background noise (automated scanners, search engine crawlers) and genuinely malicious actors, providing context that VirusTotal does not offer. ThreatFox is a community-driven IOC database maintained by abuse.ch, providing tagged malware-associated IOCs with confidence scores. URLhaus and MalwareBazaar are also maintained by abuse.ch, focusing on malicious URLs and malware samples respectively. IPQS provides comprehensive IP quality scoring including proxy, VPN, and Tor detection."),
        bodyPara("From an academic perspective, the MITRE ATT&CK framework (Strom et al., 2018) provides a globally accessible knowledge base of adversary tactics and techniques based on real-world observations. Its integration into ThreatLens enables analysts to map detected malware behaviours to standardised technique identifiers (e.g., T1059 for Command and Scripting Interpreter), facilitating threat actor attribution and defensive countermeasure identification. The Diamond Model of Intrusion Analysis (Caltagirone et al., 2013) informed the platform's approach to correlating adversary infrastructure (IP, domain) with malware capabilities (file hash), recognising that these IOC types are facets of the same intrusion activity."),
        bodyPara("The Next.js App Router architecture (introduced in Next.js 13, matured in Next.js 15) was selected over the traditional Pages Router for its support for React Server Components, which enable server-side data fetching with reduced client-side JavaScript bundle sizes. The Recharts library was chosen over D3.js for its React-native API and simpler integration into component-based UI architecture, while providing sufficient chart type variety for the dashboard requirements."),

        heading2("3.6   Project Planning"),
        bodyPara("The project followed an Agile/Scrum methodology with six two-week sprints, each corresponding to a functional phase of platform development:"),
        bodyPara("Sprint 1 (Weeks 1–2): Architecture design, repository setup, MongoDB schema definition, Next.js project scaffolding, JWT authentication system, basic routing structure, and environment configuration."),
        bodyPara("Sprint 2 (Weeks 3–4): Core IOC analysis engine, VirusTotal API client module, GreyNoise API client module, IOC type auto-detection using regex, response normalisation layer, MongoDB caching mechanism, and basic result display components."),
        bodyPara("Sprint 3 (Weeks 5–6): ThreatFox, URLhaus, MalwareBazaar, and IPQS API client modules, Promise.allSettled() parallel orchestration, unified risk score calculation algorithm, search history recording, and IocUserHistory collection implementation."),
        bodyPara("Sprint 4 (Weeks 7–8): Security dashboard with 10+ chart types (area chart, donut chart, bar chart, radar chart, heatmap, composed chart), history page with pagination and filtering, export functionality (CSV/JSON), and skeleton loading system."),
        bodyPara("Sprint 5 (Weeks 9–10): File hash analysis module with MITRE ATT&CK mapping, domain intelligence side panel with WHOIS/DNS/SSL data, PE file structure analysis, sandbox analysis integration, and multi-source correlation panel."),
        bodyPara("Sprint 6 (Weeks 11–12): Security hardening (OWASP Top 10 audit, security headers, SSRF protection, NoSQL injection prevention), performance optimisation (query indexing, lazy loading, bundle analysis), production deployment on Vercel, documentation, and final testing."),
        blankLine(),
        heading3("3.6.2   Effort Estimation"),
        bodyPara("The total effort was estimated at 12 weeks × 40 hours = 480 hours. The breakdown across functional areas was: Backend API Development (35%, ~168 hours), Frontend UI Development (30%, ~144 hours), API Integration and Testing (20%, ~96 hours), Security Hardening and Deployment (10%, ~48 hours), Documentation (5%, ~24 hours)."),
        blankLine(),
        heading3("3.7   Project Scheduling — Sprint Plan"),
        simpleTable(
          ["Task", "Wk1", "Wk2", "Wk3", "Wk4", "Wk5", "Wk6", "Wk7", "Wk8", "Wk9", "Wk10", "Wk11", "Wk12"],
          [
            ["Architecture & DB Schema","X","X","","","","","","","","","",""],
            ["Auth System & Routing","","X","X","","","","","","","","",""],
            ["IOC Engine + VT/GN APIs","","","X","X","","","","","","","",""],
            ["4 Remaining APIs + Cache","","","","X","X","X","","","","","",""],
            ["Dashboard Charts (10+)","","","","","","X","X","X","","","",""],
            ["History Page + Export","","","","","","","X","X","","","",""],
            ["File & Domain Analysis","","","","","","","","","X","X","",""],
            ["Security Hardening","","","","","","","","","","X","X",""],
            ["Deployment & Testing","","","","","","","","","","","X","X"],
          ],
          [Math.floor(CONTENT_W*0.22),...Array(12).fill(Math.floor(CONTENT_W*0.065))]
        ),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 4
        // ════════════════════════════════════════════════════════
        heading1("Chapter 4: System Analysis"),
        blankLine(),
        heading2("4.1   Study of Current System"),
        bodyPara("The existing workflow for IOC investigation in most SOC environments is characterised by manual, tool-fragmented processes that impose significant time costs on analysts. A typical IP address investigation using the current approach requires the analyst to: (1) open VirusTotal in one browser tab and enter the IP address; (2) open GreyNoise Community Search in a second tab; (3) check AbuseIPDB in a third tab; (4) query ThreatFox in a fourth tab; (5) consult Shodan for open port information in a fifth tab; and (6) manually record findings in a spreadsheet or ticketing system. This process, repeated for each IOC in an investigation, consumes an estimated 15–30 minutes per indicator."),
        bodyPara("For file hash investigations, the process is similarly fragmented: VirusTotal for multi-engine scanning, MalwareBazaar for metadata, ThreatFox for IOC tags, and potentially Joe Sandbox or ANY.RUN for dynamic analysis results. The absence of a unified audit trail means that if the same IOC is encountered again in a future investigation, the analyst must repeat the entire querying process — there is no institutional memory or cached result that can be retrieved."),
        bodyPara("Enterprise tools such as Recorded Future, IBM X-Force Exchange, and Mandiant Threat Intelligence do provide unified interfaces, but their subscription costs (typically $30,000–$100,000 per year) place them beyond the reach of small security teams, independent researchers, and educational institutions."),

        heading2("4.2   Problems and Weaknesses of Current System"),
        bodyPara("Six principal weaknesses of the current fragmented approach were identified through research and discussions with the company mentor:"),
        bulletItem("Tool Fragmentation: Analysts must maintain concurrent browser sessions across 5–6 different tools, creating a high cognitive load and increasing the risk of errors in manual result transcription."),
        bulletItem("Time Inefficiency: The manual query-and-correlate workflow requires 15–30 minutes per IOC, making it unscalable for high-volume investigations where hundreds of IOCs may need to be assessed."),
        bulletItem("No Unified Risk Score: Each tool provides its own verdict format (VirusTotal uses malicious/suspicious/harmless/undetected counts; GreyNoise uses classification strings; IPQS uses a 0–100 fraud score). There is no standard metric for comparing the threat level of different IOCs across these sources."),
        bulletItem("No Persistent Search History: Results are not automatically archived. If an analyst needs to reference a previous investigation, they must re-query all sources from scratch."),
        bulletItem("No Integrated Dashboard or Trend Analysis: Individual tools provide point-in-time assessments but no mechanism for visualising threat patterns over time, geographic distribution of malicious IPs, or trending malware families."),
        bulletItem("Cost Barrier for Unified Solutions: Enterprise platforms providing unified intelligence are cost-prohibitive for small teams and individual researchers."),

        heading2("4.3   Requirements of New System"),
        bodyPara("Functional Requirements:"),
        simpleTable(
          ["Req. ID", "Description", "Priority"],
          [
            ["FR-01","Accept multiple IOC types (IP, domain, URL, MD5, SHA1, SHA256) in a single input field","High"],
            ["FR-02","Automatically detect IOC type using regex pattern matching","High"],
            ["FR-03","Query 6 intelligence sources in parallel and return unified verdict within 15 seconds","High"],
            ["FR-04","Calculate automated 0-100 risk score using weighted multi-source algorithm","High"],
            ["FR-05","Cache analysis results in MongoDB with 1-hour TTL to reduce redundant API calls","High"],
            ["FR-06","Record every analysis to IocUserHistory for audit trail and analytics","High"],
            ["FR-07","Provide interactive dashboard with 10+ chart types updated from live DB data","Medium"],
            ["FR-08","Support paginated search history with multi-field filtering and CSV/JSON export","Medium"],
            ["FR-09","Display MITRE ATT&CK technique mapping for file hash analyses","Medium"],
            ["FR-10","Provide domain intelligence panel with WHOIS, DNS, and SSL data","Medium"],
            ["FR-11","Enforce rate limiting (4 searches/min, 100/day) to protect API quota","Medium"],
            ["FR-12","Support public access without mandatory user registration","Low"],
          ],
          [Math.floor(CONTENT_W*0.12), Math.floor(CONTENT_W*0.72), Math.floor(CONTENT_W*0.16)]
        ),
        blankLine(),
        bodyPara("Non-Functional Requirements:"),
        bulletItem("Performance: Full multi-source analysis must complete within 15 seconds for 95% of queries."),
        bulletItem("Reliability: Platform availability of 99.9% via Vercel's serverless deployment infrastructure."),
        bulletItem("Security: All inputs validated and sanitised; JWT authentication; rate limiting; SSRF protection; OWASP Top 10 compliance."),
        bulletItem("Usability: Responsive design supporting desktop (1920px), tablet (1024px), and mobile (375px) viewports."),
        bulletItem("Maintainability: TypeScript throughout with Zod schemas; modular service architecture; comprehensive error handling."),

        heading2("4.4   System Feasibility"),
        bodyPara("Technical Feasibility: All six required threat intelligence APIs are publicly available with free or low-cost API key registration. The Next.js + MongoDB + Vercel stack is a proven combination for production web applications, with extensive community support and comprehensive documentation. TypeScript provides compile-time type safety that reduces runtime errors. The parallel API orchestration approach using Promise.allSettled() is a well-established pattern for fault-tolerant multi-source data aggregation."),
        bodyPara("Economic Feasibility: The development of ThreatLens was achieved at near-zero infrastructure cost. API keys for all six sources were obtained on free or community tiers. MongoDB Atlas M0 (512 MB) was sufficient for the development and initial production phase. Vercel's free tier provided unlimited deployments and global edge distribution. The estimated total recurring operational cost for a low-traffic production deployment is under $0/month on free tiers, with scaling costs commencing only when VirusTotal API quota (4 req/min free tier) is exceeded."),
        bodyPara("Integration Feasibility: All six intelligence sources expose standard RESTful HTTP APIs returning JSON responses, requiring no proprietary SDKs or non-standard protocols. The Next.js API Routes provide a straightforward mechanism for server-side API orchestration. MongoDB Atlas connects via the standard Mongoose ODM with no proprietary connection protocols required."),

        heading2("4.5   Activity in Proposed System"),
        bodyPara("The user interaction flow in ThreatLens proceeds as follows: The analyst navigates to the Analyse page and enters one or more IOC values (newline-separated for batch input). The system auto-detects the IOC type using regex pattern matching. Upon clicking Analyse, the frontend submits a POST request to /api/ioc-v2 with the IOC value and detected type. The API route first checks the IocCache collection for a non-expired cached result. If a cache hit is found, the cached result is returned immediately (typically < 500ms). If no cache exists, the route initiates six parallel API calls using Promise.allSettled(), aggregates the responses, calculates the risk score, stores the result in IocCache and IocUserHistory, and returns the unified analysis to the frontend."),

        heading2("4.6   Features of New System"),
        bodyPara("The ThreatLens platform implements ten core features that collectively address the identified weaknesses of the current fragmented workflow:"),
        bulletItem("Multi-Source Intelligence Aggregation: Simultaneous querying of 6 threat intelligence APIs with parallel execution and fault-tolerant result combination."),
        bulletItem("Automated Risk Scoring: Weighted algorithm producing a 0-100 numerical threat score with severity classification (Low/Medium/High/Critical)."),
        bulletItem("Unified Analysis Interface: Single-page result view presenting all source data in a structured, scannable layout with verdict badge, detection breakdown, threat categories, malware families, MITRE mapping, and geolocation."),
        bulletItem("Real-Time Security Dashboard: 10+ interactive chart types visualising threat trends, geographic distribution, malware family prevalence, detection engine performance, and IOC type distribution."),
        bulletItem("Persistent Search History: MongoDB-backed audit trail with full-text search, multi-field filtering, pagination, and export."),
        bulletItem("File Hash Analysis: Deep file intelligence including PE structure details, cryptographic hash comparison, known filenames, sandbox verdicts, and MITRE ATT&CK technique mapping."),
        bulletItem("Domain Intelligence Panel: Animated slide-in panel with WHOIS registration data, DNS record resolution, SSL certificate details, and reputation summary."),
        bulletItem("TTL-Based Caching: MongoDB cache with 1-hour TTL reducing redundant API calls by ~65% for frequently queried IOCs."),
        bulletItem("Rate Limiting: Application-level rate limiting protecting API quota while ensuring fair usage."),
        bulletItem("Export Functionality: CSV and JSON export of search history and individual analysis results for integration with other security tools."),

        heading2("4.7   Main Modules of System"),
        bodyPara("The ThreatLens platform is decomposed into seven principal modules:"),
        bulletItem("Authentication Module: JWT-based authentication with bcrypt password hashing, token verification middleware, and system-user fallback for public access mode."),
        bulletItem("IOC Analysis Engine Module: Core orchestrator that validates input, checks cache, dispatches parallel API calls, aggregates results, and triggers risk score calculation."),
        bulletItem("API Integration Module: Six dedicated client classes (VTClient, GNClient, TFClient, UHClient, MBClient, IPQSClient) each encapsulating source-specific request formatting, response parsing, and error handling."),
        bulletItem("Dashboard and Visualisation Module: Next.js page consuming aggregated statistics from /api/dashboard-v2, rendering 10+ Recharts components with 30-second polling refresh."),
        bulletItem("History and Search Module: Paginated MongoDB query interface with filter construction, result mapping, and CSV/JSON generation."),
        bulletItem("File Analysis Module: Dedicated handler for hash-type IOCs, extracting PE structure, cryptographic hashes, known filenames, sandbox analysis, and MITRE ATT&CK mapping."),
        bulletItem("Domain Intelligence Module: Server-side RDAP/WHOIS fetch, Node.js dns module for record resolution, crt.sh SSL certificate lookup, and result caching."),

        heading2("4.8   Technology Selection and Justification"),
        bodyPara("Next.js 15 was selected over a separate Express.js backend + Create React App frontend architecture because the unified full-stack framework eliminates the need for CORS configuration, reduces deployment complexity (single application on Vercel versus two separate services), and provides type-safe API routes co-located with the frontend code. The App Router architecture's support for React Server Components enables server-side data fetching for improved initial page load performance."),
        bodyPara("MongoDB was preferred over PostgreSQL for the IOC cache storage because the nested, variable-structure JSON responses from the six threat intelligence APIs map naturally to MongoDB documents without requiring complex relational normalisation. Each API source returns different fields and nested objects, and forcing these into a fixed relational schema would require either extensive denormalisation or frequent schema migrations as new API fields are discovered."),
        bodyPara("Tailwind CSS was selected over Bootstrap or Material UI because its utility-first approach generates significantly smaller production CSS bundles (unused classes are purged at build time) and avoids the opinionated component aesthetics of component libraries that would conflict with the custom design system implemented in colors.ts."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 5
        // ════════════════════════════════════════════════════════
        heading1("Chapter 5: System Design"),
        blankLine(),
        heading2("5.1   System Design and Methodology"),
        bodyPara("ThreatLens employs a layered Client-Server architecture with an API Gateway pattern. The architecture comprises four distinct layers: the Presentation Layer (Next.js frontend with React components), the API Gateway Layer (Next.js API Routes serving as the single entry point for all backend operations), the Service Layer (modular TypeScript services encapsulating business logic for IOC analysis, caching, and history recording), and the Data Layer (MongoDB Atlas accessed via Mongoose ODM)."),
        bodyPara("The request flow for an IOC analysis follows this path: (1) User submits IOC via the ThreatSearchForm component on the /analyze page. (2) Frontend makes a POST request to /api/ioc-v2. (3) The route handler invokes verifyAuth() to validate the JWT token. (4) The validated request body is parsed using Zod schema validation. (5) The IOC type is normalised using the sanitizeIOCType() utility. (6) The IocCache collection is queried for a non-expired result. (7) On cache miss, the multi-source orchestrator dispatches 6 parallel API calls. (8) Results are aggregated, normalised, and scored. (9) The unified result is stored in IocCache and IocUserHistory. (10) The response is returned to the frontend as a standardised ApiResponse object."),

        heading2("5.2   Database Schema Design"),
        bodyPara("IocCache Collection Schema:"),
        simpleTable(
          ["Field", "Type", "Description"],
          [
            ["_id","ObjectId","MongoDB auto-generated primary key"],
            ["value","String","The IOC value (IP, domain, URL, or hash)"],
            ["type","String (enum)","IOC type: ip | domain | url | hash"],
            ["verdict","String","Unified verdict: malicious | suspicious | harmless | undetected | unknown"],
            ["severity","String","Risk level: critical | high | medium | low"],
            ["riskScore","Number (0-100)","Computed weighted risk score"],
            ["riskLevel","String","Human-readable risk level label"],
            ["analysis","Object","Nested document containing all source-specific data"],
            ["analysis.vtData","Object","VirusTotal API response (stats, malware_families, sandbox_verdicts)"],
            ["analysis.greynoiseData","Object","GreyNoise response (classification, noise, riot, country, tags)"],
            ["analysis.ipqsData","Object","IPQS response (fraud_score, proxy, vpn, tor, abuse_velocity)"],
            ["analysis.threatfoxData","Object","ThreatFox response (threat_type, malware, confidence_level, tags)"],
            ["analysis.urlhausData","Object","URLhaus response (threat, url_status, tags, reporter)"],
            ["analysis.malwarebazaarData","Object","MalwareBazaar response (file_type, signature, tags, first_seen)"],
            ["analysis.reputation","Object","Reputation data including geolocation (country, city, ISP, ASN)"],
            ["analysis.mitreAttack","Object","MITRE ATT&CK tactics and techniques array"],
            ["analysis.sandboxAnalysis","Object","Sandbox vendor verdicts and behavioural indicators"],
            ["analysis.domainIntel","Object","WHOIS, DNS records, SSL certificate data (domain type only)"],
            ["sources_available","String[]","Array of sources that returned successful responses"],
            ["sources_failed","String[]","Array of sources that returned errors or timeouts"],
            ["cachedAt","Date","Timestamp of cache creation (TTL index field, expires after 3600s)"],
            ["queryCount","Number","Number of times this cache entry has been retrieved"],
          ],
          [Math.floor(CONTENT_W*0.25), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.55)]
        ),
        blankLine(),
        bodyPara("IocUserHistory Collection Schema:"),
        simpleTable(
          ["Field", "Type", "Description"],
          [
            ["_id","ObjectId","MongoDB auto-generated primary key"],
            ["userId","String","User ID or SYSTEM_USER_ID for public queries"],
            ["value","String","The IOC value queried"],
            ["type","String","IOC type"],
            ["verdict","String","Verdict from analysis"],
            ["label","String","Display label for the verdict"],
            ["source","String","Analysis source: ip_search | domain_search | url_search | hash_search | file_analysis"],
            ["searched_at","Date","Timestamp of the query (indexed for sort)"],
            ["metadata","Object","Optional: filename, filesize, filetype for hash/file queries"],
          ],
          [Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.65)]
        ),
        blankLine(),

        heading2("5.3   Input/Output and Interface Design"),
        bodyPara("Input Design: The primary input mechanism is the ThreatSearchForm component, which provides a full-width text area supporting both single-line and multi-line (newline-separated) IOC input. IOC type is auto-detected using the following regex pattern hierarchy: IPv4 (^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}); IPv6 (contains colons and hex); URL (starts with http:// or https://); MD5 (exactly 32 hex characters); SHA1 (exactly 40 hex characters); SHA256 (exactly 64 hex characters); Domain (all remaining valid hostname patterns). Recent searches are persisted to localStorage for quick re-access."),
        bodyPara("Output Design: Analysis results are presented in a sectioned layout. The Threat Overview card displays a donut chart showing the distribution of malicious/suspicious/harmless/undetected detections alongside a tabular breakdown. The Popular Threat Label card highlights the most commonly identified threat signature. The Detection Names card lists individual engine verdicts in a scrollable list. The Threat Categories card lists detected threat categories. The Malware Family card displays associated malware family names. The Multi-Source Correlation card presents source-specific data in individual sub-cards. The File Information card (hash type only) shows file metadata, cryptographic hashes, and known filenames. The MITRE ATT&CK card presents detected tactics and techniques in an expandable grid."),
        bodyPara("5.3.3  Security: All input values are sanitised by the sanitizeIOCValue() function which strips MongoDB operator characters and enforces maximum length limits. dangerouslySetInnerHTML is never used with user-supplied data. All external URLs in fetch() calls are validated against the SSRF blocklist before dispatch."),

        heading2("5.4   API Design"),
        bodyPara("The ThreatLens backend exposes the following REST API endpoints:"),
        simpleTable(
          ["Endpoint", "Method", "Description", "Auth Required"],
          [
            ["POST /api/ioc-v2","POST","Submit IOC for multi-source analysis","No (system user)"],
            ["GET /api/dashboard-v2","GET","Retrieve aggregated dashboard statistics","No"],
            ["GET /api/history-v2","GET","Retrieve paginated search history","No"],
            ["GET /api/domain-intel","GET","Fetch WHOIS/DNS/SSL for a domain","No"],
            ["POST /api/file-analysis-v2","POST","Detailed file hash analysis","No"],
            ["POST /api/auth/login","POST","Authenticate user, return JWT","No"],
            ["GET /api/auth/me","GET","Validate token, return user info","Yes (JWT)"],
          ],
          [Math.floor(CONTENT_W*0.28), Math.floor(CONTENT_W*0.1), Math.floor(CONTENT_W*0.48), Math.floor(CONTENT_W*0.14)]
        ),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 6
        // ════════════════════════════════════════════════════════
        heading1("Chapter 6: Implementation"),
        blankLine(),
        heading2("6.1   Implementation Platform and Environment"),
        bodyPara("The ThreatLens platform is deployed on Vercel's serverless infrastructure, which provides automatic global edge distribution, zero-configuration SSL/TLS, and automatic scaling from zero to handle traffic spikes. The deployment pipeline is connected to the GitHub repository's main branch — every push to main triggers an automatic build and deployment, with build previews generated for pull requests. The build process includes TypeScript compilation, Tailwind CSS purging, and Next.js bundle optimisation, resulting in a production bundle of approximately 450 KB gzipped."),
        bodyPara("MongoDB Atlas M0 (512 MB, AWS US-East-1) serves as the production database. The connection is established via Mongoose with connection pooling implemented as a module-level singleton to prevent connection exhaustion in serverless environments — a common issue where each function invocation would otherwise create a new connection. The pooling singleton caches the connection across warm invocations of the same serverless function instance."),

        heading2("6.2   Module Implementation Details"),
        bodyPara("IOC Analysis Engine (src/app/api/ioc-v2/route.ts): The POST handler follows the standard route template: (1) auth verification using verifyAuth(), (2) body validation using validateBody() with the IOC Zod schema, (3) type sanitisation using sanitizeIOCType(), (4) rate limit check (4/min, 100/day per IP), (5) cache lookup with IocCache.findOne({ value, type }), (6) on cache miss, parallel dispatch using Promise.allSettled([vtClient.analyze(), gnClient.analyze(), tfClient.analyze(), uhClient.analyze(), mbClient.analyze(), ipqsClient.analyze()]), (7) result aggregation using the normaliser, (8) risk score calculation, (9) storage in IocCache and IocUserHistory, (10) response via ApiResponse.success(result)."),
        bodyPara("Risk Score Calculation Algorithm: The risk score is computed as a weighted average of signals from each available source. VirusTotal detection ratio (malicious / total engines) contributes 40% of the score, VT suspicious ratio contributes 20%, GreyNoise classification (malicious=80, benign=0, unknown=40) contributes 20%, IPQS fraud_score (normalised to 0-100 range) contributes 10%, and ThreatFox confidence_level contributes 10%. If a source is unavailable (error or timeout), its weight is redistributed proportionally among available sources. The resulting 0-100 score maps to severity levels: 0-30 = Low, 31-50 = Medium, 51-75 = High, 76-100 = Critical."),
        bodyPara("API Integration Module (src/lib/api-clients/): Each of the six API client classes extends a common BaseClient abstract class that provides the safeFetch() wrapper, response logging via the logger utility, and error normalisation. The VirusTotal client handles the v3 API's asynchronous analysis pattern (POST submission → GET polling for URL analysis). The GreyNoise client implements the Community API endpoint with HMAC signature authentication. The IPQS client implements URL encoding of the IOC value as a path parameter rather than a query parameter, as required by the API design."),
        bodyPara("Dashboard Module (src/app/dashboard/): The DashboardPageView component fetches data from /api/dashboard-v2 on mount and every 30 seconds using setInterval. The API route aggregates IocUserHistory documents for the selected time range (daily/weekly/monthly) using MongoDB aggregation pipelines, computing verdict distributions, daily trends, geographic distribution, malware family counts, and detection engine statistics. The aggregation results are passed as props to 10+ Recharts components, each wrapped in an ErrorBoundary to prevent individual chart failures from crashing the entire dashboard."),
        bodyPara("File Analysis Module (src/app/api/file-analysis-v2/): For SHA256 hashes, the VirusTotal file report endpoint provides the richest data: PE structure metadata (sections, imports, exports), known filenames, first/last seen timestamps, sandbox verdicts from multiple engines, and raw behaviour tags. The MITRE ATT&CK mapping is performed by a local lookup table that maps VirusTotal behaviour tags (e.g., 'calls-wmi', 'modifies-registry', 'creates-service') to standardised ATT&CK technique IDs and tactic names. The lookup table was compiled from the MITRE ATT&CK Enterprise Matrix and covers 50+ technique mappings across 14 tactics."),
        bodyPara("Domain Intelligence Module (src/app/api/domain-intel/): WHOIS data is retrieved from the RDAP.org API, which provides structured JSON RDAP responses without requiring a dedicated WHOIS parsing library. DNS records are resolved using Node.js's built-in dns module via dns.promises, with separate calls for A, AAAA, MX, NS, and TXT records executed in parallel. SSL certificate data is fetched from crt.sh's JSON API, which aggregates certificate transparency logs and returns certificate metadata without requiring direct TLS connection establishment."),
        bodyPara("Skeleton Loading System (src/components/skeletons/): A centralised skeleton design system was implemented using a SkeletonBase component that applies a CSS shimmer animation (linear gradient sweeping at 1.8-second intervals). Page-level skeleton components (DashboardSkeleton, HistorySkeleton, AnalyzeSkeleton, DetailPanelSkeleton) mirror the exact layout of their corresponding page sections, ensuring that the loading state does not cause layout shift when the actual data renders."),

        heading2("6.3   Key Features Implementation"),
        bodyPara("MITRE ATT&CK Mapping: The mapping algorithm processes behaviour tags extracted from VirusTotal sandbox analysis. Each tag is normalised to lowercase and matched against the lookup table using exact match and substring matching. Matched entries return a technique object containing the technique ID (e.g., T1059), technique name, tactic name, and a description. Multiple behaviours can map to the same technique, in which case the technique is deduplicated and the matching confidence is aggregated. The resulting array of technique objects is organised by tactic for display in the MITRE grid component."),
        bodyPara("Rate Limiting Implementation: Rate limiting is implemented at the /api/ioc-v2 route using an in-memory Map keyed by client IP address (extracted from the x-forwarded-for header, falling back to the direct connection IP). Each entry stores minuteCount, minuteReset (epoch ms), dayCount, and dayReset values. On each request, the minute window is checked and reset if expired, and the day window is checked and reset at midnight. Requests exceeding 4 per minute return a 429 response with a Retry-After header and the countdown in seconds. The rate limit state is exposed to the frontend via X-RateLimit-* response headers, which the RateLimitIndicator component reads to display the live quota display."),
        bodyPara("Centralised Error Handling: The ApiResponse factory (src/lib/api-response.ts) provides typed response constructors (success, badRequest, unauthorized, forbidden, notFound, tooManyRequests, serverError) that ensure all API responses follow the consistent shape { success: boolean, data?: T, error?: string, message?: string }. The structured logger (src/lib/logger.ts) prefixes all log entries with [TIMESTAMP] [LEVEL] [ROUTE] and automatically redacts sensitive fields (api_key, password, token, authorization) before logging, preventing credential exposure in production logs."),

        heading2("6.4   Results and Outcomes"),
        bodyPara("The ThreatLens platform was successfully deployed to production on Vercel at the conclusion of the 12-week internship, achieving all eight stated project objectives. Quantitative outcomes include:"),
        simpleTable(
          ["Metric", "Target", "Achieved"],
          [
            ["Full multi-source analysis time","< 15 seconds","8–12 seconds average"],
            ["Cache hit ratio","≥ 50%","~65% for repeat queries"],
            ["Dashboard chart types","≥ 10","12 distinct chart types implemented"],
            ["API sources integrated","6","6 (VT, GN, TF, UH, MB, IPQS)"],
            ["MITRE ATT&CK technique mappings","≥ 30","52 technique mappings across 14 tactics"],
            ["IOC types supported","4 (IP, domain, URL, hash)","7 (IPv4, IPv6, domain, URL, MD5, SHA1, SHA256)"],
            ["Security vulnerabilities (OWASP Top 10)","0 critical","0 critical, 0 high in final build"],
            ["Production deployment","Vercel","Deployed and operational"],
            ["Lighthouse Performance Score","≥ 80","87 (desktop), 74 (mobile)"],
            ["Lighthouse Accessibility Score","≥ 80","82 (desktop and mobile)"],
          ],
          [Math.floor(CONTENT_W*0.35), Math.floor(CONTENT_W*0.3), Math.floor(CONTENT_W*0.35)]
        ),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 7
        // ════════════════════════════════════════════════════════
        heading1("Chapter 7: Testing"),
        blankLine(),
        heading2("7.1   Testing Strategy"),
        bodyPara("A multi-tiered testing strategy was employed to validate the correctness, security, performance, and usability of the ThreatLens platform across all functional modules. The testing approach combined manual functional testing, security-focused negative testing, performance profiling, and cross-browser compatibility testing."),
        bodyPara("Unit Testing focused on individual API route handlers and utility functions. Each API client module was tested independently using mocked HTTP responses to validate request formatting, response parsing, and error handling without incurring actual API quota consumption. Integration Testing validated the end-to-end IOC analysis flow from frontend submission through cache lookup, parallel API dispatch, result aggregation, MongoDB storage, and response delivery. Performance Testing measured API response times under concurrent load using manual timing and MongoDB Atlas performance advisor metrics. Security Testing included manual OWASP Top 10 checks: injection attempts (NoSQL operator injection in IOC values), authentication bypass attempts (expired tokens, missing tokens, tampered payloads), rate limit enforcement validation, and SSRF attempt testing with internal IP addresses."),

        heading2("7.2   Test Cases"),
        simpleTable(
          ["Test ID", "Module", "Condition", "Input", "Expected", "Actual", "Status"],
          [
            ["TC-01","IOC Detection","Valid IPv4","8.8.8.8","type=ip","type=ip","Pass"],
            ["TC-02","IOC Detection","Valid domain","google.com","type=domain","type=domain","Pass"],
            ["TC-03","IOC Detection","Valid SHA256","a".repeat(64),"type=hash","type=hash","Pass"],
            ["TC-04","IOC Detection","Invalid input","notanIOC!","type=unknown","type=unknown","Pass"],
            ["TC-05","Cache","Cache hit","Previously queried IP","Response < 500ms","320ms avg","Pass"],
            ["TC-06","Cache","Cache miss","New IP","6 API calls dispatched","Confirmed","Pass"],
            ["TC-07","Rate Limit","5th request in 1 min","Valid IOC","429 Too Many Requests","429 returned","Pass"],
            ["TC-08","Rate Limit","Request after reset","Valid IOC after 60s","200 Success","200 returned","Pass"],
            ["TC-09","Auth","Expired JWT","Token exp in past","401 Unauthorized","401 returned","Pass"],
            ["TC-10","Auth","Missing token","No Authorization header","System user fallback","Fallback used","Pass"],
            ["TC-11","Security","NoSQL injection","{ $gt: '' }","Sanitised to string","Sanitised","Pass"],
            ["TC-12","Security","SSRF attempt","http://127.0.0.1","blocked_url error","Blocked","Pass"],
            ["TC-13","Security","SSRF internal IP","http://169.254.169.254","blocked_url error","Blocked","Pass"],
            ["TC-14","Dashboard","Empty history","0 IocUserHistory docs","NoGraphData shown","NoGraphData shown","Pass"],
            ["TC-15","History","Page 2 of results","page=2&limit=10","Records 11-20","Correct records","Pass"],
            ["TC-16","History","Filter by malicious","verdict=malicious","Only malicious records","Correct filter","Pass"],
            ["TC-17","File Analysis","Unknown hash","Zero-byte file hash","NoGraphData shown","NoGraphData shown","Pass"],
            ["TC-18","Domain Intel","No WHOIS data","domain with no RDAP","Partial result returned","Partial returned","Pass"],
            ["TC-19","API","VirusTotal unavailable","VT API key invalid","Partial result (5 sources)","5 sources returned","Pass"],
            ["TC-20","Export","CSV export","Click Export CSV","Valid CSV file downloaded","Downloaded","Pass"],
            ["TC-21","UI","Mobile responsive","375px viewport","No horizontal scroll","Confirmed","Pass"],
            ["TC-22","UI","Skeleton loading","Slow connection","Skeleton shown during fetch","Skeleton shown","Pass"],
          ],
          [Math.floor(CONTENT_W*0.09), Math.floor(CONTENT_W*0.12), Math.floor(CONTENT_W*0.16), Math.floor(CONTENT_W*0.12), Math.floor(CONTENT_W*0.17), Math.floor(CONTENT_W*0.17), Math.floor(CONTENT_W*0.1)]
        ),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // CHAPTER 8
        // ════════════════════════════════════════════════════════
        heading1("Chapter 8: Conclusion and Discussion"),
        blankLine(),
        heading2("8.1   Overall Analysis of Internship / Project Viabilities"),
        bodyPara("The 12-week internship at ForensicCyberTech culminated in the successful delivery of ThreatLens — a production-deployed, fully functional Cyber Threat Intelligence platform that achieved all eight stated project objectives. The platform demonstrates that unified threat intelligence aggregation can be achieved cost-effectively using open-source technologies and free-tier APIs, challenging the assumption that enterprise-grade CTI capabilities are accessible only to well-resourced organisations."),
        bodyPara("From a technical viability standpoint, the platform's architecture — Next.js 15 App Router with MongoDB Atlas and Vercel deployment — proved robust and scalable for the target use case. The parallel API orchestration approach achieved the sub-15-second analysis target for 95% of queries, with the average response time of 8–12 seconds being competitive with commercial alternatives. The MongoDB TTL cache achieved a ~65% hit ratio for repeat queries, significantly reducing API quota consumption and improving response times for frequently investigated IOCs."),
        bodyPara("The internship experience provided the author with practical competencies in full-stack Next.js development, REST API integration at scale, NoSQL database design and optimisation, JWT security implementation, OWASP-compliant secure coding practices, and production deployment on cloud infrastructure. These competencies directly align with industry demand for full-stack JavaScript engineers in cybersecurity product companies, and the ThreatLens project serves as a demonstrable portfolio artifact."),
        bodyPara("The additional four weeks (Sprints 5 and 6) compared to the original planned scope enabled the delivery of the most sophisticated features — the file hash analysis module with MITRE ATT&CK mapping, the domain intelligence panel, the centralised skeleton loading system, and the comprehensive security hardening pass. These features transformed ThreatLens from a functional prototype into a production-quality platform suitable for real-world security operations use."),

        heading2("8.4   Dates of Continuous Evaluation"),
        bodyPara("Continuous Evaluation I (CE-I) was conducted on 20th January 2026, at the end of Sprint 2. The evaluation session included a live demonstration of the core IOC analysis engine with VirusTotal and GreyNoise integration, the MongoDB caching mechanism, and the basic result display interface. Feedback from the internal guide included recommendations to improve the visual presentation of detection statistics and to add loading indicators during API calls. These recommendations were incorporated into Sprint 3."),
        bodyPara("Continuous Evaluation II (CE-II) was conducted on 25th February 2026, at the end of Sprint 4. The full dashboard (10 chart types), history page with filtering and export, and the skeleton loading system were demonstrated. Feedback focused on the need for comprehensive security testing and formal documentation of the API design. These inputs guided the Sprint 5 and Sprint 6 work plans."),
        bodyPara("A final review session was conducted on 26th March 2026, one day before the internship conclusion, where the complete platform including the file analysis module, domain intelligence panel, and OWASP security hardening was demonstrated to both the company mentor and the internal guide via video conference."),

        heading2("8.5   Problems Encountered and Possible Solutions"),
        bodyPara("During the 12-week internship, six significant technical challenges were encountered and resolved:"),
        bodyPara("Problem 1 — VirusTotal API Rate Limit (4 req/min free tier): The VirusTotal free tier API limits requests to 4 per minute, creating a bottleneck when multiple users submit IOCs simultaneously. Solution: Implemented an application-level rate limiter that enforces a 4 searches per minute limit per client IP address, ensuring that the VT API quota is never exceeded. The in-memory rate limit Map is reset on server restart, which is acceptable for the current traffic volume. For production scaling, a Redis-backed rate limiter with persistent counters would be required."),
        bodyPara("Problem 2 — Inconsistent API Response Schemas: Each of the six API sources returns responses with different JSON structures, field names, and nested object depth. Solution: Developed six dedicated normaliser functions (one per source) that map source-specific fields to a unified internal schema. Each normaliser uses safe optional chaining (?.) throughout to handle missing nested fields without throwing null reference errors."),
        bodyPara("Problem 3 — MongoDB Connection Exhaustion in Serverless: Vercel's serverless function model creates new function instances for each concurrent request, and each instance was initially creating a new Mongoose connection, potentially exhausting the MongoDB Atlas M0 connection limit of 500. Solution: Implemented a module-level connection singleton using a global variable that caches the Mongoose connection object across warm function invocations. Cold starts create a new connection; warm invocations reuse the cached connection."),
        bodyPara("Problem 4 — SSRF Vulnerability in Domain Intelligence Fetcher: The initial implementation of the domain intelligence fetcher accepted the domain name as a URL path component and constructed the RDAP fetch URL directly, creating a potential SSRF vulnerability where a crafted domain name could redirect the server to internal IP addresses. Solution: Implemented the safeFetch() utility with a URL validation function that parses the constructed URL using the WHATWG URL API, extracts the hostname, and checks it against a comprehensive blocklist of private IP ranges and loopback addresses before allowing the fetch to proceed."),
        bodyPara("Problem 5 — Next.js Cold Start Latency: On Vercel's free tier, serverless functions experience cold start latency of 500ms–2 seconds when a function instance has been idle. Combined with the parallel API call time, this could push total response time above the 15-second target for cold starts. Solution: Implemented aggressive response caching (MongoDB TTL cache for analysis results, 30-second in-memory cache for dashboard statistics) and lazy loading of heavy chart components to reduce the critical path render time. The connection pooling singleton also reduces cold start overhead by skipping new connection establishment for warm instances."),
        bodyPara("Problem 6 — Large Client-Side Bundle Size: The initial build included all Recharts chart components in the main bundle, resulting in a 1.2 MB client-side JavaScript bundle that impacted initial page load performance (Lighthouse performance score: 62). Solution: Implemented Next.js dynamic imports with loading={false} for all chart components, ensuring that chart code is only loaded when the dashboard page is visited. Post-optimisation bundle size was reduced to approximately 450 KB gzipped, improving the Lighthouse performance score to 87 on desktop."),

        heading2("8.6   Summary of Internship Work"),
        bodyPara("The 12-week internship at ForensicCyberTech was structured into six two-week sprints, with the following work completed each week:"),
        bodyPara("Weeks 1–2 (Sprint 1): Configured the development environment (Node.js v20, VS Code, MongoDB Compass, Git). Designed the MongoDB schema for IocCache and IocUserHistory collections. Scaffolded the Next.js 15 App Router project with TypeScript. Implemented JWT authentication (login, token generation, verification middleware). Created the basic routing structure (analyze, dashboard, history, about pages). Established the Vercel deployment pipeline connected to the GitHub repository."),
        bodyPara("Weeks 3–4 (Sprint 2): Implemented the VirusTotal API client module (v3 API, IP/domain/URL/file hash endpoints). Implemented the GreyNoise API client module (Community API). Built the IOC type auto-detection function using regex. Created the multi-source orchestrator with Promise.allSettled(). Implemented the MongoDB cache lookup and storage functions. Built the basic ThreatOverviewCard and DetectionNamesCard components."),
        bodyPara("Weeks 5–6 (Sprint 3): Implemented the ThreatFox, URLhaus, MalwareBazaar, and IPQS API client modules. Developed the response normalisation layer for all six sources. Implemented the weighted risk score calculation algorithm. Built the IocUserHistory recording function. Completed the ThreatVectorGrid, PopularThreatLabel, and MultiSourceDataCard components. Conducted CE-I evaluation and incorporated feedback."),
        bodyPara("Weeks 7–8 (Sprint 4): Built the security dashboard with 10+ Recharts chart components (ThreatTrendChart AreaChart, ThreatTypePieChart donut, IOCTypeDistributionChart, ThreatSeverityChart, GeographicDistributionChart, MalwareFamiliesChart, DetectionEnginePerformanceChart, RiskScoreTrend ComposedChart, TopThreatsGraph, RealTimeThreatFeed). Implemented the /api/dashboard-v2 endpoint with MongoDB aggregation pipelines. Built the history page with pagination, multi-field filtering, and CSV/JSON export."),
        bodyPara("Weeks 9–10 (Sprint 5): Built the file hash analysis module with PE structure parsing, cryptographic hash display, and sandbox verdict aggregation. Implemented the MITRE ATT&CK mapping lookup table and display grid. Built the domain intelligence side panel with RDAP/DNS/SSL fetching via the /api/domain-intel endpoint. Implemented the centralised skeleton loading system. Conducted CE-II evaluation."),
        bodyPara("Weeks 11–12 (Sprint 6): Conducted a comprehensive OWASP Top 10 security audit. Implemented security headers in next.config.js. Fixed NoSQL injection prevention in all MongoDB queries. Implemented SSRF protection in safeFetch(). Performed bundle size optimisation using dynamic imports. Resolved all 22 test cases in the testing suite. Finalised production deployment. Completed internship report documentation. Conducted final review session on 26th March 2026."),

        heading2("8.7   Limitation and Future Enhancement"),
        bodyPara("Current Limitations: The platform's dependence on free-tier API access imposes rate limits that restrict its use in high-volume production environments. VirusTotal's 4 requests/minute free tier limit is the primary constraint, as it limits the platform to a maximum of 240 analyses per hour in single-user mode. The in-memory rate limiter is reset on server restart and does not persist across multiple Vercel serverless function instances, meaning that the rate limit could theoretically be circumvented by routing requests to different instances. The MongoDB Atlas M0 free tier's 512 MB storage limit will be reached after approximately 50,000 IOC analyses, requiring an upgrade to a paid tier for sustained operation. The MITRE ATT&CK mapping is based on a static lookup table rather than a dynamic model, meaning that new techniques introduced after the table's last update will not be mapped."),
        bodyPara("Future Enhancements: Seven major enhancement directions have been identified for future development iterations. (1) Integration with SIEM platforms (Splunk, QRadar, Elastic SIEM) via standardised STIX/TAXII feeds would enable ThreatLens to consume and contribute to enterprise threat intelligence workflows. (2) A machine learning-based threat prediction model trained on the IocUserHistory corpus could provide predictive risk scoring for IOCs not yet known to any of the six integrated sources. (3) Automated IOC feed ingestion from RSS, TAXII, and threat sharing platforms (MISP, OpenCTI) would enable proactive identification of emerging threats before analyst query. (4) Bulk CSV file upload for batch IOC analysis would serve the use case of investigating large numbers of IOCs extracted from firewall logs or IDS alerts. (5) A browser extension for one-click IOC analysis from any webpage would dramatically reduce the friction of threat intelligence lookup during routine browsing. (6) Team collaboration features including shared workspaces, annotation capabilities, and investigation case management would support SOC team workflows. (7) A mobile application built on React Native would extend the platform's reach to field investigators and incident responders who need mobile access to threat intelligence data."),
        pageBreak(),

        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ADDITIONAL CHAPTER: THREAT INTELLIGENCE DEEP DIVE
        // ════════════════════════════════════════════════════════
        heading1("Chapter 9: Threat Intelligence Concepts and Framework Analysis"),
        blankLine(),
        heading2("9.1   Introduction to Cyber Threat Intelligence"),
        bodyPara("Cyber Threat Intelligence (CTI) is the discipline of collecting, processing, and analysing information about potential or current attacks that threaten an organisation. Unlike raw data or security event logs, intelligence is information that has been refined, contextualised, and evaluated to support specific decision-making processes. In the context of ThreatLens, the platform transforms raw API responses — detection counts, IP classifications, malware tags — into contextualised intelligence by applying the risk scoring algorithm, severity classification, and MITRE ATT&CK mapping to produce a unified, actionable verdict."),
        bodyPara("The intelligence cycle — a framework borrowed from military and government intelligence practice — provides a structured model for understanding how raw data becomes actionable intelligence. The six phases of the intelligence cycle are: (1) Planning and Direction, where intelligence requirements are defined; (2) Collection, where data is gathered from relevant sources; (3) Processing, where collected data is normalised and formatted; (4) Analysis, where processed data is evaluated and contextualised; (5) Dissemination, where finished intelligence is delivered to decision-makers; and (6) Feedback, where the utility of the intelligence is assessed. ThreatLens implements phases 2 through 5 of this cycle automatically for each IOC query."),
        bodyPara("The three primary categories of CTI are: Strategic Intelligence (high-level assessments of threat landscape trends, attacker motivations, and geopolitical context — primarily consumed by executives and policy makers); Operational Intelligence (information about specific attacks, threat actor campaigns, and TTPs — consumed by SOC managers and incident response team leads); and Tactical Intelligence (specific, technically detailed IOCs such as IP addresses, domains, hashes, and signatures — consumed directly by security analysts and automated detection systems). ThreatLens primarily operates at the tactical intelligence level, providing immediate IOC verdicts, but the dashboard's temporal and geographic trend analysis provides elements of operational intelligence."),

        heading2("9.2   Indicators of Compromise — Classification and Taxonomy"),
        bodyPara("Indicators of Compromise (IOCs) are forensic artefacts or observable patterns that, with high confidence, indicate that a system has been compromised or attacked. The concept was formalised by Mandiant analyst Grugq in the early 2010s and has since become a cornerstone of threat intelligence sharing. IOCs are categorised along two principal dimensions: their technical type and their volatility (how quickly they change and therefore how quickly they become obsolete)."),
        bodyPara("By technical type, IOCs are classified as: (1) Network Indicators — IP addresses, domain names, URLs, email addresses, network traffic signatures; (2) Host Indicators — file hashes (MD5, SHA1, SHA256), registry keys, file paths, process names, mutexes; (3) Artefact Indicators — malware samples, exploit documents, configuration files; and (4) Behavioural Indicators — API call sequences, memory injection patterns, network communication patterns. ThreatLens directly supports four of the most operationally significant IOC types: IP addresses (network indicator), domain names (network indicator), URLs (network indicator), and file hashes (host indicator)."),
        bodyPara("By volatility, the security researcher David Bianco popularised the Pyramid of Pain model, which ranks IOC types by how much difficulty an attacker faces when defenders successfully identify and block each type. At the base of the pyramid (easiest for attackers to change, least painful to them) are hash values — a trivial recompilation or binary modification changes the hash. Above that are IP addresses and domain names, which require moderate effort to change infrastructure. At the apex (hardest to change, most painful to attackers) are TTPs (Tactics, Techniques, and Procedures), which represent the attacker's fundamental methodology. ThreatLens addresses the lower-middle portion of the pyramid, focusing on the IOC types that are most readily actionable in automated detection workflows."),
        simpleTable(
          ["IOC Type", "Pyramid Level", "Change Difficulty", "ThreatLens Support", "Primary Sources"],
          [
            ["File Hash (MD5/SHA1/SHA256)","1 - Trivial","Recompile or modify binary","Full (file analysis module)","VirusTotal, MalwareBazaar, ThreatFox"],
            ["IP Address","2 - Easy","Rotate infrastructure","Full (IP analysis)","VirusTotal, GreyNoise, IPQS, ThreatFox"],
            ["Domain Name","3 - Moderate","Register new domain","Full (domain analysis)","VirusTotal, URLhaus, ThreatFox"],
            ["URL","3 - Moderate","Modify path or subdomain","Full (URL analysis)","VirusTotal, URLhaus"],
            ["Network Artifacts","4 - Hard","Modify C2 protocol","Partial (via VirusTotal)","VirusTotal sandbox"],
            ["Host Artifacts","4 - Hard","Modify implant behaviour","Partial (MITRE mapping)","VirusTotal sandbox, MalwareBazaar"],
            ["Tactics/Techniques","5 - Very Hard","Fundamental methodology change","Partial (MITRE ATT&CK)","VirusTotal behaviour tags"],
          ],
          [Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.27)]
        ),
        blankLine(),

        heading2("9.3   MITRE ATT&CK Framework — Detailed Analysis"),
        bodyPara("The MITRE ATT&CK (Adversarial Tactics, Techniques, and Common Knowledge) framework is a globally accessible, publicly available knowledge base of adversary tactics and techniques based on real-world observations of cyber attacks. First published by MITRE Corporation in 2013, ATT&CK has become the de facto standard for describing adversary behaviour in the cybersecurity industry, with adoption by organisations including the US Department of Defence, the European Union Agency for Cybersecurity (ENISA), and thousands of commercial enterprises."),
        bodyPara("The ATT&CK Enterprise Matrix organises adversary behaviours into 14 tactical categories, each representing a high-level objective that an attacker aims to achieve. Within each tactic, specific techniques describe the precise methods an attacker may use to accomplish that objective. Techniques may have sub-techniques that provide additional specificity. As of the ATT&CK v14 release (October 2023), the Enterprise Matrix contains 196 techniques and 411 sub-techniques."),
        bodyPara("The 14 tactical categories implemented in ThreatLens's MITRE mapping module are: (1) Reconnaissance — gathering information prior to attack; (2) Resource Development — establishing infrastructure and acquiring capabilities; (3) Initial Access — gaining entry to the target environment; (4) Execution — running adversary code on target systems; (5) Persistence — maintaining foothold across system restarts; (6) Privilege Escalation — gaining elevated permissions; (7) Defense Evasion — avoiding detection by security tools; (8) Credential Access — stealing account credentials; (9) Discovery — learning about the target environment; (10) Lateral Movement — moving through the network to reach target systems; (11) Collection — gathering data of interest; (12) Command and Control — communicating with compromised systems; (13) Exfiltration — stealing data from the target environment; and (14) Impact — disrupting, destroying, or manipulating systems and data."),
        simpleTable(
          ["Tactic ID", "Tactic Name", "ThreatLens Detection Examples", "Technique Count (v14)"],
          [
            ["TA0043","Reconnaissance","WHOIS queries, port scanning IOCs","10"],
            ["TA0042","Resource Development","C2 infrastructure domains, bulletproof hosting IPs","7"],
            ["TA0001","Initial Access","Phishing URLs, exploit delivery domains","9"],
            ["TA0002","Execution","Script execution via PowerShell (T1059.001), WMI (T1047)","14"],
            ["TA0003","Persistence","Registry run keys, scheduled task creation","19"],
            ["TA0004","Privilege Escalation","Token impersonation, UAC bypass artefacts","13"],
            ["TA0005","Defense Evasion","Obfuscation, LOLBIN usage, sandbox evasion","42"],
            ["TA0006","Credential Access","Keylogger artefacts, credential dumping hashes","17"],
            ["TA0007","Discovery","System enumeration, network scanning","31"],
            ["TA0008","Lateral Movement","Pass-the-hash, SMB propagation artefacts","9"],
            ["TA0009","Collection","Clipboard capture, screenshot artefacts","17"],
            ["TA0011","Command and Control","C2 beacon domains, DNS tunnelling IPs","16"],
            ["TA0010","Exfiltration","Data staging artefacts, encrypted upload patterns","9"],
            ["TA0040","Impact","Ransomware hashes, wiper file artefacts","14"],
          ],
          [Math.floor(CONTENT_W*0.12), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.53), Math.floor(CONTENT_W*0.15)]
        ),
        blankLine(),

        heading2("9.4   Threat Intelligence Sources — Technical Comparison"),
        bodyPara("A detailed technical analysis of each intelligence source integrated into ThreatLens reveals distinct strengths and optimal use cases that justify the multi-source aggregation approach:"),
        bodyPara("VirusTotal (Google LLC): VirusTotal was founded in 2004 by the Spanish company Hispasec Sistemas and acquired by Google in 2012. It operates as a free online service that aggregates detection results from 70+ antivirus engines, URL scanners, and sandbox analysis systems. For file analysis, VirusTotal is unmatched in its breadth of detection coverage — submitting a file hash queries the detection databases of Kaspersky, Symantec, Microsoft Defender, CrowdStrike, and 67+ other vendors simultaneously. The v3 API provides rich metadata including first/last seen timestamps, file type signatures, PE structure headers, import tables, and sandbox behaviour reports from multiple analysis environments (Tria.ge, VirusTotal Jujubox, etc.). The primary limitation is the free tier's rate limit of 4 API requests per minute."),
        bodyPara("GreyNoise Intelligence: GreyNoise was founded in 2017 with the specific mission of reducing alert fatigue by distinguishing between internet background noise (automated scanners, search engine crawlers, security researchers) and genuinely malicious traffic. GreyNoise operates a global network of passive sensors that observe unsolicited inbound traffic, building a continuously updated database of IP addresses engaged in mass internet scanning. The classification system divides IPs into three categories: 'benign' (known legitimate scanners like Shodan, Rapid7), 'malicious' (IPs observed engaging in clearly malicious activity), and 'unknown' (IPs not observed by GreyNoise sensors). The 'riot' flag identifies IPs belonging to common business services (CDNs, SaaS platforms) that should never be flagged as suspicious. For SOC analysts, GreyNoise data is particularly valuable for filtering out the background noise that would otherwise consume analyst time with benign alerts."),
        bodyPara("ThreatFox (abuse.ch): ThreatFox is a free, community-driven platform for sharing IOCs associated with malware. Maintained by abuse.ch (a Swiss non-profit research project), ThreatFox provides structured IOC data with malware family labels, confidence scores, and tag annotations. Submissions come from security researchers, threat analysts, and automated malware analysis pipelines. The platform's particular strength is its association of specific IOCs with named malware families (Emotet, Cobalt Strike, Qakbot, etc.), enabling analysts to quickly determine not just whether an IOC is malicious but which specific threat actor or malware family it is associated with."),
        bodyPara("URLhaus (abuse.ch): URLhaus is abuse.ch's platform for collecting and sharing URLs that are being actively used to distribute malware. The database is populated by a combination of automated crawlers and community submissions, with each URL entry tagged with the malware type being distributed (e.g., 'malware_download', 'botnet_cc'), the online/offline status of the URL, and reporter identification. URLhaus is particularly valuable for phishing and malware distribution URL analysis, providing context that VirusTotal's URL scanner does not always capture for very recently registered malicious URLs."),
        bodyPara("MalwareBazaar (abuse.ch): MalwareBazaar is abuse.ch's repository for malware samples, providing file hash lookups that return metadata including file type, signature (vendor-specific detection name), first seen timestamp, known filenames, tags, and reporter information. Unlike VirusTotal, MalwareBazaar focuses exclusively on confirmed malware samples rather than providing multi-engine detection counts, making it a high-precision (lower recall) source — if an IOC is found in MalwareBazaar, it is almost certainly malicious."),
        bodyPara("IP Quality Score (IPQS): IPQS provides risk scoring for IP addresses, URLs, email addresses, and phone numbers, with a particular focus on fraud detection use cases. The fraud_score field (0-100) aggregates signals from proxy/VPN detection, Tor exit node identification, abuse velocity tracking, and device fingerprinting to produce a composite fraud risk score. The proxy, vpn, and tor boolean fields are particularly useful for identifying traffic originating from anonymisation infrastructure — a common indicator of malicious or fraudulent activity. IPQS maintains its own proprietary database of known proxy and VPN services, supplemented by real-time detection algorithms."),

        heading2("9.5   The Cyber Kill Chain and IOC Mapping"),
        bodyPara("The Cyber Kill Chain model, developed by Lockheed Martin in 2011 (Hutchins et al., 2011), describes the seven stages of a targeted cyber attack: (1) Reconnaissance, (2) Weaponisation, (3) Delivery, (4) Exploitation, (5) Installation, (6) Command and Control, and (7) Actions on Objectives. Each stage of the kill chain produces characteristic IOCs that can be detected using the intelligence sources integrated into ThreatLens."),
        bodyPara("During the Reconnaissance phase, attackers may use WHOIS queries, DNS enumeration, and port scanning to gather information about the target. IP addresses of known scanning tools and infrastructure used for reconnaissance can be identified using GreyNoise, which classifies scanner IPs and tags them with the scanning software they are running. During the Delivery phase, attackers deploy phishing emails with malicious URLs or attachments. The URLs can be identified using URLhaus and VirusTotal URL analysis; the attachments can be identified by their file hashes using VirusTotal and MalwareBazaar. The Command and Control phase involves the malware communicating with attacker-controlled infrastructure. C2 domains and IP addresses can be identified using ThreatFox's IOC database, which maintains a curated list of active C2 infrastructure associated with specific malware families."),
        simpleTable(
          ["Kill Chain Stage", "IOC Types Generated", "ThreatLens Sources", "Example Indicators"],
          [
            ["Reconnaissance","IP addresses of scanners","GreyNoise, IPQS","Shodan scan IPs, Censys crawler IPs"],
            ["Weaponisation","File hashes of exploit kits","VirusTotal, MalwareBazaar","Office macro hashes, PDF exploit hashes"],
            ["Delivery","Phishing URLs, attachment hashes","URLhaus, VirusTotal","typosquatted domains, .doc/.xls hashes"],
            ["Exploitation","Exploit file hashes","VirusTotal, MalwareBazaar","CVE PoC file hashes, shellcode hashes"],
            ["Installation","Malware file hashes","VirusTotal, MalwareBazaar, ThreatFox","RAT/backdoor SHA256 hashes"],
            ["Command & Control","C2 IP addresses, C2 domains","ThreatFox, GreyNoise, VirusTotal","Cobalt Strike beacon domains/IPs"],
            ["Actions on Objectives","Exfil server IPs/domains","VirusTotal, ThreatFox, IPQS","Data exfiltration server IPs"],
          ],
          [Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.25), Math.floor(CONTENT_W*0.35)]
        ),
        blankLine(),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ADDITIONAL CHAPTER: FRONTEND ARCHITECTURE DEEP DIVE
        // ════════════════════════════════════════════════════════
        heading1("Chapter 10: Frontend Architecture and UI/UX Design"),
        blankLine(),
        heading2("10.1   Next.js 15 App Router Architecture"),
        bodyPara("The ThreatLens frontend is built on Next.js 15's App Router, which represents a significant architectural evolution from the traditional Pages Router. The App Router introduces React Server Components (RSC) as the default rendering model, enabling components to fetch data directly on the server without requiring client-side JavaScript. This eliminates the need for separate API calls for initial page data in many cases, reducing the number of network round trips required before a page becomes interactive."),
        bodyPara("The directory structure under src/app/ follows the file-system-based routing convention of the App Router. Each route segment is a directory containing a page.tsx file (the route's UI component), a layout.tsx file (shared UI wrapper for the route and its children), and optionally a loading.tsx file (automatic Suspense boundary for the route) and an error.tsx file (error boundary for the route). API routes are co-located in src/app/api/ directories, each containing a route.ts file that exports named HTTP method handler functions (GET, POST, PUT, DELETE)."),
        bodyPara("The root layout (src/app/layout.tsx) defines the document shell, metadata configuration, and global context providers. The MainLayout component wraps all page content with the sidebar navigation and header components, while individual page layouts add page-specific padding and maximum width constraints. This layered layout system ensures consistent visual structure across all pages while allowing page-specific customisation."),
        bodyPara("Client components (those requiring browser-side interactivity such as state management, event handlers, and browser APIs) are explicitly marked with the 'use client' directive at the top of the file. This explicit opt-in to client-side rendering is a departure from the Previous Pages Router model where all components were client components by default, and it enables the framework to optimise the server-rendered portions of the UI for performance. In ThreatLens, the analysis form, all chart components, and all animated components are client components, while page wrappers and static content sections are server components."),

        heading2("10.2   Component Architecture and Design System"),
        bodyPara("The ThreatLens frontend follows a layered component architecture that separates concerns between data, presentation, and interaction. At the foundation is the Design Token Layer, defined in src/lib/colors.ts, which exports named color constants (APP_COLORS, CHART_COLORS, RISK_COLORS) that serve as the single source of truth for all visual styling decisions. Every component in the application imports from this file rather than using hardcoded color values, ensuring that the entire application's visual theme can be updated by modifying a single file."),
        bodyPara("The Component Layer is organised into four categories: (1) Primitive Components (SkeletonBase, ScrollArea, ErrorBoundary) that provide fundamental building blocks used across the application; (2) Layout Components (MainLayout, Sidebar, Header) that define the application shell; (3) Feature Components (ThreatSearchForm, ThreatOverviewCard, DashboardPageView) that implement specific product features; and (4) Brand Components (VigilanceLogo, ThreatLensAnimatedIcon) that implement brand identity elements. Each component is designed to be self-contained, with explicit prop interfaces defined using TypeScript interfaces, ensuring type safety at the component boundary."),
        bodyPara("The CardShell component serves as the design system's primary composition unit for all content cards throughout the application. It accepts standardised props for title, icon, iconColor, badge, meta, and collapsible state, ensuring that every card in the application has a consistent header layout and spacing. This centralised card wrapper significantly reduced code duplication across the 12+ card components in the analysis and dashboard pages."),
        simpleTable(
          ["Component Category", "Key Components", "Props Standardisation", "Reuse Count"],
          [
            ["Skeleton System","SkeletonBase, SkeletonCard, SkeletonLine, SkeletonBadge, DashboardSkeleton, HistorySkeleton, AnalyzeSkeleton","ShimmerProps interface","15+ usages"],
            ["Card System","CardShell, ThreatOverviewCard, DetectionNamesCard, PopularThreatLabel, MultiSourceDataCard","CardShellProps interface","12 card components"],
            ["Chart System","ThreatTrendChart, ThreatTypePieChart, MalwareFamiliesChart, DetectionEngineChart","ChartProps with data + loading props","12 charts"],
            ["Navigation","Sidebar, Header, VigilanceLogo","VigilanceLogoProps with variant/size/theme","6 usages"],
            ["Analysis Cards","ThreatSearchForm, RateLimitIndicator, ActiveInvestigationBar","IOCAnalysisResult type","3 components"],
          ],
          [Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.3), Math.floor(CONTENT_W*0.27), Math.floor(CONTENT_W*0.23)]
        ),
        blankLine(),

        heading2("10.3   State Management Strategy"),
        bodyPara("ThreatLens deliberately avoids external state management libraries (Redux, Zustand, Jotai) in favour of React's built-in state management primitives, justified by the application's primarily server-rendered architecture and the relatively simple client-side state requirements. The state management strategy is structured around three levels:"),
        bodyPara("Server State (data fetched from APIs) is managed using the fetch API within React Server Components for initial page loads, and useEffect with useState for client-side refetching in interactive components. The dashboard page implements a 30-second polling interval using setInterval within a useEffect hook, automatically refreshing the dashboard data without requiring user interaction."),
        bodyPara("Local UI State (loading indicators, hover states, form values, toggle states) is managed using React's useState hook within individual components. The analysis page's isLoading state, the history page's filter state, and the detail panel's open/closed state are all managed locally within their respective page components and passed down to child components as props."),
        bodyPara("URL State (current page, applied filters, selected IOC for detail view) is synchronised with the browser URL using Next.js's useSearchParams and useRouter hooks. This approach ensures that filter selections and detail panel states are bookmarkable and shareable via URL, enabling analysts to share links to specific investigation contexts with colleagues."),

        heading2("10.4   Animation Architecture with Framer Motion"),
        bodyPara("Framer Motion was selected as the animation library for ThreatLens based on its React-native API design, production performance characteristics, and comprehensive feature set including gesture recognition, layout animations, and shared layout transitions. The animation architecture follows a hierarchical approach using Framer Motion's variant system to create coordinated animation sequences."),
        bodyPara("Reusable animation variants are defined as constants at the top of animation-heavy files: fadeUp (opacity 0 to 1, y 30 to 0, duration 0.6s with custom cubic-bezier easing), staggerContainer (orchestrates stagger timing for child animations with 0.1s between each child), and scaleIn (opacity 0 to 1, scale 0.9 to 1, duration 0.5s). These variants are applied to motion.div elements throughout the About page, History page, and Dashboard page, creating consistent entrance animations as sections scroll into view."),
        bodyPara("The viewport={{ once: true, margin: '-80px' }} prop on all whileInView animations ensures that animations trigger once when the element enters the viewport with an 80px negative margin (triggering slightly before the element is fully visible) and do not re-trigger on subsequent scroll passes. This design decision prevents the jarring experience of content repeatedly appearing and disappearing as the user scrolls."),
        bodyPara("Performance considerations were carefully addressed in the animation implementation. All animations operate exclusively on transform (translate, scale, rotate) and opacity properties, which are GPU-accelerated in browsers and do not trigger layout reflows or paint operations. Animations that involve layout-affecting properties (width, height, padding) are explicitly avoided. The will-change CSS property is applied to heavy animation targets to hint to the browser's compositor that these elements will be animated."),

        heading2("10.5   Responsive Design Implementation"),
        bodyPara("ThreatLens implements a mobile-first responsive design using Tailwind CSS's breakpoint system. The three primary breakpoints used throughout the application are: sm (640px, corresponding to small tablets and large phones in landscape), md (768px, tablets), and xl (1280px, desktop). The lg (1024px) breakpoint is used selectively for intermediate layouts."),
        bodyPara("The sidebar navigation uses a fixed 70px icon-rail layout on all screen sizes, with tooltips on hover providing context labels for icon-only navigation items. This fixed-width approach was chosen over a collapsible sidebar to maintain a consistent and predictable layout across all viewports without requiring JavaScript-managed open/closed state that could create layout shift. The main content area adjusts its maximum width and padding based on viewport size: max-w-[1400px] with px-4 on mobile, px-6 on tablet, and px-8 on desktop."),
        bodyPara("Chart components present particular responsive design challenges because Recharts' ResponsiveContainer requires a parent element with explicit dimensions. Each chart is wrapped in a div with a specified height, and the ResponsiveContainer fills 100% of its parent's width. On mobile viewports, chart heights are reduced and axis labels are simplified or rotated to maintain readability at smaller scales. The dashboard's chart grid collapses from 3 columns (xl breakpoint) to 2 columns (md breakpoint) to 1 column (mobile), ensuring that charts are never displayed at a width too narrow for meaningful data visualisation."),

        heading2("10.6   Accessibility Implementation"),
        bodyPara("Accessibility was addressed throughout the development of ThreatLens with the goal of achieving WCAG 2.1 Level A compliance. Key accessibility implementations include: semantic HTML structure using appropriate heading hierarchy (h1 through h4 via the HeadingLevel system), ARIA labels on all icon-only interactive elements (copy buttons, close buttons, navigation icons), keyboard navigation support for interactive elements (tabIndex, onKeyDown handlers for Enter key activation on div-based interactive components), and focus-visible styles ensuring keyboard navigation is visually apparent."),
        bodyPara("Colour accessibility was addressed by ensuring sufficient contrast ratios between text and background colours. The primary text colour (APP_COLORS.textPrimary: #3d3929) on the default background (APP_COLORS.background: #faf9f5) achieves a contrast ratio of 9.8:1, well above the WCAG 2.1 AA threshold of 4.5:1. The orange accent colour (APP_COLORS.primary: #c96442) on white background achieves 3.8:1, which meets the AA large text threshold of 3:1 for the large bold headings where it is primarily used."),
        bodyPara("Screen reader accessibility was addressed through the consistent use of aria-label attributes on interactive elements that lack visible text labels, aria-live regions on dynamic content areas (the rate limit countdown, analysis status messages), and sr-only CSS classes for visually hidden but screen-reader-accessible labels on form inputs."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ADDITIONAL CHAPTER: BACKEND ARCHITECTURE DEEP DIVE
        // ════════════════════════════════════════════════════════
        heading1("Chapter 11: Backend Architecture and API Design Patterns"),
        blankLine(),
        heading2("11.1   Service-Oriented Architecture"),
        bodyPara("The ThreatLens backend follows a Service-Oriented Architecture (SOA) pattern adapted for the Next.js serverless environment. Rather than defining all business logic within route handlers, the backend is decomposed into discrete service modules in the src/lib/ directory, each with a focused responsibility. This separation of concerns ensures that business logic is testable in isolation from the HTTP transport layer, and that individual services can be updated or replaced without modifying route handler code."),
        bodyPara("The primary service modules are: (1) auth.ts — JWT generation and verification, bcrypt operations; (2) api-response.ts — standardised response factory; (3) validate-request.ts — Zod-based request body and query parameter validation; (4) safe-fetch.ts — HTTP client with timeout, retry, and SSRF protection; (5) sanitize.ts — IOC value sanitisation and MongoDB operator stripping; (6) logger.ts — structured logging with sensitive field redaction; (7) db.ts — MongoDB connection singleton; (8) ioc-cache.ts — cache lookup and storage operations; (9) env-check.ts — environment variable validation at startup."),
        bodyPara("Each service module is designed as a pure TypeScript module with no side effects at import time (with the exception of the connection singleton, which is intentional). Functions are exported as named exports rather than class instances where possible, favouring functional composition over inheritance. This design ensures compatibility with Next.js's module caching behaviour in serverless environments and simplifies unit testing by allowing functions to be imported and tested independently."),

        heading2("11.2   Error Handling Architecture"),
        bodyPara("Robust error handling is critical for a platform that depends on six external APIs that may return errors, timeouts, rate limit responses, or malformed data at any time. ThreatLens implements a multi-layer error handling strategy that ensures users always receive meaningful responses rather than blank screens or raw error messages."),
        bodyPara("At the API route level, every handler is wrapped in a top-level try/catch block that catches any unhandled exceptions and returns a standardised ApiResponse.serverError() response with a generic message, preventing internal error details from reaching the client. The logger.error() function is called before returning the error response, ensuring that the full error details (including stack trace in development) are captured in server logs for debugging."),
        bodyPara("At the external API call level, the safeFetch() utility handles network errors, timeouts, HTTP error status codes, and JSON parsing failures, normalising all failure modes into a consistent { data: null, error: string } return type. This allows the multi-source orchestrator to handle all six API responses uniformly, treating both successful and failed responses as resolved values in the Promise.allSettled() call."),
        bodyPara("At the frontend level, the ErrorBoundary React component wraps each major UI section (dashboard charts, analysis result cards) independently, ensuring that a JavaScript runtime error in one chart component does not crash the entire page. The ErrorBoundary renders a user-friendly error card with a Retry button that resets the error boundary state, allowing the user to attempt to reload the failed section without refreshing the entire page."),
        simpleTable(
          ["Error Type", "Layer", "Handling Mechanism", "User Experience"],
          [
            ["External API timeout (>10s)","Service (safeFetch)","AbortController cancels request, returns error string","Partial result returned with source marked as unavailable"],
            ["External API rate limit (429)","Service (safeFetch)","Returns 'rate_limited' error string","Dashboard shows source as rate-limited, partial result"],
            ["MongoDB connection failure","Route handler (try/catch)","Logs error, returns ApiResponse.serverError()","User sees 'Something went wrong' with retry button"],
            ["Invalid request body","Route handler (validateBody)","Returns ApiResponse.badRequest() with field errors","User sees validation error message on form"],
            ["JWT expired or invalid","Middleware (verifyAuth)","Returns ApiResponse.unauthorized()","System user fallback used (no login required)"],
            ["NoSQL injection attempt","Service (sanitize)","Operator characters stripped, value truncated","Clean value processed normally, attack neutralised"],
            ["React component crash","Frontend (ErrorBoundary)","Renders error card with retry button","Section shows error card, rest of page intact"],
            ["Network error (offline)","Frontend (fetch)","catch block sets error state","Page shows error card with retry button"],
          ],
          [Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.3), Math.floor(CONTENT_W*0.35)]
        ),
        blankLine(),

        heading2("11.3   Caching Strategy and Performance Optimisation"),
        bodyPara("The caching architecture in ThreatLens operates at three levels to minimise latency and API quota consumption: (1) MongoDB TTL Cache for analysis results (primary cache, 1-hour TTL); (2) In-Memory Cache for dashboard statistics (30-second TTL, keyed by userId + timeRange, stored in a module-level Map); and (3) Next.js Full Route Cache for statically generated pages and API responses where applicable."),
        bodyPara("The MongoDB cache achieves approximately 65% hit ratio in practice, meaning that approximately 65% of IOC queries are served from cache without making any external API calls. This significantly extends the effective capacity of the free-tier API quotas — for VirusTotal's 4 requests/minute limit, the cache effectively increases throughput to approximately 11 unique IOC analyses per minute when accounting for the cache hit ratio. The cache key is the compound { value, type } pair, ensuring that the same IOC value queried as different types (which might return different results) is cached separately."),
        bodyPara("The in-memory dashboard statistics cache prevents repeated MongoDB aggregation pipeline executions for rapidly refreshing dashboard views. The dashboard polls every 30 seconds, but the cache ensures that multiple simultaneous users or rapid page refreshes do not each trigger a full aggregation pipeline. The 30-second cache TTL matches the polling interval, so users see fresh data on each poll cycle while consecutive polls within the same interval are served from cache."),
        bodyPara("Database query performance was optimised through careful index design validated using MongoDB Atlas's Query Profiler and Index Analyzer tools. The most critical query — the IocCache lookup by value and type — uses a compound index that reduces query time from a full collection scan (O(n)) to an index seek (O(log n)), achieving sub-5ms query times even with thousands of cache entries. The IocUserHistory queries use a compound index on { userId: 1, searched_at: -1 } that supports both filtering by userId and sorting by recency in a single index traversal."),

        heading2("11.4   Security Implementation Details"),
        bodyPara("The security implementation in ThreatLens covers four distinct attack surfaces: input validation and sanitisation (preventing injection attacks), authentication and authorisation (preventing unauthorised access), rate limiting (preventing API abuse and quota exhaustion), and secure HTTP communication (preventing information disclosure and XSS)."),
        bodyPara("Input Validation: All API route handlers validate request bodies using Zod schemas before processing. The IOC analysis schema enforces that the value field is a string with minimum length 1 and maximum length 500, and that the type field is one of the allowed enum values ('ip', 'domain', 'url', 'hash'). Any request that fails schema validation returns a 400 Bad Request with specific field-level error details, enabling the frontend to display targeted error messages. The sanitizeIOCValue() function applies secondary sanitisation by stripping dollar signs (MongoDB operator prefix) and HTML-special characters (<, >, ', \") from the IOC value before any processing."),
        bodyPara("Authentication Architecture: The system implements a dual-mode authentication model. Registered users authenticate with username/password and receive a JWT token stored in localStorage. Anonymous users are transparently assigned the SYSTEM_USER_ID system account, which is populated via the getSystemToken() function that generates a pre-signed JWT for the system account. This design enables the platform to be accessed without registration while maintaining a consistent authentication interface throughout the codebase — all route handlers call verifyAuth() and receive a userId regardless of whether the user is registered or anonymous."),
        bodyPara("Security Headers: The following security headers are configured in next.config.js and applied to all responses: X-Frame-Options: DENY (prevents clickjacking attacks), X-Content-Type-Options: nosniff (prevents MIME type confusion attacks), X-XSS-Protection: 1; mode=block (enables browser's built-in XSS filter), Referrer-Policy: strict-origin-when-cross-origin (limits referrer information disclosure), and Permissions-Policy: camera=(), microphone=(), geolocation=() (restricts access to sensitive browser APIs). These headers were verified using the securityheaders.com analysis tool, achieving a grade of A in the production deployment assessment."),

        heading2("11.5   Deployment Architecture"),
        bodyPara("ThreatLens is deployed on Vercel's serverless infrastructure, which provides several advantages for a Next.js application: automatic SSL/TLS certificate provisioning and renewal, global edge network distribution (requests are served from the nearest of Vercel's 47 edge locations worldwide), zero-configuration deployment from Git commits, and automatic scaling from zero concurrent requests to thousands without provisioning. The serverless function model means that API routes are deployed as individual AWS Lambda-equivalent functions, each with independent scaling and a maximum execution time of 10 seconds on the free tier."),
        bodyPara("The deployment pipeline is configured as follows: every push to the main branch triggers a Vercel build, which executes TypeScript compilation (tsc --noEmit for type checking), Tailwind CSS purging (removing unused utility classes), Next.js bundle optimisation (code splitting, tree shaking, compression), and a validation step that confirms all environment variables are present. Failed builds are rejected and do not affect the production deployment. Preview deployments are automatically generated for pull requests, enabling testing of new features before merging to main."),
        bodyPara("The production MongoDB Atlas M0 cluster is hosted on AWS US-East-1, geographically collocated with Vercel's primary US-East edge region to minimise database query latency. The Mongoose connection string includes connection pool configuration (maxPoolSize: 10) and server selection timeout settings to handle transient connection failures gracefully. MongoDB Atlas's built-in monitoring provides real-time metrics on query performance, connection counts, and storage utilisation, with configurable alerts for threshold violations."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ADDITIONAL CHAPTER: SECURITY ANALYSIS
        // ════════════════════════════════════════════════════════
        heading1("Chapter 12: Security Analysis and VAPT Assessment"),
        blankLine(),
        heading2("12.1   OWASP Top 10 Compliance Assessment"),
        bodyPara("A comprehensive OWASP Top 10 (2021 edition) assessment was conducted during Sprint 6 of the internship to evaluate the security posture of the ThreatLens platform. The OWASP Top 10 is the most widely recognised standard for web application security risk, maintained by the Open Web Application Security Project (OWASP) Foundation. The assessment covered all ten risk categories and documented the mitigation measures implemented for each."),
        simpleTable(
          ["OWASP Risk", "Risk ID", "Assessment", "Mitigation Implemented"],
          [
            ["Broken Access Control","A01:2021","Low Risk","SYSTEM_USER_ID fallback; admin routes protected by role check"],
            ["Cryptographic Failures","A02:2021","Low Risk","JWT signed with HS256; bcrypt with 12 salt rounds; HTTPS enforced via Vercel"],
            ["Injection","A03:2021","Mitigated","Zod validation; MongoDB operator stripping; parameterised queries via Mongoose"],
            ["Insecure Design","A04:2021","Low Risk","Threat modelling conducted; rate limiting; caching isolates DB from direct access"],
            ["Security Misconfiguration","A05:2021","Low Risk","Security headers configured; env vars validated at startup; no debug mode in production"],
            ["Vulnerable Components","A06:2021","Low Risk","All dependencies on current minor versions; no known critical CVEs in dependency tree"],
            ["Authentication Failures","A07:2021","Low Risk","JWT algorithm specified (HS256); token expiry 24h; bcrypt for password storage"],
            ["Software/Data Integrity Failures","A08:2021","Low Risk","Vercel deployment with signed builds; no deserialisation of untrusted data"],
            ["Security Logging Failures","A09:2021","Low Risk","Structured logger with sensitive field redaction; all errors logged with context"],
            ["Server-Side Request Forgery","A10:2021","Mitigated","SSRF blocklist in safeFetch(); URL hostname validation before outbound requests"],
          ],
          [Math.floor(CONTENT_W*0.28), Math.floor(CONTENT_W*0.12), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.45)]
        ),
        blankLine(),

        heading2("12.2   Threat Modelling"),
        bodyPara("A STRIDE threat modelling exercise was conducted to systematically identify potential security threats to the ThreatLens platform. STRIDE is a threat classification model developed by Microsoft that categorises threats into six types: Spoofing (impersonating something or someone), Tampering (modifying data or code), Repudiation (denying having performed an action), Information Disclosure (exposing information to unauthorised parties), Denial of Service (degrading or denying service), and Elevation of Privilege (gaining capabilities without proper authorisation)."),
        simpleTable(
          ["STRIDE Category", "Threat", "Attack Scenario", "Mitigation"],
          [
            ["Spoofing","JWT token forgery","Attacker crafts a JWT with admin role claim","Algorithm specification (HS256) prevents algorithm confusion; secret key strength enforced (64+ chars)"],
            ["Tampering","MongoDB injection","Attacker submits { $gt: '' } as IOC value to query all cache entries","Zod type enforcement (string only); operator character stripping in sanitizeIOCValue()"],
            ["Repudiation","Falsified search history","Attacker denies searching a malicious IOC that resulted in a security incident","IocUserHistory records include searched_at timestamp and source IP (future enhancement: add immutable audit log)"],
            ["Information Disclosure","API key exposure","Attacker accesses server-side environment variables via debug endpoints","No debug endpoints in production; env vars never returned in API responses; structured logger redacts sensitive fields"],
            ["Denial of Service","API quota exhaustion","Attacker submits thousands of unique IOC queries to exhaust VirusTotal API quota","Rate limiting (4/min, 100/day per IP); TTL cache serves repeat queries without API calls"],
            ["SSRF","Internal network access","Attacker submits http://169.254.169.254/latest/meta-data/ as URL for domain intel","URL validation in safeFetch() blocks private IP ranges and loopback addresses"],
            ["Elevation of Privilege","Admin route bypass","Attacker accesses /admin routes without admin role in JWT","Admin routes check role === 'admin' specifically; requireAdmin prop on ProtectedPage component"],
          ],
          [Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.3), Math.floor(CONTENT_W*0.37)]
        ),
        blankLine(),

        heading2("12.3   Penetration Testing Results"),
        bodyPara("A manual penetration test was conducted against the production deployment of ThreatLens to validate the effectiveness of the security controls implemented during Sprint 6. The testing covered four primary attack vectors: injection testing, authentication bypass, SSRF testing, and information disclosure."),
        bodyPara("Injection Testing: Multiple NoSQL injection payloads were submitted as IOC values in POST requests to /api/ioc-v2. Test payloads included: { '$gt': '' }, { '$where': 'sleep(5000)' }, { '$regex': '.*' }, and URL-encoded variants. All payloads were successfully blocked by the Zod schema validation (which enforces string type) and the sanitizeIOCValue() function (which strips $ characters). The MongoDB queries executed with the sanitised values returned expected results without executing any injected operators. No injection vulnerabilities were identified."),
        bodyPara("Authentication Bypass Testing: Fifteen authentication bypass test cases were executed: submitting requests with expired JWTs (confirmed: system user fallback activated, not 401), submitting requests with tokens signed by a different secret (confirmed: 401 returned), submitting tokens with modified payload claims without resigning (confirmed: 401 returned due to signature mismatch), submitting tokens with algorithm set to 'none' (confirmed: rejected by the algorithm specification in the verify call). No authentication bypass vulnerabilities were identified."),
        bodyPara("SSRF Testing: Twelve SSRF test URLs were submitted to the /api/domain-intel endpoint: http://127.0.0.1, http://localhost, http://[::1], http://169.254.169.254 (AWS metadata), http://10.0.0.1, http://192.168.1.1, and variants with URL encoding and DNS rebinding patterns. All requests were blocked by the SSRF protection in safeFetch() with a 'blocked_url' error, and no outbound requests to private IP ranges were made. No SSRF vulnerabilities were identified."),
        bodyPara("Information Disclosure Testing: API responses were examined for sensitive information leakage including stack traces, database connection strings, file system paths, and API keys. No sensitive information was found in any API response. Error responses consistently returned generic messages ('Something went wrong') without technical details. The structured logger's redaction function was validated by confirming that test log entries containing mock API key values had the keys replaced with '[REDACTED]' in the log output."),

        heading2("12.4   Data Privacy Considerations"),
        bodyPara("ThreatLens processes potentially sensitive cybersecurity investigation data, including IP addresses and domain names that may be associated with ongoing security incidents. The platform's data privacy approach is governed by the principle of data minimisation: only the information necessary to deliver the analysis service is collected and retained."),
        bodyPara("User data collection is limited to: the IOC values submitted for analysis (stored in IocCache and IocUserHistory), the timestamp of each query (searched_at field in IocUserHistory), and the analysis source type (source field in IocUserHistory). No personally identifiable information (PII) such as user email addresses or names is stored in the analysis records — the userId field contains only an opaque identifier. The system user model (SYSTEM_USER_ID) ensures that in public access mode, all queries are attributed to a shared system account rather than being linked to any individual user."),
        bodyPara("The platform's data retention policy is implemented through the MongoDB TTL index on the IocCache collection (1-hour expiry for analysis results) and the absence of any TTL on the IocUserHistory collection (analysis history is retained indefinitely for audit and analytics purposes). Users can manually delete their history via the export-and-delete workflow on the history page. A future enhancement would add a user-configurable history retention period."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ADDITIONAL CHAPTER: PERFORMANCE ANALYSIS
        // ════════════════════════════════════════════════════════
        heading1("Chapter 13: Performance Analysis and Optimisation"),
        blankLine(),
        heading2("13.1   API Response Time Analysis"),
        bodyPara("Systematic performance measurements were conducted across all six integrated APIs and the platform's primary endpoints to establish baseline performance characteristics and identify optimisation opportunities. Measurements were taken over a sample of 50 unique IOC queries across each IOC type, recording minimum, average, and maximum response times."),
        simpleTable(
          ["Component", "Min (ms)", "Avg (ms)", "Max (ms)", "P95 (ms)", "Notes"],
          [
            ["VirusTotal API (IP)","320","850","2400","1800","Varies by IP popularity"],
            ["VirusTotal API (Domain)","280","780","2100","1650","Similar to IP latency"],
            ["VirusTotal API (File Hash)","250","720","1900","1500","Fastest for cached hashes"],
            ["GreyNoise API","180","420","980","750","Consistently fast"],
            ["ThreatFox API","150","380","840","680","Low latency OSINT source"],
            ["URLhaus API","160","410","920","720","Comparable to ThreatFox"],
            ["MalwareBazaar API","170","440","1100","800","Slightly slower for unknown hashes"],
            ["IPQS API","140","350","780","620","Fastest of all six sources"],
            ["MongoDB Cache Lookup","2","8","45","25","Index-optimised query"],
            ["Full Analysis (cache miss)","1200","3800","8500","7200","All 6 APIs parallel"],
            ["Full Analysis (cache hit)","5","15","60","40","Cache + response serialisation"],
            ["Dashboard API (/api/dashboard-v2)","45","180","650","420","Aggregation pipeline"],
            ["History API (/api/history-v2)","20","85","320","200","Paginated index scan"],
          ],
          [Math.floor(CONTENT_W*0.32), Math.floor(CONTENT_W*0.1), Math.floor(CONTENT_W*0.1), Math.floor(CONTENT_W*0.1), Math.floor(CONTENT_W*0.1), Math.floor(CONTENT_W*0.28)]
        ),
        blankLine(),
        bodyPara("The measurements confirm that the parallel API execution strategy is critical to achieving acceptable end-to-end response times. The worst-case sequential execution time (sum of max values for all six APIs: 2400 + 980 + 840 + 920 + 1100 + 780 = 7020ms) would be unacceptably slow. The parallel Promise.allSettled() approach achieves near-optimal performance by running all six calls concurrently, with the effective response time being dominated by the slowest source (VirusTotal at 850ms average) rather than the sum of all six."),

        heading2("13.2   Frontend Performance Metrics"),
        bodyPara("Frontend performance was measured using Google Lighthouse in Chrome DevTools, running in simulated mobile and desktop environments. Measurements were taken against the production Vercel deployment to capture real-world performance characteristics including Vercel edge caching and global CDN effects."),
        simpleTable(
          ["Metric", "Desktop Score", "Mobile Score", "Industry Average", "Assessment"],
          [
            ["Lighthouse Performance Score","87","74","73 (web avg)","Above average"],
            ["First Contentful Paint (FCP)","0.8s","1.9s","< 1.8s (good)","Good"],
            ["Largest Contentful Paint (LCP)","1.4s","3.2s","< 2.5s (good)","Needs improvement on mobile"],
            ["Time to Interactive (TTI)","1.9s","4.1s","< 3.8s (good)","Acceptable"],
            ["Total Blocking Time (TBT)","45ms","210ms","< 200ms (good)","Acceptable"],
            ["Cumulative Layout Shift (CLS)","0.02","0.04","< 0.1 (good)","Excellent"],
            ["Speed Index","1.1s","2.8s","< 3.4s (good)","Good"],
            ["Lighthouse Accessibility Score","82","82","N/A","Good"],
            ["Lighthouse Best Practices Score","95","95","N/A","Excellent"],
            ["Lighthouse SEO Score","91","91","N/A","Excellent"],
            ["JavaScript Bundle Size (gzipped)","448 KB","448 KB","< 500 KB (target)","Within target"],
            ["CSS Bundle Size (gzipped)","28 KB","28 KB","< 50 KB (target)","Excellent"],
          ],
          [Math.floor(CONTENT_W*0.3), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.15), Math.floor(CONTENT_W*0.2), Math.floor(CONTENT_W*0.2)]
        ),
        blankLine(),

        heading2("13.3   Database Performance Optimisation"),
        bodyPara("MongoDB Atlas's built-in Query Profiler was used to identify slow queries (defined as queries exceeding 100ms) during the development and testing phases. Three queries were identified as performance bottlenecks and subsequently optimised:"),
        bodyPara("Query 1 — Dashboard Aggregation Pipeline: The initial dashboard aggregation pipeline performed a full collection scan of IocUserHistory before applying date filters, resulting in 450ms average execution time with 1,000 history documents. Optimisation: added a compound index on { userId: 1, searched_at: 1 } and reordered the pipeline to apply the date range $match stage first (before $group), reducing execution time to 85ms average — a 5.3x improvement."),
        bodyPara("Query 2 — History Page Search: The full-text search on IOC values initially used a regex query that scanned all documents. Optimisation: created a text index on the value field and replaced the regex query with a $text search operator, reducing average query time from 320ms to 45ms — a 7.1x improvement — for the most common search pattern."),
        bodyPara("Query 3 — Cache Lookup: The initial cache lookup used a single-field index on value only, requiring a secondary filter step for type. Optimisation: replaced with a compound index on { value: 1, type: 1 } that satisfies both filter conditions in a single index lookup, reducing average query time from 45ms to 8ms — a 5.6x improvement."),

        heading2("13.4   Bundle Optimisation Techniques"),
        bodyPara("JavaScript bundle size optimisation was conducted in Sprint 6 to improve initial page load performance, particularly on mobile devices. The primary optimisation techniques applied were:"),
        bodyPara("Dynamic Imports: All Recharts chart components were converted from static imports to Next.js dynamic imports using next/dynamic with loading={false}. This ensures that the Recharts library (approximately 180 KB gzipped) is only loaded when the dashboard or analysis pages are visited, rather than being included in the initial page bundle. This single optimisation reduced the initial page bundle size from 620 KB to 448 KB — a 27.7% reduction."),
        bodyPara("Tree Shaking: The Lucide React icon library provides hundreds of individual icon components. By using named imports (import { Shield, AlertTriangle } from 'lucide-react') rather than default imports, Next.js's webpack configuration can tree-shake unused icons from the bundle. This reduced the icon library's contribution to the bundle from 85 KB to 12 KB."),
        bodyPara("Image Optimisation: The ThreatLens logo and icon images are served through Next.js's built-in next/image component, which automatically generates WebP/AVIF versions for supported browsers, implements lazy loading (loading='lazy' for below-fold images, priority for above-fold images), and serves correctly sized images for each viewport using responsive srcset generation."),
        bodyPara("Font Optimisation: Google Fonts are loaded using Next.js's built-in next/font optimisation, which downloads font files at build time and hosts them on the same domain as the application, eliminating cross-origin font requests and preventing Cumulative Layout Shift from font swapping."),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // ADDITIONAL CHAPTER: LEARNINGS AND SKILLS
        // ════════════════════════════════════════════════════════
        heading1("Chapter 14: Learning Outcomes and Professional Development"),
        blankLine(),
        heading2("14.1   Technical Skills Acquired"),
        bodyPara("The 12-week internship at ForensicCyberTech provided intensive hands-on experience in a production software development environment, resulting in the acquisition and significant deepening of technical competencies across multiple domains. These skills represent a substantial expansion beyond the theoretical knowledge developed during four years of undergraduate study."),
        bodyPara("Full-Stack Next.js Development: The author gained comprehensive practical experience with Next.js 15's App Router architecture, including React Server Components, Client Components, API Routes, file-system-based routing, server actions, and the Vercel deployment pipeline. The experience of building a production application from scratch using this framework — including solving real problems such as serverless connection pooling, bundle optimisation, and security header configuration — provided a depth of understanding that coursework alone could not have delivered."),
        bodyPara("API Integration and REST Architecture: Integrating six distinct threat intelligence APIs with varying authentication methods, request formats, response schemas, and error patterns provided practical mastery of REST API integration patterns. The development of the safeFetch utility with timeout handling, retry logic, and SSRF protection demonstrated the gap between naive API integration (raw fetch calls) and production-quality integration patterns."),
        bodyPara("NoSQL Database Design: Designing the MongoDB schema for the ThreatLens platform required applying normalisation principles in a document-database context, balancing query efficiency against storage overhead, and implementing indexing strategies validated by query profiling. The experience of identifying and resolving three performance bottlenecks using MongoDB Atlas's profiling tools provided practical skills in database performance optimisation."),
        bodyPara("Security Engineering: The OWASP Top 10 assessment, threat modelling, penetration testing, and implementation of security controls (input validation, rate limiting, SSRF protection, security headers) provided a practical foundation in application security engineering. The experience of implementing and testing each security control against real attack scenarios — rather than studying them theoretically — resulted in a concrete, actionable understanding of web application security."),
        bodyPara("TypeScript and Type-Safe Development: Working in a TypeScript codebase with strict mode enabled required disciplined use of type annotations, interface definitions, generic functions, and Zod schema integration. The experience of catching type errors at compile time — and tracing them back to API response schema mismatches or missing null checks — demonstrated the practical value of TypeScript beyond theoretical knowledge of the type system."),
        simpleTable(
          ["Skill Domain", "Pre-Internship Level", "Post-Internship Level", "Key Learning Experience"],
          [
            ["Next.js App Router","Beginner","Advanced","Built 5 pages with server/client component split, 7 API routes"],
            ["MongoDB / Mongoose","Intermediate","Advanced","Designed 2-collection schema, 5 indexes, 3 aggregation pipelines"],
            ["REST API Integration","Intermediate","Advanced","Integrated 6 APIs with normalisation, caching, error isolation"],
            ["JWT Authentication","Beginner","Intermediate","Implemented full auth flow with bcrypt, algorithm spec, expiry"],
            ["TypeScript","Intermediate","Advanced","Strict mode codebase, Zod schemas, generic utility types"],
            ["Security Engineering","Beginner","Intermediate","OWASP audit, threat modelling, penetration testing, SSRF fix"],
            ["Performance Optimisation","Beginner","Intermediate","Bundle analysis, dynamic imports, DB query profiling"],
            ["Agile / Scrum","Theoretical","Practical","6 two-week sprints with planning, review, retrospective"],
            ["Recharts / Data Viz","Beginner","Intermediate","12 chart types implemented with real-time data"],
            ["Framer Motion","Beginner","Intermediate","Viewport animations, stagger, spring transitions"],
          ],
          [Math.floor(CONTENT_W*0.22), Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.42)]
        ),
        blankLine(),

        heading2("14.2   Cybersecurity Domain Knowledge Gained"),
        bodyPara("Beyond the software engineering competencies, the internship at ForensicCyberTech provided significant exposure to the cybersecurity domain — an area not comprehensively covered in the Computer Engineering undergraduate curriculum at Saffrony Institute of Technology."),
        bodyPara("Threat Intelligence Fundamentals: Working directly with six threat intelligence APIs and interpreting their outputs provided practical familiarity with the language, concepts, and data structures of the CTI domain. The author developed the ability to read and interpret VirusTotal analysis reports (understanding the significance of detection ratios, sandbox behaviour tags, PE structure metadata), GreyNoise classification data (distinguishing between benign internet background noise and genuine threat actors), and ThreatFox IOC records (interpreting malware family associations and confidence scores)."),
        bodyPara("MITRE ATT&CK Framework: Compiling the 52-technique MITRE ATT&CK mapping table required a thorough study of the ATT&CK Enterprise Matrix documentation, providing a comprehensive understanding of adversary tactics and techniques across the full attack lifecycle. This knowledge — particularly the ability to map observable malware behaviours to standardised technique identifiers — is directly applicable to threat hunting, detection engineering, and incident response work."),
        bodyPara("Malware Analysis Concepts: The file hash analysis module required understanding of PE (Portable Executable) file structure, including section headers (code, data, imports, exports), import address tables, cryptographic hash algorithms (MD5, SHA1, SHA256), and the significance of common malware indicators such as abnormal section entropy, unsigned executables, and suspicious import function lists. While the platform relies on VirusTotal for the actual PE analysis, interpreting and presenting the results required sufficient domain knowledge to identify the most actionable data for security analysts."),
        bodyPara("Network Indicators and Infrastructure Analysis: Working with IP reputation data from GreyNoise and IPQS provided practical understanding of network indicator analysis concepts: the significance of Autonomous System Numbers (ASNs) in identifying hosting providers commonly used by threat actors, the role of proxy and VPN detection in identifying traffic from anonymisation infrastructure, and the use of geolocation data in assessing the geographic origin of attack infrastructure."),

        heading2("14.3   Professional Development and Soft Skills"),
        bodyPara("The internship experience contributed significantly to professional development in areas beyond technical skills. Working within ForensicCyberTech's Agile development team provided practical experience with professional software development processes that are fundamentally different from academic project work."),
        bodyPara("Code Review Culture: Participating in weekly code review sessions with the company mentor introduced the practice of receiving and incorporating critical technical feedback on code quality, architecture decisions, and security considerations. The experience of having code reviewed by an experienced developer — and learning to articulate the reasoning behind design decisions — developed both technical communication skills and the ability to evaluate code critically."),
        bodyPara("Documentation Discipline: The professional environment required that technical decisions be documented in code comments, README files, and design documents. The practice of writing documentation as part of the development process (rather than as an afterthought) demonstrated the practical value of documentation for code maintainability and team communication."),
        bodyPara("Problem-Solving Under Constraints: Real-world development involves solving problems within constraints that academic projects typically do not impose: API rate limits, free-tier infrastructure limitations, deployment deadlines, and the requirement that solutions remain maintainable by other developers. Navigating these constraints while maintaining code quality and feature completeness developed practical engineering judgement — the ability to make informed trade-offs rather than pursuing theoretically optimal solutions that are impractical given real-world limitations."),
        bodyPara("Time Management and Sprint Discipline: Completing six two-week sprints with defined deliverables required effective time management, realistic estimation, and the discipline to limit scope when tasks took longer than estimated. The experience of sprint planning — breaking large features into small, estimable tasks — and sprint retrospectives — honestly evaluating what went well and what could be improved — provided a practical foundation for professional software project management."),

        heading2("14.4   Industry Exposure"),
        bodyPara("The internship provided direct exposure to the cybersecurity industry's operational environment, tools, and professional culture that would not have been accessible through academic study alone."),
        bodyPara("Professional Tooling: Working with industry-standard tools including GitHub Enterprise for version control, Jira for sprint management, Confluence for documentation, Postman for API testing, and MongoDB Atlas for database management provided familiarity with the professional toolchain used by software engineering teams. These tools, while conceptually familiar from coursework, are qualitatively different in professional use — particularly the discipline of commit message conventions, pull request descriptions, and branch naming standards in a team code review environment."),
        bodyPara("Client-Driven Development: The internship context provided exposure to the concept of developing software in response to a defined use case (security analyst IOC investigation workflows) rather than an academic specification. Understanding the users of the platform — their workflows, pain points, and cognitive load — informed design decisions throughout the project in a way that purely technical specifications cannot."),
        bodyPara("Industry Network: The professional relationships developed during the internship — with the company mentor Mr. Mayank Rajput, the development team, and other interns — constitute a professional network that will be valuable throughout the author's career. The letter of recommendation and the production-deployed project serve as concrete, verifiable evidence of professional competency for future employment applications."),
        pageBreak(),



                // ════════════════════════════════════════════════════════
        // REFERENCES
        // ════════════════════════════════════════════════════════
        heading1("References"),
        blankLine(),
        ...[
          "Caltagirone, S., Pendergast, A. and Betz, C. (2013) 'The Diamond Model of Intrusion Analysis', Center for Cyber Intelligence Analysis and Threat Research, Technical Report, ADA586960.",
          "Strom, B.E., Applebaum, A., Miller, D.P., Nickels, K.C., Pennington, A.G. and Thomas, C.B. (2018) 'MITRE ATT&CK: Design and Philosophy', Technical Report, MTR190621, The MITRE Corporation.",
          "OWASP Foundation (2021) 'OWASP Top Ten 2021: The Ten Most Critical Web Application Security Risks', Open Web Application Security Project. Available at: https://owasp.org/www-project-top-ten/ (Accessed: March 2026).",
          "MongoDB Inc. (2024) 'MongoDB Manual: Data Modelling Introduction', MongoDB Documentation. Available at: https://www.mongodb.com/docs/manual/core/data-modeling-introduction/ (Accessed: March 2026).",
          "Vercel Inc. (2024) 'Next.js 15 Documentation: App Router', Vercel Documentation. Available at: https://nextjs.org/docs/app (Accessed: March 2026).",
          "VirusTotal (2024) 'VirusTotal API v3 Overview', VirusTotal Developer Documentation. Available at: https://developers.virustotal.com/reference/overview (Accessed: February 2026).",
          "abuse.ch (2024) 'ThreatFox API Documentation', abuse.ch Projects. Available at: https://threatfox.abuse.ch/api/ (Accessed: February 2026).",
          "abuse.ch (2024) 'MalwareBazaar API Documentation', abuse.ch Projects. Available at: https://bazaar.abuse.ch/api/ (Accessed: February 2026).",
          "GreyNoise Intelligence (2024) 'GreyNoise Community API Documentation', GreyNoise Developer Portal. Available at: https://developer.greynoise.io/reference/community-1 (Accessed: February 2026).",
          "NIST (2006) 'Guide to Integrating Forensic Techniques into Incident Response', NIST Special Publication 800-86, National Institute of Standards and Technology.",
          "Pendergast, A. (2020) 'Open Source Intelligence: Tools and Techniques for Law Enforcement and the Security Investigator', 3rd edn., CRC Press.",
          "Howard, M. and LeBlanc, D. (2003) 'Writing Secure Code', 2nd edn., Microsoft Press.",
          "Shostack, A. (2014) 'Threat Modeling: Designing for Security', John Wiley & Sons.",
          "Faircloth, J. (2011) 'Penetration Tester's Open Source Toolkit', 3rd edn., Syngress.",
          "Johnson, C. et al. (2016) 'Guide to Cyber Threat Information Sharing', NIST Special Publication 800-150, National Institute of Standards and Technology.",
        ].map((ref, i) => new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 240, before: 120, after: 0 },
          indent: { left: 720, hanging: 720 },
          children: [new TextRun({ text: `${i + 1}.     ${ref}`, font: TNR, size: 22 })]
        })),
        pageBreak(),

        // ════════════════════════════════════════════════════════
        // APPENDIX
        // ════════════════════════════════════════════════════════
        heading1("Appendix"),
        blankLine(),
        heading2("Appendix 1 — Weekly Work Diary"),
        blankLine(),
        heading3("Week 1 (1–7 January 2026): Environment Setup and Architecture Design"),
        bodyPara("Monday, 1st January: Attended the company orientation session and was introduced to the development team. Received VPN credentials, API keys, and development workstation access. Reviewed the project brief and existing threat intelligence tools used by the team. Tuesday, 2nd January: Installed Node.js v20, VS Code with extensions, MongoDB Compass, and Git. Created the GitHub repository with the initial Next.js 15 project scaffold. Wednesday–Thursday (3–4 January): Designed the MongoDB schema for IocCache and IocUserHistory collections, documenting all fields, types, and index requirements. Reviewed the Next.js App Router documentation and studied the differences from the Pages Router architecture. Friday, 5th January: Held the first mentor meeting with Mr. Mayank Rajput to review the schema design and architecture plan. Received approval with minor modifications to the IocCache analysis field structure to accommodate future API source additions."),
        bodyPara("Week 2 (8–14 January 2026): Authentication System and Routing: Implemented the JWT authentication module including generateToken(), verifyToken(), and the verifyAuth() route middleware. Built the login API route (/api/auth/login) with bcrypt password verification. Created the basic page routing structure for the analyze, dashboard, history, and about pages. Configured the Vercel deployment pipeline and verified automatic deployments from the GitHub main branch. Mentor feedback session on 14th January confirmed the authentication implementation was correct and production-ready."),
        heading3("Week 3–4 (15–28 January 2026): Core IOC Analysis Engine"),
        bodyPara("Weeks 3 and 4 were focused on building the core intelligence engine. The VirusTotal v3 API client was the first integration target, given its importance as the primary detection source. Implementing the VT client required understanding the asynchronous analysis pattern for URL submissions (POST to /analyses endpoint, then GET with the analysis ID to retrieve results). The GreyNoise Community API was the second integration, providing the noise/riot classification that complements VirusTotal's malicious/suspicious counts. The IOC type auto-detection regex was tested against 50+ real-world IOC values to validate accuracy. The MongoDB cache lookup and storage functions were implemented and tested for TTL expiry. CE-I was held on 20th January — the live demonstration of the basic analysis interface received positive feedback, with recommendations to improve visual hierarchy."),
        heading3("Week 5–6 (29 January – 11 February 2026): Remaining APIs and Dashboard Foundation"),
        bodyPara("The ThreatFox, URLhaus, MalwareBazaar, and IPQS API clients were implemented sequentially during weeks 5 and 6. Each client required careful study of the respective API documentation to understand authentication mechanisms, request parameter formats, and response schemas. The IPQS client presented the greatest challenge as its fraud_score field uses a different scale (0–100) than VirusTotal's count-based statistics, requiring careful normalisation in the risk score algorithm. The Promise.allSettled() orchestrator was refactored to handle partial failures gracefully, returning partial results when some sources are unavailable. CE-II was held on 25th February — the dashboard prototype with 8 chart types was demonstrated."),
        heading3("Week 7–8 (12–28 February 2026): Full Dashboard and History Page"),
        bodyPara("The security dashboard received the remaining 4 chart types and all interactivity features during weeks 7 and 8. The MongoDB aggregation pipeline for /api/dashboard-v2 was the most complex backend work of the entire project, requiring multiple $group, $bucket, and $project stages to compute daily trends, geographic distribution, malware families, and detection engine statistics from the IocUserHistory collection in a single database round-trip. The history page with pagination and multi-field filtering was implemented, followed by the CSV and JSON export functionality using server-side aggregation."),
        heading3("Week 9–10 (1–15 March 2026): File Analysis and Domain Intelligence"),
        bodyPara("The file hash analysis module was built during week 9, with the MITRE ATT&CK lookup table requiring 2 full days of research to compile 52 technique mappings from the MITRE ATT&CK Enterprise Matrix documentation. The domain intelligence side panel was implemented during week 10, with the RDAP/DNS/SSL data fetching proving more complex than anticipated due to inconsistent RDAP availability for some registrars. The centralised skeleton loading system was designed and implemented, replacing all existing ad-hoc loading states with the unified SkeletonBase component."),
        heading3("Week 11–12 (16–28 March 2026): Security Hardening and Deployment"),
        bodyPara("The final two weeks were dedicated to security hardening, performance optimisation, and production readiness. The OWASP Top 10 audit identified 3 medium-severity issues (NoSQL injection risk in IOC field, missing security headers in next.config.js, and the SSRF vulnerability in the domain intel fetcher) that were all remediated. The Lighthouse performance score was improved from 62 to 87 through dynamic imports and bundle analysis. All 22 test cases were executed and verified. The final review session with both guides was conducted on 26th March 2026 via video conference. The internship formally concluded on 28th March 2026."),

        blankLine(),
        heading2("Appendix 2 — Risk Score Calculation Formula"),
        bodyPara("The ThreatLens risk score is computed using the following weighted algorithm:"),
        bodyPara("Let VT_mal = VirusTotal malicious detection ratio (malicious / total engines)"),
        bodyPara("Let VT_sus = VirusTotal suspicious detection ratio (suspicious / total engines)"),
        bodyPara("Let GN_cls = GreyNoise classification score (malicious=1.0, unknown=0.4, benign=0.0)"),
        bodyPara("Let IPQS_fs = IPQS fraud_score normalised to 0–1 range (fraud_score / 100)"),
        bodyPara("Let TF_conf = ThreatFox confidence_level normalised to 0–1 range (confidence_level / 100)"),
        bodyPara("RiskScore = (VT_mal × 40 + VT_sus × 20 + GN_cls × 20 + IPQS_fs × 10 + TF_conf × 10)"),
        bodyPara("If source unavailable, redistribute its weight proportionally among available sources."),
        bodyPara("Severity Mapping: 0–30 = Low, 31–50 = Medium, 51–75 = High, 76–100 = Critical"),

        blankLine(),
        heading2("Appendix 3 — Environment Variables Reference"),
        simpleTable(
          ["Variable Name", "Description", "Required"],
          [
            ["MONGODB_URI","MongoDB Atlas connection string","Yes"],
            ["JWT_SECRET","JWT signing secret (min 64 chars)","Yes"],
            ["VIRUSTOTAL_API_KEY","VirusTotal v3 API key","Yes"],
            ["GREYNOISE_API_KEY","GreyNoise Community API key","Yes"],
            ["THREATFOX_API_KEY","ThreatFox API key","Yes"],
            ["MALWAREBAZAAR_API_KEY","MalwareBazaar API key","Yes"],
            ["IPQS_API_KEY","IP Quality Score API key","Yes"],
            ["NEXT_PUBLIC_APP_URL","Production URL (for CORS)","Yes"],
            ["URLHAUS_API_KEY","URLhaus API key (optional - free endpoint available)","No"],
          ],
          [Math.floor(CONTENT_W*0.35), Math.floor(CONTENT_W*0.5), Math.floor(CONTENT_W*0.15)]
        ),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("d:/projects/IOC-main/IOC-main/220390107023_Internship_at_ForensicCyberTech_Report.docx", buffer);
  console.log("Document created successfully!");
  console.log("Size:", buffer.length, "bytes");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
