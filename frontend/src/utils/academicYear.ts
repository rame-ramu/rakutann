export const getCurrentAcademicYear = (date = new Date()) => {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
}
