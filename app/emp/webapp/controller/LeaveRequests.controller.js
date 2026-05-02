// ============================================================
// FILE: app/webapp/controller/LeaveRequests.controller.js
// MỤC ĐÍCH: Controller cho trang quản lý nghỉ phép
// Xử lý: chọn đơn, approve/reject, tạo đơn mới
// ============================================================

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/m/Dialog",         // Popup dialog để tạo đơn mới
  "sap/m/Input",
  "sap/m/DatePicker",
  "sap/m/Label",
  "sap/m/VBox",           // Vertical Box layout
  "sap/m/Button"
], function(Controller, JSONModel, MessageToast, MessageBox,
            Dialog, Input, DatePicker, Label, VBox, Button) {
  "use strict";

  return Controller.extend("com.company.employeemanagement.controller.LeaveRequests", {

    onInit: function() {
      // Model cục bộ cho view này
      var oLeaveModel = new JSONModel({
        selectedPendingId: null  // ID của đơn Pending đang được chọn
      });
      this.getView().setModel(oLeaveModel, "leaveView");

      // Đăng ký route handler
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("LeaveRequests").attachPatternMatched(function() {
        // Reset selection khi vào trang
        oLeaveModel.setProperty("/selectedPendingId", null);
      }, this);
    },

    // ==========================================================
    // APPROVE: Duyệt đơn nghỉ phép (inline button trong row)
    // ==========================================================
    onApprove: function(oEvent) {
      var oContext = oEvent.getSource().getBindingContext();
      var sId      = oContext.getProperty("ID");
      var sName    = oContext.getProperty("employee/firstName") + " " + oContext.getProperty("employee/lastName");

      MessageBox.confirm("Xác nhận DUYỆT đơn của " + sName + "?", {
        onClose: function(sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._callLeaveAction("approveLeaveRequest", sId, "✅ Đã duyệt đơn nghỉ phép!");
        }.bind(this)
      });
    },

    // ==========================================================
    // REJECT: Từ chối đơn nghỉ phép (inline button trong row)
    // ==========================================================
    onReject: function(oEvent) {
      var oContext = oEvent.getSource().getBindingContext();
      var sId      = oContext.getProperty("ID");
      var sName    = oContext.getProperty("employee/firstName") + " " + oContext.getProperty("employee/lastName");

      MessageBox.confirm("Xác nhận TỪ CHỐI đơn của " + sName + "?", {
        onClose: function(sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this._callLeaveAction("rejectLeaveRequest", sId, "❌ Đã từ chối đơn nghỉ phép.");
        }.bind(this)
      });
    },

    // Helper: gọi OData action approve hoặc reject
    _callLeaveAction: function(sActionName, sLeaveId, sSuccessMessage) {
      var oModel  = this.getView().getModel();
      var oAction = oModel.bindContext("/" + sActionName + "(...)");
      oAction.setParameter("leaveRequestId", sLeaveId);

      oAction.execute().then(function() {
        MessageToast.show(sSuccessMessage);
        // Reset selection và refresh list
        this.getView().getModel("leaveView").setProperty("/selectedPendingId", null);
        oModel.refresh();
      }.bind(this)).catch(function(oError) {
        MessageBox.error("❌ Lỗi: " + (oError.message || "Không thể thực hiện."));
      });
    },

    // ==========================================================
    // CREATE DIALOG: Mở dialog tạo đơn nghỉ phép mới
    // ==========================================================
    onOpenCreateDialog: function() {
      // Tạo dialog động (không dùng Fragment để đơn giản)
      if (!this._oCreateDialog) {
        var oView = this.getView();

        this._oCreateDialog = new Dialog({
          title: "Tạo Đơn Nghỉ Phép",
          content: [
            new VBox({
              items: [
                new Label({ text: "Ngày Bắt Đầu", required: true }),
                new DatePicker({
                  id: "dlgStartDate",
                  displayFormat: "dd/MM/yyyy",
                  valueFormat: "yyyy-MM-dd",
                  placeholder: "dd/MM/yyyy"
                }),
                new Label({ text: "Ngày Kết Thúc", required: true }),
                new DatePicker({
                  id: "dlgEndDate",
                  displayFormat: "dd/MM/yyyy",
                  valueFormat: "yyyy-MM-dd",
                  placeholder: "dd/MM/yyyy"
                }),
                new Label({ text: "Lý Do" }),
                new Input({ id: "dlgReason", placeholder: "Nhập lý do nghỉ..." })
              ]
            }).addStyleClass("sapUiSmallMargin")
          ],
          beginButton: new Button({
            text: "Tạo Đơn",
            type: "Accept",
            press: this._onCreateLeaveSubmit.bind(this)
          }),
          endButton: new Button({
            text: "Hủy",
            press: function() { this._oCreateDialog.close(); }.bind(this)
          })
        });

        // Gắn dialog vào view (để quản lý lifecycle)
        oView.addDependent(this._oCreateDialog);
      }

      this._oCreateDialog.open();
    },

    // Submit tạo đơn mới
    _onCreateLeaveSubmit: function() {
      var sStartDate = sap.ui.getCore().byId("dlgStartDate").getValue();
      var sEndDate   = sap.ui.getCore().byId("dlgEndDate").getValue();
      var sReason    = sap.ui.getCore().byId("dlgReason").getValue().trim();

      // Validation
      if (!sStartDate || !sEndDate) {
        MessageToast.show("Vui lòng chọn ngày bắt đầu và kết thúc.");
        return;
      }
      if (sStartDate > sEndDate) {
        MessageToast.show("Ngày bắt đầu phải trước ngày kết thúc.");
        return;
      }

      // Tạo leave request mới qua OData POST
      var oModel       = this.getView().getModel();
      var oListBinding = oModel.bindList("/LeaveRequests");
      oListBinding.create({
        startDate: sStartDate,
        endDate:   sEndDate,
        reason:    sReason,
        status:    "Pending"
        // employee_ID: cần thêm nếu app có login user → lấy từ XSUAA
      });

      oModel.submitBatch("$auto").then(function() {
        MessageToast.show("✅ Đã tạo đơn nghỉ phép thành công!");
        this._oCreateDialog.close();
        oModel.refresh();
      }.bind(this)).catch(function(oError) {
        MessageBox.error("❌ Lỗi: " + (oError.message || "Không thể tạo đơn."));
      });
    },

    // ==========================================================
    // FORMATTERS: Chuyển đổi data để hiển thị
    // ==========================================================

    // Format ngày "YYYY-MM-DD" → "DD/MM/YYYY → DD/MM/YYYY"
    // Dùng string split thay new Date() để tránh lỗi timezone NaN
    formatDateRange: function(sStart, sEnd) {
      if (!sStart || !sEnd) return "—";
      var fmt = function(s) {
        var p = s.split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : s;
      };
      return fmt(sStart) + " → " + fmt(sEnd);
    },

    // ObjectStatus state theo status
    formatStatusState: function(sStatus) {
      switch(sStatus) {
        case "Approved": return "Success";
        case "Rejected": return "Error";
        case "Pending":  return "Warning";
        default:         return "None";
      }
    },

    // ColumnListItem highlight màu theo status
    formatStatusHighlight: function(sStatus) {
      switch(sStatus) {
        case "Approved": return "Success";   // Viền xanh lá
        case "Rejected": return "Error";     // Viền đỏ
        case "Pending":  return "Warning";   // Viền cam
        default:         return "None";
      }
    },

    onNavBack: function() {
      this.getOwnerComponent().getRouter().navTo("EmployeeList");
    },

    onNavToLaunchpad: function() {
      window.location.href = "../../../launchpad/index.html";
    }

  });
});
