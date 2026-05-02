// ============================================================
// FILE: app/webapp/controller/EmployeeList.controller.js
// MỤC ĐÍCH: Controller cho trang danh sách nhân viên
// Xử lý: search, navigate, delete, generateSampleData
// ============================================================

sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",           // Dùng để filter OData query
  "sap/ui/model/FilterOperator",   // Toán tử filter: Contains, EQ, GE, ...
  "sap/m/MessageToast",
  "sap/m/MessageBox"               // Dialog confirm (OK/Cancel)
], function(Controller, Filter, FilterOperator, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.company.employeemanagement.controller.EmployeeList", {

    onInit: function() {
      // Không cần setup thêm — model đã được bind trong manifest.json
    },

    // ==========================================================
    // SEARCH: Lọc danh sách theo tên/email
    // Trigger: SearchField.search và SearchField.liveChange
    // ==========================================================
    onSearch: function(oEvent) {
      // Lấy text user vừa nhập
      var sQuery = oEvent.getSource().getValue().trim();

      // Lấy binding của Table (để thêm filter vào OData request)
      var oBinding = this.byId("employeeTable").getBinding("items");

      if (sQuery) {
        // Tạo 2 filter: theo firstName VÀ lastName (OR logic)
        var oFilterFirst = new Filter("firstName", FilterOperator.Contains, sQuery);
        var oFilterLast  = new Filter("lastName",  FilterOperator.Contains, sQuery);
        var oFilterEmail = new Filter("email",      FilterOperator.Contains, sQuery);

        // Combine với AND=false → OR: tìm trong firstName HOẶC lastName HOẶC email
        var oCombinedFilter = new Filter({
          filters: [oFilterFirst, oFilterLast, oFilterEmail],
          and: false
        });
        oBinding.filter(oCombinedFilter);
      } else {
        // Xóa filter → hiện tất cả
        oBinding.filter([]);
      }
    },

    // ==========================================================
    // NAVIGATE: Click vào row → sang EmployeeDetail
    // ==========================================================
    onNavToDetail: function(oEvent) {
      // Lấy binding context của row vừa click
      var oItem    = oEvent.getSource();
      var oContext = oItem.getBindingContext();
      var sId      = oContext.getProperty("ID");

      // Navigate theo route "EmployeeDetail" với parameter employeeId
      this.getOwnerComponent().getRouter().navTo("EmployeeDetail", {
        employeeId: sId
      });
    },

    // ==========================================================
    // ADD: Tạo nhân viên mới
    // ==========================================================
    onAddEmployee: function() {
      // Navigate sang EmployeeDetail với "new" để tạo mới
      this.getOwnerComponent().getRouter().navTo("EmployeeDetail", {
        employeeId: "new"
      });
    },

    // ==========================================================
    // DELETE: Xóa nhân viên (có confirm dialog)
    // ==========================================================
    onDeleteEmployee: function(oEvent) {
      // Lấy context của button delete trong row
      var oButton  = oEvent.getSource();
      var oContext = oButton.getBindingContext();
      var sName    = oContext.getProperty("firstName") + " " + oContext.getProperty("lastName");

      // Hiện confirm dialog trước khi xóa
      MessageBox.confirm(
        "Bạn có chắc muốn xóa nhân viên: " + sName + "?",
        {
          title: "Xác Nhận Xóa",
          onClose: function(sAction) {
            if (sAction === MessageBox.Action.OK) {
              // Thực hiện xóa qua OData DELETE
              oContext.delete("$auto").then(function() {
                MessageToast.show("✅ Đã xóa nhân viên: " + sName);
              }).catch(function(oError) {
                MessageBox.error("❌ Lỗi khi xóa: " + oError.message);
              });
            }
          }
        }
      );
    },

    // ==========================================================
    // GENERATE SAMPLE DATA: Gọi OData Action generateSampleData
    // ==========================================================
    onGenerateSampleData: function() {
      var oModel = this.getView().getModel(); // OData model

      // Hiện confirm dialog (vì sẽ XÓA toàn bộ data cũ)
      MessageBox.confirm(
        "⚠️ Thao tác này sẽ XÓA tất cả dữ liệu hiện tại và tạo lại dữ liệu mẫu.\n\nBạn có chắc không?",
        {
          title: "Tạo Dữ Liệu Mẫu",
          emphasizedAction: MessageBox.Action.OK,
          onClose: function(sAction) {
            if (sAction !== MessageBox.Action.OK) return;

            // Gọi OData Unbound Action: POST /employee-service/generateSampleData
            var oAction = oModel.bindContext("/generateSampleData(...)");

            oAction.execute().then(function() {
              // Lấy kết quả trả về từ action
              var oResult = oAction.getBoundContext().getObject();
              MessageToast.show(oResult.message || "✅ Đã tạo dữ liệu mẫu!");

              // Refresh Table để hiển thị data mới
              oModel.refresh();
            }).catch(function(oError) {
              MessageBox.error("❌ Lỗi: " + (oError.message || "Không thể tạo dữ liệu mẫu."));
            });
          }.bind(this)
        }
      );
    },

    onNavToLeaveRequests: function() {
      this.getOwnerComponent().getRouter().navTo("LeaveRequests");
    },

    onNavToLaunchpad: function() {
      window.location.href = "../../../launchpad/index.html";
    }

  });
});
