import { createRouter, createWebHistory } from 'vue-router'
import StudentIdView from '../views/StudentIdView.vue'
import { store } from '../store'

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

router.beforeEach((to) => {
  if (store.department && !store.isHumanInfoStudent && to.name !== 'student-id' && to.name !== 'conditions') {
    return { name: 'conditions' }
  }
})

export default router
