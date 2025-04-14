import { apiConnector } from "../apiconnector"
import { courseEndpoints } from "../apis"

const { GET_ALL_COURSE_API, DELETE_COURSE_API } = courseEndpoints

export async function getAllCourses(token) {
  try {
    const response = await apiConnector("GET", GET_ALL_COURSE_API, null, {
      Authorization: `Bearer ${token}`,
    })
    return response.data.data
  } catch (error) {
    console.log("GET_ALL_COURSES_API ERROR............", error)
    throw error
  }
}

export async function deleteCourse(courseId, token) {
  try {
    const response = await apiConnector("DELETE", DELETE_COURSE_API, { courseId }, {
      Authorization: `Bearer ${token}`,
    })
    return response.data
  } catch (error) {
    console.log("DELETE_COURSE_API ERROR............", error)
    throw error
  }
}