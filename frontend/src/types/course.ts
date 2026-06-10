export interface Comment {
  id: string
  content: string
  rating: number // 1-5
  createdAt: string
}

export interface Course {
  id: string
  title: string
  professor: string
  credits: number
  description: string
  category: string
  comments: Comment[]
}
