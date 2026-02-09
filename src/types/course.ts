export interface LessonDto {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
}

export interface PdfDto {
  id: string;
  title: string;
  url: string;
}

export interface CourseModuleDto {
  id: string;
  title: string;
  description: string;
  lessons: LessonDto[];
  pdfs: PdfDto[];
  progress: number;
}
