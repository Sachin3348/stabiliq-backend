import type { CourseModuleDto } from '../types/course';

export const COURSE_MODULES: CourseModuleDto[] = [
  {
    id: 'module-1',
    title: 'AI-Assisted Resume Writing & Optimization',
    description:
      'Learn how to leverage AI tools to create compelling resumes that pass ATS systems and attract recruiters.',
    lessons: [
      {
        id: 'l1',
        title: 'Introduction to AI Resume Tools',
        duration: '12:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l2',
        title: 'Keyword Optimization with AI',
        duration: '15:45',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l3',
        title: 'Formatting & Structure Best Practices',
        duration: '18:20',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l4',
        title: 'Tailoring Resume for Different Roles',
        duration: '14:10',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
    ],
    pdfs: [
      { id: 'p1', title: 'Resume Template - Tech Roles', url: '#' },
      { id: 'p2', title: 'ATS Keywords Checklist', url: '#' },
      { id: 'p3', title: 'Resume Action Verbs Guide', url: '#' },
    ],
    progress: 0,
  },
  {
    id: 'module-2',
    title: 'Smart Job Search with AI Tools',
    description:
      'Discover how to use AI-powered platforms and tools to find the right job opportunities faster.',
    lessons: [
      {
        id: 'l1',
        title: 'AI Job Boards & Aggregators',
        duration: '16:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l2',
        title: 'Using ChatGPT for Job Research',
        duration: '20:15',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l3',
        title: 'Company Research with AI',
        duration: '13:45',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l4',
        title: 'Tracking Applications with AI Tools',
        duration: '11:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
    ],
    pdfs: [
      { id: 'p1', title: 'Top AI Job Platforms List', url: '#' },
      { id: 'p2', title: 'Job Search Strategy Template', url: '#' },
    ],
    progress: 0,
  },
  {
    id: 'module-3',
    title: 'AI-Powered Interview Preparation',
    description:
      'Master interview techniques using AI mock interviews, answer generation, and feedback analysis.',
    lessons: [
      {
        id: 'l1',
        title: 'Common Interview Questions & AI Answers',
        duration: '19:25',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l2',
        title: 'Behavioral Interview Prep with AI',
        duration: '22:10',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l3',
        title: 'Technical Interview AI Tools',
        duration: '17:50',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l4',
        title: 'Mock Interview Platforms',
        duration: '15:35',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l5',
        title: 'Post-Interview Follow-up with AI',
        duration: '10:20',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
    ],
    pdfs: [
      { id: 'p1', title: '150 Interview Questions Bank', url: '#' },
      { id: 'p2', title: 'STAR Method Framework', url: '#' },
      { id: 'p3', title: 'Salary Negotiation Guide', url: '#' },
    ],
    progress: 0,
  },
  {
    id: 'module-4',
    title: 'Networking Automation with AI',
    description: 'Learn to leverage AI for effective networking, outreach, and relationship building.',
    lessons: [
      {
        id: 'l1',
        title: 'AI-Generated Connection Messages',
        duration: '14:40',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l2',
        title: 'Personalization at Scale with AI',
        duration: '18:55',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l3',
        title: 'Email Outreach Templates & Tools',
        duration: '16:15',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l4',
        title: 'Following Up Like a Pro',
        duration: '12:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
    ],
    pdfs: [
      { id: 'p1', title: 'LinkedIn Connection Message Templates', url: '#' },
      { id: 'p2', title: 'Networking Email Scripts', url: '#' },
    ],
    progress: 0,
  },
  {
    id: 'module-5',
    title: 'Personal Branding with AI Content',
    description:
      'Build your professional brand using AI-generated content for LinkedIn, blogs, and portfolios.',
    lessons: [
      {
        id: 'l1',
        title: 'Crafting Your Personal Brand Story',
        duration: '21:00',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l2',
        title: 'AI Content Creation for LinkedIn',
        duration: '19:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l3',
        title: 'Building a Portfolio with AI Tools',
        duration: '24:15',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l4',
        title: 'Thought Leadership Content Strategy',
        duration: '17:45',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
    ],
    pdfs: [
      { id: 'p1', title: 'Personal Brand Framework', url: '#' },
      { id: 'p2', title: 'LinkedIn Content Calendar', url: '#' },
      { id: 'p3', title: 'Portfolio Checklist', url: '#' },
    ],
    progress: 0,
  },
  {
    id: 'module-6',
    title: 'AI Productivity Tools for Career Growth',
    description:
      'Explore AI productivity tools to enhance efficiency, learning, and professional development.',
    lessons: [
      {
        id: 'l1',
        title: 'Time Management with AI',
        duration: '15:20',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l2',
        title: 'Learning & Upskilling Platforms',
        duration: '18:45',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l3',
        title: 'Task Automation for Professionals',
        duration: '22:30',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l4',
        title: 'Career Planning with AI Insights',
        duration: '16:50',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
      {
        id: 'l5',
        title: 'Future-Proofing Your Career',
        duration: '20:10',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        completed: false,
      },
    ],
    pdfs: [
      { id: 'p1', title: 'Top 50 AI Tools for Professionals', url: '#' },
      { id: 'p2', title: 'Career Development Roadmap', url: '#' },
    ],
    progress: 0,
  },
];
