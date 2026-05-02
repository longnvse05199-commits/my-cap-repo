// ============================================================
// FILE: srv/employee-service.js
// MỤC ĐÍCH: Implement business logic cho EmployeeService
// Đây là nơi xử lý mọi sự kiện: CRUD, custom actions, hooks
// ============================================================

// CAP cung cấp ApplicationService — base class cho tất cả service handlers
const cds = require('@sap/cds');

// ============================================================
// MODULE EXPORT: CAP tự load file này khi khởi động service
// ============================================================
module.exports = class EmployeeService extends cds.ApplicationService {

  // init() là nơi đăng ký tất cả event handlers
  async init() {

    // Lấy tham chiếu đến các entity trong schema
    const { Employees, LeaveRequests } = this.entities;

    // ==========================================================
    // HOOK: Before CREATE hoặc UPDATE Employee
    // Tự động tính lại salary mỗi khi tạo mới hoặc cập nhật nhân viên
    // ==========================================================
    this.before(['CREATE', 'UPDATE'], Employees, async (req) => {
      const data = req.data;

      // Chỉ tính salary nếu có đủ thông tin cần thiết
      if (data.role_ID || data.hireDate || data.performanceRating !== undefined) {

        // Lấy dữ liệu hiện tại nếu là UPDATE (để merge với data mới)
        let currentEmployee = {};
        if (req.event === 'UPDATE' && req.params?.[0]?.ID) {
          currentEmployee = await SELECT.one.from(Employees)
            .where({ ID: req.params[0].ID })
            .columns('role_ID', 'hireDate', 'performanceRating');
        }

        // Merge: ưu tiên data mới, fallback sang data hiện tại
        const roleId      = data.role_ID          ?? currentEmployee.role_ID;
        const hireDate    = data.hireDate          ?? currentEmployee.hireDate;
        const perfRating  = data.performanceRating ?? currentEmployee.performanceRating ?? 0;

        // Tính lương nếu có đủ thông tin
        if (roleId && hireDate) {
          const salary = await _calculateSalaryValue(roleId, hireDate, perfRating);
          data.salary = salary; // Gán salary vào request data → sẽ được lưu vào DB
        }
      }
    });

    // ==========================================================
    // ACTION HANDLER: calculateSalary
    // Tính lương thủ công và UPDATE trực tiếp vào DB
    // ==========================================================
    this.on('calculateSalary', async (req) => {
      const { employeeId } = req.data;

      // Lấy thông tin nhân viên từ DB
      const employee = await SELECT.one.from(Employees)
        .where({ ID: employeeId })
        .columns('ID', 'role_ID', 'hireDate', 'performanceRating');

      // Kiểm tra nhân viên tồn tại
      if (!employee) {
        return req.error(404, `Không tìm thấy nhân viên với ID: ${employeeId}`);
      }

      // Kiểm tra nhân viên có đủ dữ liệu để tính
      if (!employee.role_ID || !employee.hireDate) {
        return req.error(400, 'Nhân viên chưa có role hoặc ngày vào làm để tính lương.');
      }

      // Tính lương theo công thức
      const salary = await _calculateSalaryValue(
        employee.role_ID,
        employee.hireDate,
        employee.performanceRating ?? 0
      );

      // Lưu lương mới vào DB
      await UPDATE(Employees).set({ salary }).where({ ID: employeeId });

      // Trả về kết quả cho frontend
      return {
        employeeId,
        salary,
        message: `Đã tính lương thành công: $${salary.toLocaleString()}`
      };
    });

    // ==========================================================
    // ACTION HANDLER: generateSampleData
    // Xóa dữ liệu cũ và tạo dữ liệu mẫu realistic
    // ==========================================================
    this.on('generateSampleData', async (req) => {
      const { Roles, Departments } = this.entities;

      // --- Bước 1: Xóa toàn bộ dữ liệu cũ (thứ tự quan trọng vì FK) ---
      await DELETE.from(LeaveRequests); // Phải xóa LeaveRequests trước (FK → Employees)
      await DELETE.from(Employees);
      await DELETE.from(Roles);
      await DELETE.from(Departments);

      // --- Bước 2: Tạo Roles mẫu ---
      const roles = [
        { ID: '11111111-1111-1111-1111-111111111111', name: 'Developer', baseSalary: 50000, allowance: 2000 },
        { ID: '22222222-2222-2222-2222-222222222222', name: 'Manager',   baseSalary: 70000, allowance: 5000 },
        { ID: '33333333-3333-3333-3333-333333333333', name: 'Analyst',   baseSalary: 40000, allowance: 1500 },
      ];
      await INSERT.into(Roles).entries(roles);

      // --- Bước 3: Tạo Departments mẫu ---
      const departments = [
        { ID: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'IT' },
        { ID: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'HR' },
      ];
      await INSERT.into(Departments).entries(departments);

      // --- Bước 4: Tạo Employees mẫu với UUID hợp lệ ---
      const employees = [
        {
          ID: 'a1000001-0000-0000-0000-000000000001',
          firstName: 'Alice', lastName: 'Nguyen',
          dateOfBirth: '1990-03-15', gender: 'Female',
          email: 'alice.nguyen@company.com',
          hireDate: '2020-01-10',
          performanceRating: 5,
          role_ID: '11111111-1111-1111-1111-111111111111',
          department_ID: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          salary: 59500
        },
        {
          ID: 'b2000002-0000-0000-0000-000000000002',
          firstName: 'Bob', lastName: 'Tran',
          dateOfBirth: '1985-07-22', gender: 'Male',
          email: 'bob.tran@company.com',
          hireDate: '2018-06-01',
          performanceRating: 4,
          role_ID: '22222222-2222-2222-2222-222222222222',
          department_ID: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          salary: 84000
        },
        {
          ID: 'c3000003-0000-0000-0000-000000000003',
          firstName: 'Carol', lastName: 'Le',
          dateOfBirth: '1995-11-30', gender: 'Female',
          email: 'carol.le@company.com',
          hireDate: '2022-09-05',
          performanceRating: 3,
          role_ID: '33333333-3333-3333-3333-333333333333',
          department_ID: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          salary: 46000
        },
        {
          ID: 'd4000004-0000-0000-0000-000000000004',
          firstName: 'David', lastName: 'Pham',
          dateOfBirth: '1988-05-10', gender: 'Male',
          email: 'david.pham@company.com',
          hireDate: '2019-03-20',
          performanceRating: 4,
          role_ID: '11111111-1111-1111-1111-111111111111',
          department_ID: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          salary: 60000
        },
        {
          ID: 'e5000005-0000-0000-0000-000000000005',
          firstName: 'Eva', lastName: 'Hoang',
          dateOfBirth: '1993-08-18', gender: 'Female',
          email: 'eva.hoang@company.com',
          hireDate: '2021-11-15',
          performanceRating: 2,
          role_ID: '33333333-3333-3333-3333-333333333333',
          department_ID: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          salary: 46500
        },
      ];
      await INSERT.into(Employees).entries(employees);

      // --- Bước 5: Tạo Leave Requests mẫu ---
      const leaveRequests = [
        {
          ID: 'f1000001-0000-0000-0000-000000000001',
          employee_ID: 'a1000001-0000-0000-0000-000000000001',
          startDate: '2025-07-01', endDate: '2025-07-05',
          reason: 'Nghỉ phép hàng năm', status: 'Approved'
        },
        {
          ID: 'f2000002-0000-0000-0000-000000000002',
          employee_ID: 'b2000002-0000-0000-0000-000000000002',
          startDate: '2025-08-10', endDate: '2025-08-12',
          reason: 'Công việc gia đình', status: 'Pending'
        },
        {
          ID: 'f3000003-0000-0000-0000-000000000003',
          employee_ID: 'c3000003-0000-0000-0000-000000000003',
          startDate: '2025-06-20', endDate: '2025-06-25',
          reason: 'Khám sức khỏe định kỳ', status: 'Rejected'
        },
        {
          ID: 'f4000004-0000-0000-0000-000000000004',
          employee_ID: 'd4000004-0000-0000-0000-000000000004',
          startDate: '2025-09-01', endDate: '2025-09-03',
          reason: 'Đám cưới người thân', status: 'Pending'
        },
        {
          ID: 'f5000005-0000-0000-0000-000000000005',
          employee_ID: 'e5000005-0000-0000-0000-000000000005',
          startDate: '2025-07-15', endDate: '2025-07-16',
          reason: 'Việc cá nhân', status: 'Approved'
        },
        {
          ID: 'f6000006-0000-0000-0000-000000000006',
          employee_ID: 'a1000001-0000-0000-0000-000000000001',
          startDate: '2025-10-01', endDate: '2025-10-10',
          reason: 'Du lịch gia đình', status: 'Pending'
        },
      ];
      await INSERT.into(LeaveRequests).entries(leaveRequests);

      // Trả về kết quả thành công
      return {
        message: '✅ Đã tạo dữ liệu mẫu thành công!',
        employeeCount: employees.length
      };
    });

    // ==========================================================
    // ACTION HANDLER: approveLeaveRequest
    // ==========================================================
    this.on('approveLeaveRequest', async (req) => {
      const { leaveRequestId } = req.data;

      // Lấy leave request từ DB
      const lr = await SELECT.one.from(LeaveRequests).where({ ID: leaveRequestId });

      if (!lr) return req.error(404, 'Không tìm thấy đơn nghỉ phép.');
      if (lr.status !== 'Pending') {
        return req.error(400, `Không thể duyệt đơn ở trạng thái "${lr.status}".`);
      }

      // Cập nhật status → Approved
      await UPDATE(LeaveRequests).set({ status: 'Approved' }).where({ ID: leaveRequestId });

      return { success: true, message: '✅ Đã duyệt đơn nghỉ phép.' };
    });

    // ==========================================================
    // ACTION HANDLER: rejectLeaveRequest
    // ==========================================================
    this.on('rejectLeaveRequest', async (req) => {
      const { leaveRequestId } = req.data;

      const lr = await SELECT.one.from(LeaveRequests).where({ ID: leaveRequestId });

      if (!lr) return req.error(404, 'Không tìm thấy đơn nghỉ phép.');
      if (lr.status !== 'Pending') {
        return req.error(400, `Không thể từ chối đơn ở trạng thái "${lr.status}".`);
      }

      // Cập nhật status → Rejected
      await UPDATE(LeaveRequests).set({ status: 'Rejected' }).where({ ID: leaveRequestId });

      return { success: true, message: '❌ Đã từ chối đơn nghỉ phép.' };
    });

    // ==========================================================
    // HOOK: Nhân viên mới → status = Pending (chờ phê duyệt)
    // ==========================================================
    this.before('CREATE', Employees, (req) => {
      req.data.status = 'Pending';
    });

    // ==========================================================
    // ACTION HANDLER: approveEmployee
    // ==========================================================
    this.on('approveEmployee', async (req) => {
      const { employeeId } = req.data;
      const emp = await SELECT.one.from(Employees).where({ ID: employeeId });
      if (!emp) return req.error(404, 'Không tìm thấy nhân viên.');
      if (emp.status !== 'Pending')
        return req.error(400, `Nhân viên đang ở trạng thái "${emp.status}", không thể phê duyệt.`);
      await UPDATE(Employees).set({ status: 'Active' }).where({ ID: employeeId });
      return { success: true, message: '✅ Nhân viên đã được phê duyệt.' };
    });

    // ==========================================================
    // ACTION HANDLER: rejectEmployee
    // ==========================================================
    this.on('rejectEmployee', async (req) => {
      const { employeeId } = req.data;
      const emp = await SELECT.one.from(Employees).where({ ID: employeeId });
      if (!emp) return req.error(404, 'Không tìm thấy nhân viên.');
      if (emp.status !== 'Pending')
        return req.error(400, `Nhân viên đang ở trạng thái "${emp.status}", không thể từ chối.`);
      await UPDATE(Employees).set({ status: 'Rejected' }).where({ ID: employeeId });
      return { success: true, message: '❌ Đã từ chối nhân viên.' };
    });

    return super.init();
  }
};

// ============================================================
// HELPER FUNCTION: _calculateSalaryValue
// Tính lương theo công thức:
//   salary = baseSalary + allowance + (yearsOfService × 1000) + (performanceRating × 500)
// ============================================================
async function _calculateSalaryValue(roleId, hireDate, performanceRating) {
  // Lấy thông tin Role từ DB để có baseSalary và allowance
  const role = await SELECT.one.from('com.company.employeemanagement.Roles')
    .where({ ID: roleId })
    .columns('baseSalary', 'allowance');

  if (!role) return 0; // Role không tồn tại → trả về 0

  // Tính số năm làm việc (floor = làm tròn xuống)
  const hire = new Date(hireDate);
  const now  = new Date();
  const yearsOfService = Math.floor((now - hire) / (365.25 * 24 * 60 * 60 * 1000));

  // Áp dụng công thức
  const salary = (role.baseSalary  || 0)
               + (role.allowance   || 0)
               + (yearsOfService   * 1000)
               + (performanceRating * 500);

  return salary;
}
