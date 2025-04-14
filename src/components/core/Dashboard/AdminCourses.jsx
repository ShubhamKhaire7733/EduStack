import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getAllCourses, deleteCourse } from "../../../services/operations/courseAPI"
import { VscEdit } from "react-icons/vsc"
import { RiDeleteBin6Line } from "react-icons/ri"
import { useNavigate } from "react-router-dom"
import ConfirmationModal from "../../common/ConfirmationModal"
import { toast } from "react-hot-toast"

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirmationModal, setConfirmationModal] = useState(null)
  const { token } = useSelector((state) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      const result = await getAllCourses(token)
      if (result) {
        setCourses(result)
      }
      setLoading(false)
    }
    fetchCourses()
  }, [token])

  const handleCourseDelete = async (courseId) => {
    try {
      setLoading(true)
      await deleteCourse(courseId, token)
      toast.success("Course deleted successfully")
      const result = await getAllCourses(token)
      if (result) {
        setCourses(result)
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course")
    } finally {
      setConfirmationModal(null)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-14 text-3xl font-medium text-richblack-5">Manage Courses</h1>
      {courses.length === 0 ? (
        <p className="text-center text-richblack-100">No courses found</p>
      ) : (
        <div className="my-8 text-richblack-5">
          <div className="flex min-w-full items-center justify-between rounded-t-lg bg-richblack-500 px-5 py-3">
            <p className="text-lg font-medium">Course Name</p>
            <p className="text-lg font-medium">Instructor</p>
            <p className="text-lg font-medium">Status</p>
            <p className="text-lg font-medium">Actions</p>
          </div>
          {courses.map((course) => (
            <div
              key={course._id}
              className="flex min-w-full items-center justify-between border-b border-richblack-500 px-5 py-3"
            >
              <p className="text-richblack-200">{course.courseName}</p>
              <p className="text-richblack-200">{course.instructor?.firstName} {course.instructor?.lastName}</p>
              <p className="text-richblack-200">{course.status}</p>
              <div className="flex items-center gap-x-4">
                <button
                  onClick={() => navigate(`/dashboard/edit-course/${course._id}`)}
                  className="flex items-center gap-x-2 rounded-md bg-richblack-700 px-3 py-2 text-richblack-100 hover:bg-richblack-600"
                >
                  <VscEdit className="text-lg" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setConfirmationModal({
                      text1: "Do you want to delete this course?",
                      text2: "All the data related to this course will be deleted",
                      btn1Text: !loading ? "Delete" : "Loading...",
                      btn2Text: "Cancel",
                      btn1Handler: !loading ? () => handleCourseDelete(course._id) : () => {},
                      btn2Handler: !loading ? () => setConfirmationModal(null) : () => {},
                    })
                  }}
                  className="flex items-center gap-x-2 rounded-md bg-richblack-700 px-3 py-2 text-richblack-100 hover:bg-richblack-600"
                >
                  <RiDeleteBin6Line className="text-lg" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  )
} 