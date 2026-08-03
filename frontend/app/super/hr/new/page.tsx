import { API } from "@/app/utils/api";
import AddEmployeeForm from "./AddEmployeeForm";

export default async function NewEmployeePage() {
  // جلب قائمة الأقسام من الـ Backend
  const { data: departments, error } = await API.GET("/hr/departments/");

  if (error) {
    return (
      <div dir="rtl" className="p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        فشل في تحميل بيانات الأقسام من الخادم.
      </div>
    );
  }

  // في حال نجاح الجلب، نقوم بتمرير البيانات للمكون التفاعلي
  return <AddEmployeeForm departments={departments || []} />;
}