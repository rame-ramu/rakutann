import { createRouter, createWebHistory } from 'vue-router'
import StudentIdView from '../views/StudentIdView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'student-id',
      component: StudentIdView,
    },
    {
      path: '/conditions',
      name: 'conditions',
      component: () => import('../views/ConditionView.vue'),
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleView.vue'),
    },
    {
      path: '/results',
      name: 'results',
      component: () => import('../views/CourseListView.vue'),
    },
  ],
})

export default router
