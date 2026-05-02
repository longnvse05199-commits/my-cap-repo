namespace com.company.employeemanagement;

using { cuid, managed } from '@sap/cds/common';

entity Roles : cuid, managed {
  name       : String(100) @mandatory;
  baseSalary : Decimal(15,2);
  allowance  : Decimal(15,2);
}

entity Departments : cuid, managed {
  name : String(100) @mandatory;
}

entity Employees : cuid, managed {
  firstName         : String(100) @mandatory;
  lastName          : String(100) @mandatory;
  dateOfBirth       : Date;
  gender            : String(10);
  email             : String(255) @mandatory;
  hireDate          : Date;
  salary            : Decimal(15,2);
  performanceRating : Integer;
  status            : String(20) default 'Pending'; // Pending | Active | Rejected
  role              : Association to Roles;
  department        : Association to Departments;
  leaveRequests     : Composition of many LeaveRequests on leaveRequests.employee = $self;
}

entity LeaveRequests : cuid, managed {
  employee  : Association to Employees @mandatory;
  startDate : Date    @mandatory;
  endDate   : Date    @mandatory;
  reason    : String(500);
  status    : String(20) default 'Pending';
}
