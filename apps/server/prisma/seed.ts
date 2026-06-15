import "dotenv/config";
import { AssessmentType, PrismaClient, Semester } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const HASH_ROUNDS = 10;
const DEFAULT_PASSWORD = "Password@123";

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@fci.edu";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@1234";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  // ── Superadmin ──────────────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, HASH_ROUNDS),
        name: adminName,
        role: "superadmin",
        mustChangePassword: false,
      },
    });
    console.log(`✓ Superadmin: ${adminEmail}`);
  } else {
    console.log(`- Superadmin already exists: ${adminEmail}`);
  }

  // ── IT user ─────────────────────────────────────────────────────────────────
  const itEmail = "it@fci.edu";
  if (!(await prisma.user.findUnique({ where: { email: itEmail } }))) {
    await prisma.user.create({
      data: {
        email: itEmail,
        passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, HASH_ROUNDS),
        name: "IT Staff",
        role: "it",
        mustChangePassword: false,
      },
    });
    console.log(`✓ IT user: ${itEmail}`);
  }

  // ── Join year ────────────────────────────────────────────────────────────────
  const joinYear = await prisma.joinYear.upsert({
    where: { year: 2024 },
    update: {},
    create: { year: 2024 },
  });
  console.log(`✓ Join year: ${joinYear.year}`);

  // ── Majors ───────────────────────────────────────────────────────────────────
  const [cs, it, ai] = await Promise.all([
    prisma.major.upsert({ where: { code: "CS" }, update: {}, create: { name: "Computer Science", code: "CS" } }),
    prisma.major.upsert({ where: { code: "IT" }, update: {}, create: { name: "Information Technology", code: "IT" } }),
    prisma.major.upsert({ where: { code: "AI" }, update: {}, create: { name: "Artificial Intelligence", code: "AI" } }),
  ]);
  console.log(`✓ Majors: CS, IT, AI`);

  // ── Subjects (4 per major) ───────────────────────────────────────────────────
  const subjectData = [
    // CS subjects
    { code: "CS101", name: "Introduction to Programming", semester: Semester.first,  joinYearId: joinYear.id, majorId: cs.id },
    { code: "CS102", name: "Data Structures",             semester: Semester.second, joinYearId: joinYear.id, majorId: cs.id },
    { code: "CS201", name: "Algorithms",                  semester: Semester.first,  joinYearId: joinYear.id, majorId: cs.id },
    { code: "CS202", name: "Operating Systems",           semester: Semester.second, joinYearId: joinYear.id, majorId: cs.id },
    // IT subjects
    { code: "IT101", name: "Networking Fundamentals",     semester: Semester.first,  joinYearId: joinYear.id, majorId: it.id },
    { code: "IT102", name: "Database Systems",            semester: Semester.second, joinYearId: joinYear.id, majorId: it.id },
    { code: "IT201", name: "Web Development",             semester: Semester.summer, joinYearId: joinYear.id, majorId: it.id },
    { code: "IT202", name: "Cybersecurity Basics",        semester: Semester.second, joinYearId: joinYear.id, majorId: it.id },
    // AI subjects
    { code: "AI101", name: "Python for AI",               semester: Semester.first,  joinYearId: joinYear.id, majorId: ai.id },
    { code: "AI102", name: "Machine Learning",            semester: Semester.second, joinYearId: joinYear.id, majorId: ai.id },
    { code: "AI201", name: "Deep Learning",               semester: Semester.summer, joinYearId: joinYear.id, majorId: ai.id },
    { code: "AI202", name: "Natural Language Processing", semester: Semester.second, joinYearId: joinYear.id, majorId: ai.id },
  ];

  const subjects: Record<string, { id: string }> = {};
  for (const s of subjectData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    subjects[s.code] = subject;
  }
  console.log(`✓ Subjects: 12`);

  // ── Teachers & sub-teachers ──────────────────────────────────────────────────
  const staffData = [
    { email: "teacher1@fci.edu", name: "Dr. Ahmed Hassan",  role: "teacher"     as const, major: cs },
    { email: "teacher2@fci.edu", name: "Dr. Sara Nour",     role: "teacher"     as const, major: ai },
    { email: "subteacher1@fci.edu", name: "Eng. Omar Fathy", role: "sub_teacher" as const, major: it },
    { email: "subteacher2@fci.edu", name: "Eng. Nada Karim", role: "sub_teacher" as const, major: cs },
  ];

  const staffUsers: { id: string; major: typeof cs }[] = [];
  for (const s of staffData) {
    let user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: s.email,
          passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, HASH_ROUNDS),
          name: s.name,
          role: s.role,
          mustChangePassword: false,
        },
      });
    }
    staffUsers.push({ id: user.id, major: s.major });
  }
  console.log(`✓ Staff: 2 teachers, 2 sub-teachers`);

  // Assign each staff to join year, their major, and 2 subjects of that major
  const subjectsByCsId = [subjects["CS101"]!.id, subjects["CS102"]!.id];
  const subjectsByItId = [subjects["IT101"]!.id, subjects["IT102"]!.id];
  const subjectsByAiId = [subjects["AI101"]!.id, subjects["AI102"]!.id];

  const subjectsByMajor: Record<string, string[]> = {
    [cs.id]: subjectsByCsId,
    [it.id]: subjectsByItId,
    [ai.id]: subjectsByAiId,
  };

  for (const staff of staffUsers) {
    // Join year assignment
    await prisma.staffJoinYearAssignment.upsert({
      where: { userId_joinYearId: { userId: staff.id, joinYearId: joinYear.id } },
      update: {},
      create: { userId: staff.id, joinYearId: joinYear.id },
    });

    // Major assignment
    await prisma.staffMajorAssignment.upsert({
      where: { userId_majorId_joinYearId: { userId: staff.id, majorId: staff.major.id, joinYearId: joinYear.id } },
      update: {},
      create: { userId: staff.id, majorId: staff.major.id, joinYearId: joinYear.id },
    });

    // Subject assignments
    const theirSubjects = subjectsByMajor[staff.major.id] ?? [];
    for (const subjectId of theirSubjects) {
      await prisma.staffSubjectAssignment.upsert({
        where: { userId_subjectId: { userId: staff.id, subjectId } },
        update: {},
        create: { userId: staff.id, subjectId },
      });
    }
  }
  console.log(`✓ Staff assignments created`);

  // ── Students (10) ────────────────────────────────────────────────────────────
  const studentDefs = [
    { email: "student01@fci.edu", name: "Ali Mostafa",    major: cs },
    { email: "student02@fci.edu", name: "Fatma Saleh",    major: cs },
    { email: "student03@fci.edu", name: "Youssef Nagi",   major: cs },
    { email: "student04@fci.edu", name: "Nour Hamed",     major: cs },
    { email: "student05@fci.edu", name: "Karim Essam",    major: it },
    { email: "student06@fci.edu", name: "Rania Ibrahim",  major: it },
    { email: "student07@fci.edu", name: "Tarek Mansour",  major: it },
    { email: "student08@fci.edu", name: "Salma Adel",     major: ai },
    { email: "student09@fci.edu", name: "Mohamed Fawzy",  major: ai },
    { email: "student10@fci.edu", name: "Hana Gamal",     major: ai },
  ];

  const allSubjectsByMajor: Record<string, string[]> = {
    [cs.id]: subjectData.filter((s) => s.majorId === cs.id).map((s) => subjects[s.code]!.id),
    [it.id]: subjectData.filter((s) => s.majorId === it.id).map((s) => subjects[s.code]!.id),
    [ai.id]: subjectData.filter((s) => s.majorId === ai.id).map((s) => subjects[s.code]!.id),
  };

  for (const def of studentDefs) {
    let student = await prisma.user.findUnique({ where: { email: def.email } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: def.email,
          passwordHash: await bcrypt.hash(DEFAULT_PASSWORD, HASH_ROUNDS),
          name: def.name,
          role: "student",
          mustChangePassword: false,
          joinYearId: joinYear.id,
          majorId: def.major.id,
        },
      });
    }

    // Enroll in all subjects for their major
    const theirSubjects = allSubjectsByMajor[def.major.id] ?? [];
    for (const subjectId of theirSubjects) {
      await prisma.subjectEnrollment.upsert({
        where: { userId_subjectId: { userId: student.id, subjectId } },
        update: {},
        create: { userId: student.id, subjectId },
      });
    }
  }
  console.log(`✓ Students: 10 (4 CS, 3 IT, 3 AI), all enrolled in their major's subjects`);

  // ── Assessments ──────────────────────────────────────────────────────────────
  const teacher1 = (await prisma.user.findUnique({ where: { email: "teacher1@fci.edu" } }))!;
  const teacher2 = (await prisma.user.findUnique({ where: { email: "teacher2@fci.edu" } }))!;

  const now = new Date();
  const past = (days: number) => new Date(now.getTime() - days * 86400_000);
  const future = (days: number) => new Date(now.getTime() + days * 86400_000);

  interface QuizSeedDef {
    type: "quiz";
    title: string;
    subjectCode: string;
    creatorEmail: string;
    startDate: Date;
    endDate: Date;
    isVisible: boolean;
    publishedAt: Date | null;
    markReadable: boolean;
    questions: { text: string; degree: number; options: string[]; correctOption: number }[];
  }
  interface AssignmentSeedDef {
    type: "assignment";
    title: string;
    subjectCode: string;
    creatorEmail: string;
    startDate: Date;
    endDate: Date;
    isVisible: boolean;
    publishedAt: Date | null;
    markReadable: boolean;
    totalMark: number;
  }
  type AssessmentSeedDef = QuizSeedDef | AssignmentSeedDef;

  const assessmentDefs: AssessmentSeedDef[] = [
    // CS101 quiz — open now, visible, mark not readable
    {
      type: "quiz",
      title: "Midterm Quiz — Intro to Programming",
      subjectCode: "CS101",
      creatorEmail: "teacher1@fci.edu",
      startDate: past(1),
      endDate: future(2),
      isVisible: true,
      publishedAt: past(3),
      markReadable: false,
      questions: [
        {
          text: "Which keyword declares a variable in Python?",
          degree: 2,
          options: ["var", "let", "int", "No keyword needed"],
          correctOption: 3,
        },
        {
          text: "What does `len([1, 2, 3])` return?",
          degree: 1,
          options: ["2", "3", "4", "Error"],
          correctOption: 1,
        },
        {
          text: "Which operator checks equality in Python?",
          degree: 1,
          options: ["=", "==", "===", "!="],
          correctOption: 1,
        },
      ],
    },
    // CS102 quiz — upcoming, visible
    {
      type: "quiz",
      title: "Data Structures — Quiz 1",
      subjectCode: "CS102",
      creatorEmail: "teacher1@fci.edu",
      startDate: future(3),
      endDate: future(4),
      isVisible: true,
      publishedAt: past(2),
      markReadable: false,
      questions: [
        {
          text: "Which data structure uses LIFO order?",
          degree: 2,
          options: ["Queue", "Stack", "Array", "Linked List"],
          correctOption: 1,
        },
        {
          text: "What is the time complexity of binary search?",
          degree: 2,
          options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
          correctOption: 2,
        },
      ],
    },
    // CS101 assignment — open, marks released
    {
      type: "assignment",
      title: "Assignment 1 — Hello World Program",
      subjectCode: "CS101",
      creatorEmail: "teacher1@fci.edu",
      startDate: past(7),
      endDate: future(1),
      isVisible: true,
      publishedAt: past(8),
      markReadable: true,
      totalMark: 20,
    },
    // AI101 quiz — ended, marks released
    {
      type: "quiz",
      title: "Python Basics Quiz",
      subjectCode: "AI101",
      creatorEmail: "teacher2@fci.edu",
      startDate: past(10),
      endDate: past(9),
      isVisible: true,
      publishedAt: past(12),
      markReadable: true,
      questions: [
        {
          text: "What does `type(3.14)` return?",
          degree: 2,
          options: ["int", "float", "str", "double"],
          correctOption: 1,
        },
        {
          text: "Which function prints output in Python?",
          degree: 1,
          options: ["echo()", "console.log()", "print()", "printf()"],
          correctOption: 2,
        },
      ],
    },
    // AI102 assignment — upcoming
    {
      type: "assignment",
      title: "ML Assignment — Linear Regression",
      subjectCode: "AI102",
      creatorEmail: "teacher2@fci.edu",
      startDate: future(2),
      endDate: future(10),
      isVisible: true,
      publishedAt: past(1),
      markReadable: false,
      totalMark: 50,
    },
    // IT101 hidden quiz (not visible yet)
    {
      type: "quiz",
      title: "Networking Fundamentals — Draft Quiz",
      subjectCode: "IT101",
      creatorEmail: "subteacher1@fci.edu",
      startDate: future(5),
      endDate: future(6),
      isVisible: false,
      publishedAt: null,
      markReadable: false,
      questions: [
        {
          text: "What does IP stand for?",
          degree: 1,
          options: ["Internet Protocol", "Internal Port", "Input Packet", "Interface Program"],
          correctOption: 0,
        },
      ],
    },
  ];

  const createdAssessments: Record<string, string> = {};

  for (const def of assessmentDefs) {
    const creatorEmail = def.creatorEmail;
    const creator = await prisma.user.findUnique({ where: { email: creatorEmail } });
    if (!creator) continue;
    const subject = subjects[def.subjectCode];
    if (!subject) continue;

    const existing = await prisma.assessment.findFirst({
      where: { title: def.title, subjectId: subject.id },
    });

    let assessmentId: string;
    if (existing) {
      assessmentId = existing.id;
      console.log(`- Assessment already exists: "${def.title}"`);
    } else {
      const assessment = await prisma.assessment.create({
        data: {
          type: def.type as AssessmentType,
          subjectId: subject.id,
          creatorId: creator.id,
          title: def.title,
          startDate: def.startDate,
          endDate: def.endDate,
          isVisible: def.isVisible,
          publishedAt: def.publishedAt,
          markReadable: def.markReadable,
        },
      });
      assessmentId = assessment.id;

      if (def.type === "quiz") {
        await prisma.quiz.create({ data: { assessmentId } });
        for (const q of def.questions) {
          await prisma.quizQuestion.create({
            data: {
              quizId: assessmentId,
              text: q.text,
              degree: q.degree,
              correctOption: q.correctOption,
              options: { create: q.options.map((text, index) => ({ text, index })) },
            },
          });
        }
      } else {
        await prisma.assignmentDetails.create({
          data: { assessmentId, totalMark: def.totalMark },
        });
      }

      console.log(`✓ Assessment: "${def.title}"`);
    }

    createdAssessments[def.title] = assessmentId;
  }

  // ── Quiz submissions (students take the open quiz) ──────────────────────────
  const csStudents = await prisma.user.findMany({ where: { role: "student", major: { code: "CS" } } });
  const midtermQuizId = createdAssessments["Midterm Quiz — Intro to Programming"];

  if (midtermQuizId) {
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: midtermQuizId },
      include: { options: true },
    });

    for (const student of csStudents.slice(0, 2)) {
      const already = await prisma.quizSubmission.findUnique({
        where: { assessmentId_studentId: { assessmentId: midtermQuizId, studentId: student.id } },
      });
      if (already) continue;

      let mark = 0;
      const answers = questions.map((q) => {
        const picked = q.correctOption;
        const isCorrect = true;
        mark += q.degree;
        return { questionId: q.id, selectedOption: picked, isCorrect };
      });

      await prisma.quizSubmission.create({
        data: {
          assessmentId: midtermQuizId,
          studentId: student.id,
          mark,
          answers: { create: answers },
        },
      });
    }
    console.log(`✓ Quiz submissions: 2 CS students submitted midterm quiz`);
  }

  // ── AI ended quiz submissions ───────────────────────────────────────────────
  const aiStudents = await prisma.user.findMany({ where: { role: "student", major: { code: "AI" } } });
  const aiQuizId = createdAssessments["Python Basics Quiz"];

  if (aiQuizId) {
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: aiQuizId },
      include: { options: true },
    });

    for (const student of aiStudents) {
      const already = await prisma.quizSubmission.findUnique({
        where: { assessmentId_studentId: { assessmentId: aiQuizId, studentId: student.id } },
      });
      if (already) continue;

      let mark = 0;
      const answers = questions.map((q, i) => {
        const correct = i % 2 === 0;
        if (correct) mark += q.degree;
        return { questionId: q.id, selectedOption: correct ? q.correctOption : (q.correctOption + 1) % q.options.length, isCorrect: correct };
      });

      await prisma.quizSubmission.create({
        data: { assessmentId: aiQuizId, studentId: student.id, mark, answers: { create: answers } },
      });
    }
    console.log(`✓ Quiz submissions: ${aiStudents.length} AI students submitted Python Basics Quiz`);
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
