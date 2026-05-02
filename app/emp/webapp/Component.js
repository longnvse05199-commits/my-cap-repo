// ============================================================
// FILE: app/webapp/Component.js
// MỤC ĐÍCH: Root component của SAPUI5 app
// Đây là entry point — SAPUI5 load file này đầu tiên
// ============================================================

sap.ui.define([
  "sap/ui/core/UIComponent",   // Base class cho mọi SAPUI5 component
  "sap/ui/Device",              // Detect thiết bị (mobile/desktop)
  "sap/ui/model/json/JSONModel" // Model để lưu trạng thái UI (isAdmin, userEmail)
], function(UIComponent, Device, JSONModel) {
  "use strict";

  return UIComponent.extend("com.company.employeemanagement.Component", {

    // Metadata: khai báo manifest.json là nguồn cấu hình
    metadata: {
      manifest: "json"  // Load cấu hình từ manifest.json
    },

    // init() chạy một lần duy nhất khi app khởi động
    init: function() {
      // Gọi init() của UIComponent cha (bắt buộc, setup routing, models, ...)
      UIComponent.prototype.init.apply(this, arguments);

      // Khởi tạo router (định nghĩa trong manifest.json → routing)
      this.getRouter().initialize();
    }
  });
});
