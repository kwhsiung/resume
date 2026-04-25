import type { Education, Job, Resume, SkillGroup } from "./parseResume.js";
import {
  escapeHtml,
  formatDateRange,
  formatDegree,
  formatLinkText,
  formatLocation,
  formatPhone,
  renderInline,
} from "./formatters.js";

const HEADER_SUBTITLE = "Senior Front-End Engineer";

const STYLES = `        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
            --bg-color: #ffffff;
            --text-color: #2c3e50;
            --text-secondary: #34495e;
            --text-muted: #7f8c8d;
            --accent-color: #3498db;
            --border-color: #ecf0f1;
            --section-bg: #f8f9fa;
        }

        [data-theme="dark"] {
            --bg-color: #1a1a1a;
            --text-color: #e0e0e0;
            --text-secondary: #c0c0c0;
            --text-muted: #a0a0a0;
            --accent-color: #5dade2;
            --border-color: #404040;
            --section-bg: #2d2d2d;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background: var(--bg-color);
            font-size: 14px;
            max-width: 220mm;
            margin: 0 auto;
            padding: 15mm;
            transition: background-color 0.3s, color 0.3s;
        }

        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: var(--bg-color);
            border: none;
            padding: 10px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .theme-toggle:hover {
            transform: scale(1.1);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid var(--accent-color);
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-color);
            margin-bottom: 5px;
            letter-spacing: -0.5px;
        }

        .header .title {
            font-size: 18px;
            color: var(--accent-color);
            font-weight: 500;
            margin-bottom: 15px;
        }

        .contact-info {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 12px;
        }

        .contact-item {
            color: var(--text-muted);
            white-space: nowrap;
        }

        .contact-item a {
            color: var(--accent-color);
            text-decoration: none;
        }

        .section {
            margin-bottom: 25px;
        }

        .section h2 {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 12px;
            padding-bottom: 5px;
            border-bottom: 1px solid var(--border-color);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .about {
            font-size: 14px;
            line-height: 1.7;
            color: var(--text-secondary);
            text-align: justify;
        }

        .experience-item {
            margin-bottom: 20px;
        }

        .job-header {
            margin-bottom: 8px;
        }

        .job-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
        }

        .company-info {
            font-size: 14px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .company-name {
            font-weight: 500;
            color: var(--accent-color);
        }

        .achievements {
            margin-top: 8px;
        }

        .achievement {
            margin-bottom: 6px;
            padding-left: 15px;
            position: relative;
            color: var(--text-secondary);
            font-size: 13px;
            line-height: 1.5;
        }

        .achievement::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--accent-color);
            font-weight: bold;
        }

        .achievement a {
            color: var(--accent-color);
            text-decoration: none;
        }

        .achievement a:hover {
            text-decoration: underline;
        }

        .education-item {
            margin-bottom: 10px;
        }

        .degree {
            font-weight: 500;
            color: var(--text-color);
        }

        .school {
            color: var(--accent-color);
            font-weight: 500;
        }

        .date {
            color: var(--text-muted);
            font-size: 13px;
        }

        .achievements-section {
            background: var(--section-bg);
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }

        .achievements-section ul {
            list-style: none;
        }

        .achievements-section li {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.4;
        }

        .achievements-section li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--accent-color);
            font-weight: bold;
        }

        .achievements-section a {
            color: var(--accent-color);
            text-decoration: none;
        }

        .achievements-section a:hover {
            text-decoration: underline;
        }

        @media print {
            .theme-toggle {
                display: none !important;
            }

            body {
                font-size: 13px;
                padding: 10mm;
                background: white !important;
                color: black !important;
            }

            .section {
                margin-bottom: 20px;
            }

            .experience-item {
                page-break-inside: avoid;
                margin-bottom: 15px;
            }

            .achievements-section {
                background: #f8f9fa !important;
            }
        }`;

const SCRIPT = `        function toggleTheme() {
            const body = document.body;
            const themeIcon = document.getElementById('theme-icon');

            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                themeIcon.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            } else {
                body.setAttribute('data-theme', 'dark');
                themeIcon.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            const savedTheme = localStorage.getItem('theme');
            const themeIcon = document.getElementById('theme-icon');

            if (savedTheme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeIcon.textContent = '☀️';
            }
        });`;

function renderHeader(resume: Resume): string {
  const phone = formatPhone(resume.contact.mobile);
  const linkedin = formatLinkText(resume.contact.linkedin);
  const github = formatLinkText(resume.contact.github);
  return `    <div class="header">
        <h1>${escapeHtml(resume.name)}</h1>
        <div class="title">${escapeHtml(HEADER_SUBTITLE)}</div>
        <div class="contact-info">
            <div class="contact-item">📧 ${escapeHtml(resume.contact.email)}</div>
            <div class="contact-item">📱 ${escapeHtml(phone)}</div>
            <div class="contact-item">💼 <a href="${escapeHtml(resume.contact.linkedin)}">${escapeHtml(linkedin)}</a></div>
            <div class="contact-item">💻 <a href="${escapeHtml(resume.contact.github)}">${escapeHtml(github)}</a></div>
        </div>
    </div>`;
}

function renderSummary(resume: Resume): string {
  return `    <div class="section">
        <h2>Professional Summary</h2>
        <div class="about">
            ${renderInline(resume.summary)}
        </div>
    </div>`;
}

function renderJob(job: Job): string {
  const dateRange = formatDateRange(job.date.start, job.date.end);
  const location = formatLocation(job.location, job.locationType);
  const meta = [
    `<span class="company-name">${escapeHtml(job.company)}</span>`,
    dateRange,
    location,
  ].filter(Boolean).join(" | ");
  const achievements = job.description
    .map((d) => `                <div class="achievement">\n                    ${renderInline(d)}\n                </div>`)
    .join("\n");
  const skills = job.skills.length > 0
    ? `\n            <div style="margin-top: 8px; font-size: 13px; color: var(--accent-color); font-weight: 500;">\n                Key Technologies: ${escapeHtml(job.skills.join(", "))}\n            </div>`
    : "";
  return `        <div class="experience-item">
            <div class="job-header">
                <div class="job-title">${escapeHtml(job.title)}</div>
                <div class="company-info">
                    ${meta}
                </div>
            </div>
            <div class="achievements">
${achievements}
            </div>${skills}
        </div>`;
}

function renderExperience(resume: Resume): string {
  return `    <div class="section">
        <h2>Professional Experience</h2>

${resume.experience.map(renderJob).join("\n\n")}
    </div>`;
}

function renderSkillGroup(group: SkillGroup): string {
  return `            <div>
                <strong style="color: var(--text-color);">${escapeHtml(group.category)}</strong>
                <div style="color: var(--text-secondary);">${escapeHtml(group.items)}</div>
            </div>`;
}

function renderSkills(resume: Resume): string {
  return `    <div class="section">
        <h2>Skills</h2>
        <div class="skills-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 13px;">
${resume.skills.map(renderSkillGroup).join("\n")}
        </div>
    </div>`;
}

function renderEducationItem(edu: Education): string {
  return `        <div class="education-item">
            <div class="degree">${escapeHtml(formatDegree(edu.degree))}</div>
            <div class="school">${escapeHtml(edu.school)}</div>
            <div class="date">${escapeHtml(`${edu.date.start} - ${edu.date.end}`)} | Taipei, Taiwan</div>
        </div>`;
}

function renderEducation(resume: Resume): string {
  return `    <div class="section">
        <h2>Education</h2>
${resume.education.map(renderEducationItem).join("\n")}
    </div>`;
}

function renderAchievements(resume: Resume): string {
  const items = resume.achievements
    .map((a) => `                <li>${renderInline(a)}</li>`)
    .join("\n\n");
  return `    <div class="section">
        <h2>Notable Achievements</h2>
        <div class="achievements-section">
            <ul>
${items}
            </ul>
        </div>
    </div>`;
}

export function renderHtml(resume: Resume): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(resume.name)} - Resume</title>
    <style>
${STYLES}
    </style>
</head>
<body>
    <button class="theme-toggle" onclick="toggleTheme()" title="Toggle Dark/Light Mode">
        <span id="theme-icon">🌙</span>
    </button>

${renderHeader(resume)}

${renderSummary(resume)}

${renderExperience(resume)}

${renderSkills(resume)}

${renderEducation(resume)}

${renderAchievements(resume)}

    <script>
${SCRIPT}
    </script>

</body>
</html>
`;
}
