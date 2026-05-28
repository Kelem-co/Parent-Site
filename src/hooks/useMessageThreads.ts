import { useState } from 'react';
import type React from 'react';
import { MessageThread } from '@/types';
import { useSendMessage } from './useSendMessage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HomeworkScore {
  title: string;
  score: string;
  color: string;
}

export interface FocusStudent {
  name: string;
  id: string;
  initials: string;
  avatarBg: string;
  grade: string;
  avg: string;
  avgVal: number;
  tasks: string;
  tasksVal: number;
  engagement: string;
  engagementVal: number;
  homework: HomeworkScore[];
}

export interface LocalThread {
  id: string;
  teacherName: string;
  teacherInitials: string;
  subject: string;
  gradeLabel: string;
  avatarBg: string;
  time: string;
  unread: boolean;
  studentName: string;
  preview: string;
  phone: string;
  email: string;
  hours: string;
  focusStudent: FocusStudent;
  thread: MessageThread[];
}

export interface UseMessageThreadsReturn {
  threads: LocalThread[];
  selectedIdx: number;
  setSelectedIdx: (i: number) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleSend: (e?: React.FormEvent) => void;
  filteredThreads: LocalThread[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

// ─── Static Dataset ───────────────────────────────────────────────────────────

const localThreads: LocalThread[] = [
  {
    id: "T-01",
    teacherName: "Mr. Tadesse",
    teacherInitials: "MT",
    subject: "Mathematics",
    gradeLabel: "Grade 7A",
    avatarBg: "bg-[#3949AB]",
    time: "9:42 AM",
    unread: true,
    studentName: "SARA BEKELE",
    preview: "Sara's quiz result is now availa...",
    phone: "+251 911 23 4567",
    email: "t.tadesse@school.et",
    hours: "Available 8AM - 4PM",
    focusStudent: {
      name: "Sara Bekele",
      id: "STU-00421",
      initials: "SB",
      avatarBg: "bg-[#3949AB]",
      grade: "Grade 7A",
      avg: "76%",
      avgVal: 76,
      tasks: "7/10",
      tasksVal: 70,
      engagement: "88%",
      engagementVal: 88,
      homework: [
        {
          title: "Mid-Term Quiz",
          score: "28/30",
          color: "text-emerald-600 bg-emerald-50 border border-emerald-100/40",
        },
        {
          title: "Problem Solving",
          score: "8/10",
          color: "text-[#3949AB] bg-blue-50 border border-blue-100/40",
        },
        {
          title: "Linear Equations",
          score: "14/20",
          color: "text-amber-600 bg-[#fffbe6] border border-[#ffe58f]/40",
        },
        {
          title: "Ch.3 Summary",
          score: "Missing",
          color: "text-red-500 bg-red-50 border border-red-100/40",
        },
      ],
    },
    thread: [
      {
        dateGroup: "MONDAY, JUN 2",
        messages: [
          {
            sender: "teacher",
            text: "Hello! I wanted to let you know that Sara did very well in today's classwork on linear equations. She's showing great progress.",
            time: "Mon, 10:15 AM",
          },
          {
            sender: "parent",
            text: "That's wonderful to hear! She's been practicing at home. Thank you for letting me know.",
            time: "Mon, 10:20 AM",
          },
        ],
      },
      {
        dateGroup: "TODAY, JUN 3",
        messages: [
          {
            sender: "teacher",
            text: "Good morning! Sara's mid-term practice quiz has been graded — she scored 28/30.",
            time: "Today, 9:30 AM",
          },
        ],
      },
    ],
  },
  {
    id: "T-02",
    teacherName: "Ms. Alemu",
    teacherInitials: "MA",
    subject: "Biology",
    gradeLabel: "Grade 7A",
    avatarBg: "bg-[#128267]",
    time: "Yesterday",
    unread: false,
    studentName: "SARA BEKELE",
    preview: "Lab report submitted, thank ...",
    phone: "+251 912 34 5678",
    email: "m.alemu@school.et",
    hours: "Available 9AM - 3PM",
    focusStudent: {
      name: "Sara Bekele",
      id: "STU-00421",
      initials: "SB",
      avatarBg: "bg-[#3949AB]",
      grade: "Grade 7A",
      avg: "76%",
      avgVal: 76,
      tasks: "7/10",
      tasksVal: 70,
      engagement: "88%",
      engagementVal: 88,
      homework: [
        {
          title: "Photosynthesis Lab",
          score: "9.5/10",
          color: "text-emerald-600 bg-emerald-50 border border-emerald-100/40",
        },
        {
          title: "Plant Cell Diagram",
          score: "10/10",
          color: "text-emerald-600 bg-emerald-50 border border-emerald-100/40",
        },
        {
          title: "Quiz 1 Biology",
          score: "8/10",
          color: "text-[#3949AB] bg-blue-50 border border-blue-100/40",
        },
      ],
    },
    thread: [
      {
        dateGroup: "FRIDAY, MAY 30",
        messages: [
          {
            sender: "teacher",
            text: "Dear parent, the biology lab report from Sara was submitted today. Thank you!",
            time: "Fri, 3:15 PM",
          },
          {
            sender: "parent",
            text: "Excellent. Please let me know if she needs extra help on photosynthesis.",
            time: "Fri, 3:40 PM",
          },
        ],
      },
      {
        dateGroup: "YESTERDAY",
        messages: [
          {
            sender: "teacher",
            text: "Lab report submitted, thank you. She did excellent, 9.5 out of 10!",
            time: "Yesterday, 4:20 PM",
          },
        ],
      },
    ],
  },
  {
    id: "T-03",
    teacherName: "Dr. Haile",
    teacherInitials: "DH",
    subject: "Chemistry",
    gradeLabel: "Grade 7A",
    avatarBg: "bg-[#c85a23]",
    time: "Mon",
    unread: true,
    studentName: "SARA BEKELE",
    preview: "The diagram project is still pe...",
    phone: "+251 913 45 6789",
    email: "h.haile@school.et",
    hours: "Available 10AM - 5PM",
    focusStudent: {
      name: "Sara Bekele",
      id: "STU-00421",
      initials: "SB",
      avatarBg: "bg-[#3949AB]",
      grade: "Grade 7A",
      avg: "76%",
      avgVal: 76,
      tasks: "7/10",
      tasksVal: 70,
      engagement: "88%",
      engagementVal: 88,
      homework: [
        {
          title: "Periodic Table Quiz",
          score: "7/10",
          color: "text-[#3949AB]/80 bg-blue-50 border border-blue-50",
        },
        {
          title: "Molecular Prep",
          score: "Pending",
          color: "text-amber-500 bg-[#fffbe6] border border-[#ffe58f]/40",
        },
        {
          title: "Lab Report 2",
          score: "Missing",
          color: "text-red-500 bg-red-50 border border-red-100/40",
        },
      ],
    },
    thread: [
      {
        dateGroup: "MONDAY, JUN 2",
        messages: [
          {
            sender: "teacher",
            text: "Hello, the molecular diagram project is still pending for Sara Bekele. Please check.",
            time: "Mon, 11:00 AM",
          },
        ],
      },
    ],
  },
  {
    id: "T-04",
    teacherName: "Ms. Biruk T.",
    teacherInitials: "BT",
    subject: "English",
    gradeLabel: "Grade 4B",
    avatarBg: "bg-[#4f53cc]",
    time: "Sun",
    unread: false,
    studentName: "YONAS BEKELE",
    preview: "He did very well this week!",
    phone: "+251 914 56 7890",
    email: "b.tesfaye@school.et",
    hours: "Available 8AM - 2PM",
    focusStudent: {
      name: "Yonas Bekele",
      id: "STU-00422",
      initials: "YB",
      avatarBg: "bg-[#128267]",
      grade: "Grade 4B",
      avg: "84%",
      avgVal: 84,
      tasks: "9/10",
      tasksVal: 90,
      engagement: "92%",
      engagementVal: 92,
      homework: [
        {
          title: "Spelling Bee Champ",
          score: "10/10",
          color: "text-[#128267] font-bold bg-[#e6fcf4] border-none",
        },
        {
          title: "Vocabulary Practice",
          score: "9.5/10",
          color: "text-[#128267] font-bold bg-[#e6fcf4] border-none",
        },
        {
          title: "Grammar Quiz",
          score: "8/10",
          color: "text-[#3949AB] font-bold bg-blue-50 border-none",
        },
      ],
    },
    thread: [
      {
        dateGroup: "SUNDAY, JUN 1",
        messages: [
          {
            sender: "teacher",
            text: "He did very well this week in the spelling bee and reading exercises!",
            time: "Sun, 2:40 PM",
          },
          {
            sender: "parent",
            text: "Awesome news, thank you Ms. Biruk!",
            time: "Sun, 3:00 PM",
          },
        ],
      },
    ],
  },
  {
    id: "T-05",
    teacherName: "Mr. Gebre",
    teacherInitials: "TG",
    subject: "History",
    gradeLabel: "Grade 10A",
    avatarBg: "bg-[#5d7c63]",
    time: "Fri",
    unread: false,
    studentName: "LIYA BEKELE",
    preview: "Chemistry exam is next Thur...",
    phone: "+251 915 67 8901",
    email: "g.teshome@school.et",
    hours: "Available 9AM - 4PM",
    focusStudent: {
      name: "Liya Bekele",
      id: "STU-00502",
      initials: "LB",
      avatarBg: "bg-[#c85a23]",
      grade: "Grade 10A",
      avg: "89%",
      avgVal: 89,
      tasks: "10/10",
      tasksVal: 100,
      engagement: "95%",
      engagementVal: 95,
      homework: [
        {
          title: "French Revolution",
          score: "10/10",
          color: "text-[#5d7c63] font-bold bg-slate-50 border-none",
        },
        {
          title: "Timeline draft",
          score: "9/10",
          color: "text-[#5d7c63] font-bold bg-slate-50 border-none",
        },
        {
          title: "Class essay",
          score: "8.5/10",
          color: "text-[#3949AB] font-bold bg-blue-50 border-none",
        },
      ],
    },
    thread: [
      {
        dateGroup: "FRIDAY, MAY 30",
        messages: [
          {
            sender: "teacher",
            text: "Chemistry exam is next Thursday.",
            time: "Fri, 10:00 AM",
          },
          {
            sender: "parent",
            text: "Thank you, we will make sure she prepares!",
            time: "Fri, 10:30 AM",
          },
        ],
      },
    ],
  },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessageThreads(): UseMessageThreadsReturn {
  const [threads, setThreads] = useState<LocalThread[]>(localThreads);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');

  const currentThreadId = threads[selectedIdx]?.id ?? '';
  const sendMessageMutation = useSendMessage(currentThreadId);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const updated = [...threads];
    const target = { ...updated[selectedIdx] };
    const threadCopy = [...target.thread];

    // Find or create the "TODAY, JUN 3" date group
    let todayGroupIdx = threadCopy.findIndex(
      (group) => group.dateGroup === 'TODAY, JUN 3',
    );

    if (todayGroupIdx === -1) {
      threadCopy.push({ dateGroup: 'TODAY, JUN 3', messages: [] });
      todayGroupIdx = threadCopy.length - 1;
    }

    const todayGroup = {
      ...threadCopy[todayGroupIdx],
      messages: [
        ...threadCopy[todayGroupIdx].messages,
        {
          sender: 'parent' as const,
          text: replyText,
          time: 'Today, 11:51 AM',
        },
      ],
    };

    threadCopy[todayGroupIdx] = todayGroup;

    updated[selectedIdx] = {
      ...target,
      thread: threadCopy,
      time: 'Today',
      preview: replyText,
      unread: false,
    };

    setThreads(updated);
    setReplyText('');
    sendMessageMutation.mutate({ text: replyText });
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return {
    threads,
    selectedIdx,
    setSelectedIdx,
    replyText,
    setReplyText,
    handleSend,
    filteredThreads,
    searchTerm,
    setSearchTerm,
  };
}
