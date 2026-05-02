using { com.company.employeemanagement as db } from '../db/emp-schema';

service EmployeeService {

  @(restrict: [
    { grant: ['READ'],                      to: ['Viewer','Admin'] },
    { grant: ['CREATE','UPDATE','DELETE'],   to: ['Admin'] }
  ])
  entity Roles        as projection on db.Roles;

  @(restrict: [
    { grant: ['READ'],                      to: ['Viewer','Admin'] },
    { grant: ['CREATE','UPDATE','DELETE'],   to: ['Admin'] }
  ])
  entity Departments  as projection on db.Departments;

  @(restrict: [
    { grant: ['READ'],                      to: ['Viewer','Admin'] },
    { grant: ['CREATE','UPDATE','DELETE'],   to: ['Admin'] }
  ])
  entity Employees    as projection on db.Employees;

  @(restrict: [
    { grant: ['READ'],                      to: ['Viewer','Admin'] },
    { grant: ['CREATE'],                    to: ['Viewer','Admin'] },
    { grant: ['UPDATE','DELETE'],           to: ['Admin'] }
  ])
  entity LeaveRequests as projection on db.LeaveRequests;

  @(requires: 'Admin')
  action calculateSalary(employeeId: UUID) returns {
    employeeId : UUID;
    salary     : Decimal(15,2);
    message    : String;
  };

  @(requires: 'Admin')
  action generateSampleData() returns {
    message      : String;
    employeeCount: Integer;
  };

  @(requires: 'Admin')
  action approveLeaveRequest(leaveRequestId: UUID) returns {
    success: Boolean;
    message: String;
  };

  @(requires: 'Admin')
  action rejectLeaveRequest(leaveRequestId: UUID) returns {
    success: Boolean;
    message: String;
  };

  @(requires: 'Admin')
  action approveEmployee(employeeId: UUID) returns {
    success: Boolean;
    message: String;
  };

  @(requires: 'Admin')
  action rejectEmployee(employeeId: UUID) returns {
    success: Boolean;
    message: String;
  };
}
