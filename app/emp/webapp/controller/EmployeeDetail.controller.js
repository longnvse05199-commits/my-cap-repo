// ============================================================
// FILE: app/webapp/controller/EmployeeDetail.controller.js
// MỤC ĐÍCH: Controller cho trang chi tiết nhân viên
// Xử lý: load data, create/edit, calculateSalary, validation
// ============================================================

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function(Controller, JSONModel, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.company.employeemanagement.controller.EmployeeDetail", {

    onInit: function() {
      // Tạo local model cho view này (lưu pageTitle, isNew flag)
      var oDetailModel = new JSONModel({
        pageTitle: "Chi Tiết Nhân Viên",
        isNew: false  // true khi tạo mới, false khi edit
      });
      this.getView().setModel(oDetailModel, "detailView");

      // Đăng ký handler khi route "EmployeeDetail" được activate
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("EmployeeDetail").attachPatternMatched(this._onRouteMatched, this);
    },

    // ==========================================================
    // ROUTE HANDLER: Chạy mỗi khi navigate đến trang này
    // ==========================================================
    _onRouteMatched: function(oEvent) {
      var sEmployeeId = oEvent.getParameter("arguments").employeeId;
      var oDetailModel = this.getView().getModel("detailView");

      if (sEmployeeId === "new") {
        // --- Tạo mới ---
        oDetailModel.setProperty("/pageTitle", "Thêm Nhân Viên Mới");
        oDetailModel.setProperty("/isNew", true);

        // Tạo binding context mới (chưa có trong DB)
        var oModel = this.getView().getModel();
        var oListBinding = oModel.bindList("/Employees");
        var oNewContext  = oListBinding.create({
          firstName: "",
          lastName: "",
          email: "",
          performanceRating: 3,  // Mặc định 3 sao
          status: "Active"
        });
        this.getView().setBindingContext(oNewContext);

      } else {
        // --- Edit existing ---
        oDetailModel.setProperty("/pageTitle", "Chi Tiết Nhân Viên");
        oDetailModel.setProperty("/isNew", false);

        // Bind view với entity cụ thể từ OData
        // $expand: load luôn role và department object (để ComboBox chọn đúng)
        this.getView().bindElement({
          path: "/Employees(" + sEmployeeId + ")",
          parameters: {
            $expand: "role,department"
          },
          events: {
            dataReceived: function(oEvent) {
              // OData V4: chỉ navigate back khi có lỗi thực sự
              // (data === undefined không có nghĩa là lỗi trong V4)
              if (oEvent.getParameter("error")) {
                MessageBox.error("Không tìm thấy nhân viên.");
                this._navBack();
              }
            }.bind(this)
          }
        });
      }
    },

    // ==========================================================
    // CALCULATE SALARY: Gọi OData action calculateSalary
    // ==========================================================
    onCalculateSalary: function() {
      var oModel      = this.getView().getModel();
      var oContext    = this.getView().getBindingContext();
      var sEmployeeId = oContext.getProperty("ID");

      // Gọi Unbound Action: POST /employee-service/calculateSalary
      // bindContext với "(...)": notation của CAP OData V4 cho action call
      var oAction = oModel.bindContext("/calculateSalary(...)");
      oAction.setParameter("employeeId", sEmployeeId); // Truyền parameter

      // Hiện loading indicator
      this.getView().setBusy(true);

      oAction.execute().then(function() {
        // Lấy kết quả từ action (server trả về object {employeeId, salary, message})
        var oResult = oAction.getBoundContext().getObject();

        // Cập nhật salary ngay vào binding context → field Lương (USD) hiển thị luôn
        oContext.setProperty("salary", oResult.salary);

        MessageToast.show(oResult.message || "✅ Đã tính lương thành công!");
        this.getView().setBusy(false);
      }.bind(this)).catch(function(oError) {
        MessageBox.error("❌ Lỗi tính lương: " + (oError.message || "Unknown error"));
        this.getView().setBusy(false);
      }.bind(this));
    },

    // ==========================================================
    // SAVE: Lưu nhân viên (CREATE hoặc UPDATE)
    // ==========================================================
    onSave: function() {
      var oContext    = this.getView().getBindingContext();
      var oDetailModel = this.getView().getModel("detailView");
      var bIsNew      = oDetailModel.getProperty("/isNew");

      // Lấy giá trị từ các form fields
      var sFirstName = this.byId("firstName").getValue().trim();
      var sLastName  = this.byId("lastName").getValue().trim();
      var sEmail     = this.byId("email").getValue().trim();

      // --- Validation ---
      if (!sFirstName || !sLastName || !sEmail) {
        MessageBox.warning("Vui lòng điền đầy đủ Họ, Tên và Email.");
        return;
      }
      if (!sEmail.includes("@")) {
        MessageBox.warning("Email không hợp lệ.");
        return;
      }

      // Cập nhật context với các giá trị mới từ form
      oContext.setProperty("firstName", sFirstName);
      oContext.setProperty("lastName",  sLastName);
      oContext.setProperty("email",     sEmail);

      // Lấy giá trị rating từ RatingIndicator
      var nRating = this.byId("performanceRating").getValue();
      oContext.setProperty("performanceRating", parseInt(nRating, 10));

      // Lấy role và department từ ComboBox
      var sRoleId  = this.byId("role").getSelectedKey();
      var sDeptId  = this.byId("department").getSelectedKey();
      if (sRoleId)  oContext.setProperty("role_ID",       sRoleId);
      if (sDeptId)  oContext.setProperty("department_ID", sDeptId);

      // Lấy ngày tháng
      var sHireDate = this.byId("hireDate").getValue();
      var sDob      = this.byId("dateOfBirth").getValue();
      if (sHireDate) oContext.setProperty("hireDate", sHireDate);
      if (sDob)      oContext.setProperty("dateOfBirth", sDob);

      // Submit: CAP tự phân biệt POST (create) hay PATCH (update)
      var oModel = this.getView().getModel();
      this.getView().setBusy(true);

      oModel.submitBatch("$auto").then(function() {
        var sMsg = bIsNew ? "✅ Đã thêm nhân viên mới!" : "✅ Đã cập nhật thành công!";
        MessageToast.show(sMsg);
        this.getView().setBusy(false);

        // Navigate về danh sách sau khi lưu
        this._navBack();
      }.bind(this)).catch(function(oError) {
        MessageBox.error("❌ Lỗi: " + (oError.message || "Không thể lưu."));
        this.getView().setBusy(false);
      }.bind(this));
    },

    // ==========================================================
    // EVENTS
    // ==========================================================

    // Khi đổi Role trong ComboBox → server sẽ tự tính lại salary khi save
    onRoleChange: function() {
      MessageToast.show("Role đã thay đổi. Nhấn 'Tính Lương' để cập nhật lương.");
    },

    // Khi đổi Rating
    onRatingChange: function() {
      MessageToast.show("Đánh giá đã thay đổi. Nhấn 'Tính Lương' để cập nhật lương.");
    },

    // Navigate về trang trước
    onNavBack: function() {
      this._navBack();
    },

    // Helper: navigate về EmployeeList
    _navBack: function() {
      // Hủy các thay đổi chưa submit (tránh dirty state)
      var oModel = this.getView().getModel();
      if (oModel.hasPendingChanges()) {
        oModel.resetChanges();
      }
      this.getOwnerComponent().getRouter().navTo("EmployeeList");
    }

  });
});
