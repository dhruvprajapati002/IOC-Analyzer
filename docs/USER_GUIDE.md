# VigilanceX IOC Analyzer - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Main Pages Overview](#main-pages-overview)
4. [Feature Guides](#feature-guides)
5. [Account Management](#account-management)
6. [FAQs](#faqs)
7. [Troubleshooting](#troubleshooting)
8. [Contact & Support](#contact--support)
9. [Tips & Best Practices](#tips--best-practices)

---

## Introduction

### What is VigilanceX IOC Analyzer?

VigilanceX is a powerful threat intelligence platform that helps security professionals and organizations analyze potentially malicious indicators of compromise (IOCs). The platform integrates with industry-leading threat intelligence sources to provide comprehensive security analysis.

### What Can You Analyze?

- **IP Addresses** - Check if an IP is associated with malicious activity
- **Domain Names** - Investigate suspicious domains
- **URLs** - Analyze potentially harmful links
- **File Hashes** - Verify file integrity and detect malware (MD5, SHA-1, SHA-256)
- **Files** - Upload and scan files for threats

### Key Features

✅ Real-time threat detection using VirusTotal, AbuseIPDB, and other threat feeds  
✅ Interactive network relationship graphs  
✅ Historical analysis tracking  
✅ IP reputation scoring  
✅ File malware analysis  
✅ Export results to CSV/JSON  
✅ Dark mode professional interface  

---

## Getting Started

### Account Creation & Login

#### First Time Users

1. **Navigate to the Login Page**
   - Open your web browser and go to the VigilanceX URL
   - You'll see the login screen with the VigilanceX logo

2. **Create Your Account**
   - If you don't have an account, contact your system administrator
   - They will create an account for you with your email address

3. **Login**
   - Enter your **email address**
   - Enter your **password**
   - Click the **"Sign In"** button
   - Your login session will remain active for 7 days

4. **First Login**
   - After successful login, you'll be redirected to the Dashboard
   - Take a moment to familiarize yourself with the interface

### Basic Navigation

The platform has a **sidebar menu** on the left with the following sections:

- **Dashboard** 🏠 - Overview of all threat intelligence data
- **Analyze** 🔍 - Submit new IOCs for analysis
- **History** 📋 - View past analyses
- **IP Reputation** 🌐 - Check IP address reputation
- **File Analysis** 📄 - Upload and scan files
- **Graph** 🕸️ - Visualize threat relationships

**Navigation Tips:**
- Click any menu item to navigate to that page
- The current page is highlighted in the sidebar
- Use the browser back button if needed
- The VigilanceX logo at the top takes you back to the Dashboard

---

## Main Pages Overview

### 1. Dashboard (Home Page)

**Purpose:** Get a bird's-eye view of all threat intelligence activity

**What You'll See:**
- **Statistics Cards** at the top showing:
  - Total Analyses performed
  - Malicious threats detected
  - Suspicious items flagged
  - Clean/safe items verified
  
- **Threat Distribution Chart** - Pie chart showing breakdown by threat type
- **Weekly Trends** - Line graph showing activity over the past 7 days
- **Recent Activity** - List of latest analyses performed

**How to Use:**
- Monitor overall security posture at a glance
- Identify trending threats
- Quickly see which IOC types are most analyzed
- Click on recent items to view details

### 2. Analyze Page

**Purpose:** Submit new indicators for threat analysis

**What You Can Do:**
- Analyze IP addresses, domains, URLs, and file hashes
- Get comprehensive threat intelligence reports
- View detection results from multiple security engines

### 3. History Page

**Purpose:** Review all past analyses

**Features:**
- Search and filter past submissions
- Export data to CSV or JSON
- Pagination for easy browsing
- View detailed results of previous analyses

### 4. IP Reputation Page

**Purpose:** Deep dive into IP address reputation

**Features:**
- Check IP address reputation scores
- View geolocation data
- See abuse reports
- Identify ISP and network information

### 5. File Analysis Page

**Purpose:** Upload and scan files for malware

**Features:**
- Drag-and-drop file upload
- Support for various file types
- Detailed malware detection results
- Threat classification

### 6. Graph Visualization Page

**Purpose:** Explore relationships between threats

**Features:**
- Interactive network graph
- Visualize connections between IOCs
- Identify threat patterns
- Filter by relationship types

---

## Feature Guides

### How to Analyze an IOC (Step-by-Step)

#### Method 1: Quick Analysis

1. **Go to the Analyze Page**
   - Click "Analyze" in the sidebar menu

2. **Enter Your IOC**
   - Type or paste the IOC in the search box
   - Supported formats:
     - IP: `192.168.1.1` or `8.8.8.8`
     - Domain: `example.com` or `malicious-site.net`
     - URL: `https://example.com/path`
     - Hash: `44d88612fea8a8f36de82e1278abb02f` (MD5)
     - Hash: `3395856ce81f2b7382dee72602f798b642f14140` (SHA-1)
     - Hash: `275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f` (SHA-256)

3. **Submit for Analysis**
   - Click the **"Analyze"** or **search icon** button
   - Wait for the analysis to complete (usually 5-15 seconds)

4. **Review Results**
   - **Threat Overview Card** shows overall verdict
   - **Detection Engines** display individual scanner results
   - **Popular Threat Label** shows the most common threat classification
   - **Threat Statistics** provide numerical breakdown

#### Method 2: Analyze from History

1. Go to the **History** page
2. Find a previous analysis
3. Click on it to view details
4. Use the "Re-analyze" option if available

### Understanding Analysis Results

#### Threat Levels Explained

| Level | Color | Meaning |
|-------|-------|---------|
| **Critical** | 🔴 Red | Confirmed malicious - block immediately |
| **High** | 🟠 Orange | High probability of threat |
| **Medium** | 🟡 Yellow | Suspicious activity detected |
| **Low** | 🟢 Green | Minor concerns, likely safe |
| **Clean** | ✅ Green | No threats detected |

#### Reading the Threat Overview

- **Total Engines Analyzed** - How many security scanners checked this IOC
- **Malicious Count** - Number of engines that flagged it as dangerous
- **Suspicious Count** - Number of engines that found questionable behavior
- **Clean Count** - Number of engines that found it safe
- **Risk Score** - Percentage-based threat assessment (0-100%)

#### Example Results Interpretation

```
Threat Overview:
✓ Total Engines: 88
✓ Malicious: 65
✓ Suspicious: 10
✓ Clean: 13
✓ Risk Score: 85%
→ Verdict: CRITICAL THREAT - This IOC is highly dangerous
```

### How to Check IP Reputation

1. **Navigate to IP Reputation Page**
   - Click "IP Reputation" in sidebar

2. **Enter IP Address**
   - Type the IP (e.g., `192.168.1.1`)
   - Click "Check Reputation"

3. **Review Results**
   - **Reputation Score** (0-100, higher is worse)
   - **Geolocation** (Country, City, ISP)
   - **Abuse Reports** from AbuseIPDB
   - **VirusTotal Detections**
   - **Historical Activity**

4. **Understand the Score**
   - **0-25**: Low risk, likely legitimate
   - **26-50**: Moderate risk, monitor
   - **51-75**: High risk, suspicious
   - **76-100**: Critical risk, confirmed malicious

### How to Analyze a File

1. **Go to File Analysis Page**
   - Click "File Analysis" in sidebar

2. **Upload Your File**
   - **Drag and drop** file onto the upload area, OR
   - Click **"Choose File"** and select from your computer

3. **Supported File Types**
   - Executables (.exe, .dll, .sys)
   - Documents (.pdf, .doc, .xls)
   - Scripts (.js, .ps1, .bat)
   - Archives (.zip, .rar)
   - Mobile apps (.apk, .ipa)
   - Maximum file size: 32 MB

4. **Wait for Scan**
   - File is uploaded securely
   - Scanned by multiple antivirus engines
   - Results appear in 30-90 seconds

5. **Review Malware Report**
   - **File Hash** (unique fingerprint)
   - **Malware Names** detected
   - **File Type & Size**
   - **Detection Ratio** (e.g., 45/70 engines)
   - **Threat Classification**

### How to Use Graph Visualization

1. **Access Graph Page**
   - Click "Graph" in sidebar

2. **Select an IOC from History**
   - Your previous analyses appear in a list
   - Click on any IOC to visualize its relationships

3. **Load the Graph**
   - Click "Load Graph" or "Visualize"
   - Interactive network diagram appears

4. **Navigate the Graph**
   - **Zoom**: Mouse wheel or pinch gesture
   - **Pan**: Click and drag background
   - **Select Node**: Click on any circle
   - **Move Node**: Drag any circle to reposition

5. **Understanding the Graph**
   - **Center Node** (larger): Your original IOC
   - **Connected Nodes**: Related threats
   - **Lines/Edges**: Type of relationship
   - **Colors**: Indicate node type (IP, domain, file, URL)

6. **Relationship Types**
   - **Communicates With**: Network connections
   - **Downloads**: File downloads
   - **Embeds**: Embedded content
   - **Redirects To**: URL redirections
   - **Related To**: General associations

### How to Search and Filter History

1. **Open History Page**
   - Click "History" in sidebar

2. **Use Search Box**
   - Type any part of an IOC (IP, domain, hash)
   - Results filter automatically

3. **Apply Filters**
   - **By Type**: Select IP, Domain, URL, or Hash
   - **By Date**: Choose date range
   - **By Verdict**: Filter by threat level

4. **Sort Results**
   - Click column headers to sort
   - Available columns: Date, IOC, Type, Verdict, Risk Score

5. **View Details**
   - Click any row to open full analysis results

### How to Export Data

1. **From History Page**
   - Go to "History" section

2. **Select Items to Export** (optional)
   - Check boxes next to specific items, OR
   - Export all visible items

3. **Choose Export Format**
   - Click **"Export CSV"** for spreadsheet format
   - Click **"Export JSON"** for technical format

4. **Download File**
   - File downloads to your browser's download folder
   - Filename includes timestamp (e.g., `ioc-analysis-2025-12-09.csv`)

5. **What's Included**
   - IOC value
   - Analysis date
   - Threat verdict
   - Detection counts
   - Risk score
   - All metadata

---

## Account Management

### Profile Settings

Currently, VigilanceX uses a simplified authentication system. Contact your administrator to:
- Update your email address
- Reset your password
- Change account permissions

### Password Management

**Forgot Your Password?**
1. Contact your system administrator
2. They will reset your password
3. You'll receive new login credentials via secure channel

**Change Your Password:**
- Currently requires administrator assistance
- Contact support with your request

### Session Management

- **Session Duration**: 7 days
- **Auto-Logout**: After 7 days of inactivity
- **Manual Logout**: Click your profile icon (if available) and select "Logout"

---

## FAQs

### General Questions

**Q: What is an IOC?**  
**A:** IOC stands for "Indicator of Compromise" - it's a piece of information that indicates a potential security threat. Examples include suspicious IP addresses, malicious file hashes, dangerous URLs, or compromised domains.

**Q: Is my data secure?**  
**A:** Yes. All analyses are stored securely in an encrypted database. Your submissions are sent to trusted threat intelligence providers (VirusTotal, AbuseIPDB) via secure API connections.

**Q: How current is the threat intelligence?**  
**A:** The platform queries real-time threat feeds. Results are cached for efficiency but refreshed regularly to ensure accuracy.

**Q: Can I analyze private files?**  
**A:** When you upload files, they are sent to VirusTotal for analysis. Be cautious with sensitive or proprietary files, as they become part of VirusTotal's database. For highly confidential files, consult your security team first.

### Usage Questions

**Q: How many IOCs can I analyze?**  
**A:** There's no hard limit for users, but the platform has API rate limits to comply with third-party services (typically 4 requests per minute for free tier VirusTotal keys).

**Q: Why does my analysis say "cached"?**  
**A:** If an IOC was recently analyzed, the platform returns cached results to save time and API quota. Cached data is typically valid for 24-48 hours.

**Q: Can I re-analyze an IOC?**  
**A:** Yes. Use the "Refresh" or "Re-analyze" button on the analysis results page to force a new analysis.

**Q: What does "No threats detected" mean?**  
**A:** It means none of the security engines flagged the IOC as malicious. However, this doesn't guarantee 100% safety - always use caution with unknown sources.

**Q: How do I know if a result is reliable?**  
**A:** Look at the number of engines that scanned the IOC. More engines = more reliable. A result from 70+ engines is more trustworthy than from 5 engines.

### Technical Questions

**Q: What threat intelligence sources are used?**  
**A:** 
- VirusTotal (70+ antivirus engines)
- AbuseIPDB (IP reputation database)
- Additional threat feeds integrated into the platform

**Q: What file formats are supported?**  
**A:** Most common file types including executables, documents, scripts, archives, and mobile apps. Maximum file size is 32 MB.

**Q: Can I integrate this with my SIEM?**  
**A:** Contact your administrator about API access for integration with Security Information and Event Management (SIEM) systems.

**Q: How long is history stored?**  
**A:** Analysis history is stored indefinitely unless configured otherwise by your administrator. Audit logs are typically retained for 90 days.

---

## Troubleshooting

### Login Issues

**Problem: Can't remember my password**
- **Solution**: Contact your system administrator for a password reset

**Problem: "Invalid credentials" error**
- **Solution**: 
  - Verify email is typed correctly
  - Check Caps Lock is off
  - Ensure password is correct
  - Contact admin if problem persists

**Problem: Page won't load after login**
- **Solution**:
  - Refresh the browser (F5 or Ctrl+R)
  - Clear browser cache and cookies
  - Try a different browser
  - Check your internet connection

### Analysis Issues

**Problem: "Analysis failed" or error message**
- **Solution**:
  - Verify the IOC format is correct
  - Check your internet connection
  - Wait a minute and try again (might be rate limited)
  - Try analyzing a different IOC to test if it's system-wide

**Problem: Analysis is taking too long**
- **Solution**:
  - Wait up to 2 minutes for complex analyses
  - Refresh the page if no progress after 2 minutes
  - Try again during off-peak hours

**Problem: "Rate limit exceeded"**
- **Solution**:
  - Wait 1 minute before submitting another request
  - The platform has built-in rate limiting to comply with VirusTotal's API limits
  - If urgent, contact your administrator about upgrading the API tier

**Problem: No results or empty results**
- **Solution**:
  - The IOC might be unknown to threat intelligence databases
  - Try alternative IOCs related to your investigation
  - Check if the IOC format is correct

### File Upload Issues

**Problem: File won't upload**
- **Solution**:
  - Check file size is under 32 MB
  - Verify file type is supported
  - Try a different browser
  - Check your internet connection speed

**Problem: "Upload failed" error**
- **Solution**:
  - Wait and retry
  - Check file isn't corrupted
  - Try uploading a smaller file first to test
  - Contact support if issue persists

### Graph Visualization Issues

**Problem: Graph won't load**
- **Solution**:
  - Ensure you've selected an IOC from history first
  - Refresh the page
  - Try a different IOC
  - Check browser console for errors (F12)

**Problem: Graph is too slow or laggy**
- **Solution**:
  - Close other browser tabs
  - Reduce the number of nodes (use filters)
  - Try on a different device with more RAM
  - Update your browser to the latest version

### Display Issues

**Problem: Page looks broken or misaligned**
- **Solution**:
  - Refresh the page (Ctrl+R or F5)
  - Clear browser cache
  - Try zooming to 100% (Ctrl+0)
  - Update your browser
  - Try a different browser (Chrome, Firefox, Edge recommended)

**Problem: Can't see the sidebar menu**
- **Solution**:
  - Click the menu icon (hamburger icon) if on mobile
  - Maximize your browser window
  - Check browser zoom level

### Performance Issues

**Problem: Dashboard loading slowly**
- **Solution**:
  - Wait for database connection to establish
  - Refresh after 30 seconds
  - Check your internet speed
  - Clear browser cache

**Problem: History page is slow**
- **Solution**:
  - Use filters to reduce displayed items
  - Use pagination to load fewer items at once
  - Clear old analyses (contact admin)

---

## Contact & Support

### Getting Help

**For Technical Issues:**
- Email: support@vigilancex.com (example - replace with actual email)
- Include:
  - Your email address
  - Screenshot of the error
  - Steps to reproduce the issue
  - Browser and OS version

**For Account Issues:**
- Contact your system administrator
- Provide:
  - Your registered email
  - Description of the account issue

**For Feature Requests:**
- Submit suggestions to your administrator
- Describe the feature and its benefits
- Include use cases

### System Status

If the platform is experiencing issues:
1. Check with colleagues if they have the same problem
2. Contact your IT department
3. Check for planned maintenance notifications

### Documentation

- **User Guide**: This document
- **Technical Documentation**: `README.md` in the project repository
- **API Documentation**: Contact admin for API access docs

---

## Tips & Best Practices

### For New Users

1. **Start with the Dashboard**
   - Get familiar with the interface
   - Understand the statistics and charts
   - Explore without pressure

2. **Practice with Known Safe IOCs**
   - Try analyzing `google.com` (safe domain)
   - Test with `8.8.8.8` (Google DNS, clean IP)
   - This helps you understand what "clean" results look like

3. **Learn Threat Levels**
   - Analyze a few IOCs to understand different verdict levels
   - Compare "clean" vs "malicious" results
   - Notice patterns in detection ratios

4. **Use History Effectively**
   - Review past analyses before re-submitting
   - Build a personal threat database
   - Export important findings

### Security Best Practices

1. **Verify Before Acting**
   - Don't immediately block all flagged IOCs
   - Cross-reference with other sources
   - Consider false positive rates
   - Consult with security team for critical decisions

2. **Handle Sensitive Data Carefully**
   - Don't upload confidential files without approval
   - Remember: VirusTotal shares submissions publicly
   - Use hash analysis instead of uploading when possible

3. **Context Matters**
   - A "suspicious" verdict doesn't always mean malicious
   - Consider the source of the IOC
   - Look at multiple related IOCs
   - Use the Graph feature to see relationships

### Efficiency Tips

1. **Use Cached Results**
   - Check History before submitting new analyses
   - Save API quota and time
   - Cached results are usually sufficient

2. **Batch Your Work**
   - Collect IOCs before starting
   - Analyze them in sequence
   - Export results together

3. **Leverage Filters**
   - Use History filters to find specific analyses quickly
   - Filter by date for recent threats
   - Filter by verdict to focus on critical items

4. **Keyboard Shortcuts**
   - Press `/` to focus search box (if available)
   - Use Tab to navigate forms
   - Ctrl+F to search on page

### Analysis Best Practices

1. **Multiple IOC Types**
   - If you have a suspicious domain, also check its IP
   - Check URL hashes and the domain separately
   - Build a complete picture

2. **Look for Patterns**
   - Use Graph visualization to identify attack chains
   - Look for common infrastructure
   - Identify campaign patterns

3. **Document Your Findings**
   - Export results for records
   - Add notes (if feature available)
   - Share with team members

4. **Regular Monitoring**
   - Check Dashboard weekly
   - Review trends
   - Stay aware of emerging threats

### Advanced Tips

1. **API Integration** (if available)
   - Automate IOC submission from your tools
   - Integrate with incident response workflows
   - Build custom alerting

2. **Threat Hunting**
   - Use the platform proactively, not just reactively
   - Search for IOCs from threat reports
   - Verify indicators from security blogs

3. **Correlation**
   - Cross-reference multiple IOCs from the same incident
   - Use Graph to find hidden connections
   - Build threat actor profiles

### Dos and Don'ts

**✅ DO:**
- Analyze suspicious IOCs before blocking
- Keep history for audit purposes
- Export important findings
- Share threat intelligence with your team
- Verify results with multiple sources
- Use the platform regularly to stay sharp

**❌ DON'T:**
- Upload highly confidential files without approval
- Blindly trust a single engine's verdict
- Ignore context when interpreting results
- Exceed rate limits unnecessarily
- Share login credentials
- Delete important analysis history

---

## Quick Reference Card

### Common IOC Formats

| Type | Example |
|------|---------|
| IPv4 | `192.168.1.1` |
| IPv6 | `2001:0db8:85a3::8a2e:0370:7334` |
| Domain | `example.com` |
| Subdomain | `mail.example.com` |
| URL | `https://example.com/path` |
| MD5 Hash | `44d88612fea8a8f36de82e1278abb02f` |
| SHA-1 Hash | `3395856ce81f2b7382dee72602f798b642f14140` |
| SHA-256 Hash | `275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f` |

### Verdict Quick Guide

- 🔴 **CRITICAL** → Block immediately
- 🟠 **HIGH** → Investigate and likely block
- 🟡 **MEDIUM** → Monitor closely
- 🟢 **LOW** → Safe but verify context
- ✅ **CLEAN** → No threats found

### Key Metrics

- **Detection Ratio**: Malicious engines / Total engines
- **Risk Score**: 0-100% threat probability
- **Reputation Score**: 0-100 (for IPs, higher = worse)

---

## Glossary

- **IOC**: Indicator of Compromise - evidence of potential security breach
- **Hash**: Unique fingerprint of a file
- **Malicious**: Confirmed dangerous
- **Suspicious**: Potentially harmful
- **Clean**: No threats detected
- **False Positive**: Safe item incorrectly flagged as dangerous
- **API**: Application Programming Interface - how systems communicate
- **VT**: VirusTotal - multi-engine malware scanning service
- **AbuseIPDB**: Database of reported malicious IPs
- **SIEM**: Security Information and Event Management system

---

## Version Information

**User Guide Version**: 1.0  
**Last Updated**: December 9, 2025  
**Platform**: VigilanceX IOC Analyzer  

---

## Appendix: Administrator Information

For system administrators managing the platform:

### Configuration
- MongoDB database required
- VirusTotal API key configuration
- AbuseIPDB API key (optional)
- Environment variables in `.env.local`

### User Management
- Create users via admin interface
- Manage permissions
- Reset passwords
- Monitor usage

### Maintenance
- Regular database backups
- API quota monitoring
- Log file rotation
- Performance optimization

For full technical documentation, see `README.md` and deployment guides.

---

**End of User Guide**

*If you have questions not covered in this guide, please contact your system administrator or support team.*
