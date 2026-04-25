import { readFileSync } from "node:fs";

export type Contact = {
  linkedin: string;
  github: string;
  email: string;
  mobile: string;
};

export type DateRange = { start: string; end: string };

export type Job = {
  company: string;
  title: string;
  date: DateRange;
  location?: string;
  locationType?: string;
  employmentType?: string;
  description: string[];
  skills: string[];
};

export type SkillGroup = { category: string; items: string };

export type Education = {
  school: string;
  degree: string;
  date: DateRange;
};

export type Resume = {
  name: string;
  summary: string;
  contact: Contact;
  experience: Job[];
  skills: SkillGroup[];
  education: Education[];
  achievements: string[];
};

type Node = { text: string; children: Node[] };

const INDENT_WIDTH = 4;

function parseOutline(source: string): Node[] {
  const lines = source.split("\n");
  const root: Node = { text: "", children: [] };
  const stack: { level: number; node: Node }[] = [{ level: -1, node: root }];

  for (const raw of lines) {
    if (!raw.trim()) continue;
    const match = raw.match(/^( *)- (.*)$/);
    if (!match) {
      throw new Error(`Line is not a bullet: ${JSON.stringify(raw)}`);
    }
    const [, indent, text] = match;
    if (indent.length % INDENT_WIDTH !== 0) {
      throw new Error(`Indent must be a multiple of ${INDENT_WIDTH}: ${JSON.stringify(raw)}`);
    }
    const level = indent.length / INDENT_WIDTH;
    const node: Node = { text, children: [] };
    while (stack[stack.length - 1].level >= level) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ level, node });
  }

  return root.children;
}

function findChild(parent: Node, label: string): Node | undefined {
  return parent.children.find((c) => c.text === label);
}

function requireChild(parent: Node, label: string, where: string): Node {
  const found = findChild(parent, label);
  if (!found) throw new Error(`Missing "${label}" under "${where}"`);
  return found;
}

function singleLeaf(node: Node, where: string): string {
  if (node.children.length !== 1 || node.children[0].children.length !== 0) {
    throw new Error(`Expected single leaf value under "${where}", got ${node.children.length} children`);
  }
  return node.children[0].text;
}

function parseDateRange(node: Node, where: string): DateRange {
  const start = requireChild(node, "Start", `${where} > Date`);
  const end = requireChild(node, "End", `${where} > Date`);
  return {
    start: singleLeaf(start, `${where} > Date > Start`),
    end: singleLeaf(end, `${where} > Date > End`),
  };
}

function leaves(node: Node): string[] {
  return node.children.map((c) => c.text);
}

function parseContact(node: Node): Contact {
  const linkedin = singleLeaf(requireChild(node, "LinkedIn", "Contact"), "Contact > LinkedIn");
  const github = singleLeaf(requireChild(node, "GitHub", "Contact"), "Contact > GitHub");
  const email = singleLeaf(requireChild(node, "Email", "Contact"), "Contact > Email");
  const mobile = singleLeaf(requireChild(node, "Mobile", "Contact"), "Contact > Mobile");
  return { linkedin, github, email, mobile };
}

function parseJob(node: Node): Job {
  const company = node.text;
  const where = `Experience > ${company}`;
  const title = singleLeaf(requireChild(node, "Title", where), `${where} > Title`);
  const date = parseDateRange(requireChild(node, "Date", where), where);
  const location = findChild(node, "Location");
  const locationType = findChild(node, "Location type");
  const employmentType = findChild(node, "Employment type");
  const description = leaves(requireChild(node, "Description", where));
  const skillsNode = findChild(node, "Skills");
  return {
    company,
    title,
    date,
    location: location ? singleLeaf(location, `${where} > Location`) : undefined,
    locationType: locationType ? singleLeaf(locationType, `${where} > Location type`) : undefined,
    employmentType: employmentType ? singleLeaf(employmentType, `${where} > Employment type`) : undefined,
    description,
    skills: skillsNode ? leaves(skillsNode) : [],
  };
}

function parseSkillGroup(node: Node): SkillGroup {
  return { category: node.text, items: singleLeaf(node, `Skills > ${node.text}`) };
}

function parseEducation(node: Node): Education {
  const school = node.text;
  const where = `Education > ${school}`;
  const degree = singleLeaf(requireChild(node, "Degree", where), `${where} > Degree`);
  const date = parseDateRange(requireChild(node, "Date", where), where);
  return { school, degree, date };
}

export function parseResume(path: string): Resume {
  const source = readFileSync(path, "utf8");
  const tree = parseOutline(source);

  const name = singleLeaf(requireChild({ text: "", children: tree }, "Name", "root"), "Name");
  const summary = singleLeaf(
    requireChild({ text: "", children: tree }, "Professional Summary", "root"),
    "Professional Summary",
  );
  const contact = parseContact(requireChild({ text: "", children: tree }, "Contact", "root"));
  const experience = requireChild({ text: "", children: tree }, "Experience", "root").children.map(parseJob);
  const skills = requireChild({ text: "", children: tree }, "Skills", "root").children.map(parseSkillGroup);
  const education = requireChild({ text: "", children: tree }, "Education", "root").children.map(parseEducation);
  const achievements = leaves(
    requireChild({ text: "", children: tree }, "Notable Achievements", "root"),
  );

  return { name, summary, contact, experience, skills, education, achievements };
}
