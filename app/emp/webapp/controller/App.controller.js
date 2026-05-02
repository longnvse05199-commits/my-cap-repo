// ============================================================
// FILE: app/webapp/controller/App.controller.js
// MỤC ĐÍCH: Controller cho App.view.xml (shell container)
// Nhiệm vụ chính: Load thông tin user từ XSUAA,
//   xác định role Admin hay Viewer, lưu vào appView model
// ============================================================

sap.ui.define([
  "sap/ui/core/mvc/Controller",    // Base class cho mọi controller
  "sap/ui/model/json/JSONModel",   // Model dạng JSON (lưu state UI)
  "sap/m/MessageToast"             // Toast notification nhỏ ở góc màn hình
], function(Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("com.company.employeemanagement.controller.App", {

    // onInit: chạy ngay khi view được khởi tạo
    onInit: function() {
      // Lấy OData model (được tạo tự động từ manifest.json → dataSources)
      var oModel = this.getView().getModel();

      // Lấy appView model (dùng để lưu isAdmin, userEmail, ...)
      // Model này được tạo trong manifest.json → models → appView
      var oAppModel = this.getOwnerComponent().getModel("appView");

      // Gọi API XSUAA để lấy thông tin user đang đăng nhập
      // /userapi/currentUser là endpoint chuẩn của SAP XSUAA trên CF
      fetch("/userapi/currentUser")
        .then(function(response) {
          return response.json();
        })
        .then(function(userInfo) {
          // userInfo.scopes chứa danh sách scope của user, VD:
          // ["employee-management.Admin", "openid", "employee-management.Viewer"]
          var scopes = userInfo.scopes || [];
          var isAdmin = scopes.some(function(scope) {
            // Kiểm tra xem user có scope ".Admin" không
            return scope.indexOf(".Admin") !== -1;
          });

          // Lấy email user (dùng cho Avatar)
          var email = userInfo.email || userInfo.name || "User";

          // Lấy 1-2 chữ cái đầu cho Avatar (VD: "Alice Nguyen" → "AN")
          var nameParts = email.split(/[@.\s]/);
          var initials  = nameParts
            .filter(function(p) { return p.length > 0; })
            .slice(0, 2)
            .map(function(p) { return p[0].toUpperCase(); })
            .join("");

          // Lưu vào appView model → các view con sẽ đọc từ đây
          oAppModel.setData({
            isAdmin:      isAdmin,
            userEmail:    email,
            userInitials: initials || "U"
          });

        })
        .catch(function(error) {
          // Nếu lỗi (VD: chạy local không có XSUAA),
          // mặc định isAdmin=true để dễ test
          console.warn("Không thể lấy thông tin user (local dev mode):", error);
          oAppModel.setData({
            isAdmin:      true,       // Local: admin để test đủ chức năng
            userEmail:    "alice@local",
            userInitials: "AL"
          });
        });
    },

    // onProfilePress: khi user click vào Avatar
    onProfilePress: function() {
      var oAppModel = this.getOwnerComponent().getModel("appView");
      var sRole = oAppModel.getProperty("/isAdmin") ? "Admin" : "Viewer";
      MessageToast.show("Đang đăng nhập với role: " + sRole);
    }

  });
});
